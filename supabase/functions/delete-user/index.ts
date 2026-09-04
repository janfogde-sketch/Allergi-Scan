// supabase/functions/delete-user/index.ts
// Sletter en bruger komplet — relaterede data, public.users og auth.users.
// Kræver admin-rolle på den kaldende bruger.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificer at den kaldende bruger er admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Ikke autoriseret");

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error("Ikke autoriseret");

    const { data: callerProfile } = await supabase
      .from("users").select("role").eq("id", caller.id).single();
    if (callerProfile?.role !== "admin") throw new Error("Kun admins kan slette brugere");

    const { uid } = await req.json();
    if (!uid) throw new Error("uid er påkrævet");

    if (uid === caller.id) throw new Error("Du kan ikke slette din egen konto");

    // Slet afhængige data i korrekt rækkefølge
    await supabase.from("shopping_list_items").delete().eq("added_by", uid);
    await supabase.from("shopping_lists").delete().eq("owner_id", uid);
    await supabase.from("scan_history").delete().eq("user_id", uid);
    await supabase.from("user_allergens").delete().eq("user_id", uid);
    await supabase.from("family_members").delete().eq("user_id", uid);
    await supabase.from("feedback_tickets").delete().eq("submitted_by", uid);
    await supabase.from("product_submissions").delete().eq("submitted_by", uid);
    await supabase.from("users").delete().eq("id", uid);

    // Slet fra auth.users (kræver service role)
    const { error: authError } = await supabase.auth.admin.deleteUser(uid);
    if (authError) throw new Error(`auth sletning fejlede: ${authError.message}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
