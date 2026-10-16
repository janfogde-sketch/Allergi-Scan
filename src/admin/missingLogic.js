// @ts-check
// Ren logik til siden "Ukendte stregkoder": status, filtre, sortering og kontrol af stregkoden før et produkt oprettes. Intet her ændrer data.
import { eanCheck } from "./productsLogic.js";

export const MISSING_PAGE = 50;
export const MISSING_STATUS = /** @type {Array<[string, string]>} */ ([["new", "Ny"], ["in_progress", "Under behandling"], ["created", "Oprettet"], ["rejected", "Afvist"]]);
export const MISSING_STATUS_LABEL = /** @type {Record<string, string>} */ (Object.fromEntries(MISSING_STATUS));
/** Tone pr. status (samme pille-farver som øvrige sider). */
export const MISSING_STATUS_PILL = /** @type {Record<string, string>} */ ({ new: "admin-pill-amber", in_progress: "admin-pill-blue", created: "admin-pill-green", rejected: "admin-pill-neutral" });
/** Statusser, en administrator selv kan sætte. "Oprettet" afledes af produkttabellen og kan ikke sættes i hånden. */
export const MISSING_SETTABLE = /** @type {Array<[string, string]>} */ ([["new", "Ny"], ["in_progress", "Under behandling"], ["rejected", "Afvist"]]);
export const MISSING_PERIODS = /** @type {Array<[string, string]>} */ ([["", "Alle perioder"], ["7", "Seneste 7 dage"], ["30", "Seneste 30 dage"], ["90", "Seneste 90 dage"]]);
export const MISSING_SORTS = /** @type {Array<[string, string]>} */ ([["count", "Flest forgæves opslag"], ["last_seen", "Seneste forsøg"]]);

/** Parametre til databasefunktionen. @param {{ q?: string, status?: string, days?: string, sort?: string }} f @param {number} offset */
export function missingParams(f, offset = 0) {
  const q = String(f.q || "").replace(/\D/g, "");
  return {
    p_search: q || null, p_status: f.status || null, p_days: f.days ? Number(f.days) : null,
    p_sort: f.sort === "last_seen" ? "last_seen" : "count", p_limit: MISSING_PAGE + 1, p_offset: offset,
  };
}

/** Kontrol før oprettelse. Ugyldigt format blokerer ikke (interne koder findes), men advares om; navn er påkrævet. Foranstillede nuller bevares (EAN er altid tekst). @param {{ ean: string, name: string }} v */
export function validateCreate(v) {
  /** @type {Record<string, string>} */ const err = {};
  if (!String(v.name || "").trim()) err.name = "Produktnavn skal udfyldes.";
  if (!/^\d{6,14}$/.test(String(v.ean || ""))) err.ean = "Stregkoden skal være 6 til 14 cifre.";
  return err;
}
/** Advarsel om format/kontrolciffer (blokerer ikke). @param {string} ean */
export const eanWarning = (ean) => { const c = eanCheck(ean); return c.ok ? "" : c.text; };

/** Antal forsøg som tekst. @param {number} n */
export const attemptsText = (n) => `${n.toLocaleString("da-DK")} forsøg`;
