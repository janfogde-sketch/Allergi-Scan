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
  async function callerMembership(famId) {
    const { data } = await supabase
      .from("family_memberships").select("role")
      .eq("family_id", famId).eq("user_id", caller.id).eq("status", "active").maybeSingle();
    return data;
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const method = req.method;

  const isGroup = parts.includes("group");
  const groupUserId = isGroup && parts[parts.length - 1] !== "group" ? parts[parts.length - 1] : null;
  const isMembers = parts.includes("members");
  const isInvite = parts.includes("invite");
  const memberId = isMembers ? parts[parts.length - 1] === "members" ? null : parts[parts.length - 1] : null;
  const inviteId = isInvite ? parts[parts.length - 1] === "invite" ? null : parts[parts.length - 1] : null;
  const familyId = !isMembers && !isInvite && !isGroup ? parts[parts.length - 1] === "family" ? null : parts[parts.length - 1] : null;

  try {
    // ─────────────────────────────────────
    // HUSSTAND (family_invites-baseret — de rigtige konti, du har inviteret
    // via invitationslinket, adskilt fra family_members-profilerne)
    // ─────────────────────────────────────

    // GET — hent min husstand (mig + alle jeg har inviteret/er inviteret af).
    // canRemove er kun true for medlemmer CALLER selv oprindeligt inviterede
    // — kun den oprindelige "admin" af en given forbindelse kan fjerne den.
    if (method === "GET" && isGroup && !groupUserId) {
      const { data: groupRows } = await supabase.rpc("family_group", { p_uid: caller.id });
      const group = (groupRows ?? []).map((r) => (typeof r === "string" ? r : r.family_group)).filter((id) => id !== caller.id);

      if (group.length === 0) {
        return new Response(JSON.stringify({ success: true, members: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: members, error } = await supabase
        .from("users").select("id, name, email").in("id", group);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: invitedByMe } = await supabase
        .from("family_invites").select("accepted_by")
        .eq("status", "accepted").eq("invited_by", caller.id).in("accepted_by", group);
      const adminOf = new Set((invitedByMe ?? []).map((r) => r.accepted_by));

      const withPermissions = (members ?? []).map((m) => ({ ...m, canRemove: adminOf.has(m.id) }));
      return new Response(JSON.stringify({ success: true, members: withPermissions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // DELETE — fjern et medlem af husstanden. Kun den der oprindeligt sendte
    // invitationen (husstandens "admin" for den forbindelse) kan gøre dette —
    // et medlem, der selv blev inviteret, kan ikke fjerne andre.
    if (method === "DELETE" && isGroup && groupUserId) {
      const { data: link } = await supabase
        .from("family_invites").select("id")
        .eq("status", "accepted").eq("invited_by", caller.id).eq("accepted_by", groupUserId).maybeSingle();
      if (!link) return new Response(
        JSON.stringify({ error: "Kun den der inviterede dette medlem kan fjerne det" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      const { error } = await supabase.from("family_invites").delete().eq("id", link.id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────
    // FAMILIE
    // ─────────────────────────────────────

    // GET — hent brugerens familie
    if (method === "GET" && !isMembers && !isInvite) {
      const userId = url.searchParams.get("user_id");
      if (!userId) return new Response(JSON.stringify({ error: "user_id er påkrævet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (userId !== caller.id) return new Response(JSON.stringify({ error: "Ikke autoriseret til denne brugers familie" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: memberships } = await supabase
        .from("family_memberships")
        .select("family_id")
        .eq("user_id", userId)
        .eq("status", "active");

      const familyIds = memberships?.map(m => m.family_id) ?? [];

      const { data: families, error } = await supabase
        .from("families")
        .select("*, family_memberships(*), family_members(*)")
        .in("id", familyIds.length > 0 ? familyIds : ["00000000-0000-0000-0000-000000000000"]);

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true, families }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST — opret familie
    if (method === "POST" && !isMembers && !isInvite && !familyId) {
      const { name, created_by } = await req.json();
      if (!name || !created_by) return new Response(JSON.stringify({ error: "name og created_by er påkrævet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (created_by !== caller.id) return new Response(JSON.stringify({ error: "Ikke autoriseret til denne bruger" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: family, error: familyError } = await supabase
        .from("families")
        .insert({ name, created_by })
        .select()
        .single();

      if (familyError) return new Response(JSON.stringify({ error: familyError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Opret ejeren som aktivt medlem
      await supabase
        .from("family_memberships")
        .insert({
          family_id: family.id,
          user_id: created_by,
          role: "owner",
          status: "active",
          joined_at: new Date(),
        });

      return new Response(
        JSON.stringify({ success: true, family }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE — slet familie (kun ejeren)
    if (method === "DELETE" && familyId && !isMembers && !isInvite) {
      const membership = await callerMembership(familyId);
      if (!membership || membership.role !== "owner") return new Response(
        JSON.stringify({ error: "Kun familiens ejer kan slette familien" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      await supabase.from("family_memberships").delete().eq("family_id", familyId);
      await supabase.from("family_members").delete().eq("user_id", familyId);
      const { error } = await supabase.from("families").delete().eq("id", familyId);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // ─────────────────────────────────────
    // INVITATIONER
    // ─────────────────────────────────────

    // POST — inviter medlem
    if (method === "POST" && isInvite && !inviteId) {
      const { family_id, user_id, managed_member_id } = await req.json();
      if (!family_id) return new Response(JSON.stringify({ error: "family_id er påkrævet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!(await callerMembership(family_id))) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til at invitere til denne familie" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      const { data: membership, error } = await supabase
        .from("family_memberships")
        .insert({
          family_id,
          user_id: user_id ?? null,
          managed_member_id: managed_member_id ?? null,
          role: "member",
          status: "invited",
        })
        .select()
        .single();

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true, membership }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PATCH — accepter eller afvis invitation
    if (method === "PATCH" && isInvite && inviteId) {
      const { status } = await req.json();
      if (!status) return new Response(JSON.stringify({ error: "status er påkrævet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: inviteRow } = await supabase.from("family_memberships").select("user_id").eq("id", inviteId).single();
      if (!inviteRow || inviteRow.user_id !== caller.id) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til denne invitation" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      const { data: membership, error } = await supabase
        .from("family_memberships")
        .update({
          status,
          joined_at: status === "active" ? new Date() : null,
        })
        .eq("id", inviteId)
        .select()
        .single();

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(
        JSON.stringify({ success: true, membership }),
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
