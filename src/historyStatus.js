// @ts-nocheck

// ── Historik/Favoritter: status-sprog, kompakt filter ───────────────────────
// Samme grøn/rød/orange-farvesprog og ikon+tekst+farve-mønster som
// Indkøbslistens itemStatus (ListScreen.jsx) — én kilde til hvad "Allergi-advarsel"/
// "Kan indeholde spor"/"Passer til" betyder på tværs af appen, ikke en
// selvstændig kopi af logikken. Delt mellem Historik og Favoritter (26.
// sept. 2026, opfølgning) — samme tekst/farve/ikon uanset hvilken skærm der
// viser statussen. "not_found" er specifikt for Historik (et scan der ikke
// gav noget produkt at vurdere) og findes ikke i Indkøbslisten/Favoritter.
export const STATUS_COLOR = { danger:"var(--red)", warn:"var(--amber)", safe:"var(--green)", not_found:"var(--muted)" };
export const STATUS_ICON  = { danger:"warning", warn:"warning", safe:"check", not_found:"info" };
export const HISTORY_FILTERS = [
  { id:"all",       label:"Alle" },
  { id:"safe",      label:"Ingen match" },
  { id:"danger",    label:"Allergi-advarsel" },
  { id:"warn",      label:"Øvrige advarsler" },
  { id:"not_found", label:"Ikke fundet" },
];
