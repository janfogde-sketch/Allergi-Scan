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

import { buildAuditQuery, auditActionsFor, auditSummary, auditFilterCount, cleanSearch, auditActionType, auditCategory, fmtAuditDateTime, AUDIT_CATEGORIES } from "./auditLogic.js";

describe("filtre og forespørgsel til loggen", () => {
  const NOW = new Date("2026-10-15T10:00:00Z");
  it("grupperer handlinger i typer og kategorier, og ukendte er 'Ændret'/'Andet'", () => {
    expect(auditActionType("produkt_slettet")).toBe("deleted");
    expect(auditActionType("csv_eksport")).toBe("exported");
    expect(auditActionType("noget_nyt")).toBe("changed");
    expect(auditCategory("rolle_aendret")).toBe("Roller");
    expect(auditCategory("noget_nyt")).toBe("Andet");
    expect(AUDIT_CATEGORIES).toContain("Allergier og profiler");
  });
  it("type og kategori giver en handlingsliste; uden fælles handling er svaret null", () => {
    expect(auditActionsFor({})).toBeNull();
    expect(auditActionsFor({ type: "deleted" })).toEqual(expect.arrayContaining(["produkt_slettet", "bruger_slettet"]));
    expect(auditActionsFor({ type: "deleted", category: "Produkter" })).toEqual(["produkt_slettet"]);
    expect(buildAuditQuery({ type: "exported", category: "Roller" }, NOW)).toBeNull();
  });
  it("sorterer nyeste først med id som sidste nøgle og henter en side ad gangen", () => {
    const q = buildAuditQuery({ limit: 51 }, NOW);
    expect(q).toContain("order=created_at.desc,id.desc");
    expect(q).toContain("limit=51");
    expect(q).not.toContain("and=");
  });
  it("næste side bruger nøgle-paginering på (created_at, id)", () => {
    const q = buildAuditQuery({ cursor: { created_at: "2026-10-14T08:00:00.123456+00:00", id: 42 } }, NOW);
    expect(q).toContain("and=(or(created_at.lt.2026-10-14T08%3A00%3A00.123456%2B00%3A00,and(created_at.eq.2026-10-14T08%3A00%3A00.123456%2B00%3A00,id.lt.42)))");
  });
  it("periode giver en nedre tidsgrænse, og søgning samler navne-id'er, felter og handlingsnavne", () => {
    expect(buildAuditQuery({ period: "week" }, NOW)).toContain("created_at=gte.2026-10-08T10%3A00%3A00.000Z");
    expect(buildAuditQuery({ period: "all" }, NOW)).not.toContain("gte");
    const q = buildAuditQuery({ q: "rolle", matchIds: ["u1", "p1"] }, NOW);
    expect(q).toContain("admin_id.in.(u1,p1)");
    expect(q).toContain("target_id.in.(u1,p1)");
    expect(q).toContain("details->>navn.ilike.*rolle*");
    expect(q).toContain("action.in.(rolle_aendret)");
  });
  it("søgning og sidenøgle kombineres i ét and-filter, og søgeordet renses", () => {
    const q = buildAuditQuery({ q: "a,b)", cursor: { created_at: "2026-10-14T08:00:00Z", id: 1 } }, NOW);
    expect(q.match(/and=/g).length).toBeGreaterThanOrEqual(1);
    expect(q).not.toContain("a,b)");
    expect(cleanSearch(' x,(y)* "z" ')).toBe("x y z");
  });
  it("tæller kun filtre ud over søgningen", () => {
    expect(auditFilterCount({ type: "deleted", category: "", period: "all" })).toBe(1);
    expect(auditFilterCount({ type: "deleted", category: "Produkter", period: "week" })).toBe(3);
    expect(auditFilterCount({})).toBe(0);
  });
  it("sætning og dato til listen", () => {
    const users = { a: { name: "Jan" } };
    expect(auditSummary({ action: "produkt_rettet", admin_id: "a", target_table: "products", details: { navn: "Havredrik" } }, { users, products: {} })).toBe("Jan rettede produktet “Havredrik”");
    expect(auditSummary({ action: "csv_eksport", admin_id: "a", target_table: "products" }, { users })).toBe("Jan eksporterede produktlisten");
    expect(fmtAuditDateTime("2026-10-15T07:42:00Z")).toBe("15. oktober 2026 · 09.42");
  });
});
