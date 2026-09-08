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

  // Verificér at den kaldende bruger faktisk er logget ind — ellers kan
  // enhver læse/oprette/redigere/slette en hvilken som helst brugers
  // indkøbsliste ved blot at kende eller gætte et owner_id/list_id.
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

  // En liste kan tilgås af sin ejer, eller af en bruger med en
  // shopping_list_access-række (permission "edit" kræves for skrivning).
  async function canAccessList(listId, requireEdit) {
    const { data: list } = await supabase
      .from("shopping_lists").select("owner_id").eq("id", listId).single();
    if (!list) return false;
    if (list.owner_id === caller.id) return true;
    const { data: access } = await supabase
      .from("shopping_list_access").select("permission")
      .eq("list_id", listId).eq("user_id", caller.id).maybeSingle();
    if (!access) return false;
    return requireEdit ? access.permission === "edit" : true;
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const method = req.method;

  // Identificer om vi arbejder med items eller lister
  const isItems = parts.includes("items");
  const itemId = isItems ? parts[parts.length - 1] : null;
  const listId = isItems
    ? parts[parts.indexOf("items") - 1]
    : parts[parts.length - 1] === "shopping"
    ? null
    : parts[parts.length - 1];

  try {
    // ─────────────────────────────────────
    // LISTER
    // ─────────────────────────────────────

    // GET — hent alle lister for en bruger
    if (method === "GET" && !listId && !isItems) {
      const userId = url.searchParams.get("user_id");
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "user_id er påkrævet" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (userId !== caller.id) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til denne brugers lister" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      const { data: lists, error } = await supabase
        .from("shopping_lists")
        .select("*, shopping_list_items(*)")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true, lists }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET — hent én liste med punkter
    if (method === "GET" && listId && !isItems) {
      if (!(await canAccessList(listId, false))) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til denne liste" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      const { data: list, error } = await supabase
        .from("shopping_lists")
        .select("*, shopping_list_items(*)")
        .eq("id", listId)
        .single();

      if (error || !list) return new Response(JSON.stringify({ error: "Liste ikke fundet" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true, list }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST — opret ny liste
    if (method === "POST" && !listId && !isItems) {
      const { owner_id, name, type, family_id } = await req.json();

      if (!owner_id || !name) return new Response(JSON.stringify({ error: "owner_id og name er påkrævet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (owner_id !== caller.id) return new Response(JSON.stringify({ error: "Ikke autoriseret til denne bruger" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const shareLink = crypto.randomUUID();

      const { data: list, error } = await supabase
        .from("shopping_lists")
        .insert({
          owner_id,
          name,
          type: type ?? "personal",
          family_id: family_id ?? null,
          share_link: shareLink,
        })
        .select()
        .single();

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true, list }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PATCH — opdater liste
    if (method === "PATCH" && listId && !isItems) {
      if (!(await canAccessList(listId, true))) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til at redigere denne liste" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      const body = await req.json();

      const { data: list, error } = await supabase
        .from("shopping_lists")
        .update({ ...body, updated_at: new Date() })
        .eq("id", listId)
        .select()
        .single();

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true, list }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE — slet liste (kun ejeren, ikke delte redaktører)
    if (method === "DELETE" && listId && !isItems) {
      const { data: ownerCheck } = await supabase
        .from("shopping_lists").select("owner_id").eq("id", listId).single();
      if (!ownerCheck || ownerCheck.owner_id !== caller.id) return new Response(
        JSON.stringify({ error: "Kun ejeren kan slette denne liste" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      const { error } = await supabase
        .from("shopping_lists")
        .delete()
        .eq("id", listId);

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────
    // LISTEPUNKTER
    // ─────────────────────────────────────

    // GET — hent alle punkter på en liste
    if (method === "GET" && isItems && listId) {
      if (!(await canAccessList(listId, false))) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til denne liste" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      const { data: items, error } = await supabase
        .from("shopping_list_items")
        .select("*")
        .eq("list_id", listId)
        .order("added_at", { ascending: true });

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true, items }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST — tilføj punkt til liste
    if (method === "POST" && isItems && listId) {
      const { name, product_id, quantity, added_by, store } = await req.json();

      if (!name || !added_by) return new Response(JSON.stringify({ error: "name og added_by er påkrævet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (added_by !== caller.id) return new Response(JSON.stringify({ error: "Ikke autoriseret til denne bruger" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!(await canAccessList(listId, true))) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til at redigere denne liste" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      const { data: item, error } = await supabase
        .from("shopping_list_items")
        .insert({
          list_id: listId,
          name,
          product_id: product_id ?? null,
          quantity: quantity ?? 1,
          checked: false,
          added_by,
          store: store ?? null,
        })
        .select()
        .single();

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true, item }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PATCH — opdater punkt (afkryds, skift antal osv.)
    if (method === "PATCH" && isItems && itemId !== listId) {
      if (!(await canAccessList(listId, true))) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til at redigere denne liste" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      const body = await req.json();

      const { data: item, error } = await supabase
        .from("shopping_list_items")
        .update(body)
        .eq("id", itemId)
        .select()
        .single();

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true, item }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE — slet punkt fra liste
    if (method === "DELETE" && isItems && itemId !== listId) {
      if (!(await canAccessList(listId, true))) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til at redigere denne liste" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      const { error } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("id", itemId);

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true }),
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
