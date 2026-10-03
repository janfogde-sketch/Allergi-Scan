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
