// @ts-nocheck
// @vitest-environment jsdom
// Responsivt admin-panel (13. okt. 2026): kort på mobil, tabel på desktop, fælles statusfarver og "Flere handlinger".
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TodoSection from "./sections/TodoSection.jsx";
import TicketsSection, { ticketTitleParts } from "./sections/TicketsSection.jsx";
import ActionsMenu from "./ActionsMenu.jsx";
import { statusPill } from "./statusTone.js";
import { STATUS_PILL as TODO_PILL } from "./todoLogic.js";

afterEach(() => { cleanup(); delete window.matchMedia; });
const setMobile = (mobile) => {
  window.matchMedia = vi.fn().mockImplementation((q) => ({ matches: mobile, media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }));
};

const todoBase = {
  admins: [{ id: "a1", name: "Jan", email: "j@x.dk" }], loading: false, load: vi.fn(), doneLoaded: false, doneCount: 0, loadDone: () => {},
  create: vi.fn(async () => true), update: async () => true, remove: async () => true, userId: "a1",
  comments: [], commentsLoading: false, loadComments: () => {}, closeComments: () => {}, addComment: async () => {}, deleteComment: async () => {},
};
const todo = (over = {}) => ({ id: "t1", title: "Byg Android-app som TWA med en meget lang titel der skal kunne ombrydes naturligt", description: "", status: "todo", priority: "high", track: "backend", assignee_id: "a1", due_date: null, link: null, ticket_id: null, created_at: "2026-10-01T10:00:00Z", ...over });

describe("opgaver: mobilkort og desktoptabel", () => {
  it("mobil: kort med titel, prioritet, spor, ansvarlig, status og frist; ingen tabel", () => {
    setMobile(true);
    const { container } = render(<TodoSection {...todoBase} todos={[todo()]} />);
    expect(container.querySelector("table")).toBeNull();
    expect(screen.getByText(/Byg Android-app som TWA/)).toBeTruthy();
    expect(screen.getByText("Høj prioritet")).toBeTruthy();
    expect(screen.getByText("Backend")).toBeTruthy();
    expect(screen.getByText("Skal laves")).toBeTruthy();
    expect(screen.getByText("Ikke fastsat")).toBeTruthy();
    fireEvent.click(container.querySelector(".admin-item-card"));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
  it("desktop: tabel", () => {
    setMobile(false);
    const { container } = render(<TodoSection {...todoBase} todos={[todo()]} />);
    expect(container.querySelector("table")).toBeTruthy();
    expect(container.querySelector(".admin-item-card")).toBeNull();
  });
  it("+ Ny opgave åbner formularen, kræver titel og bevarer indtastning ved fejl", async () => {
    setMobile(false);
    const create = vi.fn(async () => false);
    render(<TodoSection {...todoBase} create={create} todos={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Ny opgave" }));
    const dlg = screen.getByRole("dialog", { name: "Ny opgave" });
    fireEvent.change(screen.getByLabelText("Titel"), { target: { value: "Min opgave" } });
    fireEvent.click(screen.getByRole("button", { name: "Opret opgave" }));
    await Promise.resolve(); await Promise.resolve();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ title: "Min opgave" }));
    expect(screen.getByRole("dialog", { name: "Ny opgave" })).toBe(dlg); // blev åben, fordi oprettelsen fejlede
    expect(screen.getByLabelText("Titel").value).toBe("Min opgave");
  });
  it("filtre kan åbnes, tælles og nulstilles; forklaringen ligger bag et infoikon", () => {
    setMobile(false);
    render(<TodoSection {...todoBase} todos={[todo(), todo({ id: "t2", title: "Lav", priority: "low" })]} />);
    expect(screen.queryByRole("note")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Sådan fungerer opgaver/ }));
    expect(screen.getByRole("note")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Filtre" }));
    fireEvent.change(screen.getByLabelText("Filtrér på prioritet"), { target: { value: "low" } });
    expect(screen.queryByText(/Byg Android-app/)).toBeNull();
    expect(screen.getByRole("button", { name: "Filtre (1)" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Nulstil" }));
    expect(screen.getByText(/Byg Android-app/)).toBeTruthy();
  });
});

describe("tickets: mobilkort og handlingsmenu", () => {
  const ticket = { id: "k1", type: "content", description: "Privatlivspolitik – ikke færdig. Teksten mangler afsnit 4 om børn.", status: "open", created_at: "2026-09-30T10:00:00Z", context: { screen_label: "PrivacyScreen" } };
  const props = { adminTickets: [ticket], ticketsLoading: false, adminTicketFilter: "active", setAdminTicketFilter: vi.fn(), ticketsIncludeDone: true, loadTickets: vi.fn(), openTicket: null, setOpenTicket: vi.fn(), updateTicketStatus: vi.fn() };
  it("mobil: kort med titel, uddrag, type, skærm, dato, status og Kopiér prompt", () => {
    setMobile(true);
    const { container } = render(<TicketsSection {...props} />);
    expect(container.querySelector("table")).toBeNull();
    expect(screen.getByText("Privatlivspolitik – ikke færdig.")).toBeTruthy();
    expect(screen.getByText("Indhold")).toBeTruthy();
    expect(screen.getByText("PrivacyScreen")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kopiér prompt" })).toBeTruthy();
  });
  it("downloads og opdatering ligger i 'Flere handlinger'", () => {
    setMobile(false);
    render(<TicketsSection {...props} />);
    expect(screen.queryByText(/Download åbne/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Flere handlinger/ }));
    expect(screen.getByRole("menuitem", { name: /Download åbne \+ prompts \(1\)/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: /Opdatér listen/ }));
    expect(props.loadTickets).toHaveBeenCalled();
  });
  it("titel og uddrag udledes af beskrivelsen, også uden punktum", () => {
    expect(ticketTitleParts("Kort fejl").title).toBe("Kort fejl");
    const long = ticketTitleParts("x".repeat(200));
    expect(long.title.length).toBeLessThanOrEqual(90);
    expect(ticketTitleParts("").title).toBe("(ingen beskrivelse)");
  });
});

describe("fælles statusfarver", () => {
  it("opgaver og tickets bruger samme farve for samme betydning", () => {
    expect(statusPill("open")).toBe(statusPill("todo"));
    expect(statusPill("in_progress")).toBe(statusPill("doing"));
    expect(statusPill("resolved")).toBe(statusPill("done"));
    expect(TODO_PILL.blocked).toBe("admin-pill-red");
    expect(new Set([statusPill("open"), statusPill("in_progress"), statusPill("resolved")]).size).toBe(3);
  });
});

describe("ActionsMenu", () => {
  it("skjuler sig selv uden handlinger og lukker med Escape", () => {
    const { container } = render(<ActionsMenu items={[false, null]} />);
    expect(container.innerHTML).toBe("");
    cleanup();
    render(<ActionsMenu items={[{ label: "A", onClick: () => {} }]} />);
    fireEvent.click(screen.getByRole("button", { name: /Flere handlinger/ }));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
