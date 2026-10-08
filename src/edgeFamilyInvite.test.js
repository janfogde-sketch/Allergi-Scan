import { describe, it, expect, vi, afterEach } from "vitest";
import { loadHandler } from "./testing/edgeHarness.js";
import { MAX_INVITE_MAILS_PER_DAY, MAX_INVITES_PER_RECIPIENT_PER_DAY } from "../supabase/functions/_shared/familyInvite.ts";

const tokens = { "Bearer a": "user-a" };
const env = { RESEND_API_KEY: "re_test" };

afterEach(() => vi.unstubAllGlobals());

const okMail = () => vi.fn(async () => new Response(JSON.stringify({ id: "m1" }), { status: 200 }));

const resolver = ({ sentToday = 0, connected = false, pending = null, inv = null, mailFails = false, toRecipient = 0 } = {}) => (c) => {
  if (c.table === "family_invites" && c.kind === "select") {
    if (c.op("select")[1]?.head) return { count: c.has("eq", "invitee_email", "b@test.dk") ? toRecipient : sentToday, error: null };
    return { data: c.has("eq", "id") ? inv : pending, error: null };
  }
  if (c.rpc === "invitee_already_connected") return { data: connected, error: null };
  if (c.rpc === "invitee_has_account") return { data: false, error: null };
  if (c.table === "users") return { data: { name: "Anna Hansen" }, error: null };
  if (c.table === "family_invites" && c.kind === "insert") return { data: { id: "i1", token: "tok", invitee_email: "b@test.dk", expires_at: new Date(Date.now() + 864e5).toISOString() }, error: null };
};

describe("edge: family-invite", () => {
  it("kræver login og POST", async () => {
    const h = await loadHandler("family-invite", { tokens, env, resolver: resolver() });
    expect((await h.call("POST", "/family-invite", { body: { email: "b@test.dk" } })).status).toBe(401);
    expect((await h.call("POST", "/family-invite", { token: "ugyldig", body: { email: "b@test.dk" } })).status).toBe(401);
    expect((await h.call("GET", "/family-invite", { token: "a" })).status).toBe(405);
    expect(h.state.calls).toHaveLength(0);
  });

  it("afviser ugyldig mailadresse og afsenderens egen adresse, uden at sende", async () => {
    const fetchMock = okMail();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("family-invite", { tokens, env, resolver: resolver() });
    expect((await h.call("POST", "/family-invite", { token: "a", body: { email: "ikke-en-mail" } })).json.error).toBe("invalid_email");
    expect((await h.call("POST", "/family-invite", { token: "a", body: { email: "USER-A@test.dk" } })).json.error).toBe("own_email");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(h.writes()).toHaveLength(0);
  });

  it("højst et fast antal invitationer pr. døgn (429), både mail og delt link", async () => {
    const fetchMock = okMail();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("family-invite", { tokens, env, resolver: resolver({ sentToday: MAX_INVITE_MAILS_PER_DAY }) });
    expect((await h.call("POST", "/family-invite", { token: "a", body: { email: "b@test.dk" } })).status).toBe(429);
    expect((await h.call("POST", "/family-invite", { token: "a", body: { kind: "link" } })).status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(h.writes()).toHaveLength(0);
  });

  it("højst få invitationer pr. modtageradresse pr. døgn, uanset afsender (429)", async () => {
    const fetchMock = okMail();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("family-invite", { tokens, env, resolver: resolver({ toRecipient: MAX_INVITES_PER_RECIPIENT_PER_DAY }) });
    expect((await h.call("POST", "/family-invite", { token: "a", body: { email: "b@test.dk" } })).status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(h.writes()).toHaveLength(0);
  });

  it("allerede forbundet eller allerede inviteret giver 409 uden ny mail", async () => {
    const fetchMock = okMail();
    vi.stubGlobal("fetch", fetchMock);
    const conn = await loadHandler("family-invite", { tokens, env, resolver: resolver({ connected: true }) });
    expect((await conn.call("POST", "/family-invite", { token: "a", body: { email: "b@test.dk" } })).status).toBe(409);
    const pend = await loadHandler("family-invite", { tokens, env, resolver: resolver({ pending: { id: "i0" } }) });
    expect((await pend.call("POST", "/family-invite", { token: "a", body: { email: "b@test.dk" } })).json.error).toBe("already_pending");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("opretter invitationen, sender mailen til den indtastede adresse, og tokenet returneres aldrig", async () => {
    const fetchMock = okMail();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("family-invite", { tokens, env, resolver: resolver() });
    const r = await h.call("POST", "/family-invite", { token: "a", body: { email: " B@Test.dk " } });
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.json)).not.toContain("tok");
    expect(h.writes()[0].op("insert")[0]).toMatchObject({ invited_by: "user-a", invitee_email: "b@test.dk" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(fetchMock.mock.calls[0])).toContain("b@test.dk");
  });

  it("fejler mailen, fjernes invitationen igen (502), så den kan prøves igen", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nede", { status: 400 })));
    const h = await loadHandler("family-invite", { tokens, env, resolver: resolver() });
    const r = await h.call("POST", "/family-invite", { token: "a", body: { email: "b@test.dk" } });
    expect(r.status).toBe(502);
    const kinds = h.writes().map((c) => c.kind);
    expect(kinds).toEqual(["insert", "delete"]);
    expect(h.writes()[1].has("eq", "invited_by", "user-a")).toBe(true);
  });

  it("delt link: ingen mail sendes, og linket kan kun bruges efter afsenderens godkendelse (kind=link)", async () => {
    const fetchMock = okMail();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("family-invite", { tokens, env, resolver: (c) => (c.kind === "insert" ? { data: { id: "l1", token: "tok", expires_at: "2026-10-09T00:00:00Z" }, error: null } : resolver()(c)) });
    const r = await h.call("POST", "/family-invite", { token: "a", body: { kind: "link" } });
    expect(r.status).toBe(200);
    expect(r.json.invite).toMatchObject({ kind: "link", url: "https://eatsafe.dk/invite/tok" });
    expect(h.writes()[0].op("insert")[0]).toEqual({ invited_by: "user-a", kind: "link" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("send igen: kun egne ventende invitationer, og først efter pausen", async () => {
    vi.stubGlobal("fetch", okMail());
    const base = { id: "i1", token: "tok", invitee_email: "b@test.dk", expires_at: new Date(Date.now() + 864e5).toISOString() };
    const missing = await loadHandler("family-invite", { tokens, env, resolver: resolver({ inv: null }) });
    expect((await missing.call("POST", "/family-invite", { token: "a", body: { resend_id: "i1" } })).status).toBe(404);
    const soon = await loadHandler("family-invite", { tokens, env, resolver: resolver({ inv: { ...base, mail_sent_at: new Date().toISOString() } }) });
    const r = await soon.call("POST", "/family-invite", { token: "a", body: { resend_id: "i1" } });
    expect(r.status).toBe(429);
    expect(r.json.error).toBe("too_soon");
    const ok = await loadHandler("family-invite", { tokens, env, resolver: resolver({ inv: { ...base, mail_sent_at: new Date(Date.now() - 3600e3).toISOString() } }) });
    expect((await ok.call("POST", "/family-invite", { token: "a", body: { resend_id: "i1" } })).status).toBe(200);
    // opslaget er bundet til afsenderen
    expect(ok.state.calls.find((c) => c.table === "family_invites").has("eq", "invited_by", "user-a")).toBe(true);
  });
});
