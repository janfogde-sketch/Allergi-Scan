// @vitest-environment jsdom
// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useShoppingList.test.js
// addToList/toggleItem/removeItem all update the UI optimistically before the
// network call finishes, then roll the change back on failure. These tests
// guard that behavior against the current multi-list API (items live under
// `lists[].shopping_list_items`, seeded via loadShoppingList()/GET — there is
// no direct `setShoppingList` setter anymore).
//
// They also guard against a real bug: a Realtime echo for an action we just
// made ourselves (e.g. a delayed INSERT/UPDATE arriving right after our own
// DELETE/PATCH already resolved) could otherwise resurrect an item we just
// removed/toggled. See markPending/pendingIdsRef in useShoppingList.js.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useShoppingList } from "./useShoppingList.js";

let wsInstances = [];
class FakeWebSocket {
  static OPEN = 1;
  readyState = 1;
  constructor() { wsInstances.push(this); }
  send() {}
  close() {}
}

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 500, text: async () => JSON.stringify(body) };
}

// Seed the hook with a single active list containing the given items, via the
// same GET the app uses on load — not a direct state setter (none exists).
async function seedList(result, items) {
  global.fetch.mockResolvedValueOnce(jsonResponse({
    success: true,
    lists: [{ id: "list-1", name: "Liste", shopping_list_items: items }],
  }));
  await act(async () => { await result.current.loadShoppingList(); });
}

beforeEach(() => {
  global.fetch = vi.fn();
  global.WebSocket = FakeWebSocket;
  wsInstances = [];
});

describe("addToList", () => {
  it("removes the optimistic item again if saving fails", async () => {
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    await seedList(result, []);

    global.fetch.mockResolvedValue(jsonResponse({}, false));
    let ok;
    await act(async () => { ok = await result.current.addToList("Havregryn"); });

    expect(ok).toBe(false);
    expect(result.current.shoppingList).toEqual([]);
  });

  it("keeps the item (with the server's real id) when saving succeeds", async () => {
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    await seedList(result, []);

    global.fetch.mockResolvedValue(jsonResponse({ item: { id: "server-item-1" } }));
    let ok;
    await act(async () => { ok = await result.current.addToList("Havregryn"); });

    expect(ok).toBe(true);
    expect(result.current.shoppingList).toEqual([{ id: "server-item-1", name: "Havregryn", ean: null, product_id: null, image_url: null, checked: false }]);
  });

  it("ignores blank input", async () => {
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    await seedList(result, []);
    let ok;
    await act(async () => { ok = await result.current.addToList("   "); });
    expect(ok).toBe(false);
    expect(result.current.shoppingList).toEqual([]);
  });
});

describe("toggleItem", () => {
  it("reverts the checkmark if the server update fails", async () => {
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    await seedList(result, [{ id: "i1", name: "Mælk", checked: false }]);

    global.fetch.mockResolvedValue(jsonResponse({}, false));
    await act(async () => { await result.current.toggleItem("i1"); });

    expect(result.current.shoppingList[0].checked).toBe(false);
  });

  it("keeps the checkmark flipped when the server update succeeds", async () => {
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    await seedList(result, [{ id: "i1", name: "Mælk", checked: false }]);

    global.fetch.mockResolvedValue(jsonResponse({}));
    await act(async () => { await result.current.toggleItem("i1"); });

    expect(result.current.shoppingList[0].checked).toBe(true);
  });

  it("ignores a delayed Realtime echo for the item it just toggled", async () => {
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    await seedList(result, [{ id: "i1", name: "Mælk", checked: false }]);
    await waitFor(() => expect(wsInstances.length).toBeGreaterThan(0));

    global.fetch.mockResolvedValue(jsonResponse({}));
    await act(async () => { await result.current.toggleItem("i1"); });
    expect(result.current.shoppingList[0].checked).toBe(true);

    // A stale UPDATE echo arrives just after our own PATCH resolved, still
    // carrying the pre-toggle "checked: false" — it must not win.
    const ws = wsInstances[wsInstances.length - 1];
    act(() => {
      ws.onmessage({ data: JSON.stringify({ event: "phx_reply", ref: "1" }) });
      ws.onmessage({ data: JSON.stringify({ payload: { type: "UPDATE", record: { id: "i1", checked: false } } }) });
    });

    expect(result.current.shoppingList[0].checked).toBe(true);
  });
});

describe("removeItem", () => {
  it("restores the item if deletion fails", async () => {
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    const existing = { id: "i1", name: "Mælk", checked: false };
    await seedList(result, [existing]);

    global.fetch.mockResolvedValue(jsonResponse({}, false));
    await act(async () => { await result.current.removeItem("i1"); });

    expect(result.current.shoppingList).toEqual([existing]);
  });

  it("leaves the item removed when deletion succeeds", async () => {
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    await seedList(result, [{ id: "i1", name: "Mælk", checked: false }]);

    global.fetch.mockResolvedValue(jsonResponse({}));
    await act(async () => { await result.current.removeItem("i1"); });

    expect(result.current.shoppingList).toEqual([]);
  });

  it("ignores a delayed Realtime echo (INSERT/UPDATE) for the item it just deleted", async () => {
    const { result } = renderHook(() => useShoppingList({ accessToken: "tok", userId: "u1" }));
    await seedList(result, [{ id: "i1", name: "Mælk", checked: false }]);
    await waitFor(() => expect(wsInstances.length).toBeGreaterThan(0));

    global.fetch.mockResolvedValue(jsonResponse({}));
    await act(async () => { await result.current.removeItem("i1"); });
    expect(result.current.shoppingList).toEqual([]);

    // This is exactly the reported bug: a Realtime message for the
    // just-deleted item arrives right after — the item must not reappear.
    const ws = wsInstances[wsInstances.length - 1];
    act(() => {
      ws.onmessage({ data: JSON.stringify({ event: "phx_reply", ref: "1" }) });
      ws.onmessage({ data: JSON.stringify({ payload: { type: "INSERT", record: { id: "i1", name: "Mælk", checked: false } } }) });
    });

    expect(result.current.shoppingList).toEqual([]);
  });
});
