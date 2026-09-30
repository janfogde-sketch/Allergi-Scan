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
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get("invite");
    if (!inviteToken || !accessToken || !userId) return;

    // Fjern token fra URL uden reload
    const url = new URL(window.location.href);
    url.searchParams.delete("invite");
    url.searchParams.delete("login");
    window.history.replaceState({}, "", url.toString());

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
          showToast("🎉 Invitation accepteret! Jeres familieoplysninger er nu delt.");

          // Beskeden til den der inviterede (N5) oprettes af databasen og sendes af `notify`.
        } else if (data?.error) {
          showToast("Invitation fejlede: " + data.error, "error");
        }
      } catch { /* ignorer */ }
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
    // Fjern koden fra URL uden reload — den lever videre i localStorage
    const url = new URL(window.location.href);
    url.searchParams.delete("join-list");
    window.history.replaceState({}, "", url.toString());
    // Ikke logget ind endnu — opfordr direkte til at oprette en konto,
    // fremfor at brugeren lander på den almindelige velkomstskærm
    if (!localStorage.getItem("as_token")) {
      setAuthTab("signup");
      setScreen(SCREENS.LOGIN);
    }
  }, []);

  React.useEffect(() => {
    if (!pendingJoinList || !accessToken || !userId) return;
    const code = pendingJoinList;
    localStorage.removeItem("as_pending_join_list");
    setPendingJoinList(null);

    joinByCode(code).then(res => {
      if (res.success) {
        loadShoppingList();
        setScreen(SCREENS.LIST);
        showToast(`🛒 Du er nu tilsluttet listen "${res.list?.name || ""}"!`);
      } else {
        showToast("Kunne ikke tilslutte listen: " + (res.error || "Ugyldig kode"), "error");
      }
    });
  }, [accessToken, userId, pendingJoinList]);

  return { pendingJoinList };
}
