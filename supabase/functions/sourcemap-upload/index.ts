// supabase/functions/sourcemap-upload/index.ts
// Modtager source maps fra Vercel-buildet (scripts/upload-sourcemaps.mjs) og gemmer dem i den PRIVATE bøtte "sourcemaps" som <build-id>/<fil>.map.
// Auth-kategori (edge-function-auth.md): delt hemmelighed i headeren x-upload-token (funktions-secret SOURCEMAP_UPLOAD_TOKEN, samme værdi i Vercel).
// verify_jwt = false (config.toml). Uden gyldig token svares 401, før noget læses eller skrives; er secret'en ikke sat, afvises alt.
// Kortene er uden brugerdata. sourcesContent fjernes før lagring (kun placeringer skal bruges), så kortene fylder mindre og ikke gemmer kildekode.

import { createClient } from "jsr:@supabase/supabase-js@2.117.2";
import { corsFor } from "../_shared/http.ts";

const corsHeaders = corsFor();
const BUCKET = "sourcemaps";
const MAX_BYTES = 8_000_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Kun POST" }, 405);

  const secret = Deno.env.get("SOURCEMAP_UPLOAD_TOKEN") ?? "";
  const given = req.headers.get("x-upload-token") ?? "";
  if (secret.length < 16 || !sameToken(given, secret)) return json({ error: "Ikke autoriseret" }, 401);

  try {
    const body = await req.json();
    const build = String(body?.build ?? "");
    const name = String(body?.name ?? "");
    if (!/^[0-9a-f]{7}$/.test(build)) return json({ error: "build skal være 7 hexadecimale tegn" }, 400);
    if (!/^[\w.-]{1,150}\.js\.map$/.test(name)) return json({ error: "name skal være en .js.map-fil" }, 400);
    const raw = typeof body?.map === "string" ? body.map : JSON.stringify(body?.map ?? null);
    if (raw.length > MAX_BYTES) return json({ error: "Kortet er for stort" }, 413);
    let map: Record<string, unknown>;
    try { map = JSON.parse(raw); } catch { return json({ error: "map er ikke gyldig JSON" }, 400); }
    if (!map || typeof map !== "object" || typeof map.mappings !== "string" || !Array.isArray(map.sources)) return json({ error: "map er ikke et source map" }, 400);
    delete map.sourcesContent;

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { error } = await supabase.storage.from(BUCKET).upload(`${build}/${name}`, JSON.stringify(map), { contentType: "application/json", upsert: true });
    if (error) throw new Error(error.message);
    return json({ ok: true, path: `${build}/${name}` });
  } catch (e) {
    console.error("sourcemap-upload", (e as Error).message);
    return json({ error: "Upload mislykkedes" }, 500);
  }
});
