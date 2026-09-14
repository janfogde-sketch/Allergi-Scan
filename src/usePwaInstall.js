// @ts-nocheck
// usePwaInstall.js — Fanger browserens "beforeinstallprompt" (Android/Chrome m.fl.)
// så vi selv kan vise en knap der udløser den native installations-dialog med ét
// tryk. Uden dette venter browseren typisk bare stille et sted i sit menu — den
// dukker ikke automatisk op af sig selv (det tillader ingen browser af
// sikkerhedsårsager), men ét tryk på vores egen knap er så tæt på "automatisk"
// som det kan komme.
import { useState, useEffect, useCallback } from "react";

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
  );

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => { setInstalled(true); setDeferredPrompt(null); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return choice.outcome === "accepted";
  }, [deferredPrompt]);

  return { canInstall: !!deferredPrompt, installed, promptInstall };
}
