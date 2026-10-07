// Sletningstesten i databasen (supabase/tests/account_deletion.sql) gentager delete-user's trin.
// Denne test sikrer, at de to ikke glider fra hinanden: samme tabeller i samme rækkefølge.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("delete-user og sletningstesten er ens", () => {
  it("trinene i delete-user står i DELETE-STEPS i SQL-testen", () => {
    const fn = readFileSync("supabase/functions/delete-user/index.ts", "utf8");
    const sql = readFileSync("supabase/tests/account_deletion.sql", "utf8");
    const inFn = [...fn.matchAll(/await step\("([a-z_]+)",\s*supabase\.from\("([a-z_]+)"\)/g)].map(m => m[2]);
    const inSql = sql.match(/^-- DELETE-STEPS: (.+)$/m)[1].split(",");
    expect(inFn.length).toBeGreaterThan(8);
    expect(inSql).toEqual(inFn);
  });
});
