import { describe, it, expect } from "vitest";
import { loadHandler } from "./testing/edgeHarness.js";

const tokens = { "Bearer a": "user-a", "Bearer b": "user-b" };

describe("edge: family", () => {
  it("afviser kald uden token og med ugyldigt token (401), uden at røre databasen", async () => {
    const h = await loadHandler("family", { tokens });
    expect((await h.call("GET", "/family/group")).status).toBe(401);
    expect((await h.call("GET", "/family/group", { token: "ugyldig" })).status).toBe(401);
    expect(h.state.calls).toHaveLength(0);
  });

  it("svarer på CORS-forespørgsel uden login", async () => {
    const h = await loadHandler("family", { tokens });
    expect((await h.call("OPTIONS", "/family/group")).status).toBe(200);
  });

  it("kan ikke oprette en børneprofil på en andens konto (403, ingen skrivning)", async () => {
    const h = await loadHandler("family", { tokens });
    const r = await h.call("POST", "/family/members", { token: "a", body: { user_id: "user-b", name: "Ida" } });
    expect(r.status).toBe(403);
    expect(h.writes()).toHaveLength(0);
  });

  it("opretter en børneprofil på egen konto", async () => {
    const h = await loadHandler("family", {
      tokens,
      resolver: (c) => (c.table === "family_members" && c.kind === "insert" ? { data: { id: "m1", name: "Ida" }, error: null } : undefined),
    });
    const r = await h.call("POST", "/family/members", { token: "a", body: { user_id: "user-a", name: "Ida" } });
    expect(r.status).toBe(201);
    expect(h.writes()[0].op("insert")[0]).toMatchObject({ user_id: "user-a", name: "Ida" });
  });

  it("kræver user_id og navn (400)", async () => {
    const h = await loadHandler("family", { tokens });
    expect((await h.call("POST", "/family/members", { token: "a", body: { user_id: "user-a" } })).status).toBe(400);
  });

  for (const method of ["PATCH", "DELETE"]) {
    it(`${method} på en andens profil giver 403 og skriver intet`, async () => {
      const h = await loadHandler("family", {
        tokens,
        resolver: (c) => (c.table === "family_members" && c.kind === "select" ? { data: { user_id: "user-b" }, error: null } : undefined),
      });
      const r = await h.call(method, "/family/members/m1", { token: "a", body: { name: "Hacket" } });
      expect(r.status).toBe(403);
      expect(h.writes()).toHaveLength(0);
    });

    it(`${method} på en profil der ikke findes giver 403`, async () => {
      const h = await loadHandler("family", { tokens });
      expect((await h.call(method, "/family/members/m1", { token: "a", body: {} })).status).toBe(403);
      expect(h.writes()).toHaveLength(0);
    });
  }

  it("ejeren kan rette og slette egen profil", async () => {
    const h = await loadHandler("family", {
      tokens,
      resolver: (c) => {
        if (c.table !== "family_members") return undefined;
        if (c.kind === "select") return { data: { user_id: "user-a" }, error: null };
        if (c.kind === "update") return { data: { id: "m1", name: "Ny" }, error: null };
        return { data: null, error: null };
      },
    });
    expect((await h.call("PATCH", "/family/members/m1", { token: "a", body: { name: "Ny" } })).status).toBe(200);
    expect((await h.call("DELETE", "/family/members/m1", { token: "a" })).status).toBe(200);
    expect(h.writes().map((c) => c.kind)).toEqual(["update", "delete"]);
  });

  it("kan ikke afslutte forbindelsen til en konto, man ikke er forbundet med (403)", async () => {
    const h = await loadHandler("family", { tokens });
    const r = await h.call("DELETE", "/family/group/user-b", { token: "a" });
    expect(r.status).toBe(403);
    expect(h.writes()).toHaveLength(0);
  });

  it("afslutter forbindelsen og fjerner gensidig adgang til indkøbslister", async () => {
    const h = await loadHandler("family", {
      tokens,
      resolver: (c) => {
        if (c.table === "family_invites" && c.kind === "select") return { data: { id: "inv1" }, error: null };
        if (c.table === "shopping_lists") return { data: [{ id: "l1" }], error: null };
        return undefined;
      },
    });
    expect((await h.call("DELETE", "/family/group/user-b", { token: "a" })).status).toBe(200);
    const deleted = h.writes().map((c) => c.table);
    expect(deleted).toEqual(["family_invites", "shopping_list_access", "shopping_list_access"]);
  });

  it("viser kun mine familiemedlemmer med deres valg (GET group)", async () => {
    const h = await loadHandler("family", {
      tokens,
      resolver: (c) => {
        if (c.rpc === "family_group") return { data: ["user-a", "user-b"], error: null };
        if (c.table === "users") return { data: [{ id: "user-b", name: "B", email: "b@x.dk", diets: null, e_numbers: null, allergen_levels: null }], error: null };
        if (c.table === "family_invites") return { data: [{ accepted_by: "user-b" }], error: null };
        if (c.table === "user_allergens") return { data: [{ user_id: "user-b", allergen: "nuts", type: "allergen" }, { user_id: "user-b", allergen: "kiwi", type: "custom" }], error: null };
        return undefined;
      },
    });
    const r = await h.call("GET", "/family/group", { token: "a" });
    expect(r.status).toBe(200);
    expect(r.json.members).toHaveLength(1);
    expect(r.json.members[0]).toMatchObject({ id: "user-b", invitedByMe: true, allergens: ["nuts"], custom: ["kiwi"], diets: [], eNumbers: [] });
    // kalderens egen id sendes aldrig med i opslaget af medlemmer
    expect(h.state.calls.find((c) => c.table === "users").op("in")[1]).toEqual(["user-b"]);
  });
});

describe("edge: family, beskyttede felter", () => {
  it("en profil kan ikke flyttes til en anden konto via PATCH", async () => {
    const h = await loadHandler("family", {
      tokens,
      resolver: (c) => {
        if (c.table !== "family_members") return undefined;
        return c.kind === "select" ? { data: { user_id: "user-a" }, error: null } : { data: { id: "m1" }, error: null };
      },
    });
    const r = await h.call("PATCH", "/family/members/m1", { token: "a", body: { name: "Ny", user_id: "user-b", family_owner_id: "user-b", id: "x" } });
    expect(r.status).toBe(200);
    expect(h.writes()[0].op("update")[0]).toEqual({ name: "Ny" });
    expect((await h.call("PATCH", "/family/members/m1", { token: "a", body: { user_id: "user-b" } })).status).toBe(400);
  });
});
