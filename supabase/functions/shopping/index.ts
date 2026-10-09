import { createClient } from "jsr:@supabase/supabase-js@2.117.2";
import { withinUserLimit } from "../_shared/apiUsage.ts";
import { corsFor, getCaller } from "../_shared/http.ts";

const corsHeaders = corsFor("GET, POST, PATCH, DELETE, OPTIONS");

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // uden forvekslelige tegn (0/O, 1/I/L); 32 tegn deler 256 op uden skævhed
const CODE_LENGTH = 10; // ca. 1,1 billiard koder (ældre lister har stadig 6 tegn, indtil ejeren laver nyt link)
function generateCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  let code = "";
  for (const b of bytes) code += CODE_CHARS[b % CODE_CHARS.length];
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

  // Varer gemmer billedadressen fra det øjeblik, de blev lagt på listen. Manglede produktet billedet dengang, eller er det ændret
  // siden, viste listen et ikon, mens historikken viste billedet. Mangler en vare billedet, hentes det derfor live fra produktet.
  // deno-lint-ignore no-explicit-any
  const withProductImages = async (items: any[] | null | undefined) => {
    const list = items ?? [];
    const ids = [...new Set(list.filter((i) => !i.image_url && i.product_id).map((i) => i.product_id))];
    if (!ids.length) return list;
    const { data: prods } = await supabase.from("products").select("id, image_url").in("id", ids);
    const img = new Map((prods ?? []).filter((p) => p.image_url).map((p) => [p.id, p.image_url]));
    return list.map((i) => !i.image_url && img.has(i.product_id) ? { ...i, image_url: img.get(i.product_id) } : i);
  };

  // Verificér at den kaldende bruger faktisk er logget ind — ellers kan
  // enhver læse/oprette/redigere/slette en hvilken som helst brugers
  // indkøbsliste ved blot at kende eller gætte et owner_id/list_id.
  const caller = await getCaller(req);
  if (!caller) return new Response(
    JSON.stringify({ error: "Ikke autoriseret" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );

  // Forsøg på at slå en listekode op tælles pr. konto (mod gætning); normal brug er 1-2 forsøg om dagen.
  function codeLimitResponse() {
    return new Response(JSON.stringify({ error: "For mange forsøg i dag. Prøv igen i morgen.", code: "daily_limit" }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Alle brugere caller deler en "familiegruppe" med (sig selv + alle der
  // har accepteret/sendt en family_invite til/fra caller) — samme gruppe
  // RLS-politikkerne for type='family'-lister bruger.
  async function callerFamilyGroup() {
    const { data } = await supabase.rpc("family_group", { p_uid: caller!.id });
    return (data ?? []).map((r: string | { family_group: string }) => (typeof r === "string" ? r : r.family_group));
  }

  // En liste kan tilgås af sin ejer, af hele ejerens familiegruppe (hvis
  // listen er type='family'), eller af en bruger med en
  // shopping_list_access-række (permission "edit" kræves for skrivning).
  async function canAccessList(listId: string | null, requireEdit?: boolean) {
    const { data: list } = await supabase
      .from("shopping_lists").select("owner_id, type").eq("id", listId).single();
    if (!list) return false;
    if (list.owner_id === caller!.id) return true;
    if (list.type === "family") {
      const group = await callerFamilyGroup();
      if (group.includes(list.owner_id)) return true;
    }
    const { data: access } = await supabase
      .from("shopping_list_access").select("permission")
      .eq("list_id", listId).eq("user_id", caller!.id).maybeSingle();
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
  const isRotate = parts[parts.length - 1] === "rotate-code";
  const isHide = parts[parts.length - 1] === "hide";
  const isPreview = parts[parts.length - 1] === "preview";
  const itemId = isItems ? parts[parts.length - 1] : null;
  const accessUserId = isAccess && parts[parts.length - 1] !== "access" ? parts[parts.length - 1] : null;
  const listId = isItems
    ? parts[parts.indexOf("items") - 1]
    : isAccess
    ? parts[parts.indexOf("access") - 1]
    : isRotate || isHide
    ? parts[parts.length - 2]
    : (isJoin || isFamilyMembers || isPreview || parts[parts.length - 1] === "shopping")
    ? null
    : parts[parts.length - 1];

  try {
    // ─────────────────────────────────────
    // FAMILIEGRUPPE (til "vælg personer"-vælgeren)
    // ─────────────────────────────────────

    if (method === "GET" && isFamilyMembers) {
      const group = (await callerFamilyGroup()).filter((id: string) => id !== caller.id);
      if (group.length === 0) {
        return new Response(JSON.stringify({ success: true, members: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: members, error } = await supabase
        .from("users").select("id, name, email").in("id", group);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, members }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────
    // FORHÅNDSVISNING AF EN LISTEKODE (til bekræftelsen, før man tilslutter)
    // ─────────────────────────────────────

    // Kun for indloggede brugere (ikke offentligt): listenavn og ejerens fornavn, og om man allerede har adgang.
    if (method === "GET" && isPreview) {
      const code = (url.searchParams.get("code") ?? "").trim().toUpperCase();
      if (!code) return new Response(JSON.stringify({ error: "code er påkrævet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!(await withinUserLimit(supabase, caller.id, "list_code"))) return codeLimitResponse();
      const { data: list } = await supabase
        .from("shopping_lists").select("id, owner_id, name, type").eq("share_link", code).maybeSingle();
      if (!list) return new Response(JSON.stringify({ error: "Ugyldig kode" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: owner } = await supabase.from("users").select("name").eq("id", list.owner_id).maybeSingle();
      const { data: access } = await supabase
        .from("shopping_list_access").select("user_id").eq("list_id", list.id).eq("user_id", caller.id).maybeSingle();
      const inFamilyShare = list.type === "family" && (await callerFamilyGroup()).includes(list.owner_id);
      return new Response(JSON.stringify({
        success: true,
        list: {
          // Id returneres kun til ejer/medlem, så appen kan åbne den eksisterende liste (ikke-medlemmer får aldrig listens id).
          id: (list.owner_id === caller.id || Boolean(access) || inFamilyShare) ? list.id : undefined,
          name: list.name,
          owner_name: (owner?.name ?? "").trim().split(/\s+/)[0] || null,
          is_owner: list.owner_id === caller.id,
          already_member: Boolean(access) || inFamilyShare,
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────
    // TILSLUT VIA KODE
    // ─────────────────────────────────────

    if (method === "POST" && isJoin) {
      const { code } = await req.json();
      if (!code) return new Response(JSON.stringify({ error: "code er påkrævet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!(await withinUserLimit(supabase, caller.id, "list_code"))) return codeLimitResponse();

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
      // Udvalgte personer skal være i ejerens familie (link-deling bruger /join i stedet)
      if (!(await callerFamilyGroup()).includes(user_id)) return new Response(JSON.stringify({ error: "Du kan kun dele med personer i din familie" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: access, error } = await supabase
        .from("shopping_list_access")
        .upsert({ list_id: listId, user_id, permission: permission === "read" ? "read" : "edit" }, { onConflict: "list_id,user_id" })
        .select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, access }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST /<id>/hide — "forlad" en liste, der er delt med hele familien: skjul den for mig (og fjern min evt. adgangsrække).
    // Ejeren kan ikke skjule sin egen liste; kun lister, jeg reelt har adgang til.
    if (method === "POST" && isHide) {
      const { data: list } = await supabase.from("shopping_lists").select("owner_id").eq("id", listId).single();
      if (!list || list.owner_id === caller.id || !(await canAccessList(listId, false))) return new Response(JSON.stringify({ error: "Ikke autoriseret til denne liste" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await supabase.from("shopping_list_access").delete().eq("list_id", listId).eq("user_id", caller.id);
      const { error } = await supabase.from("shopping_list_hidden").upsert({ list_id: listId, user_id: caller.id });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // DELETE — fjern en brugers adgang (ejeren fjerner andre; enhver kan forlade listen selv)
    if (method === "DELETE" && isAccess && accessUserId) {
      const { data: list } = await supabase.from("shopping_lists").select("owner_id").eq("id", listId).single();
      if (!list || (list.owner_id !== caller.id && accessUserId !== caller.id)) return new Response(JSON.stringify({ error: "Kun ejeren kan fjerne andres adgang til listen" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { error } = await supabase.from("shopping_list_access").delete().eq("list_id", listId).eq("user_id", accessUserId);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST — lav en ny kode til listelinket (kun ejeren). Det gamle link holder op med at virke;
    // personer, der allerede er tilsluttet, beholder deres adgang og fjernes under "Har adgang nu".
    if (method === "POST" && isRotate) {
      const { data: list } = await supabase.from("shopping_lists").select("owner_id").eq("id", listId).single();
      if (!list || list.owner_id !== caller.id) return new Response(JSON.stringify({ error: "Kun ejeren kan lave et nyt link" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      let updated, error;
      for (let attempt = 0; attempt < 5; attempt++) {
        ({ data: updated, error } = await supabase
          .from("shopping_lists").update({ share_link: generateCode(), updated_at: new Date() }).eq("id", listId).select("share_link").single());
        if (!error) break;
      }
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, share_link: updated?.share_link }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      const { data: hiddenRows } = await supabase.from("shopping_list_hidden").select("list_id").eq("user_id", userId);
      const hiddenIds = new Set((hiddenRows ?? []).map((r) => r.list_id));

      let query = supabase
        .from("shopping_lists")
        .select("*, shopping_list_items(*)")
        .order("created_at", { ascending: false });

      const orParts = [`owner_id.eq.${userId}`];
      if (group.length > 1) orParts.push(`and(type.eq.family,owner_id.in.(${group.filter((id: string) => id !== userId).join(",")}))`);
      if (sharedListIds.length > 0) orParts.push(`id.in.(${sharedListIds.join(",")})`);
      query = query.or(orParts.join(","));

      const { data: lists, error } = await query;

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Berig med det, appen skal bruge til en klar delt-status: ejerens fornavn, hvem egne lister er delt med
      // (fornavne), og om jeg har adgang via en udvalgt/link-række. Listekoden er kun til ejeren.
      const firstName = (n?: string | null) => (n ?? "").trim().split(/\s+/)[0] || null;
      // Skjulte lister (forladt familiedeling) udelades, medmindre jeg er ejer eller siden har fået en egen adgangsrække.
      const rows = (lists ?? []).filter((l) => l.owner_id === userId || sharedListIds.includes(l.id) || !hiddenIds.has(l.id));
      const foreignOwnerIds = [...new Set(rows.filter((l) => l.owner_id !== userId).map((l) => l.owner_id))];
      const ownIds = rows.filter((l) => l.owner_id === userId).map((l) => l.id);
      const { data: owners } = foreignOwnerIds.length
        ? await supabase.from("users").select("id, name").in("id", foreignOwnerIds) : { data: [] };
      const { data: ownAccess } = ownIds.length
        ? await supabase.from("shopping_list_access").select("list_id, users(name)").in("list_id", ownIds) : { data: [] };
      const ownerName = new Map((owners ?? []).map((o) => [o.id, firstName(o.name)]));
      const sharedWith = new Map<string, string[]>();
      for (const a of ownAccess ?? []) {
        const u = Array.isArray(a.users) ? a.users[0] : a.users;
        sharedWith.set(a.list_id, [...(sharedWith.get(a.list_id) ?? []), firstName(u?.name) ?? "En person"]);
      }
      for (const l of rows) l.shopping_list_items = await withProductImages(l.shopping_list_items);
      const enriched = rows.map((l) => l.owner_id === userId
        ? { ...l, shared_with: sharedWith.get(l.id) ?? [], via_access: false }
        : { ...l, share_link: null, owner_name: ownerName.get(l.owner_id) ?? null, via_access: sharedListIds.includes(l.id) });

      return new Response(
        JSON.stringify({ success: true, lists: enriched }),
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

      list.shopping_list_items = await withProductImages(list.shopping_list_items);

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

      // Kun navn og delingstype må ændres (aldrig owner_id/share_link via PATCH). Delingstypen er kun for ejeren.
      const patch: Record<string, unknown> = {};
      if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 60);
      if (body.type === "family" || body.type === "personal") {
        const { data: ownerRow } = await supabase.from("shopping_lists").select("owner_id").eq("id", listId).single();
        if (!ownerRow || ownerRow.owner_id !== caller.id) return new Response(
          JSON.stringify({ error: "Kun ejeren kan ændre, hvem listen er delt med" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
        patch.type = body.type;
      }
      if (Object.keys(patch).length === 0) return new Response(
        JSON.stringify({ error: "Intet at opdatere" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      const { data: list, error } = await supabase
        .from("shopping_lists")
        .update({ ...patch, updated_at: new Date() })
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

      const itemsWithImages = await withProductImages(items);

      return new Response(
        JSON.stringify({ success: true, items: itemsWithImages }),
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
      // Kolonne-whitelist: et punkt kan ikke flyttes til en anden liste (list_id) eller få ny ophavsmand (added_by).
      const ITEM_FIELDS = ["name", "quantity", "checked", "store", "ean", "image_url", "product_id"];
      const itemUpdate = Object.fromEntries(Object.entries(body ?? {}).filter(([k]) => ITEM_FIELDS.includes(k)));

      // .eq("list_id", listId) er tilføjet ved siden af .eq("id", itemId) —
      // uden den bandt kun canAccessList-tjekket ovenfor til listId, mens
      // selve opdateringen kun filtrerede på itemId. En bruger der ejer EN
      // vilkårlig liste kunne derfor bestå adgangstjekket med sin egen
      // listId, og alligevel ramme et punkt der reelt hører til en ANDEN
      // brugers liste, hvis de kendte/gættede punktets id.
      const { data: item, error } = await supabase
        .from("shopping_list_items")
        .update(itemUpdate)
        .eq("id", itemId)
        .eq("list_id", listId)
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
      // Samme IDOR-fix som PATCH herover — bind sletningen til listId, ikke kun itemId.
      const { error } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("id", itemId)
        .eq("list_id", listId);

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
