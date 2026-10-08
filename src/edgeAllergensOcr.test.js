import { describe, it, expect, vi, afterEach } from "vitest";
import { loadHandler } from "./testing/edgeHarness.js";

const tokens = { "Bearer a": "user-a", "Bearer adm": "user-admin" };

afterEach(() => vi.unstubAllGlobals());

const claudeReply = (obj) => new Response(JSON.stringify({ content: [{ text: JSON.stringify(obj) }], usage: { input_tokens: 10, output_tokens: 5 } }), { status: 200 });

// Resolver: døgnloftet er ok/ikke ok, og rollen slås op for save.
const resolver = ({ limitOk = true, role = "user" } = {}) => (c) => {
  if (c.rpc === "bump_api_usage" || c.rpc === "bump_api_usage_global") return { data: limitOk, error: null };
  if (c.table === "users") return { data: { role }, error: null };
  if (c.table === "admin_todos" && c.kind === "select") return { data: [], error: null };
};

describe("edge: allergens", () => {
  it("kræver login (401), men tillader det interne cron-kald med service-nøglen", async () => {
    const h = await loadHandler("allergens", { tokens, resolver: resolver() });
    expect((await h.call("POST", "/allergens", { body: { text: "mælk" } })).status).toBe(401);
    expect((await h.call("POST", "/allergens", { token: "ugyldig", body: { text: "mælk" } })).status).toBe(401);
    expect((await h.call("POST", "/allergens", { headers: { apikey: "forkert" }, body: { text: "mælk" } })).status).toBe(401);
    expect((await h.call("POST", "/allergens", { headers: { apikey: "service-key" }, body: { text: "mælk" } })).status).toBe(200);
  });

  it("kræver tekst (400) og afviser urimeligt lang tekst (413) før noget betalt kaldes", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("allergens", { tokens, resolver: resolver(), env: { ANTHROPIC_API_KEY: "k" } });
    expect((await h.call("POST", "/allergens", { token: "a", body: {} })).status).toBe(400);
    expect((await h.call("POST", "/allergens", { token: "a", body: { text: "x".repeat(20_001), force_ai: true } })).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("nøgleordsmotoren finder direkte indhold, og uden usikkerhed bruges Claude ikke", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("allergens", { tokens, resolver: resolver(), env: { ANTHROPIC_API_KEY: "k" } });
    const r = await h.call("POST", "/allergens", { token: "a", body: { text: "Hvedemel, sukker, mælk, æg" } });
    expect(r.status).toBe(200);
    expect(r.json.method).toBe("keyword");
    expect(r.json.allergen_flags).toMatchObject({ hvede: "yes", maelkeallergi: "yes", aeg: "yes" });
    expect(r.json.saved).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Claude kan tilføje spor, men aldrig nedgradere et fund fra nøgleordsmotoren", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => claudeReply({ maelkeallergi: "no", aeg: "no", sesam: "traces" })));
    const h = await loadHandler("allergens", { tokens, resolver: resolver(), env: { ANTHROPIC_API_KEY: "k" } });
    const r = await h.call("POST", "/allergens", { token: "a", body: { text: "mælk, sukker", force_ai: true } });
    expect(r.json.method).toBe("keyword+claude");
    expect(r.json.allergen_flags.maelkeallergi).toBe("yes");
    expect(r.json.allergen_flags.sesam).toBe("traces");
  });

  it("ugyldige værdier fra Claude gøres til 'no', så de aldrig lander i produktdata", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => claudeReply({ sesam: "maybe", soja: "YES", fisk: 3 })));
    const h = await loadHandler("allergens", { tokens, resolver: resolver(), env: { ANTHROPIC_API_KEY: "k" } });
    const r = await h.call("POST", "/allergens", { token: "a", body: { text: "sukker", force_ai: true } });
    expect(["no", "unknown"]).toContain(r.json.allergen_flags.sesam);
    for (const v of Object.values(r.json.allergen_flags)) expect(["yes", "traces", "no", "unknown"]).toContain(v);
  });

  it("Claude-fejl giver stadig et svar fra nøgleordsmotoren", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("fejl", { status: 500 })));
    const h = await loadHandler("allergens", { tokens, resolver: resolver(), env: { ANTHROPIC_API_KEY: "k" } });
    const r = await h.call("POST", "/allergens", { token: "a", body: { text: "mælk", force_ai: true } });
    expect(r.status).toBe(200);
    expect(r.json.method).toBe("keyword");
    expect(r.json.allergen_flags.maelkeallergi).toBe("yes");
  });

  it("over døgnloftet springes Claude over, nøgleordsmotoren svarer, og admin får en to do (én gang)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("allergens", { tokens, resolver: resolver({ limitOk: false }), env: { ANTHROPIC_API_KEY: "k" } });
    const r = await h.call("POST", "/allergens", { token: "a", body: { text: "mælk", force_ai: true } });
    expect(r.status).toBe(200);
    expect(r.json.method).toBe("keyword");
    expect(fetchMock).not.toHaveBeenCalled();
    const todo = h.writes().find((c) => c.table === "admin_todos");
    expect(todo.op("insert")[0]).toMatchObject({ priority: "high", track: "drift" });
  });

  it("internt kald tæller mod det globale loft, ikke en brugers", async () => {
    const h = await loadHandler("allergens", { tokens, resolver: resolver(), env: { ANTHROPIC_API_KEY: "k" } });
    vi.stubGlobal("fetch", vi.fn(async () => claudeReply({})));
    await h.call("POST", "/allergens", { headers: { apikey: "service-key" }, body: { text: "mælk", force_ai: true } });
    expect(h.state.calls.some((c) => c.rpc === "bump_api_usage_global")).toBe(true);
    expect(h.state.calls.some((c) => c.rpc === "bump_api_usage")).toBe(false);
  });

  it("save kræver admin: almindelig bruger får 403 og intet skrives til produktet", async () => {
    const h = await loadHandler("allergens", { tokens, resolver: resolver({ role: "user" }) });
    const r = await h.call("POST", "/allergens", { token: "a", body: { text: "mælk", save: true, product_id: "p1" } });
    expect(r.status).toBe(403);
    expect(h.writes()).toHaveLength(0);
  });

  it("admin og interne kald kan gemme på produktet, med herkomst", async () => {
    const h = await loadHandler("allergens", { tokens, resolver: resolver({ role: "admin" }) });
    const r = await h.call("POST", "/allergens", { token: "adm", body: { text: "mælk", save: true, product_id: "p1" } });
    expect(r.status).toBe(200);
    expect(r.json.saved).toBe(true);
    const w = h.writes()[0];
    expect(w.table).toBe("products");
    expect(w.op("update")[0]).toMatchObject({ allergen_source_method: "keyword" });
    expect(w.has("eq", "id", "p1")).toBe(true);

    const internal = await loadHandler("allergens", { tokens, resolver: resolver({ role: "user" }) });
    expect((await internal.call("POST", "/allergens", { headers: { apikey: "service-key" }, body: { text: "mælk", save: true, product_id: "p1" } })).json.saved).toBe(true);
  });
});

describe("edge: ocr", () => {
  const body = { image_base64: "/9j/AAAA", mode: "ingredients" };

  it("kræver login (401) og rører hverken tæller eller Claude uden", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("ocr", { tokens, resolver: resolver(), env: { ANTHROPIC_API_KEY: "k" } });
    expect((await h.call("POST", "/ocr", { body })).status).toBe(401);
    expect((await h.call("POST", "/ocr", { token: "ugyldig", body })).status).toBe(401);
    expect(h.state.calls).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("over døgnloftet: 429 med kode daily_limit, og Claude kaldes ikke", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("ocr", { tokens, resolver: resolver({ limitOk: false }), env: { ANTHROPIC_API_KEY: "k" } });
    const r = await h.call("POST", "/ocr", { token: "a", body });
    expect(r.status).toBe(429);
    expect(r.json.code).toBe("daily_limit");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("kræver billede (400) og afviser for stort billede (413)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("ocr", { tokens, resolver: resolver(), env: { ANTHROPIC_API_KEY: "k" } });
    expect((await h.call("POST", "/ocr", { token: "a", body: {} })).status).toBe(400);
    expect((await h.call("POST", "/ocr", { token: "a", body: { image_base64: "A".repeat(8_000_001) } })).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hver tilstand får sin egen opgavetekst, og ukendt tilstand bliver ingrediensliste", async () => {
    const sent = [];
    vi.stubGlobal("fetch", vi.fn(async (_u, init) => {
      sent.push(JSON.parse(init.body).messages[0].content[1].text);
      return new Response(JSON.stringify({ content: [{ text: " 5701234567890 " }], usage: {} }), { status: 200 });
    }));
    const h = await loadHandler("ocr", { tokens, resolver: resolver(), env: { ANTHROPIC_API_KEY: "k" } });
    for (const mode of ["product_name", "nutrition", "ean_from_image", "ingredients", "findes-ikke"]) {
      const r = await h.call("POST", "/ocr", { token: "a", body: { image_base64: "iVBORAAA", mode } });
      expect(r.json).toMatchObject({ success: true, text: "5701234567890" });
    }
    expect(new Set(sent.slice(0, 4)).size).toBe(4);
    expect(sent[4]).toBe(sent[3]);
  });

  it("Claude-fejl giver 502, og manglende nøgle giver 500 uden at lække noget", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nede", { status: 529 })));
    const h = await loadHandler("ocr", { tokens, resolver: resolver(), env: { ANTHROPIC_API_KEY: "k" } });
    expect((await h.call("POST", "/ocr", { token: "a", body })).status).toBe(502);
    const noKey = await loadHandler("ocr", { tokens, resolver: resolver() });
    expect((await noKey.call("POST", "/ocr", { token: "a", body })).status).toBe(500);
  });
});
