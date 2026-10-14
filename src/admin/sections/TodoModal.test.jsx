// @ts-nocheck
// @vitest-environment jsdom
// Opgaveredigering (14. okt. 2026): ingen horisontal overflow-årsager, advarsel ved ikke-gemte ændringer, bekræftet sletning, sikre kommentarer.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import TodoModal from "./TodoModal.jsx";

afterEach(() => { cleanup(); document.body.style.overflow = ""; });

const admins = [{ id: "a1", name: "Jan", email: "j@x.dk" }];
const LONG = "https://github.com/janfogde-sketch/Allergi-Scan/pull/715/files/" + "a".repeat(300);
const todo = { id: "t1", title: "Titel " + "ordlang".repeat(40), description: "", status: "todo", priority: "normal", track: "backend", assignee_id: "a1", due_date: null, link: null, ticket_id: null, created_by: "a1", created_at: "2026-10-01T10:00:00Z" };
const setup = (over = {}) => {
  const props = { todo, admins, userId: "a1", comments: [], onSave: vi.fn(async () => true), onDelete: vi.fn(async () => true), onClose: vi.fn(), onAddComment: vi.fn(async () => true), onDeleteComment: vi.fn(), ...over };
  render(<TodoModal {...props} />);
  return props;
};

describe("TodoModal", () => {
  it("Gem er slået fra uden ændringer og til ved en gyldig ændring", () => {
    setup();
    const save = screen.getByRole("button", { name: "Gem" });
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Prioritet"), { target: { value: "high" } });
    expect(save.disabled).toBe(false);
    fireEvent.change(screen.getByLabelText("Titel"), { target: { value: "  " } });
    expect(save.disabled).toBe(true);
  });
  it("gemmer kun de ændrede felter (rører ikke status, så ticketstatus ikke ændres ved almindelig redigering)", async () => {
    const props = setup();
    fireEvent.change(screen.getByLabelText("Beskrivelse"), { target: { value: "Ny tekst" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Gem" })); });
    expect(props.onSave).toHaveBeenCalledWith({ description: "Ny tekst" });
    expect(props.onClose).toHaveBeenCalled();
  });
  it("ugyldigt link blokerer Gem og viser årsagen", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/Link/), { target: { value: "ikke-et-link" } });
    expect(screen.getByRole("button", { name: "Gem" }).disabled).toBe(true);
    expect(screen.getByText(/skal starte med http/)).toBeTruthy();
  });
  it("advarer om ikke-gemte ændringer, før panelet lukkes", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    expect(props.onClose).toHaveBeenCalledTimes(1); // ingen ændringer: lukker direkte
    props.onClose.mockClear();
    fireEvent.change(screen.getByLabelText("Beskrivelse"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog", { name: "Ikke-gemte ændringer" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bliv og ret" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Kassér ændringer" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
  it("sletning ligger i Flere handlinger, kræver bekræftelse og kan annulleres", async () => {
    const props = setup();
    expect(screen.queryByRole("button", { name: "Slet" })).toBeNull(); // ikke en fast knap i bunden
    fireEvent.click(screen.getByRole("button", { name: /Flere handlinger/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Slet opgave" }));
    expect(props.onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Annullér" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Flere handlinger/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Slet opgave" }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Ja, slet opgaven" })); });
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
  it("lukning med ændringer kan gemme og lukke, og sletning nævner opgaven", async () => {
    const props = setup();
    fireEvent.change(screen.getByLabelText("Beskrivelse"), { target: { value: "ny tekst" } });
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Gem og luk" })); });
    expect(props.onSave).toHaveBeenCalledTimes(1);
    cleanup();
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Flere handlinger/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Slet opgave" }));
    expect(screen.getByRole("alertdialog").textContent).toMatch(/Slet “.+”\?/);
    expect(screen.getByRole("alertdialog").textContent).toContain("permanent");
  });
  it("beskrivelsen er et voksende felt uden eget rullefelt, og et gyldigt link kan åbnes", () => {
    setup({ todo: { ...todo, link: "https://x.dk/pr/1" } });
    expect(screen.getByLabelText("Beskrivelse").className).toContain("todo-grow");
    expect(screen.getByRole("link", { name: /Åbn linket/ }).getAttribute("href")).toBe("https://x.dk/pr/1");
  });
  it("kun én Luk (øverst) og Gem i bunden", () => {
    setup();
    expect(screen.getAllByRole("button", { name: "Luk" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Gem" })).toBeTruthy();
  });
  it("titlen er et voksende tekstområde, der viser hele den lange titel og ikke tillader linjeskift", () => {
    setup();
    const title = screen.getByLabelText("Titel");
    expect(title.tagName).toBe("TEXTAREA");
    expect(title.value).toBe(todo.title);
    fireEvent.change(title, { target: { value: "Første\nanden" } });
    expect(title.value).toBe("Første anden");
  });
  it("fristen vises i dansk format med kalenderikon, 'Vælg dato' uden frist og kan fjernes uden at ændre lagringsformatet", async () => {
    const props = setup();
    expect(screen.getByText("Vælg dato")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Frist"), { target: { value: "2026-10-20" } });
    expect(screen.getByText(/20\. okt\.? 2026/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Gem" })); });
    expect(props.onSave).toHaveBeenCalledWith({ due_date: "2026-10-20" });
  });
  it("lange kommentarer foldes sammen med Vis mere/Vis mindre, korte vises fuldt", () => {
    const long = Array.from({ length: 9 }, (_, i) => `linje ${i + 1}`).join("\n");
    setup({ comments: [{ id: "c1", author_id: "a1", body: long, created_at: "2026-10-14T06:15:00Z" }, { id: "c2", author_id: "a1", body: "kort", created_at: "2026-10-14T06:16:00Z" }] });
    expect(document.querySelector(".todo-comment-body.clamped")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Vis mere" }));
    expect(document.querySelector(".todo-comment-body.clamped")).toBeNull();
    expect(screen.getByText(/linje 9/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Vis mindre" }));
    expect(document.querySelector(".todo-comment-body.clamped")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Vis mere/ })).toHaveLength(1); // kun den lange har knappen
  });
  it("låser baggrundens scroll, mens panelet er åbent, og frigiver den igen", () => {
    document.body.style.overflow = "auto";
    const { unmount } = render(<TodoModal todo={todo} admins={admins} userId="a1" onSave={async () => true} onDelete={async () => true} onClose={() => {}} onAddComment={async () => true} onDeleteComment={() => {}} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
  it("kommentarer: korrekt afsender, dansk dato, lange links ombrydes, og dobbelttryk sender kun én gang", async () => {
    let resolve;
    const onAddComment = vi.fn(() => new Promise((r) => { resolve = r; }));
    setup({
      onAddComment,
      comments: [
        { id: "c1", author_id: "a1", body: LONG, created_at: "2026-10-14T06:15:00Z" },
        { id: "c2", author_id: null, body: "Skrevet i en migration", created_at: "2026-10-13T10:00:00Z" },
      ],
    });
    expect(screen.getByText("Jan")).toBeTruthy();
    expect(screen.getByText("Uden afsender")).toBeTruthy();
    expect(screen.queryByText("Ukendt")).toBeNull();
    expect(screen.getByText(/14\. okt\.? 2026/)).toBeTruthy();
    expect(screen.getByText(LONG).className).toContain("todo-comment-body");
    fireEvent.change(screen.getByLabelText("Ny kommentar"), { target: { value: "Hej" } });
    const send = screen.getByRole("button", { name: "Send" });
    fireEvent.click(send); fireEvent.click(send);
    expect(onAddComment).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Sender…" }).disabled).toBe(true);
    await act(async () => { resolve(true); });
    expect(screen.getByLabelText("Ny kommentar").value).toBe("");
  });
  it("kommentaren bevares, hvis afsendelsen fejler", async () => {
    setup({ onAddComment: vi.fn(async () => false) });
    fireEvent.change(screen.getByLabelText("Ny kommentar"), { target: { value: "Bevar mig" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Send" })); });
    expect(screen.getByLabelText("Ny kommentar").value).toBe("Bevar mig");
  });
  it("en ny opgave med indtastet titel advarer også ved luk", () => {
    const props = setup({ isNew: true, todo: { title: "", status: "todo", priority: "normal", track: "backend", assignee_id: "a1" } });
    fireEvent.change(screen.getByLabelText("Titel"), { target: { value: "Udkast" } });
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeTruthy();
  });
});
