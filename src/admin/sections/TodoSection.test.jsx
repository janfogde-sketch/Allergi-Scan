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
    fireEvent.click(screen.getAllByText("Åbn ticket").find(el => el.className.includes("admin-btn")));
    expect(onOpenTicket).toHaveBeenCalledWith("tk-2");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
