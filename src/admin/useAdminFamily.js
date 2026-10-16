// @ts-check
// Familieadministrationen: oversigt, detaljer og invitationer. Primær kilde er serverfunktionerne fra migration 20261016130000 (kun administratorer).
// Findes de ikke endnu (404), læses de samme oplysninger direkte fra tabellerne (administratorer må læse dem; ingen allergier hentes), og handlinger er slået fra,
// til databaseopdateringen er udgivet. Familier og invitationer hentes uafhængigt: en fejl i den ene skjuler ikke den anden, og et antal vises kun, når det er bekræftet.
import { useState, useRef, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { buildFromTables, filterOwners } from "./familyLogic.js";

export const FAMILY_PAGE = 50;

/** Dansk fejltekst uden rå databasebesked. @param {any} e @param {string} fallback */
export function familyErrorText(e, fallback) {
  let code = "";
  let msg = "";
  try { const b = JSON.parse(e?.body || "{}"); code = b.code || ""; msg = b.message || ""; } catch { /* ingen kode */ }
  if (e?.status === 401 || e?.status === 403 || code === "42501") return "Du har ikke rettighed til at udføre handlingen.";
  if (code === "P0002") return "Posten findes ikke længere. Hent listen igen.";
  if (code === "22023") {
    if (/begrundelse/i.test(msg)) return "En begrundelse er påkrævet.";
    if (/forespørgsler/i.test(msg)) return "Forespørgsler om forbindelse kan ikke tilbagekaldes af administratorer.";
    if (/ventende/i.test(msg)) return "Kun ventende invitationer kan tilbagekaldes.";
  }
  return fallback;
}

/** @typedef {"idle"|"loading"|"ok"|"error"} Phase */
/** @typedef {null | { denied: boolean, unavailable: boolean }} Err */

const errOf = (/** @type {any} */ e) => ({ denied: e?.status === 401 || e?.status === 403, unavailable: e?.status === 404 });

export function useAdminFamily(/** @type {string} */ accessToken) {
  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [total, setTotal] = useState(/** @type {number | null} */ (null));
  const [invites, setInvites] = useState(/** @type {any[]} */ ([]));
  const [famPhase, setFamPhase] = useState(/** @type {Phase} */ ("idle"));
  const [invPhase, setInvPhase] = useState(/** @type {Phase} */ ("idle"));
  const [famError, setFamError] = useState(/** @type {Err} */ (null));
  const [invError, setInvError] = useState(/** @type {Err} */ (null));
  const [mode, setMode] = useState(/** @type {"rpc"|"legacy"|null} */ (null)); // legacy: databasefunktionerne er ikke udgivet endnu
  const [loadingMore, setLoadingMore] = useState(false);
  const filtersRef = useRef({ q: "" });
  const tablesRef = useRef(/** @type {null | ReturnType<typeof buildFromTables>} */ (null));
  const seq = useRef(0);
  const headers = useCallback(() => ({ ...makeHeaders(accessToken), "Content-Type": "application/json", Accept: "application/json" }), [accessToken]);
  const rpc = useCallback((/** @type {string} */ fn, /** @type {any} */ args) => apiCall(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: headers(), body: JSON.stringify(args) }), [headers]);
  const rest = useCallback((/** @type {string} */ path) => apiCall(`${SUPABASE_URL}/rest/v1/${path}`, { headers: headers() }), [headers]);

  /** Den midlertidige læsning direkte fra tabellerne. */
  const loadLegacy = useCallback(async (/** @type {number} */ mine) => {
    const [mRes, iRes] = await Promise.allSettled([
      rest("family_members?select=id,name,user_id,family_owner_id,birth_year,created_at&order=created_at.desc&limit=1000"),
      rest("family_invites?select=id,status,created_at,expires_at,accepted_at,invited_by,accepted_by,requested_by&order=created_at.desc&limit=1000"),
    ]);
    if (mine !== seq.current) return;
    const members = mRes.status === "fulfilled" && Array.isArray(mRes.value) ? mRes.value : null;
    const inv = iRes.status === "fulfilled" && Array.isArray(iRes.value) ? iRes.value : null;
    const ids = [...new Set([...(members || []).flatMap((m) => [m.family_owner_id, m.user_id]), ...(inv || []).flatMap((i) => [i.invited_by, i.accepted_by])].filter(Boolean))];
    let users = /** @type {any[]} */ ([]);
    if (ids.length) { try { const u = await rest(`users?id=in.(${ids.join(",")})&select=id,name,email`); users = Array.isArray(u) ? u : []; } catch { users = []; } }
    if (mine !== seq.current) return;
    const built = buildFromTables(members || [], inv || [], users);
    tablesRef.current = built;
    setMode("legacy");
    if (members) { setFamError(null); setFamPhase("ok"); const f = filterOwners(built.rows, filtersRef.current.q); setRows(f); setTotal(f.length); }
    else { setFamPhase("error"); setFamError(errOf(mRes.status === "rejected" ? mRes.reason : null)); }
    if (inv) { setInvError(null); setInvPhase("ok"); setInvites(built.invites); }
    else { setInvPhase("error"); setInvError(errOf(iRes.status === "rejected" ? iRes.reason : null)); }
  }, [rest]);

  const load = useCallback(async (/** @type {any} */ filters) => {
    if (filters && typeof filters === "object" && !("nativeEvent" in filters)) filtersRef.current = { q: filters.q || "" };
    const mine = ++seq.current;
    setFamPhase((p) => (p === "ok" ? p : "loading"));
    setInvPhase((p) => (p === "ok" ? p : "loading"));
    const [ov, inv] = await Promise.allSettled([
      rpc("admin_family_overview", { p_q: filtersRef.current.q, p_limit: FAMILY_PAGE, p_offset: 0 }),
      rpc("admin_list_family_invites", { p_status: null, p_limit: 200 }),
    ]);
    if (mine !== seq.current) return;
    // Begge funktioner mangler (404): databaseopdateringen er ikke udgivet, så læs tabellerne i stedet
    if (ov.status === "rejected" && /** @type {any} */ (ov.reason)?.status === 404 && inv.status === "rejected" && /** @type {any} */ (inv.reason)?.status === 404) { await loadLegacy(mine); return; }
    setMode("rpc");
    if (ov.status === "fulfilled") { setRows(Array.isArray(ov.value?.rows) ? ov.value.rows : []); setTotal(Number.isFinite(Number(ov.value?.total)) ? Number(ov.value.total) : null); setFamError(null); setFamPhase("ok"); }
    else { setFamError(errOf(ov.reason)); setFamPhase("error"); }
    if (inv.status === "fulfilled") { setInvites(Array.isArray(inv.value) ? inv.value : []); setInvError(null); setInvPhase("ok"); }
    else { setInvError(errOf(inv.reason)); setInvPhase("error"); }
  }, [rpc, loadLegacy]);

  const loadMore = useCallback(async () => {
    if (mode !== "rpc") return;
    setLoadingMore(true);
    try {
      const ov = await rpc("admin_family_overview", { p_q: filtersRef.current.q, p_limit: FAMILY_PAGE, p_offset: rows.length });
      setRows((r) => [...r, ...(Array.isArray(ov?.rows) ? ov.rows : [])]);
    } catch (e) { setFamError(errOf(e)); }
    setLoadingMore(false);
  }, [rpc, rows.length, mode]);

  const getFamily = useCallback(async (/** @type {string} */ ownerId) => {
    if (mode === "legacy" && tablesRef.current) return { ok: true, data: tablesRef.current.detail(ownerId) };
    try { return { ok: true, data: await rpc("admin_family_detail", { p_owner: ownerId }) }; }
    catch (e) { return { ok: false, error: familyErrorText(e, "Familien kunne ikke hentes.") }; }
  }, [rpc, mode]);

  const revokeInvite = useCallback(async (/** @type {string} */ id, /** @type {string} */ reason) => {
    try {
      await rpc("admin_revoke_family_invite", { p_id: id, p_reason: reason });
      setInvites((l) => l.map((i) => (i.id === id ? { ...i, status: "revoked" } : i)));
      return { ok: true };
    } catch (e) { return { ok: false, error: familyErrorText(e, "Invitationen kunne ikke tilbagekaldes.") }; }
  }, [rpc]);

  const removeMember = useCallback(async (/** @type {string} */ id, /** @type {string} */ reason) => {
    try {
      await rpc("admin_remove_family_member", { p_id: id, p_reason: reason });
      return { ok: true };
    } catch (e) { return { ok: false, error: familyErrorText(e, "Medlemmet kunne ikke fjernes.") }; }
  }, [rpc]);

  return { rows, total, invites, famPhase, invPhase, famError, invError, mode, canAct: mode === "rpc", loadingMore, load, loadMore, getFamily, revokeInvite, removeMember };
}
