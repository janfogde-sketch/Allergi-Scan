// @ts-nocheck
// Læsning af egne beskeder (tabellen `notifications`, RLS: kun modtageren),
// markering som læst via RPC'en mark_notification_read og sletning via
// delete_notification (begge kun for egne rækker). Oprettelse af beskeder
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

/** Sletter en egen besked (RPC delete_notification). Falsk ved netværks-/serverfejl; en besked, der allerede er væk, tæller som slettet. */
export async function deleteNotification(accessToken, id) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/delete_notification`, {
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

/**
 * Egen feedback-ticket (RLS: kun den, der har sendt den). `notfound` dækker slettet ticket og en anden
 * kontos ticket. Billedet (image_base64) hentes bevidst ikke.
 */
export async function fetchTicket(accessToken, id) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/feedback_tickets?select=id,type,description,status,admin_note,created_at&id=eq.${encodeURIComponent(id)}&limit=1`,
      { headers: makeHeaders(accessToken) },
    );
    if (!res.ok) return { status: "error" };
    const item = (await res.json())?.[0];
    return item ? { status: "ok", item } : { status: "notfound" };
  } catch {
    return { status: "error" };
  }
}

export const TICKET_STATUS_LABELS = { open: "Åben", in_progress: "I gang", resolved: "Løst" };

