// @ts-check
// Ren logik til ticketadministrationen: titel, kilde (intern opgave eller brugerindsendelse), prioritet, filtrering/sortering, aktivitet og den kopierbare prompt.
// Intet her ændrer data. Princip: en afsluttet tjekliste eller et lukket ticket er aldrig en faglig eller juridisk godkendelse.
import { ticketDevice } from "../ticketReporter.js";

export const TYPE_LABELS = /** @type {Record<string, string>} */ ({ bug: "Fejl", ui: "Design", missing: "Mangler", content: "Indhold", crash: "Crash", suggestion: "Forslag" });
export const STATUS_LABELS = /** @type {Record<string, string>} */ ({ open: "Åben", in_progress: "I gang", resolved: "Løst" });
export const PRIORITIES = /** @type {Array<[string, string]>} */ ([["critical", "Kritisk"], ["high", "Høj"], ["normal", "Normal"], ["low", "Lav"]]);
export const PRIORITY_LABEL = /** @type {Record<string, string>} */ (Object.fromEntries(PRIORITIES));
export const PRIORITY_PILL = /** @type {Record<string, string>} */ ({ critical: "admin-pill-red", high: "admin-pill-amber", normal: "admin-pill-neutral", low: "admin-pill-neutral" });
const PRIORITY_RANK = /** @type {Record<string, number>} */ ({ critical: 0, high: 1, normal: 2, low: 3 });
export const TASK_STATUS = /** @type {Array<[string, string]>} */ ([["todo", "Ikke påbegyndt"], ["doing", "I gang"], ["done", "Afsluttet"]]);
export const TICKET_SORTS = /** @type {Array<[string, string]>} */ ([["newest", "Nyeste"], ["oldest", "Ældste"], ["activity", "Seneste aktivitet"]]);

/** Ældre interne tickets har en dansk prioritet i konteksten. @param {any} t */
export function contextPriority(t) {
  const p = String(t?.context?.priority || "").toLowerCase();
  return /** @type {Record<string, string>} */ ({ kritisk: "critical", "høj": "high", mellem: "normal", normal: "normal", lav: "low" })[p] || null;
}
/** @param {any} t @param {any} meta */
export const effectivePriority = (t, meta) => meta?.priority || contextPriority(t) || "normal";

/** Intern opgave (oprettet af os) eller brugerindsendelse. Dokumenteret grundlag: kilden i konteksten ("claude-session …") eller en intern art uden indsender. @param {any} t */
export function ticketOrigin(t) {
  const c = t?.context || {};
  const src = String(c.source || "");
  if (/^claude-session|^intern|^todo/i.test(src) || (!t?.submitted_by && !c.user_id && c.kind)) return "internal";
  return "user";
}
/** Vises i stedet for "Anonym". @param {any} t */
export function originLabel(t) {
  if (ticketOrigin(t) === "internal") return "Intern opgave";
  const c = t?.context || {};
  if (c.user_name) return "Brugerindsendelse";
  return t?.submitted_by || c.user_id ? "Brugerindsendelse" : "Brugerindsendelse uden konto";
}

/** Kort titel og uddrag ud fra beskrivelsen (tickets har ingen egen titel). @param {string} description */
export function ticketTitleParts(description) {
  const text = String(description || "").trim().replace(/\r/g, "");
  if (!text) return { title: "(ingen beskrivelse)", excerpt: "" };
  const firstLine = text.split("\n")[0];
  const m = firstLine.match(/^(.{20,90}?[.!?])(\s|$)/);
  const title = m ? m[1] : (firstLine.length > 90 ? firstLine.slice(0, 87).trimEnd() + "…" : firstLine);
  const rest = text.slice(title.length).replace(/^\s*[…]?\s*/, "").trim();
  return { title, excerpt: rest };
}

/** Tickets om uafsluttede juridiske tekster gennemgås som mulige lanceringsblokeringer; systemet markerer dem ikke selv. @param {any} t */
export const isLegalCandidate = (t) => /(brugsvilkår|privatlivspolitik)/i.test(String(t?.description || "")) && /(ikke færdig)/i.test(String(t?.description || "")) && t?.status !== "resolved";

/** Er tickets filtrene aktive? @param {any} f */
export const hasFilters = (f) => !!(f.q?.trim() || f.category || f.priority || f.assignee || f.blocking || (f.status && f.status !== ""));

const matchesTab = (/** @type {any} */ t, /** @type {string} */ tab) => tab === "all" || (tab === "active" ? t.status === "open" || t.status === "in_progress" : t.status === tab);

/**
 * @param {any[]} tickets
 * @param {{ tab?: string, status?: string, category?: string, priority?: string, assignee?: string, blocking?: boolean, q?: string, sort?: string }} f
 * @param {{ meta?: Record<string, any>, todos?: Record<string, any> }} ctx
 */
export function filterTickets(tickets, f, ctx = {}) {
  const meta = ctx.meta || {}; const todos = ctx.todos || {};
  const q = String(f.q || "").trim().toLowerCase();
  const out = tickets.filter((t) => {
    if (!matchesTab(t, f.tab || "active")) return false;
    if (f.status && t.status !== f.status) return false;
    if (f.category && t.type !== f.category) return false;
    if (f.priority && effectivePriority(t, meta[t.id]) !== f.priority) return false;
    if (f.assignee === "none" && todos[t.id]?.assignee_id) return false;
    if (f.assignee && f.assignee !== "none" && todos[t.id]?.assignee_id !== f.assignee) return false;
    if (f.blocking && !meta[t.id]?.launch_blocking) return false;
    if (q && !String(t.description || "").toLowerCase().includes(q)) return false;
    return true;
  });
  const activity = (/** @type {any} */ t) => Math.max(new Date(t.created_at).getTime(), new Date(todos[t.id]?.updated_at || 0).getTime(), new Date(meta[t.id]?.updated_at || 0).getTime());
  const key = f.sort || "newest";
  out.sort((a, b) => key === "oldest" ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    : key === "activity" ? activity(b) - activity(a)
    : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return out;
}
/** Antal pr. status til tællerne (uden de øvrige filtre). @param {any[]} tickets */
export function statusCounts(tickets) {
  const c = { active: 0, open: 0, in_progress: 0, resolved: 0, all: tickets.length };
  for (const t of tickets) { if (t.status === "open") { c.open++; c.active++; } else if (t.status === "in_progress") { c.in_progress++; c.active++; } else if (t.status === "resolved") c.resolved++; }
  return c;
}
export const sortByPriority = (/** @type {any[]} */ list, /** @type {Record<string, any>} */ meta) => [...list].sort((a, b) => PRIORITY_RANK[effectivePriority(a, meta[a.id])] - PRIORITY_RANK[effectivePriority(b, meta[b.id])]);

// ── Tjekliste ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** @param {Array<{ status: string }>} tasks */
export function progress(tasks) {
  const total = tasks.length; const done = tasks.filter((t) => t.status === "done").length;
  return { total, done, text: total ? `${done} af ${total} punkter afsluttet` : "" };
}

// ── Aktivitet (fra to do-historikken, ticket-historikken og kommentarer) ───────────────────────────────────────────────────────
const TODO_STATUS = /** @type {Record<string, string>} */ ({ todo: "Åben", doing: "I gang", blocked: "Blokeret", done: "Løst" });
const FLAG_TEXT = /** @type {Record<string, [string, string]>} */ ({
  launch_blocking: ["Markeret som lanceringsblokerende", "Ikke længere markeret som lanceringsblokerende"],
  requires_review: ["Markeret som kræver faglig eller juridisk gennemgang", "Kræver ikke længere gennemgang"],
  implemented: ["Markeret som implementeret", "Implementeret-markering fjernet"],
  tested: ["Markeret som testet", "Testet-markering fjernet"],
  reviewed: ["Markeret som gennemgået fagligt/juridisk af et menneske", "Gennemgået-markering fjernet"],
});
/**
 * @param {{ todoActivity?: any[], metaLog?: any[], comments?: any[] }} src
 * @param {(id: string|null|undefined) => string} nameOf
 * @returns {Array<{ key: string, at: string, kind: string, text: string, actor: string|null, body?: string }>}
 */
export function buildActivity(src, nameOf) {
  /** @type {Array<{ key: string, at: string, kind: string, text: string, actor: string|null, body?: string }>} */ const out = [];
  for (const a of src.todoActivity || []) {
    const actor = a.changed_by ? nameOf(a.changed_by) : (a.via === "system" ? "System" : null);
    if (a.field === "status") {
      const reopened = a.old_value === "done" && a.new_value !== "done";
      out.push({ key: `a${a.id}`, at: a.created_at, kind: reopened ? "reopen" : a.new_value === "done" ? "resolved" : "status", actor,
        text: reopened ? `Genåbnet (${TODO_STATUS[a.new_value] || a.new_value})` : a.new_value === "done" ? "Afsluttet som løst" : `Status: ${TODO_STATUS[a.old_value] || a.old_value} → ${TODO_STATUS[a.new_value] || a.new_value}` });
    } else if (a.field === "assignee_id") {
      out.push({ key: `a${a.id}`, at: a.created_at, kind: "assignee", actor, text: `Ansvarlig: ${a.old_value ? nameOf(a.old_value) : "Ingen"} → ${a.new_value ? nameOf(a.new_value) : "Ingen"}` });
    }
    // todo-prioritet og frist hører til to do-listen; ticketens egen prioritet står i ticket-historikken
  }
  for (const m of src.metaLog || []) {
    const actor = m.changed_by ? nameOf(m.changed_by) : null;
    if (m.field === "priority") out.push({ key: `m${m.id}`, at: m.created_at, kind: "priority", actor, text: `Prioritet: ${PRIORITY_LABEL[m.old_value] || m.old_value} → ${PRIORITY_LABEL[m.new_value] || m.new_value}` });
    else if (FLAG_TEXT[m.field]) {
      const on = m.new_value === "true" || m.new_value === "ja";
      out.push({ key: `m${m.id}`, at: m.created_at, kind: "flag", actor, text: FLAG_TEXT[m.field][on ? 0 : 1] });
    }
  }
  for (const c of src.comments || []) out.push({ key: `c${c.id}`, at: c.created_at, kind: "comment", actor: c.author_id ? nameOf(c.author_id) : null, text: "Kommentar", body: c.body });
  return out.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

// ── Kopiér prompt ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Fjerner e-mails, tokens og lange hemmelige strenge fra tekst, der kopieres ud af admin. @param {string} text */
export function redact(text) {
  return String(text ?? "")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[e-mail fjernet]")
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, "[token fjernet]")
    .replace(/\b(Bearer|apikey|api[_-]?key|token|secret|password|adgangskode)\b\s*[:=]?\s*[A-Za-z0-9._~+/-]{12,}/gi, "$1 [fjernet]")
    .replace(/\b(sk|re|pk|sb)[-_][A-Za-z0-9_-]{16,}/g, "[nøgle fjernet]");
}

const CRITERIA = /** @type {Record<string, string[]>} */ ({
  bug: ["Fejlen kan ikke længere gentages ved de beskrevne trin.", "En test dækker fejlen (eller det er begrundet, hvorfor det ikke kan testes)."],
  crash: ["Skærmen eller handlingen crasher ikke længere ved de beskrevne trin.", "En test dækker fejlen (eller det er begrundet, hvorfor det ikke kan testes)."],
  ui: ["Udseendet svarer til beskrivelsen og designguiden (BRAND.md), uden hardkodede farver.", "Det virker på smal mobilskærm uden vandret scrolling."],
  content: ["Teksten er rettet på dansk og i overensstemmelse med produktbeslutningerne.", "Brugertekster er markeret til gennemlæsning af Bjørn."],
  missing: ["Det manglende er tilføjet, og de øvrige skærme er upåvirkede."],
  suggestion: ["Forslaget er vurderet, og anbefaling med afvejning er givet, før noget bygges."],
});

/**
 * Færdig, indsætbar prompt til Claude Code. Indeholder titel, problem, skærm, ønsket ændring, tekniske oplysninger og acceptkriterier, men aldrig navn, e-mail, konto-id,
 * brugerens allergier (helbredsdata) eller nøgler/tokens.
 * @param {any} t @param {{ priority?: string, launchBlocking?: boolean, tasks?: Array<{ title: string, status: string }> }} [extra]
 */
export function buildTicketPrompt(t, extra = {}) {
  const ctx = t.context || {};
  const { title } = ticketTitleParts(t.description);
  const cat = (TYPE_LABELS[t.type] || t.type || "").toLowerCase();
  const date = new Date(t.created_at).toLocaleString("da-DK", { timeZone: "Europe/Copenhagen", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const screen = ctx.screen_label || ctx.admin_section || ctx.screen || "ikke angivet";
  const tasks = extra.tasks || [];
  const criteria = [...(CRITERIA[t.type] || ["Opgaven er løst som beskrevet."]), ...tasks.filter((x) => x.status !== "done").map((x) => `Punkt: ${redact(x.title)}`), "Lint, build og `npx vitest run` er grønne, og nye brugertekster er på dansk."];
  const trace = ctx.debug_trace?.length ? ["", `## Seneste debug-trace (${Math.min(ctx.debug_trace.length, 15)} af ${ctx.debug_trace.length})`, redact(JSON.stringify(ctx.debug_trace.slice(-15), null, 2))] : [];
  return [
    `Undersøg og løs følgende ${ticketOrigin(t) === "internal" ? "interne opgave" : "bruger-rapporterede " + cat} i EatSafe-kodebasen (Allergi-Scan).`,
    ``,
    `## Titel`,
    redact(title),
    ``,
    `## Problembeskrivelse`,
    redact(t.description || "(ingen beskrivelse angivet)"),
    ``,
    `## Hvor`,
    `Skærm/komponent: ${screen}${ctx.page_id ? ` (${ctx.page_id})` : ""}`,
    ...(ctx.scan_result_ean ? [`Relateret produkt: ${redact(ctx.scan_result_name || "—")} [EAN ${ctx.scan_result_ean}]`] : []),
    ``,
    `## Hvad ønskes ændret`,
    t.type === "suggestion" ? `Vurdér forslaget ovenfor og anbefal, om og hvordan det bør bygges.` : `Find rodårsagen til problemet ovenfor og ret det, så acceptkriterierne nedenfor er opfyldt.`,
    ``,
    `## Tekniske oplysninger`,
    `Ticket: ${t.id} · ${TYPE_LABELS[t.type] || t.type} · indsendt ${date} · ${originLabel(t)}`,
    ...(extra.priority ? [`Prioritet: ${PRIORITY_LABEL[extra.priority] || extra.priority}${extra.launchBlocking ? " · lanceringsblokerende" : ""}`] : []),
    `Kilde: ${ctx.source === "desktop-admin" ? "Desktop admin-panel" : ticketOrigin(t) === "internal" ? "Intern opgave" : "Mobil-app (PWA)"}`,
    `Enhed/browser: ${ticketDevice(ctx)} · ${redact(String(ctx.browser || ctx.user_agent || ctx.platform || "—"))}`,
    `Viewport: ${ctx.viewport || "—"} (skærm: ${ctx.screen_size || "—"}) · online: ${ctx.online === false ? "nej" : "ja"}`,
    ...(ctx.build_time || ctx.commit_sha ? [`Build: ${ctx.build_time || "—"} (${ctx.commit_sha || "—"})`] : []),
    ...(t.image_path || t.image_base64 ? [`Der er vedhæftet et skærmbillede i admin-panelet (ticket ${t.id}).`] : []),
    ...trace,
    ``,
    `## Acceptkriterier`,
    ...criteria.map((c, i) => `${i + 1}. ${c}`),
    ``,
    `Gæt ikke: grep/læs de relevante filer først, forklar den reelle mekanisme, og vent på min bekræftelse før du retter, medmindre rettelsen er klart isoleret og lavrisiko.`,
  ].join("\n");
}

/** Flere tickets i én tekst, tydeligt adskilt og med titel. @param {Array<{ ticket: any, extra?: any }>} items */
export function buildManyPrompts(items) {
  const parts = items.map(({ ticket, extra }, i) => `═══ Ticket ${i + 1} af ${items.length} · ${redact(ticketTitleParts(ticket.description).title)} (id: ${ticket.id}) ═══\n\n${buildTicketPrompt(ticket, extra)}`);
  return `EatSafe tickets (${items.length} stk)\nKopieret: ${new Date().toLocaleString("da-DK", { timeZone: "Europe/Copenhagen" })}\n\nHver ticket er en færdig, indsætbar prompt; kopiér én sektion ad gangen ind i en Claude Code-session.\n\n` + parts.join("\n\n\n");
}
