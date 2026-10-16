// @ts-nocheck
// @vitest-environment jsdom
// Admin-panelet ved flere skærmbredder (14. okt. 2026): grænsen er 820 px (samme som CSS); To do og Tickets er kort under og tabel over.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import TodoSection from "./sections/TodoSection.jsx";
import TicketsSection from "./sections/TicketsSection.jsx";
import AuditLogSection from "./sections/AuditLogSection.jsx";

afterEach(() => { cleanup(); delete window.matchMedia; });
const atWidth = (w) => {
  window.matchMedia = vi.fn().mockImplementation((q) => {
    const max = /max-width:\s*(\d+)px/.exec(q);
    return { matches: max ? w <= Number(max[1]) : false, media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} };
  });
};
const WIDTHS = [
  [320, "lille telefon"], [375, "iPhone"], [430, "stor telefon"], [768, "tablet stående"], [820, "tablet grænse"],
  [1024, "tablet liggende"], [1280, "laptop"], [1440, "desktop"],
];

const todoProps = {
  admins: [{ id: "a1", name: "Jan", email: "j@x.dk" }], loading: false, load: vi.fn(), doneLoaded: false, doneCount: 0, loadDone: () => {},
  create: vi.fn(async () => true), update: async () => true, remove: async () => true, userId: "a1",
  comments: [], commentsLoading: false, loadComments: () => {}, closeComments: () => {}, addComment: async () => {}, deleteComment: async () => {},
  todos: [{ id: "t1", title: "Opgave", description: "", status: "todo", priority: "high", track: "backend", assignee_id: "a1", due_date: null, link: null, ticket_id: null, created_at: "2026-10-01T10:00:00Z" }],
};
const ticketProps = {
  adminTickets: [{ id: "k1", type: "bug", description: "Fejl. Mere tekst.", status: "open", created_at: "2026-09-30T10:00:00Z", context: {} }],
  ticketsLoading: false, adminTicketFilter: "active", setAdminTicketFilter: vi.fn(), ticketsIncludeDone: true, loadTickets: vi.fn(), openTicket: null, setOpenTicket: vi.fn(), updateTicketStatus: vi.fn(),
  work: { meta: {}, tasks: {}, todos: {}, admins: [], available: true, nameOf: () => "Ingen", load: vi.fn() },
};

describe.each(WIDTHS)("bredde %i px (%s)", (w) => {
  const mobile = w <= 820;
  it("To do: kort på mobil, tabel ellers; Tickets: altid kort", () => {
    atWidth(w);
    const a = render(<TodoSection {...todoProps} />).container;
    expect(!!a.querySelector("table")).toBe(!mobile);
    expect(!!a.querySelector(".admin-item-card")).toBe(mobile);
    cleanup();
    atWidth(w);
    const b = render(<TicketsSection {...ticketProps} />).container;
    expect(!!b.querySelector("table")).toBe(false);
    expect(!!b.querySelector(".admin-item-card")).toBe(true);
  });
  it("Aktivitetslog viser handling, admin og skift uden e-mail eller navn", () => {
    atWidth(w);
    const rows = [{ id: 1, created_at: "2026-10-14T08:00:00Z", admin_id: "aaaaaaaa-1111", action: "rolle_aendret", target_table: "users", target_id: "bbbbbbbb-2222", details: { fra: "user", til: "admin" } }];
    const { container } = render(<AuditLogSection rows={rows} names={{ users: {}, products: {} }} loading={false} loadingMore={false} hasMore={false} loaded error={null} load={() => {}} loadMore={() => {}} />);
    expect(container.textContent).toContain("Rolle ændret");
    expect(container.textContent).toContain("user → admin");
    expect(container.textContent).toContain("aaaaaaaa");
    expect(container.textContent).not.toContain("@");
  });
});
