// supabase/functions/symbolicate-error/index.ts
// Oversætter en minificeret stacktrace fra en fejlrapport til oprindelige filer, funktioner og linjer ud fra source maps i den private bøtte
// "sourcemaps" (<build-id>/<fil>.map, uploadet af sourcemap-upload). Auth-kategori 2: kræver admin-login (samme mønster som notify-test).
// Svarer kun med placeringer, der er verificeret af et map til netop den fil; alt andet markeres som ikke oversat. Intet gemmes.
// Body: { build: "d81f4e2", stack: "...", componentStack?: "..." }

import { createClient } from "jsr:@supabase/supabase-js@2.117.2";
import { SourceMapConsumer } from "npm:source-map-js@1.2.1";
import { corsFor, getCaller } from "../_shared/http.ts";
import { symbolicateStack } from "../_shared/symbolicate.js";

const corsHeaders = corsFor();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Kun POST" }, 405);

  const caller = await getCaller(req);
  if (!caller) return json({ error: "Ikke autoriseret" }, 401);
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const { data: roleRow } = await supabase.from("users").select("role").eq("id", caller.id).single();
  if (roleRow?.role !== "admin") return json({ error: "Kun administratorer" }, 403);

  try {
    const body = await req.json();
    const build = String(body?.build ?? "");
    const stack = typeof body?.stack === "string" ? body.stack.slice(0, 20_000) : "";
    const componentStack = typeof body?.componentStack === "string" ? body.componentStack.slice(0, 20_000) : "";
    if (!/^[0-9a-f]{7}$/.test(build)) return json({ error: "build skal være 7 hexadecimale tegn" }, 400);
    if (!stack && !componentStack) return json({ error: "stack mangler" }, 400);

    const loadMap = async (file: string) => {
      const { data, error } = await supabase.storage.from("sourcemaps").download(`${build}/${file}.map`);
      if (error || !data) return null;
      try { return JSON.parse(await data.text()); } catch { return null; }
    };
    const frames = await symbolicateStack({ stack, componentStack }, loadMap, SourceMapConsumer);
    return json({ build, frames, resolved: frames.filter((f: { resolved: boolean }) => f.resolved).length, total: frames.length });
  } catch (e) {
    console.error("symbolicate-error", (e as Error).message);
    return json({ error: "Oversættelsen mislykkedes" }, 500);
  }
});
