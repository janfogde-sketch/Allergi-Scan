// Dagligt loft på betalte AI-kald. Kun mod misbrug: scanning med stregkode og
// nøgleordsmotoren tæller ikke og er ubegrænset. Tabeller og RPC'er: migration 20261006120000.
export const LIMITS = {
  ocr: 60,            // pr. bruger pr. døgn (en scanning bruger typisk 1-3)
  claude_analysis: 100, // pr. bruger pr. døgn
  claude_internal: 300, // globalt pr. døgn for interne/anonyme kald (products, auto-reparse)
  off_lookup: 300,    // pr. bruger pr. døgn: opslag af ukendte stregkoder hos Open Food Facts (gemmer og logger)
  list_code: 30,      // pr. bruger pr. døgn: forsøg på at slå en indkøbslistekode op (forhåndsvisning/tilslut)
};

// true = inden for loftet. Ved databasefejl lader vi kaldet passere (fail-open), så en fejl i tælleren aldrig blokerer scanning.
export async function withinUserLimit(supabase: any, userId: string, kind: "ocr" | "claude_analysis" | "off_lookup" | "list_code"): Promise<boolean> {
  const { data, error } = await supabase.rpc("bump_api_usage", { p_user: userId, p_kind: kind, p_limit: LIMITS[kind] });
  if (error) { console.error("bump_api_usage", error.message); return true; }
  return data === true;
}

export async function withinGlobalLimit(supabase: any, kind: "claude_internal"): Promise<boolean> {
  const { data, error } = await supabase.rpc("bump_api_usage_global", { p_kind: kind, p_limit: LIMITS[kind] });
  if (error) { console.error("bump_api_usage_global", error.message); return true; }
  return data === true;
}
