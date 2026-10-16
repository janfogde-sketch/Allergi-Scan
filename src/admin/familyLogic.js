// @ts-check
// Ren logik til familieadministrationen: afledt status på invitationer, gruppering af familier efter ejer og opbygning af oversigten ud fra råtabeller
// (bruges kun, mens databasefunktionerne fra migration 20261016130000 endnu ikke er udgivet).

/** Status som den vises: en ventende invitation med overskredet udløb er udløbet. @param {string} status @param {string|null|undefined} expiresAt @param {number} [now] */
export function inviteStatus(status, expiresAt, now = Date.now()) {
  return status === "pending" && expiresAt && new Date(expiresAt).getTime() < now ? "expired" : status;
}

/** Ejeren af et medlem: familiens ejer, ellers brugeren selv (rækker uden ejer er brugerens egen profil). @param {{ family_owner_id?: string|null, user_id?: string|null }} m */
export const ownerOf = (m) => m.family_owner_id || m.user_id || null;

/**
 * Medlemstype ud fra data, aldrig ud fra navn eller alder. En række i family_members er en profil, som ejeren administrerer (børneprofil): user_id er ejeren eller tom.
 * En række med en ANDEN konto end ejeren kan ikke afgøres sikkert og kaldes "unknown". Voksne med egen konto er de forbundne gennem accepterede invitationer ("adult").
 * @param {{ family_owner_id?: string|null, user_id?: string|null }} m @param {string} ownerId
 */
export const memberType = (m, ownerId) => (!m.user_id || m.user_id === ownerId ? "child" : "unknown");

/** Alder i hele år ud fra fødselsår (kun til visning). @param {number|null|undefined} birthYear @param {number} [year] */
export const ageOf = (birthYear, year = new Date().getFullYear()) => (birthYear ? year - birthYear : null);

/** Betegnelsen under et medlem. @param {{ type: string, birth_year?: number|null }} m */
export function memberLabel(m) {
  if (m.type === "adult") return "Voksen med egen konto";
  if (m.type === "child") { const age = ageOf(m.birth_year); return age !== null && age >= 18 ? "Profil uden egen konto" : "Børneprofil"; }
  return "Medlemstype ukendt";
}

/** Antal familiemedlemmer = profiler + forbundne voksne. Ejeren tælles ikke med. @param {{ profiles?: number, connected?: number }} r */
export const memberCount = (r) => (r.profiles || 0) + (r.connected || 0);

/**
 * Bygger oversigt, invitationsliste og et opslag til detaljer ud fra råtabeller.
 * @param {any[]} members @param {any[]} invites @param {any[]} users
 */
export function buildFromTables(members, invites, users) {
  const byId = new Map(users.map((u) => [u.id, u]));
  /** @type {Map<string, any>} */
  const owners = new Map();
  for (const m of members) {
    const id = ownerOf(m);
    if (!id) continue;
    const o = owners.get(id) || { owner_id: id, name: byId.get(id)?.name ?? null, email: byId.get(id)?.email ?? null, profiles: 0, connected: 0, last_change: null };
    o.profiles++;
    if (!o.last_change || (m.created_at && m.created_at > o.last_change)) o.last_change = m.created_at;
    owners.set(id, o);
  }
  const inv = invites.map((i) => ({
    id: i.id, status: inviteStatus(i.status, i.expires_at), created_at: i.created_at, expires_at: i.expires_at, accepted_at: i.accepted_at,
    invited_by: i.invited_by, inviter_name: byId.get(i.invited_by)?.name ?? null, accepted_by: i.accepted_by,
    accepted_name: i.accepted_by ? byId.get(i.accepted_by)?.name ?? null : null, kind: i.kind ?? null, is_request: !!i.requested_by,
  }));
  const adultsOf = (/** @type {string} */ ownerId) => {
    /** @type {Map<string, any>} */
    const m = new Map();
    for (const i of inv) if (i.invited_by === ownerId && i.status === "accepted" && i.accepted_by && !m.has(i.accepted_by)) m.set(i.accepted_by, { id: `acc-${i.accepted_by}`, name: i.accepted_name, birth_year: null, created_at: i.accepted_at, type: "adult" });
    return [...m.values()];
  };
  for (const i of inv) {
    const o = owners.get(i.invited_by);
    if (o) { if (i.status === "pending") o.pending_invites = (o.pending_invites || 0) + 1; if (i.status === "accepted") o.accepted_invites = (o.accepted_invites || 0) + 1; }
  }
  for (const o of owners.values()) o.connected = adultsOf(o.owner_id).length;
  const rows = [...owners.values()].map((o) => ({ pending_invites: 0, accepted_invites: 0, ...o })).sort((a, b) => String(b.last_change).localeCompare(String(a.last_change)));
  const detail = (/** @type {string} */ ownerId) => ({
    owner: byId.get(ownerId) ? { id: ownerId, name: byId.get(ownerId).name, email: byId.get(ownerId).email } : null,
    members: [
      ...members.filter((m) => ownerOf(m) === ownerId).map((m) => ({ id: m.id, name: m.name, birth_year: m.birth_year, created_at: m.created_at, type: memberType(m, ownerId) })),
      ...adultsOf(ownerId),
    ],
    invites: inv.filter((i) => i.invited_by === ownerId),
  });
  return { rows, invites: inv, detail };
}

/** Søgning i ejernes navn og e-mail (kun til den midlertidige visning uden databasefunktion). @param {any[]} rows @param {string} q */
export function filterOwners(rows, q) {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((r) => String(r.name || "").toLowerCase().includes(s) || String(r.email || "").toLowerCase().includes(s));
}
