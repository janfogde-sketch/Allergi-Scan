// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// food-waste — Supabase Edge Function
// PROTOTYPE (17. sept. 2026). Tjekker om et scannet produkt (via EAN) er
// nedsat pga. snarlig udløbsdato ("madspild") i en nærliggende Netto/Føtex/
// Bilka-butik, via Salling Group's officielle, gratis "Anti Food Waste" API
// (https://developer.sallinggroup.dev/apireference/food-waste). IKKE
// eTilbudsavis/tilbudsaviser — det er en anden, ulovlig-at-scrape kilde,
// vurderet og fravalgt (se SECURITY_TODO.md/CLAUDE.md for begrundelsen).
//
// Kræver Supabase secret SALLING_API_TOKEN (gratis nøgle fra
// https://developer.sallinggroup.com). Uden den svarer funktionen bevidst
// med { available:false, reason:"not_configured" } (200, ikke en fejl), så
// frontenden kan skjule featuren i stedet for at vise en fejl.
//
// Auth-kategori (se .claude/rules/edge-function-auth.md): "Kræver
// bruger-login" — personlig, lokations-baseret opslag, intet der bør
// eksponeres anonymt.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SALLING_API = "https://api.sallinggroup.com/v1/food-waste";
const DEFAULT_RADIUS_KM = 5;
const MAX_RADIUS_KM = 20;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Salling Groups faktiske respons-facon er ikke fuldt verificeret her (ingen
// levende API-nøgle i denne session) — tolerant udpakning af et par
// sandsynlige former i stedet for at antage én bestemt struktur. Justér
// denne funktion efter det første rigtige svar er set.
function extractClearances(store: any): any[] {
  return store?.clearances || store?.clearance || [];
}

function matchesEan(clearance: any, ean: string): boolean {
  const productEan =
    clearance?.product?.ean ||
    clearance?.offer?.ean ||
    clearance?.ean;
  return productEan === ean;
}

function normalizeMatch(store: any, clearance: any) {
  const product = clearance?.product || {};
  const offer = clearance?.offer || clearance;
  return {
    storeId: store?.id || store?.store?.id || null,
    storeName: store?.name || store?.store?.name || "Ukendt butik",
    storeAddress: store?.address
      ? [store.address.street, store.address.zip, store.address.city].filter(Boolean).join(", ")
      : null,
    productName: product.description || product.name || null,
    originalPrice: offer?.originalPrice ?? offer?.original_price ?? null,
    newPrice: offer?.newPrice ?? offer?.new_price ?? offer?.price ?? null,
    currency: offer?.currency || "DKK",
    stock: offer?.stock ?? null,
    endTime: offer?.endTime || offer?.end_time || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return json({ error: "Kun GET er understøttet" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Ikke autoriseret" }, 401);

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user: caller } } = await userClient.auth.getUser();
  if (!caller) return json({ error: "Ikke autoriseret" }, 401);

  const sallingToken = Deno.env.get("SALLING_API_TOKEN");
  if (!sallingToken) {
    return json({ available: false, reason: "not_configured" });
  }

  const url = new URL(req.url);
  const ean = (url.searchParams.get("ean") || "").trim();
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  const radiusParam = parseInt(url.searchParams.get("radius") || "", 10);
  const radius = Number.isFinite(radiusParam) && radiusParam > 0
    ? Math.min(radiusParam, MAX_RADIUS_KM)
    : DEFAULT_RADIUS_KM;

  if (!/^\d{6,14}$/.test(ean)) {
    return json({ error: "Gyldigt EAN er påkrævet" }, 400);
  }
  if (!lat || !lon) {
    return json({ error: "lat/lon er påkrævet" }, 400);
  }

  try {
    const sallingRes = await fetch(
      `${SALLING_API}?geo=${encodeURIComponent(lat)},${encodeURIComponent(lon)}&radius=${radius}`,
      { headers: { Authorization: `Bearer ${sallingToken}` } }
    );

    if (!sallingRes.ok) {
      // Fejl hos Salling (fx rate limit) skal aldrig crashe scan-resultatet —
      // vis blot "intet fundet" fremfor en fejl i UI'et.
      return json({ available: true, matches: [] });
    }

    const stores = await sallingRes.json();
    const matches: any[] = [];

    for (const store of (Array.isArray(stores) ? stores : [])) {
      for (const clearance of extractClearances(store)) {
        if (matchesEan(clearance, ean)) {
          matches.push(normalizeMatch(store, clearance));
        }
      }
    }

    return json({ available: true, matches });
  } catch (e) {
    return json({ available: true, matches: [], error: e.message });
  }
});
