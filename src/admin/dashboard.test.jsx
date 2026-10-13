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
    expect(screen.getByText("+ 7 via søgning")).toBeTruthy();
  });
  it("kort med en naturlig destination åbner siden", () => {
    const setSection = vi.fn();
    render(<DashboardSection adminStats={stats()} setSection={setSection} />);
    fireEvent.click(screen.getByRole("button", { name: /Produkter: 20.182/ }));
    expect(setSection).toHaveBeenCalledWith("products");
    fireEvent.click(screen.getByRole("button", { name: /Åbne tickets: 2/ }));
    expect(setSection).toHaveBeenCalledWith("tickets");
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
