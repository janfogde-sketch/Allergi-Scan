// @ts-nocheck
// Samler familie-invitationer til sheetet: dem der matcher kontoens bekræftede e-mail, og den, brugeren kom fra via linket i mailen
// (uanset loginmetode og adresse, fx Facebook). En invitation, der findes begge steder, vises kun én gang. Testet i familyInviteInbox.test.js.

/** @param emailInvites liste fra get_my_pending_family_invites; @param linkInvite objekt fra get_family_invite_by_link (eller null) */
export function mergeInvites(emailInvites, linkInvite, token) {
  const list = Array.isArray(emailInvites) ? emailInvites.map(i => ({ ...i })) : [];
  if (linkInvite && linkInvite.id && token) {
    const existing = list.find(i => i.id === linkInvite.id);
    if (existing) existing.viaToken = token;
    else list.unshift({ ...linkInvite, viaToken: token });
  }
  return list;
}

/** Første invitation, som brugeren ikke har udsat. */
export function nextInvite(invites, dismissedIds) {
  return invites.find(i => !dismissedIds.includes(i.id)) || null;
}

export const INVITE_TOKEN_EVENT = "eatsafe:invite-token";
const TOKEN_RE = /^[A-Za-z0-9]{16,128}$/;

/** Henter invitationens token ud af et indsat link (`.../invite/<token>`, `?invite=<token>`) eller en ren kode. Returnerer null, hvis intet findes. */
export function parseInviteToken(input) {
  const s = String(input ?? "").trim();
  if (!s) return null;
  if (TOKEN_RE.test(s)) return s;
  const fromPath = s.match(/\/invite\/([A-Za-z0-9]{16,128})(?![A-Za-z0-9])/);
  if (fromPath) return fromPath[1];
  const fromQuery = s.match(/[?&]invite=([A-Za-z0-9]{16,128})(?![A-Za-z0-9])/);
  return fromQuery ? fromQuery[1] : null;
}

/**
 * Forklaring til brugeren, når et gemt invitationslink ikke kan bruges (svar fra get_family_invite_link_status).
 * null = ingen besked (ikke en fejl for brugeren): egen invitation, allerede brugt af brugeren selv, eller den kan bruges.
 */
export function linkStatusMessage(status) {
  switch (status) {
    case "locked": return "Linket er allerede brugt af en anden. Bed afsenderen om et nyt link.";
    case "used": return "Invitationen er allerede brugt. Bed afsenderen om en ny.";
    case "expired": return "Invitationen er udløbet. Bed afsenderen om en ny.";
    case "revoked": return "Invitationen er trukket tilbage. Bed afsenderen om en ny.";
    case "awaiting": return "Din anmodning er sendt og venter på, at afsenderen godkender.";
    case "unknown": return "Vi kunne ikke finde invitationen. Tjek, at du har indsat hele linket.";
    default: return null; // own, mine, ok
  }
}

// ── Gemt invitationstoken (localStorage) ────────────────────────────────────
const INVITE_TOKEN_KEY = "as_pending_invite";
const INVITE_TS_KEY = "as_pending_invite_ts";
/** Så længe efter et fulgt link starter en udlogget bruger på login/oprettelse i stedet for velkomstsiden. */
export const INVITE_ROUTE_WINDOW_MS = 30 * 60 * 1000;

export function storeInviteToken(token, now = Date.now()) {
  try { localStorage.setItem(INVITE_TOKEN_KEY, token); localStorage.setItem(INVITE_TS_KEY, String(now)); } catch { /* ingen lagring */ }
}
export function readInviteToken() { try { return localStorage.getItem(INVITE_TOKEN_KEY); } catch { return null; } }
export function clearInviteToken() { try { localStorage.removeItem(INVITE_TOKEN_KEY); localStorage.removeItem(INVITE_TS_KEY); } catch { /* ingen lagring */ } }

/**
 * Har brugeren for nylig fulgt et invitationslink? Første besøg registrerer service workeren og genindlæser siden én gang (index.html),
 * og så er ?invite= væk fra adressen. Uden dette ville en ny bruger lande på velkomstsiden i stedet for oprettelsen. Et gammelt,
 * glemt token (ældre end vinduet) styrer ikke længere startskærmen.
 */
export function recentInviteLinkFollowed(now = Date.now()) {
  try {
    if (!localStorage.getItem(INVITE_TOKEN_KEY)) return false;
    const ts = Number(localStorage.getItem(INVITE_TS_KEY));
    return Number.isFinite(ts) && ts > 0 && now - ts >= 0 && now - ts < INVITE_ROUTE_WINDOW_MS;
  } catch { return false; }
}
