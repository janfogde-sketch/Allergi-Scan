import { createClient } from "jsr:@supabase/supabase-js@2.117.2";

// Logger forbrug (kald og tokens) for ét betalt Claude-kald i ai_usage_daily (vises i admin → AI-forbrug).
// Kun summer, ingen bruger-id eller tekst. Fejl her må aldrig påvirke selve kaldet, så alt sluges.
// origin: "user" (kaldt med en almindelig brugers login), "internal" (service-nøglen: baggrundsjob) eller "unknown" (kan ikke fastslås; fx en administrator).
export type AiOrigin = "user" | "internal" | "unknown";
export async function logAiUsage(functionName: string, model: string, usage: any, origin: AiOrigin = "unknown"): Promise<void> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key || !usage) return;
    const supabase = createClient(url, key);
    // Cache-tokens tælles med som input, så vi hellere overvurderer end undervurderer prisen.
    const input = (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
    const args = { p_function: functionName, p_model: model, p_input: input, p_output: usage.output_tokens ?? 0 };
    let { error } = await supabase.rpc("log_ai_usage", { ...args, p_origin: origin });
    // Før migrationen 20261016090000 er live, kender funktionen ikke p_origin: log uden oprindelse, så ingen registrering går tabt.
    if (error && /p_origin|schema cache|Could not find the function/i.test(error.message)) {
      ({ error } = await supabase.rpc("log_ai_usage", args));
    }
    if (error) console.error("log_ai_usage", error.message);
  } catch (e) {
    console.error("log_ai_usage", (e as Error).message);
  }
}
