// @ts-check
// Ren logik til admin-fanen "Tilbagekald" (tilbagekaldelser fra Fødevarestyrelsen, P6).
// Holdt adskilt fra React, så den kan testes.
import { extractAffectedProducts, deriveUnitFromCarton, eanVariants } from "../../supabase/functions/_shared/recallParser.js";

export const RECALL_STATUS_LABELS = {
  needs_review: "Afventer gennemgang",
  ready: "Sendt",
  archived: "Arkiveret",
  cancelled: "Annulleret",
};
export const RECALL_STATUS_PILL = {
  needs_review: "admin-pill-amber",
  ready: "admin-pill-green",
  archived: "admin-pill-neutral",
  cancelled: "admin-pill-red",
};
export const RECALL_VIEWS = ["needs_review", "ready", "archived", "cancelled", "all"];

export const needsReviewCount = (recalls) => recalls.filter((r) => r.status === "needs_review").length;

export function filterRecalls(recalls, view) {
  const list = view === "all" ? recalls : recalls.filter((r) => r.status === view);
  return [...list].sort((a, b) => String(b.published_at || b.created_at || "").localeCompare(String(a.published_at || a.created_at || "")));
}

export function countByStatus(recalls) {
  const out = { all: recalls.length };
  for (const s of Object.keys(RECALL_STATUS_LABELS)) out[s] = recalls.filter((r) => r.status === s).length;
  return out;
}

// Tilføjer et produkt til de valgte (på EAN, uden dubletter); returnerer en ny liste.
export function addProduct(selected, product) {
  if (!product?.ean || selected.some((p) => p.ean === product.ean)) return selected;
  return [...selected, { id: product.id, ean: product.ean, name: product.name, brand: product.brand }];
}

export const removeProduct = (selected, ean) => selected.filter((p) => p.ean !== ean);

// Søgeordet til produktsøgningen: kun cifre fra et råt tal fra siden, ellers teksten som den er.
export const searchTermFromRaw = (raw) => String(raw ?? "").replace(/\D/g, "") || String(raw ?? "").trim();

// Tekst til bekræftelsen før en besked sendes.
export function confirmSendText(count, productCount) {
  const who = count === 0 ? "Ingen brugere har dem som favorit, scannet dem de seneste 90 dage eller har dem på en indkøbsliste"
    : count === 1 ? "1 bruger vil modtage en varsling"
    : `${count} brugere vil modtage en varsling`;
  return `${who}. Send tilbagekaldelsen for ${productCount} ${productCount === 1 ? "produkt" : "produkter"}? Det kan ikke fortrydes.`;
}

// ── Ny administration (16. okt. 2026) ───────────────────────────────────────────────────────────────────────────────────────────────
// Tre visninger: Afventer gennemgang (kræver administratorens handling), Varslet (besked lagt i kø/sendt) og Arkiv (arkiveret og annulleret). Arkivering ændrer kun
// administrationens visning: brugerappen viser en tilbagekaldelse ud fra status ready/archived og offentliggørelsesdato (60 dage), ikke ud fra en tidligere push.

export const NEW_VIEWS = /** @type {Array<[string, string]>} */ ([["needs_review", "Afventer gennemgang"], ["ready", "Varslet"], ["archive", "Arkiv"]]);
export const VIEW_STATUSES = /** @type {Record<string, string[]>} */ ({ needs_review: ["needs_review"], ready: ["ready"], archive: ["archived", "cancelled"] });
export const STATUS_TEXT = /** @type {Record<string, string>} */ ({ needs_review: "Afventer gennemgang", ready: "Varslet", archived: "Arkiveret", cancelled: "Annulleret" });
export const MATCH_LABEL = /** @type {Record<string, string>} */ ({ confirmed: "Bekræftet match", possible: "Muligt match", not_covered: "Ikke omfattet", not_found: "Ikke fundet i EatSafe", unverified: "Ugyldig stregkode" });
export const MATCH_PILL = /** @type {Record<string, string>} */ ({ confirmed: "admin-pill-green", possible: "admin-pill-amber", not_covered: "admin-pill-neutral", not_found: "admin-pill-neutral", unverified: "admin-pill-red" });
export const FLAG_TEXT = /** @type {Record<string, string>} */ ({
  no_barcode: "Ingen stregkode angivet", invalid_barcode: "Stregkoden har ugyldigt kontrolciffer", no_batch_info: "Parti- og datooplysninger mangler: alle partier kan være omfattet, kontrollér kilden",
  lot_date_pairing_unknown: "Det er ikke angivet, hvilke datoer der hører til hvilke partier.", no_name: "Produktnavn kunne ikke læses", sentence_only: "Teksten ligner en sætning, ikke et produkt",
});
export const RECALL_PERIODS = /** @type {Array<[string, string]>} */ ([["", "Alle datoer"], ["30", "Seneste 30 dage"], ["90", "Seneste 90 dage"], ["365", "Seneste år"]]);

const dayMs = 86400_000;
/** @param {any} r */ export const isRecent = (r, now = Date.now()) => !!r.published_at && now - Date.parse(r.published_at) <= 14 * dayMs;

/** Antal pr. visning. @param {any[]} recalls */
export function viewCounts(recalls) {
  /** @type {Record<string, number>} */ const out = {};
  for (const [v] of NEW_VIEWS) out[v] = recalls.filter((r) => VIEW_STATUSES[v].includes(r.status)).length;
  return out;
}

/** Berørte produkter som strukturerede data (udtrukket af den gemte tekst). Stregkoder uden for en produktblok vises som egen række. @param {any} r */
export function recallProducts(r) {
  const entries = extractAffectedProducts(r.affected || "");
  const seen = new Set(entries.flatMap((e) => e.eans.map((x) => x.code)));
  const extra = (r.eans || []).filter((/** @type {string} */ e) => !seen.has(e));
  for (const code of extra) entries.push({ name: "", brand: null, net: null, article_no: null, eans: [{ code, kind: code.length === 14 && /^[1-8]/.test(code) ? "carton" : "unknown", valid: true }], lots: [], production_dates: [], best_before: [], flags: ["no_name"], uncertain: true, raw: "" });
  for (const code of r.unverified_eans || []) if (!seen.has(code)) entries.push({ name: "", brand: null, net: null, article_no: null, eans: [{ code, kind: "unknown", valid: false }], lots: [], production_dates: [], best_before: [], flags: ["invalid_barcode"], uncertain: true, raw: "" });
  return entries;
}

/** Alle skrivemåder af stregkoderne (inkl. udledt salgsenhed for kartoner), til ét produktopslag. @param {any[]} entries */
export function lookupCodes(entries) {
  const codes = new Set();
  for (const e of entries) for (const x of e.eans) {
    if (!x.valid) continue;
    for (const v of eanVariants(x.code)) codes.add(v);
    const unit = deriveUnitFromCarton(x.code);
    if (unit) for (const v of eanVariants(unit)) codes.add(v);
  }
  return [...codes];
}

/**
 * Matchniveau pr. stregkode i en produktblok. Produktnavn alene afgør aldrig noget.
 *  confirmed: salgsenhedens stregkode findes som produkt, og siden angiver partioplysninger (lot eller datoer).
 *  possible: stregkoden findes, men partioplysninger mangler, eller koden er en kartonkode, hvor kun salgsenheden er udledt.
 *  not_found: ingen produkt i EatSafe. not_covered kommer kun fra administratorens afgørelse med begrundelse.
 * @param {any} entry @param {Record<string, any>} byEan @param {Record<string, any>} overrides stregkode → recall_matches-række
 */
export function matchEntry(entry, byEan, overrides = {}, opts = {}) {
  const hasBatch = entry.lots.length > 0 || entry.best_before.length > 0 || entry.production_dates.length > 0;
  const allBatches = !!opts.allBatches;
  const findProduct = (/** @type {string} */ code) => eanVariants(code).map((v) => byEan[v]).find(Boolean) || null;
  return entry.eans.map((/** @type {{ code: string, kind: string, valid: boolean }} */ x) => {
    const override = overrides[x.code];
    if (override) return { code: x.code, kind: x.kind, level: override.level, product: findProduct(x.code), basis: override.basis, decidedBy: override.decided_by, decidedAt: override.decided_at, manual: true };
    if (!x.valid) return { code: x.code, kind: x.kind, level: "unverified", product: null, basis: "Stregkoden består ikke kontrolcifferet og matches ikke automatisk", manual: false };
    if (x.kind === "carton") {
      const unit = deriveUnitFromCarton(x.code);
      const product = unit ? findProduct(unit) : null;
      return { code: x.code, kind: "carton", unit, level: product ? "possible" : "not_found", product, basis: product ? `Kartonkode: salgsenheden ${unit} er udledt, og kartonen er ikke selv et produkt. Kontrollér, at salgsenheden er omfattet` : "Kartonkode uden kendt salgsenhed i EatSafe", manual: false };
    }
    const product = findProduct(x.code);
    if (!product) return { code: x.code, kind: x.kind, level: "not_found", product: null, basis: "Stregkoden findes ikke i EatSafes produktkatalog", manual: false };
    // Bekræftet kræver dokumentation for, at produktet er omfattet: siden skal udtrykkeligt omfatte alle partier. Gælder tilbagekaldelsen bestemte partier eller datoer, er stregkoden alene kun et muligt match.
    if (allBatches) return { code: x.code, kind: x.kind, level: "confirmed", product, basis: "Stregkoden matcher produktet, og siden oplyser, at alle partier er omfattet", manual: false };
    return { code: x.code, kind: x.kind, level: "possible", product, basis: hasBatch ? "Stregkoden matcher produktet, men tilbagekaldelsen gælder bestemte partier eller datoer: kontrollér parti og dato på produktet" : "Stregkoden matcher produktet, men siden angiver ingen partioplysninger: alle partier kan være omfattet", manual: false };
  });
}

/** Oplyser siden udtrykkeligt, at alle partier er omfattet? (kun dokumenteret formulering; manglende partioplysninger tæller aldrig) @param {any} r */
export function coversAllBatches(r) {
  const text = `${r.title || ""} ${r.intro || ""} ${r.affected || ""}`;
  const re = /\b(alle|samtlige)\s+(?:[\wæøå]+[\s-]+){0,2}?(partier|batches?|batchnumre|lotnumre|lotnummer|datoer|datomærkninger|holdbarhedsdatoer|produktionsdatoer)\b|\buanset\s+(parti|batch|lotnummer|holdbarhed|datomærkning|bedst før)/gi;
  for (const m of text.matchAll(re)) {
    // "Alle bedst før datoer til og med …" afgrænser datoerne og er derfor ikke alle partier
    if (/^\s*(til og med|til|frem til|indtil|før|efter|fra)\b/i.test(text.slice(m.index + m[0].length, m.index + m[0].length + 20))) continue;
    return true;
  }
  return false;
}

/** Samlet match for en tilbagekaldelse. @param {any} r @param {any[]} entries @param {Record<string, any>} byEan @param {Record<string, any>} overrides */
export function summarizeMatch(r, entries, byEan, overrides = {}) {
  const opts = { allBatches: coversAllBatches(r) };
  const all = entries.flatMap((e) => matchEntry(e, byEan, overrides, opts));
  const count = (/** @type {string} */ l) => all.filter((m) => m.level === l).length;
  /** @type {string[]} */ const reasons = [];
  if (!(r.eans || []).length) reasons.push("Ingen gyldig stregkode på siden");
  if ((r.unverified_eans || []).length) reasons.push("Tal på siden består ikke stregkodekontrollen");
  if (entries.some((e) => e.flags.includes("no_batch_info"))) reasons.push("Partioplysninger mangler for mindst ét produkt");
  if (entries.some((e) => e.flags.includes("lot_date_pairing_unknown"))) reasons.push("Parti og dato kan ikke kobles sikkert");
  if (count("possible") > 0) reasons.push("Muligt match kræver kontrol");
  const needsManual = r.status === "needs_review" || reasons.length > 0;
  return { all, confirmed: count("confirmed"), possible: count("possible"), notCovered: count("not_covered"), notFound: count("not_found"), needsManual, reasons };
}

/** Hvad mangler på siden? @param {any} r @param {any[]} entries */
export function missingInfoText(r, entries) {
  /** @type {string[]} */ const out = [];
  if (!(r.eans || []).length) out.push("gyldig stregkode");
  if (entries.length === 0 || entries.every((e) => e.flags.includes("no_batch_info"))) out.push("partinummer og datoer");
  else if (entries.some((e) => e.flags.includes("no_batch_info"))) out.push("partioplysninger for nogle produkter");
  if (!String(r.reason || "").trim()) out.push("årsag");
  if (!String(r.action || "").trim()) out.push("vejledning til forbrugeren");
  return out;
}

const norm = (/** @type {string} */ s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9æøå ]/g, " ");
const STOP = new Set(["med", "uden", "til", "fra", "som", "det", "den", "for", "tilbagekald", "tilbagekaldelse", "produkt"]);
/** Advarsel hvis et valgt produkts navn ikke ligner noget på tilbagekaldelsens tekst (beskyttelse mod forkert valg; stregkoden afgør stadig matchet). @param {{ name?: string, brand?: string }} product @param {any} r */
export function nameMismatch(product, r) {
  const hay = norm(`${r.title} ${r.affected} ${r.intro}`);
  const tokens = norm(`${product.brand || ""} ${product.name || ""}`).split(" ").filter((t) => t.length >= 4 && !STOP.has(t));
  if (tokens.length === 0) return false;
  return !tokens.some((t) => hay.includes(t));
}

/** Søgning på titel, tekst, stregkode (også uden foranstillede nuller) og lotnumre. @param {any[]} recalls @param {string} q */
export function searchRecalls(recalls, q) {
  const s = norm(q).trim();
  const digits = String(q || "").replace(/\D/g, "");
  if (!s && !digits) return recalls;
  return recalls.filter((r) => {
    const text = norm(`${r.title} ${r.intro} ${r.affected} ${r.reason} ${r.raw_text || ""}`);
    if (s && s.length > 1 && text.includes(s)) return true;
    if (digits.length >= 4) {
      const stripped = digits.replace(/^0+/, "");
      if ([...(r.eans || []), ...(r.unverified_eans || [])].some((e) => e.replace(/^0+/, "").includes(stripped))) return true;
      if (String(r.affected || "").replace(/\s/g, "").includes(stripped)) return true;
    }
    return false;
  });
}

/** Filtrering og sortering til listen (nyeste først; hvad der kræver gennemgang vises altid først). @param {any[]} recalls @param {{ view?: string, q?: string, days?: string, manual?: boolean }} f */
export function listRecalls(recalls, f, now = Date.now()) {
  let list = recalls.filter((r) => (VIEW_STATUSES[f.view || "needs_review"] || []).includes(r.status));
  if (f.days) list = list.filter((r) => r.published_at && now - Date.parse(r.published_at) <= Number(f.days) * dayMs);
  if (f.manual) list = list.filter((r) => r.status === "needs_review" || !(r.eans || []).length || (r.unverified_eans || []).length > 0);
  list = searchRecalls(list, f.q || "");
  return [...list].sort((a, b) => String(b.published_at || b.created_at || "").localeCompare(String(a.published_at || a.created_at || "")));
}

// ── Synkronisering ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * Status for den daglige hentning. Et tomt resultat er aldrig bevis for noget, hvis hentningen er fejlet eller ikke kan bekræftes.
 * @param {Array<{ status: string, finished_at?: string|null, started_at: string, error_code?: string|null }>|null} runs nyeste først; null = loggen kan ikke læses
 */
export function syncStatus(runs, now = Date.now()) {
  if (runs === null) return { state: "unknown", text: "Synkroniseringsstatus kan ikke hentes lige nu", lastOkAt: null };
  const done = runs.filter((r) => r.status !== "running");
  if (done.length === 0) return { state: "unknown", text: "Ingen registrerede synkroniseringer endnu", lastOkAt: null };
  const lastOk = done.find((r) => r.status === "ok" || r.status === "partial");
  const last = done[0];
  const lastOkAt = lastOk?.finished_at || lastOk?.started_at || null;
  if (last.status === "failed") return { state: "failed", text: "Seneste hentning fra Fødevarestyrelsen mislykkedes", lastOkAt, code: last.error_code || null };
  if (lastOkAt && now - Date.parse(lastOkAt) > 36 * 3600_000) return { state: "stale", text: "Hentningen har ikke kørt det seneste døgn", lastOkAt };
  return { state: last.status === "partial" ? "partial" : "ok", text: last.status === "partial" ? "Seneste hentning lykkedes delvist" : "Hentning fra Fødevarestyrelsen virker", lastOkAt };
}
export const SYNC_ERROR_TEXT = /** @type {Record<string, string>} */ ({ tomt_feed: "Fødevarestyrelsens feed var tomt eller kunne ikke læses.", kilde_svarer_ikke: "Fødevarestyrelsens side svarede ikke.", sync_fejlede: "", afbrudt: "Hentningen blev afbrudt." });

// ── Historik ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** @param {any[]} events @param {(id: string|null|undefined) => string} nameOf */
export function recallHistory(events, nameOf) {
  return (events || []).map((e) => {
    const d = e.details || {};
    const by = e.actor_id ? nameOf(e.actor_id) : "Automatisk (synkronisering)";
    const text = ({
      imported: `Importeret fra Fødevarestyrelsen${d.status ? ` (${STATUS_TEXT[d.status] || d.status})` : ""}`,
      updated: `Kilden er ændret${d.aendret?.length ? `: ${d.aendret.join(", ")}` : ""}${d.varsling ? ". Opdateringsbesked lagt i kø" : ""}`,
      linked: `Produkter knyttet (${(d.eans || []).length}) og besked lagt i kø${d.note ? `. Note: ${d.note}` : ""}`,
      archived: `Arkiveret uden besked${d.note ? `. Note: ${d.note}` : ""}`,
      cancelled: `Annulleret${d.af ? ` (${d.af})` : ""}. Ingen ny besked sendt af administrator`,
      match_decided: `Match for ${d.ean}: ${MATCH_LABEL[d.niveau] || d.niveau}. Begrundelse: ${d.begrundelse}`,
      sync_error: "Fejl ved hentning",
      note: d.note || "Note",
    }[/** @type {string} */ (e.kind)]) || e.kind;
    return { key: `e${e.id}`, at: e.created_at, by, text };
  }).sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

// ── Varsling ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Tal til "Varsling": afsendt = accepteret af push-/mailtjenesten; levering bekræftes ikke og opgøres ikke. @param {any} s */
export function notificationSummary(s) {
  if (!s) return null;
  const by = (/** @type {string} */ st) => (s.deliveries || []).filter((/** @type {any} */ d) => d.status === st).reduce((n, /** @type {any} */ d) => n + d.count, 0);
  return { recipients: s.recipients || 0, variants: s.by_variant || {}, sent: by("sent"), failed: by("failed"), pending: by("pending"), skipped: by("skipped"), queued: s.queued || null };
}
