// supabase/functions/weekly-digest/index.ts
// Kører ugentligt via pg_cron — sender push til aktive brugere
// om nye opskrifter der matcher deres allergiprofil
//
// pg_cron opsætning (kør i SQL Editor):
//   select cron.schedule('weekly-digest', '0 9 * * 1', $$
//     select net.http_post(
//       url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/weekly-digest',
//       headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
//       body := '{}'::jsonb
//     );
//   $$);

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find opskrifter tilføjet i den seneste uge
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: newRecipes } = await supabase
      .from("recipes")
      .select("id, title")
      .gte("created_at", oneWeekAgo)
      .limit(20);

    if (!newRecipes || newRecipes.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "Ingen nye opskrifter" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Find alle brugere med push tokens
    const { data: tokenRows } = await supabase
      .from("push_tokens")
      .select("user_id")
      .limit(500);

    if (!tokenRows || tokenRows.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "Ingen push tokens" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const uniqueUserIds = [...new Set(tokenRows.map((r: any) => r.user_id))];
    const count = newRecipes.length;
    const exampleTitle = newRecipes[0]?.title ?? "nye retter";

    let sent = 0;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    for (const userId of uniqueUserIds) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            user_id: userId,
            title: `🍽️ ${count} nye opskrift${count !== 1 ? "er" : ""} denne uge`,
            body: `Bl.a. "${exampleTitle}" — filtreret til din allergiprofil.`,
            url: "https://eatsafe.dk",
          }),
        });
        if (res.ok) sent++;
      } catch (e) {
        console.error("Digest push fejl for user:", userId, e);
      }
    }

    return new Response(JSON.stringify({ sent, new_recipes: count }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
