import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // uden forvekslelige tegn (0/O, 1/I/L)
function generateCode() {
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

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

  // Alle brugere caller deler en "familiegruppe" med (sig selv + alle der
  // har accepteret/sendt en family_invite til/fra caller) — samme gruppe
  // RLS-politikkerne for type='family'-lister bruger.
  async function callerFamilyGroup() {
    const { data } = await supabase.rpc("family_group", { p_uid: caller.id });
    return (data ?? []).map((r) => (typeof r === "string" ? r : r.family_group));
  }

  // En liste kan tilgås af sin ejer, af hele ejerens familiegruppe (hvis
  // listen er type='family'), eller af en bruger med en
  // shopping_list_access-række (permission "edit" kræves for skrivning).
  async function canAccessList(listId, requireEdit) {
    const { data: list } = await supabase
      .from("shopping_lists").select("owner_id, type").eq("id", listId).single();
    if (!list) return false;
    if (list.owner_id === caller.id) return true;
    if (list.type === "family") {
      const group = await callerFamilyGroup();
      if (group.includes(list.owner_id)) return true;
    }
    const { data: access } = await supabase
      .from("shopping_list_access").select("permission")
      .eq("list_id", listId).eq("user_id", caller.id).maybeSingle();
    if (!access) return false;
    return requireEdit ? access.permission === "edit" : true;
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const method = req.method;

  // Identificer om vi arbejder med items, adgang, medlemmer eller lister
  const isItems = parts.includes("items");
  const isAccess = parts.includes("access");
  const isJoin = parts[parts.length - 1] === "join";
  const isFamilyMembers = parts[parts.length - 1] === "family-members";
  const itemId = isItems ? parts[parts.length - 1] : null;
  const accessUserId = isAccess && parts[parts.length - 1] !== "access" ? parts[parts.length - 1] : null;
  const listId = isItems
    ? parts[parts.indexOf("items") - 1]
    : isAccess
    ? parts[parts.indexOf("access") - 1]
    : (isJoin || isFamilyMembers || parts[parts.length - 1] === "shopping")
    ? null
    : parts[parts.length - 1];

  try {
    // ─────────────────────────────────────
    // FAMILIEGRUPPE (til "vælg personer"-vælgeren)
    // ─────────────────────────────────────

    if (method === "GET" && isFamilyMembers) {
      const group = (await callerFamilyGroup()).filter((id) => id !== caller.id);
      if (group.length === 0) {
        return new Response(JSON.stringify({ success: true, members: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: members, error } = await supabase
        .from("users").select("id, name, email").in("id", group);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, members }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────
    // TILSLUT VIA KODE
    // ─────────────────────────────────────

    if (method === "POST" && isJoin) {
      const { code } = await req.json();
      if (!code) return new Response(JSON.stringify({ error: "code er påkrævet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: list } = await supabase
        .from("shopping_lists").select("id, owner_id, name").eq("share_link", code.trim().toUpperCase()).maybeSingle();
      if (!list) return new Response(JSON.stringify({ error: "Ugyldig kode" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (list.owner_id === caller.id) return new Response(JSON.stringify({ error: "Du er allerede ejer af denne liste" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { error } = await supabase
        .from("shopping_list_access")
        .upsert({ list_id: list.id, user_id: caller.id, permission: "edit" }, { onConflict: "list_id,user_id" });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(JSON.stringify({ success: true, list }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────
    // ADGANG (delt med udvalgte personer)
    // ─────────────────────────────────────

    // GET — hvem har adgang til listen (kun ejeren)
    if (method === "GET" && isAccess && !accessUserId) {
      const { data: list } = await supabase.from("shopping_lists").select("owner_id").eq("id", listId).single();
      if (!list || list.owner_id !== caller.id) return new Response(JSON.stringify({ error: "Kun ejeren kan se listens adgang" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: access, error } = await supabase
        .from("shopping_list_access").select("user_id, permission, granted_at, users(name, email)").eq("list_id", listId);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, access }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST — giv en bruger adgang (kun ejeren)
    if (method === "POST" && isAccess && !accessUserId) {
      const { user_id, permission } = await req.json();
      if (!user_id) return new Response(JSON.stringify({ error: "user_id er påkrævet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: list } = await supabase.from("shopping_lists").select("owner_id").eq("id", listId).single();
      if (!list || list.owner_id !== caller.id) return new Response(JSON.stringify({ error: "Kun ejeren kan give adgang til listen" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: access, error } = await supabase
        .from("shopping_list_access")
        .upsert({ list_id: listId, user_id, permission: permission === "read" ? "read" : "edit" }, { onConflict: "list_id,user_id" })
        .select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, access }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // DELETE — fjern en brugers adgang (kun ejeren)
    if (method === "DELETE" && isAccess && accessUserId) {
      const { data: list } = await supabase.from("shopping_lists").select("owner_id").eq("id", listId).single();
      if (!list || list.owner_id !== caller.id) return new Response(JSON.stringify({ error: "Kun ejeren kan fjerne adgang til listen" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { error } = await supabase.from("shopping_list_access").delete().eq("list_id", listId).eq("user_id", accessUserId);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────
    // LISTER
    // ─────────────────────────────────────

    // GET — hent alle lister brugeren har adgang til (egne + familiedelte + eksplicit delte)
    if (method === "GET" && !listId && !isItems && !isAccess) {
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

      const group = await callerFamilyGroup();
      const { data: accessRows } = await supabase.from("shopping_list_access").select("list_id").eq("user_id", userId);
      const sharedListIds = (accessRows ?? []).map((r) => r.list_id);

      let query = supabase
        .from("shopping_lists")
        .select("*, shopping_list_items(*)")
        .order("created_at", { ascending: false });

      const orParts = [`owner_id.eq.${userId}`];
      if (group.length > 1) orParts.push(`and(type.eq.family,owner_id.in.(${group.filter((id) => id !== userId).join(",")}))`);
      if (sharedListIds.length > 0) orParts.push(`id.in.(${sharedListIds.join(",")})`);
      query = query.or(orParts.join(","));

      const { data: lists, error } = await query;

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
    if (method === "POST" && !listId && !isItems && !isAccess && !isJoin) {
      const { owner_id, name, type } = await req.json();

      if (!owner_id || !name) return new Response(JSON.stringify({ error: "owner_id og name er påkrævet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (owner_id !== caller.id) return new Response(JSON.stringify({ error: "Ikke autoriseret til denne bruger" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Prøv et par gange for at undgå kollision med en eksisterende kode
      let list, error;
      for (let attempt = 0; attempt < 5; attempt++) {
        ({ data: list, error } = await supabase
          .from("shopping_lists")
          .insert({
            owner_id,
            name,
            type: type === "family" ? "family" : "personal",
            share_link: generateCode(),
          })
          .select()
          .single());
        if (!error) break;
      }

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
      const { name, product_id, ean, image_url, quantity, added_by, store } = await req.json();

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
          ean: ean ?? null,
          image_url: image_url ?? null,
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
