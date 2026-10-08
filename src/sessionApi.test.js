// @ts-nocheck
import { describe, it, expect, vi } from "vitest";
import { handleSession, readCookie, sessionCookie, clearedCookie } from "../api/_sessionLogic.js";

const H = { "x-requested-with": "eatsafe" };
const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const fail = (status) => ({ ok: false, status, json: async () => ({}) });

describe("api/session — cookien med den lange login-nøgle", () => {
  it("afviser alt andet end POST og kald uden vores eget header", async () => {
    expect((await handleSession({ method: "GET", headers: H })).status).toBe(405);
    expect((await handleSession({ method: "POST", headers: {}, body: { action: "logout" } })).status).toBe(403);
  });

  it("gemmer nøglen i en HttpOnly, Secure, SameSite=Strict-cookie begrænset til /api/session", async () => {
    const r = await handleSession({ method: "POST", headers: H, body: { action: "set", refresh_token: "abcDEF123456" } });
    expect(r.status).toBe(200);
    expect(r.setCookie).toMatch(/^as_rt=abcDEF123456; Path=\/api\/session; HttpOnly; Secure; SameSite=Strict; Max-Age=\d+$/);
    expect(JSON.stringify(r.body)).not.toContain("abcDEF123456");
  });

  it("uden husk mig bliver cookien en sessionscookie (ingen Max-Age)", () => {
    expect(sessionCookie("abcDEF123456", false)).not.toMatch(/Max-Age/);
  });

  it("afviser mærkelige nøgler, før de når Supabase", async () => {
    for (const bad of ["", "a b", "x".repeat(600), 42, "a;b=c1234"]) {
      expect((await handleSession({ method: "POST", headers: H, body: { action: "set", refresh_token: bad } })).status).toBe(400);
    }
  });

  it("fornyer med cookien og leverer kun den korte nøgle i svaret; den nye lange nøgle går i cookien", async () => {
    const f = vi.fn(async () => ok({ access_token: "ACCESS", refresh_token: "newRefresh99", expires_in: 3600, user: { id: "u1" } }));
    const r = await handleSession({ method: "POST", headers: { ...H, cookie: "other=1; as_rt=oldRefresh99" }, body: { action: "refresh" } }, f);
    expect(r.status).toBe(200);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ refresh_token: "oldRefresh99" });
    expect(r.body).toEqual({ access_token: "ACCESS", expires_in: 3600, user_id: "u1" });
    expect(JSON.stringify(r.body)).not.toContain("newRefresh99");
    expect(readCookie(r.setCookie.split(";")[0])).toBe("newRefresh99");
  });

  it("flytter en gammel nøgle fra lokal lagring over i cookien (engangs-overgang)", async () => {
    const f = vi.fn(async () => ok({ access_token: "A", refresh_token: "newRefresh99", user: { id: "u1" } }));
    const r = await handleSession({ method: "POST", headers: H, body: { action: "refresh", refresh_token: "legacyRefresh1" } }, f);
    expect(r.status).toBe(200);
    expect(JSON.parse(f.mock.calls[0][1].body).refresh_token).toBe("legacyRefresh1");
    expect(r.setCookie).toContain("as_rt=newRefresh99");
  });

  it("cookien går forud for en nøgle i selve kaldet", async () => {
    const f = vi.fn(async () => ok({ access_token: "A", refresh_token: "newRefresh99", user: { id: "u1" } }));
    await handleSession({ method: "POST", headers: { ...H, cookie: "as_rt=cookieRefresh1" }, body: { action: "refresh", refresh_token: "legacyRefresh1" } }, f);
    expect(JSON.parse(f.mock.calls[0][1].body).refresh_token).toBe("cookieRefresh1");
  });

  it("uden nøgle: 401 no_session, og Supabase kaldes ikke", async () => {
    const f = vi.fn();
    const r = await handleSession({ method: "POST", headers: H, body: { action: "refresh" } }, f);
    expect(r.status).toBe(401);
    expect(f).not.toHaveBeenCalled();
  });

  it("afvist nøgle (400/401): 401 og cookien ryddes; midlertidig fejl (500/429/netværk): 502 og cookien beholdes", async () => {
    const req = { method: "POST", headers: { ...H, cookie: "as_rt=oldRefresh99" }, body: { action: "refresh" } };
    for (const st of [400, 401, 403]) {
      const r = await handleSession(req, async () => fail(st));
      expect(r.status).toBe(401);
      expect(r.setCookie).toBe(clearedCookie());
    }
    for (const st of [500, 503, 429]) {
      const r = await handleSession(req, async () => fail(st));
      expect(r.status).toBe(502);
      expect(r.setCookie).toBeUndefined();
    }
    const r = await handleSession(req, async () => { throw new Error("net"); });
    expect(r.status).toBe(502);
    expect(r.setCookie).toBeUndefined();
  });

  it("logout rydder cookien", async () => {
    const r = await handleSession({ method: "POST", headers: H, body: { action: "logout" } });
    expect(r.setCookie).toMatch(/Max-Age=0/);
  });
});
