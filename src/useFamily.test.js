// @vitest-environment jsdom
// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useFamily.test.js
// addMember/removeMember update the UI optimistically before the network
// call finishes. These tests lock down the rollback behavior fixed during
// the code-quality review (bekymring #5): if saving/deleting fails, the
// optimistic change must be undone rather than left showing a state the
// database doesn't actually have.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useFamily } from "./useFamily.js";

vi.mock("./constants.jsx", async (importOriginal) => ({ ...(await importOriginal()), uid: () => "temp-1" }));

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 500, text: async () => JSON.stringify(body) };
}

beforeEach(() => {
  global.fetch = vi.fn();
});

describe("useFamily addMember", () => {
  it("removes the optimistic member again if saving fails", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ message: "boom" }, false));
    const { result } = renderHook(() => useFamily({ accessToken: "tok", userId: "u1", setActiveProfiles: () => {} }));

    act(() => {
      result.current.setNewMemberName("Anna");
      result.current.setNewMemberBirthYear("2015");
      result.current.setNewMemberGender("kvinde");
    });
    await act(async () => { await result.current.addMember(); });

    expect(result.current.family).toEqual([]);
  });

  it("keeps the member (with the server's real id) when saving succeeds", async () => {
    global.fetch.mockResolvedValue(jsonResponse([{ id: "server-id-1" }]));
    const { result } = renderHook(() => useFamily({ accessToken: "tok", userId: "u1", setActiveProfiles: () => {} }));

    act(() => {
      result.current.setNewMemberName("Anna");
      result.current.setNewMemberBirthYear("2015");
      result.current.setNewMemberGender("kvinde");
    });
    await act(async () => { await result.current.addMember(); });

    expect(result.current.family).toHaveLength(1);
    expect(result.current.family[0]).toMatchObject({ id: "server-id-1", name: "Anna" });
  });

  it("does nothing when required fields are missing (no name/birth year/gender)", async () => {
    const { result } = renderHook(() => useFamily({ accessToken: "tok", userId: "u1", setActiveProfiles: () => {} }));
    await act(async () => { await result.current.addMember(); });
    expect(result.current.family).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// QA 28. sept. 2026 (Q4): det første familiemedlem indgik ikke i scanningen,
// fordi scanner-udvalget beholdt det midlertidige klient-id.
describe("useFamily scanner-udvalg (activeProfiles)", () => {
  function holder(initial) {
    const h = { value: initial };
    h.set = (u) => { h.value = typeof u === "function" ? u(h.value) : u; };
    return h;
  }

  it("udskifter det midlertidige id med serverens id efter gemning", async () => {
    const ap = holder(["me"]);
    const { result } = renderHook(() => useFamily({ accessToken: "tok", userId: "u1", setActiveProfiles: ap.set }));
    global.fetch.mockImplementation(async () => {
      // Som App.jsx's "vælg Alle første gang"-effekt: udvalget får temp-id'et
      ap.value = ["me", "temp-1"];
      return jsonResponse([{ id: "server-id-1" }]);
    });
    act(() => {
      result.current.setNewMemberName("Øjvind");
      result.current.setNewMemberBirthYear("2020");
      result.current.setNewMemberGender("mand");
    });
    await act(async () => { await result.current.addMember(); });
    expect(ap.value).toEqual(["me", "server-id-1"]);
  });

  it("reparerer et gemt udvalg med ukendte id'er til 'Alle' ved indlæsning", async () => {
    const ap = holder(["me", "b735pp3"]);
    global.fetch.mockResolvedValue(jsonResponse([{ id: "m1", name: "Øjvind" }, { id: "m2", name: "Sofie" }]));
    const { result } = renderHook(() => useFamily({ accessToken: "tok", userId: "u1", setActiveProfiles: ap.set }));
    await act(async () => { await result.current.loadFamily(); });
    expect(ap.value).toEqual(["me", "m1", "m2"]);
  });

  it("lader et gyldigt, bevidst udvalg være", async () => {
    const ap = holder(["m2"]);
    global.fetch.mockResolvedValue(jsonResponse([{ id: "m1", name: "Øjvind" }, { id: "m2", name: "Sofie" }]));
    const { result } = renderHook(() => useFamily({ accessToken: "tok", userId: "u1", setActiveProfiles: ap.set }));
    await act(async () => { await result.current.loadFamily(); });
    expect(ap.value).toEqual(["m2"]);
  });
});

describe("useFamily removeMember", () => {
  it("restores the member if deletion fails", async () => {
    global.fetch.mockResolvedValue(jsonResponse({}, false));
    const existing = { id: "m1", name: "Sofie" };
    const { result } = renderHook(() => useFamily({ accessToken: "tok", userId: "u1", setActiveProfiles: () => {} }));
    act(() => { result.current.setFamily([existing]); });

    await act(async () => { await result.current.removeMember("m1"); });

    expect(result.current.family).toEqual([existing]);
  });

  it("leaves the member removed when deletion succeeds", async () => {
    global.fetch.mockResolvedValue(jsonResponse({}));
    const existing = { id: "m1", name: "Sofie" };
    const { result } = renderHook(() => useFamily({ accessToken: "tok", userId: "u1", setActiveProfiles: () => {} }));
    act(() => { result.current.setFamily([existing]); });

    await act(async () => { await result.current.removeMember("m1"); });

    expect(result.current.family).toEqual([]);
  });
});
