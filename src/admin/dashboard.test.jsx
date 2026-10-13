// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import DashboardSection from "./sections/DashboardSection.jsx";
import { labelTableCells } from "./tableCards.js";
import { bucketByDkDay } from "./statsLogic.js";

afterEach(cleanup);
const stats = () => ({
  total_users: 12, admin_users: 2, new_users_today: 0, total_products: 20182, total_scans: 54, search_opens: 7, scans_today: 3, total_families: 1,
  pending_submissions: 4, open_tickets: 2,
  scan_trend: bucketByDkDay([{ t: "2026-10-12T10:00:00Z" }], "t", 30, new Date("2026-10-13T10:00:00Z")),
  user_trend: bucketByDkDay([], "t", 30, new Date("2026-10-13T10:00:00Z")),
});

describe("dashboard", () => {
  it("viser nøgletal i dansk talformat med forklarende hints", () => {
    render(<DashboardSection adminStats={stats()} setSection={() => {}} />);
    expect(screen.getByText("20.182")).toBeTruthy();
    expect(screen.getByText("heraf 2 admin")).toBeTruthy();
    expect(screen.getByText("Søgninger i alt: 7")).toBeTruthy(); // søgninger er separate rækker (found_via=search), ikke en del af scanninger
  });
  it("kort med en naturlig destination åbner siden", () => {
    const setSection = vi.fn();
    render(<DashboardSection adminStats={stats()} setSection={setSection} />);
    fireEvent.click(screen.getByRole("button", { name: /Produkter: 20.182/ }));
    expect(setSection).toHaveBeenCalledWith("products");
    fireEvent.click(screen.getByRole("button", { name: /Åbne tickets: 2/ }));
    expect(setSection).toHaveBeenCalledWith("tickets");
  });
  it("Åbne tickets åbner ticketsiden med filteret Åbne, og Afventende indsendelser med Afventer", () => {
    const openTickets = vi.fn(), openSubmissions = vi.fn(), setSection = vi.fn();
    render(<DashboardSection adminStats={stats()} setSection={setSection} openTickets={openTickets} openSubmissions={openSubmissions} />);
    fireEvent.click(screen.getByRole("button", { name: /Åbne tickets: 2/ }));
    fireEvent.click(screen.getByRole("button", { name: /Afventende indsendelser: 4/ }));
    expect(openTickets).toHaveBeenCalledTimes(1);
    expect(openSubmissions).toHaveBeenCalledTimes(1);
    expect(setSection).not.toHaveBeenCalled();
  });
  it("sektionen Genveje findes ikke længere", () => {
    render(<DashboardSection adminStats={stats()} setSection={() => {}} todos={[]} admins={[]} openTodos={() => {}} />);
    expect(screen.queryByText("Genveje")).toBeNull();
    expect(screen.queryByText(/Gennemgå \d+ afventende/)).toBeNull();
  });
  it("Opgaveoverblik: seks felter, hvert åbner To do med sit filter, og Uden frist tæller kun åbne opgaver med manglende eller ugyldig frist", () => {
    const T = (o) => ({ id: Math.random().toString(), status: "todo", priority: "normal", assignee_id: "a1", due_date: "2026-12-01", ...o });
    const todos = [
      T({ due_date: null }), T({ due_date: "" }), T({ due_date: "ikke-en-dato" }), T({ due_date: "2026-13-45" }),
      T({ status: "done", due_date: null }), // færdig tæller ikke
      T({ priority: "high", assignee_id: null }), T({ status: "blocked" }), T({ due_date: "2020-01-01" }),
    ];
    const openTodos = vi.fn();
    render(<DashboardSection adminStats={stats()} setSection={() => {}} todos={todos} admins={[{ id: "a1", name: "Jan" }]} openTodos={openTodos} />);
    const cell = (label) => screen.getByText(label).closest("button");
    expect(cell("Uden frist").querySelector("b").textContent).toBe("4");
    expect(cell("Åbne opgaver").querySelector("b").textContent).toBe("7");
    const expected = { "Åbne opgaver": {}, "Høj prioritet": { priority: "high" }, "Venter": { status: "blocked" }, "Frist overskredet": { due: "overdue" }, "Uden ansvarlig": { assigneeId: "none" }, "Uden frist": { due: "none" } };
    for (const [label, preset] of Object.entries(expected)) {
      openTodos.mockClear();
      fireEvent.click(cell(label));
      expect(openTodos).toHaveBeenCalledWith(preset);
    }
  });
  it("periodevalg 7/14/30 ændrer antal søjler (standard 14)", () => {
    render(<DashboardSection adminStats={stats()} setSection={() => {}} />);
    const bars = () => screen.getAllByRole("group", { name: /Scanninger pr. dag/ })[0].querySelectorAll("button").length;
    expect(bars()).toBe(14);
    fireEvent.click(screen.getByRole("button", { name: "7 dage" }));
    expect(bars()).toBe(7);
    fireEvent.click(screen.getByRole("button", { name: "30 dage" }));
    expect(bars()).toBe(30);
  });
  it("tryk på en søjle viser præcis dato og antal, og dage uden aktivitet viser 0", () => {
    render(<DashboardSection adminStats={stats()} setSection={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /12\. oktober: 1 scanninger/ }));
    expect(screen.getAllByText(/mandag 12\. oktober: 1 scanninger/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /13\. oktober: 0 scanninger/ }));
    expect(screen.getAllByText(/tirsdag 13\. oktober: 0 scanninger/i).length).toBeGreaterThan(0);
  });
  it("definitionerne ligger bag et infoikon, og loading viser skelet", () => {
    const { rerender } = render(<DashboardSection adminStats={null} setSection={() => {}} />);
    expect(screen.getByLabelText("Henter statistik")).toBeTruthy();
    rerender(<DashboardSection adminStats={stats()} setSection={() => {}} />);
    expect(screen.queryByRole("note")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Hvad tæller tallene/ }));
    expect(screen.getByRole("note").textContent).toMatch(/Scanning/);
  });
});

describe("tabeller bliver til kort: cellernes labels", () => {
  it("giver hver celle sin kolonneoverskrift og springer tomme overskrifter og data-no-cards over", () => {
    document.body.innerHTML = `<table class="admin-table"><thead><tr><th>Navn</th><th>Rolle</th><th></th></tr></thead><tbody><tr><td>Jan</td><td>admin</td><td><button>Slet</button></td></tr></tbody></table>
      <table class="admin-table" data-no-cards><thead><tr><th>X</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>`;
    labelTableCells(document.body);
    const tds = document.querySelectorAll("tbody td");
    expect(tds[0].dataset.label).toBe("Navn");
    expect(tds[1].dataset.label).toBe("Rolle");
    expect(tds[2].dataset.label).toBeUndefined();
    expect(tds[3].dataset.label).toBeUndefined();
  });
});
