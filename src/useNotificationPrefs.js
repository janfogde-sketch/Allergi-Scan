// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useNotificationPrefs.js
// Styrer brugerens per-kategori/per-kanal notifikationsindstillinger
// (notification_preferences-tabellen). Manglende række for en given
// (kategori, kanal) betyder kategoriens standard (til, undtagen shared_lists og onboarding_reminder) — se notification_enabled() i
// databasen, som al reel afsendelse (DB-triggers + send-push) slår op mod.
// Denne hook er kun til at VISE/ÆNDRE indstillingerne i UI'et.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";

// Rækkefølgen her styrer visningsrækkefølgen i UI'et. "welcome" findes også
// som en reel mail (send_welcome_after_onboarding), men er en engangs-besked
// efter færdig onboarding — ikke noget en bruger meningsfuldt kan slå fra/til, så den
// er bevidst udeladt af listen brugeren ser.
// Labels finpudset (28. sept. 2026, Indstillinger-forbedring) til mere
// naturlig/præcis microcopy — "id" (bruges som databasenøgle) er UÆNDRET
// for alle fem, kun de synlige "label"-tekster er rettet.
export const NOTIFICATION_CATEGORIES = [
  { id: "submission_status", label: "Indsendte produkter", description: "Når en indsendelse du har lavet bliver godkendt eller afvist" },
  { id: "missing_product_found", label: "Efterspurgte produkter", description: "Når et produkt du har ledt efter, men ikke fundet, bliver tilføjet" },
  { id: "family", label: "Familieinvitationer", description: "Svar på dine invitationer og anmodninger om at blive forbundet" },
  { id: "feedback", label: "Svar på feedback", description: "Når en henvendelse, du har sendt, får svar eller ny status" },
  { id: "weekly_digest", label: "Ugentlig opskriftsoversigt", description: "En ugentlig påmindelse om nye opskrifter der matcher dine allergier", live: false }, // skjult, mens Opskrifter er på pause (F1-10)
  // Tilføjet 30. sept. 2026 (notifikations-redesign). `defaultOn` skal matche notification_enabled() i
  // databasen. `live:false` = kategorien findes i databasen, men der sendes endnu ikke noget i den, så den
  // vises ikke i Indstillinger (ingen kontakter, der ikke gør noget). Sæt live:true, når afsendelsen er bygget.
  { id: "shared_lists", label: "Delte indkøbslister", description: "Når andre tilføjer varer til en indkøbsliste, du deler", defaultOn: false },
  { id: "product_changes", label: "Ændringer i dine produkter", description: "Når allergenoplysninger ændres for et produkt, du har gemt eller scannet" },
  { id: "recalls", label: "Tilbagekaldelser", description: "Når et produkt, du har brugt, bliver tilbagekaldt. Du får altid en besked i appen; her vælger du push og mail." },
  { id: "onboarding_reminder", label: "Påmindelse om oprettelse", description: "En engangspåmindelse, hvis du ikke er færdig med at oprette din profil", defaultOn: false, live: false },
];

const CHANNELS = ["push", "email"];

function defaultPrefs() {
  const prefs = {};
  for (const cat of NOTIFICATION_CATEGORIES) {
    for (const ch of CHANNELS) prefs[`${cat.id}:${ch}`] = cat.defaultOn !== false;
  }
  return prefs;
}

export function useNotificationPrefs({ accessToken, userId }) {
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [loading, setLoading] = useState(true);
  // Pr.-toggle loading-state, så kun den trykkede switch viser "i gang",
  // ikke hele listen.
  const [savingKeys, setSavingKeys] = useState({});

  const load = useCallback(async () => {
    if (!accessToken || !userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const rows = await apiCall(
        `${SUPABASE_URL}/rest/v1/notification_preferences?select=category,channel,enabled`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      const next = defaultPrefs();
      if (Array.isArray(rows)) {
        for (const r of rows) next[`${r.category}:${r.channel}`] = r.enabled;
      }
      setPrefs(next);
    } catch (e) {
      console.warn("[useNotificationPrefs] load fejl:", e);
    }
    setLoading(false);
  }, [accessToken, userId]);

  useEffect(() => { load(); }, [load]);

  // Upsert — sparse tabel, kun rækker for eksplicit satte værdier gemmes
  // (se tabel-kommentaren i migrationen). Optimistisk UI, ruller tilbage
  // ved fejl.
  const setPref = useCallback(async (category, channel, enabled) => {
    const key = `${category}:${channel}`;
    const prev = prefs[key];
    setPrefs(p => ({ ...p, [key]: enabled }));
    setSavingKeys(s => ({ ...s, [key]: true }));
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/notification_preferences`, {
        method: "POST",
        headers: {
          ...makeHeaders(accessToken),
          "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({ user_id: userId, category, channel, enabled }),
      });
    } catch (e) {
      console.warn("[useNotificationPrefs] setPref fejl:", e);
      setPrefs(p => ({ ...p, [key]: prev }));
      showToast("Indstillingen kunne ikke gemmes. Tjek din forbindelse og prøv igen.", "error");
    }
    setSavingKeys(s => { const n = { ...s }; delete n[key]; return n; });
  }, [accessToken, userId, prefs]);

  return { prefs, loading, savingKeys, setPref, categories: NOTIFICATION_CATEGORIES.filter(c => c.live !== false) };
}
