// @ts-nocheck
// Familie-invitationer til kontoens bekræftede e-mail (3. okt. 2026). Invitationen er bundet til den e-mail, afsenderen skrev, så
// den virker uanset hvilken browser linket blev åbnet i. Modtageren bekræfter selv i FamilyInviteSheet; intet kobles uden et ja.
import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";

const rpc = (name, accessToken, body = {}) =>
  apiCall(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: "POST", headers: makeHeaders(accessToken), body: JSON.stringify(body) });

export function useFamilyInviteInbox({ accessToken, userId, user, loadFamily }) {
  const [invites, setInvites] = useState([]);
  const [dismissed, setDismissed] = useState([]); // "Senere": vises igen næste gang appen åbnes
  const [busy, setBusy] = useState(false);
  const ready = !!accessToken && !!userId && !!user && user.onboarding_completed !== false;

  const load = useCallback(async () => {
    try {
      const data = await rpc("get_my_pending_family_invites", accessToken);
      setInvites(Array.isArray(data) ? data : []);
    } catch { /* stille: prøves igen næste gang appen åbnes */ }
  }, [accessToken]);

  useEffect(() => { if (ready) load(); }, [ready, userId, load]);

  // En allerede logget ind bruger skal også se en invitation, der kommer, mens appen er åben i baggrunden: hent igen, når appen kommer i forgrunden.
  useEffect(() => {
    if (!ready) return undefined;
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => { document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("focus", onVisible); };
  }, [ready, load]);

  const current = invites.find(i => !dismissed.includes(i.id)) || null;
  const remove = id => setInvites(list => list.filter(i => i.id !== id));

  const accept = async () => {
    if (!current) return;
    setBusy(true);
    try {
      const res = await rpc("accept_my_family_invite", accessToken, { p_invite_id: current.id });
      remove(current.id);
      if (res?.success) {
        loadFamily?.();
        showToast("Du er nu i familie med den, der inviterede dig. Se jer under Familie i menuen.");
      } else showToast("Invitationen virker ikke længere. Den er udløbet eller allerede brugt. Bed om en ny.", "error");
    } catch { showToast("Vi kunne ikke tilknytte invitationen. Tjek din forbindelse og prøv igen.", "error"); }
    setBusy(false);
  };

  const decline = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await rpc("decline_my_family_invite", accessToken, { p_invite_id: current.id });
      remove(current.id);
      showToast("Okay. Du er ikke tilføjet til familien.");
    } catch { showToast("Kunne ikke afvise invitationen. Prøv igen.", "error"); }
    setBusy(false);
  };

  const later = () => { if (current) setDismissed(d => [...d, current.id]); };

  return { familyInvite: current, familyInviteBusy: busy, acceptFamilyInvite: accept, declineFamilyInvite: decline, laterFamilyInvite: later };
}
