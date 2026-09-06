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
