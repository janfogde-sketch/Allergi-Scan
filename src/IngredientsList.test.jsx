// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { IngredientsList } from "./SharedComponents.jsx";

afterEach(cleanup);

describe("IngredientsList: fremhævning efter brugerens valg", () => {
  it("en tom regelliste betyder 'intet er relevant': almindelige allergen-ord fremhæves ikke rødt (2. okt. 2026)", () => {
    render(<IngredientsList text="Havregryn, vand, mælk" highlightRules={[]} />);
    for (const word of ["Havregryn", "mælk"]) {
      const el = screen.getByText(word);
      expect(el.style.color).not.toBe("var(--red)");
      expect(el.style.background).not.toContain("red");
    }
  });
  it("uden highlightRules (fx Opskrifter) bruges stadig den generelle fremhævning", () => {
    render(<IngredientsList text="Havregryn, vand" />);
    expect(screen.getByText("Havregryn").style.color).toBe("var(--red)");
  });
});
