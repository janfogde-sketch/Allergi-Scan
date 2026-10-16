import { describe, it, expect } from "vitest";
import { buildUsersQuery, onboardingStatus, usersCountText, normalizeENumber, normalizeCustom, prefsOf, diffPrefs, profileChanged, validBirthYear, csvCell, buildCsv, CSV_COLUMNS } from "./usersLogic.js";

describe("forespørgsel", () => {
  it("faner, søgning på navn og e-mail og nøgle-paginering kører på serveren", () => {
    const q = decodeURIComponent(buildUsersQuery({ filter: "admin", q: "an,(na)", cursor: { created_at: "2026-10-01T10:00:00Z", id: "x" } }));
    expect(q).toContain("role=eq.admin");
    expect(q).toContain("or(name.ilike.*an na*,email.ilike.*an na*)");
    expect(q).toContain("created_at.lt.2026-10-01T10:00:00Z");
    expect(q).toContain("order=created_at.desc,id.desc");
    expect(buildUsersQuery({ filter: "incomplete" })).toContain("onboarding_completed=eq.false");
    expect(buildUsersQuery({})).not.toContain("role=eq");
    expect(buildUsersQuery({})).toContain("limit=51");
  });
});

describe("onboardingstatus og tal", () => {
  it("er kun 'gennemført', når kolonnen faktisk siger det; manglende værdi er ukendt, aldrig færdig", () => {
    expect(onboardingStatus({ onboarding_completed: true }).label).toBe("Onboarding gennemført");
    expect(onboardingStatus({ onboarding_completed: false }).label).toBe("Onboarding ufærdig");
    expect(onboardingStatus({ onboarding_completed: null }).key).toBe("unknown");
    expect(onboardingStatus({}).key).toBe("unknown");
  });
  it("antalsteksten: 12 brugere, 2 af 12 brugere, 1 bruger", () => {
    expect(usersCountText(12, 12)).toBe("12 brugere");
    expect(usersCountText(2, 12)).toBe("2 af 12 brugere");
    expect(usersCountText(1, 1)).toBe("1 bruger");
    expect(usersCountText(3, null)).toBe("3 brugere");
    expect(usersCountText(null, 5)).toBe("");
  });
});

describe("præferencer", () => {
  it("E-numre og egne allergier gøres ens eller afvises", () => {
    expect(normalizeENumber(" e220 ")).toBe("E220");
    expect(normalizeENumber("E 160a")).toBe("E160A");
    expect(normalizeENumber("kanel")).toBeNull();
    expect(normalizeENumber("E12")).toBeNull();
    expect(normalizeCustom("  Frugt   og nødder ")).toBe("Frugt og nødder");
    expect(normalizeCustom("")).toBeNull();
    expect(normalizeCustom("<b>x</b>")).toBeNull();
    expect(normalizeCustom("x".repeat(61))).toBeNull();
  });
  it("ændringsoversigten viser tilføjet, fjernet, egne, E-numre og spor; ingen ændring er ingen linjer", () => {
    const before = prefsOf({ allergens: ["milk"], custom: ["kanel"], e_numbers: ["E220"], allergen_levels: { milk: "direct_only" } });
    expect(diffPrefs(before, before)).toEqual({ changed: false, lines: [] });
    const after = { allergens: ["egg", "milk"], custom: [], eNumbers: ["E220", "E250"], levels: {} };
    const d = diffPrefs(before, after, (x) => x.toUpperCase());
    expect(d.changed).toBe(true);
    expect(d.lines).toEqual(["Tilføjer allergi/intolerance: EGG", "Fjerner eget valg: kanel", "Tilføjer E-nummer: E250", "Sporadvarsel for MILK: slået til"]);
  });
  it("profil: ændring og fødselsår", () => {
    expect(profileChanged({ name: "A", birth_year: 1990, gender: "Mand" }, { name: " A ", birth_year: "1990", gender: "Mand" })).toBe(false);
    expect(profileChanged({ name: "A" }, { name: "B" })).toBe(true);
    expect(validBirthYear("", 2026)).toBe(true);
    expect(validBirthYear("1899", 2026)).toBe(false);
    expect(validBirthYear("2027", 2026)).toBe(false);
    expect(validBirthYear("1985", 2026)).toBe(true);
  });
});

describe("CSV", () => {
  it("celler, der kan blive formler, får et apostrof foran; almindelige citeres efter RFC 4180", () => {
    for (const v of ["=HYPERLINK(\"x\")", "+1", "-1", "@SUM(A1)", "\tx"]) expect(csvCell(v).replace(/^"/, "")).toMatch(/^'/);
    expect(csvCell("Hansen, Anne")).toBe("\"Hansen, Anne\"");
    expect(csvCell("Hun sagde \"hej\"")).toBe("\"Hun sagde \"\"hej\"\"\"");
    expect(csvCell(null)).toBe("");
  });
  it("standardeksporten indeholder kun det administrative minimum og danske tegn med BOM", () => {
    const csv = buildCsv([{ id: "uuid-1", name: "Søren =Admin", email: "s@x.dk", role: "admin", created_at: "2026-10-15T09:00:00Z", birth_year: 1980, onboarding_completed: true, allergens: ["milk"] }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const [head, row] = csv.slice(1).split("\n");
    expect(head).toBe("Navn,E-mail,Rolle,Oprettet,Onboarding");
    expect(row).toContain("Søren =Admin"); // apostrof kun foran, når cellen STARTER med et formeltegn
    expect(row).toContain("Administrator");
    expect(row).toContain("Onboarding gennemført");
    expect(csv).not.toMatch(/uuid-1|1980|milk/);
    expect(CSV_COLUMNS.map((c) => c.key)).not.toContain("id");
  });
});
