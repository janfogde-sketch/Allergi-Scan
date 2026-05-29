// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useShoppingList.js
// Håndterer indkøbsliste — hent, tilføj, toggle, slet.
// Bruger optimistiske opdateringer (UI opdateres straks, API i baggrunden).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { SUPABASE_URL, uid } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";

export function useShoppingList({ accessToken, userId }) {
  const [shoppingList, setShoppingList]       = useState([]);
  const [shoppingListId, setShoppingListId]   = useState(null);
  const [newItemName, setNewItemName]         = useState("");

  const loadShoppingList = async () => {
    try {
      const lists = await apiCall(
        `${SUPABASE_URL}/rest/v1/shopping_lists?owner_id=eq.${userId}&select=id&limit=1`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      let listId = lists?.[0]?.id;
      if (!listId) {
        const created = await apiCall(`${SUPABASE_URL}/rest/v1/shopping_lists`, {
          method: "POST",
          headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
          body: JSON.stringify({ owner_id: userId, name: "Min indkøbsliste" }),
        });
        listId = Array.isArray(created) ? created[0]?.id : created?.id;
      }
      if (listId) {
        setShoppingListId(listId);
        const items = await apiCall(
          `${SUPABASE_URL}/rest/v1/shopping_list_items?list_id=eq.${listId}&order=created_at.asc`,
          { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
        );
        setShoppingList(Array.isArray(items)
          ? items.map(i => ({ id: i.id, name: i.name, checked: i.checked || false }))
          : []);
      }
    } catch { /* silent */ }
  };

  const addToList = async (name) => {
    if (!name?.trim()) return;
    const tempId = uid();
    setShoppingList(l => [...l, { id: tempId, name: name.trim(), checked: false }]);
    setNewItemName("");
    try {
      if (shoppingListId) {
        const data = await apiCall(`${SUPABASE_URL}/rest/v1/shopping_list_items`, {
          method: "POST",
          headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
          body: JSON.stringify({ list_id: shoppingListId, name: name.trim(), checked: false }),
        });
        const saved = Array.isArray(data) ? data[0] : data;
        if (saved?.id) setShoppingList(l => l.map(i => i.id === tempId ? { ...i, id: saved.id } : i));
      }
    } catch { /* silent — behold optimistisk opdatering */ }
  };

  const toggleItem = async (id) => {
    const item = shoppingList.find(i => i.id === id);
    setShoppingList(l => l.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/shopping_list_items?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({ checked: !item?.checked }),
      });
    } catch { /* silent */ }
  };

  const removeItem = async (id) => {
    setShoppingList(l => l.filter(i => i.id !== id));
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/shopping_list_items?id=eq.${id}`, {
        method: "DELETE",
        headers: makeHeaders(accessToken),
      });
    } catch { /* silent */ }
  };

  const clearDone = () => shoppingList.filter(i => i.checked).forEach(i => removeItem(i.id));

  return {
    shoppingList, setShoppingList,
    shoppingListId, setShoppingListId,
    newItemName, setNewItemName,
    loadShoppingList,
    addToList,
    toggleItem,
    removeItem,
    clearDone,
  };
}
