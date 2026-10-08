import { describe, it, expect, vi, afterEach } from "vitest";
import { loadHandler } from "./testing/edgeHarness.js";
import { RETRY_DELAYS_MIN } from "../supabase/functions/_shared/notifyHelpers.js";

afterEach(() => vi.unstubAllGlobals());

const SVC = "Bearer service-key";
const MAX_ATTEMPTS = RETRY_DELAYS_MIN.length + 1;
const env = { RESEND_API_KEY: "re_test" };

const event = (over = {}) => ({ id: "e1", event_key: "k1", kind: "submission_reviewed", payload: { submission_id: "s1" }, attempts: 0, ...over });
const submission = (over = {}) => ({ id: "s1", ean: "5701234567890", type: "new_product", status: "approved", submitted_by: "user-a", review_note: null, product_id: "p1", ai_parsed_data: null, reviewed_at: null, ...over });

// Samler det notify forventer: flag-rækker, hændelser, indsendelse m.m. Alt andet svarer tomt.
function world({ events = [event()], flags = {}, sub = submission(), claimed = true, optedOut = false, extra } = {}) {
  const flagRows = Object.entries({ notifications_push_enabled: false, notifications_email_enabled: false, ...flags }).map(([key, value]) => ({ key, value }));
  return (c) => {
    const custom = extra?.(c);
    if (custom !== undefined) return custom;
    if (c.table === "app_flags") return { data: flagRows, error: null };
    if (c.table === "notification_events" && c.kind === "select") return { data: events, error: null };
    if (c.table === "notification_events" && c.kind === "update") return claimed ? { data: [{ id: "e1" }], error: null } : { data: [], error: null };
    if (c.rpc === "notification_enabled") return { data: !optedOut, error: null };
    if (c.table === "submissions") return { data: sub, error: null };
    if (c.table === "products") return { data: { name: "Havregryn", brand: "Mark" }, error: null };
    if (c.table === "notifications" && c.kind === "select") return { data: { id: "n1" }, error: null };
    if (c.table === "users") return { data: { email: "bruger-a@test.dk", name: "Anna" }, error: null };
  };
}

const eventUpdates = (h) => h.writes().filter((c) => c.table === "notification_events").map((c) => c.op("update")[0]);

describe("edge: notify", () => {
  it("kun service-nøglen slipper ind (kategori 4)", async () => {
    const h = await loadHandler("notify", { resolver: world() });
    expect((await h.call("POST", "/notify", { body: {} })).status).toBe(401);
    expect((await h.call("POST", "/notify", { headers: { Authorization: "Bearer service-key-x" }, body: {} })).status).toBe(401);
    expect((await h.call("POST", "/notify", { headers: { apikey: "service-key" }, body: {} })).status).toBe(401);
    expect(h.state.calls).toHaveLength(0);
  });

  it("uden ventende hændelser sker der intet", async () => {
    const h = await loadHandler("notify", { resolver: world({ events: [] }) });
    const r = await h.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} });
    expect(r.json.processed).toBe(0);
    expect(h.writes()).toHaveLength(0);
  });

  it("godkendt indsendelse: besked i appen til indsenderen, hændelsen lukkes, og med slukkede flag sendes hverken push eller mail", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("notify", { env, resolver: world() });
    const r = await h.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} });
    expect(r.json).toMatchObject({ processed: 1, done: 1, push: false, email: false });
    const note = h.writes().find((c) => c.table === "notifications");
    expect(note.op("upsert")[0]).toMatchObject({ user_id: "user-a", event_key: "k1" });
    expect(eventUpdates(h).at(-1)).toMatchObject({ status: "done" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mailen går kun til modtageren selv (og kun når mailflaget er slået til)", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "m1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const h = await loadHandler("notify", { env, resolver: world({ flags: { notifications_email_enabled: true } }) });
    await h.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = JSON.stringify(fetchMock.mock.calls[0]);
    expect(sent).toContain("bruger-a@test.dk");
    expect(sent).not.toContain("user-b");
  });

  it("testliste: kun de udpegede konti får push/mail, selv om flaget er slukket", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "m1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const other = await loadHandler("notify", { env, resolver: world({ flags: { notifications_test_users: ["user-z"] } }) });
    await other.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} });
    expect(fetchMock).not.toHaveBeenCalled();
    const tester = await loadHandler("notify", { env, resolver: world({ flags: { notifications_test_users: ["user-a"] } }) });
    await tester.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("brugeren har fravalgt alle kanaler: ingen besked oprettes (men hændelsen lukkes)", async () => {
    const h = await loadHandler("notify", { env, resolver: world({ optedOut: true }) });
    const r = await h.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} });
    expect(r.json.done).toBe(1);
    expect(h.writes().some((c) => c.table === "notifications")).toBe(false);
  });

  it("afvisning uden begrundelse sendes aldrig: hændelsen markeres som fejlet og intet gemmes til brugeren", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const h = await loadHandler("notify", { env, resolver: world({ sub: submission({ status: "rejected", review_note: null }) }) });
    const r = await h.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} });
    expect(r.json.failed).toBe(1);
    expect(h.writes().some((c) => c.table === "notifications")).toBe(false);
    expect(eventUpdates(h).at(-1)).toMatchObject({ status: "failed" });
  });

  it("en hændelse, en anden kørsel allerede har taget, springes over uden at sende noget", async () => {
    const h = await loadHandler("notify", { env, resolver: world({ claimed: false }) });
    const r = await h.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} });
    expect(r.json.skipped).toBe(1);
    expect(h.writes().some((c) => c.table === "notifications")).toBe(false);
  });

  it("fejl prøves igen senere, og efter sidste forsøg opgives hændelsen og logges", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const unknown = (attempts) => world({ events: [event({ kind: "findes_ikke", attempts })] });
    const first = await loadHandler("notify", { env, resolver: unknown(0) });
    expect((await first.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} })).json.retry).toBe(1);
    const upd = eventUpdates(first).at(-1);
    expect(upd.status).toBeUndefined();
    expect(upd.available_at).toBeTruthy();

    const last = await loadHandler("notify", { env, resolver: unknown(MAX_ATTEMPTS - 1) });
    expect((await last.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} })).json.failed).toBe(1);
    expect(eventUpdates(last).at(-1)).toMatchObject({ status: "failed" });
    expect(last.state.calls.some((c) => c.rpc === "log_client_error")).toBe(true);
  });

  it("påmindelse om invitation udebliver, når invitationen er besvaret eller udløbet", async () => {
    const ev = event({ kind: "family_invite_expiring", payload: { invite_id: "i1" } });
    const accepted = await loadHandler("notify", { env, resolver: world({ events: [ev], extra: (c) => (c.table === "family_invites" ? { data: { id: "i1", invited_by: "user-a", status: "accepted", expires_at: new Date(Date.now() + 3600e3).toISOString() }, error: null } : undefined) }) });
    await accepted.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} });
    expect(accepted.writes().some((c) => c.table === "notifications")).toBe(false);
    const expired = await loadHandler("notify", { env, resolver: world({ events: [ev], extra: (c) => (c.table === "family_invites" ? { data: { id: "i1", invited_by: "user-a", status: "pending", expires_at: new Date(Date.now() - 1000).toISOString() }, error: null } : undefined) }) });
    await expired.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} });
    expect(expired.writes().some((c) => c.table === "notifications")).toBe(false);
  });

  it("tilbagekaldelse rammer kun dem, der har varen som favorit, har scannet den eller har den på en liste", async () => {
    const ev = event({ kind: "recall_published", payload: { recall_id: "r1" } });
    const h = await loadHandler("notify", {
      env,
      resolver: world({
        events: [ev],
        extra: (c) => {
          if (c.table === "recalls") return { data: { id: "r1", source_url: "https://x.dk", reason: "Salmonella", affected: "L1", action: "Returnér", eans: ["5701234567890"], status: "ready" }, error: null };
          if (c.table === "favorites") return { data: [{ user_id: "user-a", ean: "5701234567890" }], error: null };
          if (c.table === "scan_history") return { data: [{ user_id: "user-b", ean_scanned: "5701234567890" }, { user_id: null, ean_scanned: "5701234567890" }], error: null };
          if (c.table === "shopping_list_items") return { data: [], error: null };
          if (c.table === "products") return { data: [{ id: "p1", ean: "5701234567890", name: "Havregryn", brand: "Mark" }], error: null };
        },
      }),
    });
    await h.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} });
    const recipients = h.writes().filter((c) => c.table === "notifications").map((c) => c.op("upsert")[0].user_id).sort();
    expect(recipients).toEqual(["user-a", "user-b"]);
  });

  it("ikke-bekræftet tilbagekaldelse (kladde/annulleret) sender ingenting", async () => {
    const ev = event({ kind: "recall_published", payload: { recall_id: "r1" } });
    const h = await loadHandler("notify", {
      env,
      resolver: world({ events: [ev], extra: (c) => (c.table === "recalls" ? { data: { id: "r1", eans: ["5701234567890"], status: "draft" }, error: null } : undefined) }),
    });
    await h.call("POST", "/notify", { headers: { Authorization: SVC }, body: {} });
    expect(h.writes().some((c) => c.table === "notifications")).toBe(false);
  });
});
