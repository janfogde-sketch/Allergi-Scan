// @ts-nocheck
// G8 (14. okt. 2026): favoritter vurderes mod produktets NUVÆRENDE allergendata, ikke mod øjebliksbilledet fra da de blev gemt.
import { describe, it, expect } from "vitest";
import { favoriteFromRow } from "./useHistory.js";
import { evaluateProductForProfiles } from "./helpers.js";

const prof = { id: "me", name: "Mia", allergens: ["aeg"], custom: [], diets: [], eNumbers: [], levels: {} };
const row = (product) => ({
  ean: "5700000000001", user_id: "u1", added_at: "2026-10-01T10:00:00Z", category: null, users: { name: "Mia" },
  product_snapshot: { name: "Kiks", ean: "5700000000001", allergen_flags: { aeg: "no" }, ingredients: "Mel, sukker", productENumbers: [] },
  product,
});

describe("favoriteFromRow", () => {
  it("bruger friske allergenflag og ingredienser frem for øjebliksbilledet", () => {
    const f = favoriteFromRow(row({ ean: "5700000000001", allergen_flags: { aeg: "yes" }, ingredients_text: "Mel, æg, sukker" }), "u1");
    expect(f.freshData).toBe(true);
    expect(f.allergen_flags).toEqual({ aeg: "yes" });
    expect(f.ingredients).toBe("Mel, æg, sukker");
    expect(f.savedByMe).toBe(true);
    expect(evaluateProductForProfiles([prof], f).level).toBe("danger");
  });
  it("et gammelt 'nej' rettet til spor bliver orange, ikke grønt", () => {
    const f = favoriteFromRow(row({ allergen_flags: { aeg: "traces" }, ingredients_text: "Mel, sukker" }), "u1");
    expect(evaluateProductForProfiles([prof], f).level).toBe("warn");
  });
  it("uden produkt beholdes øjebliksbilledet, men markeres som ikke frisk", () => {
    const f = favoriteFromRow(row(null), "u2");
    expect(f.freshData).toBe(false);
    expect(f.allergen_flags).toEqual({ aeg: "no" });
    expect(f.savedByMe).toBe(false);
  });
});
