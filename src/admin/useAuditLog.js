// @ts-check
// Henter adminloggen (public.admin_audit_log) 50 rækker ad gangen med nøgle-paginering. Kun administratorer kan læse tabellen (RLS).
// Søgning og filtre kører på serveren på tværs af hele loggen. Navne på admins, brugere og produkter slås op bagefter (loggen gemmer kun id'er);
// fejler opslaget, vises korte id'er. En fejl er en egen tilstand (error), aldrig en tom liste.
import { useState, useRef, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { auditNameIds, buildAuditQuery, cleanSearch } from "./auditLogic.js";

export const AUDIT_PAGE = 50;
/** @param {Array<{ id: string }>} list */
const byId = (list) => Object.fromEntries((Array.isArray(list) ? list : []).map((x) => [x.id, x]));

export function useAuditLog(accessToken) {
  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [names, setNames] = useState({ users: {}, products: {} });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(/** @type {null | { denied: boolean, message: string }} */ (null));
  const filtersRef = useRef(/** @type {{ type?: string, category?: string, period?: string, q?: string }} */ ({}));
  const rowsRef = useRef(/** @type {any[]} */ ([]));
  const seq = useRef(0); // et nyere kald gør et ældre svar ugyldigt

  /** Id'er på brugere og produkter, hvis navn eller e-mail matcher søgeordet (loggen gemmer kun id'er). */
  const searchIds = useCallback(async (/** @type {string} */ q) => {
    const s = cleanSearch(q);
    if (!s) return [];
    const headers = makeHeaders(accessToken);
    const [users, products] = await Promise.all([
      apiCall(`${SUPABASE_URL}/rest/v1/users?or=(name.ilike.*${encodeURIComponent(s)}*,email.ilike.*${encodeURIComponent(s)}*)&select=id&limit=50`, { headers }).catch(() => []),
      apiCall(`${SUPABASE_URL}/rest/v1/products?name=ilike.*${encodeURIComponent(s)}*&select=id&limit=50`, { headers }).catch(() => []),
    ]);
    return [...(Array.isArray(users) ? users : []), ...(Array.isArray(products) ? products : [])].map((x) => String(x.id));
  }, [accessToken]);

  const loadNames = useCallback(async (/** @type {any[]} */ list) => {
    const ids = auditNameIds(list);
    const headers = makeHeaders(accessToken);
    const [users, products] = await Promise.all([
      ids.users.length ? apiCall(`${SUPABASE_URL}/rest/v1/users?id=in.(${ids.users.join(",")})&select=id,name,email`, { headers }).catch(() => []) : [],
      ids.products.length ? apiCall(`${SUPABASE_URL}/rest/v1/products?id=in.(${ids.products.join(",")})&select=id,name`, { headers }).catch(() => []) : [],
    ]);
    setNames((prev) => ({ users: { ...prev.users, ...byId(users) }, products: { ...prev.products, ...byId(products) } }));
  }, [accessToken]);

  /** Henter første side med de givne filtre (eller de sidst brugte). */
  const load = useCallback(async (/** @type {any} */ filters) => {
    if (filters && typeof filters === "object" && !("nativeEvent" in filters)) filtersRef.current = filters;
    const f = filtersRef.current;
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const matchIds = f.q ? await searchIds(f.q) : [];
      const query = buildAuditQuery({ ...f, matchIds, limit: AUDIT_PAGE + 1 });
      const data = query ? await apiCall(`${SUPABASE_URL}/rest/v1/admin_audit_log?${query}`, { headers: makeHeaders(accessToken) }) : [];
      if (mine !== seq.current) return;
      const list = Array.isArray(data) ? data : [];
      const page = list.slice(0, AUDIT_PAGE);
      rowsRef.current = page;
      setRows(page);
      setHasMore(list.length > AUDIT_PAGE);
      setLoaded(true);
      loadNames(page);
    } catch (e) {
      if (mine !== seq.current) return;
      const status = /** @type {any} */ (e).status;
      setError({ denied: status === 401 || status === 403, message: e instanceof Error ? e.message : "Ukendt fejl" });
    }
    if (mine === seq.current) setLoading(false);
  }, [accessToken, searchIds, loadNames]);

  /** Henter de næste 50 ældre rækker (efter den sidste viste). Rækker, der allerede vises, tilføjes ikke igen. */
  const loadMore = useCallback(async () => {
    const last = rowsRef.current[rowsRef.current.length - 1];
    if (!last || loadingMore) return;
    const mine = seq.current;
    setLoadingMore(true);
    try {
      const f = filtersRef.current;
      const matchIds = f.q ? await searchIds(f.q) : [];
      const query = buildAuditQuery({ ...f, matchIds, cursor: { created_at: last.created_at, id: last.id }, limit: AUDIT_PAGE + 1 });
      const data = query ? await apiCall(`${SUPABASE_URL}/rest/v1/admin_audit_log?${query}`, { headers: makeHeaders(accessToken) }) : [];
      if (mine !== seq.current) { setLoadingMore(false); return; }
      const list = Array.isArray(data) ? data : [];
      const seen = new Set(rowsRef.current.map((r) => r.id));
      const fresh = list.slice(0, AUDIT_PAGE).filter((r) => !seen.has(r.id));
      rowsRef.current = [...rowsRef.current, ...fresh];
      setRows(rowsRef.current);
      setHasMore(list.length > AUDIT_PAGE);
      loadNames(fresh);
    } catch (e) {
      if (mine === seq.current) setError({ denied: /** @type {any} */ (e).status === 401 || /** @type {any} */ (e).status === 403, message: e instanceof Error ? e.message : "Ukendt fejl" });
    }
    setLoadingMore(false);
  }, [accessToken, loadingMore, searchIds, loadNames]);

  return { rows, names, loading, loadingMore, hasMore, loaded, error, load, loadMore };
}
