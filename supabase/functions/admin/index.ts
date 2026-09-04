import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(
    JSON.stringify({ error: "Authorization header mangler" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );

  const token = authHeader.replace("Bearer ", "");
  const payload = decodeJWT(token);

  if (!payload || !payload.sub) return new Response(
    JSON.stringify({
      error: "Ugyldig token",
      payload: payload,
      token_parts: token.split(".").length,
      token_start: token.substring(0, 30)
    }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );

  const userId = payload.sub as string;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile || profile.role !== "admin") return new Response(
    JSON.stringify({ error: "Adgang nægtet — kun admin" }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const method = req.method;

  const isUsers = parts.includes("users");
  const isStats = parts.includes("stats");
  const isLog = parts.includes("revision-log");
  const targetUserId = isUsers && parts[parts.length - 1] !== "users"
    ? parts[parts.length - 1]
    : null;

  try {
    // GET — hent alle brugere
    if (method === "GET" && isUsers && !targetUserId) {
      const limit = parseInt(url.searchParams.get("limit") ?? "50");
      const offset = parseInt(url.searchParams.get("offset") ?? "0");

      const { data: users, error, count } = await supabase
        .from("users")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      return new Response(
        JSON.stringify({ success: true, users, total: count }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PATCH — opdater bruger
    if (method === "PATCH" && isUsers && targetUserId) {
      const body = await req.json();

      const { data: updatedUser, error } = await supabase
        .from("users")
        .update({ ...body, updated_at: new Date() })
        .eq("id", targetUserId)
        .select()
        .single();

      if (error) return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      return new Response(
        JSON.stringify({ success: true, user: updatedUser }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET — statistik
    if (method === "GET" && isStats) {
      const [
        { count: totalUsers },
        { count: totalProducts },
        { count: totalScans },
        { count: pendingSubmissions },
        { count: totalFamilies },
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("scan_history").select("*", { count: "exact", head: true }),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("families").select("*", { count: "exact", head: true }),
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          stats: {
            total_users: totalUsers,
            total_products: totalProducts,
            total_scans: totalScans,
            pending_submissions: pendingSubmissions,
            total_families: totalFamilies,
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET — revisionslog
    if (method === "GET" && isLog) {
      const limit = parseInt(url.searchParams.get("limit") ?? "50");
      const offset = parseInt(url.searchParams.get("offset") ?? "0");
      const productId = url.searchParams.get("product_id");

      let query = supabase
        .from("revision_log")
        .select("*, products(name, ean)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (productId) query = query.eq("product_id", productId);

      const { data: logs, error, count } = await query;

      if (error) return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

      return new Response(
        JSON.stringify({ success: true, logs, total: count }),
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
