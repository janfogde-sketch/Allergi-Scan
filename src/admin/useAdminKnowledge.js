// @ts-check
// Leksikonadministrationen (knowledge_base): liste med søgning, kategori, filtre og sortering på serveren, opslag, gemning, sletning og historik.
// Tabellen er offentlig læsbar og kan kun ændres af administratorer (RLS). Redaktionelle felter (migration 20261016190000) bruges kun, når kolonnerne findes;
// før da virker alt som hidtil. En fejl er aldrig en tom liste, og gemning sender kun, hvad formularen ejer (tips og risikoniveau røres ikke).
import { useState, useRef, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { buildKnowledgeQuery, KB_PAGE, KB_TEXT_FIELDS } from "./knowledgeLogic.js";

export function useAdminKnowledge(/** @type {string} */ accessToken) {
  const [entries, setEntries] = useState(/** @type {any[]} */ ([]));
  const [total, setTotal] = useState(/** @type {number | null} */ (null));
  const [counts, setCounts] = useState(/** @type {Record<string, number> | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(/** @type {null | { denied: boolean }} */ (null));
  const [hasEditorial, setHasEditorial] = useState(false);
  const filtersRef = useRef({ q: "", category: "", missing: "", editorial: "", sort: "manual" });
  const editorialRef = useRef(false);
  const seq = useRef(0);
  const headers = useCallback(() => ({ ...makeHeaders(accessToken), Accept: "application/json" }), [accessToken]);
  const get = useCallback((/** @type {string} */ path, /** @type {any} */ opts) => apiCall(`${SUPABASE_URL}/rest/v1/${path}`, { headers: headers(), ...opts }), [headers]);

  /** Findes de redaktionelle kolonner? (migrationen er ikke udgivet, før de gør) */
  const probeEditorial = useCallback(async () => {
    try { await get("knowledge_base?select=editorial_status,published&limit=1"); editorialRef.current = true; setHasEditorial(true); }
    catch { editorialRef.current = false; setHasEditorial(false); }
  }, [get]);

  const loadCounts = useCallback(async () => {
    try {
      const rows = await get("knowledge_base?select=category&limit=5000");
      /** @type {Record<string, number>} */ const c = {};
      for (const r of Array.isArray(rows) ? rows : []) c[r.category] = (c[r.category] || 0) + 1;
      setCounts(c);
    } catch { setCounts(null); }
  }, [get]);

  const load = useCallback(async (/** @type {any} */ filters, /** @type {boolean} */ append = false) => {
    if (filters && typeof filters === "object" && !("nativeEvent" in filters)) filtersRef.current = { ...filtersRef.current, ...filters };
    const mine = ++seq.current;
    if (append) setLoadingMore(true); else { setLoading(true); setError(null); }
    try {
      if (!loaded && !editorialRef.current) await probeEditorial();
      let count = /** @type {number | null} */ (null);
      const offset = append ? entries.length : 0;
      const data = await get(`knowledge_base?${buildKnowledgeQuery({ ...filtersRef.current, offset, withEditorial: editorialRef.current })}`, {
        headers: { ...headers(), Prefer: "count=exact" },
        onResponse: (/** @type {Response} */ res) => { const v = Number((res.headers.get("content-range") || "").split("/")[1]); count = Number.isFinite(v) ? v : null; },
      });
      if (mine !== seq.current) return;
      const list = Array.isArray(data) ? data : [];
      const page = list.slice(0, KB_PAGE);
      setEntries(append ? (prev) => [...prev, ...page.filter((r) => !prev.some((x) => x.id === r.id))] : page);
      setHasMore(list.length > KB_PAGE);
      setTotal(count);
      setLoaded(true);
      if (!append && counts === null) loadCounts();
    } catch (e) {
      if (mine !== seq.current) return;
      setError({ denied: /** @type {any} */ (e)?.status === 401 || /** @type {any} */ (e)?.status === 403 });
    }
    if (mine === seq.current) { setLoading(false); setLoadingMore(false); }
  }, [get, headers, loaded, entries.length, counts, probeEditorial, loadCounts]);

  const getEntry = useCallback(async (/** @type {string} */ id) => {
    try {
      const rows = await get(`knowledge_base?id=eq.${encodeURIComponent(id)}&select=*`);
      const full = Array.isArray(rows) ? rows[0] : null;
      if (!full) return { ok: false, notFound: true };
      let reviewer = /** @type {string | null} */ (null);
      if (full.reviewed_by) { try { const u = await get(`users?id=eq.${full.reviewed_by}&select=name,email`); reviewer = u?.[0]?.name || u?.[0]?.email || null; } catch { reviewer = null; } }
      return { ok: true, entry: full, reviewer };
    } catch (e) { return { ok: false, denied: /** @type {any} */ (e)?.status === 403 }; }
  }, [get]);

  /** @param {string|null} id @param {any} form @param {string|null} loadedAt opslagets updated_at ved åbning */
  const saveEntry = useCallback(async (id, form, loadedAt) => {
    /** @type {Record<string, any>} */
    const body = {};
    for (const k of KB_TEXT_FIELDS) { const v = typeof form[k] === "string" ? form[k].trim() : form[k]; body[k] = v === "" || v === undefined ? null : v; }
    body.title = form.title.trim();
    body.slug = form.slug.trim();
    body.category = form.category;
    for (const k of ["found_in", "alternatives", "diet_tags", "allergen_ids", "aliases", "tags", "sources"]) body[k] = Array.isArray(form[k]) ? form[k] : [];
    body.sort_order = Number(form.sort_order) || 0;
    if (editorialRef.current) { body.editorial_status = form.editorial_status || null; body.published = form.published !== false; }
    try {
      if (!id) {
        await get("knowledge_base", { method: "POST", headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(body) });
      } else {
        const guard = loadedAt ? `&updated_at=eq.${encodeURIComponent(loadedAt)}` : "";
        const rows = await get(`knowledge_base?id=eq.${encodeURIComponent(id)}${guard}`, { method: "PATCH", headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(body) });
        if (!Array.isArray(rows) || rows.length === 0) return { ok: false, conflict: true, error: "Opslaget er ændret, siden du åbnede det. Luk og åbn det igen, før du gemmer." };
      }
      if (counts) loadCounts();
      return { ok: true };
    } catch (e) {
      const msg = String(/** @type {any} */ (e)?.body || /** @type {any} */ (e)?.message || "");
      if (/23505|duplicate|knowledge_base_slug/i.test(msg)) return { ok: false, field: "slug", error: "Sluggen bruges allerede af et andet opslag." };
      if (/22023|resumé og mindst/i.test(msg)) return { ok: false, field: "editorial_status", error: "Opslaget kan kun godkendes med resumé og mindst én kilde." };
      if (/403|42501/.test(msg) || /** @type {any} */ (e)?.status === 403) return { ok: false, error: "Du har ikke rettighed til at gemme." };
      return { ok: false, error: "Opslaget kunne ikke gemmes. Dine ændringer er bevaret. Prøv igen." };
    }
  }, [get, headers, counts, loadCounts]);

  const deleteEntry = useCallback(async (/** @type {string} */ id) => {
    try {
      await get(`knowledge_base?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { ...headers(), Prefer: "return=minimal" } });
      setEntries((es) => es.filter((e) => e.id !== id));
      loadCounts();
      return { ok: true };
    } catch { return { ok: false, error: "Opslaget blev ikke slettet. Prøv igen." }; }
  }, [get, headers, loadCounts]);

  const loadHistory = useCallback(async (/** @type {string} */ id) => {
    try {
      const rows = await get(`admin_audit_log?target_table=eq.knowledge_base&target_id=eq.${encodeURIComponent(id)}&order=created_at.desc&limit=8&select=action,created_at,details`);
      return { ok: true, rows: Array.isArray(rows) ? rows : [] };
    } catch { return { ok: false, rows: [] }; }
  }, [get]);

  return { entries, total, counts, loading, loadingMore, hasMore, loaded, error, hasEditorial, load, getEntry, saveEntry, deleteEntry, loadHistory };
}
