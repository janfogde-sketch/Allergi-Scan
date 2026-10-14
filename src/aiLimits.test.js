// AI-loft (to do b9a16fdb, G29): admins kald tæller i en fælles adminpulje, alle AI-kald tæller i et samlet dagsloft,
// serveren siger det (ai_skipped), når AI springes over, og "Kør nu" tager højst 25 produkter også på serveren.
import { describe, it, expect } from "vitest";
import { loadHandler } from "./testing/edgeHarness.js";
import { LIMITS } from "../supabase/functions/_shared/apiUsage.ts";

const TEXT = "vand, sukker, aroma"; // force_ai sender den til AI-trinnet

function resolver({ role = "user", userOk = true, adminOk = true, totalOk = true } = {}) {
  return (c) => {
    if (c.table === "users" && c.kind === "select") return { data: { role }, error: null };
    if (c.rpc === "bump_api_usage") return { data: userOk, error: null };
    if (c.rpc === "bump_api_usage_global" && c.args.p_kind === "claude_admin") return { data: adminOk, error: null };
    if (c.rpc === "bump_api_usage_global" && c.args.p_kind === "ai_total") return { data: totalOk, error: null };
    if (c.table === "admin_todos" && c.kind === "select") return { data: [], error: null };
  };
}

const rpcs = (h) => h.state.calls.filter((c) => c.rpc).map((c) => c.args.p_kind);

describe("AI-loft: grænser", () => {
  it("2.000 kald i alt pr. dag og 300 for alle admins tilsammen", () => {
    expect(LIMITS.ai_total).toBe(2000);
    expect(LIMITS.claude_admin).toBe(300);
  });
});

describe("AI-loft: allergens", () => {
  it("en admins kald tæller i adminpuljen, ikke admins personlige loft", async () => {
    const h = await loadHandler("allergens", { tokens: { "Bearer a": "admin-1" }, resolver: resolver({ role: "admin" }) });
    const r = await h.call("POST", "/allergens", { token: "a", body: { text: TEXT, force_ai: true } });
    expect(r.status).toBe(200);
    expect(rpcs(h)).toEqual(["claude_admin", "ai_total"]);
    expect(r.json.ai_skipped).toBeUndefined();
  });

  it("brugt adminpulje: AI springes over, svaret siger det, og ingen to do om brugerloft", async () => {
    const h = await loadHandler("allergens", { tokens: { "Bearer a": "admin-1" }, resolver: resolver({ role: "admin", adminOk: false }) });
    const r = await h.call("POST", "/allergens", { token: "a", body: { text: TEXT, force_ai: true } });
    expect(r.json.ai_skipped).toBe("daily_limit");
    expect(r.json.method).toBe("keyword");
    expect(rpcs(h)).toEqual(["claude_admin"]);
    expect(h.writes().filter((c) => c.table === "admin_todos")).toHaveLength(0);
  });

  it("en almindelig bruger bruger sit eget loft og derefter det samlede", async () => {
    const h = await loadHandler("allergens", { tokens: { "Bearer u": "user-1" }, resolver: resolver() });
    await h.call("POST", "/allergens", { token: "u", body: { text: TEXT, force_ai: true } });
    expect(rpcs(h)).toEqual(["claude_analysis", "ai_total"]);
  });

  it("samlet dagsloft nået: AI springes over, og admin får én to do", async () => {
    const h = await loadHandler("allergens", { tokens: { "Bearer u": "user-1" }, resolver: resolver({ totalOk: false }) });
    const r = await h.call("POST", "/allergens", { token: "u", body: { text: TEXT, force_ai: true } });
    expect(r.json.ai_skipped).toBe("daily_limit");
    const todo = h.writes().find((c) => c.table === "admin_todos");
    expect(todo.op("insert")[0].title).toMatch(/^AI-dagsloftet er nået/);
  });
});

describe("AI-loft: billedlæsning", () => {
  it("samlet dagsloft nået: samme besked som det personlige loft", async () => {
    const h = await loadHandler("ocr", { tokens: { "Bearer u": "user-1" }, resolver: resolver({ totalOk: false }) });
    const r = await h.call("POST", "/ocr", { token: "u", body: { image_base64: "x" } });
    expect(r.status).toBe(429);
    expect(r.json.code).toBe("daily_limit");
    expect(r.json.error).toBe("Du har brugt dagens grænse for billedlæsning. Prøv igen i morgen.");
  });

  it("personligt loft nået: det samlede loft tælles ikke op", async () => {
    const h = await loadHandler("ocr", { tokens: { "Bearer u": "user-1" }, resolver: resolver({ userOk: false }) });
    const r = await h.call("POST", "/ocr", { token: "u", body: { image_base64: "x" } });
    expect(r.status).toBe(429);
    expect(rpcs(h)).toEqual(["ocr"]);
  });
});

describe("AI-loft: Kør nu", () => {
  it("serveren tager højst 25 produkter ved manuel kørsel, også hvis der bedes om flere", async () => {
    const h = await loadHandler("auto-reparse", { tokens: { "Bearer a": "admin-1" }, resolver: resolver({ role: "admin" }) });
    await h.call("POST", "/auto-reparse", { token: "a", body: { manual: true, limit: 200 } });
    const q = h.state.calls.find((c) => c.table === "products" && c.kind === "select");
    expect(q.op("limit")[0]).toBe(25);
  });

  it("natjobbet kan stadig tage op til 200", async () => {
    const h = await loadHandler("auto-reparse", { resolver: resolver() });
    await h.call("POST", "/auto-reparse", { headers: { Authorization: "Bearer service-key" }, body: { manual: false, limit: 200 } });
    const q = h.state.calls.find((c) => c.table === "products" && c.kind === "select");
    expect(q.op("limit")[0]).toBe(200);
  });
});
