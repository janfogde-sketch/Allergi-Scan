import { describe, it, expect } from "vitest";
import { areaLabel, shortMessage, uaSummary, sanitizeText, buildErrorPrompt, buildErrorsQuery, errorsFilterCount, filterOptions, historyText, occurrencesText } from "./errorsLogic.js";

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
  it("historiklinje: hvem, hvornår, fra → til og begrundelse", () => {
    const h = historyText({ action: "fejlstatus_aendret", admin_id: "a", created_at: "2026-10-15T09:00:00Z", details: { fra: "open", til: "ignored", begrundelse: "Gammel" } }, { a: { name: "Jan" } });
    expect(h.who).toBe("Jan");
    expect(h.change).toBe("Åben → Ignoreret");
    expect(h.reason).toBe("Gammel");
    expect(historyText({ action: "fejl_genaabnet", admin_id: null, created_at: "2026-10-15T09:00:00Z", details: { fra: "resolved", til: "open" } }, {}).who).toBe("System");
  });
});
