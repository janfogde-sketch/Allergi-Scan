// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, act } from "@testing-library/react";
import AdminLayout from "./AdminLayout.jsx";

afterEach(() => { cleanup(); delete window.matchMedia; document.body.style.overflow = ""; });
const setMobile = (m) => { window.matchMedia = vi.fn().mockImplementation((q) => ({ matches: m, media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} })); };

const base = { userEmail: "bho@eatsafe.dk", userId: "u1", accessToken: "t", logout: vi.fn(), setSection: vi.fn() };
const mount = (props = {}) => render(<AdminLayout {...base} section="tickets" {...props}><div>indhold</div></AdminLayout>);
const nav = () => screen.getByRole("navigation", { name: "Administration" });
const groupHead = (label) => within(nav()).getByRole("button", { name: new RegExp(label, "i") });
const hasItem = (name) => !!within(nav()).queryByRole("button", { name });

describe("kategorier", () => {
  it("kun kategorien med den aktive side er udfoldet som udgangspunkt, og hele overskriften er en knap", () => {
    setMobile(false);
    mount({ section: "tickets" });
    expect(groupHead("Til behandling").getAttribute("aria-expanded")).toBe("true");
    for (const g of ["Overblik", "Indhold & data", "Brugere & kommunikation", "Drift"]) expect(groupHead(g).getAttribute("aria-expanded")).toBe("false");
    expect(hasItem(/Tickets/)).toBe(true);
    expect(hasItem("Dashboard")).toBe(false);
  });
  it("harmonika: kun én kategori ad gangen, og alle kan lukkes", () => {
    setMobile(false);
    mount({ section: "tickets" });
    fireEvent.click(groupHead("Indhold & data"));
    expect(hasItem("Produkter")).toBe(true);
    expect(hasItem(/Tickets/)).toBe(false); // den forrige lukkes
    fireEvent.click(groupHead("Drift"));
    expect(hasItem("Fejl")).toBe(true);
    expect(hasItem("Produkter")).toBe(false);
    fireEvent.click(groupHead("Drift"));
    for (const g of ["Overblik", "Til behandling", "Indhold & data", "Brugere & kommunikation", "Drift"]) expect(groupHead(g).getAttribute("aria-expanded")).toBe("false");
  });
  it("navigation til en ny side folder dens kategori ud og lukker de øvrige", () => {
    setMobile(false);
    const { rerender } = mount({ section: "tickets" });
    fireEvent.click(groupHead("Drift"));
    rerender(<AdminLayout {...base} section="users"><div /></AdminLayout>);
    expect(groupHead("Brugere & kommunikation").getAttribute("aria-expanded")).toBe("true");
    expect(groupHead("Drift").getAttribute("aria-expanded")).toBe("false");
    expect(groupHead("Til behandling").getAttribute("aria-expanded")).toBe("false");
  });
  it("kun den aktive side er markeret, og kategorioverskrifter er aldrig markeret som aktive", () => {
    setMobile(false);
    mount({ section: "tickets" });
    const current = [...document.querySelectorAll("[aria-current='page']")];
    expect(current.length).toBe(1);
    expect(current[0].textContent).toContain("Tickets");
    expect(document.querySelectorAll(".admin-nav-item.active").length).toBe(1);
    expect(document.querySelector(".admin-nav-group-head.active")).toBeNull();
  });
  it("alle menupunkter navigerer til deres rute", () => {
    setMobile(false);
    const setSection = vi.fn();
    mount({ setSection });
    const expected = { Dashboard: "dashboard", Opgaver: "todo", Indsendelser: "submissions", Tilbagekald: "recalls", Tickets: "tickets", Produkter: "products", Leksikon: "knowledge", "Ukendte stregkoder": "missing", Import: "import", Ændringshistorik: "history", Brugere: "users", Familie: "family", Notifikationer: "notifications", Onboardingfrafald: "onboarding", Fejl: "errors", "AI-forbrug": "ai-usage", Aktivitetslog: "audit" };
    for (const [label, id] of Object.entries(expected)) {
      setSection.mockClear();
      const find = () => [...document.querySelectorAll(".admin-nav-item")].find((b) => b.querySelector(".admin-nav-label").textContent === label);
      for (const g of ["Overblik", "Til behandling", "Indhold & data", "Brugere & kommunikation", "Drift"]) { if (find()) break; fireEvent.click(groupHead(g)); }
      const btn = find();
      fireEvent.click(btn);
      expect(setSection).toHaveBeenCalledWith(id);
    }
  });
  it("sidetitlen bruger det nye navn", () => {
    setMobile(false);
    mount({ section: "todo" });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Opgaver");
  });
});

describe("antalsmarkeringer i menuen", () => {
  it("vises kun ved tal over nul, med tone efter betydning, og 99+ over 99", () => {
    setMobile(false);
    mount({ section: "tickets", pendingSubmissions: 0, openTickets: 3, pendingRecalls: undefined, todoAttention: 2, todoOverdue: 0 });
    const tickets = within(nav()).getByRole("button", { name: /Tickets/ });
    expect(tickets.querySelector(".badge").textContent).toBe("3");
    expect(tickets.querySelector(".badge").className).toContain("neutral");
    expect(tickets.getAttribute("aria-label")).toBe("Tickets, 3 åbne");
    expect(within(nav()).getByRole("button", { name: /^Indsendelser$/ }).querySelector(".badge")).toBeNull(); // 0
    expect(within(nav()).getByRole("button", { name: /^Tilbagekald$/ }).querySelector(".badge")).toBeNull(); // ikke indlæst
    fireEvent.click(groupHead("Overblik"));
    const todo = within(nav()).getByRole("button", { name: /Opgaver/ });
    expect(todo.querySelector(".badge").className).toContain("neutral"); // almindelig tæller, ikke farvet
  });
  it("rød kun når der er overskredne frister, og 99+ ved store tal", () => {
    setMobile(false);
    mount({ section: "todo", todoAttention: 150, todoOverdue: 1 });
    const todo = within(nav()).getByRole("button", { name: /Opgaver/ });
    expect(todo.querySelector(".badge").className).toContain("crit");
    expect(todo.querySelector(".badge").textContent).toBe("99+");
    expect(todo.getAttribute("aria-label")).toBe("Opgaver, 150 kræver opmærksomhed");
  });
  it("en sammenklappet kategori viser summen med den strengeste tone", () => {
    setMobile(false);
    mount({ section: "dashboard", openTickets: 4, pendingSubmissions: 1, pendingRecalls: 2 });
    const head = groupHead("Til behandling");
    expect(head.querySelector(".badge").textContent).toBe("7");
    expect(head.querySelector(".badge").className).toContain("warn"); // tilbagekald er gule
  });
});

describe("fast top og bund, og lukning", () => {
  it("logo, Admin og luk-knap øverst; e-mail, feedback og Log ud nederst; kun navigationen ligger imellem", () => {
    setMobile(false);
    const { container } = mount();
    const head = container.querySelector(".admin-sidebar-head");
    expect(head.textContent).toContain("Admin");
    expect(within(head).getByRole("button", { name: "Luk menu" })).toBeTruthy();
    const foot = container.querySelector(".admin-sidebar-footer");
    expect(foot.textContent).toContain("bho@eatsafe.dk");
    expect(within(foot).getByRole("button", { name: "Log ud" })).toBeTruthy();
    expect(foot.querySelectorAll("button").length).toBe(2); // Send feedback + Log ud
    expect(head.nextElementSibling.tagName).toBe("NAV");
    expect(foot.previousElementSibling.tagName).toBe("NAV");
  });
  it("Log ud virker som før", () => {
    setMobile(false);
    const logout = vi.fn();
    mount({ logout });
    fireEvent.click(screen.getByRole("button", { name: "Log ud" }));
    expect(logout).toHaveBeenCalledTimes(1);
  });
  it("mobil: åbner som dialog, låser baggrunden og lukker med luk-knap, Escape, baggrund, swipe og Android-tilbage", () => {
    setMobile(true);
    mount();
    const open = () => fireEvent.click(screen.getByRole("button", { name: "Åbn menu" }));
    const isOpen = () => !!document.querySelector(".admin-sidebar.open");
    open();
    expect(isOpen()).toBe(true);
    expect(screen.getByRole("dialog", { name: "Adminmenu" }).getAttribute("aria-modal")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.querySelector(".admin-main").hasAttribute("inert")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Luk menu" }));
    expect(isOpen()).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(document.querySelector(".admin-main").hasAttribute("inert")).toBe(false);

    open(); fireEvent.keyDown(document, { key: "Escape" }); expect(isOpen()).toBe(false);
    open(); fireEvent.click(document.querySelector(".admin-nav-backdrop")); expect(isOpen()).toBe(false);
    open();
    const aside = document.querySelector(".admin-sidebar");
    fireEvent.touchStart(aside, { touches: [{ clientX: 200, clientY: 300 }] });
    fireEvent.touchEnd(aside, { changedTouches: [{ clientX: 100, clientY: 310 }] });
    expect(isOpen()).toBe(false);
    open();
    fireEvent.touchStart(aside, { touches: [{ clientX: 200, clientY: 300 }] }); // lodret træk lukker ikke
    fireEvent.touchEnd(aside, { changedTouches: [{ clientX: 190, clientY: 420 }] });
    expect(isOpen()).toBe(true);
  });
  it("mobil: Android-tilbage (popstate) lukker menuen", () => {
    setMobile(true);
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Åbn menu" }));
    expect(document.querySelector(".admin-sidebar.open")).toBeTruthy();
    act(() => { window.dispatchEvent(new PopStateEvent("popstate")); });
    expect(document.querySelector(".admin-sidebar.open")).toBeNull();
  });
  it("mobil: valg af et punkt lukker menuen og åbner siden, og næste åbning starter med den aktive kategori", () => {
    setMobile(true);
    const setSection = vi.fn();
    const { rerender } = mount({ section: "tickets", setSection });
    fireEvent.click(screen.getByRole("button", { name: "Åbn menu" }));
    fireEvent.click(groupHead("Drift"));
    fireEvent.click(within(nav()).getByRole("button", { name: /^Fejl$/ }));
    expect(setSection).toHaveBeenCalledWith("errors");
    expect(document.querySelector(".admin-sidebar.open")).toBeNull();
    rerender(<AdminLayout {...base} section="errors" setSection={setSection}><div /></AdminLayout>);
    fireEvent.click(screen.getByRole("button", { name: "Åbn menu" }));
    expect(groupHead("Drift").getAttribute("aria-expanded")).toBe("true");
    expect(groupHead("Til behandling").getAttribute("aria-expanded")).toBe("false"); // manuelle valg nulstilles ved ny åbning
  });
  it("desktop: sidebaren er altid synlig og er ingen dialog", () => {
    setMobile(false);
    mount();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector(".admin-main").hasAttribute("inert")).toBe(false);
  });
});
