// Ren logik for samtykke til helbredsoplysninger (GDPR art. 9, stk. 2, litra a), 2. okt. 2026.
// Selve samtykket logges af serveren (RPC give_health_consent / withdraw_health_consent, tabellen consent_log).

// Udledes af den nyeste række i consent_log (sorteret faldende, højst én hentet).
export function consentFromRows(rows) {
  const r = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  if (!r) return { given: false, at: null, version: null };
  return { given: r.action === "given", at: r.created_at || null, version: r.version || null };
}

// Forældet samtykke: givet på en ældre version af samtykketeksten end den nuværende. Versionen i constants.jsx hæves KUN, når
// selve samtykketeksten ændres væsentligt (se healthConsent.test.js, der binder teksten til versionen). Ændringer i politikken alene
// kræver ikke nyt samtykke. Dataene bevares; brugeren bliver bedt om at bekræfte på ny ved næste gem (og kan se det i Indstillinger).
export function isConsentStale({ given, version }, currentVersion) {
  return Boolean(given) && version !== currentVersion;
}

// Samtykke kræves, når brugeren er ved at gemme allergier/intolerancer (eller andre helbredsoplysninger) og ikke har givet det.
export function needsHealthConsent({ hasHealthData, given }) {
  return Boolean(hasHealthData) && !given;
}

// Må brugeren gå videre/gemme? Kryds i boksen eller et allerede givet samtykke.
export function canSaveHealthData({ hasHealthData, given, checked }) {
  return !needsHealthConsent({ hasHealthData, given }) || Boolean(checked);
}

// Primær tekst (selve samtykket) og sekundær tekst (om tilbagetrækning) vises på to niveauer i HealthConsentBox, så de er lette at skimme.
export const HEALTH_CONSENT_TEXT =
  "Jeg giver udtrykkeligt samtykke til, at EatSafe behandler mine allergi-, intolerance- og andre helbredsoplysninger " +
  "for at give mig personlige produktkontroller og advarsler.";
export const HEALTH_CONSENT_WITHDRAW_TEXT =
  "Du kan til enhver tid trække samtykket tilbage under Indstillinger → Privatliv & data.";

// Samtykke til en profil, der tilhører en ANDEN person (familiemodel: administrerede underprofiler). Kontoejeren må ikke sige "mine":
// teksten tilpasses, hvem oplysningerne vedrører. Børn (under 18): forælder/værge-erklæring. Voksne: personens eget udtrykkelige samtykke
// (voksne bør helst inviteres, så de selv styrer deres oplysninger, se Familie). `age` er et tal eller en tekst, tom = ukendt.
export function memberConsentTexts({ name, age } = {}) {
  const who = (name || "").trim() || "personen";
  const poss = /[sxz]$/i.test(who) ? `${who}'` : `${who}s`;
  const isChild = String(age ?? "") !== "" && Number(age) < 18;
  const text = isChild
    ? `Jeg bekræfter, at jeg er forælder eller værge for ${who}, og at jeg må registrere ${poss} allergi-, intolerance- og andre helbredsoplysninger i EatSafe for at give personlige produktkontroller og advarsler.`
    : `Jeg bekræfter, at ${who} har givet sit udtrykkelige samtykke til, at jeg registrerer ${poss} allergi-, intolerance- og andre helbredsoplysninger i EatSafe for at give personlige produktkontroller og advarsler.`;
  return { text, sub: "Du kan til enhver tid rette eller slette profilen under Familie.", isChild };
}
