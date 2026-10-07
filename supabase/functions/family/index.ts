import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Verificér at den kaldende bruger faktisk er logget ind — uden dette
  // kunne enhver læse/oprette/redigere/slette en hvilken som helst
  // brugers familiedata.
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
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const method = req.method;

  const isGroup = parts.includes("group");
  const groupUserId = isGroup && parts[parts.length - 1] !== "group" ? parts[parts.length - 1] : null;
  const isMembers = parts.includes("members");
  const memberId = isMembers ? parts[parts.length - 1] === "members" ? null : parts[parts.length - 1] : null;

  try {
    // ─────────────────────────────────────
    // HUSSTAND (family_invites-baseret — de rigtige konti, du har inviteret
    // via invitationen, adskilt fra family_members-profilerne)
    // ─────────────────────────────────────

    // GET — hent min husstand (mig + alle jeg har inviteret/er inviteret af).
    // canRemove er kun true for medlemmer CALLER selv oprindeligt inviterede
    // — kun den oprindelige "admin" af en given forbindelse kan fjerne den.
    // Returnerer nu også hvert medlems allergener/kostpræferencer/E-numre
    // (26. sept. 2026, Familie-redesign — "brugeren skal med ét blik kunne
    // se, hvad profilen faktisk bliver kontrolleret imod ved scanning" gælder
    // alle familiemedlemmer, ikke kun administrerede profiler). Kun læsning,
    // ingen redigeringsret følger med — retten til selv at styre sin egen
    // konto ligger hos personen selv (se CLAUDE.md's rettigheds-afsnit).
    if (method === "GET" && isGroup && !groupUserId) {
      const { data: groupRows } = await supabase.rpc("family_group", { p_uid: caller.id });
      const group = (groupRows ?? []).map((r: string | { family_group: string }) => (typeof r === "string" ? r : r.family_group)).filter((id: string) => id !== caller.id);

      if (group.length === 0) {
        return new Response(JSON.stringify({ success: true, members: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: members, error } = await supabase
        .from("users").select("id, name, email, diets, e_numbers, allergen_levels").in("id", group);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: invitedByMe } = await supabase
        .from("family_invites").select("accepted_by")
        .eq("status", "accepted").eq("invited_by", caller.id).in("accepted_by", group);
      const adminOf = new Set((invitedByMe ?? []).map((r) => r.accepted_by));

      const { data: allergenRows } = await supabase
        .from("user_allergens").select("user_id, allergen, type")
        .in("user_id", group).is("family_member_id", null);
      const allergensByUser = new Map();
      for (const row of allergenRows ?? []) {
        if (!allergensByUser.has(row.user_id)) allergensByUser.set(row.user_id, { allergens: [], custom: [] });
        const bucket = allergensByUser.get(row.user_id);
        if (row.type === "custom") bucket.custom.push(row.allergen); else bucket.allergens.push(row.allergen);
      }

      const withPermissions = (members ?? []).map((m) => ({
        ...m,
        canRemove: true, // begge sider i en forbindelse kan afslutte den (26. okt.: også den inviterede)
        invitedByMe: adminOf.has(m.id),
        allergens: allergensByUser.get(m.id)?.allergens ?? [],
        custom: allergensByUser.get(m.id)?.custom ?? [],
        diets: m.diets ?? [],
        eNumbers: m.e_numbers ?? [],
        allergenLevels: m.allergen_levels ?? {},
      }));
      return new Response(JSON.stringify({ success: true, members: withPermissions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // DELETE — afslut forbindelsen til et familiemedlem. Begge sider kan gøre det (den der inviterede, og den der accepterede),
    // så ingen sidder fast i en familie, de ikke vil være en del af.
    if (method === "DELETE" && isGroup && groupUserId) {
      const { data: link } = await supabase
        .from("family_invites").select("id")
        .eq("status", "accepted")
        .or(`and(invited_by.eq.${caller.id},accepted_by.eq.${groupUserId}),and(invited_by.eq.${groupUserId},accepted_by.eq.${caller.id})`)
        .maybeSingle();
      if (!link) return new Response(
        JSON.stringify({ error: "Denne konto er ikke i din familie" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      const { error } = await supabase.from("family_invites").delete().eq("id", link.id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      // "I mister adgang til hinandens delte data": fjern også udvalgt/link-adgang til hinandens indkøbslister
      for (const [owner, other] of [[caller.id, groupUserId], [groupUserId, caller.id]]) {
        const { data: ownerLists } = await supabase.from("shopping_lists").select("id").eq("owner_id", owner);
        const ids = (ownerLists ?? []).map((l) => l.id);
        if (ids.length > 0) await supabase.from("shopping_list_access").delete().in("list_id", ids).eq("user_id", other);
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────
    // STYREDE PROFILER (family_members)
    // ─────────────────────────────────────

    // POST — tilføj styret profil
    if (method === "POST" && isMembers && !memberId) {
      const { user_id, name, color } = await req.json();
      if (!user_id || !name) return new Response(JSON.stringify({ error: "user_id og name er påkrævet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (user_id !== caller.id) return new Response(JSON.stringify({ error: "Ikke autoriseret til denne bruger" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: member, error } = await supabase
        .from("family_members")
        .insert({ user_id, name, color: color ?? null })
        .select()
        .single();

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true, member }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PATCH — opdater styret profil
    if (method === "PATCH" && isMembers && memberId) {
      const { data: memberOwner } = await supabase.from("family_members").select("user_id").eq("id", memberId).single();
      if (!memberOwner || memberOwner.user_id !== caller.id) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til denne profil" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      const body = await req.json();
      const { data: member, error } = await supabase
        .from("family_members")
        .update(body)
        .eq("id", memberId)
        .select()
        .single();

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true, member }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE — slet styret profil
    if (method === "DELETE" && isMembers && memberId) {
      const { data: memberOwner } = await supabase.from("family_members").select("user_id").eq("id", memberId).single();
      if (!memberOwner || memberOwner.user_id !== caller.id) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til denne profil" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", memberId);

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
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
