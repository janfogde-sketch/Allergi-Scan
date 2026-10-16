import { describe, it, expect } from "vitest";
import { areaLabel, shortMessage, uaSummary, sanitizeText, buildErrorPrompt, buildErrorsQuery, errorsFilterCount, filterOptions, historyEntries, occurrencesText, occurrenceRows, buildIdsOf, isBuildId } from "./errorsLogic.js";

const err = {
  id: "11111111-2222-3333-4444-555555555555", source: "react", screen: "profile", message: "Cannot read properties of undefined (reading 'default')",
  stack: "TypeError at https://www.eatsafe.dk/assets/a.js?token=abc123&x=1:1:2\n  at Bearer eyJabcdefgh.ijklmnopq.rstuvwxyz", url: "/profile?code=SECRET",
  user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1",
  occurrences: 12, first_seen: "2026-10-01T10:00:00Z", last_seen: "2026-10-15T09:00:00Z", reopen_count: 2, app_versions: ["a1", "b2"], user_id: "USER-SECRET-ID",
  context: { componentStack: "\n in Foo (at x.jsx:1)\n password=hunter2" },
};

describe("fejlside: tekster", () => {
  it("område, korte beskeder og antal", () => {
    expect(areaLabel({ screen: "scanner" })).toBe("scanner");
    expect(areaLabel({ source: "edge:allergen-check" })).toBe("Server: allergen-check");
    expect(areaLabel({ source: "window" })).toBe("Browser");
    expect(shortMessage("a\n  b".repeat(100), 20).length).toBeLessThanOrEqual(20);
    expect(occurrencesText(1)).toBe("1 forekomst");
    expect(occurrencesText(2)).toBe("2 forekomster");
  });
  it("platform i klartekst", () => {
    expect(uaSummary(err.user_agent)).toBe("iPhone · iOS 18.7 · Safari 18.7");
    expect(uaSummary(null)).toBe("");
  });
});

describe("fejlside: prompt til AI", () => {
  const p = buildErrorPrompt(err);
  it("indeholder det relevante", () => {
    expect(p).toContain("reading 'default'");
    expect(p).toContain("profile");
    expect(p).toContain("12");
    expect(p).toContain("a1, b2");
    expect(p).toContain("iPhone");
    expect(p).toMatch(/Find årsagen i den eksisterende kode/);
  });
  it("lækker aldrig tokens, koder, adgangskoder, bruger-id eller rå user agent", () => {
    for (const secret of ["abc123", "SECRET", "eyJabcdefgh", "hunter2", "USER-SECRET-ID", "AppleWebKit"]) expect(p).not.toContain(secret);
  });
  it("sanitizeText fjerner e-mails, nøgler og lange hex", () => {
    const t = sanitizeText("mail a@b.dk key=sk-abcdefghijklmnop12345 id 0123456789abcdef0123456789abcdef");
    expect(t).not.toMatch(/a@b\.dk|sk-abc|0123456789abcdef/);
  });
});

describe("fejlside: forespørgsel", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  it("status, skærm, alvorlighed, version og periode", () => {
    const q = buildErrorsQuery({ status: "open", screen: "scanner", severity: "high", version: "a1", period: "week" }, now);
    expect(q).toContain("status=eq.open");
    expect(q).toContain("screen=eq.scanner");
    expect(q).toContain("severity=eq.high");
    expect(q).toContain("app_versions=cs.");
    expect(q).toContain("last_seen=gte.2026-10-08");
    expect(q).toContain("order=last_seen.desc,id.desc");
  });
  it("'Alle' filtrerer ikke på status; 'Uden skærm' bruger is.null", () => {
    expect(buildErrorsQuery({ status: "all", screen: "__none" }, now)).not.toContain("status=eq");
    expect(buildErrorsQuery({ screen: "__none" }, now)).toContain("screen=is.null");
  });
  it("søgning dækker besked, skærm, stack og id, og farlige tegn fjernes", () => {
    const q = decodeURIComponent(buildErrorsQuery({ q: "foo,(bar)" }, now));
    expect(q).toContain("message.ilike.*foo bar*");
    expect(q).toContain("stack.ilike");
    expect(q).not.toContain("id.eq.");
    expect(buildErrorsQuery({ q: err.id }, now)).toContain(`id.eq.${err.id}`);
  });
  it("nøgle-paginering og brugerdefineret periode", () => {
    const q = decodeURIComponent(buildErrorsQuery({ cursor: { last_seen: "2026-10-01T00:00:00Z", id: "x" }, period: "custom", from: "2026-10-01", to: "2026-10-03" }, now));
    expect(q).toContain("last_seen.lt.2026-10-01T00:00:00Z");
    expect(q).toContain("last_seen=gte.2026-09-30T22:00:00.000Z");
    expect(q).toContain("last_seen=lt.2026-10-03T22:00:00.000Z");
  });
  it("tæller aktive filtre (ikke fane)", () => {
    expect(errorsFilterCount({ screen: "a", severity: "", period: "all", version: "v" })).toBe(2);
  });
});

describe("fejlside: valg og historik", () => {
  it("valgmuligheder ud fra data", () => {
    const o = filterOptions([{ screen: "b", app_versions: ["2"], severity: "low" }, { screen: null, app_version: "1" }, { screen: "a", app_versions: [] }]);
    expect(o.screens).toEqual(["a", "b"]);
    expect(o.hasNoScreen).toBe(true);
    expect(o.versions).toEqual(["1", "2"]);
    expect(o.severities).toEqual(["low"]);
  });
  it("historikken er kronologisk, starter med registreringen og viser hvem, hvornår, rettelse og begrundelse uden id'er", () => {
    const row = { first_seen: "2026-10-15T09:00:00Z" };
    const items = [
      { id: 3, action: "fejl_genaabnet", admin_id: null, created_at: "2026-10-16T08:00:00Z", details: { fra: "resolved", til: "open", automatisk: true } },
      { id: 2, action: "fejlstatus_aendret", admin_id: "a", created_at: "2026-10-15T12:00:00Z", details: { fra: "open", til: "resolved", rettelse: "Rettet i boot.js", verificeret_build: "d81f4e2" } },
      { id: 4, action: "fejlstatus_aendret", admin_id: "b", created_at: "2026-10-16T09:00:00Z", details: { fra: "open", til: "ignored", begrundelse: "Gammel" } },
      { id: 5, action: "fejlstatus_aendret", admin_id: "a", created_at: "2026-10-16T10:00:00Z", details: { fra: "ignored", til: "open" } },
      { id: 6, action: "fejlstatus_aendret", admin_id: "a", created_at: "2026-10-15T13:00:00Z", details: { fra: "open", til: "resolved", rettelse: "Fix" } },
    ];
    const h = historyEntries(row, items, { a: { name: "Jan" }, b: { email: "b@x.dk" } });
    expect(h.map((e) => e.title)).toEqual(["Fejl registreret", "Markeret som løst", "Markeret som løst", "Genåbnet automatisk (fejlen skete igen)", "Ignoreret", "Genåbnet manuelt"]);
    expect(h[0].who).toBe("System");
    expect(h[1]).toMatchObject({ who: "Jan", lines: ["Rettelse: Rettet i boot.js", "Angivet som verificeret i build d81f4e2"] });
    expect(h[2].lines).toContain("Verificeret build er ikke angivet");
    expect(h[3].who).toBe("System");
    expect(h[4]).toMatchObject({ who: "b@x.dk", lines: ["Begrundelse: Gammel"] });
    expect(JSON.stringify(h)).not.toMatch(/"key":"[0-9a-f-]{8,}/);
    expect(historyEntries(row, [], {})).toHaveLength(1); // kun registreringen; visningen siger "Ingen statusændringer endnu."
  });
  it("tidspunkter uden gentagelser: én forekomst viser kun 'Registreret'", () => {
    const t = "2026-10-15T09:53:22Z";
    expect(occurrenceRows({ first_seen: t, last_seen: t, occurrences: 1 })).toEqual([["Registreret", t]]);
    const many = occurrenceRows({ first_seen: t, last_seen: "2026-10-16T07:15:43Z", occurrences: 8 });
    expect(many.map((r) => r[0])).toEqual(["Første forekomst", "Seneste forekomst", "Antal forekomster"]);
    expect(many[2][1]).toBe("8");
    expect(occurrenceRows({ first_seen: t, last_seen: t, occurrences: 3 }).map((r) => r[0])).toContain("Antal forekomster");
  });
  it("build-id: kun faktiske værdier, første forekomst først", () => {
    expect(buildIdsOf({ app_versions: ["a1b2c3d", "e4f5a6b"], app_version: "a1b2c3d" })).toEqual(["a1b2c3d", "e4f5a6b"]);
    expect(buildIdsOf({ app_version: "d81f4e2" })).toEqual(["d81f4e2"]);
    expect(buildIdsOf({ app_version: null })).toEqual([]);
    expect(isBuildId("d81f4e2")).toBe(true);
    expect(isBuildId("D81F4E2AAAA")).toBe(true);
    expect(isBuildId("local")).toBe(false);
    expect(isBuildId("abc12")).toBe(false);
  });
  it("prompten bruger Build-id, henviser til oversættelsen og indeholder kun verificerede kodeplaceringer", () => {
    const e = { ...err, app_version: "d81f4e2", app_versions: ["d81f4e2"], context: { componentStack: "x", failedChunk: "ScannerScreen-BTWabc12.js", online: false } };
    const plain = buildErrorPrompt(e);
    expect(plain).toContain("Build-id (git-commit, første forekomst først): d81f4e2");
    expect(plain).not.toContain("Appversion");
    expect(plain).toContain("node scripts/symbolicate.mjs d81f4e2");
    expect(plain).toContain("Kodefil, der ikke kunne hentes: ScannerScreen-BTWabc12.js (enheden var offline)");
    expect(plain).not.toContain("Oprindelige kodeplaceringer");
    const withSrc = buildErrorPrompt(e, "lazyInitializer  node_modules/react/cjs/react.production.min.js:18:381");
    expect(withSrc).toContain("Oprindelige kodeplaceringer");
    expect(withSrc).toContain("react.production.min.js:18:381");
    expect(withSrc).not.toContain("scripts/symbolicate.mjs");
  });
});
