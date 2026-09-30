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
// kategorien fra. Mail sendes på samme måde via Resend-skabelonerne, når
// notifications_email_enabled er slået til (de gamle mail-triggere springer da over).
//
// Kald: POST {}                  → behandl ventende hændelser (ældre end 15 sek.)
//       POST { event_id: "…" }   → behandl netop den hændelse

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderNotification, MissingRequiredError, productLabel } from "../_shared/notificationContent.js";
import { sendWebPush, endpointHash } from "../_shared/webpush.ts";
import { formatDanishDeadline, summarizeItems } from "../_shared/notifyHelpers.js";
import { RESEND_TEMPLATES, MAIL_ONLY_WITHOUT_PUSH, buildMailVariables, sendTemplateMail } from "../_shared/mailSend.ts";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const APP_URL = "https://www.eatsafe.dk";
const MAX_ATTEMPTS = 5;
const BATCH = 20;

type EventRow = { id: string; event_key: string; kind: string; payload: Record<string, unknown>; attempts: number };
type Flags = { push: boolean; email: boolean; testUsers: Set<string> };
type Planned = {
  userId: string; templateKey: string; data: Record<string, unknown>; eventAt?: string;
  /** Web Push TTL og udløbstid for pushen (fx P2: kun så længe invitationen er gyldig). */
  ttlSeconds?: number; pushExpiresAt?: string;
};

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
    case "family_invite_expiring": {
      const { data: inv } = await db.from("family_invites").select("id, invited_by, status, expires_at").eq("id", p.invite_id).maybeSingle();
      // Tjek status igen ved afsendelse: accepteret, tilbagekaldt eller udløbet → ingen påmindelse.
      if (!inv?.invited_by || inv.status !== "pending") return [];
      const remaining = Math.floor((Date.parse(inv.expires_at) - Date.now()) / 1000);
      if (!(remaining > 0)) return [];
      return [{
        userId: inv.invited_by, templateKey: "P2:default",
        data: { inviteId: inv.id, expiresAt: formatDanishDeadline(inv.expires_at) },
        ttlSeconds: Math.min(3600, remaining), pushExpiresAt: inv.expires_at,
      }];
    }
    case "list_items_added": {
      const { data: list } = await db.from("shopping_lists").select("id, name, owner_id").eq("id", p.list_id).maybeSingle();
      if (!list) return []; // listen er slettet
      const since = String(p.window_start ?? "");
      const { data: items } = await db.from("shopping_list_items").select("name, added_by")
        .eq("list_id", list.id).gte("added_at", since).not("added_by", "is", null).order("added_at");
      if (!items?.length) return []; // alle nye varer er fjernet igen
      const { data: access } = await db.from("shopping_list_access").select("user_id").eq("list_id", list.id);
      // Modtagere: ejeren og de brugere, der har adgang NU (adgang genvurderes ved afsendelse)
      const recipients = [...new Set([list.owner_id, ...(access ?? []).map((a: { user_id: string }) => a.user_id)].filter(Boolean))] as string[];
      const plans: Planned[] = [];
      for (const userId of recipients) {
        const theirs = items.filter((i: { added_by: string }) => i.added_by !== userId);
        if (theirs.length === 0) continue;
        plans.push({
          userId, templateKey: theirs.length === 1 ? "P3:one" : "P3:many",
          data: { listName: list.name, listId: list.id, itemSummary: summarizeItems(theirs.map((i: { name: string }) => i.name)) },
        });
      }
      return plans;
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
async function deliver(db: Db, ev: EventRow, plan: Planned, flags: Flags): Promise<{ retry: boolean }> {
  const r = renderNotification(plan.templateKey, plan.data);

  // Brugerens valg pr. kanal (med kategoriens standard, se notification_enabled() i databasen).
  // Er både push og mail fravalgt, oprettes ingen besked (udviklerpakken).
  const enabled = async (channel: string): Promise<boolean> => {
    const { data, error } = await db.rpc("notification_enabled", { p_user_id: plan.userId, p_category: r.category, p_channel: channel });
    if (error) throw error;
    return data !== false;
  };
  const [pushOn, emailOn] = [await enabled("push"), await enabled("email")];
  if (!pushOn && !emailOn) return { retry: false };

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

  let retry = false;
  // Globalt flag TIL, eller brugeren står på testlisten (app_flags.notifications_test_users)
  const isTester = flags.testUsers.has(plan.userId);
  const willPush = (flags.push || isTester) && pushOn;
  if (willPush) retry = (await sendPushes(db, ev, plan, r, n.id)) || retry;
  if ((flags.email || isTester) && emailOn) retry = (await sendMail(db, plan, r, n.id, willPush)) || retry;
  return { retry };
}

async function sendPushes(db: Db, ev: EventRow, plan: Planned, r: ReturnType<typeof renderNotification>, notificationId: string): Promise<boolean> {
  const { data: tokens } = await db.from("push_tokens").select("token").eq("user_id", plan.userId);
  let retry = false;
  const payload = {
    title: r.title, body: r.pushBody, icon: "/icon-192.png", lang: "da",
    url: `${APP_URL}/?notification=${notificationId}`, notificationId, eventId: ev.id,
    tag: `${r.type}:${r.entityId ?? notificationId}`,
    ...(plan.pushExpiresAt ? { expiresAt: plan.pushExpiresAt } : {}),
  };

  for (const { token } of tokens ?? []) {
    let sub;
    try { sub = JSON.parse(token); } catch { continue; }
    if (!sub?.endpoint || !sub?.keys) continue;
    const hash = await endpointHash(sub.endpoint);

    const { data: prev } = await db.from("notification_deliveries").select("id, status, attempts")
      .eq("notification_id", notificationId).eq("channel", "push").eq("endpoint", hash).maybeSingle();
    if (prev?.status === "sent" || prev?.status === "skipped") continue;

    const res = await sendWebPush(sub, payload, {
      vapidPublicKey: Deno.env.get("VAPID_PUBLIC_KEY")!, vapidPrivateKey: Deno.env.get("VAPID_PRIVATE_KEY")!,
      vapidSubject: Deno.env.get("VAPID_SUBJECT") ?? "mailto:hej@eatsafe.dk",
      ttlSeconds: plan.ttlSeconds ?? r.ttlSeconds,
    });
    const status = res.ok ? "sent" : res.gone ? "skipped" : "failed";
    await db.from("notification_deliveries").upsert({
      notification_id: notificationId, channel: "push", endpoint: hash, status,
      attempts: (prev?.attempts ?? 0) + 1, last_error: res.ok ? null : (res.gone ? "Endpoint udløbet (fjernet)" : res.error ?? null),
      sent_at: res.ok ? new Date().toISOString() : null,
    }, { onConflict: "notification_id,channel,endpoint" });
    if (res.gone) await db.from("push_tokens").delete().eq("user_id", plan.userId).eq("token", token);
    if (!res.ok && res.retryable) retry = true;
  }
  return retry;
}

// Mail: én pr. besked (registret forhindrer dobbelt afsendelse), via Resend-skabelonen for varianten.
async function sendMail(db: Db, plan: Planned, r: ReturnType<typeof renderNotification>, notificationId: string, pushWasSent: boolean): Promise<boolean> {
  const templateId = RESEND_TEMPLATES[r.key];
  if (!templateId) return false; // varianten har ingen mail (endnu)
  if (pushWasSent && MAIL_ONLY_WITHOUT_PUSH.has(r.key)) {
    // Fx P2: mailen er kun til dem uden push (udviklerpakken anbefaler ikke begge som standard).
    const { count } = await db.from("push_tokens").select("id", { count: "exact", head: true }).eq("user_id", plan.userId);
    if ((count ?? 0) > 0) return false;
  }

  const { data: prev } = await db.from("notification_deliveries").select("status, attempts")
    .eq("notification_id", notificationId).eq("channel", "email").eq("endpoint", "").maybeSingle();
  if (prev?.status === "sent" || prev?.status === "skipped") return false;

  const { data: user } = await db.from("users").select("email, name").eq("id", plan.userId).maybeSingle();
  const record = (status: string, error: string | null) => db.from("notification_deliveries").upsert({
    notification_id: notificationId, channel: "email", endpoint: "", status,
    attempts: (prev?.attempts ?? 0) + 1, last_error: error, sent_at: status === "sent" ? new Date().toISOString() : null,
  }, { onConflict: "notification_id,channel,endpoint" });
  if (!user?.email) { await record("skipped", "Ingen e-mailadresse"); return false; }

  const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  if (!apiKey) { await record("failed", "RESEND_API_KEY mangler"); return false; }

  const res = await sendTemplateMail({
    apiKey, to: user.email, templateId, subject: r.mail.subject,
    variables: buildMailVariables(r.mailVars, user.name), idempotencyKey: `notification-${notificationId}`,
  });
  await record(res.ok ? "sent" : "failed", res.ok ? null : res.error ?? null);
  return !res.ok && res.retryable;
}

async function logError(db: Db, message: string, context: Record<string, unknown>) {
  try { await db.rpc("log_client_error", { p_message: message, p_source: "edge:notify", p_context: context }); } catch { /* aldrig blokere */ }
}

async function processEvent(db: Db, ev: EventRow, flags: Flags) {
  // Claim: kun én kørsel ad gangen får lov at tage en ventende hændelse.
  const { data: claimed } = await db.from("notification_events")
    .update({ attempts: ev.attempts + 1 }).eq("id", ev.id).eq("status", "pending").eq("attempts", ev.attempts).select("id");
  if (!claimed?.length) return "skipped";

  try {
    const plans = await planEvent(db, ev);
    let retry = false;
    for (const plan of plans) {
      try {
        const out = await deliver(db, ev, plan, flags);
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

    const { data: flagRows } = await db.from("app_flags").select("key, value")
      .in("key", ["notifications_push_enabled", "notifications_email_enabled", "notifications_test_users"]);
    const flagValue = (k: string) => (flagRows ?? []).find((f: { key: string }) => f.key === k)?.value;
    const testList = flagValue("notifications_test_users");
    const flags: Flags = {
      push: flagValue("notifications_push_enabled") === true,
      email: flagValue("notifications_email_enabled") === true,
      testUsers: new Set(Array.isArray(testList) ? testList.map(String) : []),
    };

    let q = db.from("notification_events").select("id, event_key, kind, payload, attempts").eq("status", "pending");
    if (body?.event_id) q = q.eq("id", body.event_id);
    else q = q.lt("created_at", new Date(Date.now() - 15_000).toISOString()).lte("available_at", new Date().toISOString());
    const { data: events, error } = await q.order("created_at").limit(BATCH);
    if (error) throw error;

    const summary: Record<string, number> = {};
    for (const ev of events ?? []) {
      const outcome = await processEvent(db, ev as EventRow, flags);
      summary[outcome] = (summary[outcome] ?? 0) + 1;
    }
    return json({ processed: events?.length ?? 0, push: flags.push, email: flags.email, testUsers: flags.testUsers.size, ...summary });
  } catch (e) {
    console.error("notify:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
