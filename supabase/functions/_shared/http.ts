// Fælles HTTP-hjælpere til edge-funktionerne: CORS-headere og login-tjek.
// Værdierne er de samme, som funktionerne tidligere havde kopieret ind hver for sig.
import { createClient } from "jsr:@supabase/supabase-js@2.117.2";

const CORS_BASE = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** CORS-headere. Uden `methods` sendes ingen Allow-Methods-header (som før i de funktioner, der ikke havde den). */
export function corsFor(methods?: string): Record<string, string> {
  return methods ? { ...CORS_BASE, "Access-Control-Allow-Methods": methods } : { ...CORS_BASE };
}

/** Finder den indloggede bruger ud fra Authorization-headeren (bruger-scopet klient med anon-nøglen). Null uden gyldigt login. */
export async function getCaller(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  return user ?? null;
}
