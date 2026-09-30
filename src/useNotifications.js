// @ts-nocheck
// Beskeder i appen (trin 2 af notifikations-redesignet, 30. sept. 2026):
// liste + ulæst-tæller, og ruten ?notification={id}, som push-beskeder åbner.
// Ruten bevares gennem login (localStorage) og ryddes først, når beskeden er
// åbnet. Efter logout nulstilles alt, så en anden brugers beskeder aldrig ses.
import { useState, useEffect, useCallback } from "react";
import { SCREENS } from "./constants.jsx";
import { fetchNotificationList, markNotificationRead, readNotificationParam, PENDING_KEY } from "./notificationsApi.js";

export function useNotifications({ accessToken, userId, user, screen, setScreen, setAuthTab }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(false);
  const [openId, setOpenId] = useState(null);

  const loadList = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setItems(await fetchNotificationList(accessToken));
      setListError(false);
    } catch {
      setListError(true);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Læst-status sættes først, når beskeden faktisk er vist (kaldes af skærmen).
  const markRead = useCallback(async (id) => {
    const ok = await markNotificationRead(accessToken, id);
    if (ok) setItems((list) => list.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)));
    return ok;
  }, [accessToken]);

  const openNotification = useCallback((id) => {
    setOpenId(id);
    setScreen(SCREENS.NOTIFICATION);
  }, [setScreen]);

  // Ny konto/logout: ingen rester af tidligere brugeres beskeder.
  useEffect(() => {
    if (!accessToken) { setItems([]); setOpenId(null); setListError(false); }
    else loadList();
  }, [accessToken, loadList]);

  // Link fra push (eller mail): gem id'et, og send ikke-loggede brugere til login.
  useEffect(() => {
    const id = readNotificationParam(window.location.search);
    if (!id) return;
    try { localStorage.setItem(PENDING_KEY, id); } catch { /* ignorer */ }
    const url = new URL(window.location.href);
    url.searchParams.delete("notification");
    window.history.replaceState({}, "", url.toString());
    if (!localStorage.getItem("as_token")) {
      setAuthTab?.("login");
      setScreen(SCREENS.LOGIN);
    }
  }, []);

  // Åbn den ventende besked, når brugeren er logget ind og færdig med onboarding.
  useEffect(() => {
    if (!accessToken || !userId || user?.onboarding_completed !== true) return;
    let id = null;
    try { id = localStorage.getItem(PENDING_KEY); } catch { /* ignorer */ }
    if (!id) return;
    try { localStorage.removeItem(PENDING_KEY); } catch { /* ignorer */ }
    openNotification(id);
  }, [accessToken, userId, user, openNotification]);

  const unread = items.filter((n) => !n.read_at).length;
  return { items, unread, loading, listError, loadList, markRead, openId, openNotification };
}
