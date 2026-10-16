// @ts-check
// Dataimport: overblik, kørselslog og start af manuelle kørsler. Serveren afgør grænserne (50 EAN'er pr. import, 25 produkter pr. manuel genanalyse) og tillader kun én kørsel
// af hver slags ad gangen; her beskyttes knapperne desuden mod dobbeltklik. En kørsel fortsætter på serveren, selvom siden forlades, og resultatet står i loggen.
import { useState, useRef, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { JOBS, MANUAL_REANALYZE_LIMIT } from "./importLogic.js";

export function useAdminImport(/** @type {string | null} */ accessToken) {
  const [runs, setRuns] = useState(/** @type {any[]} */ ([]));
  const [overview, setOverview] = useState(/** @type {any} */ (null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {null | { unavailable: boolean }} */ (null));
  const [starting, setStarting] = useState(/** @type {Record<string, boolean>} */ ({}));
  const [notice, setNotice] = useState(/** @type {Record<string, { tone: string, text: string } | null>} */ ({}));
  const busy = useRef(/** @type {Record<string, boolean>} */ ({}));
  const headers = useCallback(() => ({ ...makeHeaders(accessToken), "Content-Type": "application/json", Accept: "application/json" }), [accessToken]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await apiCall(`${SUPABASE_URL}/rest/v1/import_runs?select=id,job,trigger,started_at,finished_at,status,counts,error_code,log&order=started_at.desc&limit=30`, { headers: headers() });
      setRuns(Array.isArray(r) ? r : []);
      try { const o = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_import_overview`, { method: "POST", headers: headers(), body: "{}" }); setOverview(Array.isArray(o) ? o[0] : o); } catch { setOverview(null); }
    } catch (e) {
      const x = /** @type {any} */ (e);
      setError({ unavailable: x?.status === 404 || /42P01|PGRST205|does not exist/i.test(String(x?.body || x?.message || "")) });
    }
    setLoading(false);
  }, [headers]);

  /** @param {"off_import"|"reanalyze"} job */
  const run = useCallback(async (job) => {
    if (busy.current[job]) return; // dobbeltklik
    busy.current[job] = true;
    setStarting((s) => ({ ...s, [job]: true }));
    setNotice((n) => ({ ...n, [job]: null }));
    try {
      const body = job === "reanalyze" ? { manual: true, limit: MANUAL_REANALYZE_LIMIT } : {};
      await apiCall(`${SUPABASE_URL}/functions/v1/${JOBS[job].fn}`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
      setNotice((n) => ({ ...n, [job]: { tone: "ok", text: "Kørslen er afsluttet. Resultatet står i kørselsloggen." } }));
    } catch (e) {
      const x = /** @type {any} */ (e);
      const busyRun = x?.status === 409;
      setNotice((n) => ({ ...n, [job]: busyRun
        ? { tone: "warn", text: "Der kører allerede en kørsel af denne slags. Prøv igen om lidt." }
        : { tone: "error", text: "Kørslen kunne ikke gennemføres eller svaret udeblev. Tjek kørselsloggen, før du prøver igen." } }));
    }
    busy.current[job] = false;
    setStarting((s) => ({ ...s, [job]: false }));
    load();
  }, [headers, load]);

  return { runs, overview, loading, error, starting, notice, load, run };
}
