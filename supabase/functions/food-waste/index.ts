// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// food-waste — Supabase Edge Function (lukket 15. okt. 2026)
// Den tidligere prototype på madspildstilbud er fjernet (plan 15. okt. 2026 i
// projektmappen). Knappen i appen var allerede fjernet. Funktionen svarer nu altid 410 og kalder ingen ekstern tjeneste; selve
// funktionen slettes i Supabase-kontrolpanelet.
//
// Auth-kategori (se .claude/rules/edge-function-auth.md): "Kræver bruger-login".
// ─────────────────────────────────────────────────────────────────────────────

import { corsFor, getCaller } from "../_shared/http.ts";

const corsHeaders = corsFor("GET, OPTIONS");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const caller = await getCaller(req);
  if (!caller) return json({ error: "Ikke autoriseret" }, 401);
  return json({ available: false, reason: "removed" }, 410);
});
