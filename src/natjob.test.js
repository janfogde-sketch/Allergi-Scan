import { describe, expect, it } from "vitest";
import { buildApplyPayload, prepareQueue } from "../scripts/natjob-core.mjs";

const ID = "11111111-1111-4111-8111-111111111111";
const ID2 = "22222222-2222-4222-8222-222222222222";

describe("natjob-tråden (scripts/natjob-core.mjs)", () => {
  it("køen viser motorens fund og markerer lange lister uden fund til læsning", () => {
    const long = "vand, sukker, " + "ingrediens ".repeat(30);
    const q = prepareQueue({ allergen: [
      { id: ID, name: "A", ingredients_text: "hvedemel, sukker" },
      { id: ID2, name: "B", ingredients_text: long },
    ], category: [] });
    expect(q.allergen[0].needs_ai).toBe(false);
    expect(q.allergen[0].keyword_found.hvede).toBe("yes");
    expect(q.allergen[0].ingredients_text).toBeUndefined();
    expect(q.allergen[1].needs_ai).toBe(true);
    expect(q.allergen[1].ingredients_text).toBe(long);
    expect(q.taxonomy["Mejeri & æg"]).toContain("Ost");
  });

  it("trådens fund kan kun hæve, aldrig sænke motorens resultat", () => {
    const out = buildApplyPayload(
      { allergen: [{ id: ID, claude: { hvede: "no", sesam: "traces" } }] },
      { [ID]: "hvedemel, sukker" },
    );
    expect(out.allergen[0].method).toBe("keyword+claude");
    expect(out.allergen[0].flags.hvede).toBe("yes");
    expect(out.allergen[0].flags.sesam).toBe("traces");
    expect(out.allergen[0].flags.gluten).toBe("yes");
  });

  it("uden fund fra tråden bruges kun motoren", () => {
    const out = buildApplyPayload({ allergen: [{ id: ID }] }, { [ID]: "mælk, sukker" });
    expect(out.allergen[0].method).toBe("keyword");
    expect(out.allergen[0].flags.maelkeallergi).toBe("yes");
  });

  it("varer uden tekst springes over", () => {
    expect(buildApplyPayload({ allergen: [{ id: ID }] }, {}).allergen).toEqual([]);
  });

  it("afviser ukendte allergener, værdier, id'er og kategorier", () => {
    const t = { [ID]: "sukker" };
    expect(() => buildApplyPayload({ allergen: [{ id: ID, claude: { banan: "yes" } }] }, t)).toThrow();
    expect(() => buildApplyPayload({ allergen: [{ id: ID, claude: { sesam: "måske" } }] }, t)).toThrow();
    expect(() => buildApplyPayload({ allergen: [{ id: "x'; drop" }] }, t)).toThrow();
    expect(() => buildApplyPayload({ category: [{ id: ID, category: "Kolonial", subcategory: "Ost" }] }, t)).toThrow();
  });

  it("gyldige kategorier og spring-over går igennem", () => {
    const out = buildApplyPayload({ category: [
      { id: ID, category: "Mejeri & æg", subcategory: "Ost" },
      { id: ID2, skip: true },
    ] }, {});
    expect(out.category).toEqual([
      { id: ID, category: "Mejeri & æg", subcategory: "Ost" },
      { id: ID2, skip: true },
    ]);
  });
});
