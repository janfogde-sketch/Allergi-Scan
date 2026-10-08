import { describe, it, expect, vi, afterEach } from "vitest";
import { loadHandler } from "./testing/edgeHarness.js";

const tokens = { "Bearer a": "user-a", "Bearer adm": "user-admin" };

afterEach(() => vi.unstubAllGlobals());

// Roller: user-admin er admin, user-a almindelig. users-opslag på e-mail/navn returnerer en testadresse (sendes aldrig noget: fetch er stubbet).
const base = (extra) => (c) => {
  if (c.table === "users" && c.kind === "select") {
    return c.op("select")?.[0] === "role"
      ? { data: { role: c.has("eq", "id", "user-admin") ? "admin" : "user" }, error: null }
      : { data: { email: "slettet@test.dk", name: "Test" }, error: null };
  }
  return extra?.(c);
};

describe("edge: delete-user", () => {
  it("afviser kald uden gyldigt login og sletter intet", async () => {
    const h = await loadHandler("delete-user", { tokens, resolver: base() });
    const r1 = await h.call("POST", "/delete-user", { body: { uid: "user-a" } });
    const r2 = await h.call("POST", "/delete-user", { token: "ugyldig", body: { uid: "user-a" } });
    for (const r of [r1, r2]) expect(r.status).toBeGreaterThanOrEqual(400);
    expect(h.writes()).toHaveLength(0);
    expect(h.state.deletedAuthUsers).toEqual([]);
  });

  it("kræver uid", async () => {
    const h = await loadHandler("delete-user", { tokens, resolver: base() });
    expect((await h.call("POST", "/delete-user", { token: "a", body: {} })).status).toBe(400);
    expect(h.state.deletedAuthUsers).toEqual([]);
  });

  it("en almindelig bruger kan ikke slette en anden konto", async () => {
    const h = await loadHandler("delete-user", { tokens, resolver: base() });
    const r = await h.call("POST", "/delete-user", { token: "a", body: { uid: "user-b" } });
    expect(r.status).toBe(400);
    expect(r.json.error).toMatch(/admin/i);
    expect(h.writes()).toHaveLength(0);
    expect(h.state.deletedAuthUsers).toEqual([]);
  });

  it("brugeren kan slette sig selv: alle brugerdata ryddes før kontoen fjernes, og alle sletninger rammer kun den bruger", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const h = await loadHandler("delete-user", { tokens, resolver: base((c) => (c.table === "submissions" || c.table === "products" ? { data: [], error: null } : undefined)) });
    const r = await h.call("POST", "/delete-user", { token: "a", body: { uid: "user-a" } });
    expect(r.status).toBe(200);
    expect(h.state.deletedAuthUsers).toEqual(["user-a"]);
    const tables = h.writes().filter((c) => c.kind === "delete" || c.kind === "update").map((c) => c.table);
    expect(tables).toEqual(expect.arrayContaining([
      "shopping_list_items", "shopping_lists", "shopping_list_access", "scan_history", "user_allergens",
      "family_members", "family_memberships", "feedback_tickets", "submissions", "users",
    ]));
    // users slettes sidst, og hver sletning er afgrænset til brugerens eget id
    expect(tables[tables.length - 1]).toBe("users");
    for (const w of h.writes()) {
      const eqs = w.ops.filter(([n]) => n === "eq").map(([, a]) => a[1]);
      expect(eqs).toEqual(["user-a"]);
    }
  });

  it("en admin kan slette en anden konto", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const h = await loadHandler("delete-user", { tokens, resolver: base((c) => (c.table === "submissions" ? { data: [], error: null } : undefined)) });
    expect((await h.call("POST", "/delete-user", { token: "adm", body: { uid: "user-b" } })).status).toBe(200);
    expect(h.state.deletedAuthUsers).toEqual(["user-b"]);
  });

  it("systemkald med service-nøglen (oprydning af inaktive konti) må slette uden brugerlogin", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const h = await loadHandler("delete-user", { tokens, resolver: base((c) => (c.table === "submissions" ? { data: [], error: null } : undefined)) });
    expect((await h.call("POST", "/delete-user", { token: "service-key", body: { uid: "user-b" } })).status).toBe(200);
    expect(h.state.deletedAuthUsers).toEqual(["user-b"]);
    // en gættet nøgle er ikke et systemkald
    const h2 = await loadHandler("delete-user", { tokens, resolver: base() });
    expect((await h2.call("POST", "/delete-user", { token: "service-key-x", body: { uid: "user-b" } })).status).toBeGreaterThanOrEqual(400);
    expect(h2.state.deletedAuthUsers).toEqual([]);
  });

  it("fejler et sletningstrin, stoppes der FØR kontoen fjernes, og brugeren får en kort dansk besked uden databasefejlen", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const h = await loadHandler("delete-user", {
      tokens,
      resolver: base((c) => {
        if (c.table === "submissions") return { data: [], error: null };
        if (c.table === "scan_history") return { data: null, error: { message: "violates foreign key constraint xyz" } };
      }),
    });
    const r = await h.call("POST", "/delete-user", { token: "a", body: { uid: "user-a" } });
    expect(r.status).toBe(500);
    expect(r.json.error).toContain("support@eatsafe.dk");
    expect(r.json.error).not.toContain("foreign key");
    expect(h.state.deletedAuthUsers).toEqual([]);
    expect(h.writes().some((c) => c.table === "users")).toBe(false);
    // fejlen logges
    expect(h.state.calls.some((c) => c.rpc === "log_client_error")).toBe(true);
  });

  it("sender slettekvittering kun når mailkanalen er slået til, og kun til kontoens egen adresse", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "x" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const resolver = (flag) => base((c) => {
      if (c.table === "submissions") return { data: [], error: null };
      if (c.rpc === "notification_flag") return { data: flag, error: null };
    });
    const off = await loadHandler("delete-user", { tokens, resolver: resolver(false), env: { RESEND_API_KEY: "re_test" } });
    await off.call("POST", "/delete-user", { token: "a", body: { uid: "user-a" } });
    expect(fetchMock).not.toHaveBeenCalled();

    const on = await loadHandler("delete-user", { tokens, resolver: resolver(true), env: { RESEND_API_KEY: "re_test" } });
    expect((await on.call("POST", "/delete-user", { token: "a", body: { uid: "user-a" } })).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(fetchMock.mock.calls[0])).toContain("slettet@test.dk");
  });
});
