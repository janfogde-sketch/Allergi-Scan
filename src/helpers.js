// @ts-nocheck
import { ALLERGENS, SUPABASE_ANON_KEY } from "./constants.jsx";

// ─── HJÆLPEFUNKTIONER ────────────────────────────────────────────────────────

export const initials = n => (n||"").split(" ").filter(Boolean).map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";
export const timeAgo = ts => { const d=Date.now()-new Date(ts).getTime(); if(d<60000)return"Lige nu"; if(d<3600000)return`${Math.floor(d/60000)} min siden`; if(d<86400000)return`${Math.floor(d/3600000)} t siden`; return`${Math.floor(d/86400000)} d siden`; };
export const getAllergenLabels = (ids,custom=[]) => [...ids.map(id=>ALLERGENS.find(a=>a.id===id)).filter(Boolean).map(a=>`${a.emoji} ${a.label}`),...custom.map(c=>`✏️ ${c}`)];
export const verifiedBadge = (v, source) => {
  if (v==="verified"||v===true) return {label:"✓ Verificeret",bg:"rgba(34,197,94,.1)",color:"#16a34a"};
  if (v==="partial") return {label:"⚡ Delvist verificeret",bg:"rgba(217,119,6,.08)",color:"#d97706"};
  return {label:"Open Food Facts",bg:"rgba(37,99,235,.06)",color:"#2563eb"};
};

// ─── SUPABASE API-HJÆLPER ────────────────────────────────────────────────────
export function makeHeaders(token) {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

export async function apiCall(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// ─── ALLERGEN SAMMENLIGNING ──────────────────────────────────────────────────
export function compareAllergens(flags, activeAllergenIds) {
  if (!flags || activeAllergenIds.length === 0) return { status:"safe", matchedDanger:[], matchedWarning:[], hasUnknown:false, confidence:"high", explanation:[] };
  const matchedDanger = [];
  const matchedWarning = [];
  let hasUnknown = false;
  const explanation = []; // Forklaring på HVORFOR et produkt er usikkert

  for (const id of activeAllergenIds) {
    const val = flags[id];
    // Håndter boolean (recipes) og string (produkter)
    if (val === true || val === "yes") {
      matchedDanger.push(id);
      explanation.push({ allergen: id, reason: "direkte", severity: "high" });
    } else if (val === "traces") {
      matchedWarning.push(id);
      explanation.push({ allergen: id, reason: "spor", severity: "medium" });
    } else if (val === "unknown" || val === null || val === undefined) {
      hasUnknown = true;
    }
  }

  let status = "safe";
  if (matchedDanger.length > 0) status = "danger";
  else if (matchedWarning.length > 0) status = "warn";

  // Confidence score baseret på datakvalitet
  let confidence = "high";
  if (hasUnknown) confidence = "medium";
  if (Object.keys(flags).length === 0) confidence = "low";
  if (Object.values(flags).every(v => v === null || v === undefined)) confidence = "low";

  return { status, matchedDanger, matchedWarning, hasUnknown, confidence, explanation };
}
