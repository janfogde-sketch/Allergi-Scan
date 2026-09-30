// @ts-nocheck
import { describe, it, expect } from "vitest";
import { parseRecallFeed, parseRecallPage, isValidGtin, isOfficialRecallUrl, eanVariants } from "../supabase/functions/_shared/recallParser.js";

const FEED = `<?xml version="1.0"?><rss><channel><item><title>Tilbagekald: For h&#248;jt indhold af glycerol (E422)</title><link>https://foedevarestyrelsen.dk/nyheder/tilbagekaldte-produkter/2026/sep/a</link><description>Kort tekst..</description><pubDate>Wed, 23 Sep 2026 14:36:00 GMT</pubDate></item><item><title>Falsk</title><link>https://evil.example.com/x</link><pubDate>Wed, 23 Sep 2026 14:36:00 GMT</pubDate></item></channel></rss>`;

const PAGE = `<html><body><nav>Menu</nav><h1>Tilbagekald</h1><div>Tilbagekaldte fødevarer</div>
<p>Inter Candy A/S tilbagekalder læskedrikken FROSTY POCKET.</p>
<h2>Hvilken fødevare tilbagekaldes</h2>
<p>Frosty Pocket Lemon</p><p>Lotnr.: L1436RPK0222</p><p>Holdbarhedsdato: 30/11/2027</p><p>EAN/GTIN-nummer: 8435660200767</p>
<p>Frosty Pocket Strawberry</p><p>EAN/GTIN-nummer: 8435660200750</p><p>Frosty Pocket Fejl</p><p>EAN/GTIN-nummer: 8435660200768</p>
<h2>Hvor er produktet solgt</h2><p>Kiosker.</p>
<h2>Hvorfor tilbagekaldes produktet</h2><p>Det kan give kvalme &amp; hovedpine.</p>
<h2>Hvad skal du gøre som forbruger</h2><p>Kassér produktet.</p>
<h2>Hvem tilbagekalder produktet</h2><p>Inter Candy A/S</p>
<p>Fødevarestyrelsen er en styrelse under Erhvervsministeriet. CVR: 62534516</p></body></html>`;

describe("recallParser", () => {
  it("læser feedet og afviser links uden for foedevarestyrelsen.dk", () => {
    const items = parseRecallFeed(FEED);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Tilbagekald: For højt indhold af glycerol (E422)");
    expect(items[0].publishedAt).toBe("2026-09-23T14:36:00.000Z");
  });
  it("kun https på Fødevarestyrelsens domæne er officiel kilde", () => {
    expect(isOfficialRecallUrl("https://foedevarestyrelsen.dk/a")).toBe(true);
    expect(isOfficialRecallUrl("http://foedevarestyrelsen.dk/a")).toBe(false);
    expect(isOfficialRecallUrl("https://foedevarestyrelsen.dk.evil.com/a")).toBe(false);
  });
  it("finder sektioner og kun gyldige EAN'er (kontrolciffer)", () => {
    const r = parseRecallPage(PAGE, { title: "Tilbagekald" });
    expect(r.eans).toEqual(["8435660200767", "8435660200750"]); // ...768 har forkert kontrolciffer
    expect(r.unverifiedEans).toEqual(["8435660200768"]);
    expect(r.reason).toBe("Det kan give kvalme & hovedpine.");
    expect(r.action).toBe("Kassér produktet.");
    expect(r.affected).toContain("Lotnr.: L1436RPK0222");
    expect(r.affected).not.toContain("Kiosker");
    expect(r.cancelled).toBe(false);
  });
  it("genkender annullerede tilbagekaldelser", () => {
    expect(parseRecallPage(PAGE, { title: "ANNULLERET: Tilbagekald – X" }).cancelled).toBe(true);
  });
  it("side uden EAN giver tom liste", () => {
    expect(parseRecallPage("<div>Tilbagekaldte fødevarer</div><p>Ingen tal her</p>").eans).toEqual([]);
  });
  it("GTIN-kontrolciffer og skrivemåder", () => {
    expect(isValidGtin("8435660200767")).toBe(true);
    expect(isValidGtin("8435660200768")).toBe(false);
    expect(eanVariants("08435660200767")).toContain("8435660200767");
    expect(eanVariants("8435660200767")).toContain("08435660200767");
  });
});
