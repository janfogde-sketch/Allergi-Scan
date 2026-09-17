// supabase/functions/admin-digest/index.ts
// Kører ugentligt via pg_cron — sender en email til alle admins med antal
// afventende indsendelser og åbne tickets. Sender KUN en email hvis der
// reelt er noget der venter (undgår ugentlig støj i en tom uge).
//
// pg_cron setup (jobid 4, "admin-digest"):
//   select cron.schedule('admin-digest', '0 8 * * 1', $cmd$
//     select net.http_post(
//       url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/admin-digest',
//       headers := jsonb_build_object(
//         'Content-Type', 'application/json',
//         'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
//       ),
//       body := '{}'::jsonb,
//       timeout_milliseconds := 30000
//     );
//   $cmd$);

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Kaldes udelukkende af vores eget pg_cron-job — samme mønster som
  // weekly-digest/auto-reparse (se deres header-kommentarer). Kræver at
  // kalderen identificerer sig med service-role-nøglen, ellers kunne enhver
  // udenfra udløse email-afsendelse til admins.
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Ikke autoriseret" }), {
      status: 401, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { count: pendingSubmissions } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: openTickets } = await supabase
      .from("feedback_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");

    const submissionsN = pendingSubmissions ?? 0;
    const ticketsN = openTickets ?? 0;

    if (submissionsN === 0 && ticketsN === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "Intet afventer" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data: admins } = await supabase
      .from("users")
      .select("id, email")
      .eq("role", "admin");

    if (!admins || admins.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "Ingen admins fundet" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const rows = [
      submissionsN > 0 ? `<tr><td style="padding:8px 12px;font-size:28px;font-weight:800;color:#B5791A;">${submissionsN}</td><td style="padding:8px 12px;color:#333;">indsendelse${submissionsN !== 1 ? "r" : ""} afventer godkendelse</td></tr>` : "",
      ticketsN > 0 ? `<tr><td style="padding:8px 12px;font-size:28px;font-weight:800;color:#C8402E;">${ticketsN}</td><td style="padding:8px 12px;color:#333;">åben${ticketsN !== 1 ? "e" : ""} ticket${ticketsN !== 1 ? "s" : ""}</td></tr>` : "",
    ].filter(Boolean).join("");

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#178A50;">EatSafe — ugentligt overblik</h2>
        <p style="color:#555;">Her er hvad der venter på jer i admin-panelet lige nu:</p>
        <table style="border-collapse:collapse;margin:16px 0;">${rows}</table>
        <a href="https://eatsafe.dk" style="display:inline-block;background:#178A50;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;">Åbn admin-panelet →</a>
      </div>
    `;
    const subject = `EatSafe: ${submissionsN > 0 ? `${submissionsN} indsendelse${submissionsN !== 1 ? "r" : ""}` : ""}${submissionsN > 0 && ticketsN > 0 ? " · " : ""}${ticketsN > 0 ? `${ticketsN} åben${ticketsN !== 1 ? "e" : ""} ticket${ticketsN !== 1 ? "s" : ""}` : ""} venter`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    let sent = 0;
    for (const admin of admins) {
      if (!admin.email) continue;
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ type: "raw", to: admin.email, subject, html }),
        });
        if (res.ok) sent++;
        else console.error("admin-digest send-email fejl:", admin.email, await res.text());
      } catch (e) {
        console.error("admin-digest fejl for admin:", admin.email, e);
      }
    }

    return new Response(JSON.stringify({ sent, pending_submissions: submissionsN, open_tickets: ticketsN }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
