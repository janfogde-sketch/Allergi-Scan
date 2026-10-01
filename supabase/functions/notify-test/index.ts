// supabase/functions/notify-test/index.ts
//
// Sender en TESTVERSION af en notifikation med opdigtede data til en valgt admin-bruger
// (admin → Notifikationer). Kategori 2 i .claude/rules/edge-function-auth.md: kræver login
// OG admin-rolle hos kalderen; modtageren skal også være admin, så testen aldrig rammer
// almindelige brugere. Der oprettes ingen besked i appen og ingen hændelse — kun push og/eller mail.
//
// Kald: POST { userId, key, channels: ["push","mail"] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderNotification, DEFINITIONS } from "../_shared/notificationContent.js";
import { mockDataFor } from "../_shared/notificationMock.js";
import { sendWebPush } from "../_shared/webpush.ts";
import { RESEND_TEMPLATES, buildMailVariables, sendTemplateMail } from "../_shared/mailSend.ts";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const APP_URL = "https://www.eatsafe.dk";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Brug POST" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Ikke autoriseret" }, 401);
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
  const { data: { user: caller } } = await userClient.auth.getUser();
  if (!caller) return json({ error: "Ikke autoriseret" }, 401);

  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const { data: me } = await db.from("users").select("role").eq("id", caller.id).maybeSingle();
  if (me?.role !== "admin") return json({ error: "Kun admins kan sende test" }, 403);

  const body = await req.json().catch(() => ({}));
  const key = String(body?.key ?? "");
  const userId = String(body?.userId ?? "");
  const channels: string[] = Array.isArray(body?.channels) ? body.channels : [];
  if (!DEFINITIONS[key as keyof typeof DEFINITIONS]) return json({ error: "Ukendt notifikation" }, 400);
  if (!userId) return json({ error: "Vælg en modtager" }, 400);
  if (!channels.some((c) => c === "push" || c === "mail")) return json({ error: "Vælg push og/eller mail" }, 400);

  const { data: target } = await db.from("users").select("id, name, email, role").eq("id", userId).maybeSingle();
  if (!target || target.role !== "admin") return json({ error: "Modtageren skal være en admin-bruger" }, 400);

  const { data: ov } = await db.from("notification_push_overrides").select("title, body").eq("key", key).maybeSingle();
  const r = renderNotification(key, mockDataFor(key), { pushOverride: ov ?? undefined });
  const result: Record<string, unknown> = { key };

  if (channels.includes("push")) {
    const { data: tokens } = await db.from("push_tokens").select("token").eq("user_id", userId);
    let sent = 0, failed = 0;
    const errors: string[] = [];
    for (const { token } of tokens ?? []) {
      let sub;
      try { sub = JSON.parse(token); } catch { continue; }
      if (!sub?.endpoint || !sub?.keys) continue;
      const res = await sendWebPush(sub, {
        title: `[TEST] ${r.pushTitle}`, body: r.pushBody, icon: "/icon-192.png", lang: "da",
        url: `${APP_URL}/`, tag: `test:${key}`,
      }, {
        vapidPublicKey: Deno.env.get("VAPID_PUBLIC_KEY")!, vapidPrivateKey: Deno.env.get("VAPID_PRIVATE_KEY")!,
        vapidSubject: Deno.env.get("VAPID_SUBJECT") ?? "mailto:hej@eatsafe.dk", ttlSeconds: 300,
      });
      if (res.ok) sent++;
      else {
        failed++;
        errors.push(res.gone ? "Abonnementet er udløbet" : res.error ?? "Ukendt fejl");
        if (res.gone) await db.from("push_tokens").delete().eq("user_id", userId).eq("token", token);
      }
    }
    result.push = { devices: (tokens ?? []).length, sent, failed, errors: [...new Set(errors)] };
  }

  if (channels.includes("mail")) {
    const templateId = RESEND_TEMPLATES[key];
    const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    if (!templateId) result.mail = { sent: false, error: "Denne notifikation har ingen mail" };
    else if (!apiKey) result.mail = { sent: false, error: "RESEND_API_KEY mangler" };
    else if (!target.email) result.mail = { sent: false, error: "Modtageren har ingen e-mailadresse" };
    else {
      const m = await sendTemplateMail({
        apiKey, to: target.email, templateId, subject: `[TEST] ${r.mail.subject}`,
        variables: buildMailVariables(r.mailVars, target.name), idempotencyKey: `notify-test-${crypto.randomUUID()}`,
      });
      result.mail = { sent: m.ok, error: m.ok ? null : m.error };
    }
  }
  return json(result);
});
