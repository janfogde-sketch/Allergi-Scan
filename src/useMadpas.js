// @ts-nocheck
import { useState } from "react";
import { ALLERGENS, MADPAS_LANGUAGES, ALLERGEN_T, ALLERGEN_EXAMPLES, DIETS, DIET_T } from "./constants.jsx";

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
// Korte, oversatte fødevare-eksempler til Madpas' tjener-visning/PDF/
// offentlige side (26. sept. 2026, Madpas-redesign, afsnit 8-10) — "Fx:
// Bread, Pasta, Cakes" under selve allergenet, IKKE en fuld/garanteret
// liste. Kombinerer products+ingredients (samme datasæt som allerede
// findes i ALLERGEN_EXAMPLES) og begrænser til 4 stk., så det forbliver
// kompakt selv med flere allergener.
export function madpasAllergenExamples(allergenId, lang) {
  const ex = ALLERGEN_EXAMPLES[allergenId];
  if (!ex) return [];
  const products = ex.products?.[lang] || ex.products?.en || [];
  const ingredients = ex.ingredients?.[lang] || ex.ingredients?.en || [];
  return [...products, ...ingredients].slice(0, 4);
}

export function useMadpas({ allergens, customAllerg, selectedENumbers, user, madpasLang, family, madpasProfileId }) {
  const [madpasSpeaking, setMadpasSpeaking] = useState(false);
  const [madpasBig, setMadpasBig] = useState(false);
  const [madpasWaiterView, setMadpasWaiterView] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const madpasSpeak = () => {
    if (!window.speechSynthesis) return;
    if (madpasSpeaking) { window.speechSynthesis.cancel(); setMadpasSpeaking(false); return; }
    const lang = madpasLang;
    const bcp = MADPAS_LANGUAGES.find(l => l.code === lang)?.bcp || "en-US";

    const introText = {
      da:"Hej! Jeg har nogle fødevareallergier og ønsker gerne din hjælp til at finde noget, jeg kan spise trygt.",
      en:"Hi! I have some food allergies and would love your help finding something safe for me to eat.",
      de:"Hallo! Ich habe einige Lebensmittelallergien und würde mich über Ihre Hilfe freuen.",
      fr:"Bonjour ! J'ai des allergies alimentaires et j'aurais besoin de votre aide.",
      es:"¡Hola! Tengo algunas alergias alimentarias y agradecería su ayuda.",
      it:"Ciao! Ho alcune allergie alimentari e apprezzerei il suo aiuto.",
      nl:"Hallo! Ik heb wat voedselallergieën en zou graag uw hulp willen.",
      pt:"Olá! Tenho algumas alergias alimentares e gostaria da sua ajuda.",
      pl:"Cześć! Mam kilka alergii pokarmowych i chciałbym prosić o pomoc.",
      sv:"Hej! Jag har några matallergier och skulle uppskatta din hjälp.",
      no:"Hei! Jeg har noen matallergier og ønsker gjerne din hjelp.",
      ja:"こんにちは！食物アレルギーがあります。安全な食事を見つけるお手伝いをお願いできますか。",
      zh:"您好！我有食物过敏，希望您能帮助我找到安全的食物。",
      ar:"مرحباً! لدي بعض الحساسية الغذائية وأود مساعدتك في إيجاد شيء آمن لي.",
      tr:"Merhaba! Gıda alerjilerim var ve güvenli bir şey bulmam için yardımınıza ihtiyacım var.",
      el:"Γεια σας! Έχω κάποιες αλλεργίες τροφίμων και θα εκτιμούσα τη βοήθειά σας.",
    };
    const cannotText = {
      da:"Jeg kan ikke spise", en:"I cannot eat", de:"Ich kann nicht essen",
      fr:"Je ne peux pas manger", es:"No puedo comer", it:"Non posso mangiare",
      nl:"Ik kan niet eten", pt:"Não posso comer", pl:"Nie mogę jeść",
      sv:"Jag kan inte äta", no:"Jeg kan ikke spise", ja:"食べられません",
      zh:"我不能吃", ar:"لا أستطيع تناول", tr:"Yiyemiyorum", el:"Δεν μπορώ να φάω",
    };
    const outroText = {
      da:"Tak for din hjælp — det betyder rigtig meget for mig.",
      en:"Thank you so much for your help — it means a lot to me.",
      de:"Vielen Dank für Ihre Hilfe — das bedeutet mir sehr viel.",
      fr:"Merci beaucoup pour votre aide — cela compte beaucoup pour moi.",
      es:"Muchas gracias por su ayuda — significa mucho para mí.",
      it:"Grazie mille per il suo aiuto — significa molto per me.",
      nl:"Heel erg bedankt voor uw hulp — dat betekent veel voor mij.",
      pt:"Muito obrigado pela sua ajuda — significa muito para mim.",
      pl:"Bardzo dziękuję za pomoc — wiele dla mnie znaczy.",
      sv:"Tack så mycket för din hjälp — det betyder mycket för mig.",
      no:"Tusen takk for hjelpen — det betyr mye for meg.",
      ja:"ご協力ありがとうございます。本当に助かります。",
      zh:"非常感谢您的帮助，对我来说意义重大。",
      ar:"شكراً جزيلاً على مساعدتك — هذا يعني لي الكثير.",
      tr:"Yardımınız için çok teşekkür ederim — bu benim için çok şey ifade ediyor.",
      el:"Σας ευχαριστώ πολύ για τη βοήθειά σας — σημαίνει πολλά για μένα.",
    };

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
    // redesign) — kost/E-numre fulgte tidligere ALTID den loggede bruger
    // selv, også når man taler for et familiemedlems madpas.
    const speakDiets = activeProfile ? (activeProfile.diets || []) : (user.diets || []);
    const speakENumbers = activeProfile ? (activeProfile.eNumbers || []) : (selectedENumbers || []);

    const parts = [];
    parts.push(introText[lang] || introText.en);

    const allItems = [...speakAllergens, ...speakCustom.filter(c => !speakAllergens.includes(c))];
    allItems.forEach((item, i) => {
      if (typeof item !== "string") return;
      const a = ALLERGENS.find(x => x.id === item);
      const label = a ? madpasAllergenLabel(a, lang) : item;
      const ex = a ? ALLERGEN_EXAMPLES[item] : null;
      const exProducts = ex?.products?.[lang] || ex?.products?.en || [];
      const exIngredients = ex?.ingredients?.[lang] || ex?.ingredients?.en || [];
      const exText = [...exProducts.slice(0,3), ...exIngredients.slice(0,4)].join(", ");
      const prefix = i === 0 ? (cannotText[lang] || cannotText.en) + ": " : "";
      parts.push(prefix + label + (exText ? ". " + exText : ""));
    });

    if (speakDiets.length > 0) {
      const dietNames = speakDiets.map(d => madpasDietLabel(d, lang)).filter(Boolean).join(", ");
      parts.push(dietNames);
    }
    if (speakENumbers.length > 0) {
      parts.push(speakENumbers.join(", "));
    }
    parts.push(outroText[lang] || outroText.en);

    const utter = new SpeechSynthesisUtterance(parts.join(". "));
    utter.lang = bcp;
    utter.rate = 0.85;
    utter.onstart = () => setMadpasSpeaking(true);
    utter.onend = () => setMadpasSpeaking(false);
    utter.onerror = () => setMadpasSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  return { madpasSpeaking, setMadpasSpeaking, madpasBig, setMadpasBig, madpasWaiterView, setMadpasWaiterView, langOpen, setLangOpen, madpasSpeak };
}
