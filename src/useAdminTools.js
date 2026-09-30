// @ts-nocheck
// Admin-værktøjer i den mobile app: manglende EAN'er og OFF-import.
// Flyttet uændret fra App.jsx 30. sept. 2026 (arkitektur-audit A8).
import { useState } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";

export function useAdminTools(accessToken) {
  // ── Manglende EAN'er ──────────────────────────────────────────────────────
  const [missingEans, setMissingEans] = useState([]);
  const [missingEansLoading, setMissingEansLoading] = useState(false);

  const loadMissingEans = async () => {
    setMissingEansLoading(true);
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/missing_ean_log?select=ean,count,first_seen,last_seen&order=count.desc&limit=100`,
        { headers: makeHeaders(accessToken) }
      );
      if (Array.isArray(data)) setMissingEans(data);
    } catch {}
    setMissingEansLoading(false);
  };

  const deleteMissingEan = async (ean) => {
    try {
      await apiCall(
        `${SUPABASE_URL}/rest/v1/missing_ean_log?ean=eq.${encodeURIComponent(ean)}`,
        { method: "DELETE", headers: makeHeaders(accessToken) }
      );
      setMissingEans(prev => prev.filter(r => r.ean !== ean));
    } catch {}
  };

  // ── OFF Import ───────────────────────────────────────────────────────────────
  const [importLog, setImportLog] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  const runImport = async (execute = true) => {
    if (!execute) return; // ved tab-skift viser vi bare UI uden at køre
    setImportLoading(true);
    setImportLog(null);
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/functions/v1/auto-import-off`,
        {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({}),
        }
      );
      setImportLog(data);
    } catch (e) {
      setImportLog({ ok: false, error: e.message, stats: { imported:0, not_on_off:0, error:1 }, log: [] });
    }
    setImportLoading(false);
  };

  return {
    missingEans, missingEansLoading, loadMissingEans, deleteMissingEan,
    importLog, importLoading, runImport,
  };
}
