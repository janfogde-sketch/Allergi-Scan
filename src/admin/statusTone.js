// @ts-check
// Fælles statusfarver for opgaver (admin_todos) og tickets (feedback_tickets) i admin-panelet (13. okt. 2026).
// Samme betydning, samme farve: ikke startet = neutral, i gang = gul, venter/blokeret = rød, færdig/løst = grøn.
//   Ticket:  open → Åben (ikke startet) · in_progress → I gang · resolved → Løst
//   Opgave:  todo → Skal laves (ikke startet) · doing → I gang · blocked → Venter · done → Færdig
// Status følger begge veje mellem en ticket og dens opgave i databasen (todo <-> open, doing <-> in_progress, done <-> resolved).
export const TONE_CLASS = { pending: "admin-pill-neutral", active: "admin-pill-amber", blocked: "admin-pill-red", done: "admin-pill-green" };
/** @type {Record<string, keyof typeof TONE_CLASS>} */
export const STATUS_TONE = { open: "pending", todo: "pending", in_progress: "active", doing: "active", blocked: "blocked", resolved: "done", done: "done" };
export const statusPill = (/** @type {string} */ status) => TONE_CLASS[STATUS_TONE[status]] || "admin-pill-neutral";
