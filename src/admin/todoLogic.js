// @ts-nocheck
// Ren logik til den fælles to do-liste i admin-panelet (admin_todos): etiketter, sortering,
// filtre, frister og en færdig prompt til en Claude Code-session. Ingen React, så den kan testes.

export const STATUS_LABELS = { todo: "Skal laves", doing: "I gang", blocked: "Venter", done: "Færdig" };
export const STATUS_PILL = { todo: "admin-pill-neutral", doing: "admin-pill-amber", blocked: "admin-pill-red", done: "admin-pill-green" };
export const PRIORITY_LABELS = { high: "Høj", normal: "Normal", low: "Lav" };
export const PRIORITY_PILL = { high: "admin-pill-red", normal: "admin-pill-neutral", low: "admin-pill-neutral" };
export const TRACK_LABELS = { backend: "Backend", design: "Design", test: "Test", drift: "Drift" };

const PRIORITY_RANK = { high: 0, normal: 1, low: 2 };
const STATUS_RANK = { doing: 0, todo: 1, blocked: 2, done: 3 };

/** Dagens dato som YYYY-MM-DD i dansk tid. */
export function todayKey(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Copenhagen" }).format(now);
}

export function isOverdue(todo, today = todayKey()) {
  return !!todo.due_date && todo.status !== "done" && todo.due_date < today;
}

/** "I dag", "I morgen", "I går", ellers "3. okt." — og om fristen er overskredet. */
export function dueInfo(todo, today = todayKey()) {
  if (!todo.due_date) return null;
  const d = new Date(`${todo.due_date}T12:00:00Z`);
  const t = new Date(`${today}T12:00:00Z`);
  const diff = Math.round((d - t) / 86400_000);
  let label;
  if (diff === 0) label = "I dag";
  else if (diff === 1) label = "I morgen";
  else if (diff === -1) label = "I går";
  else label = new Intl.DateTimeFormat("da-DK", { timeZone: "UTC", day: "numeric", month: "short" }).format(d);
  return { label, overdue: isOverdue(todo, today) };
}

/** Åbne først (i gang → skal laves → venter), derefter prioritet, frist og nyeste; færdige nederst, senest afsluttet først. */
export function sortTodos(list) {
  return [...list].sort((a, b) => {
    const ad = a.status === "done", bd = b.status === "done";
    if (ad !== bd) return ad ? 1 : -1;
    if (ad && bd) return String(b.completed_at ?? "").localeCompare(String(a.completed_at ?? ""));
    const s = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (s) return s;
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p) return p;
    if (a.due_date !== b.due_date) {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date < b.due_date ? -1 : 1;
    }
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });
}

const isOpen = (t) => t.status !== "done";

export function matchesView(todo, view, userId) {
  switch (view) {
    case "open": return isOpen(todo);
    case "mine": return isOpen(todo) && !!userId && todo.assignee_id === userId;
    case "unassigned": return isOpen(todo) && !todo.assignee_id;
    case "done": return todo.status === "done";
    default: return true;
  }
}

/** filters: { view, track, assigneeId, query } — assigneeId "" = alle, "none" = uden ansvarlig. */
export function filterTodos(list, filters, userId) {
  const { view = "open", track = "", assigneeId = "", query = "" } = filters;
  const q = query.trim().toLowerCase();
  return list.filter((t) => {
    if (!matchesView(t, view, userId)) return false;
    if (track && t.track !== track) return false;
    if (assigneeId === "none" && t.assignee_id) return false;
    if (assigneeId && assigneeId !== "none" && t.assignee_id !== assigneeId) return false;
    if (q && !`${t.title} ${t.description ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

// Færdige opgaver hentes først, når man beder om det (doneLoaded). Indtil da kommer antallet fra serveren (doneCount).
export function countByView(list, userId, { doneCount = null, doneLoaded = true } = {}) {
  const out = { open: 0, mine: 0, unassigned: 0, done: 0, all: 0 };
  for (const view of ["open", "mine", "unassigned"]) out[view] = list.filter((t) => matchesView(t, view, userId)).length;
  out.done = doneLoaded || doneCount === null ? list.filter((t) => t.status === "done").length : doneCount;
  out.all = out.open + out.done;
  return out;
}

/** "Færdige"/"Alle" er de to visninger, der kræver, at de færdige opgaver hentes. */
export const viewNeedsDone = (view) => view === "done" || view === "all";

/** Antal åbne opgaver, der kræver handling nu: høj prioritet og ikke venter, eller overskredet frist. */
export function attentionCount(list, today = todayKey()) {
  return list.filter((t) => isOpen(t) && t.status !== "blocked" && (t.priority === "high" || isOverdue(t, today))).length;
}

export function personName(admins, id) {
  if (!id) return "";
  const a = admins.find((x) => x.id === id);
  return a ? (a.name || a.email || "Ukendt") : "Ukendt";
}

/** Færdig, indsætbar prompt til en Claude Code-session. */
export function buildTodoPrompt(todo, admins = [], comments = []) {
  const due = todo.due_date ? `Frist: ${todo.due_date}` : "Ingen frist";
  return [
    `Tag dette punkt fra EatSafes fælles to do-liste (tabellen admin_todos, id ${todo.id}) op i Allergi-Scan-kodebasen.`,
    ``,
    `Titel: ${todo.title}`,
    `Spor: ${TRACK_LABELS[todo.track] || todo.track} · Prioritet: ${PRIORITY_LABELS[todo.priority] || todo.priority} · Status: ${STATUS_LABELS[todo.status] || todo.status}`,
    `Ansvarlig: ${personName(admins, todo.assignee_id) || "ingen"} · ${due}`,
    ...(todo.link ? [`Link: ${todo.link}`] : []),
    ``,
    `Beskrivelse:`,
    todo.description || "(ingen)",
    ...(comments.length ? [``, `Kommentarer:`, ...comments.map((c) => `- ${personName(admins, c.author_id) || "Ukendt"}: ${c.body}`)] : []),
    ``,
    `Læs CLAUDE.md, undersøg koden, og foreslå en plan. Vent på min bekræftelse, før du retter eller pusher.`,
  ].join("\n");
}
