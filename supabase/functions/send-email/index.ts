// supabase/functions/send-email/index.ts
// Sender emails via Resend med templates fra resend.com
// Rediger mail-indhold på resend.com/templates

import { TRANSACTIONAL_TEMPLATES, buildMailVariables, escapeHtml, sendTemplateMail } from "../_shared/mailSend.ts";
import { WELCOME_MAIL_SUBJECT, renderWelcomeMail } from "../_shared/welcomeMail.ts";
import { corsFor } from "../_shared/http.ts";

const corsHeaders = corsFor();

const FROM = "EatSafe <noreply@eatsafe.dk>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Kaldes udelukkende af vores egne DB-triggers (send_welcome_after_onboarding m.fl.),
  // aldrig direkte fra klienten — kræver derfor at kalderen identificerer
  // sig med service-role-nøglen. Uden dette kunne enhver udenfra sende
  // vilkårlige emails fra vores Resend-konto til en vilkårlig modtager.
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Ikke autoriseret" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY mangler");

    const { type, to, data = {}, subject: rawSubject, html: rawHtml } = await req.json();

    if (!type || !to) {
      return new Response(JSON.stringify({ error: "type og to er påkrævet" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Velkomstmailen (30. sept. 2026): EatSafes eneste velkomstmail. Sendes kun af
    // send_welcome_after_onboarding, én gang pr. bruger, med HTML'en fra repoet
    // (welcomeMail.ts), så overskrift og tekst versionsstyres. Den gamle type
    // "welcome" og skabelonen "Velkomstmail - Beta" er fjernet 1. okt. 2026.
    // Idempotency-Key forhindrer, at et gentaget kald inden for 24 timer giver en ekstra mail.
    if (type === "welcome_onboarded") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `welcome-${to}` },
        body: JSON.stringify({ from: FROM, to: [to], subject: WELCOME_MAIL_SUBJECT, html: renderWelcomeMail(data.name) }),
      });
      // 409 = nøglen er brugt inden for 24 t med anden tekst: velkomstmailen er allerede sendt til adressen (fx ved gentest samme dag), så det er ikke en serverfejl.
      if (res.status === 409) {
        return new Response(JSON.stringify({ success: true, already_sent: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!res.ok) throw new Error(`Resend fejl ${res.status}: ${await res.text()}`);
      const result = await res.json();
      return new Response(JSON.stringify({ success: true, id: result.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Nye servicemails (Resend-skabeloner med {{{variabel}}}): værdierne HTML-escapes her.
    const tt = TRANSACTIONAL_TEMPLATES[type];
    if (tt) {
      const variables: Record<string, string> = {};
      for (const [k, v] of Object.entries(data)) variables[k] = escapeHtml(v);
      if ("name" in data) variables.name = buildMailVariables({}, String(data.name ?? "")).name;
      const res = await sendTemplateMail({ apiKey: RESEND_API_KEY, to, templateId: tt.id, subject: tt.subject, variables, idempotencyKey: `${type}-${to}-${new Date().toISOString().slice(0, 10)}` });
      if (!res.ok) throw new Error(`Resend fejl: ${res.error}`);
      return new Response(JSON.stringify({ success: true, id: res.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // "raw" er til interne, admin-rettede emails (fx admin-digest) hvor
    // indholdet er dynamisk genereret data (tal/lister), ikke noget en
    // ikke-teknisk person skal kunne redigere i Resends skabelon-editor —
    // derfor ingen Resend-skabelon, bare direkte subject+html i selve kaldet.
    let subject: string;
    let html: string;
    if (type === "raw") {
      if (!rawSubject || !rawHtml) {
        return new Response(JSON.stringify({ error: "subject og html er påkrævet for type=raw" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      subject = rawSubject;
      html = rawHtml;
    } else {
      // De gamle skabeloner (submission_approved/_rejected, ticket_update) er slettet i Resend 1. okt. 2026;
      // notify sender de samme mails med N2a, N3 og N6 (Resend-skabeloner i supabase/templates/resend/).
      return new Response(JSON.stringify({ error: `Ukendt email-type: ${type}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend fejl ${res.status}: ${err}`);
    }

    const result = await res.json();
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("send-email fejl:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
