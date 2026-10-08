// supabase/functions/auth-send-email/index.ts
//
// Supabase Auths "Send Email Hook" (1. okt. 2026): når hook'en er slået til i Supabase Dashboard
// (Authentication → Auth Hooks → Send Email), sender Auth ikke selv mails, men kalder denne funktion,
// som sender dem fra Resend med EatSafes egne danske skabeloner (supabase/templates/auth/).
//
// Auth-kategori (se .claude/rules/edge-function-auth.md): signeret webhook. verify_jwt er slået fra, fordi
// Auth ikke sender en bruger-JWT; i stedet kontrolleres Standard Webhooks-signaturen med hemmeligheden
// SEND_EMAIL_HOOK_SECRET ("v1,whsec_…" fra Dashboard). Uden gyldig signatur svares 401, og der sendes intet.
//
// Svar: 200 med {} når alle mails er afsendt (eller der intet var at sende); ellers 4xx/5xx med
// {"error":{"http_code","message"}}, som Auth viser som en fejl (brugeren kan prøve igen).
// Slås hook'en fra, bruger Auth igen Resend-SMTP'en og de skabeloner, der er sat i Supabase.

import { createClient } from "jsr:@supabase/supabase-js@2.117.2";
import { verifyStandardWebhook } from "../_shared/standardWebhook.ts";
import { buildAuthMails, AuthMailError, type AuthHookPayload } from "../_shared/authMail.ts";
import { sendHtmlMail } from "../_shared/mailSend.ts";
import { signReportToken, buildReportUrl } from "../_shared/reportLink.ts";

const MAX_ATTEMPTS = 3;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const fail = (status: number, message: string) => json({ error: { http_code: status, message } }, status);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function logError(message: string, context: Record<string, unknown>) {
  try {
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    await createClient(url, key).rpc("log_client_error", { p_message: message, p_source: "edge:auth-send-email", p_context: context });
  } catch { /* aldrig blokere */ }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return fail(405, "Method not allowed");

  const secret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "";
  const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  if (!secret || !apiKey) {
    await logError("SEND_EMAIL_HOOK_SECRET eller RESEND_API_KEY mangler", {});
    return fail(500, "Mailafsendelse er ikke konfigureret");
  }

  const body = await req.text();
  if (!(await verifyStandardWebhook(body, req.headers, secret))) return fail(401, "Ugyldig signatur");

  let mails: ReturnType<typeof buildAuthMails>;
  let type = "";
  try {
    const payload = JSON.parse(body) as AuthHookPayload;
    type = String(payload?.email_data?.email_action_type ?? "");
    // Glemt adgangskode: signeret "Det var ikke mig"-link (kan fejle uden at blokere selve mailen)
    const extra: { ReportURL?: string } = {};
    if (type === "recovery" && payload?.user?.id) {
      try { extra.ReportURL = buildReportUrl(await signReportToken(secret, payload.user.id)); } catch { /* mailen sendes uden linket */ }
    }
    mails = buildAuthMails(payload, Deno.env.get("SUPABASE_URL") ?? "", extra);
  } catch (e) {
    if (e instanceof AuthMailError || e instanceof SyntaxError) {
      await logError(`Ugyldig hook-nyttelast: ${(e as Error).message}`, { type });
      return fail(400, "Ugyldig nyttelast");
    }
    await logError(String((e as Error)?.message ?? e), { type });
    return fail(500, "Mailen kunne ikke bygges");
  }

  // Ingen skabelon til denne type (fx en notifikation): intet at sende, men det er ikke en fejl
  if (mails.length === 0) return json({});

  const webhookId = req.headers.get("webhook-id") ?? crypto.randomUUID();
  for (const [i, mail] of mails.entries()) {
    let lastError = "";
    let sent = false;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !sent; attempt++) {
      // Samme idempotensnøgle ved gentagelser (og når Auth selv gentager hook-kaldet): Resend sender kun én gang
      const res = await sendHtmlMail({ apiKey, to: mail.to, subject: mail.subject, html: mail.html, idempotencyKey: `auth-${webhookId}-${i}` });
      if (res.ok) { sent = true; break; }
      lastError = res.error ?? "ukendt fejl";
      if (!res.retryable) break;
      await sleep(300 * attempt);
    }
    if (!sent) {
      await logError(`Auth-mail kunne ikke sendes: ${lastError}`, { type, template: mail.template });
      return fail(500, "Mailen kunne ikke sendes");
    }
  }
  return json({});
});
