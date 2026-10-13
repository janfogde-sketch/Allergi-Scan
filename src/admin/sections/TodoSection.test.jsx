// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TodoSection from "./TodoSection.jsx";

afterEach(cleanup);

const base = {
  admins: [{ id: "a1", name: "Jan", email: "jafo@eatsafe.dk" }], loading: false, load: () => {}, doneLoaded: false, doneCount: 0, loadDone: () => {},
  create: async () => true, update: async () => true, remove: async () => true, userId: "a1",
  comments: [], commentsLoading: false, loadComments: () => {}, closeComments: () => {}, addComment: async () => {}, deleteComment: async () => {},
};
const todo = (over = {}) => ({
  id: "t1", title: "Ret fejl", description: "", status: "todo", priority: "normal", track: "backend", assignee_id: "a1",
  due_date: null, link: null, ticket_id: null, created_by: "a1", created_at: "2026-10-01T10:00:00Z", updated_at: "2026-10-01T10:00:00Z", ...over,
});

describe("To do: link til ticketten bag en opgave", () => {
  it("viser 'Åbn ticket' på en opgave fra en ticket, og et tryk åbner ticketten uden at åbne opgaven", () => {
    const onOpenTicket = vi.fn();
    render(<TodoSection {...base} todos={[todo({ ticket_id: "tk-1" })]} onOpenTicket={onOpenTicket} />);
    fireEvent.click(screen.getByRole("button", { name: /Åbn ticketten bag: Ret fejl/ }));
    expect(onOpenTicket).toHaveBeenCalledWith("tk-1");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opgaver uden ticket har ingen ticket-knap", () => {
    render(<TodoSection {...base} todos={[todo()]} onOpenTicket={() => {}} />);
    expect(screen.queryByText("Åbn ticket")).toBeNull();
  });

  it("i opgavens vindue åbner 'Åbn ticket' ticketten og lukker vinduet", () => {
    const onOpenTicket = vi.fn();
    render(<TodoSection {...base} todos={[todo({ ticket_id: "tk-2" })]} onOpenTicket={onOpenTicket} />);
    fireEvent.click(screen.getByText("Ret fejl"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Flere handlinger/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Åbn ticket" }));
    expect(onOpenTicket).toHaveBeenCalledWith("tk-2");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("To do: tællere, sortering og færdige opgaver", () => {
  const list = [
    todo({ id: "o1", title: "Åben høj", priority: "high", assignee_id: "a1" }),
    todo({ id: "o2", title: "Åben normal", assignee_id: null }),
    todo({ id: "d1", title: "Færdig høj", status: "done", priority: "high", assignee_id: "a1", completed_at: "2026-10-05T10:00:00Z" }),
    todo({ id: "d2", title: "Færdig normal", status: "done", assignee_id: "a1", completed_at: "2026-10-04T10:00:00Z" }),
  ];
  it("chipsenes tal gælder den aktive fane og følger opgavernes status", () => {
    const { rerender } = render(<TodoSection {...base} doneLoaded doneCount={2} todos={list} />);
    expect(screen.getByRole("button", { name: "Mine (1)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Høj prioritet (1)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Uden ansvarlig (1)" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Færdige/ }));
    expect(screen.getByRole("button", { name: "Mine (2)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Høj prioritet (1)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Uden ansvarlig (0)" })).toBeTruthy();
    // en åben opgave bliver færdig: tallene i begge faner opdateres
    rerender(<TodoSection {...base} doneLoaded doneCount={3} todos={list.map((t) => (t.id === "o1" ? { ...t, status: "done", completed_at: "2026-10-06T10:00:00Z" } : t))} />);
    expect(screen.getByRole("button", { name: "Høj prioritet (2)" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Åbne/ }));
    expect(screen.getByRole("button", { name: "Høj prioritet (0)" })).toBeTruthy();
  });
  it("sorteringen hedder Anbefalet og har de øvrige valg", () => {
    render(<TodoSection {...base} todos={list} />);
    const sel = screen.getByLabelText("Sortering");
    expect([...sel.options].map((o) => o.textContent)).toEqual(["Sortér: Anbefalet", "Sortér: Højeste prioritet", "Sortér: Nærmeste frist", "Sortér: Senest opdateret", "Sortér: Ældste først"]);
  });
  it("færdige opgaver er ikke gennemstreget i CSS'en", async () => {
    const { adminCss } = await import("../adminTheme.js");
    expect(adminCss).not.toMatch(/\.(admin-item-title|todo-title)\.done\{[^}]*line-through/);
  });
});

describe("To do åbnet fra Dashboard med et filter", () => {
  const items = [
    todo({ id: "p1", title: "Uden frist A", due_date: null }),
    todo({ id: "p2", title: "Med frist B", due_date: "2099-01-01" }),
    todo({ id: "p3", title: "Ugyldig frist C", due_date: "ikke-en-dato" }),
    todo({ id: "p4", title: "Færdig uden frist D", status: "done", due_date: null }),
    todo({ id: "p5", title: "Høj E", priority: "high", due_date: "2099-01-01" }),
    todo({ id: "p6", title: "Venter F", status: "blocked", due_date: "2099-01-01" }),
  ];
  const withPreset = (preset) => render(<TodoSection {...base} doneLoaded doneCount={1} todos={items} preset={preset} />);
  it("due: none viser kun åbne opgaver uden (gyldig) frist", () => {
    withPreset({ id: 1, due: "none" });
    expect(screen.getByText("Uden frist A")).toBeTruthy();
    expect(screen.getByText("Ugyldig frist C")).toBeTruthy();
    expect(screen.queryByText("Med frist B")).toBeNull();
    expect(screen.queryByText("Færdig uden frist D")).toBeNull();
    expect(screen.getByRole("button", { name: "Filtre (1)" })).toBeTruthy();
  });
  it("priority: high og status: blocked anvendes faktisk", () => {
    const { unmount } = withPreset({ id: 2, priority: "high" });
    expect(screen.getByText("Høj E")).toBeTruthy();
    expect(screen.queryByText("Med frist B")).toBeNull();
    unmount();
    withPreset({ id: 3, status: "blocked" });
    expect(screen.getByText("Venter F")).toBeTruthy();
    expect(screen.queryByText("Høj E")).toBeNull();
  });
  it("uden filter vises den almindelige åbne liste", () => {
    withPreset(null);
    expect(screen.getByText("Med frist B")).toBeTruthy();
    expect(screen.getByText("Uden frist A")).toBeTruthy();
  });
});
