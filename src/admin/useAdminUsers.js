// @ts-check
// Brugeradministrationen: liste, søgning, faner og antal på serveren (public.users, kun administratorer, RLS), 50 ad gangen med nøgle-paginering.
// Hentning, gemning, rolleskift, sletning og eksport går gennem serverfunktioner (migration 20261016110000) eller edge-funktionen delete-user; panelet
// bestemmer aldrig selv rettigheder. En fejl er en egen tilstand, aldrig en tom liste, og en mislykket handling lader den gamle værdi stå.
import { useState, useRef, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { buildUsersQuery, USERS_PAGE, buildCsv, cleanSearch } from "./usersLogic.js";
import { downloadText } from "./csvExport.js";

/** Dansk fejltekst uden rå databasebesked. @param {any} e @param {string} fallback */
export function userErrorText(e, fallback) {
  let code = "";
  try { code = JSON.parse(e?.body || "{}").code || ""; } catch { /* ingen kode */ }
  if (e?.status === 401 || e?.status === 403 || code === "42501") return "Du har ikke rettighed til at udføre handlingen.";
  if (code === "40001") return "Brugeren er ændret, siden du åbnede den. Hent igen, før du gemmer.";
  if (code === "22023") return typeof e?.message === "string" && /begrundelse/i.test(e.message) ? "En begrundelse er påkrævet." : "Værdien er ugyldig.";
  if (code === "P0002") return "Brugeren findes ikke længere.";
  if (typeof e?.message === "string" && /din egen rolle|sidste administrator/i.test(e.message)) return e.message;
  return fallback;
}

export function useAdminUsers(/** @type {string} */ accessToken) {
  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [total, setTotal] = useState(/** @type {number | null} */ (null)); // matcher fanen og søgningen
  const [counts, setCounts] = useState(/** @type {{ all: number | null, admin: number | null, incomplete: number | null }} */ ({ all: null, admin: null, incomplete: null }));
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(/** @type {null | { denied: boolean, message: string }} */ (null));
  const filtersRef = useRef({ filter: "all", q: "" });
  const rowsRef = useRef(/** @type {any[]} */ ([]));
  const seq = useRef(0);
  const headers = useCallback(() => ({ ...makeHeaders(accessToken), Accept: "application/json" }), [accessToken]);
  const rpc = useCallback((/** @type {string} */ fn, /** @type {any} */ args) => apiCall(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: headers(), body: JSON.stringify(args) }), [headers]);

  /** Antal rækker for en fane og et søgeord (én forespørgsel uden rækker). */
  const countFor = useCallback(async (/** @type {string} */ filter, /** @type {string} */ q) => {
    let n = /** @type {number | null} */ (null);
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/users?${buildUsersQuery({ filter, q, limit: 1, select: "id" })}`, {
        headers: { ...headers(), Prefer: "count=exact" },
        onResponse: (res) => { const v = Number((res.headers.get("content-range") || "").split("/")[1]); n = Number.isFinite(v) ? v : null; },
      });
    } catch { n = null; }
    return n;
  }, [headers]);

  const load = useCallback(async (/** @type {any} */ filters) => {
    if (filters && typeof filters === "object" && !("nativeEvent" in filters)) filtersRef.current = { filter: filters.filter || "all", q: filters.q || "" };
    const { filter, q } = filtersRef.current;
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    countFor("all", q).then((n) => mine === seq.current && setCounts((c) => ({ ...c, all: n })));
    countFor("admin", q).then((n) => mine === seq.current && setCounts((c) => ({ ...c, admin: n })));
    countFor("incomplete", q).then((n) => mine === seq.current && setCounts((c) => ({ ...c, incomplete: n })));
    try {
      let count = /** @type {number | null} */ (null);
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/users?${buildUsersQuery({ filter, q })}`, {
        headers: { ...headers(), Prefer: "count=exact" },
        onResponse: (res) => { const v = Number((res.headers.get("content-range") || "").split("/")[1]); count = Number.isFinite(v) ? v : null; },
      });
      if (mine !== seq.current) return;
      const list = Array.isArray(data) ? data : [];
      rowsRef.current = list.slice(0, USERS_PAGE);
      setRows(rowsRef.current);
      setHasMore(list.length > USERS_PAGE);
      setTotal(count);
      setLoaded(true);
    } catch (e) {
      if (mine !== seq.current) return;
      const status = /** @type {any} */ (e).status;
      setError({ denied: status === 401 || status === 403, message: "Brugerne kunne ikke hentes." });
    }
    if (mine === seq.current) setLoading(false);
  }, [headers, countFor]);

  const loadMore = useCallback(async () => {
    const last = rowsRef.current[rowsRef.current.length - 1];
    if (!last || loadingMore) return;
    const mine = seq.current;
    setLoadingMore(true);
    try {
      const { filter, q } = filtersRef.current;
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/users?${buildUsersQuery({ filter, q, cursor: { created_at: last.created_at, id: last.id } })}`, { headers: headers() });
      if (mine !== seq.current) { setLoadingMore(false); return; }
      const list = Array.isArray(data) ? data : [];
      const seen = new Set(rowsRef.current.map((r) => r.id));
      rowsRef.current = [...rowsRef.current, ...list.slice(0, USERS_PAGE).filter((r) => !seen.has(r.id))];
      setRows(rowsRef.current);
      setHasMore(list.length > USERS_PAGE);
    } catch {
      if (mine === seq.current) setError({ denied: false, message: "Flere brugere kunne ikke hentes." });
    }
    setLoadingMore(false);
  }, [headers, loadingMore]);

  /** Lægger en opdateret bruger ind i listen (navn, rolle). */
  const patchRow = useCallback((/** @type {string} */ id, /** @type {Record<string, any>} */ patch) => {
    rowsRef.current = rowsRef.current.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setRows(rowsRef.current);
  }, []);

  /** @returns {Promise<{ ok: true, user: any } | { ok: false, error: string, denied: boolean }>} */
  const getUser = useCallback(async (/** @type {string} */ id, /** @type {boolean} */ withPreferences = false) => {
    try {
      const user = await rpc("admin_get_user", { p_user: id, p_with_preferences: withPreferences });
      return { ok: true, user };
    } catch (e) {
      return { ok: false, error: userErrorText(e, "Brugeren kunne ikke hentes."), denied: /** @type {any} */ (e)?.status === 403 };
    }
  }, [rpc]);

  /** @returns {Promise<{ ok: true, version: string, preferencesChanged: boolean } | { ok: false, error: string, conflict: boolean }>} */
  const saveProfile = useCallback(async (/** @type {string} */ id, /** @type {{ profile: Record<string, any>, allergens?: string[]|null, custom?: string[]|null, reason?: string, version?: string|null }} */ a) => {
    try {
      const res = await rpc("admin_save_user_profile", {
        p_user: id, p_profile: a.profile, p_allergens: a.allergens ?? null, p_custom: a.custom ?? null, p_reason: a.reason || null, p_version: a.version ?? null,
      });
      if (a.profile && "name" in a.profile) patchRow(id, { name: a.profile.name || null });
      return { ok: true, version: res?.version, preferencesChanged: !!res?.praeferencer_aendret };
    } catch (e) {
      let code = "";
      try { code = JSON.parse(/** @type {any} */ (e)?.body || "{}").code || ""; } catch { /* ingen */ }
      return { ok: false, error: userErrorText(e, "Ændringerne blev ikke gemt."), conflict: code === "40001" };
    }
  }, [rpc, patchRow]);

  /** @returns {Promise<{ ok: boolean, error?: string }>} */
  const setRole = useCallback(async (/** @type {string} */ id, /** @type {string} */ role) => {
    try {
      await rpc("admin_set_role", { p_user: id, p_role: role });
      patchRow(id, { role });
      load();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: userErrorText(e, "Rollen blev ikke ændret.") };
    }
  }, [rpc, patchRow, load]);

  const deleteSummary = useCallback(async (/** @type {string} */ id) => {
    try { return /** @type {{ ok: true, summary: any }} */ ({ ok: true, summary: await rpc("admin_user_delete_summary", { p_user: id }) }); }
    catch (e) { return /** @type {{ ok: false, error: string }} */ ({ ok: false, error: userErrorText(e, "Oversigten kunne ikke hentes.") }); }
  }, [rpc]);

  /** Sletter kontoen via edge-funktionen delete-user (serveren tjekker rettigheder og sletter i en fast rækkefølge). Påstår aldrig sletning ved fejl. */
  const deleteUser = useCallback(async (/** @type {string} */ id) => {
    try {
      const res = await apiCall(`${SUPABASE_URL}/functions/v1/delete-user`, { method: "POST", headers: headers(), body: JSON.stringify({ uid: id }) });
      if (res?.error) throw new Error(res.error);
      rowsRef.current = rowsRef.current.filter((r) => r.id !== id);
      setRows(rowsRef.current);
      load();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Kontoen blev ikke slettet. Prøv igen, eller se fejlene for en forklaring." + (e instanceof Error && /Kun admins|rettighed/i.test(e.message) ? " Du har ikke rettighed til sletning." : "") };
    }
  }, [headers, load]);

  /** Eksporterer ALLE brugere, der matcher fane og søgning (ikke kun de viste), som CSV og melder eksporten til adminloggen. */
  const exportUsers = useCallback(async () => {
    try {
      const { filter, q } = filtersRef.current;
      /** @type {any[]} */
      const all = [];
      let cursor = null;
      for (let i = 0; i < 200; i++) {
        const data = await apiCall(`${SUPABASE_URL}/rest/v1/users?${buildUsersQuery({ filter, q: cleanSearch(q), cursor, limit: 1000 })}`, { headers: headers() });
        const list = Array.isArray(data) ? data : [];
        all.push(...list);
        if (list.length < 1000) break;
        const last = list[list.length - 1];
        cursor = { created_at: last.created_at, id: last.id };
      }
      downloadText(`eatsafe-brugere-${new Date().toISOString().slice(0, 10)}.csv`, buildCsv(all));
      try { await rpc("log_admin_export", { p_target: "users", p_count: all.length }); } catch { /* eksporten er gennemført; loggen forsøges ved næste eksport */ }
      return { ok: true, count: all.length };
    } catch {
      return { ok: false, count: 0 };
    }
  }, [headers, rpc]);

  return { rows, total, counts, loading, loadingMore, hasMore, loaded, error, load, loadMore, getUser, saveProfile, setRole, deleteSummary, deleteUser, exportUsers };
}
