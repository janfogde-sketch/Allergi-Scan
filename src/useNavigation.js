// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useNavigation.js
// Tilføjer browser back-knap support til EatSafe's skærm-baserede navigation.
// Erstatter direkte setScreen-kald med navigate() der holder styr på historik.
//
// BRUG i App.jsx:
//   import { useNavigation } from './useNavigation.js';
//   const { navigate, goBack, canGoBack } = useNavigation(screen, setScreen, SCREENS);
//
//   // I stedet for: setScreen(SCREENS.RESULT)
//   // Brug:        navigate(SCREENS.RESULT)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useCallback, useRef } from "react";

// Screens der aldrig skal være i historikken (replace i stedet for push)
const REPLACE_SCREENS = new Set([
  "WELCOME", "LOGIN", "ONBOARD",
]);

// Screens der er "rod" — der ryddes stakken ved navigation hertil
const ROOT_SCREENS = new Set([
  "HOME", "PROFILE", "RECIPES", "KNOWLEDGE", "MADPAS",
]);

export function useNavigation(screen, setScreen, SCREENS) {
  const stackRef = useRef([screen]);
  const isPopRef = useRef(false); // undgår dobbelt-push ved popstate

  // Initialiser browser-historik
  useEffect(() => {
    window.history.replaceState({ screen }, "", window.location.pathname);
  }, []);

  // Lyt til browser back/forward
  useEffect(() => {
    const handlePop = (e) => {
      const prevScreen = e.state?.screen;
      if (!prevScreen) return;
      isPopRef.current = true;
      setScreen(prevScreen);
      stackRef.current = stackRef.current.slice(0, -1);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [setScreen]);

  // navigate(screenId) — brug i stedet for setScreen
  const navigate = useCallback((screenId) => {
    if (isPopRef.current) { isPopRef.current = false; return; }
    if (screenId === screen) return; // ingen ændring

    if (ROOT_SCREENS.has(screenId) || REPLACE_SCREENS.has(screenId)) {
      // Rod-skærme: ryd stakken
      stackRef.current = [screenId];
      window.history.replaceState({ screen: screenId }, "", window.location.pathname);
    } else {
      // Normal navigation: push
      stackRef.current = [...stackRef.current, screenId];
      window.history.pushState({ screen: screenId }, "", window.location.pathname);
    }
    setScreen(screenId);
  }, [screen, setScreen]);

  // goBack() — gå til forrige skærm
  const goBack = useCallback(() => {
    if (stackRef.current.length > 1) {
      window.history.back();
    } else {
      navigate(SCREENS?.HOME || "HOME");
    }
  }, [navigate, SCREENS]);

  const canGoBack = stackRef.current.length > 1;

  return { navigate, goBack, canGoBack };
}

export default useNavigation;
