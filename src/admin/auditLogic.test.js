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
    expect(auditCategory("rolle_aendret")).toBe("Sikkerhed");
    expect(auditCategory("noget_nyt")).toBe("Andet");
    expect(AUDIT_CATEGORIES).toContain("Allergier og profiler");
  });
  it("type og kategori giver en handlingsliste; uden fælles handling er svaret null", () => {
    expect(auditActionsFor({})).toBeNull();
    expect(auditActionsFor({ type: "deleted" })).toEqual(expect.arrayContaining(["produkt_slettet", "bruger_slettet"]));
    expect(auditActionsFor({ type: "deleted", category: "Produkter" })).toEqual(["produkt_slettet"]);
    expect(buildAuditQuery({ type: "exported", category: "Sikkerhed" }, NOW)).toBeNull();
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

import { auditChanges, auditValueText, auditOutcome, auditChangeText as changeText } from "./auditLogic.js";

describe("før/efter, oprettelser og afviste forsøg", () => {
  const NOW = new Date("2026-10-15T10:00:00Z");
  it("viser før/efter pr. felt for indhold, og tomme værdier som 'tom'", () => {
    const row = { details: { felter: ["allergens", "name"], aendringer: [{ felt: "allergens", fra: [], til: ["gluten", "mælk"] }, { felt: "name", fra: "A", til: null }] } };
    expect(auditChanges(row)).toEqual([{ felt: "allergens", fra: "tom", til: "gluten, mælk" }, { felt: "name", fra: "A", til: "tom" }]);
    expect(auditChanges({ details: { felter: ["name"] } })).toEqual([]);
    expect(auditValueText(0)).toBe("0");
    expect(auditValueText({ a: 1 })).toBe('{"a":1}');
  });
  it("oprettelser har egen type, og mislykket/afvist filtreres på udfald", () => {
    expect(auditActionType("produkt_oprettet")).toBe("created");
    expect(auditActionType("produkt_rettet", "mislykket")).toBe("failed");
    expect(auditActionType("adgang_naegtet", "afvist")).toBe("failed");
    expect(auditActionsFor({ type: "created" })).toEqual(expect.arrayContaining(["produkt_oprettet", "vidensindgang_oprettet"]));
    const q = buildAuditQuery({ type: "failed" }, NOW);
    expect(q).toContain("outcome=neq.ok");
    expect(q).not.toContain("action=in.");
    expect(q).toContain("details,outcome");
    expect(buildAuditQuery({ type: "failed", category: "Sikkerhed" }, NOW)).toContain("action=in.(rolle_aendret,adgang_naegtet,sikkerhedsmelding)");
    expect(auditOutcome({})).toBe("ok");
  });
  it("afviste forsøg og mislykkede handlinger læses som sætning", () => {
    const users = { u: { name: "Bo" }, a: { name: "Jan" } };
    expect(auditSummary({ action: "adgang_naegtet", outcome: "afvist", admin_id: "u", target_table: "edge_function", target_id: "products" }, { users }))
      .toBe("Bo blev nægtet adgang til serverfunktionen “products”");
    expect(auditSummary({ action: "allergener_gemt", outcome: "mislykket", admin_id: "a", target_table: "products", details: { navn: "Mel" } }, { users, products: {} }))
      .toBe("Jan gemte allergener på produktet “Mel” (mislykkedes)");
    expect(changeText({ details: { funktion: "products", fejl: "db_fejl" } })).toBe("Funktion: products · Fejl: db_fejl");
  });
});

import { buildAuditQuery as bq, auditCardParts, auditReason, auditTechRows, AUDIT_TYPES } from "./auditLogic.js";

describe("periode, kort og tekniske oplysninger", () => {
  const NOW = new Date("2026-10-15T10:00:00Z");
  it("'I dag' starter ved midnat i dansk tid", () => {
    expect(bq({ period: "today" }, NOW)).toContain("created_at=gte.2026-10-14T22%3A00%3A00.000Z");
  });
  it("en brugerdefineret periode er fra starten af første dag til og med sidste dag (dansk tid)", () => {
    const q = bq({ period: "custom", from: "2026-10-01", to: "2026-10-10" }, NOW);
    expect(q).toContain("created_at=gte.2026-09-30T22%3A00%3A00.000Z");
    expect(q).toContain("created_at=lt.2026-10-10T22%3A00%3A00.000Z");
    expect(bq({ period: "custom", from: "", to: "" }, NOW)).not.toContain("created_at=");
  });
  it("vinter- og sommertid håndteres (29. okt. er sommertid, 26. okt. skifter)", () => {
    expect(bq({ period: "custom", from: "2026-11-02" }, NOW)).toContain("created_at=gte.2026-11-01T23%3A00%3A00.000Z");
  });
  it("afvist er en egen type, og 'Behandlet' findes ikke mere", () => {
    expect(auditActionType("indsendelse_afvist")).toBe("rejected");
    expect(auditActionType("indsendelse_godkendt")).toBe("approved");
    expect(auditActionType("adgang_naegtet", "afvist")).toBe("failed");
    expect(Object.values(AUDIT_TYPES).map((t) => t.label)).not.toContain("Behandlet");
  });
  it("kortets dele: kategori, hvem, element og dato", () => {
    const c = auditCardParts({ action: "indsendelse_afvist", admin_id: "a", target_table: "submissions", details: { ean: "570" }, created_at: "2026-10-15T14:36:00Z" }, { users: { a: { name: "jafo" } } });
    expect(c).toEqual({ category: "Indsendelser", title: "Indsendelse afvist", by: "Afvist af jafo", target: "Indsendelse: EAN 570", date: "15. oktober 2026 · 16.36" });
  });
  it("begrundelse og tekniske oplysninger vises kun, når de findes", () => {
    expect(auditReason({ details: { begrundelse: " Findes allerede " } })).toBe("Findes allerede");
    expect(auditReason({ details: {} })).toBe("");
    expect(auditTechRows({ id: 5, admin_id: "u1", target_id: null, target_table: "products", action: "produkt_rettet", details: null }).map((x) => x[0])).toEqual(["Log-ID", "Bruger-ID", "Måltabel", "Handlingskode"]);
  });
});
