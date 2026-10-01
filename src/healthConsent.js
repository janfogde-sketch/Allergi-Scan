// Ren logik for samtykke til helbredsoplysninger (GDPR art. 9, stk. 2, litra a), 2. okt. 2026.
// Selve samtykket logges af serveren (RPC give_health_consent / withdraw_health_consent, tabellen consent_log).

// Udledes af den nyeste række i consent_log (sorteret faldende, højst én hentet).
export function consentFromRows(rows) {
  const r = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  if (!r) return { given: false, at: null, version: null };
  return { given: r.action === "given", at: r.created_at || null, version: r.version || null };
}

// Samtykke kræves, når brugeren er ved at gemme allergier/intolerancer (eller andre helbredsoplysninger) og ikke har givet det.
export function needsHealthConsent({ hasHealthData, given }) {
  return Boolean(hasHealthData) && !given;
}

// Må brugeren gå videre/gemme? Kryds i boksen eller et allerede givet samtykke.
export function canSaveHealthData({ hasHealthData, given, checked }) {
  return !needsHealthConsent({ hasHealthData, given }) || Boolean(checked);
}

export const HEALTH_CONSENT_TEXT =
  "Jeg giver udtrykkeligt samtykke til, at EatSafe behandler de allergi-, intolerance- og andre helbredsoplysninger, jeg registrerer, " +
  "for at give mig personlige produktkontroller og advarsler. Jeg kan til enhver tid trække samtykket tilbage under Indstillinger → Privatliv & data.";
