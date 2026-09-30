// @ts-nocheck
// Tests for den fælles indholdskilde (supabase/functions/_shared/notificationContent.js).
import { describe, it, expect } from "vitest";
import {
  DEFINITIONS, ALLOWED_ACTIONS, DISCLAIMER, MissingRequiredError,
  renderNotification, blocksToText, cleanText, truncate, productLabel,
} from "../supabase/functions/_shared/notificationContent.js";

const SAMPLE = {
  productName: "Nordkorn Havrekiks", ean: "5701234567890", submissionId: "sub-1",
  reason: "Ingredienslisten er ikke læsbar.\nIndsend et skarpere billede.",
  memberName: "Frederikke", inviteId: "inv-1",
  description: "Kameraet åbner ikke, når jeg vælger Scan.", message: "Vi har rettet fejlen. Prøv gerne igen.", ticketId: "tik-1",
};
const KEYS = Object.keys(DEFINITIONS);
const LONG = "X".repeat(90);

describe("cleanText / truncate / productLabel", () => {
  it("fjerner kontroltegn, retningstegn og vores egen fed-markup", () => {
    expect(cleanText("A\u0000B‮C​**D**")).toBe("ABCD");
  });
  it("samler mellemrum, og bevarer linjeskift kun når det er ønsket", () => {
    expect(cleanText("a   b\n c")).toBe("a b c");
    expect(cleanText("a  b\n\n\n\nc", { multiline: true })).toBe("a b\n\nc");
  });
  it("afkorter med ellipsis og rører ikke korte tekster", () => {
    expect(truncate("kort", 10)).toBe("kort");
    expect(truncate("abcdefghij", 5)).toBe("abcd…");
  });
  it("sætter mærke foran, men gentager det ikke", () => {
    expect(productLabel({ brand: "Nordkorn", name: "Havrekiks" })).toBe("Nordkorn Havrekiks");
    expect(productLabel({ brand: "Nordkorn", name: "Nordkorn Havrekiks" })).toBe("Nordkorn Havrekiks");
    expect(productLabel({ brand: "", name: "Havrekiks" })).toBe("Havrekiks");
    expect(productLabel({})).toBe("");
  });
});

describe("renderNotification — alle definitioner", () => {
  it.each(KEYS)("%s rendes uden uløste variabler", (key) => {
    const n = renderNotification(key, SAMPLE);
    expect(JSON.stringify(n)).not.toMatch(/\{\{/);
    expect(n.title).toBeTruthy();
    expect(n.blocks.length).toBeGreaterThan(2);
    expect(n.blocks[0].type).toBe("heading");
  });

  it.each(KEYS)("%s holder pushbudgettet (titel ≤ 40, tekst ≤ 110) også med meget lange navne", (key) => {
    const n = renderNotification(key, { ...SAMPLE, productName: LONG, memberName: LONG });
    expect(n.title.length).toBeLessThanOrEqual(40);
    expect(n.pushBody.length).toBeLessThanOrEqual(110);
  });

  it.each(KEYS)("%s har en tilladt handling og et entity", (key) => {
    const n = renderNotification(key, SAMPLE);
    expect(ALLOWED_ACTIONS).toContain(n.primaryAction.type);
    expect(n.primaryAction.label).toBeTruthy();
    expect(n.entityType).toBeTruthy();
  });

  it.each(KEYS)("%s: emne ≤ 55 og preheader 40–90 tegn (pakkens mailkrav)", (key) => {
    const { subject, preheader } = renderNotification(key, SAMPLE).mail;
    expect(subject.length).toBeLessThanOrEqual(55);
    expect(preheader.length).toBeGreaterThanOrEqual(40);
    expect(preheader.length).toBeLessThanOrEqual(90);
  });

  it("er deterministisk: samme input giver samme snapshot", () => {
    expect(renderNotification("N2a:default", SAMPLE)).toEqual(renderNotification("N2a:default", SAMPLE));
  });

  it("kaster ved ukendt nøgle", () => {
    expect(() => renderNotification("N99:default", SAMPLE)).toThrow(/Ukendt/);
  });
});

describe("indholdsregler fra pakken", () => {
  it("disclaimer på produkt-/madrelaterede beskeder, ikke på feedback", () => {
    for (const key of ["N2a:default", "N2b:default", "N3:default", "N4:default", "N5:default"]) {
      const last = renderNotification(key, SAMPLE).blocks.at(-1);
      expect(last).toEqual({ type: "disclaimer", text: DISCLAIMER });
    }
    for (const key of KEYS.filter((k) => k.startsWith("N6"))) {
      expect(renderNotification(key, SAMPLE).blocks.some((b) => b.type === "disclaimer")).toBe(false);
    }
  });

  it("beskedsiden indeholder hverken hilsen eller afmeldingsfooter", () => {
    for (const key of KEYS) {
      const text = blocksToText(renderNotification(key, SAMPLE).blocks);
      expect(text).not.toMatch(/^Hej /m);
      expect(text).not.toMatch(/Du får denne mail/);
      expect(text).not.toMatch(/Privatlivspolitik/);
    }
  });

  it("N3 kræver en begrundelse og viser den i sin egen blok", () => {
    expect(() => renderNotification("N3:default", { ...SAMPLE, reason: "   " })).toThrow(MissingRequiredError);
    const n = renderNotification("N3:default", SAMPLE);
    const panel = n.blocks.find((b) => b.type === "panel");
    expect(panel.title).toBe("Begrundelse fra vores team");
    expect(panel.blocks[0].multiline).toBe(true);
    expect(blocksToText(n.blocks)).toContain("Indsend et skarpere billede.");
    expect(n.primaryAction.type).toBe("scan");
  });

  it("N6 svar kræver et svar; statusvarianter falder tilbage til en neutral tekst", () => {
    expect(() => renderNotification("N6:reply", { ...SAMPLE, message: "" })).toThrow(MissingRequiredError);
    const n = renderNotification("N6:resolved", { ...SAMPLE, message: "" });
    expect(blocksToText(n.blocks)).toContain("Der er ikke tilføjet en uddybende besked.");
    expect(blocksToText(n.blocks)).toContain("Status: Løst");
  });

  it("N6: uddraget afkortes til 250 tegn og får en fallback, hvis det mangler", () => {
    const long = renderNotification("N6:in_progress", { ...SAMPLE, description: "a".repeat(400) });
    const quote = long.blocks.find((b) => b.type === "quote");
    expect(quote.text.length).toBe(250);
    expect(quote.text.endsWith("…")).toBe(true);
    const none = renderNotification("N6:in_progress", { ...SAMPLE, description: "" });
    expect(none.blocks.find((b) => b.type === "quote").text).toBe("Din tilbagemelding i EatSafe");
  });

  it("N6 har fire varianter med hver sin status", () => {
    const status = (k) => renderNotification(k, SAMPLE).blocks.find((b) => b.type === "fact")?.value;
    expect(status("N6:in_progress")).toBe("I gang");
    expect(status("N6:resolved")).toBe("Løst");
    expect(status("N6:reopened")).toBe("Åben");
    expect(status("N6:reply")).toBeUndefined();
  });

  it("fallbacks: tomt produktnavn giver et grammatisk korrekt push og mailtekst", () => {
    const n = renderNotification("N2a:default", { ...SAMPLE, productName: "" });
    expect(n.pushBody).toBe("Produktet er godkendt af vores team og nu tilgængeligt for alle.");
    expect(blocksToText(n.blocks)).toContain("din indsendelse af produktet.");
    const m = renderNotification("N5:default", { ...SAMPLE, memberName: "" });
    expect(m.title).toBe("Din invitation er accepteret");
    expect(m.blocks[0].text).toBe("Et familiemedlem har accepteret din invitation");
  });
});

describe("sikkerhed i indholdet", () => {
  it("variabelværdier kan ikke injicere fed tekst eller uløste variabler", () => {
    const n = renderNotification("N2a:default", { ...SAMPLE, productName: "**Snyd** {{reason}}" });
    const strong = n.blocks[1].parts.filter((p) => p.strong);
    expect(strong).toHaveLength(1);
    expect(strong[0].text).toBe("Snyd { {reason} }");
    expect(JSON.stringify(n)).not.toMatch(/\{\{/);
  });

  it("brugerskrevet {{...}} i en feedbacktekst stopper ikke beskeden", () => {
    const n = renderNotification("N6:in_progress", { ...SAMPLE, description: "Skabelonen viser {{name}}" });
    expect(n.blocks.find((b) => b.type === "quote").text).toBe("Skabelonen viser { {name} }");
  });

  it("HTML i variabler bevares som ren tekst (escapes først i HTML-output)", () => {
    const n = renderNotification("N2a:default", { ...SAMPLE, productName: "<b>x</b>" });
    expect(n.pushBody).toContain("<b>x</b>");
    expect(n.blocks[1].parts.find((p) => p.strong).text).toBe("<b>x</b>");
  });

  it("handlingsparametre er rensede tekster, aldrig markup", () => {
    const n = renderNotification("N2a:default", { ...SAMPLE, ean: "570‮123" });
    expect(n.primaryAction.params.ean).toBe("570123");
  });

  it("mangler en handlingsparameter, kan beskeden ikke oprettes", () => {
    expect(() => renderNotification("N2a:default", { ...SAMPLE, ean: "" })).toThrow(MissingRequiredError);
    expect(() => renderNotification("N6:reply", { ...SAMPLE, ticketId: "" })).toThrow(MissingRequiredError);
  });
});
