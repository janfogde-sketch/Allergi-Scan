// @ts-nocheck
// Tests for beskedsiden i appen: rute-parameteren, hentning (inkl. de neutrale
// fejltilfælde) og tegning af de gemte blokke.
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readNotificationParam, fetchNotification, markNotificationRead, fetchTicket, fetchInviteStatus } from "./notificationsApi.js";
import NotificationBlocks from "./NotificationBlocks.jsx";
import { renderNotification } from "../supabase/functions/_shared/notificationContent.js";

const ID = "71e13b35-f0cb-48cd-97ec-9f1aa6b8c272";

afterEach(() => vi.unstubAllGlobals());
const stubFetch = (impl) => vi.stubGlobal("fetch", vi.fn(impl));

describe("readNotificationParam", () => {
  it("accepterer kun et gyldigt uuid", () => {
    expect(readNotificationParam(`?notification=${ID}`)).toBe(ID);
    expect(readNotificationParam(`?x=1&notification=${ID.toUpperCase()}`)).toBe(ID);
    expect(readNotificationParam("?notification=abc")).toBeNull();
    expect(readNotificationParam("?notification=../../admin")).toBeNull();
    expect(readNotificationParam("")).toBeNull();
  });
});

describe("fetchNotification", () => {
  it("returnerer beskeden, når den findes", async () => {
    stubFetch(async () => ({ ok: true, json: async () => [{ id: ID, title: "t", expires_at: null }] }));
    const r = await fetchNotification("tok", ID);
    expect(r.status).toBe("ok");
    expect(r.item.id).toBe(ID);
  });
  it("giver notfound for tom liste (slettet eller anden konto — RLS)", async () => {
    stubFetch(async () => ({ ok: true, json: async () => [] }));
    expect((await fetchNotification("tok", ID)).status).toBe("notfound");
  });
  it("giver notfound for udløbet besked", async () => {
    stubFetch(async () => ({ ok: true, json: async () => [{ id: ID, expires_at: "2020-01-01T00:00:00Z" }] }));
    expect((await fetchNotification("tok", ID)).status).toBe("notfound");
  });
  it("giver error ved serverfejl og netværksfejl (så der kan prøves igen)", async () => {
    stubFetch(async () => ({ ok: false, status: 500 }));
    expect((await fetchNotification("tok", ID)).status).toBe("error");
    stubFetch(async () => { throw new Error("offline"); });
    expect((await fetchNotification("tok", ID)).status).toBe("error");
  });
  it("sender id'et url-kodet og kræver login-token", async () => {
    stubFetch(async () => ({ ok: true, json: async () => [] }));
    await fetchNotification("tok", "a b&c");
    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain("id=eq.a%20b%26c");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });
});

describe("markNotificationRead", () => {
  it("kalder RPC'en og melder om det lykkedes", async () => {
    stubFetch(async () => ({ ok: true }));
    expect(await markNotificationRead("tok", ID)).toBe(true);
    expect(fetch.mock.calls[0][0]).toContain("/rpc/mark_notification_read");
    stubFetch(async () => { throw new Error("x"); });
    expect(await markNotificationRead("tok", ID)).toBe(false);
  });
});

describe("NotificationBlocks", () => {
  it("tegner en rigtig N3-besked med begrundelsen først og uden e-mailramme", () => {
    const r = renderNotification("N3:default", { productName: "Havregryn", reason: "Billedet viser ikke ingredienslisten." });
    const html = renderToStaticMarkup(React.createElement(NotificationBlocks, { blocks: r.blocks }));
    expect(html).toContain("Vi kunne ikke godkende din indsendelse");
    expect(html).toContain("Begrundelse fra vores team");
    expect(html).toContain("Billedet viser ikke ingredienslisten.");
    expect(html).toContain("<strong");
    expect(html.indexOf("Begrundelse fra vores team")).toBeLessThan(html.indexOf("indsende oplysningerne igen"));
    expect(html).not.toMatch(/afmeld|unsubscribe|<iframe/i);
  });
  it("viser aldrig markup fra brugerskrevet tekst som HTML", () => {
    const blocks = [{ type: "paragraph", parts: [{ text: "<img src=x onerror=alert(1)>" }] }];
    const html = renderToStaticMarkup(React.createElement(NotificationBlocks, { blocks }));
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img");
  });
  it("springer ukendte blokke over i stedet for at vise noget forkert", () => {
    const html = renderToStaticMarkup(React.createElement(NotificationBlocks, { blocks: [{ type: "fremtid", text: "x" }, { type: "heading", text: "Hej" }] }));
    expect(html).toContain("Hej");
    expect(html).not.toContain("fremtid");
  });
});

describe("fetchTicket", () => {
  it("returnerer egen ticket uden billedet", async () => {
    stubFetch(async () => ({ ok: true, json: async () => [{ id: ID, description: "d", status: "open", admin_note: null, created_at: "2026-09-30T10:00:00Z" }] }));
    const r = await fetchTicket("tok", ID);
    expect(r.status).toBe("ok");
    expect(fetch.mock.calls[0][0]).not.toContain("image_base64");
    expect(fetch.mock.calls[0][0]).toContain(`id=eq.${ID}`);
  });
  it("giver notfound for tom liste (slettet eller anden konto) og error ved fejl", async () => {
    stubFetch(async () => ({ ok: true, json: async () => [] }));
    expect((await fetchTicket("tok", ID)).status).toBe("notfound");
    stubFetch(async () => ({ ok: false, status: 500 }));
    expect((await fetchTicket("tok", ID)).status).toBe("error");
    stubFetch(async () => { throw new Error("offline"); });
    expect((await fetchTicket("tok", ID)).status).toBe("error");
  });
});

describe("fetchInviteStatus", () => {
  const row = (r) => stubFetch(async () => ({ ok: true, json: async () => (r ? [r] : []) }));
  it("active kun for ventende, ikke-udløbet invitation", async () => {
    row({ status: "pending", expires_at: new Date(Date.now() + 3600_000).toISOString() });
    expect(await fetchInviteStatus("tok", ID)).toBe("active");
  });
  it("inactive for accepteret, udløbet eller forsvundet invitation", async () => {
    row({ status: "accepted", expires_at: new Date(Date.now() + 3600_000).toISOString() });
    expect(await fetchInviteStatus("tok", ID)).toBe("inactive");
    row({ status: "pending", expires_at: new Date(Date.now() - 1000).toISOString() });
    expect(await fetchInviteStatus("tok", ID)).toBe("inactive");
    row(null);
    expect(await fetchInviteStatus("tok", ID)).toBe("inactive");
  });
  it("unknown ved fejl (knappen vises som hidtil)", async () => {
    stubFetch(async () => ({ ok: false, status: 500 }));
    expect(await fetchInviteStatus("tok", ID)).toBe("unknown");
  });
});

