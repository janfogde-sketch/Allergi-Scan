// supabase/functions/_shared/adminAudit.ts
//
// Adminloggen fra edge-funktionerne (15. okt. 2026, plan eatsafe/plan-aktivitetslog-2026-10-15.md del B). Funktionerne kører med
// service-nøglen, så databasens triggere kan ikke se, hvilken admin der handlede; derfor logger funktionen selv via
// public.log_admin_event (kun service_role må kalde den).
//
// Regler: aldrig navn, e-mail, allergier eller rå fejltekster i loggen. Fejl angives som en kort kode (fejlkode()).
// En fejl i selve logningen stopper aldrig handlingen; den skrives kun i funktionens egen log.

// deno-lint-ignore no-explicit-any
type Client = { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }> } | any;

export type AuditOutcome = "ok" | "mislykket" | "afvist";

export async function logAdminEvent(
  supabase: Client,
  actor: string | null,
  action: string,
  targetTable: string,
  targetId: string | null = null,
  details: Record<string, unknown> | null = null,
  outcome: AuditOutcome = "ok",
): Promise<void> {
  try {
    const { error } = await supabase.rpc("log_admin_event", {
      p_actor: actor,
      p_action: action,
      p_target_table: targetTable,
      p_target_id: targetId,
      p_details: details,
      p_outcome: outcome,
    });
    if (error) console.error(`adminlog (${action}) fejlede: ${error.message}`);
  } catch (e) {
    console.error(`adminlog (${action}) fejlede: ${(e as Error).message}`);
  }
}

/** En logget ind bruger uden admin-rolle kaldte en admin-funktion. Databasen logger højst én gang i timen pr. bruger og funktion. */
export function logAccessDenied(supabase: Client, userId: string, fn: string): Promise<void> {
  return logAdminEvent(supabase, userId, "adgang_naegtet", "edge_function", fn, { funktion: fn }, "afvist");
}

/** Kort, ufarlig fejlkode til loggen: Postgres-koden, hvis der er en, ellers en fast kategori (aldrig fejlteksten). */
export function fejlkode(err: unknown): string {
  const code = (err as { code?: unknown } | null)?.code;
  if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return `db_${code}`;
  return "ukendt_fejl";
}

/** Felter, der er ændret, med før/efter (kun til indhold som produkter; afkortes i databasen til 500 tegn). */
export function feltAendringer(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  ignore: string[] = ["updated_at"],
): { felter: string[]; aendringer: Array<{ felt: string; fra: unknown; til: unknown }> } {
  const b = before ?? {}, a = after ?? {};
  const keys = Object.keys(a).filter((k) => !ignore.includes(k) && JSON.stringify(b[k] ?? null) !== JSON.stringify(a[k] ?? null)).sort();
  return { felter: keys, aendringer: keys.map((k) => ({ felt: k, fra: b[k] ?? null, til: a[k] ?? null })) };
}
