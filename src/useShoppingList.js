// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useShoppingList.js
// Håndterer indkøbsliste — hent, tilføj, toggle, slet.
// Bruger optimistiske opdateringer + Supabase Realtime for live-sync.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, uid } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";

export function useShoppingList({ accessToken, userId }) {
  const [shoppingList, setShoppingList]     = useState([]);
  const [shoppingListId, setShoppingListId] = useState(null);
  const [newItemName, setNewItemName]       = useState("");

  const channelRef = useRef(null);

  // ── Indlæs liste ────────────────────────────────────────────────────────────
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
        await fetchItems(listId);
      }
    } catch { /* silent */ }
  };

  const fetchItems = async (listId) => {
    try {
      const items = await apiCall(
        `${SUPABASE_URL}/rest/v1/shopping_list_items?list_id=eq.${listId}&order=added_at.asc`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      setShoppingList(Array.isArray(items)
        ? items.map(i => ({
            id:       i.id,
            name:     i.name,
            checked:  i.checked || false,
            added_by: i.added_by || null,
          }))
        : []);
    } catch { /* silent */ }
  };

  // ── Realtime subscription ────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !shoppingListId) return;

    // Afmeld tidligere kanal
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Supabase Realtime via WebSocket direkte (ingen ekstra dependency)
    const wsUrl = SUPABASE_URL.replace("https://", "wss://") + "/realtime/v1/websocket"
      + `?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;

    let ws;
    let heartbeat;
    let joined = false;

    const topic = `realtime:public:shopping_list_items:list_id=eq.${shoppingListId}`;

    const send = (msg) => {
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    };

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Join kanal
      send({ topic, event: "phx_join", payload: { user_token: accessToken }, ref: "1" });
      // Heartbeat hvert 25s
      heartbeat = setInterval(() => send({ topic: "phoenix", event: "heartbeat", payload: {}, ref: "hb" }), 25000);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === "phx_reply" && msg.ref === "1") joined = true;
        if (!joined) return;

        const { commit_timestamp, type, record, old_record } = msg.payload || {};
        if (!type) return;

        if (type === "INSERT" && record) {
          setShoppingList(prev => {
            if (prev.some(i => i.id === record.id)) return prev; // undgå dubletter
            return [...prev, { id: record.id, name: record.name, checked: record.checked || false, added_by: record.added_by || null }];
          });
        }
        if (type === "UPDATE" && record) {
          setShoppingList(prev => prev.map(i => i.id === record.id ? { ...i, checked: record.checked, name: record.name } : i));
        }
        if (type === "DELETE" && old_record) {
          setShoppingList(prev => prev.filter(i => i.id !== old_record.id));
        }
      } catch { /* ignorer misdannede beskeder */ }
    };

    ws.onerror = () => { /* silent — REST-opdateringer fungerer stadig */ };

    channelRef.current = ws;

    return () => {
      clearInterval(heartbeat);
      if (ws.readyState === WebSocket.OPEN) {
        send({ topic, event: "phx_leave", payload: {}, ref: "leave" });
        ws.close();
      }
      channelRef.current = null;
    };
  }, [accessToken, shoppingListId]);

  // ── Tilføj vare ─────────────────────────────────────────────────────────────
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
          body: JSON.stringify({
            list_id:  shoppingListId,
            name:     name.trim(),
            checked:  false,
            added_by: userId || null,
          }),
        });
        const saved = Array.isArray(data) ? data[0] : data;
        if (saved?.id) setShoppingList(l => l.map(i => i.id === tempId ? { ...i, id: saved.id } : i));
      }
    } catch { /* behold optimistisk opdatering */ }
  };

  // ── Toggle ──────────────────────────────────────────────────────────────────
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

  // ── Slet ────────────────────────────────────────────────────────────────────
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
