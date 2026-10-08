import React from "react";
import { SCREENS } from "./constants.jsx";
import { AUTH_FLOW_SCREENS } from "./appScreens.js";

// Android-tilbageknappen (flyttet ud af App.jsx, ren omflytning).
export function useAndroidBack({ screen, setScreen, helpOpen, setHelpOpen, feedbackOpen, setFeedbackOpen, profilePopup, setProfilePopup, showProfileMenu, setShowProfileMenu, cameraActive, closeCameraFully }) {
  // ── Android tilbageknap ─────────────────────────────────────────────────────
  React.useEffect(() => {
    // Push en state så vi kan fange tilbageknap
    window.history.pushState({ screen: "app" }, "");
    const handleBack = (e) => {
      // Forhindre at vi navigerer væk fra appen
      e.preventDefault();
      window.history.pushState({ screen: "app" }, "");
      // Navigér inden i appen i stedet
      if (helpOpen) { setHelpOpen(false); return; }
      if (feedbackOpen) { setFeedbackOpen(false); return; }
      if (profilePopup) { setProfilePopup(null); return; }
      if (showProfileMenu) { setShowProfileMenu(false); return; }
      if (cameraActive) { closeCameraFully(); return; }
      // Bundmenu-skærmene og selve login/onboarding — gør ingenting
      // (forhindrer at tilbage forlader appen eller afbryder onboarding).
      const STAY = [SCREENS.HOME, SCREENS.LIST, SCREENS.HISTORY, ...AUTH_FLOW_SCREENS];
      if (STAY.includes(screen)) return;
      // Redigering åbnes fra Profil og går tilbage dertil; alt andet (menu-
      // skærme, resultat, indsendelse, Madpas m.fl.) går til forsiden.
      if (screen === SCREENS.EDITPROFILE || screen === SCREENS.EDITPREFERENCES) { setScreen(SCREENS.PROFILE); return; }
      // Bidragsflowet har sin egen trin-stak: systemets tilbage går ét trin tilbage (SuggestEditScreen lytter og afbryder hændelsen).
      if (screen === SCREENS.SUGGEST_EDIT) {
        const ev = new CustomEvent("eatsafe:back", { cancelable: true });
        window.dispatchEvent(ev);
        if (ev.defaultPrevented) return;
      }
      setScreen(SCREENS.HOME);
    };
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [screen, helpOpen, feedbackOpen, profilePopup, cameraActive, showProfileMenu]);
}
