// supabase/functions/feedback/index.ts
//
// Modtager feedback fra appen og admin-panelet (arkitektur-audit A4,
// 30. sept. 2026). Erstatter den direkte INSERT i feedback_tickets, som
// var åben for alle uden grænser, og hvor submitted_by kunne sættes til
// en vilkårlig bruger.
//
// Auth-kategori 3 (legitimt anonym, jf. .claude/rules/edge-function-auth.md):
// feedback skal kunne sendes uden login (fx fra login-skærmen), men med
// grænser:
//   * uden login: 5 pr. time pr. klient (hash af IP) og 60 pr. time i alt
//   * med login:  20 pr. time pr. bruger
// submitted_by sættes KUN ud fra et gyldigt login-token, aldrig fra body.
// IP-adressen gemmes ikke — kun en saltet SHA-256-hash i client_hash.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { validateFeedback, withinLimit } from "./validate.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "ukendt";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Kun POST" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Ugyldig forespørgsel." });
  }

  const checked = validateFeedback(body);
  if (!checked.ok) return json(checked.status, { error: checked.error });

  // Login er valgfrit. Et token, der ikke kan verificeres, behandles som
  // anonymt (fx udløbet session) i stedet for at afvise feedbacken.
  let userId: string | null = null;
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (token && token !== anonKey) {
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data } = await userClient.auth.getUser();
    userId = data?.user?.id ?? null;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const clientHash = await sha256(`${clientIp(req)}|${serviceRoleKey.slice(-16)}`);

  let recentForClient = 0;
  let recentTotalAnon = 0;
  if (userId) {
    const { count } = await admin.from("feedback_tickets").select("id", { count: "exact", head: true })
      .eq("submitted_by", userId).gte("created_at", hourAgo);
    recentForClient = count ?? 0;
  } else {
    const [mine, total] = await Promise.all([
      admin.from("feedback_tickets").select("id", { count: "exact", head: true })
        .eq("client_hash", clientHash).is("submitted_by", null).gte("created_at", hourAgo),
      admin.from("feedback_tickets").select("id", { count: "exact", head: true })
        .is("submitted_by", null).gte("created_at", hourAgo),
    ]);
    recentForClient = mine.count ?? 0;
    recentTotalAnon = total.count ?? 0;
  }

  if (!withinLimit({ isUser: !!userId, recentForClient, recentTotalAnon })) {
    return json(429, { error: "Du har sendt meget feedback på kort tid. Prøv igen om en time." });
  }

  // Skærmbilledet gemmes som fil i den lukkede bucket feedback-screenshots
  // og kun stien i tabellen, så billeder ikke fylder databasen op og ikke
  // hentes med, hver gang admin åbner tickets. Fejler upload, gemmes
  // feedbacken uden billede.
  const { image_base64: imageBase64, ...ticketFields } = checked.ticket;
  let imagePath: string | null = null;
  if (imageBase64) {
    const ext = imageBase64.startsWith("iVBOR") ? "png" : imageBase64.startsWith("UklG") ? "webp" : "jpg";
    const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    try {
      const bytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await admin.storage.from("feedback-screenshots").upload(path, bytes, { contentType });
      if (upErr) console.error("feedback billede-upload fejlede:", upErr.message);
      else imagePath = path;
    } catch (e) {
      console.error("feedback billede kunne ikke gemmes:", e);
    }
  }

  const { error } = await admin.from("feedback_tickets").insert({
    ...ticketFields,
    image_path: imagePath,
    status: "open",
    submitted_by: userId,
    client_hash: clientHash,
  });
  if (error) {
    console.error("feedback insert fejlede:", error.message);
    return json(500, { error: "Feedbacken kunne ikke gemmes. Prøv igen." });
  }

  return json(200, { success: true });
});
