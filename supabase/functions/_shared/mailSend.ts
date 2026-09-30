// supabase/functions/_shared/mailSend.ts
//
// Afsendelse af notifikationsmails via Resends skabeloner (supabase/templates/resend/).
// Skabelonerne bruger {{{variabel}}} (uescapet), så al tekst HTML-escapes HER, før den sendes.
// Delt af `notify` og testet i src/mailSend.test.js.

/** Notifikationsnøgle → Resend-skabelon-id (se supabase/templates/resend/catalog.json). */
export const RESEND_TEMPLATES: Record<string, string> = {
  "N2a:default": "eccf4c47-2e02-4515-82c7-c9ee437aec27",
  "N2b:default": "5afa5e9d-e411-4116-b276-fd8a4e0ee8c9",
  "N3:default": "04a09e93-25fc-4f58-b140-a37eed54b4e5",
  "N4:default": "0c406786-94ee-478f-92f0-c7042246c1c8",
  "N5:default": "a1752fb6-dbc0-461d-9365-65dddae1f8f5",
  "N6:in_progress": "75c259c2-db5c-433b-afbd-45881c632158",
  "N6:resolved": "2320eeb2-501d-4fca-827e-093920d4337f",
  "N6:reopened": "9bca4381-9e3f-42f6-ad1a-408c2c83f055",
  "N6:reply": "90abf267-b5d0-4bd9-9e9c-7b40aa26d684",
  "P1:default": "8bb93a15-91b5-4a68-b060-d200ceef2ccf",
  "P2:default": "235f8ca1-fa9b-4095-bfd2-bd1ee8751bf7",
  "P3:one": "77fab913-e8f3-4271-a824-fc592791ada1",
  "P3:many": "77fab913-e8f3-4271-a824-fc592791ada1",
};

/** Varianter, hvis mail kun sendes til modtagere, der ikke fik push (P2: valgfri mail, ikke begge som standard). */
export const MAIL_ONLY_WITHOUT_PUSH = new Set(["P2:default"]);

/** Servicemails uden besked i appen (N1 velkomst, P4 slettekvittering) — sendes af send-email/delete-user. */
export const TRANSACTIONAL_TEMPLATES: Record<string, { id: string; subject: string }> = {
  welcome_onboarded: { id: "00508c8a-ef90-4d09-be1d-d7e03d3938bf", subject: "Velkommen til EatSafe Beta" },
  account_deleted: { id: "3f0cd2e1-b3d5-4d6f-80d3-0fd09b16629b", subject: "Din EatSafe-konto er slettet" },
};

export const MAIL_FROM = "EatSafe <noreply@eatsafe.dk>";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Variabler til skabelonen: rensede værdier fra beskeden + fornavn, alle HTML-escapet. */
export function buildMailVariables(mailVars: Record<string, string>, userName?: string | null): Record<string, string> {
  const out: Record<string, string> = { name: escapeHtml((userName ?? "").trim().split(/\s+/)[0] ?? "") };
  for (const [k, v] of Object.entries(mailVars)) out[k] = escapeHtml(v);
  return out;
}

export type MailResult = { ok: boolean; status: number; retryable: boolean; id?: string; error?: string };

export async function sendTemplateMail(opts: {
  apiKey: string;
  to: string;
  templateId: string;
  variables: Record<string, string>;
  subject: string;
  idempotencyKey: string;
  fetchImpl?: typeof fetch;
}): Promise<MailResult> {
  try {
    const res = await (opts.fetchImpl ?? fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": opts.idempotencyKey,
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [opts.to],
        subject: opts.subject,
        template: { id: opts.templateId, variables: opts.variables },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, status: res.status, retryable: false, id: body?.id };
    const retryable = res.status === 429 || res.status >= 500;
    return { ok: false, status: res.status, retryable, error: `HTTP ${res.status}${body?.message ? `: ${body.message}` : ""}` };
  } catch (e) {
    return { ok: false, status: 0, retryable: true, error: String((e as Error)?.message ?? e) };
  }
}
