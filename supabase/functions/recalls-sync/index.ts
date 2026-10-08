// supabase/functions/recalls-sync/index.ts
//
// Henter Fødevarestyrelsens RSS-feed over tilbagekaldte fødevarer, læser nye tilbagekaldssider og
// lægger hændelsen `recall_published` i outboxen, når siden har gyldige EAN'er (P6).
// Kategori 4 i .claude/rules/edge-function-auth.md: kun service-role — kaldes af databasens cron
// (sync_recalls, dagligt) og aldrig af klienten.
//
// Første kørsel (tom tabel): alt, der allerede ligger i feedet, arkiveres uden at sende noget.
// Derefter sendes kun tilbagekaldelser, der er offentliggjort inden for de sidste 14 dage.
// Sider uden gyldig EAN får status 'needs_review' og vises kun til admin.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { parseRecallFeed, parseRecallPage, isOfficialRecallUrl } from "../_shared/recallParser.js";

const FEED_URL = "https://foedevarestyrelsen.dk/handlers/DynamicRss.ashx?id=8c2cdc12-6a58-43d1-8b4e-97aa96dedd0c";
const MAX_NEW_PER_RUN = 25;
const NOTIFY_WINDOW_DAYS = 14;
const UA = "EatSafe-recall-sync/1.0 (+https://www.eatsafe.dk)";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,application/rss+xml,*/*" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

Deno.serve(async (req) => {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceKey || req.headers.get("Authorization") !== `Bearer ${serviceKey}`) return json({ error: "Forbidden" }, 403);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

  try {
    const feed = parseRecallFeed(await fetchText(FEED_URL));
    if (feed.length === 0) return json({ ok: true, note: "Feedet var tomt" });

    const { data: known, error: knownErr } = await db.from("recalls").select("source_url");
    if (knownErr) throw knownErr;
    const seen = new Set((known ?? []).map((r: { source_url: string }) => r.source_url));
    const firstRun = seen.size === 0;

    const fresh = feed.filter((f) => !seen.has(f.url)).slice(0, firstRun ? 100 : MAX_NEW_PER_RUN);
    const results = { added: 0, ready: 0, review: 0, archived: 0, failed: 0 };

    for (const item of fresh) {
      if (!isOfficialRecallUrl(item.url)) continue;
      try {
        const page = parseRecallPage(await fetchText(item.url), { title: item.title });
        const ageDays = item.publishedAt ? (Date.now() - Date.parse(item.publishedAt)) / 86400_000 : 0;
        const status = firstRun ? "archived"
          : page.cancelled ? "cancelled"
          : page.eans.length === 0 ? "needs_review"
          : ageDays > NOTIFY_WINDOW_DAYS ? "archived"
          : "ready";

        const { data: row, error } = await db.from("recalls").insert({
          source_url: item.url, title: item.title, published_at: item.publishedAt,
          intro: page.intro, affected: page.affected, reason: page.reason, action: page.action,
          eans: page.eans, unverified_eans: page.unverifiedEans, status,
        }).select("id").single();
        if (error) throw error;
        results.added++;

        if (status === "ready") {
          await db.from("notification_events").upsert({
            event_key: `p6:${row.id}`, kind: "recall_published", payload: { recall_id: row.id },
            available_at: new Date().toISOString(),
          }, { onConflict: "event_key", ignoreDuplicates: true });
          results.ready++;
        } else if (status === "needs_review") {
          // F1-3 (6. okt. 2026): en tilbagekaldelse uden gyldig EAN når ingen brugere, før admin har
          // afgjort den, så den lander som høj prioritet på admins to do-liste med link til kilden.
          const { error: todoErr } = await db.from("admin_todos").insert({
            title: `Tilbagekaldelse uden EAN: ${item.title}`.slice(0, 200),
            description: `Fødevarestyrelsens side har ingen gyldig stregkode, så ingen brugere har fået besked. Afgør den under Admin → Tilbagekald (tilføj EAN eller arkivér).${page.unverifiedEans?.length ? ` Ubekræftede tal på siden: ${page.unverifiedEans.join(", ")}.` : ""}`,
            priority: "high", track: "drift", link: item.url,
          });
          if (todoErr) {
            try { await db.rpc("log_client_error", { p_message: `Kunne ikke oprette to do for tilbagekaldelse uden EAN: ${todoErr.message}`, p_source: "edge:recalls-sync", p_context: { url: item.url } }); } catch { /* aldrig blokere */ }
          }
          results.review++;
        }
        else results.archived++;
      } catch (e) {
        results.failed++;
        try { await db.rpc("log_client_error", { p_message: String((e as Error)?.message ?? e), p_source: "edge:recalls-sync", p_context: { url: item.url } }); } catch { /* aldrig blokere */ }
      }
    }
    return json({ ok: true, firstRun, ...results });
  } catch (e) {
    try { await db.rpc("log_client_error", { p_message: String((e as Error)?.message ?? e), p_source: "edge:recalls-sync", p_context: {} }); } catch { /* ignorer */ }
    return json({ ok: false, error: "Sync fejlede" }, 500);
  }
});
