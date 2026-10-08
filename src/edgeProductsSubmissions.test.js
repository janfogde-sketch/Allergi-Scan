import { describe, it, expect, vi, afterEach } from "vitest";
import { loadHandler } from "./testing/edgeHarness.js";

const tokens = { "Bearer a": "user-a", "Bearer adm": "user-admin" };
const roleOf = (c) => (c.has("eq", "id", "user-admin") ? "admin" : "user");

afterEach(() => vi.unstubAllGlobals());

describe("edge: products", () => {
  const offBody = { status: 1, product: { product_name: "Testkiks", brands: "Test", ingredients_text: "hvedemel, sukker", allergens_tags: ["en:gluten"], traces_tags: [] } };
  // fetch: OFF svarer med testproduktet, allergens-funktionen (intern) svarer ikke.
  const fetchStub = () => vi.fn(async (u) => (String(u).includes("openfoodfacts") ? new Response(JSON.stringify(offBody), { status: 200 }) : new Response("nej", { status: 500 })));

  const resolver = ({ product = null, limitOk = true } = {}) => (c) => {
    if (c.rpc === "bump_api_usage") return { data: limitOk, error: null };
    if (c.table === "products" && c.kind === "select") return { data: product, error: null };
    if (c.table === "users") return { data: { role: roleOf(c) }, error: null };
  };

  it("kendt produkt kan slås op uden login, og flag normaliseres", async () => {
    const h = await loadHandler("products", { tokens, resolver: resolver({ product: { id: "p1", ean: "5701234567890", name: "Mel", allergen_flags: { gluten: true, aeg: "no", fisk: null } } }) });
    const r = await h.call("GET", "/products/5701234567890");
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({ found: true, source: "local" });
    expect(r.json.allergen_flags).toMatchObject({ gluten: "yes", aeg: "no", fisk: "unknown", sesam: "unknown" });
  });

  it("ukendt stregkode kræver login (401) og kalder ikke Open Food Facts uden", async () => {
    const fetchMock = fetchStub();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("products", { tokens, resolver: resolver() });
    expect((await h.call("GET", "/products/5701234567890")).status).toBe(401);
    expect((await h.call("GET", "/products/5701234567890", { token: "ugyldig" })).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ugyldig stregkode (for kort) giver 'ikke fundet' uden login-krav og uden opslag udenfor", async () => {
    const fetchMock = fetchStub();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("products", { tokens, resolver: resolver() });
    const r = await h.call("GET", "/products/123");
    expect(r.json).toEqual({ found: false, product: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("over døgnloftet for nye opslag: 429 og Open Food Facts kaldes ikke", async () => {
    const fetchMock = fetchStub();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("products", { tokens, resolver: resolver({ limitOk: false }) });
    const r = await h.call("GET", "/products/5701234567890", { token: "a" });
    expect(r.status).toBe(429);
    expect(r.json.code).toBe("daily_limit");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("indlogget bruger får et nyt produkt fra Open Food Facts, markeret ubekræftet", async () => {
    vi.stubGlobal("fetch", fetchStub());
    const h = await loadHandler("products", { tokens, resolver: resolver() });
    const r = await h.call("GET", "/products/5701234567890", { token: "a" });
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({ found: true, source: "open_food_facts", verified: false });
    expect(r.json.allergen_flags.gluten).toBe("yes");
    expect(r.json.allergen_flags.sesam).toBe("unknown");
  });

  it("produkt der ikke findes nogen steder logges som manglende stregkode", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ status: 0 }), { status: 200 })));
    const h = await loadHandler("products", { tokens, resolver: resolver() });
    const r = await h.call("GET", "/products/5701234567890", { token: "a" });
    expect(r.json).toEqual({ found: false, product: null });
    await new Promise((res) => setTimeout(res, 0));
    expect(h.state.calls.some((c) => c.rpc === "log_missing_ean")).toBe(true);
  });

  for (const [method, path] of [["POST", "/products"], ["PATCH", "/products/p1"], ["DELETE", "/products/p1"]]) {
    it(`${method} kræver login (401) og admin (403): almindelig bruger kan ikke ændre produktdata`, async () => {
      const h = await loadHandler("products", { tokens, resolver: resolver() });
      const body = { ean: "5701234567890", name: "X" };
      expect((await h.call(method, path, { body })).status).toBe(401);
      expect((await h.call(method, path, { token: "ugyldig", body })).status).toBe(401);
      expect((await h.call(method, path, { token: "a", body })).status).toBe(403);
      expect(h.writes()).toHaveLength(0);
    });
  }

  it("admin kan oprette, rette og slette", async () => {
    const h = await loadHandler("products", { tokens, resolver: (c) => (c.kind === "insert" || c.kind === "update" ? { data: { id: "p1" }, error: null } : resolver()(c)) });
    expect((await h.call("POST", "/products", { token: "adm", body: { ean: "5701234567890", name: "X" } })).status).toBe(201);
    expect((await h.call("PATCH", "/products/p1", { token: "adm", body: { name: "Y" } })).status).toBe(200);
    expect((await h.call("DELETE", "/products/p1", { token: "adm" })).status).toBe(200);
    expect((await h.call("POST", "/products", { token: "adm", body: { name: "uden ean" } })).status).toBe(400);
  });
});

describe("edge: submissions", () => {
  const sub = (over) => ({ id: "s1", submitted_by: "user-a", type: "new_product", status: "pending", product_id: null, ean: "5701234567890", ...over });
  const resolver = ({ submission = sub(), limitOk = true, existingProduct = null, pending = null } = {}) => (c) => {
    if (c.rpc === "bump_api_usage") return { data: limitOk, error: null };
    if (c.table === "users") return { data: { role: roleOf(c) }, error: null };
    if (c.table === "admin_todos") return { data: [], error: null };
    if (c.table === "submissions" && c.kind === "select") {
      return c.has("eq", "status", "pending") && c.has("eq", "ean") ? { data: pending, error: null } : { data: submission, error: submission ? null : { message: "x" } };
    }
    if (c.table === "products" && c.kind === "select") return { data: existingProduct, error: existingProduct ? null : { message: "x" } };
    if (c.kind === "insert") return { data: { id: "ny" }, error: null };
  };
  const body = { ean: "5701234567890", submitted_by: "user-a", ai_parsed_data: { name: "X" } };

  it("kræver login (401)", async () => {
    const h = await loadHandler("submissions", { tokens, resolver: resolver() });
    for (const [m, p] of [["POST", "/submissions"], ["GET", "/submissions"], ["GET", "/submissions/s1"], ["PATCH", "/submissions/s1"]]) {
      expect((await h.call(m, p, { body })).status).toBe(401);
      expect((await h.call(m, p, { token: "ugyldig", body })).status).toBe(401);
    }
    expect(h.state.calls).toHaveLength(0);
  });

  it("indsendelse: kan ikke indsende på en andens vegne (403), ean og indsender er påkrævet (400)", async () => {
    const h = await loadHandler("submissions", { tokens, resolver: resolver() });
    expect((await h.call("POST", "/submissions", { token: "a", body: { ...body, submitted_by: "user-b" } })).status).toBe(403);
    expect((await h.call("POST", "/submissions", { token: "a", body: { submitted_by: "user-a" } })).status).toBe(400);
    expect(h.writes()).toHaveLength(0);
  });

  it("over døgnloftet: 429, admin får en to do, og intet gemmes", async () => {
    const h = await loadHandler("submissions", { tokens, resolver: resolver({ limitOk: false }) });
    const r = await h.call("POST", "/submissions", { token: "a", body });
    expect(r.status).toBe(429);
    expect(r.json.code).toBe("daily_limit");
    expect(h.writes().map((c) => c.table)).toEqual(["admin_todos"]);
  });

  it("nyt produkt: 409 hvis stregkoden findes eller allerede har en afventende indsendelse", async () => {
    const exists = await loadHandler("submissions", { tokens, resolver: resolver({ existingProduct: { id: "p1" } }) });
    expect((await exists.call("POST", "/submissions", { token: "a", body })).status).toBe(409);
    const pend = await loadHandler("submissions", { tokens, resolver: resolver({ pending: { id: "s9" } }) });
    expect((await pend.call("POST", "/submissions", { token: "a", body })).status).toBe(409);
    expect(exists.writes()).toHaveLength(0);
    expect(pend.writes()).toHaveLength(0);
  });

  it("nyt produkt gemmes som afventende, knyttet til den indloggede bruger", async () => {
    const h = await loadHandler("submissions", { tokens, resolver: resolver() });
    const r = await h.call("POST", "/submissions", { token: "a", body });
    expect(r.status).toBe(201);
    expect(h.writes()[0].op("insert")[0]).toMatchObject({ ean: "5701234567890", submitted_by: "user-a", status: "pending", type: "new_product" });
  });

  it("rettelsesforslag uden kendt produkt afvises (400)", async () => {
    const h = await loadHandler("submissions", { tokens, resolver: resolver() });
    expect((await h.call("POST", "/submissions", { token: "a", body: { ...body, type: "edit" } })).status).toBe(400);
    expect(h.writes()).toHaveLength(0);
  });

  it("kun admin kan liste alle indsendelser; en bruger kan kun se sine egne", async () => {
    const h = await loadHandler("submissions", { tokens, resolver: resolver({ submission: sub({ submitted_by: "user-b" }) }) });
    expect((await h.call("GET", "/submissions", { token: "a" })).status).toBe(403);
    expect((await h.call("GET", "/submissions/s1", { token: "a" })).status).toBe(403);
    expect((await h.call("GET", "/submissions/s1", { token: "adm" })).status).toBe(200);
    const own = await loadHandler("submissions", { tokens, resolver: resolver() });
    expect((await own.call("GET", "/submissions/s1", { token: "a" })).status).toBe(200);
  });

  it("kun admin kan godkende eller afvise (403), og ændrer intet for andre", async () => {
    const h = await loadHandler("submissions", { tokens, resolver: resolver() });
    const r = await h.call("PATCH", "/submissions/s1", { token: "a", body: { status: "approved", reviewed_by: "user-a" } });
    expect(r.status).toBe(403);
    expect(h.writes()).toHaveLength(0);
  });

  it("godkendt rettelse uden product_id ændrer ikke status (så forslaget ikke står som godkendt uden at være rettet)", async () => {
    const h = await loadHandler("submissions", { tokens, resolver: resolver({ submission: sub({ type: "edit", product_id: null }) }) });
    const r = await h.call("PATCH", "/submissions/s1", { token: "adm", body: { status: "approved", reviewed_by: "user-admin" } });
    expect(r.status).toBe(400);
    expect(h.writes()).toHaveLength(0);
  });

  it("afvisning gemmer status og begrundelse og rører ikke produktdata", async () => {
    const h = await loadHandler("submissions", { tokens, resolver: resolver() });
    const r = await h.call("PATCH", "/submissions/s1", { token: "adm", body: { status: "rejected", reviewed_by: "user-admin", review_note: "Utydeligt" } });
    expect(r.status).toBe(200);
    expect(h.writes().map((c) => c.table)).toEqual(["submissions"]);
    expect(h.writes()[0].op("update")[0]).toMatchObject({ status: "rejected", review_note: "Utydeligt" });
  });
});
