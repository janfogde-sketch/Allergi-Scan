// @ts-nocheck
// Regressionstest med rigtige/realistiske danske ingredienslister (kodegennemgang
// fase 2, 6. okt. 2026). Hver liste i src/fixtures/allergenRegression.json har et
// forventet svar for de allergener, listen handler om; "kilde" siger, hvor tilfældet
// kommer fra. Tilføj en liste her, hver gang et rigtigt produkt har givet et forkert svar.
import { describe, it, expect } from "vitest";
import cases from "./fixtures/allergenRegression.json";
import { analyzeIngredients, liftGlutenFromWheat } from "../supabase/functions/_shared/allergenEngine.js";

describe("allergenmotor — regressionslister", () => {
  it.each(cases.map((c) => [c.kilde + ": " + c.text.replace(/\n/g, " / "), c]))("%s", (_name, c) => {
    // Samme to trin som edge-funktionen: nøgleordsmotor, derefter hvede løfter gluten.
    const flags = liftGlutenFromWheat(analyzeIngredients(c.text));
    const actual = Object.fromEntries(Object.keys(c.expect).map((k) => [k, flags[k]]));
    expect(actual).toEqual(c.expect);
  });
});
