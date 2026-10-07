// @ts-nocheck
// Advarselsmailen om en inaktiv konto sendes fra supabase/functions/_shared/inactivityMail.ts, som er en kopi af
// supabase/templates/resend/P7-inaktiv-konto.html — de to skal være ens.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { INACTIVITY_MAIL_HTML, renderInactivityMail } from "../supabase/functions/_shared/inactivityMail.ts";

describe("inaktivitetsmail", () => {
  it("er identisk med skabelonfilen (kør node scripts/build-inactivity-mail.mjs efter ændringer)", () => {
    expect(INACTIVITY_MAIL_HTML).toBe(readFileSync("supabase/templates/resend/P7-inaktiv-konto.html", "utf-8"));
  });

  it("indsætter fornavn og dato HTML-escapet", () => {
    const html = renderInactivityMail("<Anna> Hansen", "7. november 2026");
    expect(html).toContain("Hej &lt;Anna&gt;</p>");
    expect(html).toContain("<strong>7. november 2026</strong>");
    expect(html).not.toContain("{{{");
  });
});
