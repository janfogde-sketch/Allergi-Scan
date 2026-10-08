// @ts-nocheck
import { useState } from "react";
import { visibleDiets } from "./helpers.js";
import { MADPAS_LANGUAGES } from "./constants.jsx";

// Madpas-teksterne (madpasText.js) er store og indlæses først, når Madpas-skærmen
// åbnes. Skærmen kalder preloadMadpasText(), så oplæsningen kan køre synkront
// på knaptrykket (iPhone kræver, at talen starter direkte fra trykket).
let madpasText = null;
export function preloadMadpasText() {
  return import("./madpasText.js").then(m => (madpasText = m));
}

export function useMadpas({ allergens, customAllerg, user, madpasLang, family, madpasProfileId, madpasCrossContact }) {
  const [madpasSpeaking, setMadpasSpeaking] = useState(false);
  const [madpasWaiterView, setMadpasWaiterView] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const madpasSpeak = () => {
    if (!window.speechSynthesis) return;
    if (madpasSpeaking) { window.speechSynthesis.cancel(); setMadpasSpeaking(false); return; }
    if (!madpasText) { preloadMadpasText().then(() => madpasSpeak()); return; }
    const lang = madpasLang;
    const bcp = MADPAS_LANGUAGES.find(l => l.code === lang)?.bcp || "en-US";

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
    const speakDiets = visibleDiets(activeProfile ? activeProfile.diets : user.diets);

    const text = madpasText.madpasSpeechText({ lang, speakAllergens, speakCustom, speakDiets, crossContact: madpasCrossContact });

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = bcp;
    utter.rate = 0.85;
    utter.onstart = () => setMadpasSpeaking(true);
    utter.onend = () => setMadpasSpeaking(false);
    utter.onerror = () => setMadpasSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  return { madpasSpeaking, setMadpasSpeaking, madpasWaiterView, setMadpasWaiterView, langOpen, setLangOpen, madpasSpeak };
}
