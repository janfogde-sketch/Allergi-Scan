// supabase/functions/send-push/index.ts
// Sender Web Push notifikation til en bruger via VAPID
// Kald: POST { user_id, title, body, url?, category? } — kun med service-role-nøglen
//
// `category` er valgfri af hensyn til bagudkompatibilitet, men bør sendes
// af enhver ny/ændret kalder — matcher en af notification_preferences'
// tilladte kategorier ('submission_status', 'missing_product_found',
// 'family', 'feedback', 'weekly_digest'). Uden den sendes push'en altid,
// uanset brugerens indstillinger.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { sendWebPush } from "../_shared/webpush.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// VAPID-nøgler — generér med: npx web-push generate-vapid-keys
// Sæt som Supabase secrets:
//   supabase secrets set VAPID_PUBLIC_KEY=...
//   supabase secrets set VAPID_PRIVATE_KEY=...
//   supabase secrets set VAPID_SUBJECT=mailto:hej@eatsafe.dk
const VAPID_PUBLIC_KEY  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT     = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hej@eatsafe.dk";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Kategori 4: kun interne kald (service-role-nøglen), fx weekly-digest.
  // Almindelige brugere og admins kan IKKE sende push herfra: en indlogget
  // bruger kunne ellers sende selvvalgt tekst/link til et familiemedlem
  // (phishing). Appen bruger ikke længere denne vej; al push fra appens
  // egne hændelser går via notify (som respekterer flag og indstillinger).
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Ikke autoriseret" }), {
      status: 401, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const { user_id, title, body, url, category } = await req.json();
    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "Mangler user_id, title eller body" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Respekter brugerens notifikationsindstillinger — manglende række =
    // default til (se notification_preferences/notification_enabled()).
    if (category) {
      const { data: pref } = await supabase
        .from("notification_preferences")
        .select("enabled")
        .eq("user_id", user_id)
        .eq("category", category)
        .eq("channel", "push")
        .maybeSingle();
      if (pref?.enabled === false) {
        return new Response(JSON.stringify({ sent: 0, reason: "Bruger har slået denne notifikationstype fra" }), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    // Driftsflagets nødstop for push.
    const { data: flag } = await supabase
      .from("app_flags").select("value").eq("key", "notifications_push_enabled").maybeSingle();
    if (flag?.value !== true) {
      return new Response(JSON.stringify({ sent: 0, reason: "Push er slået fra (app_flags)" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Hent push tokens for brugeren
    const { data: tokens, error } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", user_id);

    if (error) throw error;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "Ingen tokens fundet" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const payload = {
      title,
      body,
      icon: "/icon-192.png",
      url: url ?? "https://www.eatsafe.dk",
    };

    let sent = 0;
    const staleTokens: string[] = [];

    for (const { token } of tokens) {
      try {
        const sub = JSON.parse(token);
        const result = await sendWebPush(sub, payload, {
          vapidPublicKey: VAPID_PUBLIC_KEY,
          vapidPrivateKey: VAPID_PRIVATE_KEY,
          vapidSubject: VAPID_SUBJECT,
        });
        if (result.ok) sent++;
        else if (result.gone) staleTokens.push(token); // udløbet — slet det
        else console.error("Push fejlede:", result.status, result.error);
      } catch (e) {
        console.error("Push fejl for token:", e);
      }
    }

    // Ryd udløbne tokens
    if (staleTokens.length > 0) {
      await supabase.from("push_tokens").delete().in("token", staleTokens);
    }

    return new Response(JSON.stringify({ sent, stale_removed: staleTokens.length }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
