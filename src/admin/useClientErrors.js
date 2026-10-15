// @ts-check
// Henter og opdaterer fejlgrupper i public.client_errors (fejl fra appen og edge functions). Kun admins kan læse tabellen (RLS).
// Søgning og filtre kører på serveren på tværs af hele historikken, 50 rækker ad gangen (nøgle-paginering). En fejl er en egen tilstand
// (error), aldrig en tom liste, og en mislykket statusændring lader den gamle status stå. Bruger-id hentes bevidst ikke.
// Siden virker også, før migrationen 20261015170000 er live (dev deler produktionens database): udvidede kolonner og tælle-RPC'en falder
// tilbage til de gamle.
import { useState, useRef, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { buildErrorsQuery, SELECT_BASE } from "./errorsLogic.js";

export const ERRORS_PAGE = 50;
/** @param {any} e */
const isDenied = (e) => e && (e.status === 401 || e.status === 403);
/** @param {any} e */
const message = (e) => (e instanceof Error ? e.message : "Ukendt fejl");
/** Mangler en kolonne (migrationen er ikke live endnu), svarer PostgREST med 400. @param {any} e */
const isMissingColumn = (e) => e && e.status === 400;

export function useClientErrors(/** @type {string} */ accessToken) {
  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(/** @type {null | { denied: boolean, message: string }} */ (null));
  const [stats, setStats] = useState(/** @type {null | Record<string, number>} */ (null));
  const [options, setOptions] = useState(/** @type {any[]} */ ([]));
  const [extended, setExtended] = useState(true); // false, når databasen endnu ikke har de nye kolonner
  const filtersRef = useRef(/** @type {Record<string, any>} */ ({ status: "open" }));
  const rowsRef = useRef(/** @type {any[]} */ ([]));
  const extendedRef = useRef(true);
  const seq = useRef(0); // et nyere kald gør et ældre svar ugyldigt
  const headers = useCallback(() => makeHeaders(accessToken), [accessToken]);

  const fetchPage = useCallback(async (/** @type {any} */ filters, /** @type {any} */ cursor) => {
    const run = (/** @type {boolean} */ ext) => apiCall(
      `${SUPABASE_URL}/rest/v1/client_errors?${buildErrorsQuery({ ...filters, cursor, limit: ERRORS_PAGE + 1, ...(ext ? {} : { select: SELECT_BASE }) })}`,
      { headers: headers() }
    );
    const ext = extendedRef.current;
    try {
      return await run(ext);
    } catch (e) {
      // Filtre på nye kolonner kan ikke falde tilbage; kun selve udvalget kan
      if (!ext || !isMissingColumn(e) || filters.severity || filters.version) throw e;
      extendedRef.current = false;
      setExtended(false);
      return run(false);
    }
  }, [headers]);

  /** Tal til fanerne og statistikken: hele historikken, aldrig kun den hentede side. */
  const loadStats = useCallback(async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_error_stats`, { method: "POST", headers: headers(), body: "{}" });
      if (data && typeof data === "object") { setStats(/** @type {any} */ (data)); return; }
    } catch (e) {
      if (isDenied(e)) return;
    }
    try { // RPC'en findes ikke endnu: tæl rækkerne i stedet
      const count = async (/** @type {string} */ status) => {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/client_errors?select=id${status ? `&status=eq.${status}` : ""}&limit=1`, { headers: { ...headers(), Prefer: "count=exact" } });
        const range = res.headers.get("content-range") || "";
        return res.ok ? Number(range.split("/")[1]) || 0 : NaN;
      };
      const [open, resolved, ignored, total] = await Promise.all([count("open"), count("resolved"), count("ignored"), count("")]);
      if ([open, resolved, ignored, total].some(Number.isNaN)) return;
      setStats({ open, resolved, ignored, total, occurrences: 0, new_groups_7d: 0, reopened: 0, fallback: 1 });
    } catch { /* tallene er pynt; listen fejler selv, hvis forbindelsen er væk */ }
  }, [headers]);

  /** Valgmuligheder til filtre ud fra de seneste 1000 grupper. */
  const loadOptions = useCallback(async () => {
    const q = (/** @type {string} */ cols) => apiCall(`${SUPABASE_URL}/rest/v1/client_errors?select=${cols}&order=last_seen.desc&limit=1000`, { headers: headers() });
    try {
      setOptions(await q("screen,app_version,app_versions,severity"));
    } catch {
      try { setOptions(await q("screen,app_version")); } catch { /* filtrene viser blot færre valg */ }
    }
  }, [headers]);

  /** Henter første side med de givne filtre (eller de sidst brugte) samt tal og valgmuligheder. */
  const load = useCallback(async (/** @type {any} */ filters) => {
    if (filters && typeof filters === "object" && !("nativeEvent" in filters)) filtersRef.current = filters;
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    loadStats();
    loadOptions();
    try {
      const data = await fetchPage(filtersRef.current, null);
      if (mine !== seq.current) return;
      const list = Array.isArray(data) ? data : [];
      const page = list.slice(0, ERRORS_PAGE);
      rowsRef.current = page;
      setRows(page);
      setHasMore(list.length > ERRORS_PAGE);
      setLoaded(true);
    } catch (e) {
      if (mine !== seq.current) return;
      setError({ denied: isDenied(e), message: message(e) });
    }
    if (mine === seq.current) setLoading(false);
  }, [fetchPage, loadStats, loadOptions]);

  /** Henter de næste 50 ældre grupper. Rækker, der allerede vises, tilføjes ikke igen. */
  const loadMore = useCallback(async () => {
    const last = rowsRef.current[rowsRef.current.length - 1];
    if (!last || loadingMore) return;
    const mine = seq.current;
    setLoadingMore(true);
    try {
      const data = await fetchPage(filtersRef.current, { last_seen: last.last_seen, id: last.id });
      if (mine !== seq.current) { setLoadingMore(false); return; }
      const list = Array.isArray(data) ? data : [];
      const seen = new Set(rowsRef.current.map((r) => r.id));
      rowsRef.current = [...rowsRef.current, ...list.slice(0, ERRORS_PAGE).filter((r) => !seen.has(r.id))];
      setRows(rowsRef.current);
      setHasMore(list.length > ERRORS_PAGE);
    } catch (e) {
      if (mine === seq.current) setError({ denied: isDenied(e), message: message(e) });
    }
    setLoadingMore(false);
  }, [fetchPage, loadingMore]);

  /** Lægger en opdateret gruppe ind i listen; forlader den den viste fane, fjernes den. */
  const applyRow = useCallback((/** @type {any} */ row) => {
    const status = filtersRef.current.status;
    rowsRef.current = rowsRef.current
      .map((r) => (r.id === row.id ? { ...r, ...row } : r))
      .filter((r) => !status || status === "all" || r.status === status);
    setRows(rowsRef.current);
  }, []);

  /** Skriver en ændring og bruger databasens svar. Ved fejl står den gamle status urørt. Returnerer den opdaterede gruppe eller null. */
  const patch = useCallback(async (/** @type {string} */ id, /** @type {Record<string, any>} */ body) => {
    const res = await apiCall(`${SUPABASE_URL}/rest/v1/client_errors?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers(), Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    const row = Array.isArray(res) ? res[0] : null;
    if (!row) throw new Error("Ændringen blev ikke gemt (ingen adgang eller fejlen findes ikke længere).");
    return row;
  }, [headers]);

  /** @returns {Promise<{ ok: boolean, row?: any, error?: string, reasonDropped?: boolean }>} */
  const setStatus = useCallback(async (/** @type {string} */ id, /** @type {string} */ status, /** @type {string} */ reason = "") => {
    try {
      let reasonDropped = false;
      let row;
      try {
        row = await patch(id, { status, ...(status === "ignored" ? { status_reason: reason } : {}) });
      } catch (e) {
        // Før migrationen er live findes status_reason ikke; status ændres, men begrundelsen kan ikke gemmes
        if (!isMissingColumn(e) || status !== "ignored") throw e;
        row = await patch(id, { status });
        reasonDropped = true;
      }
      applyRow(row);
      loadStats();
      return { ok: true, row, reasonDropped };
    } catch (e) {
      return { ok: false, error: message(e) };
    }
  }, [patch, applyRow, loadStats]);

  /** @param {string} severity "" fjerner alvorligheden */
  const setSeverity = useCallback(async (/** @type {string} */ id, /** @type {string} */ severity) => {
    try {
      const row = await patch(id, { severity: severity || null });
      applyRow(row);
      return { ok: true, row };
    } catch (e) {
      return { ok: false, error: message(e) };
    }
  }, [patch, applyRow]);

  /** Statushistorik for én gruppe fra adminloggen (hvem, hvornår, fra og til). Returnerer { items, users } eller null ved fejl. */
  const loadHistory = useCallback(async (/** @type {string} */ id) => {
    try {
      const items = await apiCall(
        `${SUPABASE_URL}/rest/v1/admin_audit_log?target_table=eq.client_errors&target_id=eq.${id}&select=id,created_at,action,admin_id,details&order=created_at.desc&limit=50`,
        { headers: headers() }
      );
      const list = Array.isArray(items) ? items : [];
      const ids = [...new Set(list.map((h) => h.admin_id).filter(Boolean))];
      /** @type {Record<string, any>} */
      let users = {};
      if (ids.length) {
        const found = await apiCall(`${SUPABASE_URL}/rest/v1/users?id=in.(${ids.join(",")})&select=id,name,email`, { headers: headers() }).catch(() => []);
        users = Object.fromEntries((Array.isArray(found) ? found : []).map((u) => [u.id, u]));
      }
      return { items: list, users };
    } catch {
      return null;
    }
  }, [headers]);

  return { rows, loading, loadingMore, hasMore, loaded, error, stats, options, extended, load, loadMore, setStatus, setSeverity, loadHistory };
}
