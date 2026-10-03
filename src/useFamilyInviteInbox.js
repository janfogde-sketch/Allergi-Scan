// @ts-nocheck
// Familie-invitationer (3. okt. 2026). To veje ind til samme sheet, begge kræver et aktivt ja fra modtageren:
//  1) e-mail-match: kontoens bekræftede e-mail er den, afsenderen skrev (virker uden token, i enhver browser og ved enhver loginmetode med e-mail);
//  2) linket i mailen: tokenet gemmes i localStorage (`as_pending_invite`, sat af useIncomingLinks) og følger brugeren gennem oprettelse/login,
//     også med Facebook eller en anden adresse end den inviterede. Tokenet ryddes, når invitationen er besvaret eller ikke længere gælder.
import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";
import { mergeInvites, nextInvite } from "./familyInviteInbox.js";

const TOKEN_KEY = "as_pending_invite";
const readToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
const clearToken = () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ingen lagring: intet at rydde */ } };

const rpc = (name, accessToken, body = {}) =>
  apiCall(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: "POST", headers: makeHeaders(accessToken), body: JSON.stringify(body) });

export function useFamilyInviteInbox({ accessToken, userId, user, loadFamily }) {
  const [invites, setInvites] = useState([]);
  const [dismissed, setDismissed] = useState([]); // "Senere": vises igen næste gang appen åbnes
  const [busy, setBusy] = useState(false);
  const ready = !!accessToken && !!userId && !!user && user.onboarding_completed !== false;

  const load = useCallback(async () => {
    try {
      const emailInvites = await rpc("get_my_pending_family_invites", accessToken);
      const token = readToken();
      let linkInvite = null;
      if (token) {
        linkInvite = await rpc("get_family_invite_by_link", accessToken, { p_token: token });
        // Brugt, udløbet eller din egen: tokenet er ikke længere til nytte
        if (!linkInvite || !linkInvite.id) { linkInvite = null; clearToken(); }
      }
      setInvites(mergeInvites(emailInvites, linkInvite, linkInvite ? token : null));
    } catch { /* stille: tokenet beholdes, og det prøves igen næste gang appen åbnes eller kommer i forgrunden */ }
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

  const current = nextInvite(invites, dismissed);
  const remove = id => setInvites(list => list.filter(i => i.id !== id));

  const accept = async () => {
    if (!current) return;
    setBusy(true);
    try {
      const res = current.viaToken
        ? await rpc("accept_family_invite_by_link", accessToken, { p_token: current.viaToken })
        : await rpc("accept_my_family_invite", accessToken, { p_invite_id: current.id });
      remove(current.id);
      if (current.viaToken) clearToken();
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
      if (current.viaToken) await rpc("decline_family_invite_by_link", accessToken, { p_token: current.viaToken });
      else await rpc("decline_my_family_invite", accessToken, { p_invite_id: current.id });
      remove(current.id);
      if (current.viaToken) clearToken();
      showToast("Okay. Du er ikke tilføjet til familien.");
    } catch { showToast("Kunne ikke afvise invitationen. Prøv igen.", "error"); }
    setBusy(false);
  };

  const later = () => { if (current) setDismissed(d => [...d, current.id]); };

  return { familyInvite: current, familyInviteBusy: busy, acceptFamilyInvite: accept, declineFamilyInvite: decline, laterFamilyInvite: later };
}
