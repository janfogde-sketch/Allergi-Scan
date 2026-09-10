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

  // Verificér at den kaldende bruger faktisk er logget ind, og at det
  // JWT'en beviser matcher det user_id anmodningen forsøger at tilgå.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(
    JSON.stringify({ error: "Ikke autoriseret" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user: caller } } = await userClient.auth.getUser();
  if (!caller) return new Response(
    JSON.stringify({ error: "Ikke autoriseret" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );

  async function callerFamilyGroup() {
    const { data } = await supabase.rpc("family_group", { p_uid: caller.id });
    return (data ?? []).map((r) => (typeof r === "string" ? r : r.family_group));
  }

  const url = new URL(req.url);
  const method = req.method;

  try {
    // GET — hent favoritter (egne, eller hele familiens med scope=family)
    if (method === "GET") {
      const userId = url.searchParams.get("user_id");
      const scope = url.searchParams.get("scope");

      if (!userId) return new Response(
        JSON.stringify({ error: "user_id er påkrævet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      if (userId !== caller.id) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til denne brugers favoritter" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      const ownerIds = scope === "family" ? await callerFamilyGroup() : [userId];

      const { data: favorites, error } = await supabase
        .from("favorites")
        .select("id, user_id, ean, product_snapshot, added_at, users(name)")
        .in("user_id", ownerIds)
        .order("added_at", { ascending: false });

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(JSON.stringify({ success: true, favorites }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST — tilføj favorit
    if (method === "POST") {
      const { user_id, ean, product_snapshot } = await req.json();
      if (!user_id || !ean || !product_snapshot) return new Response(
        JSON.stringify({ error: "user_id, ean og product_snapshot er påkrævet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      if (user_id !== caller.id) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til denne bruger" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      const { data: favorite, error } = await supabase
        .from("favorites")
        .upsert({ user_id, ean, product_snapshot }, { onConflict: "user_id,ean" })
        .select()
        .single();

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(JSON.stringify({ success: true, favorite }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // DELETE — fjern favorit (kun egen)
    if (method === "DELETE") {
      const userId = url.searchParams.get("user_id");
      const ean = url.searchParams.get("ean");
      if (!userId || !ean) return new Response(
        JSON.stringify({ error: "user_id og ean er påkrævet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      if (userId !== caller.id) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til denne bruger" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("ean", ean);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Ikke fundet" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
