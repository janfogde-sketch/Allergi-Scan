// supabase/functions/inactive-accounts/index.ts
// Opbevaring: en konto uden aktivitet i 36 måneder slettes. Først en advarselsmail (efter 35 måneder), så sletning
// tidligst 30 dage senere, hvis kontoen stadig er inaktiv (databasefunktionen inactive_accounts() afgør hvem). Sletningen sker
// med delete-user, så alt slettes på samme måde som ved en kontosletning. Kaldes dagligt af pg_cron (cleanup_inactive_accounts()),
// kun med service-role-nøglen. Body {"dry_run": true} viser kun, hvem der ville blive advaret/slettet, og sender/sletter intet.

import { createClient } from "jsr:@supabase/supabase-js@2.117.3";
import { sendHtmlMail } from "../_shared/mailSend.ts";
import { INACTIVITY_MAIL_SUBJECT, renderInactivityMail } from "../_shared/inactivityMail.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const GRACE_DAYS = 30;

Deno.serve(async (req) => {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceRoleKey || req.headers.get("Authorization") !== `Bearer ${serviceRoleKey}`) {
    return json({ error: "Ikke autoriseret" }, 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";

    const { data, error } = await supabase.rpc("inactive_accounts");
    if (error) throw new Error(error.message);
    const rows: { user_id: string; email: string; name: string | null; action: string }[] = data ?? [];
    const toWarn = rows.filter((r) => r.action === "warn");
    const toDelete = rows.filter((r) => r.action === "delete");
    if (dryRun) return json({ success: true, dry_run: true, warn: toWarn.length, delete: toDelete.length });

    const deleteDate = new Date(Date.now() + GRACE_DAYS * 86400000)
      .toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Copenhagen" });

    let warned = 0, deleted = 0, failed = 0;
    for (const r of toWarn) {
      if (!apiKey || !r.email) { failed++; continue; }
      const res = await sendHtmlMail({
        apiKey, to: r.email, subject: INACTIVITY_MAIL_SUBJECT, html: renderInactivityMail(r.name, deleteDate),
        idempotencyKey: `inactive-warn-${r.user_id}-${new Date().toISOString().slice(0, 10)}`,
      });
      // Først når mailen er afsendt, startes de 30 dage; en fejl gør, at vi prøver igen i morgen.
      if (!res.ok) { failed++; await supabase.rpc("log_client_error", { p_message: `Inaktivitetsmail fejlede: ${res.error}`, p_source: "edge:inactive-accounts" }); continue; }
      const { error: markError } = await supabase.rpc("mark_inactivity_warned", { p_user: r.user_id });
      if (markError) { failed++; continue; }
      warned++;
    }
    for (const r of toDelete) {
      const res = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
        body: JSON.stringify({ uid: r.user_id }),
      });
      if (res.ok) deleted++;
      else { failed++; await supabase.rpc("log_client_error", { p_message: `Sletning af inaktiv konto fejlede: HTTP ${res.status}`, p_source: "edge:inactive-accounts" }); }
    }
    return json({ success: true, warned, deleted, failed });
  } catch (e) {
    console.error("inactive-accounts:", e);
    return json({ error: "Oprydningen fejlede" }, 500);
  }
});
