// @ts-nocheck
// Vurdering af én historikpost mod brugerens NUVÆRENDE valg og produktets NUVÆRENDE allergenflag (9. okt. 2026, Bjørn). Delt mellem Historik (rækkens
// statuslinje) og Profil (tallene i "Din aktivitet"), så de to skærme aldrig er uenige om, hvad en scanning var. Gør ingen tekst, kun vurderingen.
import { buildActiveProfileList, evaluateProductForProfiles } from "./helpers.js";

/**
 * kind: "not_found" (intet produkt at vurdere) | "no_profiles" (ingen kendt valgt profil) | "evaluated".
 * Ved "evaluated": ev = resultat fra evaluateProductForProfiles (level danger/warn/unknown/safe), hasLive = produktets nuværende allergenflag findes.
 * Uden nuværende flag bruges flagene fra scanningstidspunktet, og et "safe" er da kun historisk, aldrig bekræftet.
 * ctx.profilesReady === false: profilen er ikke hentet, så "safe" bliver "unknown" (se evaluateProductForProfiles, 17. okt. 2026).
 * @param {any} h @param {{ user: any, family: any[], allergens: string[], customAllerg: any[], selectedENumbers: any[], activeProfiles: string[], profilesReady?: boolean }} ctx
 */
export function evaluateHistoryEntry(h, ctx) {
  const rawStatus = h.result || h.status;
  const ids = (h.active_profiles && h.active_profiles.length) ? h.active_profiles : ctx.activeProfiles;
  const profiles = buildActiveProfileList({ user: ctx.user, family: ctx.family, allergens: ctx.allergens, customAllerg: ctx.customAllerg, selectedENumbers: ctx.selectedENumbers, activeProfiles: ids });
  if (rawStatus === "not_found") return { kind: "not_found", ids, profiles };
  if (profiles.length === 0) return { kind: "no_profiles", ids, profiles };
  const liveFlags = h.products?.allergen_flags;
  const hasLive = !!liveFlags && typeof liveFlags === "object" && Object.keys(liveFlags).length > 0;
  const flags = hasLive ? liveFlags : (h.flags_triggered || {});
  const ev = evaluateProductForProfiles(profiles, { allergen_flags: flags, ingredients_text: h.products?.ingredients_text || "" }, { profilesReady: ctx.profilesReady });
  return { kind: "evaluated", ids, profiles, ev, hasLive };
}
