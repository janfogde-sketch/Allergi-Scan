// @ts-check
// Familieadministrationen: oversigt, detaljer og invitationer hentes gennem serverfunktioner (migration 20261016130000, kun administratorer). Tilbagekaldelse
// og fjernelse kræver en begrundelse og logges af databasen. En fejl er en egen tilstand, aldrig en tom liste; findes funktionerne ikke endnu, er unavailable sand.
import { useState, useRef, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";

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

export function useAdminFamily(/** @type {string} */ accessToken) {
  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [total, setTotal] = useState(/** @type {number | null} */ (null));
  const [invites, setInvites] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(/** @type {null | { denied: boolean, unavailable: boolean }} */ (null));
  const filtersRef = useRef({ q: "" });
  const seq = useRef(0);
  const rpc = useCallback((/** @type {string} */ fn, /** @type {any} */ args) => apiCall(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST", headers: { ...makeHeaders(accessToken), "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(args),
  }), [accessToken]);

  const load = useCallback(async (/** @type {any} */ filters) => {
    if (filters && typeof filters === "object" && !("nativeEvent" in filters)) filtersRef.current = { q: filters.q || "" };
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const [ov, inv] = await Promise.all([
        rpc("admin_family_overview", { p_q: filtersRef.current.q, p_limit: FAMILY_PAGE, p_offset: 0 }),
        rpc("admin_list_family_invites", { p_status: null, p_limit: 200 }),
      ]);
      if (mine !== seq.current) return;
      setRows(Array.isArray(ov?.rows) ? ov.rows : []);
      setTotal(Number.isFinite(Number(ov?.total)) ? Number(ov.total) : null);
      setInvites(Array.isArray(inv) ? inv : []);
      setLoaded(true);
    } catch (e) {
      if (mine !== seq.current) return;
      const status = /** @type {any} */ (e).status;
      setError({ denied: status === 401 || status === 403, unavailable: status === 404 });
    }
    if (mine === seq.current) setLoading(false);
  }, [rpc]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const ov = await rpc("admin_family_overview", { p_q: filtersRef.current.q, p_limit: FAMILY_PAGE, p_offset: rows.length });
      setRows((r) => [...r, ...(Array.isArray(ov?.rows) ? ov.rows : [])]);
    } catch (e) {
      setError({ denied: /** @type {any} */ (e).status === 403, unavailable: false });
    }
    setLoadingMore(false);
  }, [rpc, rows.length]);

  const getFamily = useCallback(async (/** @type {string} */ ownerId) => {
    try { return { ok: true, data: await rpc("admin_family_detail", { p_owner: ownerId }) }; }
    catch (e) { return { ok: false, error: familyErrorText(e, "Familien kunne ikke hentes.") }; }
  }, [rpc]);

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

  return { rows, total, invites, loading, loadingMore, loaded, error, load, loadMore, getFamily, revokeInvite, removeMember };
}
