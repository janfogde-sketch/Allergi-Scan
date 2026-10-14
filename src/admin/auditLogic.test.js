import { describe, it, expect } from "vitest";
import { auditActionLabel, auditChangeText, shortId, auditNameIds, auditActorText, auditTargetText } from "./auditLogic.js";

describe("adminlog-tekster", () => {
  it("oversætter kendte handlinger og lader ukendte stå", () => {
    expect(auditActionLabel("rolle_aendret")).toBe("Rolle ændret");
    expect(auditActionLabel("noget_nyt")).toBe("noget_nyt");
  });
  it("viser skift fra → til", () => {
    expect(auditChangeText({ details: { fra: "user", til: "admin" } })).toBe("user → admin");
    expect(auditChangeText({ details: null })).toBe("");
  });
  it("forkorter id", () => {
    expect(shortId("12345678-aaaa")).toBe("12345678");
    expect(shortId(null)).toBe("—");
  });
});

describe("adminlog med navne og felter", () => {
  it("viser feltnavne, antal og push-tekst", () => {
    expect(auditChangeText({ details: { felter: ["allergen_flags", "name"], navn: "Kiks", ean: "1" } })).toBe("Felter: allergen_flags, name");
    expect(auditChangeText({ details: { handling: "tilføjet", antal: 2 } })).toBe("2 tilføjet");
    expect(auditChangeText({ details: { antal: 40 } })).toBe("40 rækker");
    expect(auditChangeText({ details: { titel: "Hej", tekst: "Ny vare" } })).toBe('"Hej: Ny vare"');
  });
  it("samler id'er til navneopslag", () => {
    const rows = [
      { admin_id: "a", target_table: "users", target_id: "u" },
      { admin_id: "a", target_table: "products", target_id: "p1" },
      { admin_id: "b", target_table: "products", target_id: "p2", details: { navn: "Kiks" } },
    ];
    expect(auditNameIds(rows)).toEqual({ users: ["a", "u", "b"], products: ["p1"] });
  });
  it("viser navne, når de findes, ellers kort id", () => {
    const users = { a: { name: "Jan" }, u: { email: "x@y.dk" } };
    expect(auditActorText({ admin_id: "a" }, users)).toBe("Jan");
    expect(auditActorText({ admin_id: "12345678-zz" }, users)).toBe("12345678");
    expect(auditTargetText({ target_table: "users", target_id: "u" }, { users })).toBe("Bruger: x@y.dk");
    expect(auditTargetText({ target_table: "products", target_id: "p", details: { navn: "Kiks", ean: "570" } }, {})).toBe("Produkt: Kiks (570)");
    expect(auditTargetText({ target_table: "submissions", target_id: "s", details: { ean: "570" } }, {})).toBe("Indsendelse: EAN 570");
    expect(auditTargetText({ action: "csv_eksport", target_table: "users" }, {})).toBe("Brugerliste");
    expect(auditTargetText({ target_table: "family_members", target_id: "abcdefgh-1" }, {})).toBe("Familiemedlem: abcdefgh");
  });
});
