// @ts-nocheck
// Velkomstmailen sendes fra supabase/functions/_shared/welcomeMail.ts, som er en
// kopi af supabase/templates/resend/N1-velkomst.html — de to skal være ens.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { WELCOME_MAIL_HTML, WELCOME_MAIL_SUBJECT, renderWelcomeMail } from "../supabase/functions/_shared/welcomeMail.ts";

describe("velkomstmail", () => {
  it("er identisk med skabelonfilen (kør node scripts/build-welcome-mail.mjs efter ændringer)", () => {
    expect(WELCOME_MAIL_HTML).toBe(readFileSync("supabase/templates/resend/N1-velkomst.html", "utf-8"));
  });

  it("hedder 'Velkommen til EatSafe' uden BETA-badge, ikke i produktnavnet", () => {
    expect(WELCOME_MAIL_SUBJECT).toBe("Velkommen til EatSafe");
    expect(WELCOME_MAIL_HTML).toContain(">Velkommen til EatSafe</h1>");
    expect(WELCOME_MAIL_HTML).not.toContain("EatSafe Beta");
    expect(WELCOME_MAIL_HTML).not.toContain("BETA");
  });

  it("indsætter fornavnet HTML-escapet", () => {
    const html = renderWelcomeMail("<Anna> Hansen");
    expect(html).toContain("Hej &lt;Anna&gt;</p>");
    expect(html).not.toContain("{{{name}}}");
  });
});

describe("ingen BETA-badge i mails (16. okt. 2026)", () => {
  it("hverken Resend-skabelonerne eller de indlejrede mailfiler indeholder BETA", () => {
    const dir = "supabase/templates/resend";
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".html"))) expect(readFileSync(`${dir}/${f}`, "utf-8"), f).not.toContain("BETA");
    for (const f of ["inviteMail", "listMail", "welcomeMail", "inactivityMail"]) expect(readFileSync(`supabase/functions/_shared/${f}.ts`, "utf-8"), f).not.toContain("BETA");
  });
});
