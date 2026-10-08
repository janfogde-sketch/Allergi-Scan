// supabase/functions/cleanup-orphan-images/index.ts
// Sletter billeder i bøtten product-images, som hverken en indsendelse eller et produkt peger på (fx efter en kontosletning,
// eller et upload der aldrig blev til en indsendelse), og skærmbilleder i feedback-screenshots uden ticket. Kaldes dagligt af pg_cron (cleanup_orphan_images()), kun med service-role-nøglen.
// Body {"dry_run": true} viser kun listen og sletter intet.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { PRODUCT_IMAGES_BUCKET } from "../_shared/productImages.js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceRoleKey || req.headers.get("Authorization") !== `Bearer ${serviceRoleKey}`) {
    return json({ error: "Ikke autoriseret" }, 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceRoleKey);

    const targets = [
      { bucket: PRODUCT_IMAGES_BUCKET, rpc: "orphan_product_images" },
      { bucket: "feedback-screenshots", rpc: "orphan_feedback_screenshots" },
    ];
    const orphans: Record<string, string[]> = {};
    let removed = 0;
    for (const t of targets) {
      const { data, error } = await supabase.rpc(t.rpc);
      if (error) throw new Error(error.message);
      const paths: string[] = (data ?? []).map((r: { name: string }) => r.name ?? r);
      orphans[t.bucket] = paths;
      if (dryRun) continue;
      for (let i = 0; i < paths.length; i += 100) {
        const { data: done, error: rmError } = await supabase.storage.from(t.bucket).remove(paths.slice(i, i + 100));
        if (rmError) throw new Error(rmError.message);
        removed += done?.length ?? 0;
      }
    }
    return json(dryRun ? { success: true, dry_run: true, orphans } : { success: true, removed });
  } catch (e) {
    console.error("cleanup-orphan-images:", e);
    return json({ error: "Oprydningen fejlede" }, 500);
  }
});
