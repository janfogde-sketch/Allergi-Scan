// @vitest-environment jsdom
// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useShoppingList.test.js
// addToList/toggleItem/removeItem all update the UI optimistically before the
// network call finishes, then roll the change back on failure (fixed during
// bekymring #5 of the code-quality review). These tests guard that behavior.
//
// The hook also opens a raw WebSocket for Supabase Realtime whenever a
// shoppingListId is set — we stub out `WebSocket` globally so that doesn't
// throw in the test environment; the tests never assert anything about it.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useShoppingList } from "./useShoppingList.js";

class FakeWebSocket {
  static OPEN = 1;
  readyState = 0;
  send() {}
  close() {}
}

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 500, text: async () => JSON.stringify(body) };
}

beforeEach(() => {
  global.fetch = vi.fn();
  global.WebSocket = FakeWebSocket;
});

describe("addToList", () => {
  it("removes the optimistic item again if saving fails", async () => {
    global.fetch.mockResolvedValue(jsonResponse({}, false));
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    act(() => { result.current.setShoppingListId("list-1"); });

    let ok;
    await act(async () => { ok = await result.current.addToList("Havregryn"); });

    expect(ok).toBe(false);
    expect(result.current.shoppingList).toEqual([]);
  });

  it("keeps the item (with the server's real id) when saving succeeds", async () => {
    global.fetch.mockResolvedValue(jsonResponse([{ id: "server-item-1" }]));
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    act(() => { result.current.setShoppingListId("list-1"); });

    let ok;
    await act(async () => { ok = await result.current.addToList("Havregryn"); });

    expect(ok).toBe(true);
    expect(result.current.shoppingList).toEqual([{ id: "server-item-1", name: "Havregryn", checked: false }]);
  });

  it("ignores blank input", async () => {
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    let ok;
    await act(async () => { ok = await result.current.addToList("   "); });
    expect(ok).toBe(false);
    expect(result.current.shoppingList).toEqual([]);
  });
});

describe("toggleItem", () => {
  it("reverts the checkmark if the server update fails", async () => {
    global.fetch.mockResolvedValue(jsonResponse({}, false));
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    act(() => { result.current.setShoppingList([{ id: "i1", name: "Mælk", checked: false }]); });

    await act(async () => { await result.current.toggleItem("i1"); });

    expect(result.current.shoppingList[0].checked).toBe(false);
  });

  it("keeps the checkmark flipped when the server update succeeds", async () => {
    global.fetch.mockResolvedValue(jsonResponse({}));
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    act(() => { result.current.setShoppingList([{ id: "i1", name: "Mælk", checked: false }]); });

    await act(async () => { await result.current.toggleItem("i1"); });

    expect(result.current.shoppingList[0].checked).toBe(true);
  });
});

describe("removeItem", () => {
  it("restores the item if deletion fails", async () => {
    global.fetch.mockResolvedValue(jsonResponse({}, false));
    const existing = { id: "i1", name: "Mælk", checked: false };
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    act(() => { result.current.setShoppingList([existing]); });

    await act(async () => { await result.current.removeItem("i1"); });

    expect(result.current.shoppingList).toEqual([existing]);
  });

  it("leaves the item removed when deletion succeeds", async () => {
    global.fetch.mockResolvedValue(jsonResponse({}));
    const existing = { id: "i1", name: "Mælk", checked: false };
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    act(() => { result.current.setShoppingList([existing]); });

    await act(async () => { await result.current.removeItem("i1"); });

    expect(result.current.shoppingList).toEqual([]);
  });
});
