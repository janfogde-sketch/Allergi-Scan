import { describe, it, expect } from "vitest";
import { loadHandler } from "./testing/edgeHarness.js";

const tokens = { "Bearer a": "user-a", "Bearer b": "user-b" };

// Lister: l-a ejes af user-a (personlig), l-b af user-b (personlig), l-fam af user-b (delt med familien).
const LISTS = {
  "l-a": { owner_id: "user-a", type: "personal" },
  "l-b": { owner_id: "user-b", type: "personal" },
  "l-fam": { owner_id: "user-b", type: "family" },
};

function db({ group = ["user-a"], access = {}, limitOk = true } = {}) {
  return (c) => {
    if (c.rpc === "bump_api_usage") return { data: limitOk, error: null };
    if (c.rpc === "family_group") return { data: group, error: null };
    if (c.table === "shopping_lists" && c.kind === "select") {
      const id = c.op("eq")?.[1];
      if (c.has("eq", "share_link")) {
        const hit = Object.entries({ ...LISTS, "l-b": { ...LISTS["l-b"], name: "Min liste" } }).find(([, l]) => c.op("eq")[1] === (l.owner_id === "user-b" ? "CODE-B" : "CODE-A"));
        return { data: hit ? { id: hit[0], ...hit[1] } : null, error: null };
      }
      return { data: LISTS[id] ?? null, error: LISTS[id] ? null : { message: "no rows" } };
    }
    if (c.table === "shopping_list_access" && c.kind === "select") {
      const listId = c.ops.find(([n, a]) => n === "eq" && a[0] === "list_id")?.[1][1];
      return { data: access[listId] ? { permission: access[listId] } : null, error: null };
    }
    return undefined;
  };
}

describe("edge: shopping", () => {
  it("afviser kald uden gyldigt login (401) uden at røre databasen", async () => {
    const h = await loadHandler("shopping", { tokens });
    for (const [m, p] of [["GET", "/shopping?user_id=user-a"], ["POST", "/shopping"], ["GET", "/shopping/l-a/items"], ["DELETE", "/shopping/l-a"]]) {
      expect((await h.call(m, p)).status).toBe(401);
      expect((await h.call(m, p, { token: "ugyldig" })).status).toBe(401);
    }
    expect(h.state.calls).toHaveLength(0);
  });

  it("kan ikke hente en andens lister (403)", async () => {
    const h = await loadHandler("shopping", { tokens, resolver: db() });
    expect((await h.call("GET", "/shopping?user_id=user-b", { token: "a" })).status).toBe(403);
    expect((await h.call("GET", "/shopping", { token: "a" })).status).toBe(400);
  });

  it("kan ikke oprette en liste på en andens konto (403)", async () => {
    const h = await loadHandler("shopping", { tokens, resolver: db() });
    const r = await h.call("POST", "/shopping", { token: "a", body: { owner_id: "user-b", name: "Spøg" } });
    expect(r.status).toBe(403);
    expect(h.writes()).toHaveLength(0);
  });

  it("opretter en personlig liste, og ukendt type bliver personlig", async () => {
    const h = await loadHandler("shopping", { tokens, resolver: (c) => (c.kind === "insert" ? { data: { id: "ny" }, error: null } : db()(c)) });
    const r = await h.call("POST", "/shopping", { token: "a", body: { owner_id: "user-a", name: "Uge 41", type: "alle" } });
    expect(r.status).toBe(201);
    expect(h.writes()[0].op("insert")[0]).toMatchObject({ owner_id: "user-a", type: "personal" });
  });

  describe("listepunkter", () => {
    it("fremmed (uden adgang) kan hverken læse, tilføje, rette eller slette punkter", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: db() });
      expect((await h.call("GET", "/shopping/l-b/items", { token: "a" })).status).toBe(403);
      expect((await h.call("POST", "/shopping/l-b/items", { token: "a", body: { name: "Mælk", added_by: "user-a" } })).status).toBe(403);
      expect((await h.call("PATCH", "/shopping/l-b/items/i1", { token: "a", body: { checked: true } })).status).toBe(403);
      expect((await h.call("DELETE", "/shopping/l-b/items/i1", { token: "a" })).status).toBe(403);
      expect(h.writes()).toHaveLength(0);
    });

    it("kan ikke tilføje et punkt i en andens navn (403)", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: db() });
      const r = await h.call("POST", "/shopping/l-a/items", { token: "a", body: { name: "Mælk", added_by: "user-b" } });
      expect(r.status).toBe(403);
      expect(h.writes()).toHaveLength(0);
    });

    it("ejeren kan tilføje, og punktet bindes til listen", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: (c) => (c.kind === "insert" ? { data: { id: "i1" }, error: null } : db()(c)) });
      const r = await h.call("POST", "/shopping/l-a/items", { token: "a", body: { name: "Mælk", added_by: "user-a", list_id: "l-b" } });
      expect(r.status).toBe(201);
      expect(h.writes()[0].op("insert")[0]).toMatchObject({ list_id: "l-a", added_by: "user-a", checked: false, quantity: 1 });
    });

    it("rettelse og sletning er bundet til den autoriserede liste (IDOR)", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: (c) => (c.kind === "update" ? { data: { id: "i1" }, error: null } : db()(c)) });
      await h.call("PATCH", "/shopping/l-a/items/i1", { token: "a", body: { checked: true } });
      await h.call("DELETE", "/shopping/l-a/items/i1", { token: "a" });
      for (const w of h.writes()) {
        expect(w.has("eq", "id", "i1")).toBe(true);
        expect(w.has("eq", "list_id", "l-a")).toBe(true);
      }
      expect(h.writes()).toHaveLength(2);
    });

    it("et punkt kan ikke flyttes over på en andens liste via PATCH", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: (c) => (c.kind === "update" ? { data: { id: "i1" }, error: null } : db()(c)) });
      await h.call("PATCH", "/shopping/l-a/items/i1", { token: "a", body: { checked: true, list_id: "l-b", added_by: "user-b", id: "x" } });
      const patch = h.writes()[0].op("update")[0];
      expect(patch).toEqual({ checked: true });
    });

    it("modtager med kun læseadgang kan se, men ikke ændre", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: db({ access: { "l-b": "view" } }) });
      expect((await h.call("GET", "/shopping/l-b/items", { token: "a" })).status).toBe(200);
      expect((await h.call("DELETE", "/shopping/l-b/items/i1", { token: "a" })).status).toBe(403);
      expect(h.writes()).toHaveLength(0);
    });

    it("modtager med redigeringsadgang og familien (type=family) kan ændre", async () => {
      const edit = await loadHandler("shopping", { tokens, resolver: db({ access: { "l-b": "edit" } }) });
      expect((await edit.call("DELETE", "/shopping/l-b/items/i1", { token: "a" })).status).toBe(200);
      const fam = await loadHandler("shopping", { tokens, resolver: db({ group: ["user-a", "user-b"] }) });
      expect((await fam.call("DELETE", "/shopping/l-fam/items/i1", { token: "a" })).status).toBe(200);
      // samme familieliste uden forbindelse til ejeren
      const stranger = await loadHandler("shopping", { tokens, resolver: db({ group: ["user-a"] }) });
      expect((await stranger.call("DELETE", "/shopping/l-fam/items/i1", { token: "a" })).status).toBe(403);
    });
  });

  describe("lister", () => {
    it("kun ejeren kan slette en liste, også selv om man har redigeringsadgang", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: db({ access: { "l-b": "edit" } }) });
      expect((await h.call("DELETE", "/shopping/l-b", { token: "a" })).status).toBe(403);
      expect(h.writes()).toHaveLength(0);
      expect((await h.call("DELETE", "/shopping/l-a", { token: "a" })).status).toBe(200);
      expect(h.writes()).toHaveLength(1);
    });

    it("redigeringsmodtager må omdøbe, men ikke ændre hvem listen er delt med", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: (c) => (c.kind === "update" ? { data: { id: "l-b" }, error: null } : db({ access: { "l-b": "edit" } })(c)) });
      expect((await h.call("PATCH", "/shopping/l-b", { token: "a", body: { type: "family" } })).status).toBe(403);
      expect((await h.call("PATCH", "/shopping/l-b", { token: "a", body: { name: "Nyt navn", owner_id: "user-a", share_link: "X" } })).status).toBe(200);
      const patch = h.writes()[0].op("update")[0];
      expect(Object.keys(patch).sort()).toEqual(["name", "updated_at"]);
    });

    it("kun ejeren kan se, give og fjerne andres adgang; kun til personer i familien", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: db({ group: ["user-a", "user-b"] }) });
      expect((await h.call("GET", "/shopping/l-b/access", { token: "a" })).status).toBe(403);
      expect((await h.call("POST", "/shopping/l-b/access", { token: "a", body: { user_id: "user-a" } })).status).toBe(403);
      expect((await h.call("DELETE", "/shopping/l-b/access/user-b", { token: "a" })).status).toBe(403);
      expect(h.writes()).toHaveLength(0);

      const solo = await loadHandler("shopping", { tokens, resolver: db({ group: ["user-a"] }) });
      expect((await solo.call("POST", "/shopping/l-a/access", { token: "a", body: { user_id: "user-b" } })).status).toBe(403);
      expect(solo.writes()).toHaveLength(0);
    });

    it("alle med adgang kan forlade en delt liste, men ikke fjerne en tredjepart", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: db() });
      // user-a er ikke ejer af l-b men fjerner sin egen adgang
      expect((await h.call("DELETE", "/shopping/l-b/access/user-a", { token: "a" })).status).toBe(200);
      expect((await h.call("DELETE", "/shopping/l-b/access/user-c", { token: "a" })).status).toBe(403);
    });

    it("kun ejeren kan lave nyt link", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: db() });
      expect((await h.call("POST", "/shopping/l-b/rotate-code", { token: "a" })).status).toBe(403);
      expect(h.writes()).toHaveLength(0);
    });
  });

  describe("listekoder", () => {
    it("forhåndsvisning og tilslutning tæller mod døgnloftet (429 uden at slå noget op)", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: db({ limitOk: false }) });
      const p = await h.call("GET", "/shopping/preview?code=code-b", { token: "a" });
      const j = await h.call("POST", "/shopping/join", { token: "a", body: { code: "code-b" } });
      expect(p.status).toBe(429);
      expect(j.status).toBe(429);
      expect(p.json.code).toBe("daily_limit");
      expect(h.state.calls.some((c) => c.table === "shopping_lists")).toBe(false);
      expect(h.writes()).toHaveLength(0);
    });

    it("ugyldig kode giver 404; forhåndsvisning skjuler listens id for udenforstående", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: db() });
      expect((await h.call("GET", "/shopping/preview?code=ukendt", { token: "a" })).status).toBe(404);
      const r = await h.call("GET", "/shopping/preview?code=code-b", { token: "a" });
      expect(r.status).toBe(200);
      expect(r.json.list.id).toBeUndefined();
      expect(r.json.list.already_member).toBe(false);
    });

    it("tilslutning giver redigeringsadgang; ejeren kan ikke tilslutte sin egen liste", async () => {
      const h = await loadHandler("shopping", { tokens, resolver: db() });
      expect((await h.call("POST", "/shopping/join", { token: "a", body: { code: "code-a" } })).status).toBe(400);
      expect(h.writes()).toHaveLength(0);
      expect((await h.call("POST", "/shopping/join", { token: "a", body: { code: "code-b" } })).status).toBe(200);
      expect(h.writes()[0].op("upsert")[0]).toMatchObject({ list_id: "l-b", user_id: "user-a", permission: "edit" });
    });
  });
});
