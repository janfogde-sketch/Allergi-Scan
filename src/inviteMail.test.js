// @ts-nocheck
// Invitationsmailen sendes fra supabase/functions/_shared/inviteMail.ts, som er en kopi af
// supabase/templates/resend/N9-familieinvitation.html — de to skal være ens (kør node scripts/build-invite-mail.mjs).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { INVITE_MAIL_HTML, inviteMailSubject, renderInviteMail } from "../supabase/functions/_shared/inviteMail.ts";

const vars = { inviterName: "Jan", inviteeEmail: "frederikke@gmail.com", inviteUrl: "https://www.eatsafe.dk/invite/abc123", expiryText: "i morgen kl. 18.29" };

describe("invitationsmail", () => {
  it("er identisk med skabelonfilen", () => {
    expect(INVITE_MAIL_HTML).toBe(readFileSync("supabase/templates/resend/N9-familieinvitation.html", "utf-8"));
  });
  it("har et emne med afsenderens navn", () => {
    expect(inviteMailSubject("Jan")).toBe("Jan har inviteret dig til sin familie i EatSafe");
  });
  it("udfylder alle variabler og understreger, at samme e-mail skal bruges", () => {
    const html = renderInviteMail(vars);
    expect(html).not.toMatch(/\{\{\{/);
    expect(html).toContain("Jan har inviteret dig til sin familie i EatSafe</h1>");
    expect(html).toContain("<strong class=\"strong\">frederikke@gmail.com</strong>");
    expect(html).toContain('href="https://www.eatsafe.dk/invite/abc123"');
    expect(html).toContain("i morgen kl. 18.29");
    expect(html).toContain("frederikke@gmail.com");
    expect(html).toContain("kan kun bruges én gang");
  });
  it("vælger teksten efter, om adressen har en konto, og efterlader ingen markører", () => {
    const nyBruger = renderInviteMail(vars);
    const medKonto = renderInviteMail({ ...vars, existingAccount: true });
    expect(nyBruger).toContain("Bruger du i stedet Facebook eller en anden adresse, virker invitationen også");
    expect(nyBruger).not.toContain("Du har allerede en EatSafe-konto");
    expect(medKonto).toContain("Du har allerede en EatSafe-konto");
    expect(medKonto).toContain("Ingenting sker, før du har sagt ja");
    expect(medKonto).not.toContain("Bruger du i stedet Facebook eller en anden adresse, virker invitationen også");
    expect(medKonto).toContain("Bruger du en anden adresse eller Facebook");
    for (const html of [nyBruger, medKonto]) {
      expect(html).not.toMatch(/<!--\/?IF/);
      expect(html).toContain("frederikke@gmail.com");
      expect(html).toContain("Se invitationen");
    }
  });
  it("HTML-escaper tekst, så et fornavn eller en adresse ikke kan injicere markup", () => {
    const html = renderInviteMail({ ...vars, inviterName: "<img src=x onerror=1>", inviteeEmail: "a\"><script>@b.dk" });
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img src=x onerror=1&gt;");
  });
});
