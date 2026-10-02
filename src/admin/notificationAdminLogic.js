// Ren logik til admin → Notifikationer: navne, gruppering og forhåndsvisning af push.
import { DEFINITIONS, renderNotification, validatePushOverride, pushVariablesFor, PUSH_TITLE_MAX, PUSH_BODY_MAX } from "../../supabase/functions/_shared/notificationContent.js";
import { mockDataFor } from "../../supabase/functions/_shared/notificationMock.js";

import { RESEND_TEMPLATES } from "../../supabase/functions/_shared/mailSend.ts";

/** Direkte link til notifikationens mailskabelon i Resend (null hvis varianten ikke har nogen mail). */
export function resendTemplateUrl(key) {
  const id = RESEND_TEMPLATES[key];
  return id ? `https://resend.com/templates/${id}` : null;
}

export { PUSH_TITLE_MAX, PUSH_BODY_MAX, pushVariablesFor, validatePushOverride };

export const NOTIFICATION_NAMES = {
  "N2a:default": "Produkt godkendt",
  "N2b:default": "Rettelse godkendt",
  "N3:default": "Indsendelse afvist",
  "N4:default": "Manglende produkt fundet",
  "N5:default": "Invitation accepteret",
  "N6:in_progress": "Ticket: i gang",
  "N6:resolved": "Ticket: løst",
  "N6:reopened": "Ticket: genåbnet",
  "N6:reply": "Ticket: svar fra teamet",
  "P1:default": "Allergener ændret på produkt",
  "P2:default": "Invitation udløber snart",
  "P3:one": "Delt indkøbsliste: én vare",
  "P3:many": "Delt indkøbsliste: flere varer",
  "P6:default": "Tilbagekaldelse",
};

export const CATEGORY_LABELS = {
  submission_status: "Indsendelser",
  family: "Familie",
  ticket_status: "Tickets",
  recalls: "Tilbagekaldelser",
  product_changes: "Produktændringer",
  shared_lists: "Delte lister",
};

export const VARIABLE_LABELS = {
  productName: "Produktnavn", reason: "Begrundelse", memberName: "Medlemmets navn", ticketExcerpt: "Uddrag af tilbagemelding",
  message: "Teamets besked", expiresAt: "Udløbstidspunkt", changeSummary: "Hvad er ændret", listName: "Listens navn",
  adders: "Hvem har tilføjet", countText: "Antal varer", itemList: "Tilføjede varer", recallReason: "Årsag", affectedBatches: "Berørte partier", recallAction: "Anvisning", recallUrl: "Link",
};

/** Alle notifikationer som en liste, grupperet efter kategori. */
export function listNotifications() {
  const groups = new Map();
  for (const [key, def] of Object.entries(DEFINITIONS)) {
    const label = CATEGORY_LABELS[def.category] ?? def.category;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push({ key, name: NOTIFICATION_NAMES[key] ?? key, def });
  }
  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}

export function defaultPush(key) {
  const d = DEFINITIONS[key]?.push;
  return { title: d?.title ?? "", body: d?.body ?? "" };
}

/** Push som den ser ud med eksempeldata. draft: { title, body } (tom = standard). */
export function previewPush(key, draft) {
  const r = renderNotification(key, mockDataFor(key), { pushOverride: draft });
  return { title: r.pushTitle, body: r.pushBody, mailSubject: r.mail.subject };
}

export function overrideIsActive(row) {
  return !!(row && (String(row.title ?? "").trim() || String(row.body ?? "").trim()));
}
