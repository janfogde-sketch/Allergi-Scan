// @ts-check
// Ukendte stregkoder: liste, tællere, statusændring, tjek af eksisterende produkt og oprettelse. Læsning og statusændring går gennem administratorfunktioner i databasen
// (tabellen har ingen direkte læseadgang). En fejl er aldrig en tom liste, og manglende databasefunktioner (før udgivelse) vises som "ikke tilgængelig".
import { useState, useRef, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { missingParams, MISSING_PAGE } from "./missingLogic.js";

const unavailable = (/** @type {any} */ e) => e?.status === 404 || /PGRST202|42883|does not exist/i.test(String(e?.body || e?.message || ""));

export function useAdminMissing(/** @type {string | null} */ accessToken) {
  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [total, setTotal] = useState(/** @type {number | null} */ (null));
  const [summary, setSummary] = useState(/** @type {any} */ (null));
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(/** @type {null | { unavailable: boolean }} */ (null));
  const filters = useRef({ q: "", status: "", days: "", sort: "count" });
  const seq = useRef(0);
  const headers = useCallback(() => ({ ...makeHeaders(accessToken), "Content-Type": "application/json", Accept: "application/json" }), [accessToken]);
  const rpc = useCallback((/** @type {string} */ name, /** @type {any} */ body) => apiCall(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: "POST", headers: headers(), body: JSON.stringify(body || {}) }), [headers]);

  const loadSummary = useCallback(async () => {
    try { const r = await rpc("admin_missing_ean_summary"); setSummary(Array.isArray(r) ? r[0] : r); } catch { setSummary(null); }
  }, [rpc]);

  const load = useCallback(async (/** @type {any} */ next, /** @type {boolean} */ append = false) => {
    if (next && typeof next === "object" && !("nativeEvent" in next)) filters.current = { ...filters.current, ...next };
    const mine = ++seq.current;
    if (append) setLoadingMore(true); else { setLoading(true); setError(null); }
    try {
      const data = await rpc("admin_missing_eans", missingParams(filters.current, append ? rows.length : 0));
      if (mine !== seq.current) return;
      const list = Array.isArray(data) ? data : [];
      setRows(append ? (prev) => [...prev, ...list.slice(0, MISSING_PAGE).filter((r) => !prev.some((x) => x.ean === r.ean))] : list.slice(0, MISSING_PAGE));
      setHasMore(list.length > MISSING_PAGE);
      setTotal(list.length ? Number(list[0].total_count) : (append ? total : 0));
      if (!append) loadSummary();
    } catch (e) {
      if (mine !== seq.current) return;
      setError({ unavailable: unavailable(e) });
    }
    if (mine === seq.current) { setLoading(false); setLoadingMore(false); }
  }, [rpc, rows.length, total, loadSummary]);

  const setStatus = useCallback(async (/** @type {string} */ ean, /** @type {string} */ status) => {
    try {
      await rpc("admin_set_missing_ean_status", { p_ean: ean, p_status: status });
      setRows((rs) => rs.map((r) => (r.ean === ean && r.status !== "created" ? { ...r, status } : r)));
      loadSummary();
      return { ok: true };
    } catch { return { ok: false, error: "Status kunne ikke ændres. Prøv igen." }; }
  }, [rpc, loadSummary]);

  /** Findes produktet allerede? Returnerer {ok, product|null}; en fejl er aldrig "findes ikke". */
  const findProduct = useCallback(async (/** @type {string} */ ean) => {
    try {
      const r = await apiCall(`${SUPABASE_URL}/rest/v1/products?ean=eq.${encodeURIComponent(ean)}&select=id,name,brand&limit=1`, { headers: headers() });
      return { ok: true, product: Array.isArray(r) && r[0] ? r[0] : null };
    } catch { return { ok: false, product: null }; }
  }, [headers]);

  /** Opretter et ikke-verificeret produkt uden allergenoplysninger (alt er "Ukendt", til de er gennemgået). */
  const createProduct = useCallback(async (/** @type {{ ean: string, name: string, brand?: string, category?: string }} */ v) => {
    try {
      const r = await apiCall(`${SUPABASE_URL}/functions/v1/products`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ ean: v.ean, name: v.name.trim(), brand: v.brand?.trim() || null, category: v.category || null, source: "katalog" }),
      });
      load({});
      return { ok: true, product: r?.product };
    } catch (e) {
      const msg = String(/** @type {any} */ (e)?.body || /** @type {any} */ (e)?.message || "");
      if (/23505|duplicate|unique/i.test(msg)) return { ok: false, duplicate: true, error: "Produktet findes allerede." };
      return { ok: false, error: "Produktet blev ikke oprettet. Prøv igen." };
    }
  }, [headers, load]);

  return { rows, total, summary, loading, loadingMore, hasMore, error, load, setStatus, findProduct, createProduct };
}
