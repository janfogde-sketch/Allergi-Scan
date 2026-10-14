// @ts-check
// Ren logik til den fælles to do-liste i admin-panelet (admin_todos): etiketter, sortering,
// filtre, frister og en færdig prompt til en Claude Code-session. Ingen React, så den kan testes.

export const STATUS_LABELS = { todo: "Skal laves", doing: "I gang", blocked: "Venter", done: "Færdig" };
import { statusPill } from "./statusTone.js";
export const STATUS_PILL = { todo: statusPill("todo"), doing: statusPill("doing"), blocked: statusPill("blocked"), done: statusPill("done") };
export const PRIORITY_LABELS = { high: "Høj", normal: "Normal", low: "Lav" };
export const PRIORITY_PILL = { high: "admin-pill-red", normal: "admin-pill-neutral", low: "admin-pill-neutral" };
export const TRACK_LABELS = { backend: "Backend", design: "Design", test: "Test", drift: "Drift" };

const PRIORITY_RANK = { high: 0, normal: 1, low: 2 };
const STATUS_RANK = { doing: 0, todo: 1, blocked: 2, done: 3 };

/** Dagens dato som YYYY-MM-DD i dansk tid. */
export function todayKey(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Copenhagen" }).format(now);
}

/** En frist er kun gyldig som en rigtig dato i formatet YYYY-MM-DD; tomme og ugyldige værdier tæller som "uden frist". */
export function hasValidDue(todo) {
  const v = todo && todo.due_date;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function isOverdue(todo, today = todayKey()) {
  return hasValidDue(todo) && todo.status !== "done" && todo.due_date < today;
}

/** "I dag", "I morgen", "I går", ellers "3. okt." — og om fristen er overskredet. */
export function dueInfo(todo, today = todayKey()) {
  if (!hasValidDue(todo)) return null;
  const d = new Date(`${todo.due_date}T12:00:00Z`);
  const t = new Date(`${today}T12:00:00Z`);
  const diff = Math.round((d.getTime() - t.getTime()) / 86400_000);
  let label;
  if (diff === 0) label = "I dag";
  else if (diff === 1) label = "I morgen";
  else if (diff === -1) label = "I går";
  else label = new Intl.DateTimeFormat("da-DK", { timeZone: "UTC", day: "numeric", month: "short" }).format(d);
  return { label, overdue: isOverdue(todo, today) };
}

export const SORT_MODES = { smart: "Anbefalet", priority: "Højeste prioritet", due: "Nærmeste frist", updated: "Senest opdateret", oldest: "Ældste først" };

const cmpDue = (a, b) => {
  if (a.due_date === b.due_date) return 0;
  if (!a.due_date) return 1;
  if (!b.due_date) return -1;
  return a.due_date < b.due_date ? -1 : 1;
};
const cmpCreated = (a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));

/** Trin i standardsorteringen: 0 høj prioritet og (overskredet eller venter), 1 overskredet frist, 2 høj prioritet, 3 kommende frist, 4 resten. */
export function urgencyTier(t, today = todayKey()) {
  const overdue = isOverdue(t, today);
  if (t.priority === "high" && (overdue || t.status === "blocked")) return 0;
  if (overdue) return 1;
  if (t.priority === "high") return 2;
  if (t.due_date) return 3;
  return 4;
}

/**
 * Åbne opgaver først, færdige nederst (senest afsluttet først). Åbne sorteres efter mode:
 * smart ("Anbefalet", standard): urgencyTier, derefter i gang → skal laves → venter, frist og nyeste;
 * priority: prioritet, derefter frist; due: frist (uden frist sidst); updated: senest ændret først; oldest: ældst oprettet først.
 */
export function sortTodos(list, mode = "smart", today = todayKey()) {
  return [...list].sort((a, b) => {
    const ad = a.status === "done", bd = b.status === "done";
    if (ad !== bd) return ad ? 1 : -1;
    if (ad && bd) return String(b.completed_at ?? "").localeCompare(String(a.completed_at ?? ""));
    if (mode === "oldest") return String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
    if (mode === "updated") return String(b.updated_at ?? b.created_at ?? "").localeCompare(String(a.updated_at ?? a.created_at ?? ""));
    if (mode === "due") return cmpDue(a, b) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || cmpCreated(a, b);
    if (mode === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || cmpDue(a, b) || cmpCreated(a, b);
    const tier = urgencyTier(a, today) - urgencyTier(b, today);
    if (tier) return tier;
    return STATUS_RANK[a.status] - STATUS_RANK[b.status] || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || cmpDue(a, b) || cmpCreated(a, b);
  });
}

const isOpen = (t) => t.status !== "done";

function matchesView(todo, view, userId) {
  switch (view) {
    case "open": return isOpen(todo);
    case "mine": return isOpen(todo) && !!userId && todo.assignee_id === userId;
    case "unassigned": return isOpen(todo) && !todo.assignee_id;
    case "done": return todo.status === "done";
    default: return true;
  }
}

/**
 * filters: { view, track, assigneeId, query, priority, status, due } — assigneeId "" = alle, "none" = uden ansvarlig.
 * due: "" = alle, "overdue" = frist overskredet, "week" = frist inden for 7 dage, "none" = uden frist.
 */
export function filterTodos(list, filters, userId, today = todayKey()) {
  const { view = "open", track = "", assigneeId = "", query = "", priority = "", status = "", due = "", admins = [] } = filters;
  const q = query.trim().toLowerCase();
  const weekEnd = (() => { const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 7); return d.toISOString().slice(0, 10); })();
  return list.filter((t) => {
    if (!matchesView(t, view, userId)) return false;
    if (track && t.track !== track) return false;
    if (priority && t.priority !== priority) return false;
    if (status && t.status !== status) return false;
    if (due === "overdue" && !isOverdue(t, today)) return false;
    if (due === "none" && hasValidDue(t)) return false;
    if (due === "week" && !(t.due_date && t.due_date <= weekEnd && t.status !== "done")) return false;
    if (assigneeId === "none" && t.assignee_id) return false;
    if (assigneeId && assigneeId !== "none" && t.assignee_id !== assigneeId) return false;
    if (q && !`${t.title} ${t.description ?? ""} ${t.link ?? ""} ${TRACK_LABELS[t.track] ?? ""} ${personName(admins, t.assignee_id)}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Antal aktive filtre ud over visningen og søgeordet (til filterknappen). */
export function activeFilterCount({ track = "", assigneeId = "", priority = "", status = "", due = "" } = {}) {
  return [track, assigneeId, priority, status, due].filter(Boolean).length;
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

/** "14. okt. 2026" af en lagret dato (YYYY-MM-DD) uden tidszoneforskydning; tom streng uden dato. */
export function fmtDanishDate(key) {
  if (!key) return "";
  return new Intl.DateTimeFormat("da-DK", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${key}T12:00:00Z`));
}

/** Lange kommentarer foldes sammen: mere end 5 linjer eller 300 tegn. */
export const isLongComment = (body) => String(body ?? "").split("\n").length > 5 || String(body ?? "").length > 300;

/**
 * Afsender af en kommentar. Kommentarer skrevet af systemet eller via migrationer har ingen afsender (author_id er tom): "Uden afsender".
 * En afsender, der ikke længere er administrator eller er slettet: "Tidligere administrator". Aldrig et opdigtet navn.
 */
export function authorName(admins, id) {
  if (!id) return "Uden afsender";
  const a = admins.find((x) => x.id === id);
  return a ? (a.name || a.email || "Tidligere administrator") : "Tidligere administrator";
}

/** "14. okt. 2026, 08:15" i dansk tid. */
export function fmtDanishDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

/**
 * Overblik over åbne opgaver før lancering. Kun tal, der kan læses direkte af opgavedata: ingen procent eller fremdrift.
 * blocked = status "Venter"; byAssignee tæller åbne opgaver pr. administrator (mest først), unassigned = uden ansvarlig.
 */
export function betaOverview(list, admins = [], today = todayKey()) {
  const open = list.filter(isOpen);
  const counts = new Map();
  for (const t of open) if (t.assignee_id) counts.set(t.assignee_id, (counts.get(t.assignee_id) || 0) + 1);
  return {
    open: open.length,
    blocked: open.filter((t) => t.status === "blocked").length,
    overdue: open.filter((t) => isOverdue(t, today)).length,
    high: open.filter((t) => t.priority === "high").length,
    unassigned: open.filter((t) => !t.assignee_id).length,
    noDue: open.filter((t) => !hasValidDue(t)).length,
    highUnassigned: open.filter((t) => t.priority === "high" && !t.assignee_id).length,
    byAssignee: [...counts.entries()].map(([id, count]) => ({ id, name: personName(admins, id), count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "da")),
  };
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
    ...(comments.length ? [``, `Kommentarer:`, ...comments.map((c) => `- ${authorName(admins, c.author_id)}: ${c.body}`)] : []),
    ``,
    `Læs CLAUDE.md, og løs opgaven. Er den stor eller risikabel (database, sikkerhed, politikker, flere skærme eller filer), så foreslå først en plan, og vent på min bekræftelse, før du retter. Push først efter mit ja.`,
  ].join("\n");
}
