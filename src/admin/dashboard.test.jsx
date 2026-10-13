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
    expect(screen.getByText("Søgninger i alt").closest(".admin-stat-card").querySelector(".admin-stat-num").textContent).toBe("7"); // søgninger er et eget kort (found_via=search), ikke en del af scanninger
    expect(screen.getByText("profiler uden egen konto")).toBeTruthy(); // Familiemedlemmer forklares
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
  it("Opgaveoverblik: fire primære felter, to i det udvidelige område, hvert åbner To do med sit filter, og Uden frist tæller kun åbne opgaver med manglende eller ugyldig frist", () => {
    const T = (o) => ({ id: Math.random().toString(), status: "todo", priority: "normal", assignee_id: "a1", due_date: "2026-12-01", ...o });
    const todos = [
      T({ due_date: null }), T({ due_date: "" }), T({ due_date: "ikke-en-dato" }), T({ due_date: "2026-13-45" }),
      T({ status: "done", due_date: null }), // færdig tæller ikke
      T({ priority: "high", assignee_id: null }), T({ status: "blocked" }), T({ due_date: "2020-01-01" }),
    ];
    const openTodos = vi.fn();
    render(<DashboardSection adminStats={stats()} setSection={() => {}} todos={todos} admins={[{ id: "a1", name: "Jan" }]} openTodos={openTodos} />);
    const cell = (label) => screen.getByText(label, { selector: ".beta-cell span" }).closest("button");
    expect(screen.queryByText("Uden frist", { selector: ".beta-cell span" })).toBeNull(); // skjult, til området foldes ud
    fireEvent.click(screen.getByRole("button", { name: /Flere/ }));
    expect(cell("Uden frist").querySelector("b").textContent).toBe("4");
    expect(cell("Åbne opgaver").querySelector("b").textContent).toBe("7");
    const expected = { "Åbne opgaver": {}, "Høj prioritet": { priority: "high" }, "Venter": { status: "blocked" }, "Frist overskredet": { due: "overdue" }, "Uden ansvarlig": { assigneeId: "none" }, "Uden frist": { due: "none" } };
    for (const [label, preset] of Object.entries(expected)) {
      openTodos.mockClear();
      fireEvent.click(cell(label));
      expect(openTodos).toHaveBeenCalledWith(preset);
    }
  });
  it("Kræver opmærksomhed viser kun forhold med handling, hver post åbner den filtrerede side, og tom tilstand er neutral", () => {
    const T = (o) => ({ id: Math.random().toString(), status: "todo", priority: "normal", assignee_id: "a1", due_date: "2099-01-01", ...o });
    const todos = [T({ priority: "high", assignee_id: null }), T({ due_date: "2020-01-01" })];
    const openTodos = vi.fn(), openTickets = vi.fn(), openSubmissions = vi.fn();
    const { rerender } = render(<DashboardSection adminStats={stats()} setSection={() => {}} todos={todos} admins={[]} openTodos={openTodos} openTickets={openTickets} openSubmissions={openSubmissions} />);
    const region = screen.getByRole("region", { name: "Kræver opmærksomhed" });
    const btn = (re) => [...region.querySelectorAll("button")].find((b) => re.test(b.textContent));
    fireEvent.click(btn(/2 åbne tickets/)); expect(openTickets).toHaveBeenCalled();
    fireEvent.click(btn(/4 afventende indsendelser/)); expect(openSubmissions).toHaveBeenCalled();
    fireEvent.click(btn(/1 opgave med overskredet frist/)); expect(openTodos).toHaveBeenLastCalledWith({ due: "overdue" });
    fireEvent.click(btn(/høj prioritet uden ansvarlig/)); expect(openTodos).toHaveBeenLastCalledWith({ priority: "high", assigneeId: "none" });
    fireEvent.click(btn(/1 opgave med høj prioritet$/)); expect(openTodos).toHaveBeenLastCalledWith({ priority: "high" });
    rerender(<DashboardSection adminStats={{ ...stats(), open_tickets: 0, pending_submissions: 0 }} setSection={() => {}} todos={[T({})]} admins={[]} openTodos={openTodos} />);
    expect(screen.getByText("Intet kræver opmærksomhed lige nu.")).toBeTruthy();
  });
  it("opgaver, der ikke er indlæst, vises ikke som nuller", () => {
    render(<DashboardSection adminStats={stats()} setSection={() => {}} todos={[]} todosLoaded={false} admins={[]} openTodos={() => {}} />);
    expect(screen.getByText("Henter opgaver…")).toBeTruthy();
    expect(screen.queryByText("Åbne opgaver", { selector: ".beta-cell span" })).toBeNull();
  });
  it("Opgaver pr. ansvarlig summerer til antallet af åbne opgaver og åbner To do for personen", () => {
    const T = (o) => ({ id: Math.random().toString(), status: "todo", priority: "normal", assignee_id: "a1", due_date: null, ...o });
    const todos = [T({}), T({}), T({ assignee_id: "a2" }), T({ assignee_id: null }), T({ status: "done" })];
    const openTodos = vi.fn();
    render(<DashboardSection adminStats={stats()} setSection={() => {}} todos={todos} admins={[{ id: "a1", name: "Jan" }, { id: "a2", name: "Bjørn" }]} openTodos={openTodos} />);
    expect(screen.getByText("Opgaver pr. ansvarlig")).toBeTruthy();
    const rows = [...document.querySelectorAll(".dash-dist-row")].map((r) => [r.querySelector(".dash-dist-name").textContent, Number(r.querySelector(".dash-dist-count").textContent)]);
    expect(rows).toEqual([["Jan", 2], ["Bjørn", 1], ["Uden ansvarlig", 1]]);
    expect(rows.reduce((n, r) => n + r[1], 0)).toBe(4); // = åbne opgaver (den færdige er ikke med)
    fireEvent.click(screen.getByRole("button", { name: /Jan: 2 åbne opgaver/ }));
    expect(openTodos).toHaveBeenCalledWith({ assigneeId: "a1" });
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
  it("periodevælgeren ligger i Aktivitet, styrer begge grafer og huskes", () => {
    sessionStorage.clear();
    const { unmount } = render(<DashboardSection adminStats={stats()} setSection={() => {}} />);
    const seg = screen.getByRole("group", { name: "Periode for graferne" });
    expect(screen.getByRole("region", { name: "Aktivitet" }).contains(seg)).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "30 dage" }));
    for (const g of screen.getAllByRole("group", { name: /pr\. dag/ })) expect(g.querySelectorAll("button").length).toBe(30);
    unmount();
    render(<DashboardSection adminStats={stats()} setSection={() => {}} />);
    expect(screen.getByRole("button", { name: "30 dage" }).getAttribute("aria-pressed")).toBe("true");
    sessionStorage.clear();
  });
  it("ingen fast hjælpetekst; tryk på en søjle viser en kompakt tooltip med dato og antal (korrekt ental), og tryk udenfor fjerner den", () => {
    render(<DashboardSection adminStats={stats()} setSection={() => {}} />);
    expect(screen.queryByText(/Tryk på en søjle/)).toBeNull();
    expect(document.querySelector(".dash-tip")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /12\. oktober: 1 scanning$/ }), { detail: 0 });
    expect(document.querySelector(".dash-tip").textContent).toMatch(/mandag 12\. oktober: 1 scanning$/);
    fireEvent.click(screen.getByRole("button", { name: /13\. oktober: 0 scanninger$/ }), { detail: 0 });
    expect(document.querySelector(".dash-tip").textContent).toMatch(/tirsdag 13\. oktober: 0 scanninger$/);
    fireEvent.pointerDown(document.body);
    expect(document.querySelector(".dash-tip")).toBeNull();
  });
  it("definitionerne ligger bag et diskret infoikon (ikke en tekstknap), og loading viser skelet", () => {
    const { rerender } = render(<DashboardSection adminStats={null} setSection={() => {}} />);
    expect(screen.getByLabelText("Henter statistik")).toBeTruthy();
    rerender(<DashboardSection adminStats={stats()} setSection={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("Hvad tæller tallene?", { selector: "button" })).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: "Hvad tæller tallene?" })[0]);
    const text = screen.getByRole("dialog").textContent;
    for (const w of ["Scanninger", "Søgninger", "separat", "Familiemedlemmer", "selvstændig konto", "dansk tid", "Periodevælgeren"]) expect(text).toContain(w);
  });
  it("fejlede grafer vises som 'kunne ikke hentes', ikke som nuller", () => {
    render(<DashboardSection adminStats={{ ...stats(), scan_trend: undefined }} setSection={() => {}} />);
    expect(screen.getAllByText(/Tallene kunne ikke hentes/).length).toBe(1);
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
