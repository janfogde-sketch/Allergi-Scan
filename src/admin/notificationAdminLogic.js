// @ts-check
// Ren logik til admin → Notifikationer: navne, gruppering og forhåndsvisning af push.
import { DEFINITIONS, renderNotification, validatePushOverride, pushVariablesFor, PUSH_TITLE_MAX, PUSH_BODY_MAX } from "../../supabase/functions/_shared/notificationContent.js";
import { mockDataFor } from "../../supabase/functions/_shared/notificationMock.js";

import { RESEND_TEMPLATES } from "../../supabase/functions/_shared/mailSend.ts";
import { LIST_MAIL_KEYS } from "../../supabase/functions/_shared/listMail.ts";

/** Mails, der sendes som HTML fra projektets kildefil og ikke via en skabelon i Resend (delt indkøbsliste). */
export const isSentFromRepo = (key) => LIST_MAIL_KEYS.has(key);

/** Direkte link til notifikationens mailskabelon i Resend (null hvis varianten ikke har nogen mail). */
export function resendTemplateUrl(key) {
  const id = RESEND_TEMPLATES[key];
  return id ? `https://resend.com/templates/${id}` : null;
}

export { PUSH_TITLE_MAX, PUSH_BODY_MAX, pushVariablesFor, validatePushOverride };

const NOTIFICATION_NAMES = {
  "N2a:default": "Produkt godkendt",
  "N2b:default": "Rettelse godkendt",
  "N3:default": "Indsendelse afvist",
  "N4:default": "Manglende produkt fundet",
  "N5:default": "Invitation accepteret",
  "N10:default": "Anmodning om forbindelse (delt link)",
  "N11:approved": "Anmodning godkendt (delt link)",
  "N11:declined": "Anmodning ikke godkendt (delt link)",
  "N6:in_progress": "Ticket: i gang",
  "N6:resolved": "Ticket: løst",
  "N6:reopened": "Ticket: genåbnet",
  "N6:reply": "Ticket: svar fra teamet",
  "P1:default": "Allergener ændret på produkt",
  "P2:default": "Invitation udløber snart",
  "P3:one": "Delt indkøbsliste: én vare",
  "P3:many": "Delt indkøbsliste: flere varer",
  "P6:default": "Tilbagekaldelse",
  "P6:cancelled": "Tilbagekaldelse annulleret",
  "P6:updated": "Tilbagekaldelse ændret",
};

/** Brugerrettede kategorier i den rækkefølge, de vises. De interne navne (nøglerne) vises aldrig. */
export const CATEGORY_LABELS = {
  submission_status: "Indsendelser",
  missing_product_found: "Manglende produkter",
  family: "Familie",
  feedback: "Feedback",
  product_changes: "Produktændringer",
  recalls: "Tilbagekaldelser",
  shared_lists: "Delte lister",
};

/** Skabelonernes navne i Resend (til fanen Mail). */
export const MAIL_TEMPLATE_NAMES = {
  "N2a:default": "Produkt godkendt", "N2b:default": "Rettelse godkendt", "N3:default": "Indsendelse afvist", "N4:default": "Produkt tilføjet",
  "N5:default": "Familieinvitation accepteret", "N6:in_progress": "Feedback (i gang)", "N6:resolved": "Feedback (løst)", "N6:reopened": "Feedback (genåbnet)",
  "N6:reply": "Nyt svar på feedback", "P1:default": "Ændrede allergenoplysninger", "P2:default": "Invitation udløber", "P3:one": "Delt indkøbsliste", "P3:many": "Delt indkøbsliste",
  "P6:default": "Tilbagekaldelse", "P6:cancelled": "Tilbagekaldelse", "P6:updated": "Tilbagekaldelse",
};

export const VARIABLE_LABELS = {
  productName: "Produktnavn", reason: "Begrundelse", memberName: "Medlemmets navn", ticketExcerpt: "Uddrag af feedback",
  message: "Teamets besked", expiresAt: "Udløbstidspunkt", changeSummary: "Hvad er ændret", listName: "Listens navn",
  adders: "Hvem har tilføjet", countText: "Antal varer", itemList: "Tilføjede varer", recallReason: "Årsag", affectedBatches: "Berørte partier", recallAction: "Anvisning", recallUrl: "Link",
};

/** Alle notifikationer som en liste, grupperet efter kategori. */
export function listNotifications() {
  const groups = new Map();
  for (const [key, def] of Object.entries(DEFINITIONS)) {
    const label = CATEGORY_LABELS[def.category] ?? "Øvrige";
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push({ key, name: NOTIFICATION_NAMES[key] ?? key, def });
  }
  const order = Object.values(CATEGORY_LABELS);
  return [...groups.entries()].map(([label, items]) => ({ label, items })).sort((x, y) => (order.indexOf(x.label) + 1 || 99) - (order.indexOf(y.label) + 1 || 99));
}

export function defaultPush(key) {
  const d = DEFINITIONS[key]?.push;
  return { title: d?.title ?? "", body: d?.body ?? "" };
}

/** Push som den ser ud med eksempeldata. draft: { title, body } (tom = standard). */
export function previewPush(key, draft) {
  const r = renderNotification(key, mockDataFor(key), { pushOverride: draft });
  return { title: r.pushTitle, body: r.pushBody, mailSubject: r.mail?.subject ?? null };
}

export function overrideIsActive(row) {
  return !!(row && (String(row.title ?? "").trim() || String(row.body ?? "").trim()));
}

/**
 * Sætter {{variabel}} ind ved markørens placering (eller erstatter det markerede). Returnerer den nye tekst og markørens nye placering.
 * @param {string} text @param {number} start @param {number} end @param {string} name
 */
export function insertVariableAt(text, start, end, name) {
  const s = Math.max(0, Math.min(start ?? text.length, text.length));
  const e = Math.max(s, Math.min(end ?? s, text.length));
  const token = `{{${name}}}`;
  return { text: text.slice(0, s) + token + text.slice(e), cursor: s + token.length };
}

/** Er tekstfelterne uændrede i forhold til det gemte (eller standarden)? @param {{title:string, body:string}} a @param {{title:string, body:string}} b */
export function sameText(a, b) {
  return a.title.trim() === b.title.trim() && a.body.trim() === b.body.trim();
}

/**
 * Samlet resultat af en testafsendelse pr. kanal. En kanal er kun lykkedes, hvis noget faktisk blev sendt; hvis kun én lykkes, er det "delvist".
 * @param {{ push?: { devices:number, sent:number, failed:number, errors?:string[] }, mail?: { sent:boolean, error?:string|null } } | null} res
 * @param {string[]} channels
 */
export function summarizeTest(res, channels) {
  if (!res) return { overall: "failed", lines: [{ channel: "all", ok: false, status: "Fejlet", text: "Testen kunne ikke gennemføres." }] };
  const lines = [];
  if (channels.includes("push")) {
    const p = res.push;
    if (!p) lines.push({ channel: "push", ok: false, status: "Fejlet", text: "Push: intet svar fra serveren." });
    else if (p.devices === 0) lines.push({ channel: "push", ok: false, status: "Fejlet", text: "Push: modtageren har ingen enhed med push slået til." });
    else if (p.sent === 0) lines.push({ channel: "push", ok: false, status: "Fejlet", text: `Push: ikke afsendt${p.errors?.length ? ` (${p.errors.join("; ")})` : ""}.` });
    else lines.push({ channel: "push", ok: p.failed === 0, partial: p.failed > 0, status: "Accepteret", text: `Push: accepteret af push-tjenesten for ${p.sent} af ${p.devices} enheder${p.failed ? ` (${p.errors?.join("; ") || "fejl"})` : ""}. Levering til telefonen bekræftes ikke.` });
  }
  if (channels.includes("mail")) {
    const m = res.mail;
    if (!m) lines.push({ channel: "mail", ok: false, status: "Fejlet", text: "Mail: intet svar fra serveren." });
    else lines.push({ channel: "mail", ok: !!m.sent, status: m.sent ? "Accepteret" : "Fejlet", text: m.sent ? "Mail: accepteret af Resend. Levering til indbakken bekræftes ikke." : `Mail: ikke afsendt (${m.error || "ukendt fejl"}).` });
  }
  const oks = lines.filter((l) => l.ok).length;
  const some = lines.some((l) => l.ok || l.partial);
  return { overall: oks === lines.length ? "ok" : some ? "partial" : "failed", lines };
}

/**
 * Gør mailens HTML klar til forhåndsvisning. Ændrer aldrig skabelonens design: logoet hentes fra den side, administrationen selv ligger på (indholdsspærren tillader kun
 * egen adresse), og lys/mørk tilstand efterlignes ved at slå skabelonens egen mørk-tilstand til eller fra. 
 * @param {string} html @param {"light"|"dark"} mode @param {string} origin
 */
export function prepareMailPreview(html, mode, origin) {
  let out = String(html || "").replace(/https:\/\/(?:www\.)?eatsafe\.dk\/brand\//g, `${origin}/brand/`);
  out = out.replace(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/g, mode === "dark" ? "@media all" : "@media not all");
  return out;
}
