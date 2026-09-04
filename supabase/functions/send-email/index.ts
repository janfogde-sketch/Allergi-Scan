// supabase/functions/send-email/index.ts
// Sender emails via Resend med templates fra resend.com
// Rediger mail-indhold på resend.com/templates

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM = "EatSafe <noreply@eatsafe.dk>";

const TEMPLATES: Record<string, { id: string; subject: string }> = {
  welcome:             { id: "c59a0cef-a98e-4e9b-9429-b1f43d836902", subject: "Velkommen til EatSafe 🛡️" },
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

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY mangler");

    const { type, to, data = {} } = await req.json();

    if (!type || !to) {
      return new Response(JSON.stringify({ error: "type og to er påkrævet" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const template = TEMPLATES[type];
    if (!template) {
      return new Response(JSON.stringify({ error: `Ukendt email-type: ${type}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await fetchTemplateHtml(template.id, RESEND_API_KEY, data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject: template.subject, html }),
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
