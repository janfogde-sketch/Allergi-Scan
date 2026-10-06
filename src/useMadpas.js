// @ts-nocheck
import { useState } from "react";
import { visibleDiets } from "./helpers.js";
import { ALLERGENS, MADPAS_LANGUAGES, ALLERGEN_T, ALLERGEN_EXAMPLES, DIETS, DIET_T, MADPAS_SAFETY_NOTE_T, MADPAS_ALLERGY_STATEMENT_T, MADPAS_EN_DERIVED, MADPAS_EXAMPLES_OVERRIDE, MADPAS_CROSS_CONTACT_SINGULAR_T, MADPAS_CROSS_CONTACT_PLURAL_T, MADPAS_DIET_MESSAGE_T, MADPAS_COELIAC_T, MADPAS_SPEECH_INTRO_T, MADPAS_SPEECH_CANNOT_T, MADPAS_SPEECH_OUTRO_T } from "./constants.jsx";

// ALLERGEN_T har ingen "da"-nøgle (dansk er allerede ALLERGENS' eget
// a.label, se konstantens egen kommentar) — uden dette faldt et valgt
// "Dansk" madpas fejlagtigt tilbage til den ENGELSKE allergen-tekst, mens
// resten af UI'et var dansk (26. sept. 2026, Madpas-redesign, fundet og
// rettet: "det må aldrig forekomme at UI'et er oversat til ét sprog, mens
// allergennavnet bliver stående på [et andet]"). Samme hjælpefunktion
// bruges i MadpasScreen.jsx.
export function madpasAllergenLabel(a, lang) {
  if (!a) return null;
  if (lang === "da") return a.label;
  return ALLERGEN_T[a.id]?.[lang]?.n || ALLERGEN_T[a.id]?.en?.n || a.label;
}
export function madpasDietLabel(dietId, lang) {
  const d = DIETS.find(x => x.id === dietId);
  if (!d) return null;
  if (lang === "da") return d.label;
  return DIET_T[dietId]?.[lang] || DIET_T[dietId]?.en || d.label;
}
// Kort, tydelig besked til personalet pr. diæt (27. sept. 2026, Madpas-
// finpolish, krav 1-2) — diæter skal have samme type besked som allergier,
// ikke kun vises som badges. Se MADPAS_DIET_MESSAGE_T i constants.jsx.
export function madpasDietMessage(dietId, lang) {
  const messages = MADPAS_DIET_MESSAGE_T[dietId];
  if (!messages) return "";
  return messages[lang] || messages.en || "";
}
// Korte, oversatte fødevare-eksempler til Madpas' tjener-visning/PDF/
// offentlige side (26. sept. 2026, Madpas-redesign, afsnit 8-10) — "Fx:
// Bread, Pasta, Cakes" under selve allergenet, IKKE en fuld/garanteret
// liste. Kombinerer products+ingredients (samme datasæt som allerede
// findes i ALLERGEN_EXAMPLES) og begrænser til 4 stk., så det forbliver
// kompakt selv med flere allergener.
export function madpasAllergenExamples(allergenId, lang) {
  const override = MADPAS_EXAMPLES_OVERRIDE[allergenId];
  if (override) return override[lang] || override.en;
  const ex = ALLERGEN_EXAMPLES[allergenId === "coeliaki" ? "gluten" : allergenId];
  if (!ex) return [];
  const products = ex.products?.[lang] || ex.products?.en || [];
  const ingredients = ex.ingredients?.[lang] || ex.ingredients?.en || [];
  // Hævet fra 4 til 5 (27. sept. 2026, Madpas-finpolish, krav 6) — behøvedes
  // for at "Valle"/"Whey" (mælkeallergiens 5. eksempel) reelt kommer frem,
  // da de 4 products alene allerede fyldte den tidligere grænse.
  return [...products, ...ingredients].slice(0, 5);
}
// Sikkerheds-sætning PR. ENKELT allergen/fritekst-emne i FØDEVARE-
// ALLERGIER (27. sept. 2026, Madpas-finpolish, krav 4 — "genereres
// dynamisk for den konkrete allergi"). `name` er det allerede-oversatte
// label (IKKE selve id'et) — indsættes overalt hvor skabelonen har
// {name} (kan forekomme flere gange, se MADPAS_SAFETY_NOTE_T).
// Navnet sænkes til små bogstaver midt i sætningen ("ikke indeholder
// jordnødder") — undtagen på tysk, hvor navneord altid skrives med stort
// ("kein Erdnüsse", ikke "erdnüsse").
function inlineName(name, lang) {
  return lang === "de" ? name : name.toLowerCase();
}
export function madpasSafetyNote(name, lang, allergenId) {
  if (!name) return "";
  if (allergenId === "coeliaki") return (MADPAS_COELIAC_T[lang] || MADPAS_COELIAC_T.en).safety;
  // Engelsk, fast allergen: "does not contain milk or any milk-derived ingredients".
  const derived = (lang === "en" || !MADPAS_SAFETY_NOTE_T[lang]) && allergenId && MADPAS_EN_DERIVED[allergenId];
  if (derived) return `Please make sure my food does not contain ${inlineName(name, "en")} or any ${derived}\u2011derived ingredients.`; // ikke-brydende bindestreg
  const template = MADPAS_SAFETY_NOTE_T[lang] || MADPAS_SAFETY_NOTE_T.en;
  return template.split("{name}").join(inlineName(name, lang));
}
// "I have a food allergy to milk." — første, direkte sætning pr. allergi.
export function madpasAllergyStatement(name, lang, allergenId) {
  if (!name) return "";
  if (allergenId === "coeliaki") return (MADPAS_COELIAC_T[lang] || MADPAS_COELIAC_T.en).statement;
  const template = MADPAS_ALLERGY_STATEMENT_T[lang] || MADPAS_ALLERGY_STATEMENT_T.en;
  return template.split("{name}").join(inlineName(name, lang));
}
// Krydskontaminerings-sætning (krav 7) — ÉN kombineret sætning for hele
// fødevareallergi-sektionen, singular ved ét hensyn ("with milk"), plural
// ("with these allergens") ved flere. `names` er de allerede-oversatte
// labels for alt i allergi-sektionen (rigtige allergener + fritekst).
// Kun kaldt når brugeren selv har aktiveret indstillingen — se
// madpasCrossContact i App.jsx.
export function madpasCrossContactNote(names, lang) {
  if (!names || names.length === 0) return "";
  if (names.length === 1) {
    const template = MADPAS_CROSS_CONTACT_SINGULAR_T[lang] || MADPAS_CROSS_CONTACT_SINGULAR_T.en;
    return template.replace("{name}", inlineName(names[0], lang));
  }
  return MADPAS_CROSS_CONTACT_PLURAL_T[lang] || MADPAS_CROSS_CONTACT_PLURAL_T.en;
}

export function useMadpas({ allergens, customAllerg, user, madpasLang, family, madpasProfileId, madpasCrossContact }) {
  const [madpasSpeaking, setMadpasSpeaking] = useState(false);
  const [madpasWaiterView, setMadpasWaiterView] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const madpasSpeak = () => {
    if (!window.speechSynthesis) return;
    if (madpasSpeaking) { window.speechSynthesis.cancel(); setMadpasSpeaking(false); return; }
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

    const parts = [];
    parts.push(MADPAS_SPEECH_INTRO_T[lang] || MADPAS_SPEECH_INTRO_T.en);

    // Ægte allergener (type "allergi") + fritekst får hver deres egen
    // fulde sikkerheds-sætning (samme tekst som vises på skærmen, se
    // madpasSafetyNote()) — intolerancer nævnes samlet uden den sætning,
    // matcher den visuelle opdeling (INTOLERANCES har ingen sikkerheds-
    // tekst, kun FOOD ALLERGIES). "May be found in" oplæses bevidst
    // IKKE (27. sept. 2026, krav 8: "behøver ikke nødvendigvis læses op,
    // hvis det gør beskeden unødigt lang").
    const allergyEntries = [];
    const intoleranceNames = [];
    speakAllergens.filter(id => typeof id === "string").forEach(id => {
      const a = ALLERGENS.find(x => x.id === id);
      if (!a) return;
      const label = madpasAllergenLabel(a, lang);
      if (a.type === "allergi" || id === "coeliaki") allergyEntries.push({ name: label, id });
      else intoleranceNames.push(label);
    });
    speakCustom.filter(c => typeof c === "string" && !speakAllergens.includes(c)).forEach(c => allergyEntries.push({ name: c }));
    // Cøliaki-budskabet dækker allerede spor, så den indgår ikke i krydskontaminerings-sætningen.
    const allergyNames = allergyEntries.filter(e => e.id !== "coeliaki").map(e => e.name);

    // Samme to sætninger som på skærmen: "I have a food allergy to milk."
    // + "Please make sure my food contains no milk or milk-derived ingredients."
    allergyEntries.forEach(e => parts.push(madpasAllergyStatement(e.name, lang, e.id) + " " + madpasSafetyNote(e.name, lang, e.id)));
    // Krydskontaminering oplæses KUN hvis brugeren selv har aktiveret den
    // (krav 7 — må aldrig vises/oplæses automatisk for alle).
    if (madpasCrossContact && allergyNames.length > 0) {
      parts.push(madpasCrossContactNote(allergyNames, lang));
    }
    if (intoleranceNames.length > 0) {
      parts.push((MADPAS_SPEECH_CANNOT_T[lang] || MADPAS_SPEECH_CANNOT_T.en) + ": " + intoleranceNames.join(", "));
    }

    if (speakDiets.length > 0) {
      const dietNames = speakDiets.map(d => madpasDietLabel(d, lang)).filter(Boolean).join(", ");
      parts.push(dietNames);
    }
    parts.push(MADPAS_SPEECH_OUTRO_T[lang] || MADPAS_SPEECH_OUTRO_T.en);

    const utter = new SpeechSynthesisUtterance(parts.join(". "));
    utter.lang = bcp;
    utter.rate = 0.85;
    utter.onstart = () => setMadpasSpeaking(true);
    utter.onend = () => setMadpasSpeaking(false);
    utter.onerror = () => setMadpasSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  return { madpasSpeaking, setMadpasSpeaking, madpasWaiterView, setMadpasWaiterView, langOpen, setLangOpen, madpasSpeak };
}
