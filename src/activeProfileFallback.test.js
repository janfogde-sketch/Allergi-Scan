import { describe, it, expect } from "vitest";
import { buildActiveProfileList, evaluateProductForProfiles } from "./helpers.js";

// G2 (14. okt. 2026): en slettet profil i valget må aldrig give en tom profilliste (og dermed grønt).
describe("tomt profilvalg giver aldrig grønt", () => {
  const base = { user: { name: "Anna" }, family: [], allergens: ["noedder"], customAllerg: [], selectedENumbers: [] };

  it("ukendte profil-id'er sorteres fra, og ingen kendt profil giver tom liste (ikke forælderens profil)", () => {
    expect(buildActiveProfileList({ ...base, activeProfiles: ["slettet-barn"] })).toEqual([]);
    expect(buildActiveProfileList({ ...base, activeProfiles: ["slettet-barn", "me"] }).map(p => p.id)).toEqual(["me"]);
  });

  it("kendte profiler vælges som før", () => {
    const list = buildActiveProfileList({ ...base, family: [{ id: "k1", name: "Karl", allergens: [] }], activeProfiles: ["k1"] });
    expect(list.map(p => p.id)).toEqual(["k1"]);
  });

  it("ingen profiler at vurdere imod giver 'unknown', ikke 'safe'", () => {
    const ev = evaluateProductForProfiles([], { ingredients: "havregryn", allergen_flags: { noedder: "no" } });
    expect(ev.level).toBe("unknown");
    expect(ev.missing).toContain("Ingen profil valgt");
  });
});
