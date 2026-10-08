// supabase/functions/report-unrequested-reset/index.ts
//
// "Det var ikke mig" i glemt-adgangskode-mailen (1. okt. 2026, to do 1a1e600b). Siden
// public/uventet-nulstilling.html sender token fra mailen hertil (POST {"token":"…"}) efter et klik på en knap
// (ikke ved selve linkåbningen, så mailscannere ikke giver falske alarmer).
//
// Auth-kategori (se .claude/rules/edge-function-auth.md): signeret token-link. verify_jwt er slået fra, fordi kalderen
// ikke er logget ind; i stedet kontrolleres HMAC-signaturen og udløbet (_shared/reportLink.ts, nøgle = SEND_EMAIL_HOOK_SECRET).
// Uden gyldig token svares 400, og intet læses eller skrives.
//
// Ved en gyldig token: gemmer en række i security_reports (højst én pr. bruger pr. time), opretter en høj-prioritets
// opgave på den fælles to do-liste og mailer admins. Kontoen låses ikke, og der ændres intet ved den. Svaret er det
// samme, uanset om brugeren findes (afslører ikke noget).

import { createClient } from "jsr:@supabase/supabase-js@2.117.2";
import { verifyReportToken } from "../_shared/reportLink.ts";
import { sendHtmlMail, escapeHtml } from "../_shared/mailSend.ts";

const ALLOWED_ORIGINS = ["https://www.eatsafe.dk", "https://www.eatsafe.dk"];
const KIND = "unrequested_password_reset";
const PER_USER_WINDOW_MS = 60 * 60 * 1000;
const GLOBAL_MAIL_CAP_PER_HOUR = 30;

const cors = (req: Request) => {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });

function adminMailHtml(email: string, at: string): string {
  const row = (k: string, v: string) => `<tr><td style="padding:4px 16px 4px 0;color:#15201A;opacity:.72;">${k}</td><td style="padding:4px 0;color:#15201A;">${v}</td></tr>`;
  return `<!DOCTYPE html><html lang="da"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:24px;background-color:#F6F8F3;font-family:Arial,Helvetica,sans-serif;color:#15201A;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;margin:0 auto;background-color:#FFFFFF;border-radius:12px;"><tr><td style="padding:28px 32px;font-size:15px;line-height:24px;color:#15201A;">
<h1 style="margin:0 0 12px;font-size:22px;line-height:28px;color:#15201A;">Uventet nulstilling af adgangskode</h1>
<p style="margin:0 0 16px;color:#15201A;">En bruger har trykket "Det var ikke mig" i glemt-adgangskode-mailen. Det tyder på, at nogen har indtastet adressen under Glemt adgangskode. Der er ikke ændret noget ved kontoen.</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:22px;">${row("E-mail", escapeHtml(email))}${row("Tidspunkt", escapeHtml(at))}</table>
<p style="margin:16px 0 0;color:#15201A;">Der ligger en opgave med høj prioritet på to do-listen i admin-panelet (eatsafe.dk/admin.html).</p>
</td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  const secret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "";
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!secret || !url || !serviceKey) return json(req, { error: "not_configured" }, 500);

  let token = "";
  try {
    const raw = await req.text();
    if (raw.length > 2000) return json(req, { error: "invalid" }, 400);
    token = String(JSON.parse(raw)?.token ?? "");
  } catch {
    return json(req, { error: "invalid" }, 400);
  }

  const verified = await verifyReportToken(secret, token);
  if (!verified.ok) return json(req, { error: verified.reason }, 400);

  const supabase = createClient(url, serviceKey);
  const logError = async (message: string, context: Record<string, unknown> = {}) => {
    try { await supabase.rpc("log_client_error", { p_message: message, p_source: "edge:report-unrequested-reset", p_context: context }); } catch { /* aldrig blokere */ }
  };

  try {
    const { data: user } = await supabase.from("users").select("id, email").eq("id", verified.userId).maybeSingle();
    if (!user?.email) return json(req, { ok: true }); // kontoen findes ikke (mere): intet at gøre

    const since = new Date(Date.now() - PER_USER_WINDOW_MS).toISOString();
    const { data: recent } = await supabase.from("security_reports").select("id").eq("user_id", user.id).eq("kind", KIND).gte("created_at", since).limit(1);
    if (recent && recent.length > 0) return json(req, { ok: true }); // allerede indberettet inden for den seneste time

    const { data: report, error: insErr } = await supabase.from("security_reports").insert({ user_id: user.id, kind: KIND }).select("id").single();
    if (insErr || !report) throw new Error(`security_reports: ${insErr?.message ?? "ingen række"}`);

    // For mange indberetninger på kort tid: gem dem, men send ikke flere mails/opgaver (beskytter mod oversvømmelse)
    const { count } = await supabase.from("security_reports").select("id", { count: "exact", head: true }).gte("created_at", since);
    if ((count ?? 0) > GLOBAL_MAIL_CAP_PER_HOUR) return json(req, { ok: true });

    const at = new Date().toLocaleString("da-DK", { timeZone: "Europe/Copenhagen" });
    const { data: todo } = await supabase.from("admin_todos").insert({
      title: `Mulig uønsket nulstilling af adgangskode: ${user.email}`,
      description: `Brugeren trykkede "Det var ikke mig" i glemt-adgangskode-mailen (${at}). Nogen har sandsynligvis indtastet adressen under Glemt adgangskode. Intet er ændret ved kontoen. Overvej at kontakte brugeren, og tjek om flere konti er ramt (tabellen security_reports).`,
      priority: "high",
      track: "drift",
    }).select("id").single();
    if (todo?.id) await supabase.from("security_reports").update({ todo_id: todo.id }).eq("id", report.id);

    const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    if (apiKey) {
      const { data: admins } = await supabase.from("users").select("email").eq("role", "admin");
      for (const a of admins ?? []) {
        if (!a.email) continue;
        const res = await sendHtmlMail({ apiKey, to: a.email, subject: "Uventet nulstilling af adgangskode – EatSafe", html: adminMailHtml(user.email, at), idempotencyKey: `report-${report.id}-${a.email}` });
        if (!res.ok) await logError(`Admin-mail kunne ikke sendes: ${res.error}`, { report_id: report.id });
      }
    }
    return json(req, { ok: true });
  } catch (e) {
    await logError(String((e as Error)?.message ?? e));
    return json(req, { error: "server_error" }, 500);
  }
});
