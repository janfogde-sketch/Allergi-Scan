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
  });
  it("Overblik har otte ens kort, og åbne tickets står kun under Kræver opmærksomhed (ikke også som kort)", () => {
    render(<DashboardSection adminStats={stats()} setSection={() => {}} />);
    const grid = document.querySelector(".dash-stat-grid");
    expect(grid.children.length).toBe(8);
    expect([...grid.querySelectorAll(".admin-stat-label")].map((e) => e.textContent)).toEqual([
      "Brugere i alt", "Nye brugere i dag", "Produkter", "Familiemedlemmer", "Scanninger i alt", "Scanninger i dag", "Søgninger i alt", "Afventende indsendelser",
    ]);
    expect(screen.queryByRole("button", { name: /Åbne tickets: 2/ })).toBeNull();
    expect(screen.getAllByText(/åbne tickets/i).length).toBe(1);
  });
  it("Åbne tickets åbner ticketsiden med filteret Åbne (fra Kræver opmærksomhed), og Afventende indsendelser med Afventer", () => {
    const openTickets = vi.fn(), openSubmissions = vi.fn(), setSection = vi.fn();
    render(<DashboardSection adminStats={stats()} setSection={setSection} openTickets={openTickets} openSubmissions={openSubmissions} />);
    fireEvent.click(screen.getByRole("button", { name: /2 åbne tickets/ }));
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
    fireEvent.click(screen.getByRole("button", { name: "Vis flere oplysninger" }));
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
    expect(document.querySelector(".dash-tip").textContent).toMatch(/12\. okt.*1 scanning$/);
    fireEvent.click(screen.getByRole("button", { name: /13\. oktober: 0 scanninger$/ }), { detail: 0 });
    expect(document.querySelector(".dash-tip").textContent).toMatch(/13\. okt.*0 scanninger$/);
    expect(document.querySelectorAll(".dash-tip").length).toBe(1);
    fireEvent.pointerDown(document.body);
    expect(document.querySelector(".dash-tip")).toBeNull();
  });
  it("tooltippen er den samme på begge grafer, holdes inden for diagrammet og kan flyttes med piletaster", () => {
    render(<DashboardSection adminStats={{ ...stats(), user_trend: bucketByDkDay([{ t: "2026-10-12T10:00:00Z" }, { t: "2026-10-13T08:00:00Z" }], "t", 30, new Date("2026-10-13T10:00:00Z")) }} setSection={() => {}} />);
    for (const name of [/Scanninger pr\. dag/, /Nye brugere pr\. dag/]) {
      const plot = screen.getByRole("group", { name });
      const btns = plot.querySelectorAll("button");
      for (const i of [0, 7, btns.length - 1]) {
        fireEvent.click(btns[i], { detail: 0 });
        const tip = document.querySelector(".dash-tip");
        expect(tip.getAttribute("role")).toBe("status");
        expect(tip.style.left || tip.style.right).toBeTruthy();
      }
      fireEvent.keyDown(plot, { key: "ArrowLeft" });
      expect(document.querySelectorAll(".dash-tip").length).toBe(1);
      fireEvent.pointerDown(document.body);
    }
    const plot = screen.getAllByRole("group", { name: /pr\. dag/ })[0];
    const btns = plot.querySelectorAll("button");
    btns[10].focus();
    fireEvent.keyDown(plot, { key: "ArrowRight" });
    expect(btns[11].getAttribute("aria-pressed")).toBe("true");
  });
  it("ikonerne har betydning: ur til overskredet frist, flag til høj prioritet, og opgaver uden frist fremhæves aldrig", () => {
    const T = (o) => ({ id: Math.random().toString(), status: "todo", priority: "normal", assignee_id: "a1", due_date: null, ...o });
    const todos = [T({}), T({ due_date: "" }), T({ due_date: "2020-01-01" }), T({ priority: "high" })];
    render(<DashboardSection adminStats={{ ...stats(), open_tickets: 0, pending_submissions: 0 }} setSection={() => {}} todos={todos} admins={[]} openTodos={() => {}} />);
    const region = screen.getByRole("region", { name: "Kræver opmærksomhed" });
    const rows = [...region.querySelectorAll(".dash-attn-row")];
    expect(rows.map((r) => r.querySelector(".dash-attn-text").textContent)).toEqual(["1 opgave med overskredet frist", "1 opgave med høj prioritet"]);
    const iconOf = (row) => row.querySelector(".dash-attn-icon svg").innerHTML;
    expect(rows[0].querySelector(".dash-attn-icon").className).toContain("late");
    expect(rows[1].querySelector(".dash-attn-icon").className).toContain("warn");
    expect(iconOf(rows[0])).toContain("circle"); // ur
    expect(iconOf(rows[1])).not.toContain("circle"); // flag
    expect(iconOf(rows[0])).not.toBe(iconOf(rows[1]));
  });
  it("Vis flere oplysninger / Vis færre oplysninger folder Uden ansvarlig og Uden frist ud og ind", () => {
    render(<DashboardSection adminStats={stats()} setSection={() => {}} todos={[{ id: "1", status: "todo", priority: "normal", assignee_id: null, due_date: null }]} admins={[]} openTodos={() => {}} />);
    const btn = () => screen.getByRole("button", { name: /Vis (flere|færre) oplysninger/ });
    expect(btn().textContent.trim()).toBe("Vis flere oplysninger");
    expect(btn().getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(btn());
    expect(btn().textContent.trim()).toBe("Vis færre oplysninger");
    expect(btn().getAttribute("aria-expanded")).toBe("true");
    expect(btn().querySelector(".dash-chev").className).toContain("open");
    expect(screen.getByText("Uden ansvarlig", { selector: ".beta-cell span" })).toBeTruthy();
    expect(screen.getByText("Uden frist", { selector: ".beta-cell span" })).toBeTruthy();
    fireEvent.click(btn());
    expect(screen.queryByText("Uden frist", { selector: ".beta-cell span" })).toBeNull();
  });
  it("ansvarlige vises med deres registrerede visningsnavn (fallback e-mail), aldrig et gættet navn, på én fælles skala", () => {
    const T = (o) => ({ id: Math.random().toString(), status: "todo", priority: "normal", due_date: null, ...o });
    const todos = [T({ assignee_id: "a1" }), T({ assignee_id: "a1" }), T({ assignee_id: "a1" }), T({ assignee_id: "a1" }), T({ assignee_id: "a2" }), T({ assignee_id: "a3" })];
    render(<DashboardSection adminStats={stats()} setSection={() => {}} todos={todos} admins={[{ id: "a1", name: "Bjørn Holst", email: "b@x.dk" }, { id: "a2", name: "jafo", email: "j@x.dk" }, { id: "a3", name: "  ", email: "uden@navn.dk" }]} openTodos={() => {}} />);
    const names = [...document.querySelectorAll(".dash-dist-name")].map((e) => e.textContent);
    expect(names).toEqual(["Bjørn Holst", "jafo", "uden@navn.dk"]);
    const widths = [...document.querySelectorAll(".dash-dist-bar > span")].map((e) => parseFloat(e.style.width));
    expect(widths[0]).toBeCloseTo((4 / 6) * 100, 1);
    expect(widths[1]).toBeCloseTo((1 / 6) * 100, 1);
    expect(widths[0] / widths[1]).toBeCloseTo(4, 1);
  });
  it("periodevælgeren står på sin egen linje på smalle skærme (CSS) og knapperne ombrydes ikke", async () => {
    const { adminCss } = await import("./adminTheme.js");
    expect(adminCss).toMatch(/@media\(max-width:559px\)\{\.dash-head\.stack\{flex-direction:column/);
    expect(adminCss).toMatch(/\.dash-period button\{[^}]*white-space:nowrap/);
    render(<DashboardSection adminStats={stats()} setSection={() => {}} />);
    expect(screen.getByRole("group", { name: "Periode for graferne" }).closest(".dash-head").className).toContain("stack");
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
