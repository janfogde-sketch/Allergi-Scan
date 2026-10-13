import { describe, it, expect } from "vitest";
import { auditActionLabel, auditChangeText, shortId } from "./auditLogic.js";

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
