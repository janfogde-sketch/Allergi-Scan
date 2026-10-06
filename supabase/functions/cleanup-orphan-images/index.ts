// supabase/functions/cleanup-orphan-images/index.ts
// Sletter billeder i bøtten product-images, som hverken en indsendelse eller et produkt peger på (fx efter en kontosletning,
// eller et upload der aldrig blev til en indsendelse). Kaldes dagligt af pg_cron (cleanup_orphan_images()), kun med service-role-nøglen.
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

    const { data, error } = await supabase.rpc("orphan_product_images");
    if (error) throw new Error(error.message);
    const paths: string[] = (data ?? []).map((r: { name: string }) => r.name ?? r);

    if (dryRun || paths.length === 0) return json({ success: true, dry_run: dryRun, orphans: paths });

    let removed = 0;
    for (let i = 0; i < paths.length; i += 100) {
      const { data: done, error: rmError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths.slice(i, i + 100));
      if (rmError) throw new Error(rmError.message);
      removed += done?.length ?? 0;
    }
    return json({ success: true, removed });
  } catch (e) {
    console.error("cleanup-orphan-images:", e);
    return json({ error: "Oprydningen fejlede" }, 500);
  }
});
