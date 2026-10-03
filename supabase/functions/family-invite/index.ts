// family-invite: opretter en familie-invitation til en e-mailadresse og sender mailen (3. okt. 2026).
// Auth-kategori 1 (kræver bruger-login). Klienten kan ikke længere oprette invitationer selv (RLS-politikken er fjernet),
// så antal og afsendelse styres her. Tokenet returneres aldrig til klienten; det findes kun i mailen.
//
//   POST { email }      → opret invitation og send mail
//   POST { kind: "link" } → opret et delt link (ingen e-mail); afsenderen får URL'en og skal selv godkende, hvem der bruger det
//   POST { resend_id }  → send mailen igen (pause mellem hver afsendelse)
import { createClient } from "jsr:@supabase/supabase-js@2";
import { sendHtmlMail } from "../_shared/mailSend.ts";
import { renderInviteMail, inviteMailSubject } from "../_shared/inviteMail.ts";
import {
  MAX_INVITE_MAILS_PER_DAY, normalizeInviteEmail, isValidInviteEmail, formatInviteExpiry,
} from "../_shared/familyInvite.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const RESEND_COOLDOWN_MS = 30 * 60 * 1000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Metode ikke tilladt" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Ikke autoriseret" }, 401);
  const userClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller } } = await userClient.auth.getUser();
  if (!caller) return json({ error: "Ikke autoriseret" }, 401);

  const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  if (!apiKey) return json({ error: "mail_not_configured" }, 500);

  let body: { email?: unknown; resend_id?: unknown; kind?: unknown } = {};
  try { body = await req.json(); } catch { return json({ error: "Ugyldig forespørgsel" }, 400); }

  const { data: me } = await db.from("users").select("name").eq("id", caller.id).maybeSingle();
  const inviterName = (String(me?.name ?? "").trim().split(/\s+/)[0] || "En bruger").slice(0, 30);

  async function sendInviteMail(invite: { id: string; token: string; invitee_email: string; expires_at: string }): Promise<boolean> {
    // En eksisterende bruger får en mail om at logge ind (og bekræfte i appen) i stedet for at oprette sig. Afsenderen får aldrig at vide,
    // om adressen har en konto: svaret fra funktionen er det samme.
    const { data: hasAccount } = await db.rpc("invitee_has_account", { p_email: invite.invitee_email });
    const res = await sendHtmlMail({
      apiKey,
      to: invite.invitee_email,
      subject: inviteMailSubject(inviterName),
      html: renderInviteMail({
        inviterName,
        inviteeEmail: invite.invitee_email,
        inviteUrl: `https://eatsafe.dk/invite/${invite.token}`,
        expiryText: formatInviteExpiry(new Date(invite.expires_at)),
        existingAccount: hasAccount === true,
      }),
      idempotencyKey: `family-invite-${invite.id}-${Math.floor(Date.now() / 60000)}`,
    });
    if (!res.ok) console.error("family-invite: mail fejlede", res.status, res.error);
    return res.ok;
  }

  try {
    // ── Send igen ──────────────────────────────────────────────────────────
    if (typeof body.resend_id === "string") {
      const { data: inv } = await db.from("family_invites")
        .select("id, token, invitee_email, expires_at, mail_sent_at")
        .eq("id", body.resend_id).eq("invited_by", caller.id).eq("status", "pending").maybeSingle();
      if (!inv || !inv.invitee_email || new Date(inv.expires_at) <= new Date()) return json({ error: "invite_not_found" }, 404);
      if (inv.mail_sent_at && Date.now() - new Date(inv.mail_sent_at).getTime() < RESEND_COOLDOWN_MS) {
        return json({ error: "too_soon", retry_after_minutes: Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - new Date(inv.mail_sent_at).getTime())) / 60000) }, 429);
      }
      if (!(await sendInviteMail(inv))) return json({ error: "mail_failed" }, 502);
      await db.from("family_invites").update({ mail_sent_at: new Date().toISOString() }).eq("id", inv.id).eq("invited_by", caller.id);
      return json({ success: true });
    }

    // ── Delt link (afsenderen godkender hver, der bruger det; se accept_family_invite_by_link) ──
    if (body.kind === "link") {
      const since = new Date(Date.now() - 864e5).toISOString();
      const { count } = await db.from("family_invites").select("id", { count: "exact", head: true })
        .eq("invited_by", caller.id).gte("created_at", since);
      if ((count ?? 0) >= MAX_INVITE_MAILS_PER_DAY) return json({ error: "rate_limited" }, 429);
      const { data: link, error: linkError } = await db.from("family_invites")
        .insert({ invited_by: caller.id, kind: "link" })
        .select("id, token, expires_at").single();
      if (linkError || !link) { console.error("family-invite: link fejlede", linkError?.message); return json({ error: "create_failed" }, 500); }
      return json({ success: true, invite: { id: link.id, kind: "link", expires_at: link.expires_at, url: `https://eatsafe.dk/invite/${link.token}` } });
    }

    // ── Ny invitation ──────────────────────────────────────────────────────
    const email = normalizeInviteEmail(body.email);
    if (!isValidInviteEmail(email)) return json({ error: "invalid_email" }, 400);
    if (email === normalizeInviteEmail(caller.email)) return json({ error: "own_email" }, 400);

    const since = new Date(Date.now() - 864e5).toISOString();
    const { count } = await db.from("family_invites").select("id", { count: "exact", head: true })
      .eq("invited_by", caller.id).gte("created_at", since);
    if ((count ?? 0) >= MAX_INVITE_MAILS_PER_DAY) return json({ error: "rate_limited" }, 429);

    const { data: connected } = await db.rpc("invitee_already_connected", { p_inviter: caller.id, p_email: email });
    if (connected === true) return json({ error: "already_connected" }, 409);

    const { data: existing } = await db.from("family_invites").select("id")
      .eq("invited_by", caller.id).eq("invitee_email", email).eq("status", "pending").gt("expires_at", new Date().toISOString()).maybeSingle();
    if (existing) return json({ error: "already_pending", invite_id: existing.id }, 409);

    const { data: invite, error } = await db.from("family_invites")
      .insert({ invited_by: caller.id, invitee_email: email, mail_sent_at: new Date().toISOString() })
      .select("id, token, invitee_email, expires_at").single();
    if (error || !invite) { console.error("family-invite: insert fejlede", error?.message); return json({ error: "create_failed" }, 500); }

    if (!(await sendInviteMail(invite))) {
      // Ingen invitation uden mail: ryd op, så afsenderen kan prøve igen.
      await db.from("family_invites").delete().eq("id", invite.id).eq("invited_by", caller.id);
      return json({ error: "mail_failed" }, 502);
    }
    return json({ success: true, invite: { id: invite.id, invitee_email: invite.invitee_email, expires_at: invite.expires_at } });
  } catch (e) {
    console.error("family-invite fejl:", (e as Error)?.message);
    return json({ error: "server_error" }, 500);
  }
});
