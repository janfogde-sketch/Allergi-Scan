// Billedlæsningens forklaringer må aldrig blive til en ingrediensliste (fejlrapport 16. okt. 2026).
import { describe, it, expect } from "vitest";
import { isUnreadableOcrText } from "../supabase/functions/_shared/ocrText.js";

describe("isUnreadableOcrText", () => {
  it("genkender markøren, tom tekst og AI'ens forklaringer", () => {
    for (const t of [
      "", "   ", null, "ULÆSELIG", "ulæselig",
      "Jeg kan desværre ikke læse ingredienslisten klart nok på dette billede. For at give dig et nøjagtigt svar, ville jeg have brug for et klarere, mere direkte billede.",
      "Beklager, billedet er for sløret.",
      "Desværre kan jeg ikke finde en ingrediensliste.",
      "Billedet viser forsiden af pakken, ikke ingredienslisten.",
      "I can't read the ingredients in this image.",
      "Teksten er utydelig, så jeg kan ikke skelne ingredienserne.",
    ]) expect(isUnreadableOcrText(t)).toBe(true);
  });

  it("lader rigtige ingredienslister være", () => {
    for (const t of [
      "Hvedemel, sukker, palmeolie, kakao (4%), mælkepulver, hævemiddel (natriumcarbonat), salt. Kan indeholde spor af nødder.",
      "Ingredienser: vand, sukker, æblejuice fra koncentrat (10%), syre (citronsyre).",
      "Havregryn (100%). Produceret på et anlæg, der også håndterer hvede.",
      "Mælk, ost (mælk), salt. Indeholder mælk.",
    ]) expect(isUnreadableOcrText(t)).toBe(false);
  });
});
