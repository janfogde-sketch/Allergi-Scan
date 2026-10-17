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

import { createClient } from "jsr:@supabase/supabase-js@2.117.2";
import { startRun, finishRun, runStatus } from "../_shared/runLog.ts";
import {
  parseRecallFeed, parseRecallPage, isOfficialRecallUrl,
  originalTitleOfCancelled, normalizeRecallTitle, recallFingerprintText, sameEanSet,
} from "../_shared/recallParser.js";

const FEED_URL = "https://foedevarestyrelsen.dk/handlers/DynamicRss.ashx?id=8c2cdc12-6a58-43d1-8b4e-97aa96dedd0c";
const MAX_NEW_PER_RUN = 25;
const NOTIFY_WINDOW_DAYS = 14;
const MAX_RECHECK_PER_RUN = 40; // ready-tilbagekaldelser fra de seneste 14 dage, der genlæses for ændringer
const UA = "EatSafe-recall-sync/1.0 (+https://www.eatsafe.dk)";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// deno-lint-ignore no-explicit-any
type Db = any;

async function logError(db: Db, e: unknown, ctx: Record<string, unknown>) {
  try { await db.rpc("log_client_error", { p_message: String((e as Error)?.message ?? e), p_source: "edge:recalls-sync", p_context: ctx }); } catch { /* aldrig blokere */ }
}

/** Finder den tilbagekaldelse, en annulleringsside ophæver: samme titel uden "ANNULLERET", ellers samme EAN'er. */
async function findCancelledOriginal(db: Db, title: string, eans: string[]) {
  const wanted = originalTitleOfCancelled(title);
  const { data } = await db.from("recalls").select("id, title, eans, status, published_at")
    .in("status", ["ready", "archived"]).is("cancelled_at", null).order("published_at", { ascending: false }).limit(300);
  const rows = (data ?? []) as { id: string; title: string; eans: string[]; status: string }[];
  if (wanted) {
    const byTitle = rows.find((r) => normalizeRecallTitle(r.title) === normalizeRecallTitle(wanted));
    if (byTitle) return byTitle;
  }
  if (eans.length === 0) return null;
  return rows.find((r) => r.status === "ready" && (r.eans ?? []).some((e) => eans.includes(e))) ?? null;
}

/** Hændelseslog (recall_events). En fejl her stopper aldrig synkroniseringen. */
async function logEvent(db: Db, recallId: string, kind: string, details: Record<string, unknown> = {}) {
  try { await db.from("recall_events").insert({ recall_id: recallId, kind, details }); } catch { /* aldrig blokere */ }
}

/** Skriver med de nye kolonner (raw_text, source_checked_at); findes de ikke endnu (databaseopdateringen er ikke udgivet), skrives uden dem. */
const NEW_COLS = /raw_text|source_checked_at|schema cache/i;
async function insertRecall(db: Db, base: Record<string, unknown>, extra: Record<string, unknown>) {
  let r = await db.from("recalls").insert({ ...base, ...extra }).select("id").single();
  if (r.error && NEW_COLS.test(r.error.message ?? "")) r = await db.from("recalls").insert(base).select("id").single();
  return r;
}
async function updateRecall(db: Db, id: string, base: Record<string, unknown>, extra: Record<string, unknown>) {
  let r = await db.from("recalls").update({ ...base, ...extra }).eq("id", id);
  if (r.error && NEW_COLS.test(r.error.message ?? "")) r = await db.from("recalls").update(base).eq("id", id);
  return r;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,application/rss+xml,*/*" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

Deno.serve(async (req) => {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceKey || req.headers.get("Authorization") !== `Bearer ${serviceKey}`) return json({ error: "Forbidden" }, 403);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  // Kørselslog: tidspunkt og resultat af hver synkronisering, så admin kan se, om den virker (et tomt resultat er ikke bevis for, at der ingen tilbagekaldelser er)
  const runId = await startRun(db, "recalls_sync", "cron");
  if (runId === null) return json({ ok: false, busy: true }, 409);
  const results = { added: 0, ready: 0, review: 0, archived: 0, failed: 0, cancelledLinked: 0, updated: 0, checked: 0 };

  try {
    const feed = parseRecallFeed(await fetchText(FEED_URL));
    if (feed.length === 0) {
      await finishRun(db, runId, "failed", { ...results, feed_items: 0 }, ["Feedet var tomt eller kunne ikke læses"], "tomt_feed");
      return json({ ok: false, note: "Feedet var tomt" }, 502);
    }

    const { data: known, error: knownErr } = await db.from("recalls").select("source_url");
    if (knownErr) throw knownErr;
    const seen = new Set((known ?? []).map((r: { source_url: string }) => r.source_url));
    const firstRun = seen.size === 0;

    const fresh = feed.filter((f) => !seen.has(f.url)).slice(0, firstRun ? 100 : MAX_NEW_PER_RUN);

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

        const { data: row, error } = await insertRecall(db, {
          source_url: item.url, title: item.title, published_at: item.publishedAt,
          intro: page.intro, affected: page.affected, reason: page.reason, action: page.action,
          eans: page.eans, unverified_eans: page.unverifiedEans, status,
          content_hash: await sha256Hex(recallFingerprintText(page)),
        }, { raw_text: page.rawText, source_checked_at: new Date().toISOString() });
        if (error) throw error;
        results.added++;
        await logEvent(db, row.id, "imported", { status, eans: page.eans.length, ubekraeftede: page.unverifiedEans.length, kilde: item.url });

        // En annulleringsside ophæver den oprindelige tilbagekaldelse; de, der fik den første besked, får besked om annulleringen.
        if (page.cancelled && !firstRun) {
          const orig = await findCancelledOriginal(db, item.title, page.eans);
          if (orig) {
            const { error: upErr } = await db.from("recalls").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by_url: item.url, updated_at: new Date().toISOString() }).eq("id", orig.id);
            if (upErr) throw upErr;
            await logEvent(db, orig.id, "cancelled", { af: "Fødevarestyrelsens annulleringsside", kilde: item.url });
            await db.from("notification_events").upsert({
              event_key: `p6c:${orig.id}`, kind: "recall_cancelled", payload: { recall_id: orig.id, cancel_recall_id: row.id },
              available_at: new Date().toISOString(),
            }, { onConflict: "event_key", ignoreDuplicates: true });
            results.cancelledLinked++;
          }
        }

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

    // Genlæs de seneste 14 dages bekræftede tilbagekaldelser; er årsag, partier, anvisning eller EAN'er ændret,
    // gemmes den nye tekst, og de, der fik den første besked, får besked om ændringen.
    if (!firstRun) {
      const since = new Date(Date.now() - NOTIFY_WINDOW_DAYS * 86400_000).toISOString();
      const { data: recent, error: recentErr } = await db.from("recalls")
        .select("id, source_url, title, intro, affected, reason, action, eans, content_hash, revision")
        .eq("status", "ready").gte("published_at", since).order("published_at", { ascending: false }).limit(MAX_RECHECK_PER_RUN);
      if (recentErr) await logError(db, recentErr, { step: "recheck-select" });
      for (const row of recent ?? []) {
        try {
          const page = parseRecallPage(await fetchText(row.source_url), { title: row.title });
          if (page.cancelled) continue;
          const newHash = await sha256Hex(recallFingerprintText(page));
          const oldHash = row.content_hash ?? await sha256Hex(recallFingerprintText(row));
          const eansChanged = page.eans.length > 0 && !sameEanSet(page.eans, row.eans);
          results.checked++;
          if (newHash === oldHash && !eansChanged) {
            if (!row.content_hash) await db.from("recalls").update({ content_hash: newHash }).eq("id", row.id);
            await updateRecall(db, row.id, {}, { source_checked_at: new Date().toISOString() });
            continue;
          }
          const revision = (row.revision ?? 0) + 1;
          const changed = [row.reason !== page.reason && "årsag", row.affected !== page.affected && "berørte produkter og partier", row.action !== page.action && "vejledning", eansChanged && "stregkoder"].filter(Boolean);
          const { error: upErr } = await updateRecall(db, row.id, {
            intro: page.intro, affected: page.affected, reason: page.reason, action: page.action,
            ...(page.eans.length > 0 ? { eans: page.eans, unverified_eans: page.unverifiedEans } : {}),
            content_hash: newHash, revision, updated_at: new Date().toISOString(),
          }, { raw_text: page.rawText, source_checked_at: new Date().toISOString() });
          if (upErr) throw upErr;
          await logEvent(db, row.id, "updated", { revision, aendret: changed, varsling: "lagt i kø" });
          await db.from("notification_events").upsert({
            event_key: `p6u:${row.id}:${revision}`, kind: "recall_updated", payload: { recall_id: row.id },
            available_at: new Date().toISOString(),
          }, { onConflict: "event_key", ignoreDuplicates: true });
          results.updated++;
        } catch (e) {
          results.failed++;
          await logError(db, e, { url: row.source_url, step: "recheck" });
        }
      }
    }
    await finishRun(db, runId, runStatus(results.added + results.updated + results.checked, results.failed), results,
      [`${results.added} nye, ${results.updated} opdateret, ${results.checked} genlæst, ${results.failed} fejl`]);
    return json({ ok: true, firstRun, ...results });
  } catch (e) {
    try { await db.rpc("log_client_error", { p_message: String((e as Error)?.message ?? e), p_source: "edge:recalls-sync", p_context: {} }); } catch { /* ignorer */ }
    await finishRun(db, runId, "failed", results, [], /HTTP \d+/.test(String((e as Error)?.message)) ? "kilde_svarer_ikke" : "sync_fejlede");
    return json({ ok: false, error: "Sync fejlede" }, 500);
  }
});
