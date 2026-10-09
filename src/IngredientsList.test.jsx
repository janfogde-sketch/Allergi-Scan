// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { IngredientsList } from "./SharedComponents.jsx";

afterEach(cleanup);

describe("IngredientsList: fremhævning efter brugerens valg", () => {
  it("en tom regelliste betyder 'intet er relevant': almindelige allergen-ord fremhæves ikke rødt (2. okt. 2026)", () => {
    const { container } = render(<IngredientsList text="Havregryn, vand, mælk" highlightRules={[]} />);
    expect(container.querySelectorAll("span").length).toBe(0);
    expect(container.textContent).toBe("Havregryn, vand, mælk");
  });
  it("uden highlightRules (fx Opskrifter) bruges stadig den generelle fremhævning", () => {
    render(<IngredientsList text="Havregryn, vand" />);
    expect(screen.getByText("Havregryn").style.color).toBe("var(--red)");
  });
  it('"Kan indeholde spor afæg" (manglende mellemrum): kun selve ordet "æg" markeres, ikke den foregående ingrediens', () => {
    const rules = [{ keywords: ["æg"], category: "trace", label: "Æg", reason: "spor" }];
    const { container } = render(<IngredientsList text="aromaer, olivenekstrakt. Kan indeholde spor afæg, mælk, soja" highlightRules={rules} />);
    const spans = [...container.querySelectorAll("span")];
    expect(spans.map(x => x.textContent)).toEqual(["æg"]);
    expect(spans[0].style.fontWeight).toBe("700");
    expect(spans[0].style.color).toBe("var(--amber)");
    expect(container.textContent).toContain("olivenekstrakt. Kan indeholde spor af æg");
  });
});
