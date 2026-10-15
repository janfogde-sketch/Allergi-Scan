import { describe, it, expect, vi, afterEach } from "vitest";
import { SourceMapGenerator, SourceMapConsumer } from "source-map-js";
import { loadHandler } from "./testing/edgeHarness.js";
import { assetFileName, parseStackFrames, cleanSource, symbolicateStack, formatResolved } from "../supabase/functions/_shared/symbolicate.js";

const CHROME = `TypeError: Cannot read properties of undefined (reading 'default')
    at de (https://www.eatsafe.dk/assets/react-DbkvxWG5.js:1:3568)
    at Ul (https://www.eatsafe.dk/assets/react-DbkvxWG5.js:8:43921)
    at https://www.eatsafe.dk/assets/main-C4SAwqjH.js:3:83818`;
const SAFARI = `de@https://www.eatsafe.dk/assets/react-CJ1W4_JO.js:1:3563
Ul@https://www.eatsafe.dk/assets/react-CJ1W4_JO.js:8:43922
@https://www.eatsafe.dk/assets/main-CLG8xXWE.js:3:31208
global code@https://www.eatsafe.dk/other/x.js:1:1`;

const makeMap = (file, source = "../../../home/user/Allergi-Scan/node_modules/react/cjs/react.production.min.js") => {
  const g = new SourceMapGenerator({ file });
  g.addMapping({ generated: { line: 1, column: 3562 }, original: { line: 18, column: 380 }, source, name: "lazyInitializer" });
  g.addMapping({ generated: { line: 8, column: 43921 }, original: { line: 290, column: 299 }, source: "src/App.jsx" });
  return g.toJSON();
};

describe("stackrammer og filnavne", () => {
  it("læser Chrome- og Safari-format og kun placeringer", () => {
    const c = parseStackFrames(CHROME);
    expect(c).toHaveLength(3);
    expect(c[0]).toMatchObject({ fn: "de", file: "react-DbkvxWG5.js", line: 1, col: 3568 });
    expect(c[2]).toMatchObject({ fn: "", file: "main-C4SAwqjH.js", line: 3, col: 83818 });
    const s = parseStackFrames(SAFARI);
    expect(s.map((f) => f.file)).toEqual(["react-CJ1W4_JO.js", "react-CJ1W4_JO.js", "main-CLG8xXWE.js", null]);
    expect(s[0]).toMatchObject({ fn: "de", line: 1, col: 3563 });
    expect(parseStackFrames("ingen placering her\nTypeError: x")).toEqual([]);
  });
  it("assetFileName kender kun appens kodefiler", () => {
    expect(assetFileName("https://www.eatsafe.dk/assets/a-B1.js?x=1")).toBe("a-B1.js"); // forespørgselsdelen ignoreres
    expect(assetFileName("https://www.eatsafe.dk/assets/a-B1.js")).toBe("a-B1.js");
    expect(assetFileName("/assets/b.js")).toBe("b.js");
    expect(assetFileName("https://x.dk/other/b.js")).toBeNull();
  });
  it("cleanSource fjerner byggemaskinens mapper", () => {
    expect(cleanSource("../../../../home/user/Allergi-Scan/node_modules/react/cjs/react.production.min.js")).toBe("node_modules/react/cjs/react.production.min.js");
    expect(cleanSource("/vercel/path0/src/ProfileScreen.jsx")).toBe("src/ProfileScreen.jsx");
    expect(cleanSource("../../x/y.js")).toBe("x/y.js");
  });
});

describe("symbolicateStack", () => {
  it("oversætter kun rammer med et map til netop filen; resten er 'ikke oversat' (aldrig opdigtet)", async () => {
    const loadMap = async (f) => (f === "react-CJ1W4_JO.js" ? makeMap("react-CJ1W4_JO.js") : null);
    const frames = await symbolicateStack({ stack: SAFARI }, loadMap, SourceMapConsumer);
    expect(frames[0]).toMatchObject({ resolved: true, source: "node_modules/react/cjs/react.production.min.js", origLine: 18, origCol: 381, name: "lazyInitializer" });
    expect(frames[1]).toMatchObject({ resolved: true, source: "src/App.jsx", origLine: 290 });
    expect(frames[2]).toMatchObject({ resolved: false, reason: expect.stringContaining("findes ikke") });
    expect(frames[3]).toMatchObject({ resolved: false, reason: expect.stringContaining("ikke en kodefil") });
    expect(formatResolved(frames)).toBe("lazyInitializer  node_modules/react/cjs/react.production.min.js:18:381\nUl  src/App.jsx:290:300");
  });
  it("et map fra en anden fil afvises, og en position uden svar er ikke oversat", async () => {
    const wrong = await symbolicateStack({ stack: SAFARI }, async () => makeMap("anden-fil.js"), SourceMapConsumer);
    expect(wrong.every((f) => !f.resolved)).toBe(true);
    const empty = await symbolicateStack({ stack: "x@https://a.dk/assets/q-1.js:5:5" }, async () => makeMap("q-1.js"), SourceMapConsumer);
    expect(empty[0].resolved).toBe(false);
  });
  it("en fejl ved hentning af et map vælter ikke oversættelsen", async () => {
    const frames = await symbolicateStack({ stack: CHROME }, async () => { throw new Error("net"); }, SourceMapConsumer);
    expect(frames.every((f) => !f.resolved)).toBe(true);
  });
});

afterEach(() => vi.unstubAllGlobals());
const tokens = { "Bearer adm": "u-admin", "Bearer usr": "u-user" };
const resolver = (c) => (c.table === "users" ? { data: { role: c.has("eq", "id", "u-admin") ? "admin" : "user" }, error: null } : undefined);
const TOKEN = "t".repeat(32);

describe("edge: sourcemap-upload", () => {
  const body = { build: "d81f4e2", name: "react-CJ1W4_JO.js.map", map: { ...makeMap("react-CJ1W4_JO.js"), sourcesContent: ["hemmelig kildekode"] } };
  it("kræver den delte hemmelighed; uden den, forkert eller uden secret sat afvises alt før noget skrives", async () => {
    const h = await loadHandler("sourcemap-upload", { env: { SOURCEMAP_UPLOAD_TOKEN: TOKEN } });
    expect((await h.call("POST", "/", { body })).status).toBe(401);
    expect((await h.call("POST", "/", { body, headers: { "x-upload-token": "forkert" } })).status).toBe(401);
    expect((await h.call("POST", "/", { body, token: "usr" })).status).toBe(401);
    expect(h.state.storage).toHaveLength(0);
    const none = await loadHandler("sourcemap-upload", {});
    expect((await none.call("POST", "/", { body, headers: { "x-upload-token": "" } })).status).toBe(401);
  });
  it("gemmer kortet som <build>/<fil> uden sourcesContent", async () => {
    const h = await loadHandler("sourcemap-upload", { env: { SOURCEMAP_UPLOAD_TOKEN: TOKEN } });
    const r = await h.call("POST", "/", { body, headers: { "x-upload-token": TOKEN } });
    expect(r.status).toBe(200);
    expect(r.json.path).toBe("d81f4e2/react-CJ1W4_JO.js.map");
    expect(h.state.storage).toEqual([{ bucket: "sourcemaps", op: "upload", path: "d81f4e2/react-CJ1W4_JO.js.map" }]);
    const stored = JSON.parse(h.state.files["sourcemaps/d81f4e2/react-CJ1W4_JO.js.map"]);
    expect(stored.sourcesContent).toBeUndefined();
    expect(stored.mappings).toBeTruthy();
  });
  it("afviser ugyldigt build, filnavn og indhold", async () => {
    const h = await loadHandler("sourcemap-upload", { env: { SOURCEMAP_UPLOAD_TOKEN: TOKEN } });
    const headers = { "x-upload-token": TOKEN };
    expect((await h.call("POST", "/", { headers, body: { ...body, build: "../../x" } })).status).toBe(400);
    expect((await h.call("POST", "/", { headers, body: { ...body, name: "../x.map" } })).status).toBe(400);
    expect((await h.call("POST", "/", { headers, body: { ...body, map: { hej: 1 } } })).status).toBe(400);
    expect((await h.call("POST", "/", { headers, body: { ...body, map: "ikke json" } })).status).toBe(400);
    expect((await h.call("GET", "/", { headers })).status).toBe(405);
    expect(h.state.storage).toHaveLength(0);
  });
});

describe("edge: symbolicate-error", () => {
  const input = { build: "d81f4e2", stack: SAFARI };
  const withMap = async () => {
    const h = await loadHandler("symbolicate-error", { tokens, resolver });
    (h.state.files ||= {})["sourcemaps/d81f4e2/react-CJ1W4_JO.js.map"] = JSON.stringify(makeMap("react-CJ1W4_JO.js"));
    return h;
  };
  it("kræver admin-login: 401 uden og med ugyldigt login, 403 for en almindelig bruger", async () => {
    const h = await withMap();
    expect((await h.call("POST", "/", { body: input })).status).toBe(401);
    expect((await h.call("POST", "/", { token: "ugyldig", body: input })).status).toBe(401);
    expect((await h.call("POST", "/", { token: "usr", body: input })).status).toBe(403);
    expect(h.state.storage).toHaveLength(0);
  });
  it("giver kun verificerede placeringer og angiver resten som ikke oversat", async () => {
    const h = await withMap();
    const r = await h.call("POST", "/", { token: "adm", body: input });
    expect(r.status).toBe(200);
    expect(r.json.resolved).toBe(2);
    expect(r.json.total).toBe(4);
    expect(r.json.frames[0]).toMatchObject({ resolved: true, source: "node_modules/react/cjs/react.production.min.js", origLine: 18 });
    expect(r.json.frames[2].resolved).toBe(false);
    expect(h.writes()).toHaveLength(0);
  });
  it("uden map til buildet: intet oversat og ingen opdigtede placeringer", async () => {
    const h = await loadHandler("symbolicate-error", { tokens, resolver });
    const r = await h.call("POST", "/", { token: "adm", body: { build: "1234567", stack: SAFARI } });
    expect(r.json.resolved).toBe(0);
  });
  it("validerer build og stack", async () => {
    const h = await withMap();
    expect((await h.call("POST", "/", { token: "adm", body: { build: "../x", stack: SAFARI } })).status).toBe(400);
    expect((await h.call("POST", "/", { token: "adm", body: { build: "d81f4e2" } })).status).toBe(400);
  });
});
