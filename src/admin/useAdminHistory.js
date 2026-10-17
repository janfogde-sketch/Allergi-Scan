// @ts-check
// Ændringshistorik: sider, søgning og filtre kører på serveren (databasefunktionen admin_product_history). En fejl er aldrig en tom liste.
import { useState, useRef, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { historyParams, HISTORY_PAGE } from "./historyLogic.js";

export function useAdminHistory(/** @type {string | null} */ accessToken) {
  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [total, setTotal] = useState(/** @type {number | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(/** @type {null | { unavailable: boolean }} */ (null));
  const [legacyMode, setLegacyMode] = useState(false);
  const filters = useRef({ q: "", action: "", days: "", allergen: false, sort: "newest" });
  const seq = useRef(0);

  const load = useCallback(async (/** @type {any} */ next, /** @type {boolean} */ append = false) => {
    if (next && typeof next === "object" && !("nativeEvent" in next)) filters.current = { ...filters.current, ...next };
    const mine = ++seq.current;
    if (append) setLoadingMore(true); else { setLoading(true); setError(null); }
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_product_history`, {
        method: "POST", headers: { ...makeHeaders(accessToken), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(historyParams(filters.current, append ? rows.length : 0)),
      });
      if (mine !== seq.current) return;
      const list = Array.isArray(data) ? data : [];
      setRows(append ? (prev) => [...prev, ...list.slice(0, HISTORY_PAGE).filter((r) => !prev.some((x) => x.id === r.id && x.source === r.source))] : list.slice(0, HISTORY_PAGE));
      setHasMore(list.length > HISTORY_PAGE);
      setTotal(list.length ? Number(list[0].total_count) : (append ? total : 0));
      setLegacyMode(false);
    } catch (e) {
      if (mine !== seq.current) return;
      const x = /** @type {any} */ (e);
      const unavailable = x?.status === 404 || /PGRST202|42883|does not exist/i.test(String(x?.body || x?.message || ""));
      // Før databaseopdateringen er udgivet: vis de ældre registreringer direkte, som siden altid har gjort (uden filtre på serveren)
      if (unavailable && !append) {
        try {
          const h = { ...makeHeaders(accessToken), Accept: "application/json" };
          const old = await apiCall(`${SUPABASE_URL}/rest/v1/revision_log?order=created_at.desc&limit=100`, { headers: h });
          const entries = Array.isArray(old) ? old : [];
          const pids = [...new Set(entries.map((r) => r.product_id).filter(Boolean))];
          const uids = [...new Set(entries.map((r) => r.changed_by).filter(Boolean))];
          const [ps, us] = await Promise.all([
            pids.length ? apiCall(`${SUPABASE_URL}/rest/v1/products?id=in.(${pids.join(",")})&select=id,name,ean`, { headers: h }).catch(() => []) : [],
            uids.length ? apiCall(`${SUPABASE_URL}/rest/v1/users?id=in.(${uids.join(",")})&select=id,name,email`, { headers: h }).catch(() => []) : [],
          ]);
          const pm = Object.fromEntries((Array.isArray(ps) ? ps : []).map((p) => [p.id, p]));
          const um = Object.fromEntries((Array.isArray(us) ? us : []).map((u) => [u.id, u]));
          if (mine !== seq.current) return;
          const f = filters.current;
          const q = f.q.trim().toLowerCase();
          const mapped = entries.map((r) => ({
            id: r.id, source: "legacy", at: r.created_at, action: r.change_type === "created" ? "created" : "updated", product_id: r.product_id, product_exists: !!pm[r.product_id],
            ean: pm[r.product_id]?.ean || null, name: pm[r.product_id]?.name || null, actor_id: r.changed_by, actor_name: um[r.changed_by] ? um[r.changed_by].name || um[r.changed_by].email : null,
            changes: null, fields: null, note: r.new_value, legacy_fields: r.field_changed,
          })).filter((r) => (!f.action || r.action === f.action) && (!q || `${r.name || ""} ${r.ean || ""} ${r.actor_name || ""}`.toLowerCase().includes(q)));
          setRows(mapped); setHasMore(false); setTotal(mapped.length); setLegacyMode(true); setError(null);
          if (mine === seq.current) { setLoading(false); setLoadingMore(false); }
          return;
        } catch { /* falder igennem til fejlvisning */ }
      }
      setError({ unavailable });
    }
    if (mine === seq.current) { setLoading(false); setLoadingMore(false); }
  }, [accessToken, rows.length, total]);

  return { rows, total, loading, loadingMore, hasMore, error, legacyMode, load };
}
