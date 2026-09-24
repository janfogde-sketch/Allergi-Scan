// @ts-nocheck
// @vitest-environment jsdom
// ─────────────────────────────────────────────────────────────────────────────
// SharedComponents.test.jsx
// safetyStyle() is the single source of truth for how "safe/spor/farligt"
// is colored and iconed everywhere in the app (SafetyRow, SafetyPill, and
// the search-result status label). A previous version of this logic was
// duplicated three times with subtly different icons — this test locks down
// the one true mapping so a future edit can't silently reintroduce that.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { safetyStyle, IngredientsList } from "./SharedComponents.jsx";

describe("safetyStyle", () => {
  it("maps 'danger' to red with an × icon", () => {
    const s = safetyStyle("danger");
    expect(s.color).toBe("var(--red)");
    expect(s.icon).toBe("×");
  });

  it("maps 'warn' to amber with a ! icon", () => {
    const s = safetyStyle("warn");
    expect(s.color).toBe("var(--amber)");
    expect(s.icon).toBe("!");
  });

  it("maps anything else (including 'safe') to green with a ✓ icon", () => {
    expect(safetyStyle("safe").color).toBe("var(--green)");
    expect(safetyStyle("safe").icon).toBe("✓");
    expect(safetyStyle(undefined).icon).toBe("✓");
  });
});

describe("IngredientsList — fremhævning af nestede under-lister", () => {
  // Regressionstest for et bruger-rapporteret fund (24. sept. 2026, EAN
  // 5701979304599 "Sour cream & Onion"): en enkelt ingrediens (fx mælk)
  // fundet ét sted inde i en indlejret under-liste ("krydderiblanding (sukker,
  // salt, VALLEPULVER (MÆLK), ...)") fik HELE den indlejrede under-liste til
  // at fremhæves som allergen, fordi splitteren tidligere behandlede alt
  // inde i det yderste parentes-niveau som ét udeleligt "part". Nu splittes
  // der på alle kommaer uanset dybde, så kun de faktiske mælke-ingredienser
  // fremhæves.
  const ingredients = "64% kartofler, 29% solsikkeolie, 7% krydderiblanding (sukker, salt, løgpulver, VALLEPULVER (MÆLK), MÆLKESUKKER (MÆLK), MÆLKEPULVER (MÆLK), smagsforstærker (E621), persille, gærekstrakt, syre (æblesyre), aroma, krydderiekstrakt).";
  const flags = { laktose: "yes", maelkeallergi: "yes", gluten: "no", hvede: "no", aeg: "no", noedder: "no", jordnoedder: "no", soja: "no", fisk: "no", skaldyr: "no", selleri: "no", sennep: "no", sesam: "no", svovl: "no", lupin: "no", bloeddyr: "no" };

  function highlightedTexts(container) {
    const highlighted = [];
    for (const span of container.querySelectorAll("span[style]")) {
      if (span.style.background === "var(--red-lt)") highlighted.push(span.textContent);
    }
    return highlighted;
  }

  it("fremhæver kun de faktiske mælke-ingredienser, ikke resten af krydderiblandingen", () => {
    const { container } = render(<IngredientsList text={ingredients} allergenFlags={flags} />);
    const highlighted = highlightedTexts(container);

    expect(highlighted).toContain("VALLEPULVER (MÆLK)");
    expect(highlighted).toContain("MÆLKESUKKER (MÆLK)");
    expect(highlighted).toContain("MÆLKEPULVER (MÆLK)");
    expect(highlighted).not.toContain(expect.stringContaining("sukker, salt"));
  });

  it("fremhæver IKKE de øvrige, ikke-allergene ingredienser i samme under-liste", () => {
    const { container } = render(<IngredientsList text={ingredients} allergenFlags={flags} />);
    const highlighted = highlightedTexts(container);

    for (const safeWord of ["salt", "løgpulver", "persille", "gærekstrakt", "aroma"]) {
      expect(highlighted.some(h => h.toLowerCase() === safeWord)).toBe(false);
    }
  });
});
