// Dagligt loft på betalte AI-kald. Kun mod misbrug: scanning med stregkode og
// nøgleordsmotoren tæller ikke og er ubegrænset. Tabeller og RPC'er: migration 20261006120000.
export const LIMITS = {
  ocr: 60,            // pr. bruger pr. døgn (en scanning bruger typisk 1-3)
  claude_analysis: 100, // pr. bruger pr. døgn
  claude_internal: 300, // globalt pr. døgn for interne/anonyme kald (products, auto-reparse)
  claude_admin: 300,  // globalt pr. døgn for alle admins tilsammen (godkend indsendelse, AI-rens); rører ikke admins personlige loft
  ai_total: 2000,     // globalt pr. døgn: ALLE betalte AI-kald tilsammen (ingredienstjek, billedlæsning, kategorisering, natjob). Sikkerhedsnet mod en løbsk regning
  off_lookup: 300,    // pr. bruger pr. døgn: opslag af ukendte stregkoder hos Open Food Facts (gemmer og logger)
  list_code: 30,      // pr. bruger pr. døgn: forsøg på at slå en indkøbslistekode op (forhåndsvisning/tilslut)
  submission: 30,     // pr. bruger pr. døgn: indsendte produkter/rettelser (rammer brugeren loftet, får admin en to do)
  search_selection: 200, // pr. bruger pr. døgn: loggede søgevalg (baggrundskald, overskridelse ignoreres stille)
};

// true = inden for loftet. Ved databasefejl lader vi kaldet passere (fail-open), så en fejl i tælleren aldrig blokerer scanning.
export async function withinUserLimit(supabase: any, userId: string, kind: "ocr" | "claude_analysis" | "off_lookup" | "list_code" | "submission" | "search_selection"): Promise<boolean> {
  const { data, error } = await supabase.rpc("bump_api_usage", { p_user: userId, p_kind: kind, p_limit: LIMITS[kind] });
  if (error) { console.error("bump_api_usage", error.message); return true; }
  return data === true;
}

export async function withinGlobalLimit(supabase: any, kind: "claude_internal" | "claude_admin" | "ai_total"): Promise<boolean> {
  const { data, error } = await supabase.rpc("bump_api_usage_global", { p_kind: kind, p_limit: LIMITS[kind] });
  if (error) { console.error("bump_api_usage_global", error.message); return true; }
  return data === true;
}

// Giver admin en høj-prioritets to do, når en bruger rammer et døgnloft (én pr. bruger, art og dag). Fejl sluges.
export async function reportLimitHit(supabase: any, userId: string, kind: string, label: string): Promise<void> {
  try {
    const day = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Copenhagen" });
    const title = `Døgnloft ramt: ${label} (konto ${userId.slice(0, 8)}, ${day})`;
    const { data: existing } = await supabase.from("admin_todos").select("id").eq("title", title).limit(1);
    if (existing && existing.length > 0) return;
    await supabase.from("admin_todos").insert({
      title,
      description: `En bruger har nået dagens loft på ${LIMITS[kind as keyof typeof LIMITS]} for "${label}". Det kan være almindelig brug eller misbrug. Tjek kontoens indsendelser/aktivitet i admin; intet er låst, loftet nulstilles ved midnat dansk tid.`,
      priority: "high",
      track: "drift",
    });
  } catch (e) {
    console.error("reportLimitHit", (e as Error).message);
  }
}

// Samlet dagsloft for alle betalte AI-kald (Jan, 14. okt. 2026). Kaldes lige før hvert Claude-kald, efter det almindelige loft.
// Rammes loftet, får admin én høj-prioritets to do pr. dag. Fail-open som de andre lofter.
export async function withinTotalAiLimit(supabase: any): Promise<boolean> {
  const ok = await withinGlobalLimit(supabase, "ai_total");
  if (!ok) await reportTotalLimitHit(supabase);
  return ok;
}

async function reportTotalLimitHit(supabase: any): Promise<void> {
  try {
    const day = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Copenhagen" });
    const title = `AI-dagsloftet er nået (${day})`;
    const { data: existing } = await supabase.from("admin_todos").select("id").eq("title", title).limit(1);
    if (existing && existing.length > 0) return;
    await supabase.from("admin_todos").insert({
      title,
      description: `Appen har brugt dagens samlede loft på ${LIMITS.ai_total} betalte AI-kald. Resten af dagen kører ingredienstjek kun med nøgleordsmotoren, billedlæsning er lukket, og kategorisering og natjob venter. Loftet nulstilles ved midnat dansk tid. Tjek admin → Drift → AI-forbrug for, hvad der har brugt kaldene.`,
      priority: "high",
      track: "drift",
    });
  } catch (e) {
    console.error("reportTotalLimitHit", (e as Error).message);
  }
}
