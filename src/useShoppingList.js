// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useShoppingList.js
// Håndterer indkøbslister — flere lister pr. bruger, deling med hele
// familien (family_group) eller udvalgte personer, og deling via kode.
// Bruger optimistiske opdateringer + Supabase Realtime for live-sync af den
// aktive liste.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, uid } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";

const ACTIVE_LIST_KEY = "as_active_shopping_list";
const SHOPPING_FN = `${SUPABASE_URL}/functions/v1/shopping`;

export function useShoppingList({ accessToken, userId }) {
  const [lists, setLists]                   = useState([]);
  const [activeListId, setActiveListIdRaw]   = useState(() => {
    try { return localStorage.getItem(ACTIVE_LIST_KEY) || null; } catch { return null; }
  });
  const [newItemName, setNewItemName]       = useState("");
  const [familyMembers, setFamilyMembers]   = useState([]);

  const channelRef = useRef(null);

  const setActiveListId = useCallback((id) => {
    setActiveListIdRaw(id);
    try { if (id) localStorage.setItem(ACTIVE_LIST_KEY, id); } catch {}
  }, []);

  const activeList = useMemo(() => lists.find(l => l.id === activeListId) || null, [lists, activeListId]);
  const shoppingList = activeList?.shopping_list_items || [];

  // Holder altid den seneste liste synkront tilgængelig — bruges af toggleItem
  // m.fl. til at læse/opdatere state uden at vente på et React-gen-render.
  const listsRef = useRef(lists);
  listsRef.current = lists;

  // Skriver ALTID gennem denne, aldrig setLists direkte: opdaterer listsRef
  // synkront (så en efterfølgende linje i samme funktion kan læse den nyeste
  // state med det samme) og kalder så den rigtige setState. Uden dette kan
  // et await midt i fx toggleItem (se waitForRealId herunder) nå at genoptage
  // FØR React selv har nået at gen-rendere og opdatere listsRef — så en
  // handling der lige er sket (fx addToList's skift fra midlertidigt til
  // rigtigt id) ser ud som om den slet ikke er sket endnu.
  const updateLists = (updater) => {
    const next = typeof updater === "function" ? updater(listsRef.current) : updater;
    listsRef.current = next;
    setLists(next);
  };

  // Id'er vi selv lige har afkrydset/slettet/tilføjet optimistisk. Realtime-
  // beskeder for disse id'er ignoreres i et kort vindue — ellers kan en
  // Realtime-besked der når frem lige efter vores eget REST-svar (fx en
  // forsinket INSERT-ekko for en vare der allerede er slettet igen) nulstille
  // vores egen optimistiske ændring, så varen et kort øjeblik ser ud til at
  // "komme tilbage" efter at være slettet/afkrydset.
  const pendingIdsRef = useRef(new Map());
  const markPending = (id) => {
    const timeoutId = setTimeout(() => pendingIdsRef.current.delete(id), 4000);
    const existing = pendingIdsRef.current.get(id);
    if (existing) clearTimeout(existing);
    pendingIdsRef.current.set(id, timeoutId);
  };

  // ── Midlertidige id'er for varer der lige er tilføjet optimistisk ──────────
  // addToList giver en ny vare et lokalt id (uid() — en kort streng uden
  // bindestreg) indtil serverens svar kommer tilbage med det rigtige uuid.
  // Markerer man varen som købt (eller sletter den) i det tidsrum, ville et
  // PATCH/DELETE mod det midlertidige id ellers ramme et id der slet ikke
  // findes på serveren og fejle stille. isTempId skelner de to id-formater
  // (uuid'er indeholder altid bindestreger, uid() aldrig).
  const isTempId = (id) => typeof id === "string" && !id.includes("-");

  // tempId -> { promise, resolve } — så toggleItem/removeItem kan vente på
  // det rigtige id, i stedet for at fejle på det midlertidige.
  const pendingAddsRef = useRef(new Map());
  // FIFO af { listId, tempId } for varer der afventer deres rigtige id — så
  // et Realtime-INSERT for varen (som ofte når frem FØR selve POST-svaret)
  // kan genkendes som netop denne vare og erstatte det midlertidige id,
  // i stedet for at blive tilføjet som en ekstra, duplikeret linje.
  const pendingAddQueueRef = useRef([]);

  const waitForRealId = async (id) => {
    if (!isTempId(id)) return id;
    const pending = pendingAddsRef.current.get(id);
    if (!pending) return id; // allerede afklaret (eller aldrig set) — brug som er
    return pending.promise;
  };

  // ── Indlæs alle lister ───────────────────────────────────────────────────────
  const loadShoppingList = useCallback(async () => {
    try {
      const data = await apiCall(`${SHOPPING_FN}?user_id=${userId}`, { headers: makeHeaders(accessToken) });
      const fetched = Array.isArray(data?.lists) ? data.lists : [];
      updateLists(fetched);

      if (fetched.length === 0) {
        // Ingen lister endnu — opret en personlig standardliste, som før
        const created = await apiCall(SHOPPING_FN, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ owner_id: userId, name: "Min indkøbsliste", type: "personal" }),
        });
        if (created?.list) {
          updateLists([{ ...created.list, shopping_list_items: [] }]);
          setActiveListId(created.list.id);
        }
      } else if (!fetched.some(l => l.id === activeListId)) {
        setActiveListId(fetched[0].id);
      }
    } catch { /* silent */ }
  }, [userId, accessToken, activeListId, setActiveListId]);

  const loadFamilyMembers = useCallback(async () => {
    try {
      const data = await apiCall(`${SHOPPING_FN}/family-members`, { headers: makeHeaders(accessToken) });
      setFamilyMembers(Array.isArray(data?.members) ? data.members : []);
    } catch { /* silent */ }
  }, [accessToken]);

  // ── Lister — opret/omdøb/skift type/slet ─────────────────────────────────────
  const createList = useCallback(async (name, type = "personal") => {
    if (!name?.trim()) return null;
    try {
      const data = await apiCall(SHOPPING_FN, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ owner_id: userId, name: name.trim(), type }),
      });
      if (data?.list) {
        updateLists(l => [{ ...data.list, shopping_list_items: [] }, ...l]);
        setActiveListId(data.list.id);
        return data.list;
      }
    } catch { /* silent */ }
    return null;
  }, [userId, accessToken, setActiveListId]);

  const renameList = useCallback(async (listId, name) => {
    if (!name?.trim()) return;
    updateLists(l => l.map(x => x.id === listId ? { ...x, name: name.trim() } : x));
    try {
      await apiCall(`${SHOPPING_FN}/${listId}`, {
        method: "PATCH", headers: makeHeaders(accessToken), body: JSON.stringify({ name: name.trim() }),
      });
    } catch { /* silent — næste loadShoppingList() retter visningen */ }
  }, [accessToken]);

  const setListType = useCallback(async (listId, type) => {
    updateLists(l => l.map(x => x.id === listId ? { ...x, type } : x));
    try {
      await apiCall(`${SHOPPING_FN}/${listId}`, {
        method: "PATCH", headers: makeHeaders(accessToken), body: JSON.stringify({ type }),
      });
    } catch { /* silent */ }
  }, [accessToken]);

  const deleteList = useCallback(async (listId) => {
    const removed = listsRef.current.find(l => l.id === listId);
    const remaining = listsRef.current.filter(l => l.id !== listId);
    updateLists(remaining);
    if (activeListId === listId) setActiveListId(remaining[0]?.id || null);
    try {
      await apiCall(`${SHOPPING_FN}/${listId}`, { method: "DELETE", headers: makeHeaders(accessToken) });
    } catch {
      if (removed) updateLists(l => [...l, removed]);
    }
  }, [accessToken, activeListId, setActiveListId]);

  const joinByCode = useCallback(async (code) => {
    if (!code?.trim()) return { success: false, error: "Indtast en kode" };
    try {
      await apiCall(`${SHOPPING_FN}/join`, {
        method: "POST", headers: makeHeaders(accessToken), body: JSON.stringify({ code: code.trim() }),
      });
      await loadShoppingList();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message || "Ugyldig kode" };
    }
  }, [accessToken, loadShoppingList]);

  // ── Deling med udvalgte personer ─────────────────────────────────────────────
  const getListAccess = useCallback(async (listId) => {
    try {
      const data = await apiCall(`${SHOPPING_FN}/${listId}/access`, { headers: makeHeaders(accessToken) });
      return Array.isArray(data?.access) ? data.access : [];
    } catch { return []; }
  }, [accessToken]);

  const grantAccess = useCallback(async (listId, userIdToGrant, permission = "edit") => {
    try {
      await apiCall(`${SHOPPING_FN}/${listId}/access`, {
        method: "POST", headers: makeHeaders(accessToken), body: JSON.stringify({ user_id: userIdToGrant, permission }),
      });
      return true;
    } catch { return false; }
  }, [accessToken]);

  const revokeAccess = useCallback(async (listId, userIdToRevoke) => {
    try {
      await apiCall(`${SHOPPING_FN}/${listId}/access/${userIdToRevoke}`, { method: "DELETE", headers: makeHeaders(accessToken) });
      return true;
    } catch { return false; }
  }, [accessToken]);

  // ── Realtime subscription (kun den aktive liste) ─────────────────────────────
  useEffect(() => {
    if (!accessToken || !activeListId) return;

    // Afmeld tidligere kanal (rå WebSocket, ikke en Supabase-kanal — .close(), ikke .unsubscribe())
    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
    }

    // Supabase Realtime via WebSocket direkte (ingen ekstra dependency)
    const wsUrl = SUPABASE_URL.replace("https://", "wss://") + "/realtime/v1/websocket"
      + `?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;

    const topic = `realtime:public:shopping_list_items:list_id=eq.${activeListId}`;

    let cancelled = false;
    let ws;
    let heartbeat;
    let reconnectTimer;
    let reconnectDelay = 1000;

    const applyToActiveList = (updater) => {
      updateLists(prev => prev.map(l => l.id !== activeListId ? l : { ...l, shopping_list_items: updater(l.shopping_list_items || []) }));
    };

    const connect = () => {
      if (cancelled) return;
      let joined = false;

      const send = (msg) => {
        if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
      };

      ws = new WebSocket(wsUrl);
      channelRef.current = ws;

      ws.onopen = () => {
        reconnectDelay = 1000; // forbindelse lykkedes — nulstil backoff
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

          const { type, record, old_record } = msg.payload || {};
          if (!type) return;

          if (type === "INSERT" && record && !pendingIdsRef.current.has(record.id)) {
            // Hører dette INSERT til en vare vi selv lige har tilføjet, men
            // hvis rigtige id vi endnu ikke kender (POST-svaret er ikke
            // kommet tilbage endnu)? Erstat i så fald det midlertidige id
            // med det rigtige, i stedet for at tilføje varen en gang til.
            const queueIdx = pendingAddQueueRef.current.findIndex(e => e.listId === activeListId);
            if (queueIdx !== -1) {
              const { tempId } = pendingAddQueueRef.current[queueIdx];
              pendingAddQueueRef.current.splice(queueIdx, 1);
              markPending(record.id);
              applyToActiveList(items => items.some(i => i.id === record.id)
                ? items.filter(i => i.id !== tempId)
                : items.map(i => i.id === tempId ? { ...i, ...record, id: record.id } : i));
              pendingAddsRef.current.get(tempId)?.resolve(record.id);
              pendingAddsRef.current.delete(tempId);
            } else {
              applyToActiveList(items => items.some(i => i.id === record.id) ? items : [...items, record]);
            }
          }
          if (type === "UPDATE" && record && !pendingIdsRef.current.has(record.id)) {
            applyToActiveList(items => items.map(i => i.id === record.id ? { ...i, ...record } : i));
          }
          if (type === "DELETE" && old_record && !pendingIdsRef.current.has(old_record.id)) {
            applyToActiveList(items => items.filter(i => i.id !== old_record.id));
          }
        } catch { /* ignorer misdannede beskeder */ }
      };

      ws.onerror = () => { /* håndteres af onclose herunder */ };

      // Forbindelsen kan tabes uden varsel (mobil i baggrund, netværksskift) —
      // uden genforbindelse ville realtime-sync stille dø resten af sessionen
      ws.onclose = () => {
        clearInterval(heartbeat);
        if (cancelled) return;
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      clearTimeout(reconnectTimer);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ topic, event: "phx_leave", payload: {}, ref: "leave" }));
        ws.close();
      }
      channelRef.current = null;
    };
  }, [accessToken, activeListId]);

  // ── Tilføj vare ─────────────────────────────────────────────────────────────
  // Tager enten en simpel tekststreng (fritekst-vare) eller et produkt-objekt
  // ({ name, ean, id }, fx fra søgning eller favoritter) — sidstnævnte gemmer
  // en reel reference til produktet, så varen kan linkes til det i listen.
  const addToList = useCallback(async (nameOrProduct) => {
    const isProduct = nameOrProduct && typeof nameOrProduct === "object";
    const name = isProduct ? nameOrProduct.name : nameOrProduct;
    const ean = isProduct ? (nameOrProduct.ean || nameOrProduct.code || null) : null;
    const productId = isProduct ? (nameOrProduct.id || nameOrProduct.product_id || null) : null;
    const imageUrl = isProduct ? (nameOrProduct.image_url || null) : null;
    if (!name?.trim() || !activeListId) return false;
    const tempId = uid();
    const listId = activeListId;
    markPending(tempId);
    let resolveRealId;
    const realIdPromise = new Promise(res => { resolveRealId = res; });
    pendingAddsRef.current.set(tempId, { promise: realIdPromise, resolve: resolveRealId });
    pendingAddQueueRef.current.push({ listId, tempId });
    updateLists(l => l.map(x => x.id !== listId ? x : { ...x, shopping_list_items: [...(x.shopping_list_items||[]), { id: tempId, name: name.trim(), ean, product_id: productId, image_url: imageUrl, checked: false }] }));
    setNewItemName("");
    try {
      const data = await apiCall(`${SHOPPING_FN}/${listId}/items`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ name: name.trim(), ean, product_id: productId, image_url: imageUrl, added_by: userId }),
      });
      const saved = data?.item;
      if (saved?.id) {
        markPending(saved.id); // undgå at Realtime-INSERT'et for denne vare dubleres oveni id-skiftet herunder
        pendingAddQueueRef.current = pendingAddQueueRef.current.filter(e => e.tempId !== tempId);
        // Realtime kan allerede have erstattet det midlertidige id (se WS-håndteringen) —
        // findes tempId ikke længere, er denne opdatering en harmløs no-op.
        updateLists(l => l.map(x => x.id !== listId ? x : { ...x, shopping_list_items: (x.shopping_list_items||[]).map(i => i.id === tempId ? { ...i, id: saved.id } : i) }));
        pendingAddsRef.current.get(tempId)?.resolve(saved.id);
      } else {
        pendingAddsRef.current.get(tempId)?.resolve(null);
      }
      pendingAddsRef.current.delete(tempId);
      return true;
    } catch {
      // Gemning fejlede — fjern den midlertidige vare igen, ellers tror brugeren
      // den er gemt, indtil den stille forsvinder ved næste genindlæsning
      updateLists(l => l.map(x => x.id !== listId ? x : { ...x, shopping_list_items: (x.shopping_list_items||[]).filter(i => i.id !== tempId) }));
      pendingAddQueueRef.current = pendingAddQueueRef.current.filter(e => e.tempId !== tempId);
      pendingAddsRef.current.get(tempId)?.resolve(null);
      pendingAddsRef.current.delete(tempId);
      return false;
    }
  }, [activeListId, accessToken, userId]);

  // ── Toggle ──────────────────────────────────────────────────────────────────
  const toggleItem = useCallback(async (rawId) => {
    // Er varen tilføjet et øjeblik siden og afventer stadig sit rigtige id
    // fra serveren? Vent på det i stedet for at sende PATCH mod et id der
    // slet ikke findes endnu — ellers fejler ændringen stille, og en
    // efterfølgende Realtime-opdatering kan efterlade en duplikeret linje.
    const id = await waitForRealId(rawId);
    if (!id) return; // tilføjelsen fejlede undervejs — varen findes ikke længere
    const listId = activeListId;
    const list = listsRef.current.find(l => l.id === listId);
    const current = list?.shopping_list_items?.find(i => i.id === id);
    if (!current) return; // id fandtes ikke i listen
    const newChecked = !current.checked;
    markPending(id);
    updateLists(l => l.map(x => x.id !== listId ? x : { ...x, shopping_list_items: (x.shopping_list_items||[]).map(i => i.id === id ? { ...i, checked: newChecked } : i) }));
    try {
      await apiCall(`${SHOPPING_FN}/${listId}/items/${id}`, {
        method: "PATCH", headers: makeHeaders(accessToken), body: JSON.stringify({ checked: newChecked }),
      });
    } catch {
      // Opdatering fejlede — rul afkrydsningen tilbage, ellers viser UI'et en
      // status serveren ikke er enig i, indtil næste genindlæsning stille retter den
      updateLists(l => l.map(x => x.id !== listId ? x : { ...x, shopping_list_items: (x.shopping_list_items||[]).map(i => i.id === id ? { ...i, checked: !newChecked } : i) }));
    }
  }, [activeListId, accessToken]);

  // ── Slet ────────────────────────────────────────────────────────────────────
  const removeItem = useCallback(async (rawId) => {
    // Se toggleItem ovenfor — samme grund til at vente på det rigtige id.
    const id = await waitForRealId(rawId);
    if (!id) return;
    const listId = activeListId;
    const list = listsRef.current.find(l => l.id === listId);
    const removed = list?.shopping_list_items?.find(i => i.id === id);
    markPending(id);
    updateLists(l => l.map(x => x.id !== listId ? x : { ...x, shopping_list_items: (x.shopping_list_items||[]).filter(i => i.id !== id) }));
    try {
      await apiCall(`${SHOPPING_FN}/${listId}/items/${id}`, { method: "DELETE", headers: makeHeaders(accessToken) });
    } catch {
      // Sletning fejlede — læg varen tilbage, ellers forsvinder den fra UI'et
      // uden reelt at være slettet i databasen
      if (removed) updateLists(l => l.map(x => x.id !== listId ? x : { ...x, shopping_list_items: [...(x.shopping_list_items||[]), removed] }));
    }
  }, [activeListId, accessToken]);

  const clearDone = useCallback(() => {
    const list = listsRef.current.find(l => l.id === activeListId);
    (list?.shopping_list_items || []).filter(i => i.checked).forEach(i => removeItem(i.id));
  }, [activeListId, removeItem]);

  return {
    lists, activeList, activeListId, setActiveListId,
    shoppingList, setShoppingList: () => {}, // bagudkompatibel no-op — items styres nu via lists
    shoppingListId: activeListId, setShoppingListId: setActiveListId,
    newItemName, setNewItemName,
    familyMembers, loadFamilyMembers,
    loadShoppingList,
    createList, renameList, setListType, deleteList, joinByCode,
    getListAccess, grantAccess, revokeAccess,
    addToList,
    toggleItem,
    removeItem,
    clearDone,
  };
}
