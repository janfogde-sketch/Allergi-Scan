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
import { formatDanishDeadline, formatNames, itemCountText, bulletList, affectedAllergenChanges, summarizeAllergenChanges } from "../_shared/notifyHelpers.js";
import { eanVariants } from "../_shared/recallParser.js";
import { RESEND_TEMPLATES, MAIL_ONLY_WITHOUT_PUSH, buildMailVariables, sendTemplateMail, sendHtmlMail } from "../_shared/mailSend.ts";
import { LIST_MAIL_KEYS, renderListMail } from "../_shared/listMail.ts";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const APP_URL = "https://www.eatsafe.dk";
const MAX_ATTEMPTS = 5;
const BATCH = 20;

type EventRow = { id: string; event_key: string; kind: string; payload: Record<string, unknown>; attempts: number };
type Flags = { push: boolean; email: boolean; testUsers: Set<string>; overrides: Record<string, { title?: string | null; body?: string | null }> };
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
      const { data: inv } = await db.from("family_invites").select("id, kind, invited_by, accepted_by, accepted_at").eq("id", p.invite_id).maybeSingle();
      if (!inv?.invited_by || !inv?.accepted_by) return [];
      // Delt link: afsenderen har selv godkendt, så beskeden går til DEN, DER BAD om forbindelsen (ikke til den, der godkendte).
      if (inv.kind === "link") {
        const { data: sender } = await db.from("users").select("name").eq("id", inv.invited_by).maybeSingle();
        return [{
          userId: inv.accepted_by, templateKey: "N11:approved", eventAt: inv.accepted_at ?? undefined,
          data: { memberName: sender?.name, inviteId: inv.id },
        }];
      }
      const { data: who } = await db.from("users").select("name").eq("id", inv.accepted_by).maybeSingle();
      return [{
        userId: inv.invited_by, templateKey: "N5:default", eventAt: inv.accepted_at ?? undefined,
        data: { memberName: who?.name, inviteId: inv.id },
      }];
    }
    case "family_link_requested": {
      // Nogen har brugt afsenderens delte link og venter på godkendelse (N10 til afsenderen).
      const { data: inv } = await db.from("family_invites").select("id, kind, status, invited_by, requested_by").eq("id", p.invite_id).maybeSingle();
      if (!inv?.invited_by || !inv?.requested_by || inv.kind !== "link" || inv.status !== "pending") return []; // allerede besvaret eller trukket tilbage
      const { data: who } = await db.from("users").select("name").eq("id", inv.requested_by).maybeSingle();
      return [{ userId: inv.invited_by, templateKey: "N10:default", data: { memberName: who?.name, inviteId: inv.id } }];
    }
    case "family_link_declined": {
      // Afsenderen har afvist eller annulleret, efter at nogen bad om forbindelse (N11:declined til den, der bad). Rækken kan være slettet,
      // så id'erne ligger i hændelsen. Er afsenderens konto slettet, sendes intet.
      const requesterId = String(p.requester_id ?? ""), inviterId = String(p.inviter_id ?? "");
      if (!requesterId || !inviterId) return [];
      const { data: sender } = await db.from("users").select("name").eq("id", inviterId).maybeSingle();
      if (!sender) return [];
      const { data: requester } = await db.from("users").select("id").eq("id", requesterId).maybeSingle();
      if (!requester) return [];
      return [{ userId: requesterId, templateKey: "N11:declined", data: { memberName: sender.name, inviteId: String(p.invite_id ?? "") } }];
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
      // Navnene på dem, der har tilføjet varer (fornavn), så beskeden kan sige HVEM: "Jan og Bjørn har tilføjet 4 varer til Weekend".
      const adderIds = [...new Set(items.map((i: { added_by: string }) => i.added_by))];
      const { data: adders } = await db.from("users").select("id, name").in("id", adderIds);
      const nameById = new Map((adders ?? []).map((u: { id: string; name: string | null }) => [u.id, u.name ?? ""] as [string, string]));
      const plans: Planned[] = [];
      for (const userId of recipients) {
        const theirs = items.filter((i: { added_by: string }) => i.added_by !== userId);
        if (theirs.length === 0) continue;
        plans.push({
          userId, templateKey: theirs.length === 1 ? "P3:one" : "P3:many",
          data: {
            listName: list.name, listId: list.id,
            adders: formatNames(theirs.map((i: { added_by: string }) => nameById.get(i.added_by) ?? "")),
            countText: itemCountText(theirs.length),
            itemList: bulletList(theirs.map((i: { name: string }) => i.name)),
          },
        });
      }
      return plans;
    }
    case "product_allergen_changed": {
      const { data: prod } = await db.from("products").select("id, ean, name, brand, allergen_flags").eq("id", p.product_id).maybeSingle();
      if (!prod) return [];
      const since = new Date(Date.now() - 90 * 86400_000).toISOString();
      // Kandidater: favoritter, aktuelle lister (ejer + adgang) og scanninger de sidste 90 dage.
      const ids = new Set<string>();
      if (prod.ean) {
        const { data: fav } = await db.from("favorites").select("user_id").eq("ean", prod.ean);
        for (const r of fav ?? []) if (r.user_id) ids.add(r.user_id);
      }
      const { data: scans } = await db.from("scan_history").select("user_id")
        .or(`product_id.eq.${prod.id}${prod.ean ? `,ean_scanned.eq.${prod.ean}` : ""}`).gte("scanned_at", since).not("user_id", "is", null);
      for (const r of scans ?? []) ids.add(r.user_id);
      const { data: items } = await db.from("shopping_list_items").select("list_id")
        .or(`product_id.eq.${prod.id}${prod.ean ? `,ean.eq.${prod.ean}` : ""}`);
      const listIds = [...new Set((items ?? []).map((i: { list_id: string }) => i.list_id))];
      if (listIds.length) {
        const { data: lists } = await db.from("shopping_lists").select("owner_id").in("id", listIds);
        for (const l of lists ?? []) if (l.owner_id) ids.add(l.owner_id);
        const { data: acc } = await db.from("shopping_list_access").select("user_id").in("list_id", listIds);
        for (const a of acc ?? []) ids.add(a.user_id);
      }
      if (ids.size === 0) return [];

      const userIds = [...ids];
      const { data: own } = await db.from("user_allergens").select("user_id, allergen").in("user_id", userIds).is("family_member_id", null).eq("type", "allergen");
      const { data: members } = await db.from("family_members").select("user_id, allergens, allergen_levels").in("user_id", userIds);
      const { data: levelRows } = await db.from("users").select("id, allergen_levels").in("id", userIds);
      const byUser = new Map<string, string[]>();
      // Allergener, hvor mindst én af modtagerens profiler også reagerer på spor (strengeste profil vinder)
      const strictFor = new Map<string, Set<string>>();
      const ownLevels = new Map<string, Record<string, string>>((levelRows ?? []).map((r: { id: string; allergen_levels: Record<string, string> }) => [r.id, r.allergen_levels ?? {}]));
      const add = (u: string, a: unknown, levels?: Record<string, string> | null) => {
        const id = typeof a === "string" ? a : (a as { id?: string })?.id;
        if (!u || !id) return;
        byUser.set(u, [...(byUser.get(u) ?? []), id]);
        if (levels?.[id] !== "direct_only") strictFor.set(u, (strictFor.get(u) ?? new Set()).add(id));
      };
      for (const r of own ?? []) add(r.user_id, r.allergen, ownLevels.get(r.user_id));
      for (const m of members ?? []) if (Array.isArray(m.allergens)) for (const a of m.allergens) add(m.user_id, a, m.allergen_levels);

      const productName = productLabel({ brand: prod.brand, name: prod.name });
      const plans: Planned[] = [];
      for (const userId of userIds) {
        const mine = byUser.get(userId) ?? [];
        const tracesIgnored = new Set(mine.filter((id) => !(strictFor.get(userId)?.has(id))));
        const hits = affectedAllergenChanges(p.changes as Record<string, { old: string }>, prod.allergen_flags, mine, tracesIgnored);
        if (hits.length === 0) continue; // berører ingen af modtagerens profiler, eller er rullet tilbage
        plans.push({ userId, templateKey: "P1:default", data: { productName, ean: prod.ean, changeSummary: summarizeAllergenChanges(hits) } });
      }
      return plans;
    }
    case "recall_published": {
      const { data: rc } = await db.from("recalls").select("id, source_url, reason, affected, action, eans, status").eq("id", p.recall_id).maybeSingle();
      // Kun bekræftede (status ready) tilbagekaldelser med gyldige EAN'er sendes; annulleret/arkiveret → ingen besked.
      if (!rc || rc.status !== "ready" || !rc.eans?.length) return [];
      const variants = [...new Set((rc.eans as string[]).flatMap((e) => eanVariants(e)))];
      const { data: prods } = await db.from("products").select("id, ean, name, brand").in("ean", variants);
      const prodByEan = new Map<string, { id: string; ean: string; name: string; brand: string }>();
      for (const pr of prods ?? []) prodByEan.set(pr.ean, pr);
      const since = new Date(Date.now() - 90 * 86400_000).toISOString();

      // bruger → første matchede EAN (som den står i databasen)
      const hit = new Map<string, string>();
      const mark = (userId: string | null | undefined, ean: string | null | undefined) => {
        if (userId && ean && !hit.has(userId)) hit.set(userId, ean);
      };
      const { data: fav } = await db.from("favorites").select("user_id, ean").in("ean", variants);
      for (const r of fav ?? []) mark(r.user_id, r.ean);
      const { data: scans } = await db.from("scan_history").select("user_id, ean_scanned").in("ean_scanned", variants).gte("scanned_at", since).not("user_id", "is", null);
      for (const r of scans ?? []) mark(r.user_id, r.ean_scanned);
      const { data: items } = await db.from("shopping_list_items").select("list_id, ean").in("ean", variants);
      const listEan = new Map<string, string>();
      for (const i of items ?? []) if (i.list_id && i.ean && !listEan.has(i.list_id)) listEan.set(i.list_id, i.ean);
      if (listEan.size) {
        const listIds = [...listEan.keys()];
        const { data: lists } = await db.from("shopping_lists").select("id, owner_id").in("id", listIds);
        for (const l of lists ?? []) mark(l.owner_id, listEan.get(l.id));
        const { data: acc } = await db.from("shopping_list_access").select("list_id, user_id").in("list_id", listIds);
        for (const a of acc ?? []) mark(a.user_id, listEan.get(a.list_id));
      }

      const plans: Planned[] = [];
      for (const [userId, ean] of hit) {
        const prod = prodByEan.get(ean);
        plans.push({
          userId, templateKey: "P6:default",
          data: {
            productName: prod ? productLabel({ brand: prod.brand, name: prod.name }) : "", ean: prod?.ean ?? ean,
            recallReason: rc.reason, affectedBatches: rc.affected, recallAction: rc.action, recallUrl: rc.source_url, recallId: rc.id,
          },
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
  const r = renderNotification(plan.templateKey, plan.data, { pushOverride: flags.overrides[plan.templateKey] });

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
    title: r.pushTitle, body: r.pushBody, icon: "/icon-192.png", lang: "da",
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
  const direct = LIST_MAIL_KEYS.has(r.key); // P3 sendes som direkte HTML fra repoet (ikke Resend-skabelonen)
  const templateId = RESEND_TEMPLATES[r.key];
  if (!templateId && !direct) return false; // varianten har ingen mail (endnu)
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

  const variables = buildMailVariables(r.mailVars, user.name);
  const res = direct
    ? await sendHtmlMail({ apiKey, to: user.email, subject: r.mail.subject, html: renderListMail(variables), idempotencyKey: `notification-${notificationId}` })
    : await sendTemplateMail({ apiKey, to: user.email, templateId, subject: r.mail.subject, variables, idempotencyKey: `notification-${notificationId}` });
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
      overrides: {},
    };

    const { data: ovRows } = await db.from("notification_push_overrides").select("key, title, body");
    for (const o of ovRows ?? []) flags.overrides[o.key] = { title: o.title, body: o.body };

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
