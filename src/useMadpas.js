// @ts-check
import { useState, useEffect } from "react";
import { MADPAS_LANGUAGES } from "./constants.jsx";
import { showToast } from "./ToastAndMisc.jsx";

// Madpas-teksterne (madpasText.js) er store og indlæses først, når Madpas-skærmen
// åbnes. Skærmen kalder preloadMadpasText(), så oplæsningen kan køre synkront
// på knaptrykket (iPhone kræver, at talen starter direkte fra trykket).
let madpasText = null;
export function preloadMadpasText() {
  return import("./madpasText.js").then(m => (madpasText = m));
}

// Mangler telefonen en stemme til sproget, må oplæsningen ikke fejle i det stille.
// En tom stemmeliste betyder "ukendt" (Chrome henter dem først lidt efter start), ikke "mangler".
export function hasVoiceFor(bcp, voices) {
  if (!voices || voices.length === 0) return true;
  const base = String(bcp).toLowerCase().split(/[-_]/)[0];
  return voices.some(v => String(v.lang || "").toLowerCase().split(/[-_]/)[0] === base);
}

export function noVoiceMessage(langName) {
  return `Din telefon har ingen stemme til ${langName}. Du kan i stedet vise skærmen til tjeneren.`;
}

const SPEAK_START_TIMEOUT_MS = 3000;

export function useMadpas({ allergens, customAllerg, user, madpasLang, family, madpasProfileId, madpasCrossContact }) {
  const [madpasSpeaking, setMadpasSpeaking] = useState(false);
  const [madpasWaiterView, setMadpasWaiterView] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // Stop oplæsningen, når appen skjules eller hooken fjernes
  useEffect(() => {
    const stop = () => { window.speechSynthesis?.cancel(); setMadpasSpeaking(false); };
    window.addEventListener("pagehide", stop);
    return () => window.removeEventListener("pagehide", stop);
  }, []);

  const madpasSpeak = () => {
    if (!window.speechSynthesis) return;
    if (madpasSpeaking) { window.speechSynthesis.cancel(); setMadpasSpeaking(false); return; }
    if (!madpasText) { preloadMadpasText().then(() => madpasSpeak()); return; }
    const lang = madpasLang;
    const langInfo = MADPAS_LANGUAGES.find(l => l.code === lang);
    const bcp = langInfo?.bcp || "en-US";
    const langName = langInfo?.dansk || lang;
    let voices = [];
    try { voices = window.speechSynthesis.getVoices() || []; } catch { /* ignoreres */ }
    if (!hasVoiceFor(bcp, voices)) { showToast(noVoiceMessage(langName), "error"); return; }

    // Tal for den madpas-profil der reelt er valgt (kan være et familiemedlem),
    // ikke altid den loggede bruger selv — ellers fortæller talefunktionen
    // tjeneren OM DEN FORKERTE PERSONS allergier, mens tekst-kortet på skærmen
    // (App.jsx' mpAllergens/mpCustom) korrekt viser den valgte profil
    const activeProfile = madpasProfileId && madpasProfileId !== "self"
      ? family?.find(m => m.id === madpasProfileId)
      : null;
    const speakAllergens = activeProfile ? (activeProfile.allergens || []) : allergens;
    const speakCustom = activeProfile ? (activeProfile.custom || []) : customAllerg;
    // Samme rettelse som allergener/custom herover (26. sept. 2026, Madpas-
    // redesign) — kost fulgte tidligere ALTID den loggede bruger selv, også
    // når man taler for et familiemedlems madpas. E-numre er fjernet helt
    // fra Madpas (opfølgende polish-runde, samme dag) — en tjener har ikke
    // brug for at høre E-nummer-koder oplæst.

    const text = madpasText.madpasSpeechText({ lang, speakAllergens, speakCustom, crossContact: madpasCrossContact });

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = bcp;
    utter.rate = 0.85;
    let started = false;
    let timer = null;
    utter.onstart = () => { started = true; clearTimeout(timer); setMadpasSpeaking(true); };
    utter.onend = () => { clearTimeout(timer); setMadpasSpeaking(false); };
    utter.onerror = (e) => {
      clearTimeout(timer);
      setMadpasSpeaking(false);
      // "canceled"/"interrupted" er brugerens eget stop eller et skærmskift, ikke en fejl
      if (e?.error === "canceled" || e?.error === "interrupted") return;
      showToast(e?.error === "language-unavailable" ? noVoiceMessage(langName) : "Oplæsningen kunne ikke starte. Prøv igen, eller vis skærmen til tjeneren.", "error");
    };
    window.speechSynthesis.speak(utter);
    // Nogle telefoner siger hverken start eller fejl, når stemmen mangler
    timer = setTimeout(() => {
      if (started) return;
      window.speechSynthesis.cancel();
      setMadpasSpeaking(false);
      showToast(noVoiceMessage(langName), "error");
    }, SPEAK_START_TIMEOUT_MS);
  };

  return { madpasSpeaking, setMadpasSpeaking, madpasWaiterView, setMadpasWaiterView, langOpen, setLangOpen, madpasSpeak };
}
