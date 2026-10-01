// @ts-nocheck
// Henter tilbagekaldelser (public.recalls, kun læsbar for admin) og afgør dem via
// admin-RPC'erne admin_resolve_recall / admin_recall_affected_count.
import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { showToast } from "../SharedComponents.jsx";

const SELECT = "id,source_url,title,published_at,intro,affected,reason,action,eans,unverified_eans,status,created_at,updated_at";

export function useAdminRecalls(accessToken) {
  const [recalls, setRecalls] = useState([]);
  const [loading, setLoading] = useState(false);

  const headers = useCallback(() => ({ ...makeHeaders(accessToken), Accept: "application/json" }), [accessToken]);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!accessToken) return;
    if (!quiet) setLoading(true);
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/recalls?select=${SELECT}&order=published_at.desc.nullslast&limit=300`, { headers: headers() });
      setRecalls(Array.isArray(data) ? data : []);
    } catch (e) {
      if (!quiet) showToast("Kunne ikke hente tilbagekaldelser: " + e.message, "error");
    }
    if (!quiet) setLoading(false);
  }, [accessToken, headers]);

  // Første indlæsning ved login, så tælleren i menuen er rigtig
  useEffect(() => { if (accessToken) load({ quiet: true }); }, [accessToken, load]);

  const searchProducts = useCallback(async (query) => {
    const q = String(query ?? "").trim();
    if (!q) return [];
    const enc = encodeURIComponent(q);
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/products?or=(name.ilike.*${enc}*,brand.ilike.*${enc}*,ean.eq.${enc})&select=id,ean,name,brand&order=name.asc&limit=15`,
        { headers: headers() });
      return Array.isArray(data) ? data : [];
    } catch (e) {
      showToast("Kunne ikke søge produkter: " + e.message, "error");
      return [];
    }
  }, [headers]);

  const affectedCount = useCallback(async (eans) => {
    if (!eans?.length) return 0;
    try {
      const n = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_recall_affected_count`, {
        method: "POST", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify({ p_eans: eans }),
      });
      return typeof n === "number" ? n : null;
    } catch { return null; }
  }, [headers]);

  // action: "link" | "archive" | "cancel". Returnerer true ved succes.
  const resolve = useCallback(async (id, action, eans = []) => {
    try {
      const res = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_resolve_recall`, {
        method: "POST", headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ p_recall_id: id, p_action: action, p_eans: eans }),
      });
      setRecalls((prev) => prev.map((r) => (r.id === id ? { ...r, status: res?.status || r.status, eans: res?.eans || r.eans } : r)));
      showToast(action === "link" ? "Tilbagekaldelsen er sendt til de berørte brugere" : action === "archive" ? "Arkiveret uden besked" : "Annulleret");
      return true;
    } catch (e) {
      showToast("Kunne ikke gemme: " + e.message, "error");
      return false;
    }
  }, [headers]);

  return { recalls, loading, load, searchProducts, affectedCount, resolve };
}
