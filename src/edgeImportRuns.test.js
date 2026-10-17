import { describe, it, expect, vi, afterEach } from "vitest";
import { loadHandler } from "./testing/edgeHarness.js";

// Kørselslog for import og genanalyse: én kørsel ad gangen, tællerne gemmes, og tekniske fejl hos kilderne gør kørslen delvist gennemført/mislykket (aldrig "ok").
afterEach(() => vi.unstubAllGlobals());
const SERVICE = { Authorization: "Bearer service-key" };
const tokens = { "Bearer adm": "admin-1", "Bearer usr": "user-1" };

const runUpdates = (h) => h.state.calls.filter((c) => c.table === "import_runs" && c.kind === "update").map((c) => c.op("update")[0]);

describe("edge: auto-reparse kørselslog", () => {
  const product = (n) => ({ id: `p${n}`, ean: `570000000000${n}`, name: `Vare ${n}`, ingredients_text: "hvedemel, sukker", allergen_flags: { gluten: "unknown" }, allergen_quality: "low" });
  const resolver = ({ busy = false, list = [product(1), product(2)] } = {}) => (c) => {
    if (c.rpc === "import_run_start") return { data: busy ? null : "run-1", error: null };
    if (c.table === "users") return { data: { role: "admin" }, error: null };
    if (c.table === "products" && c.kind === "select") return { data: list, error: null };
    if (c.table === "products" && c.kind === "update") return { data: null, error: null };
  };

  it("en kørsel mens en anden er i gang afvises (409) uden at røre produkter", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const h = await loadHandler("auto-reparse", { tokens, resolver: resolver({ busy: true }) });
    const r = await h.call("POST", "/auto-reparse", { headers: SERVICE, body: { manual: false } });
    expect(r.status).toBe(409);
    expect(r.json.busy).toBe(true);
    expect(h.writes().filter((c) => c.table === "products")).toHaveLength(0);
  });
  it("gennemført kørsel gemmer tællerne og tæller hævede allergener og AI-kald", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ allergen_flags: { gluten: "yes" }, method: "keyword+claude" }), { status: 200 })));
    const h = await loadHandler("auto-reparse", { tokens, resolver: resolver() });
    const r = await h.call("POST", "/auto-reparse", { headers: SERVICE, body: { manual: false } });
    expect(r.status).toBe(200);
    const [u] = runUpdates(h);
    expect(u.status).toBe("ok");
    expect(u.counts).toMatchObject({ processed: 2, reparsed: 2, errors: 0, changed: 2, ai_calls: 2 });
  });
  it("fejl i analysen giver delvist gennemført eller mislykket, aldrig ok", async () => {
    let n = 0;
    vi.stubGlobal("fetch", vi.fn(async () => (++n === 1 ? new Response(JSON.stringify({ allergen_flags: { gluten: "yes" }, method: "keyword" }), { status: 200 }) : new Response("fejl", { status: 500 }))));
    let h = await loadHandler("auto-reparse", { tokens, resolver: resolver() });
    await h.call("POST", "/auto-reparse", { headers: SERVICE, body: {} });
    expect(runUpdates(h)[0]).toMatchObject({ status: "partial", counts: { reparsed: 1, errors: 1 } });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nede", { status: 503 })));
    h = await loadHandler("auto-reparse", { tokens, resolver: resolver() });
    await h.call("POST", "/auto-reparse", { headers: SERVICE, body: {} });
    expect(runUpdates(h)[0]).toMatchObject({ status: "failed", counts: { reparsed: 0, errors: 2 } });
  });
  it("manuel kørsel er begrænset til 25 produkter på serveren", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const h = await loadHandler("auto-reparse", { tokens, resolver: resolver({ list: [] }) });
    await h.call("POST", "/auto-reparse", { token: "adm", body: { manual: true, limit: 500 } });
    const sel = h.state.calls.find((c) => c.table === "products" && c.kind === "select");
    expect(sel.op("limit")[0]).toBe(25);
  });
  it("uden produkter at genanalysere logges en gennemført kørsel markeret som 'intet at gøre'", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const h = await loadHandler("auto-reparse", { tokens, resolver: resolver({ list: [] }) });
    await h.call("POST", "/auto-reparse", { headers: SERVICE, body: {} });
    expect(runUpdates(h)[0]).toMatchObject({ status: "ok", counts: { processed: 0, nothing_to_do: 1 } });
  });
  it("en almindelig bruger kan ikke starte en kørsel", async () => {
    const h = await loadHandler("auto-reparse", { tokens, resolver: (c) => (c.table === "users" ? { data: { role: "user" }, error: null } : undefined) });
    const r = await h.call("POST", "/auto-reparse", { token: "usr", body: { manual: true } });
    expect(r.status).toBe(401);
    expect(h.state.calls.some((c) => c.rpc === "import_run_start")).toBe(false);
  });
});

describe("edge: auto-import-off kørselslog", () => {
  const resolver = ({ busy = false, missing = [] } = {}) => (c) => {
    if (c.rpc === "import_run_start") return { data: busy ? null : "run-1", error: null };
    if (c.table === "missing_ean_log" && c.kind === "select") return { data: missing, error: null };
    if (c.table === "products" && c.kind === "select") return { data: [], error: null };
    if (c.table === "products" && c.kind === "insert") return { data: null, error: null };
  };
  it("uden kvalificerede EAN'er logges en gennemført kørsel med 'intet at gøre'", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const h = await loadHandler("auto-import-off", { tokens, resolver: resolver() });
    const r = await h.call("POST", "/auto-import-off", { headers: SERVICE, body: {} });
    expect(r.json.message).toBe("Ingen manglende EAN'er");
    expect(runUpdates(h)[0]).toMatchObject({ status: "ok", counts: { attempted: 0, imported: 0, nothing_to_do: 1 } });
  });
  it("dobbeltkørsel afvises (409) før noget slås op", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("auto-import-off", { tokens, resolver: resolver({ busy: true, missing: [{ ean: "5701234567899", count: 3 }] }) });
    const r = await h.call("POST", "/auto-import-off", { headers: SERVICE, body: {} });
    expect(r.status).toBe(409);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("skelner fundet, importeret og ikke fundet; netværksfejl gør kørslen delvist gennemført", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const offOk = { status: 1, product: { product_name: "Testkiks", brands: "Test", ingredients_text: "hvedemel, sukker", allergens_tags: ["en:gluten"], categories_tags: [], nutriments: {} } };
    vi.stubGlobal("fetch", vi.fn(async (u) => {
      const url = String(u);
      if (url.includes("5701234567899")) return new Response(JSON.stringify(offOk), { status: 200 });
      if (url.includes("5701234567800")) return new Response(JSON.stringify({ status: 0 }), { status: 200 });
      return new Response("nede", { status: 503 });
    }));
    const h = await loadHandler("auto-import-off", { tokens, resolver: resolver({ missing: [{ ean: "5701234567899", count: 9 }, { ean: "5701234567800", count: 5 }, { ean: "5701234567700", count: 2 }] }) });
    const p = h.call("POST", "/auto-import-off", { headers: SERVICE, body: {} });
    await vi.advanceTimersByTimeAsync(20000);
    const r = await p;
    vi.useRealTimers();
    expect(r.json.stats).toMatchObject({ attempted: 3, found: 1, imported: 1, not_on_off: 1, error: 1 });
    const [u] = runUpdates(h);
    expect(u.status).toBe("partial");
    expect(JSON.stringify(u)).not.toMatch(/service-key|Bearer/);
    const insert = h.state.calls.find((c) => c.table === "products" && c.kind === "insert");
    expect(insert.op("insert")[0].allergen_quality).toBe("pending");
  });
});
