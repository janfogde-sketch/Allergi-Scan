// supabase/functions/notify/index.ts
//
// Behandler hændelser fra outboxen (notification_events) og sender beskeder.
// Kategori 4 i .claude/rules/edge-function-auth.md: kun service-role — kaldes af
// databasens cron (dispatch_notification_events) og aldrig af klienten.
//
// Rækkefølge pr. modtager (kravet fra udviklerpakken): 1) opret den fulde besked
// i `notifications`, 2) send derefter push, som kun er den korte tekst med et link
// til beskeden (https://www.eatsafe.dk/?notification={id}). Push sendes kun hvis
// driftsflaget notifications_push_enabled er slået til og brugeren ikke har slået
// kategorien fra. Mail er ikke koblet på endnu (trin 3); de eksisterende
// mail-triggere fungerer uændret ved siden af.
//
// Kald: POST {}                  → behandl ventende hændelser (ældre end 15 sek.)
//       POST { event_id: "…" }   → behandl netop den hændelse

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderNotification, MissingRequiredError, productLabel } from "../_shared/notificationContent.js";
import { sendWebPush, endpointHash } from "../_shared/webpush.ts";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const APP_URL = "https://www.eatsafe.dk";
const MAX_ATTEMPTS = 5;
const BATCH = 20;

type EventRow = { id: string; event_key: string; kind: string; payload: Record<string, unknown>; attempts: number };
type Planned = { userId: string; templateKey: string; data: Record<string, unknown>; eventAt?: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// deno-lint-ignore no-explicit-any
type Db = any;

// ── Hændelse → modtagere + data ─────────────────────────────────────────────
async function planEvent(db: Db, ev: EventRow): Promise<Planned[]> {
  const p = ev.payload;
  switch (ev.kind) {
    case "submission_reviewed": {
      const { data: s } = await db.from("submissions")
        .select("id, ean, type, status, submitted_by, review_note, product_id, ai_parsed_data, reviewed_at")
        .eq("id", p.submission_id).maybeSingle();
      if (!s?.submitted_by) return [];
      const productName = await productNameFor(db, s);
      const isEdit = s.type === "edit";
      const templateKey = s.status === "approved" ? (isEdit ? "N2b:default" : "N2a:default") : "N3:default";
      return [{
        userId: s.submitted_by, templateKey, eventAt: s.reviewed_at ?? undefined,
        data: { productName, ean: s.ean, submissionId: s.id, reason: s.review_note },
      }];
    }
    case "missing_product_found": {
      // Brugere, der scannede stregkoden uden at få et resultat, mens produktet manglede.
      const { data: s } = await db.from("submissions")
        .select("id, ean, type, submitted_by, product_id, ai_parsed_data, reviewed_at").eq("id", p.submission_id).maybeSingle();
      if (!s?.ean) return [];
      const { data: rows } = await db.from("scan_history").select("user_id")
        .eq("ean_scanned", s.ean).eq("result", "not_found").not("user_id", "is", null);
      const ids = [...new Set((rows ?? []).map((r: { user_id: string }) => r.user_id))].filter((id) => id !== s.submitted_by);
      const productName = await productNameFor(db, s);
      return ids.map((userId) => ({ userId: userId as string, templateKey: "N4:default", eventAt: s.reviewed_at ?? undefined, data: { productName, ean: s.ean } }));
    }
    case "family_invite_accepted": {
      const { data: inv } = await db.from("family_invites").select("id, invited_by, accepted_by, accepted_at").eq("id", p.invite_id).maybeSingle();
      if (!inv?.invited_by || !inv?.accepted_by) return [];
      const { data: who } = await db.from("users").select("name").eq("id", inv.accepted_by).maybeSingle();
      return [{
        userId: inv.invited_by, templateKey: "N5:default", eventAt: inv.accepted_at ?? undefined,
        data: { memberName: who?.name, inviteId: inv.id },
      }];
    }
    case "ticket_update": {
      const { data: t } = await db.from("feedback_tickets").select("id, description, submitted_by").eq("id", p.ticket_id).maybeSingle();
      if (!t?.submitted_by) return [];
      const variant = String(p.variant ?? "");
      if (!["in_progress", "resolved", "reopened", "reply"].includes(variant)) throw new Error(`Ukendt ticket-variant: ${variant}`);
      return [{
        userId: t.submitted_by, templateKey: `N6:${variant}`,
        data: { description: t.description, message: p.message, ticketId: t.id },
      }];
    }
    default:
      throw new Error(`Ukendt hændelsestype: ${ev.kind}`);
  }
}

async function productNameFor(db: Db, s: { product_id?: string | null; ean?: string; ai_parsed_data?: Record<string, unknown> | null }) {
  let row: { name?: string; brand?: string } | null = null;
  if (s.product_id) ({ data: row } = await db.from("products").select("name, brand").eq("id", s.product_id).maybeSingle());
  if (!row && s.ean) ({ data: row } = await db.from("products").select("name, brand").eq("ean", s.ean).maybeSingle());
  if (row?.name) return productLabel({ brand: row.brand, name: row.name });
  const ai = s.ai_parsed_data as { name?: string; brand?: string } | null;
  return ai?.name ? productLabel({ brand: ai.brand, name: ai.name }) : "";
}

// ── Én modtager: opret besked, derefter push ────────────────────────────────
async function deliver(db: Db, ev: EventRow, plan: Planned, pushEnabled: boolean): Promise<{ retry: boolean }> {
  const r = renderNotification(plan.templateKey, plan.data);

  const row = {
    user_id: plan.userId, event_id: ev.id, event_key: ev.event_key,
    type: r.type, variant: r.variant, category: r.category, template_version: r.templateVersion,
    title: r.title, push_body: r.pushBody, content_blocks: r.blocks,
    entity_type: r.entityType, entity_id: r.entityId, primary_action: r.primaryAction,
    ...(plan.eventAt ? { event_at: plan.eventAt } : {}),
    expires_at: new Date(Date.now() + 365 * 86400_000).toISOString(),
  };
  // Dedup: (event_key, user_id, type, variant) — en retry giver samme række.
  await db.from("notifications").upsert(row, { onConflict: "event_key,user_id,type,variant", ignoreDuplicates: true });
  const { data: n } = await db.from("notifications").select("id").eq("event_key", ev.event_key)
    .eq("user_id", plan.userId).eq("type", r.type).eq("variant", r.variant).single();
  if (!n) throw new Error("Besked blev ikke gemt");

  if (!pushEnabled) return { retry: false };
  const { data: pref } = await db.from("notification_preferences").select("enabled")
    .eq("user_id", plan.userId).eq("category", r.category).eq("channel", "push").maybeSingle();
  if (pref?.enabled === false) return { retry: false };

  const { data: tokens } = await db.from("push_tokens").select("token").eq("user_id", plan.userId);
  let retry = false;
  const payload = {
    title: r.title, body: r.pushBody, icon: "/icon-192.png", lang: "da",
    url: `${APP_URL}/?notification=${n.id}`, notificationId: n.id, eventId: ev.id,
    tag: `${r.type}:${r.entityId ?? n.id}`,
  };

  for (const { token } of tokens ?? []) {
    let sub;
    try { sub = JSON.parse(token); } catch { continue; }
    if (!sub?.endpoint || !sub?.keys) continue;
    const hash = await endpointHash(sub.endpoint);

    const { data: prev } = await db.from("notification_deliveries").select("id, status, attempts")
      .eq("notification_id", n.id).eq("channel", "push").eq("endpoint", hash).maybeSingle();
    if (prev?.status === "sent" || prev?.status === "skipped") continue;

    const res = await sendWebPush(sub, payload, {
      vapidPublicKey: Deno.env.get("VAPID_PUBLIC_KEY")!, vapidPrivateKey: Deno.env.get("VAPID_PRIVATE_KEY")!,
      vapidSubject: Deno.env.get("VAPID_SUBJECT") ?? "mailto:hej@eatsafe.dk",
      ttlSeconds: r.ttlSeconds,
    });
    const status = res.ok ? "sent" : res.gone ? "skipped" : "failed";
    await db.from("notification_deliveries").upsert({
      notification_id: n.id, channel: "push", endpoint: hash, status,
      attempts: (prev?.attempts ?? 0) + 1, last_error: res.ok ? null : (res.gone ? "Endpoint udløbet (fjernet)" : res.error ?? null),
      sent_at: res.ok ? new Date().toISOString() : null,
    }, { onConflict: "notification_id,channel,endpoint" });
    if (res.gone) await db.from("push_tokens").delete().eq("user_id", plan.userId).eq("token", token);
    if (!res.ok && res.retryable) retry = true;
  }
  return { retry };
}

async function logError(db: Db, message: string, context: Record<string, unknown>) {
  try { await db.rpc("log_client_error", { p_message: message, p_source: "edge:notify", p_context: context }); } catch { /* aldrig blokere */ }
}

async function processEvent(db: Db, ev: EventRow, pushEnabled: boolean) {
  // Claim: kun én kørsel ad gangen får lov at tage en ventende hændelse.
  const { data: claimed } = await db.from("notification_events")
    .update({ attempts: ev.attempts + 1 }).eq("id", ev.id).eq("status", "pending").eq("attempts", ev.attempts).select("id");
  if (!claimed?.length) return "skipped";

  try {
    const plans = await planEvent(db, ev);
    let retry = false;
    for (const plan of plans) {
      try {
        const out = await deliver(db, ev, plan, pushEnabled);
        retry ||= out.retry;
      } catch (e) {
        if (e instanceof MissingRequiredError) {
          // Fx en afvisning uden begrundelse: må ikke sendes, og kan ikke løses ved at prøve igen.
          await logError(db, String((e as Error).message), { event_id: ev.id, kind: ev.kind, field: (e as MissingRequiredError).field });
          await db.from("notification_events").update({ status: "failed", last_error: String((e as Error).message), processed_at: new Date().toISOString() }).eq("id", ev.id);
          return "failed";
        }
        throw e;
      }
    }
    if (retry && ev.attempts + 1 < MAX_ATTEMPTS) {
      await db.from("notification_events").update({ last_error: "Push midlertidigt fejlet, prøver igen" }).eq("id", ev.id);
      return "retry";
    }
    await db.from("notification_events").update({ status: "done", last_error: null, processed_at: new Date().toISOString() }).eq("id", ev.id);
    return "done";
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    const giveUp = ev.attempts + 1 >= MAX_ATTEMPTS;
    await db.from("notification_events").update({ last_error: msg, ...(giveUp ? { status: "failed", processed_at: new Date().toISOString() } : {}) }).eq("id", ev.id);
    if (giveUp) await logError(db, msg, { event_id: ev.id, kind: ev.kind });
    return giveUp ? "failed" : "retry";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceRoleKey || (req.headers.get("Authorization") ?? "") !== `Bearer ${serviceRoleKey}`) {
    return json({ error: "Ikke autoriseret" }, 401);
  }

  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const body = await req.json().catch(() => ({}));

    const { data: flag } = await db.from("app_flags").select("value").eq("key", "notifications_push_enabled").maybeSingle();
    const pushEnabled = flag?.value === true;

    let q = db.from("notification_events").select("id, event_key, kind, payload, attempts").eq("status", "pending");
    if (body?.event_id) q = q.eq("id", body.event_id);
    else q = q.lt("created_at", new Date(Date.now() - 15_000).toISOString());
    const { data: events, error } = await q.order("created_at").limit(BATCH);
    if (error) throw error;

    const summary: Record<string, number> = {};
    for (const ev of events ?? []) {
      const outcome = await processEvent(db, ev as EventRow, pushEnabled);
      summary[outcome] = (summary[outcome] ?? 0) + 1;
    }
    return json({ processed: events?.length ?? 0, pushEnabled, ...summary });
  } catch (e) {
    console.error("notify:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
