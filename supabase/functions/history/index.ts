import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const identifier = parts[parts.length - 1] === "history" ? null : parts[parts.length - 1];
  const method = req.method;

  try {
    // GET — hent brugerens scanhistorik
    if (method === "GET" && !identifier) {
      const userId = url.searchParams.get("user_id");
      const limit = parseInt(url.searchParams.get("limit") ?? "50");
      const offset = parseInt(url.searchParams.get("offset") ?? "0");

      if (!userId) return new Response(
        JSON.stringify({ error: "user_id er påkrævet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      const { data: scans, error, count } = await supabase
        .from("scan_history")
        .select("*, products(id, name, brand, image_url)", { count: "exact" })
        .eq("user_id", userId)
        .order("scanned_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      return new Response(
        JSON.stringify({ success: true, scans, total: count }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET — hent én scanning
    if (method === "GET" && identifier) {
      const { data: scan, error } = await supabase
        .from("scan_history")
        .select("*, products(id, name, brand, image_url)")
        .eq("id", identifier)
        .single();

      if (error || !scan) return new Response(
        JSON.stringify({ error: "Scanning ikke fundet" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      return new Response(
        JSON.stringify({ success: true, scan }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST — gem ny scanning
    if (method === "POST") {
      const {
        user_id, ean_scanned, product_id,
        active_profiles, result, flags_triggered
      } = await req.json();

      if (!user_id || !ean_scanned || !result) return new Response(
        JSON.stringify({ error: "user_id, ean_scanned og result er påkrævet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      const { data: scan, error } = await supabase
        .from("scan_history")
        .insert({
          user_id,
          ean_scanned,
          product_id: product_id ?? null,
          active_profiles: active_profiles ?? null,
          result,
          flags_triggered: flags_triggered ?? null,
        })
        .select()
        .single();

      if (error) return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      return new Response(
        JSON.stringify({ success: true, scan }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE — ryd historik for en bruger
    if (method === "DELETE") {
      const userId = url.searchParams.get("user_id");

      if (!userId) return new Response(
        JSON.stringify({ error: "user_id er påkrævet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      const { error } = await supabase
        .from("scan_history")
        .delete()
        .eq("user_id", userId);

      if (error) return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      return new Response(
        JSON.stringify({ success: true, message: "Historik slettet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ikke fundet" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
