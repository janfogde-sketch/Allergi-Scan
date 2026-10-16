// @ts-nocheck
import { describe, it, expect } from "vitest";
import { parseRecallFeed, parseRecallPage, isValidGtin, isOfficialRecallUrl, eanVariants, originalTitleOfCancelled, normalizeRecallTitle, recallFingerprintText, sameEanSet } from "../supabase/functions/_shared/recallParser.js";

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

describe("annulleret og ændret tilbagekaldelse", () => {
  it("udleder den oprindelige titel fra en annulleringsside", () => {
    expect(originalTitleOfCancelled("ANNULLERET: Tilbagekald – Pesticidrester i kidneybønner")).toBe("Tilbagekald – Pesticidrester i kidneybønner");
    expect(originalTitleOfCancelled("Annulleret - Tilbagekald: X")).toBe("Tilbagekald: X");
    expect(originalTitleOfCancelled("Tilbagekald: X")).toBeNull();
  });
  it("sammenligner titler uden forskel på store/små bogstaver, mellemrum og tankestreger", () => {
    expect(normalizeRecallTitle("Tilbagekald –  Kidneybønner")).toBe(normalizeRecallTitle("tilbagekald - kidneybønner"));
  });
  it("fingeraftrykket ændres kun, når årsag, partier eller anvisning ændres", () => {
    const a = { reason: "Salmonella", affected: "L1", action: "Kassér", intro: "x" };
    expect(recallFingerprintText(a)).toBe(recallFingerprintText({ ...a, intro: "ændret intro", reason: "Salmonella  " }));
    expect(recallFingerprintText(a)).not.toBe(recallFingerprintText({ ...a, affected: "L1, L2" }));
  });
  it("sammenligner EAN-lister uanset rækkefølge", () => {
    expect(sameEanSet(["1", "2"], ["2", "1"])).toBe(true);
    expect(sameEanSet(["1"], ["1", "2"])).toBe(false);
  });
});

import { extractAffectedProducts, deriveUnitFromCarton, gtinKind } from "../supabase/functions/_shared/recallParser.js";

describe("strukturerede berørte produkter", () => {
  it("flere varianter hver med eget lot, dato og stregkode blandes ikke sammen", () => {
    const t = "Frosty Pocket Lemon\nLotnr.: L1436RPK0222\nHoldbarhedsdato: 30/11/2027\nEAN/GTIN-nummer: 8435660200767\nNettoindhold: 150 ml\nFrosty Pocket Strawberry\nLotnr.: L1336RPK0111\nHoldbarhedsdato: 30/11/2027\nEAN/GTIN-nummer: 8435660200750\nNettoindhold: 150 ml";
    const p = extractAffectedProducts(t);
    expect(p.map((x) => x.name)).toEqual(["Frosty Pocket Lemon", "Frosty Pocket Strawberry"]);
    expect(p[0].lots).toEqual(["L1436RPK0222"]);
    expect(p[1].lots).toEqual(["L1336RPK0111"]);
    expect(p[0].eans[0]).toMatchObject({ code: "8435660200767", valid: true });
    expect(p[1].eans[0].code).toBe("8435660200750");
    expect(p.every((x) => !x.uncertain)).toBe(true);
  });
  it("karton (GTIN-14) og salgsenhed skelnes, og flere partier med flere datoer markeres usikre", () => {
    const t = "Amanda Makrelkræs tube 80 gram. Varenr. 107080001010,\nEAN karton: 15705550826125\nEAN på styk / tuben: 5705550826128\nProduktionsdato: 26-05-2026, 10-08-2026, 21-09-2026\nHoldbarhedsudløb: 26-05-2027, 10-08-2027, 21-09-2027\nLotnummer: 270526, 270810, 270921";
    const [p] = extractAffectedProducts(t);
    expect(p.name).toBe("Amanda Makrelkræs tube 80 gram");
    expect(p.article_no).toBe("107080001010");
    expect(p.eans.map((e) => [e.code, e.kind])).toEqual([["15705550826125", "carton"], ["5705550826128", "unit"]]);
    expect(p.lots).toEqual(["270526", "270810", "270921"]);
    expect(p.best_before).toHaveLength(3);
    expect(p.flags).toContain("lot_date_pairing_unknown");
    expect(p.uncertain).toBe(true);
  });
  it("GTIN-14 på karton giver den indeholdte salgsenhed (EAN-13); andre koder giver ingenting", () => {
    expect(deriveUnitFromCarton("15705550826125")).toBe("5705550826128");
    expect(deriveUnitFromCarton("5705550826128")).toBeNull();
    expect(deriveUnitFromCarton("15705550826120")).toBeNull(); // forkert kontrolciffer
    expect(gtinKind("15705550826125")).toBe("carton");
    expect(gtinKind("5705550826128", "EAN på styk")).toBe("unit");
  });
  it("uden stregkode: produktlisten udtrækkes, men alt markeres usikkert og uden partioplysninger", () => {
    const t = "Følgende produkter er omfattet:\nOksespegepølse – alm.\nLøgpølse\nDer kan være solgt yderligere varianter af spegepølser og pålægsprodukter. Produkterne kan kendes ved, at ingredienslisten kun fylder én linje.";
    const p = extractAffectedProducts(t);
    expect(p.map((x) => x.name)).toEqual(["Oksespegepølse – alm.", "Løgpølse"]);
    for (const x of p) { expect(x.flags).toContain("no_barcode"); expect(x.flags).toContain("no_batch_info"); expect(x.uncertain).toBe(true); }
  });
  it("lot og dato i samme linje, ugyldigt kontrolciffer og manglende holdbarhedsdato", () => {
    const [d] = extractAffectedProducts("Salling Øko Dild\nNettovægt: 15 g.\nEAN nr. 571287790945\nLot nr. L:007221 med bedst før den 15. 09.2027");
    expect(d.eans[0]).toMatchObject({ code: "571287790945", valid: false });
    expect(d.flags).toContain("invalid_barcode");
    expect(d.lots).toEqual(["L:007221"]);
    expect(d.best_before[0]).toMatch(/15\. ?09\.2027/);
    const [k] = extractAffectedProducts("Bähncke Karry Ketchup\nEAN: 5702040711032\nVarenummer: 457150769\nL-kode: 493181");
    expect(k.best_before).toEqual([]);
    expect(k.lots).toEqual(["493181"]);
    expect(k.flags).not.toContain("no_batch_info");
  });
  it("parseRecallPage gemmer hele artiklen som rå tekst", () => {
    const r = parseRecallPage(PAGE, { title: "Tilbagekald" });
    expect(r.rawText).toContain("Kassér produktet.");
    expect(r.rawText).toContain("Frosty Pocket Fejl");
  });
});
