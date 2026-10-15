// @ts-check
// Admin → Notifikationer: henter admin-brugere og rettede push-tekster, gemmer ændringer
// og sender testbeskeder via edge-funktionen notify-test.
import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";

export function useAdminNotifications(accessToken, userId) {
  const [admins, setAdmins] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(/** @type {null | { denied: boolean }} */ (null));

  const headers = useCallback(() => ({ ...makeHeaders(accessToken), Accept: "application/json" }), [accessToken]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [a, o] = await Promise.all([
        apiCall(`${SUPABASE_URL}/rest/v1/users?role=eq.admin&select=id,name,email&order=name.asc`, { headers: headers() }),
        apiCall(`${SUPABASE_URL}/rest/v1/notification_push_overrides?select=key,title,body,updated_at`, { headers: headers() }),
      ]);
      setAdmins(Array.isArray(a) ? a : []);
      setOverrides(Object.fromEntries((Array.isArray(o) ? o : []).map((r) => [r.key, r])));
      setLoaded(true);
    } catch (e) {
      setError({ denied: e?.status === 401 || e?.status === 403 });
    }
    setLoading(false);
  }, [accessToken, headers]);

  useEffect(() => { if (accessToken) load(); }, [accessToken, load]);

  // Før databasefunktionen er udgivet: direkte skrivning som hidtil (RLS: kun administratorer). Ingen konfliktkontrol, men dog tjek af versionen, hvis den kendes.
  const legacySave = useCallback(async (key, t, b, expected) => {
    try {
      const cur = await apiCall(`${SUPABASE_URL}/rest/v1/notification_push_overrides?key=eq.${encodeURIComponent(key)}&select=updated_at`, { headers: headers() });
      const curAt = Array.isArray(cur) && cur[0] ? cur[0].updated_at : null;
      const ms = (/** @type {string|null} */ v) => (v ? new Date(v).getTime() : null);
      if (ms(curAt) !== ms(expected)) {
        return { ok: false, conflict: true, error: "Teksten er ændret af en anden administrator, siden du åbnede den. Hent den nyeste, før du gemmer." };
      }
      if (!t && !b) {
        await apiCall(`${SUPABASE_URL}/rest/v1/notification_push_overrides?key=eq.${encodeURIComponent(key)}`, { method: "DELETE", headers: headers() });
        setOverrides((prev) => { const n = { ...prev }; delete n[key]; return n; });
        return { ok: true, updated_at: null };
      }
      const at = new Date().toISOString();
      await apiCall(`${SUPABASE_URL}/rest/v1/notification_push_overrides?on_conflict=key`, {
        method: "POST", headers: { ...headers(), "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ key, title: t || null, body: b || null, updated_at: at }),
      });
      setOverrides((prev) => ({ ...prev, [key]: { key, title: t || null, body: b || null, updated_at: at } }));
      return { ok: true, updated_at: at };
    } catch {
      return { ok: false, error: "Teksten kunne ikke gemmes. Dine ændringer er bevaret. Tjek forbindelsen, og prøv igen." };
    }
  }, [headers]);

  // title/body tomme → standardteksten bruges igen (rækken slettes). expected = den version (updated_at), administratoren så; er teksten ændret siden, afvises gemningen
  // (conflict). Returnerer { ok, conflict?, updated_at?, error? }; en fejl er aldrig en succes, og kladden bliver stående hos kalderen.
  const savePush = useCallback(async (key, { title, body }, expected = null) => {
    const t = String(title ?? "").trim();
    const b = String(body ?? "").trim();
    try {
      const updated = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_save_push_override`, {
        method: "POST", headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ p_key: key, p_title: t, p_body: b, p_expected: expected }),
      });
      if (!t && !b) {
        setOverrides((prev) => { const n = { ...prev }; delete n[key]; return n; });
        return { ok: true, updated_at: null };
      }
      const at = typeof updated === "string" ? updated : new Date().toISOString();
      setOverrides((prev) => ({ ...prev, [key]: { key, title: t || null, body: b || null, updated_at: at } }));
      return { ok: true, updated_at: at };
    } catch (e) {
      let code = "";
      try { code = JSON.parse(e?.body || "{}").code || ""; } catch { /* ingen kode */ }
      if (code === "40001") return { ok: false, conflict: true, error: "Teksten er ændret af en anden administrator, siden du åbnede den. Hent den nyeste, før du gemmer." };
      if (e?.status === 403 || e?.status === 401 || code === "42501") return { ok: false, error: "Du har ikke rettighed til at gemme." };
      if (e?.status === 404) return legacySave(key, t, b, expected); // funktionen er ikke udgivet endnu: skriv direkte (uden konfliktkontrol)
      return { ok: false, error: "Teksten kunne ikke gemmes. Dine ændringer er bevaret. Tjek forbindelsen, og prøv igen." };
    }
  }, [headers, legacySave]);

  // channels: ["push","mail"]; draft = ikke-gemt pushtekst, som testen skal bruge uden at gemme den. Returnerer { ok, data } eller { ok:false, error }.
  const sendTest = useCallback(async (key, toUserId, channels, draft = null) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-test`, {
        method: "POST", headers: { ...makeHeaders(accessToken), "Content-Type": "application/json" },
        body: JSON.stringify({ key, userId: toUserId, channels, ...(draft ? { pushOverride: draft } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 || res.status === 401) return { ok: false, error: "Du har ikke adgang til at sende test." };
      if (!res.ok) return { ok: false, error: data?.error || `Serveren svarede ${res.status}` };
      return { ok: true, data };
    } catch {
      return { ok: false, error: "Testen kunne ikke sendes. Tjek forbindelsen, og prøv igen." };
    }
  }, [accessToken]);

  // Mailens HTML fra Resend med eksempeldata (hentes af edge-funktionen, så admin ser det, der faktisk sendes)
  const loadMailPreview = useCallback(async (key, toUserId) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-test`, {
      method: "POST", headers: { ...makeHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "preview", key, userId: toUserId || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data;
  }, [accessToken]);

  return { admins, overrides, loading, loaded, error, load, savePush, sendTest, loadMailPreview };
}
