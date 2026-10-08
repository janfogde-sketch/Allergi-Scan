// @ts-nocheck
// Afsenderens side af et delt invitationslink (3. okt. 2026): når en person har brugt linket og sagt ja, skal afsenderen selv godkende, før
// de bliver forbundet (helbredsoplysninger deles). Hentes, når appen åbnes/kommer i forgrunden og med et let interval, mens den er åben.
import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";

const rpc = (name, accessToken, body = {}) =>
  apiCall(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: "POST", headers: makeHeaders(accessToken), body: JSON.stringify(body) });

const POLL_MS = 60000;

export function useFamilyLinkRequests({ accessToken, userId, user, loadFamily }) {
  const [requests, setRequests] = useState([]);
  const [dismissed, setDismissed] = useState([]); // "Senere": vises igen næste gang appen åbnes
  const [busy, setBusy] = useState(false);
  const ready = !!accessToken && !!userId && !!user && user.onboarding_completed !== false;

  const load = useCallback(async () => {
    try {
      const data = await rpc("get_family_link_requests", accessToken);
      setRequests(Array.isArray(data) ? data : []);
    } catch { /* stille: prøves igen */ }
  }, [accessToken]);

  useEffect(() => {
    if (!ready) return undefined;
    load();
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const timer = setInterval(onVisible, POLL_MS);
    return () => { document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("focus", onVisible); clearInterval(timer); };
  }, [ready, load]);

  const current = requests.find(r => !dismissed.includes(r.invite_id)) || null;
  const remove = id => setRequests(list => list.filter(r => r.invite_id !== id));

  const approve = async () => {
    if (!current) return;
    setBusy(true);
    try {
      const res = await rpc("approve_family_link_request", accessToken, { p_invite_id: current.invite_id });
      remove(current.invite_id);
      if (res?.success) { loadFamily?.(); showToast(`${current.requester_first_name || "Personen"} er nu i din familie.`); }
      else showToast("Anmodningen virker ikke længere. Den er udløbet eller allerede besvaret.", "error");
    } catch { showToast("Kunne ikke godkende. Tjek din forbindelse og prøv igen.", "error"); }
    setBusy(false);
  };

  const decline = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await rpc("decline_family_link_request", accessToken, { p_invite_id: current.invite_id });
      remove(current.invite_id);
      showToast("Okay. Personen er ikke tilføjet til din familie.");
    } catch { showToast("Kunne ikke afvise. Prøv igen.", "error"); }
    setBusy(false);
  };

  const later = () => { if (current) setDismissed(d => [...d, current.invite_id]); };

  return { linkRequest: current, linkRequestBusy: busy, approveLinkRequest: approve, declineLinkRequest: decline, laterLinkRequest: later };
}
