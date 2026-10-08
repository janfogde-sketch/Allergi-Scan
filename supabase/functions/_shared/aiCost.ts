import { createClient } from "jsr:@supabase/supabase-js@2.117.2";

// Logger forbrug (kald og tokens) for ét betalt Claude-kald i ai_usage_daily (vises i admin → AI-forbrug).
// Kun summer, ingen bruger-id eller tekst. Fejl her må aldrig påvirke selve kaldet, så alt sluges.
export async function logAiUsage(functionName: string, model: string, usage: any): Promise<void> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key || !usage) return;
    const supabase = createClient(url, key);
    // Cache-tokens tælles med som input, så vi hellere overvurderer end undervurderer prisen.
    const input = (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
    const { error } = await supabase.rpc("log_ai_usage", {
      p_function: functionName, p_model: model, p_input: input, p_output: usage.output_tokens ?? 0,
    });
    if (error) console.error("log_ai_usage", error.message);
  } catch (e) {
    console.error("log_ai_usage", (e as Error).message);
  }
}
