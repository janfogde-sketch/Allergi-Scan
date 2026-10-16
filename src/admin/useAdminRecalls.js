// @ts-check
// Henter tilbagekaldelser (public.recalls, kun læsbar for admin), kørselsloggen for den daglige hentning, og afgør dem via admin-RPC'erne. En fejl er aldrig en tom liste:
// den vises som synkroniserings-/forbindelsesfejl. Nye kolonner (original tekst, seneste læsning) hentes kun, hvis databaseopdateringen er udgivet.
import { useState, useEffect, useCallback, useRef } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { showToast } from "../SharedComponents.jsx";
import { eanVariants } from "../../supabase/functions/_shared/recallParser.js";

const BASE = "id,source_url,title,published_at,intro,affected,reason,action,eans,unverified_eans,status,created_at,updated_at";
const FULL = `${BASE},raw_text,source_checked_at,revision,cancelled_at,cancelled_by_url`;

const errKind = (/** @type {any} */ e) => (e?.status === 401 || e?.status === 403 ? "denied" : e?.status ? "server" : (typeof navigator !== "undefined" && navigator.onLine === false) || /fetch|network|load failed/i.test(String(e?.message)) ? "offline" : "server");

export function useAdminRecalls(/** @type {string | null} */ accessToken, /** @type {(id: string|null|undefined) => string} */ nameOf = () => "Administrator") {
  const [recalls, setRecalls] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(/** @type {null | "offline" | "denied" | "server"} */ (null));
  const [syncRuns, setSyncRuns] = useState(/** @type {any[] | null} */ (null));
  const full = useRef(true);

  const headers = useCallback(() => ({ ...makeHeaders(accessToken), Accept: "application/json" }), [accessToken]);
  const get = useCallback((/** @type {string} */ path, /** @type {any} */ opts) => apiCall(`${SUPABASE_URL}/rest/v1/${path}`, { headers: headers(), ...opts }), [headers]);

  const loadSync = useCallback(async () => {
    try { const r = await get("import_runs?job=eq.recalls_sync&order=started_at.desc&limit=10&select=id,status,started_at,finished_at,error_code,counts,log"); setSyncRuns(Array.isArray(r) ? r : []); }
    catch { setSyncRuns(null); }
  }, [get]);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!accessToken) return;
    if (!quiet) setLoading(true);
    try {
      let data;
      try { data = await get(`recalls?select=${full.current ? FULL : BASE}&order=published_at.desc.nullslast&limit=300`); }
      catch (e) {
        // Før databaseopdateringen er udgivet findes de nye kolonner ikke: læs de gamle felter i stedet for at vise en fejl
        if (full.current && /** @type {any} */ (e)?.status === 400) { full.current = false; data = await get(`recalls?select=${BASE}&order=published_at.desc.nullslast&limit=300`); } else throw e;
      }
      setRecalls(Array.isArray(data) ? data : []);
      setError(null);
      setLoaded(true);
    } catch (e) {
      setError(errKind(e));
      if (!quiet) showToast("Kunne ikke hente tilbagekaldelser", "error");
    }
    if (!quiet) setLoading(false);
    loadSync();
  }, [accessToken, get, loadSync]);

  // Første indlæsning ved login, så tælleren i menuen er rigtig
  useEffect(() => { if (accessToken) load({ quiet: true }); }, [accessToken, load]);

  const searchProducts = useCallback(async (/** @type {string} */ query) => {
    const q = String(query ?? "").trim();
    if (!q) return [];
    const enc = encodeURIComponent(q.replace(/[,()*:\\"%]/g, " "));
    const digits = q.replace(/\D/g, "");
    const eanPart = digits.length >= 6 ? `,ean.in.(${eanVariants(digits).join(",")})` : "";
    try {
      const data = await get(`products?or=(name.ilike.*${enc}*,brand.ilike.*${enc}*${eanPart})&select=id,ean,name,brand&order=name.asc&limit=15`);
      return Array.isArray(data) ? data : [];
    } catch { showToast("Kunne ikke søge produkter", "error"); return []; }
  }, [get]);

  const affectedCount = useCallback(async (/** @type {string[]} */ eans) => {
    if (!eans?.length) return 0;
    try {
      const n = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_recall_affected_count`, { method: "POST", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify({ p_eans: eans }) });
      return typeof n === "number" ? n : null;
    } catch { return null; }
  }, [headers]);

  /** Produkter i EatSafe for en liste skrivemåder; ok=false ved fejl (aldrig "ingen produkter"). */
  const findProducts = useCallback(async (/** @type {string[]} */ codes) => {
    if (!codes.length) return { ok: true, byEan: {} };
    try {
      const rows = await get(`products?ean=in.(${codes.join(",")})&select=id,ean,name,brand&limit=200`);
      return { ok: true, byEan: Object.fromEntries((Array.isArray(rows) ? rows : []).map((p) => [p.ean, p])) };
    } catch { return { ok: false, byEan: {} }; }
  }, [get]);

  /** Historik, matchafgørelser og varslingstal for én tilbagekaldelse. */
  const loadDetail = useCallback(async (/** @type {string} */ id) => {
    const rpc = (/** @type {string} */ fn, /** @type {any} */ body) => apiCall(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const [ev, mt, st] = await Promise.allSettled([get(`recall_events?recall_id=eq.${id}&order=created_at.desc&limit=50`), get(`recall_matches?recall_id=eq.${id}`), rpc("admin_recall_notification_stats", { p_recall: id })]);
    const unavailable = (/** @type {any} */ r) => r.status === "rejected" && (r.reason?.status === 404 || /42P01|PGRST20[25]|does not exist/i.test(String(r.reason?.body || r.reason?.message)));
    return {
      events: ev.status === "fulfilled" && Array.isArray(ev.value) ? ev.value : [],
      matches: mt.status === "fulfilled" && Array.isArray(mt.value) ? mt.value : [],
      stats: st.status === "fulfilled" ? st.value : null,
      eventsOk: ev.status === "fulfilled", statsOk: st.status === "fulfilled",
      newTables: !(unavailable(ev) || unavailable(mt)),
    };
  }, [get, headers]);

  const setMatch = useCallback(async (/** @type {string} */ id, /** @type {string} */ ean, /** @type {string} */ level, /** @type {string} */ basis) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_set_recall_match`, { method: "POST", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify({ p_recall: id, p_ean: ean, p_level: level, p_basis: basis }) });
      return { ok: true };
    } catch { return { ok: false, error: "Afgørelsen kunne ikke gemmes. Prøv igen." }; }
  }, [headers]);

  // action: "link" | "archive" | "cancel". Returnerer true ved succes.
  const resolve = useCallback(async (/** @type {string} */ id, /** @type {string} */ action, /** @type {string[]} */ eans = [], /** @type {string|null} */ note = null) => {
    try {
      const res = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_resolve_recall`, {
        method: "POST", headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ p_recall_id: id, p_action: action, p_eans: eans, ...(note ? { p_note: note } : {}) }),
      });
      setRecalls((prev) => prev.map((r) => (r.id === id ? { ...r, status: res?.status || r.status, eans: res?.eans || r.eans } : r)));
      showToast(action === "link" ? "Besked til de berørte brugere er lagt i kø" : action === "archive" ? "Arkiveret uden besked" : "Annulleret");
      return true;
    } catch (e) {
      showToast("Kunne ikke gemme: " + /** @type {any} */ (e).message, "error");
      return false;
    }
  }, [headers]);

  return { recalls, loading, loaded, error, syncRuns, load, loadSync, searchProducts, affectedCount, findProducts, loadDetail, setMatch, resolve, nameOf };
}
