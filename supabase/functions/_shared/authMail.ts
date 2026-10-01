// supabase/functions/_shared/authMail.ts
//
// Bygger Supabase Auths mails til Send Email Hook (edge-funktionen auth-send-email) ud fra hook-nyttelasten.
// Ren logik uden netværk, så den kan testes (src/authMail.test.js). Mailens tekst kommer fra
// supabase/templates/auth/ (via den genererede authMailTemplates.ts); samme HTML kan også sættes som
// Supabase Auth-skabelon, hvis hook'en slås fra.

import { AUTH_MAIL_TEMPLATES } from "./authMailTemplates.ts";
import { escapeHtml } from "./mailSend.ts";

export type AuthHookPayload = {
  user?: { id?: string; email?: string; new_email?: string };
  email_data?: {
    token?: string; token_hash?: string; redirect_to?: string; email_action_type?: string; site_url?: string;
    token_new?: string; token_hash_new?: string;
  };
};
export type AuthMail = { to: string; subject: string; html: string; template: string };

export class AuthMailError extends Error {}

/** email_action_type → skabelon. Notifikationer (fx password_changed_notification) har ingen skabelon og springes over. */
const ACTION_TEMPLATE: Record<string, string> = {
  signup: "confirmation",
  invite: "invite",
  magiclink: "magic_link",
  email: "magic_link",
  recovery: "recovery",
  email_change: "email_change",
  reauthentication: "reauthentication",
};

/** Typer, der bruger et bekræftelseslink (reauthentication er kun en kode). */
const NEEDS_LINK = new Set(["signup", "invite", "magiclink", "email", "recovery", "email_change"]);

export function confirmationUrl(supabaseUrl: string, tokenHash: string, type: string, redirectTo?: string): string {
  const base = supabaseUrl.replace(/\/+$/, "");
  const q = `token=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;
  return `${base}/auth/v1/verify?${q}${redirectTo ? `&redirect_to=${encodeURIComponent(redirectTo)}` : ""}`;
}

/** Erstatter Go-skabelon-pladsholdere ({{ .Navn }}) med HTML-escapede værdier; ukendte bliver tomme. */
export function renderAuthTemplate(html: string, vars: Record<string, string | undefined>): string {
  return html.replace(/\{\{\s*\.(\w+)\s*\}\}/g, (_m, name: string) => escapeHtml(vars[name] ?? ""));
}

const isEmail = (s?: string): s is string => typeof s === "string" && /^[^\s@]+@[^\s@]+$/.test(s);

/** "Det var ikke mig"-linket i recovery-skabelonen ligger mellem disse markører; uden ReportURL fjernes hele blokken. */
const REPORT_BLOCK = /<!--report:start-->[\s\S]*?<!--report:end-->\n?/g;
const REPORT_MARKERS = /<!--report:(?:start|end)-->\n?/g;
export const stripReportBlock = (html: string): string => html.replace(REPORT_BLOCK, "");

function make(template: string, to: string, vars: Record<string, string | undefined>): AuthMail {
  const t = AUTH_MAIL_TEMPLATES[template];
  if (!t) throw new AuthMailError(`Ukendt skabelon: ${template}`);
  const html = vars.ReportURL ? t.html.replace(REPORT_MARKERS, "") : stripReportBlock(t.html);
  return { to, subject: t.subject, html: renderAuthTemplate(html, vars), template };
}

/**
 * Hook-nyttelast → de mails, der skal sendes (0, 1 eller 2). Kaster AuthMailError ved en ugyldig nyttelast.
 * Ved skift af e-mail med "Secure email change" sendes to mails: til den nuværende adresse (token + token_hash_new)
 * og til den nye (token_new + token_hash) — feltnavnene er byttet om af hensyn til bagudkompatibilitet (Supabase-dokumentationen).
 * extra.ReportURL (kun recovery): signeret "Det var ikke mig"-link; uden det udelades linket i mailen.
 */
export function buildAuthMails(payload: AuthHookPayload, supabaseUrl: string, extra: { ReportURL?: string } = {}): AuthMail[] {
  const user = payload?.user;
  const data = payload?.email_data;
  if (!user || !data) throw new AuthMailError("Ugyldig nyttelast");
  const type = String(data.email_action_type ?? "");
  const template = ACTION_TEMPLATE[type];
  if (!template) return []; // fx notifikationer: ingen skabelon, intet at sende
  if (!isEmail(user.email)) throw new AuthMailError("Mangler modtager");

  const link = (hash?: string) => {
    if (!hash) throw new AuthMailError("Mangler token_hash");
    return confirmationUrl(supabaseUrl, hash, type, data.redirect_to);
  };
  const base = { Email: user.email, NewEmail: user.new_email ?? "", SiteURL: data.site_url ?? "" };

  if (type === "email_change") {
    if (!isEmail(user.new_email)) throw new AuthMailError("Mangler ny e-mailadresse");
    if (data.token_hash_new && data.token_new) {
      return [
        make(template, user.email, { ...base, Token: data.token, ConfirmationURL: link(data.token_hash_new) }),
        make(template, user.new_email, { ...base, Token: data.token_new, ConfirmationURL: link(data.token_hash) }),
      ];
    }
    // Uden "Secure email change" sendes én mail til den nye adresse
    const hash = data.token_hash || data.token_hash_new;
    return [make(template, user.new_email, { ...base, Token: data.token || data.token_new, ConfirmationURL: link(hash) })];
  }

  const vars = { ...base, Token: data.token, ConfirmationURL: NEEDS_LINK.has(type) ? link(data.token_hash) : "", ReportURL: type === "recovery" ? extra.ReportURL : undefined };
  if (type === "reauthentication" && !data.token) throw new AuthMailError("Mangler kode");
  return [make(template, user.email, vars)];
}
