// supabase/functions/_shared/runLog.ts
//
// Kørselslog for import og genanalyse (tabellen import_runs, 16. okt. 2026). Tabellen rummer kun tællere, korte statuslinjer og en kort fejlkode: aldrig nøgler,
// e-mails eller rå fejltekster. En fejl i selve logningen stopper aldrig kørslen. Kun én kørsel pr. job ad gangen (unikt indeks); start returnerer null, hvis en anden kører.

// deno-lint-ignore no-explicit-any
type Client = any;
export type RunJob = "off_import" | "reanalyze" | "recalls_sync";
export type RunStatus = "ok" | "partial" | "failed";

/** Starter en kørsel. null = en anden kørsel af samme slags er i gang; "ulogget" = logningen er ikke tilgængelig (kørslen fortsætter alligevel). */
export async function startRun(supabase: Client, job: RunJob, trigger: "cron" | "manual"): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("import_run_start", { p_job: job, p_trigger: trigger });
    if (error) { console.error(`kørselslog (${job}) start fejlede: ${error.message}`); return "ulogget"; }
    return data ?? null;
  } catch (e) {
    console.error(`kørselslog (${job}) start fejlede: ${(e as Error).message}`);
    return "ulogget";
  }
}

/** Status ud fra tællerne: mislykket hvis intet lykkedes og der var fejl, delvist hvis både lykkedes og fejl, ellers gennemført. */
export function runStatus(succeeded: number, errors: number, aborted = false): RunStatus {
  if (errors === 0 && !aborted) return "ok";
  return succeeded > 0 ? "partial" : "failed";
}

export async function finishRun(
  supabase: Client, id: string | null, status: RunStatus, counts: Record<string, number>, log: string[] = [], errorCode: string | null = null,
): Promise<void> {
  if (!id || id === "ulogget") return;
  try {
    const { error } = await supabase.from("import_runs").update({
      status, finished_at: new Date().toISOString(), counts, error_code: errorCode, log: log.slice(0, 100).map((l) => String(l).slice(0, 200)),
    }).eq("id", id);
    if (error) console.error(`kørselslog slut fejlede: ${error.message}`);
  } catch (e) {
    console.error(`kørselslog slut fejlede: ${(e as Error).message}`);
  }
}
