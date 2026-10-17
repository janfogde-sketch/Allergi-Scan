import { describe, it, expect, vi, afterEach } from "vitest";
import { loadHandler } from "./testing/edgeHarness.js";

// Daglig synkronisering af tilbagekaldelser: kørselslog, tomt/fejlet feed er aldrig "ok", ingen dubletter, ændringer logges og sendes kun én gang pr. version.
afterEach(() => vi.unstubAllGlobals());
const SERVICE = { Authorization: "Bearer service-key" };
const URL1 = "https://foedevarestyrelsen.dk/nyheder/tilbagekaldte-produkter/2026/okt/a";
const feed = (urls = [URL1]) => `<rss><channel>${urls.map((u, i) => `<item><title>Tilbagekald: Test ${i}</title><link>${u}</link><pubDate>${new Date().toUTCString()}</pubDate></item>`).join("")}</channel></rss>`;
const page = (reason = "Metalstykker", extra = "Testkiks\nEAN: 5701234567899\nLotnr.: A1") =>
  `<html><body><div>Tilbagekaldte fødevarer</div><h2>Hvilken fødevare tilbagekaldes</h2>${extra.split("\n").map((l) => `<p>${l}</p>`).join("")}<h2>Hvorfor tilbagekaldes produktet</h2><p>${reason}</p><h2>Hvad skal du gøre som forbruger</h2><p>Kassér.</p><p>Fødevarestyrelsen er en styrelse under X</p></body></html>`;

const fetchFor = (map) => vi.fn(async (u) => {
  const body = map[String(u).split("?")[0]] ?? map.default;
  if (body instanceof Error) throw body;
  if (typeof body === "number") return new Response("fejl", { status: body });
  return new Response(body, { status: 200 });
});
const runUpdates = (h) => h.state.calls.filter((c) => c.table === "import_runs" && c.kind === "update").map((c) => c.op("update")[0]);
const resolver = ({ known = [], recent = [], busy = false } = {}) => (c) => {
  if (c.rpc === "import_run_start") return { data: busy ? null : "run-1", error: null };
  if (c.table === "recalls" && c.kind === "select") {
    const cols = String(c.op("select")?.[0] ?? "");
    return { data: cols === "source_url" ? known.map((u) => ({ source_url: u })) : recent, error: null };
  }
  if (c.table === "recalls" && c.kind === "insert") return { data: { id: "r-new" }, error: null };
};

describe("edge: recalls-sync", () => {
  it("kræver service-nøglen", async () => {
    const h = await loadHandler("recalls-sync", { resolver: resolver() });
    expect((await h.call("POST", "/recalls-sync", { body: {} })).status).toBe(403);
  });
  it("nyt fund gemmes med original tekst og kilde-URL, hændelse logges, besked lægges i kø én gang, og kørslen er gennemført", async () => {
    vi.stubGlobal("fetch", fetchFor({ "https://foedevarestyrelsen.dk/handlers/DynamicRss.ashx": feed(), [URL1]: page(), default: 404 }));
    const h = await loadHandler("recalls-sync", { resolver: resolver({ known: ["https://foedevarestyrelsen.dk/old"] }) });
    const r = await h.call("POST", "/recalls-sync", { headers: SERVICE, body: {} });
    expect(r.json).toMatchObject({ ok: true, added: 1, ready: 1 });
    const ins = h.state.calls.find((c) => c.table === "recalls" && c.kind === "insert").op("insert")[0];
    expect(ins.source_url).toBe(URL1);
    expect(ins.raw_text).toContain("Testkiks");
    expect(ins.source_checked_at).toBeTruthy();
    expect(ins.eans).toEqual(["5701234567899"]);
    expect(h.state.calls.some((c) => c.table === "recall_events" && c.op("insert")[0].kind === "imported")).toBe(true);
    const ev = h.state.calls.filter((c) => c.table === "notification_events");
    expect(ev).toHaveLength(1);
    expect(runUpdates(h)[0]).toMatchObject({ status: "ok", counts: { added: 1 } });
  });
  it("kendt tilbagekaldelse indsættes ikke igen (ingen dubletter ved gentagen import)", async () => {
    vi.stubGlobal("fetch", fetchFor({ "https://foedevarestyrelsen.dk/handlers/DynamicRss.ashx": feed(), default: page() }));
    const h = await loadHandler("recalls-sync", { resolver: resolver({ known: [URL1] }) });
    const r = await h.call("POST", "/recalls-sync", { headers: SERVICE, body: {} });
    expect(r.json.added).toBe(0);
    expect(h.state.calls.some((c) => c.table === "recalls" && c.kind === "insert")).toBe(false);
  });
  it("tomt feed er en fejl (aldrig 'ingen tilbagekaldelser') og logges som fejlet", async () => {
    vi.stubGlobal("fetch", fetchFor({ default: "<rss><channel></channel></rss>" }));
    const h = await loadHandler("recalls-sync", { resolver: resolver() });
    const r = await h.call("POST", "/recalls-sync", { headers: SERVICE, body: {} });
    expect(r.status).toBe(502);
    expect(runUpdates(h)[0]).toMatchObject({ status: "failed", error_code: "tomt_feed" });
  });
  it("kilden svarer ikke: kørslen er fejlet med forståelig kode og ingen data røres", async () => {
    vi.stubGlobal("fetch", fetchFor({ default: 503 }));
    const h = await loadHandler("recalls-sync", { resolver: resolver({ known: [URL1] }) });
    const r = await h.call("POST", "/recalls-sync", { headers: SERVICE, body: {} });
    expect(r.status).toBe(500);
    expect(runUpdates(h)[0]).toMatchObject({ status: "failed", error_code: "kilde_svarer_ikke" });
    expect(h.writes().filter((c) => c.table === "recalls")).toHaveLength(0);
  });
  it("opdateret myndighedsmeddelelse: ny version gemmes, ændringen logges, og opdateringsbesked lægges i kø med versionsnøgle (ikke dobbelt)", async () => {
    const row = { id: "r1", source_url: URL1, title: "Tilbagekald: Test 0", intro: "", affected: "Testkiks\nEAN: 5701234567899\nLotnr.: A1", reason: "Metalstykker", action: "Kassér.", eans: ["5701234567899"], content_hash: "gammel", revision: 2 };
    vi.stubGlobal("fetch", fetchFor({ "https://foedevarestyrelsen.dk/handlers/DynamicRss.ashx": feed(), [URL1]: page("Glasstykker"), default: 404 }));
    const h = await loadHandler("recalls-sync", { resolver: resolver({ known: [URL1], recent: [row] }) });
    const r = await h.call("POST", "/recalls-sync", { headers: SERVICE, body: {} });
    expect(r.json.updated).toBe(1);
    const ev = h.state.calls.find((c) => c.table === "notification_events");
    expect(ev.op("upsert")[0].event_key).toBe("p6u:r1:3");
    const log = h.state.calls.find((c) => c.table === "recall_events" && c.op("insert")[0].kind === "updated").op("insert")[0];
    expect(log.details.aendret).toContain("årsag");
  });
  it("uændret tilbagekaldelse sender ingen ny besked, men registrerer seneste læsning", async () => {
    const same = { id: "r1", source_url: URL1, title: "Tilbagekald: Test 0", intro: "", affected: "Testkiks\nEAN: 5701234567899\nLotnr.: A1", reason: "Metalstykker", action: "Kassér.", eans: ["5701234567899"], content_hash: null, revision: 0 };
    vi.stubGlobal("fetch", fetchFor({ "https://foedevarestyrelsen.dk/handlers/DynamicRss.ashx": feed(), [URL1]: page(), default: 404 }));
    const h = await loadHandler("recalls-sync", { resolver: resolver({ known: [URL1], recent: [same] }) });
    const r = await h.call("POST", "/recalls-sync", { headers: SERVICE, body: {} });
    expect(r.json.updated).toBe(0);
    expect(h.state.calls.some((c) => c.table === "notification_events")).toBe(false);
    expect(h.state.calls.some((c) => c.table === "recalls" && c.kind === "update" && "source_checked_at" in (c.op("update")[0] || {}))).toBe(true);
  });
  it("to kørsler samtidig: den anden afvises (409)", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const h = await loadHandler("recalls-sync", { resolver: resolver({ busy: true }) });
    expect((await h.call("POST", "/recalls-sync", { headers: SERVICE, body: {} })).status).toBe(409);
  });
});
