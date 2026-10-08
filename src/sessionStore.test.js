// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { hasStoredSession, persistRefreshToken, restoreSession, endSession, getAccessToken, setMemoryToken } from "./sessionStore.js";

const res = (status, body = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); setMemoryToken(null);
  global.fetch = vi.fn();
});

describe("sessionStore", () => {
  it("uden mærke og uden gamle nøgler findes ingen session, og ingen kald sendes", async () => {
    expect(hasStoredSession()).toBe(false);
    expect(await restoreSession()).toEqual({ status: "none" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("persistRefreshToken sætter kun et ikke-hemmeligt mærke lokalt, aldrig selve nøglen", async () => {
    fetch.mockResolvedValue(res(200));
    expect(await persistRefreshToken("secretRefresh1", true)).toBe(true);
    expect(localStorage.getItem("as_session")).toBe("1");
    expect(JSON.stringify({ ...localStorage })).not.toContain("secretRefresh1");
    expect(fetch.mock.calls[0][1].headers["X-Requested-With"]).toBe("eatsafe");
    expect(fetch.mock.calls[0][1].credentials).toBe("same-origin");
  });

  it("uden husk mig lægges mærket i fanebladet (sessionStorage) og fornyelsen bærer persist=false", async () => {
    fetch.mockResolvedValue(res(200, { access_token: "A", user_id: "u1" }));
    await persistRefreshToken("secretRefresh1", false);
    expect(sessionStorage.getItem("as_session")).toBe("1");
    expect(localStorage.getItem("as_session")).toBeNull();
    await restoreSession();
    expect(JSON.parse(fetch.mock.calls[1][1].body).persist).toBe(false);
  });

  it("restoreSession: ok giver kort nøgle; 401 = expired; netværk/500 = error (sessionen beholdes)", async () => {
    localStorage.setItem("as_session", "1");
    fetch.mockResolvedValueOnce(res(200, { access_token: "A", user_id: "u1" }));
    expect(await restoreSession()).toEqual({ status: "ok", accessToken: "A", userId: "u1" });
    fetch.mockResolvedValueOnce(res(401));
    expect((await restoreSession()).status).toBe("expired");
    fetch.mockResolvedValueOnce(res(502));
    expect((await restoreSession()).status).toBe("error");
    fetch.mockRejectedValueOnce(new Error("offline"));
    expect((await restoreSession()).status).toBe("error");
    expect(localStorage.getItem("as_session")).toBe("1");
  });

  it("flytter en gammel nøgle fra lokal lagring: sendes med, og de gamle nøgler slettes ved succes", async () => {
    localStorage.setItem("as_token", "oldAccess");
    localStorage.setItem("as_refresh", "legacyRefresh1");
    expect(hasStoredSession()).toBe(true);
    fetch.mockResolvedValue(res(200, { access_token: "A", user_id: "u1" }));
    await restoreSession();
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ action: "refresh", refresh_token: "legacyRefresh1", persist: true });
    expect(localStorage.getItem("as_refresh")).toBeNull();
    expect(localStorage.getItem("as_token")).toBeNull();
    expect(localStorage.getItem("as_session")).toBe("1");
  });

  it("den gamle nøgle bliver liggende, hvis flytningen fejler på netværket (prøves igen næste gang)", async () => {
    localStorage.setItem("as_refresh", "legacyRefresh1");
    fetch.mockRejectedValue(new Error("offline"));
    expect((await restoreSession()).status).toBe("error");
    expect(localStorage.getItem("as_refresh")).toBe("legacyRefresh1");
  });

  it("endSession rydder mærke, gamle nøgler og den korte nøgle, og beder om at cookien slettes", async () => {
    localStorage.setItem("as_session", "1"); localStorage.setItem("as_refresh", "x"); setMemoryToken("A");
    fetch.mockResolvedValue(res(200));
    await endSession();
    expect(getAccessToken()).toBeNull();
    expect(hasStoredSession()).toBe(false);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ action: "logout" });
  });
});
