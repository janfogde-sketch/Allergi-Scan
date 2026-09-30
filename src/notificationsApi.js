// @ts-nocheck
// Læsning af egne beskeder (tabellen `notifications`, RLS: kun modtageren) og
// markering som læst via RPC'en mark_notification_read. Oprettelse af beskeder
// sker udelukkende på serveren (edge-funktionen `notify`), se src/CONTEXT.md
// afsnit 14.
import { SUPABASE_URL } from "./constants.jsx";
import { makeHeaders } from "./helpers.js";

const COLUMNS = "id,type,variant,category,title,push_body,content_blocks,primary_action,entity_type,entity_id,event_at,created_at,read_at,expires_at";
export const PENDING_KEY = "as_pending_notification";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Id fra ?notification=… — kun et gyldigt uuid accepteres, alt andet ignoreres. */
export function readNotificationParam(search) {
  const id = new URLSearchParams(search).get("notification");
  return id && UUID.test(id) ? id.toLowerCase() : null;
}

/** Liste over egne beskeder, nyeste først. */
export async function fetchNotificationList(accessToken, limit = 50) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/notifications?select=${COLUMNS}&order=created_at.desc&limit=${limit}`,
    { headers: makeHeaders(accessToken) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Én besked. `notfound` dækker både slettet/udløbet besked og en besked, der
 * tilhører en anden konto — RLS gør de to ens, så indholdet aldrig afsløres.
 */
export async function fetchNotification(accessToken, id) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?select=${COLUMNS}&id=eq.${encodeURIComponent(id)}&limit=1`,
      { headers: makeHeaders(accessToken) },
    );
    if (!res.ok) return { status: "error" };
    const rows = await res.json();
    const item = rows?.[0];
    if (!item) return { status: "notfound" };
    if (item.expires_at && Date.parse(item.expires_at) < Date.now()) return { status: "notfound" };
    return { status: "ok", item };
  } catch {
    return { status: "error" };
  }
}

export async function markNotificationRead(accessToken, id) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/mark_notification_read`, {
      method: "POST",
      headers: makeHeaders(accessToken),
      body: JSON.stringify({ p_id: id }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Status for en invitation (kun den, der har oprettet den, kan læse den — RLS).
 * "inactive" = ikke længere ventende eller udløbet; "unknown" ved fejl (knappen vises så som hidtil).
 */
export async function fetchInviteStatus(accessToken, inviteId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/family_invites?select=status,expires_at&id=eq.${encodeURIComponent(inviteId)}&limit=1`,
      { headers: makeHeaders(accessToken) },
    );
    if (!res.ok) return "unknown";
    const row = (await res.json())?.[0];
    if (!row) return "inactive";
    if (row.status !== "pending" || Date.parse(row.expires_at) <= Date.now()) return "inactive";
    return "active";
  } catch {
    return "unknown";
  }
}
