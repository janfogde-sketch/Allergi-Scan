// supabase/functions/send-email/index.ts
// Sender emails via Resend med templates fra resend.com
// Rediger mail-indhold på resend.com/templates

import { TRANSACTIONAL_TEMPLATES, buildMailVariables, escapeHtml, sendTemplateMail } from "../_shared/mailSend.ts";
import { WELCOME_MAIL_SUBJECT, renderWelcomeMail } from "../_shared/welcomeMail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM = "EatSafe <noreply@eatsafe.dk>";

const TEMPLATES: Record<string, { id: string; subject: string }> = {
  submission_approved: { id: "fb81f06b-5a8b-4729-9139-37c696b82f56", subject: "Dit produkt er godkendt" },
  submission_rejected: { id: "cc9dd12d-2aaf-4395-94c7-fe15396f0d5b", subject: "Produkt ikke godkendt" },
  ticket_update:       { id: "9965c3a0-67b5-4818-bb7d-ea278fc839a4", subject: "Opdatering på din EatSafe feedback" },
};

async function fetchTemplateHtml(templateId: string, apiKey: string, data: Record<string, string>): Promise<string> {
  const res = await fetch(`https://api.resend.com/templates/${templateId}`, {
    headers: { "Authorization": `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Template hentning fejlede: ${res.status}`);
  const tpl = await res.json();

  // Resend kan returnere HTML i forskellige felter — prøv alle
  let html = tpl.html_content || tpl.html || tpl.content || tpl.body || "";

  // Hvis stadig tom, tjek nested data
  if (!html && tpl.data) {
    html = tpl.data.html_content || tpl.data.html || tpl.data.content || "";
  }

  if (!html) {
    // Log alle felter så vi kan debugge
    console.error("Template felter:", JSON.stringify(Object.keys(tpl)));
    console.error("Template data:", JSON.stringify(tpl).substring(0, 500));
    throw new Error(`Ingen HTML fundet i template. Felter: ${Object.keys(tpl).join(", ")}`);
  }

  // Erstat alle {{variabel}} med data
  for (const [key, value] of Object.entries(data)) {
    html = html.replaceAll(`{{${key}}}`, value ?? "");
  }
  return html;
}

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

    // Velkomstmailen (30. sept. 2026): sendes kun af send_welcome_after_onboarding,
    // én gang pr. bruger. Begge typer bruger HTML'en fra repoet (welcomeMail.ts),
    // så overskrift og tekst versionsstyres. Idempotency-Key forhindrer, at et
    // gentaget kald inden for 24 timer giver en ekstra mail.
    if (type === "welcome" || type === "welcome_onboarded") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `welcome-${to}` },
        body: JSON.stringify({ from: FROM, to: [to], subject: WELCOME_MAIL_SUBJECT, html: renderWelcomeMail(data.name) }),
      });
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
      const template = TEMPLATES[type];
      if (!template) {
        return new Response(JSON.stringify({ error: `Ukendt email-type: ${type}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      subject = template.subject;
      html = await fetchTemplateHtml(template.id, RESEND_API_KEY, data);
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
    console.error("send-email fejl:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
