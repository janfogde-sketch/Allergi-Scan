import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { loadHandler } from "./testing/edgeHarness.js";
import { signStandardWebhook } from "./testing/webhookSign.js";
import { signReportToken } from "../supabase/functions/_shared/reportLink.ts";

afterEach(() => vi.unstubAllGlobals());

const tokens = { "Bearer a": "user-a" };
const UID = "11111111-2222-3333-4444-555555555555";

// Kategori 1/2/4 (se .claude/rules/edge-function-auth.md): kald uden gyldigt login/nøgle må hverken røre databasen eller sende noget.
// [funktion, metode, forventet status uden adgang]
const PROTECTED = [
  ["admin", "POST", 401], ["admin-digest", "POST", 401], ["allergen-reanalyze", "POST", 401], ["auto-import-off", "POST", 401],
  ["auto-reparse", "POST", 401], ["classify-categories", "POST", 403], ["cleanup-orphan-images", "POST", 401], ["favorites", "GET", 401],
  ["favorites", "POST", 401], ["family-invite", "POST", 401], ["food-waste", "GET", 401], ["history", "GET", 401], ["history", "POST", 401],
  ["inactive-accounts", "POST", 401], ["notify", "POST", 401], ["notify-test", "POST", 401], ["recalls-sync", "POST", 403],
  ["search", "POST", 401], ["send-email", "POST", 401], ["send-push", "POST", 401], ["weekly-digest", "POST", 401],
];

describe("edge: loginkrav på alle beskyttede funktioner", () => {
  for (const [fn, method, expected] of PROTECTED) {
    it(`${fn} ${method} afviser kald uden og med ugyldigt login (${expected})`, async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const h = await loadHandler(fn, { tokens, resolver: () => ({ data: { role: "user" }, error: null }), env: { RESEND_API_KEY: "re_test", ANTHROPIC_API_KEY: "k" } });
      for (const token of [undefined, "ugyldig"]) {
        const r = await h.call(method, `/${fn}`, { token, body: {} });
        expect(r.status, `${fn} uden login`).toBe(expected);
      }
      expect(h.state.calls).toHaveLength(0);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  }

  it("en almindelig bruger (ikke admin) kommer ikke ind i admin-funktionen", async () => {
    const h = await loadHandler("admin", { tokens, resolver: () => ({ data: { role: "user" }, error: null }) });
    const r = await h.call("POST", "/admin", { token: "a", body: {} });
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(h.writes()).toHaveLength(0);
  });
});

describe("edge: bevidst åbne funktioner har grænser", () => {
  const body = { type: "bug", description: "Knappen virker ikke" };
  const resolver = (counts = {}) => (c) => (c.table === "feedback_tickets" && c.kind === "select" ? { count: counts[c.has("eq", "submitted_by") ? "user" : c.has("eq", "client_hash") ? "client" : "total"] ?? 0, error: null } : { data: null, error: null });

  it("feedback kan sendes uden login, og submitted_by kommer aldrig fra forespørgslen", async () => {
    const h = await loadHandler("feedback", { tokens, resolver: resolver() });
    const r = await h.call("POST", "/feedback", { body: { ...body, submitted_by: "fremmed" } });
    expect(r.status).toBe(200);
    const ticket = h.writes()[0].op("insert")[0];
    expect(ticket.submitted_by).toBeNull();
    expect(ticket.client_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("med gyldigt login knyttes feedback til brugeren; et ugyldigt token behandles som anonymt", async () => {
    const h = await loadHandler("feedback", { tokens, resolver: resolver() });
    await h.call("POST", "/feedback", { token: "a", body });
    await h.call("POST", "/feedback", { token: "ugyldig", body });
    expect(h.writes().map((c) => c.op("insert")[0].submitted_by)).toEqual(["user-a", null]);
  });

  it("anonym feedback afvises over timegrænsen (429), også samlet; indloggede har en højere grænse", async () => {
    const perClient = await loadHandler("feedback", { tokens, resolver: resolver({ client: 5 }) });
    expect((await perClient.call("POST", "/feedback", { body })).status).toBe(429);
    const total = await loadHandler("feedback", { tokens, resolver: resolver({ total: 60 }) });
    expect((await total.call("POST", "/feedback", { body })).status).toBe(429);
    expect(perClient.writes()).toHaveLength(0);
    const user = await loadHandler("feedback", { tokens, resolver: resolver({ user: 5 }) });
    expect((await user.call("POST", "/feedback", { token: "a", body })).status).toBe(200);
    const userOver = await loadHandler("feedback", { tokens, resolver: resolver({ user: 20 }) });
    expect((await userOver.call("POST", "/feedback", { token: "a", body })).status).toBe(429);
  });

  it("feedback afviser ugyldigt indhold uden at gemme", async () => {
    const h = await loadHandler("feedback", { tokens, resolver: resolver() });
    expect((await h.call("POST", "/feedback", { body: { type: "spam", description: "x" } })).status).toBe(400);
    expect((await h.call("GET", "/feedback")).status).toBe(405);
    expect(h.writes()).toHaveLength(0);
  });

  it("anonym søgning virker (GET), men loggede søgevalg (POST) kræver login", async () => {
    const h = await loadHandler("search", { tokens, resolver: () => ({ data: [], error: null }) });
    expect((await h.call("GET", "/search?q=mel")).status).toBe(200);
    expect((await h.call("POST", "/search", { body: {} })).status).toBe(401);
  });
});

describe("edge: signerede kald (Send Email Hook og 'Det var ikke mig'-linket)", () => {
  const env = { SEND_EMAIL_HOOK_SECRET: "v1,whsec_" + btoa("hemmelig-testnoegle-1234567890"), RESEND_API_KEY: "re_test" };
  const payload = JSON.stringify({ user: { id: "u1", email: "x@test.dk" }, email_data: { email_action_type: "magiclink_findes_ikke", token: "1", token_hash: "h", redirect_to: "", site_url: "" } });

  it("auth-send-email afviser uden og med forkert signatur (401) og sender intet", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("auth-send-email", { env, resolver: () => ({ data: null, error: null }) });
    expect((await h.call("POST", "/auth-send-email", { body: JSON.parse(payload) })).status).toBe(401);
    const bad = await signStandardWebhook(payload, "v1,whsec_" + btoa("en-anden-noegle-1234567890123"));
    expect((await h.call("POST", "/auth-send-email", { headers: bad, body: JSON.parse(payload) })).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("auth-send-email accepterer en korrekt signeret nyttelast (ukendt type sender ingen mail)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("auth-send-email", { env, resolver: () => ({ data: null, error: null }) });
    const headers = await signStandardWebhook(payload, env.SEND_EMAIL_HOOK_SECRET);
    const r = await h.call("POST", "/auth-send-email", { headers, body: JSON.parse(payload) });
    expect(r.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("auth-send-email svarer 500 hvis hemmeligheden ikke er sat, aldrig 200", async () => {
    const h = await loadHandler("auth-send-email", { env: { RESEND_API_KEY: "re_test" }, resolver: () => ({ data: null, error: null }) });
    expect((await h.call("POST", "/auth-send-email", { body: JSON.parse(payload) })).status).toBe(500);
  });

  it("report-unrequested-reset afviser et falsk, ændret eller udløbet link, uden at røre databasen", async () => {
    const h = await loadHandler("report-unrequested-reset", { env, resolver: () => ({ data: null, error: null }) });
    const good = await signReportToken(env.SEND_EMAIL_HOOK_SECRET, UID);
    const expired = await signReportToken(env.SEND_EMAIL_HOOK_SECRET, UID, Date.now() - 10 * 24 * 3600 * 1000);
    const forged = await signReportToken("v1,whsec_" + btoa("andennoegle-1234567890"), UID);
    for (const token of ["", "tilfaeldig", forged, expired, good.replace(/^(.{3})(.)/, (_, a, c) => a + (c === "A" ? "B" : "A"))]) {
      const r = await h.call("POST", "/x", { body: { token } });
      expect(r.status).toBe(400);
    }
    expect(h.state.calls).toHaveLength(0);
  });

  it("report-unrequested-reset: gyldigt link opretter indberetning og opgave én gang pr. time", async () => {
    let recent = [];
    const h = await loadHandler("report-unrequested-reset", {
      env: { ...env, RESEND_API_KEY: "" },
      resolver: (c) => {
        if (c.table === "users" && c.kind === "select") return { data: { id: UID, email: "x@test.dk" }, error: null };
        if (c.table === "security_reports" && c.kind === "select") return c.op("select")[1]?.head ? { count: 1, error: null } : { data: recent, error: null };
        if (c.kind === "insert") { recent = [{ id: "r1" }]; return { data: { id: "r1" }, error: null }; }
      },
    });
    const token = await signReportToken(env.SEND_EMAIL_HOOK_SECRET, UID);
    expect((await h.call("POST", "/x", { body: { token } })).status).toBe(200);
    const first = h.writes().map((c) => c.table);
    expect(first).toEqual(["security_reports", "admin_todos", "security_reports"]);
    expect((await h.call("POST", "/x", { body: { token } })).status).toBe(200);
    expect(h.writes()).toHaveLength(first.length);
  });
});

// Vagt mod nye funktioner uden bevidst adgangskontrol (kategorierne i .claude/rules/edge-function-auth.md).
describe("edge: hver funktion har en bevidst adgangskategori", () => {
  const root = "supabase/functions";
  const fns = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith("_")).map((d) => d.name);
  const config = readFileSync("supabase/config.toml", "utf8");
  const PUBLIC_BY_DESIGN = new Set(["search", "feedback"]);
  const AUTH_MARKERS = [/auth\.getUser\(/, /SUPABASE_SERVICE_ROLE_KEY/, /verifyStandardWebhook/, /verifyReportToken/];

  it("alle funktioner står i config.toml med verify_jwt", () => {
    for (const f of fns) expect(config, f).toMatch(new RegExp(`\\[functions\\.${f}\\]\\s*\\n\\s*verify_jwt\\s*=`));
  });

  it("alle funktioner har en index.ts", () => {
    for (const f of fns) expect(existsSync(`${root}/${f}/index.ts`), f).toBe(true);
  });

  it("funktioner uden JWT-tjek fra platformen kontrollerer selv login, nøgle eller signatur (eller er bevidst åbne)", () => {
    for (const f of fns) {
      const m = config.match(new RegExp(`\\[functions\\.${f}\\]\\s*\\n\\s*verify_jwt\\s*=\\s*(true|false)`));
      if (!m || m[1] === "true") continue;
      if (PUBLIC_BY_DESIGN.has(f)) continue;
      const src = readFileSync(`${root}/${f}/index.ts`, "utf8");
      expect(AUTH_MARKERS.some((re) => re.test(src)), `${f} mangler adgangstjek`).toBe(true);
    }
  });
});
