// @ts-nocheck
// Admin → Notifikationer: henter admin-brugere og rettede push-tekster, gemmer ændringer
// og sender testbeskeder via edge-funktionen notify-test.
import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { showToast } from "../SharedComponents.jsx";

export function useAdminNotifications(accessToken, userId) {
  const [admins, setAdmins] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [loading, setLoading] = useState(false);

  const headers = useCallback(() => ({ ...makeHeaders(accessToken), Accept: "application/json" }), [accessToken]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [a, o] = await Promise.all([
        apiCall(`${SUPABASE_URL}/rest/v1/users?role=eq.admin&select=id,name,email&order=name.asc`, { headers: headers() }),
        apiCall(`${SUPABASE_URL}/rest/v1/notification_push_overrides?select=key,title,body,updated_at`, { headers: headers() }),
      ]);
      setAdmins(Array.isArray(a) ? a : []);
      setOverrides(Object.fromEntries((Array.isArray(o) ? o : []).map((r) => [r.key, r])));
    } catch (e) {
      showToast("Kunne ikke hente notifikationer: " + e.message, "error");
    }
    setLoading(false);
  }, [accessToken, headers]);

  useEffect(() => { if (accessToken) load(); }, [accessToken, load]);

  // title/body tomme → standardteksten bruges igen (rækken slettes)
  const savePush = useCallback(async (key, { title, body }) => {
    const t = String(title ?? "").trim();
    const b = String(body ?? "").trim();
    try {
      if (!t && !b) {
        await apiCall(`${SUPABASE_URL}/rest/v1/notification_push_overrides?key=eq.${encodeURIComponent(key)}`, { method: "DELETE", headers: headers() });
        setOverrides((prev) => { const n = { ...prev }; delete n[key]; return n; });
        showToast("Push er sat tilbage til standard");
        return true;
      }
      const row = { key, title: t || null, body: b || null, updated_by: userId, updated_at: new Date().toISOString() };
      await apiCall(`${SUPABASE_URL}/rest/v1/notification_push_overrides?on_conflict=key`, {
        method: "POST", headers: { ...headers(), "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row),
      });
      setOverrides((prev) => ({ ...prev, [key]: row }));
      showToast("Push-teksten er gemt og gælder fra nu af");
      return true;
    } catch (e) {
      showToast("Kunne ikke gemme: " + e.message, "error");
      return false;
    }
  }, [headers, userId]);

  // channels: ["push","mail"]. Returnerer svaret fra serveren eller null.
  const sendTest = useCallback(async (key, toUserId, channels) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-test`, {
        method: "POST", headers: { ...makeHeaders(accessToken), "Content-Type": "application/json" },
        body: JSON.stringify({ key, userId: toUserId, channels }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      return data;
    } catch (e) {
      showToast("Testen mislykkedes: " + e.message, "error");
      return null;
    }
  }, [accessToken]);

  return { admins, overrides, loading, load, savePush, sendTest };
}
