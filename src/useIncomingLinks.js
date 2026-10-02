// @ts-nocheck
// Links, som åbner appen med en handling: familie-invitation (?invite=)
// og deling af indkøbsliste (?join-list=). Flyttet uændret fra App.jsx
// 30. sept. 2026 (arkitektur-audit A8).
import React, { useState } from "react";
import { SCREENS, SUPABASE_URL } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";

export function useIncomingLinks({
  accessToken, userId, user, loadFamily,
  joinByCode, loadShoppingList, setAuthTab, setScreen,
}) {
  // ── Familie-invitation accept ────────────────────────────────────────────
  // Token gemmes i localStorage (som indkøbslistekoden nedenfor), så den overlever oprettelse, e-mailbekræftelse og onboarding,
  // og koblingen sker automatisk, når brugeren er logget ind. `&login=1` åbner login i stedet for oprettelse.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("invite");
    if (fromUrl) {
      localStorage.setItem("as_pending_invite", fromUrl);
      const url = new URL(window.location.href);
      url.searchParams.delete("invite");
      url.searchParams.delete("login");
      window.history.replaceState({}, "", url.toString());
      if (!localStorage.getItem("as_token")) {
        setAuthTab(params.get("login") === "1" ? "login" : "signup");
        setScreen(SCREENS.LOGIN);
      }
    }
  }, []);

  React.useEffect(() => {
    const inviteToken = localStorage.getItem("as_pending_invite");
    if (!inviteToken || !accessToken || !userId) return;
    localStorage.removeItem("as_pending_invite");

    // Accepter invitation via RPC
    const acceptInvite = async () => {
      try {
        const data = await apiCall(
          `${SUPABASE_URL}/rest/v1/rpc/accept_family_invite`,
          {
            method: "POST",
            headers: makeHeaders(accessToken),
            body: JSON.stringify({ p_token: inviteToken }),
          }
        );
        if (data?.success) {
          // Genindlæs familie-data
          loadFamily();
          showToast("Invitation accepteret. Du er nu i familie med den, der inviterede dig. Se jer under Familie i menuen.");

          // Beskeden til den der inviterede (N5) oprettes af databasen og sendes af `notify`.
        } else {
          showToast("Invitationen virker ikke længere. Den er udløbet eller allerede brugt. Bed den, der inviterede dig, om en ny.", "error");
        }
      } catch {
        // Netværksfejl: behold token, så koblingen prøves igen ved næste åbning, og sig det højt.
        localStorage.setItem("as_pending_invite", inviteToken);
        showToast("Vi kunne ikke tilknytte invitationen. Tjek din forbindelse og åbn appen igen.", "error");
      }
    };
    acceptInvite();
  }, [accessToken, userId]);

  // ── Indkøbsliste-tilslutning via delt link ────────────────────────────────
  // Koden gemmes i localStorage (ikke kun URL'en), så den overlever hele
  // signup-flowet — en ny bruger, der åbner linket, skal først igennem
  // "Opret konto" og allergi-opsætning, før accessToken overhovedet findes.
  const [pendingJoinList, setPendingJoinList] = useState(() => localStorage.getItem("as_pending_join_list"));

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("join-list");
    if (!code) return;
    localStorage.setItem("as_pending_join_list", code);
    setPendingJoinList(code);
    const wantsLogin = params.get("login") === "1";
    // Fjern koden fra URL uden reload — den lever videre i localStorage
    const url = new URL(window.location.href);
    url.searchParams.delete("join-list");
    url.searchParams.delete("login");
    window.history.replaceState({}, "", url.toString());
    // Ikke logget ind endnu — opfordr direkte til at oprette en konto,
    // fremfor at brugeren lander på den almindelige velkomstskærm
    if (!localStorage.getItem("as_token")) {
      setAuthTab(wantsLogin ? "login" : "signup");
      setScreen(SCREENS.LOGIN);
    }
  }, []);

  // Linket tilslutter ALDRIG af sig selv: først hentes en forhåndsvisning (listenavn + afsenderens fornavn), og modtageren bekræfter i
  // JoinListSheet. Nye brugere bekræfter, når oprettelse og onboarding er færdige (koden ligger imens i localStorage).
  const [joinPreview, setJoinPreview] = useState(null); // { code, name, owner_name }
  const [joining, setJoining] = useState(false);
  const userReady = !!user && user.onboarding_completed !== false;

  const clearPending = () => { localStorage.removeItem("as_pending_join_list"); setPendingJoinList(null); };

  React.useEffect(() => {
    if (!pendingJoinList || !accessToken || !userId || !userReady || joinPreview) return;
    let cancelled = false;
    apiCall(`${SUPABASE_URL}/functions/v1/shopping/preview?code=${encodeURIComponent(pendingJoinList)}`, { headers: makeHeaders(accessToken) })
      .then(data => {
        if (cancelled) return;
        const l = data?.list;
        if (!l) throw new Error("ugyldig");
        if (l.is_owner || l.already_member) {
          clearPending();
          loadShoppingList();
          setScreen(SCREENS.LIST);
          showToast(l.is_owner ? "Det er din egen liste." : "Du har allerede adgang til den liste.");
          return;
        }
        setJoinPreview({ code: pendingJoinList, name: l.name, owner_name: l.owner_name });
      })
      .catch(e => {
        if (cancelled) return;
        if (e?.status === 404 || e?.message === "ugyldig") {
          clearPending();
          showToast("Linket til listen virker ikke. Tjek, at det er helt, eller bed om et nyt.", "error");
        } else {
          showToast("Vi kunne ikke hente den delte liste. Tjek din forbindelse og åbn linket igen.", "error");
          setPendingJoinList(null); // koden ligger stadig i localStorage og prøves igen næste gang appen åbnes
        }
      });
    return () => { cancelled = true; };
  }, [accessToken, userId, pendingJoinList, userReady]);

  const confirmJoin = async () => {
    if (!joinPreview) return;
    setJoining(true);
    const res = await joinByCode(joinPreview.code);
    setJoining(false);
    const name = joinPreview.name;
    setJoinPreview(null);
    clearPending();
    if (res.success) {
      loadShoppingList();
      setScreen(SCREENS.LIST);
      showToast(`Du er nu tilsluttet "${name}". Du finder den under Indkøbsliste.`);
    } else {
      showToast("Kunne ikke tilslutte listen: " + (res.error || "Ugyldig kode"), "error");
    }
  };
  const declineJoin = () => {
    setJoinPreview(null);
    clearPending();
    showToast("Okay. Du er ikke tilsluttet listen.");
  };

  return { pendingJoinList, joinPreview, joining, confirmJoin, declineJoin };
}
