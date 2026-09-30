// @ts-nocheck
// Tests for mailkanalen: escaping, variabler, Resend-kaldet — og at mailskabelonerne i
// supabase/templates/resend/ siger det samme som appens beskeder (én indholdskilde).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { RESEND_TEMPLATES, TRANSACTIONAL_TEMPLATES, escapeHtml, buildMailVariables, sendTemplateMail } from "../supabase/functions/_shared/mailSend.ts";
import { renderNotification, DEFINITIONS } from "../supabase/functions/_shared/notificationContent.js";

const catalog = JSON.parse(readFileSync("supabase/templates/resend/catalog.json", "utf-8"));
const KEY_TO_CATALOG = {
  "N2a:default": "N2a", "N2b:default": "N2b", "N3:default": "N3", "N4:default": "N4", "N5:default": "N5",
  "N6:in_progress": "N6a", "N6:resolved": "N6b", "N6:reopened": "N6c", "N6:reply": "N6d",
  "P1:default": "P1", "P2:default": "P2", "P3:one": "P3", "P3:many": "P3",
};
const SAMPLE = {
  productName: "Havregryn", ean: "5701234567890", submissionId: "s1", reason: "Billedet viser ikke ingredienslisten.",
  memberName: "Kaj", inviteId: "i1", description: "Knappen virker ikke på min iPhone.", message: "Vi har rettet fejlen.", ticketId: "t1",
  expiresAt: "i dag kl. 18:35", listName: "Familiens indkøb", listId: "l1", itemSummary: "Mælk og Æg", changeSummary: "Æg indeholder nu",
};

describe("escapeHtml / buildMailVariables", () => {
  it("escaper alt, der kan blive til markup", () => {
    expect(escapeHtml(`<img src=x onerror="a()">&'`)).toBe("&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;");
  });
  it("bruger kun fornavnet og escaper værdierne", () => {
    const v = buildMailVariables({ productName: "Ben & Jerry's <b>" }, "Anna Marie Jensen");
    expect(v.name).toBe("Anna");
    expect(v.productName).toBe("Ben &amp; Jerry&#39;s &lt;b&gt;");
  });
  it("giver tomt navn, når brugeren ikke har et", () => {
    expect(buildMailVariables({}, null).name).toBe("");
  });
});

describe("skabeloner ↔ beskeder", () => {
  for (const [key, cid] of Object.entries(KEY_TO_CATALOG)) {
    it(`${key}: skabelonen findes, og alle dens variabler leveres`, () => {
      const tpl = catalog[cid];
      expect(RESEND_TEMPLATES[key]).toBe(tpl.resendId);
      const r = renderNotification(key, SAMPLE);
      const provided = Object.keys(buildMailVariables(r.mailVars, "Anna"));
      for (const v of tpl.vars) expect(provided, `${key} mangler variabel ${v}`).toContain(v);
    });

    it(`${key}: mailens tekst indeholder alle blokke fra appens besked`, () => {
      const r = renderNotification(key, SAMPLE);
      let html = readFileSync(`supabase/templates/resend/${catalog[cid].file}`, "utf-8");
      const vars = { name: "Anna", ...r.mailVars };
      html = html.replace(/\{\{\{(\w+)\}\}\}/g, (_, k) => vars[k] ?? "");
      const mail = html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<\/?(strong|b|em|a|span)\b[^>]*>/g, "").replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
      const texts = [];
      const walk = (b) => {
        if (b.type === "heading") texts.push(b.text);
        else if (b.type === "paragraph") texts.push(b.parts.map((p) => p.text).join(""));
        else if (b.type === "panel") { if (b.title) texts.push(b.title); b.blocks.forEach(walk); }
        else if (b.type === "quote") { texts.push(b.label, b.text); }
        else if (b.type === "disclaimer") texts.push(b.text);
      };
      r.blocks.forEach(walk);
      for (const t of texts) expect(mail.replace(/\s+/g, " "), `${key}: "${t}" mangler i mailen`).toContain(t.replace(/\s+/g, " "));
    });
  }

  it("alle varianter med mail har en skabelon", () => {
    for (const key of Object.keys(DEFINITIONS)) expect(RESEND_TEMPLATES[key], key).toBeTruthy();
  });
});

describe("sendTemplateMail", () => {
  const base = { apiKey: "re_x", to: "a@b.dk", templateId: "tpl", variables: { name: "Anna" }, subject: "Emne", idempotencyKey: "notification-1" };

  it("kalder Resend med skabelon, variabler og idempotensnøgle", async () => {
    let seen;
    const res = await sendTemplateMail({ ...base, fetchImpl: async (u, init) => { seen = { u, init }; return { ok: true, status: 200, json: async () => ({ id: "m1" }) }; } });
    expect(res).toEqual({ ok: true, status: 200, retryable: false, id: "m1" });
    expect(seen.u).toBe("https://api.resend.com/emails");
    expect(seen.init.headers["Idempotency-Key"]).toBe("notification-1");
    const body = JSON.parse(seen.init.body);
    expect(body.to).toEqual(["a@b.dk"]);
    expect(body.template).toEqual({ id: "tpl", variables: { name: "Anna" } });
    expect(body.html).toBeUndefined();
  });
  it("markerer 429/5xx og netværksfejl som retryable, andre fejl ikke", async () => {
    const mk = (status) => sendTemplateMail({ ...base, fetchImpl: async () => ({ ok: false, status, json: async () => ({ message: "x" }) }) });
    expect((await mk(429)).retryable).toBe(true);
    expect((await mk(503)).retryable).toBe(true);
    expect((await mk(422)).retryable).toBe(false);
    const net = await sendTemplateMail({ ...base, fetchImpl: async () => { throw new Error("offline"); } });
    expect(net).toMatchObject({ ok: false, status: 0, retryable: true });
  });
});

describe("servicemails (N1 velkomst, P4 slettekvittering)", () => {
  it("skabelon-id'erne matcher kataloget, og skabelonerne har kun variabler, vi leverer", () => {
    expect(TRANSACTIONAL_TEMPLATES.welcome_onboarded.id).toBe(catalog.N1.resendId);
    expect(TRANSACTIONAL_TEMPLATES.account_deleted.id).toBe(catalog.P4.resendId);
    expect(catalog.N1.vars).toEqual(["name"]);
    expect(catalog.P4.vars.sort()).toEqual(["deletedAt", "name"]);
  });
  it("P4 indeholder ingen afmelding og har en kontaktvej, N1 fører til appen", () => {
    const p4 = readFileSync("supabase/templates/resend/P4-konto-slettet.html", "utf-8");
    expect(p4).toContain("hej@eatsafe.dk");
    expect(p4).not.toMatch(/afmeld|unsubscribe/i);
    const n1 = readFileSync("supabase/templates/resend/N1-velkomst.html", "utf-8");
    expect(n1).toContain("https://www.eatsafe.dk/");
  });
});

