// Genkender svar fra billedlæsningen, der IKKE er en ingrediensliste (16. okt. 2026, fejlrapport fra "Produkt ikke fundet").
// AI'en svarede med en forklaring ("Jeg kan desværre ikke læse ingredienslisten klart nok ...") i stedet for en tom streng.
// Forklaringen blev brugt som ingrediensliste, og allergenanalysen gav "nej" til alle allergener: et falsk "ingen allergener".
// Bruges af ocr- og allergens-funktionerne og af appen, så en ulæselig læsning aldrig bliver til ingredienser eller "nej".

/** Det ord, ocr-prompten beder AI'en svare med, når ingredienslisten ikke kan læses. */
export const OCR_UNREADABLE_MARKER = "ULÆSELIG";

// Forklaringer og undskyldninger i starten af svaret (dansk og engelsk).
const REFUSAL_START = /^(jeg kan(?: desværre)? ikke|jeg kunne(?: desværre)? ikke|desværre|beklager|det er (?:desværre )?ikke muligt|billedet (?:er|viser)|der er ingen ingrediensliste|i can(?:'|’|no)t|i cannot|i'm sorry|i am sorry|sorry|unfortunately)/i;
// Sætninger, der aldrig står på en ingrediensliste, men typisk i en forklaring.
const REFUSAL_ANYWHERE = /(ikke læse ingrediens|kan ikke (?:se|finde|læse|skelne)|klarere billede|tydeligere billede|nyt billede|bedre billede|i can(?:'|’|no)t read)/i;

/** true, når teksten fra billedlæsningen er tom eller en forklaring i stedet for en ingrediensliste. */
export function isUnreadableOcrText(text) {
  const t = String(text ?? "").trim();
  if (!t) return true;
  if (t.toLocaleUpperCase("da-DK").includes(OCR_UNREADABLE_MARKER)) return true;
  return REFUSAL_START.test(t) || REFUSAL_ANYWHERE.test(t);
}
