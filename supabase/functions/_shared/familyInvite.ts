// supabase/functions/_shared/familyInvite.ts
//
// Rene hjælpere til familie-invitationer (e-mail-bundne, 3. okt. 2026). Testet i src/familyInvite.test.js.

/** Misbrugsværn: højst så mange invitationsmails pr. bruger pr. døgn (nye + "send igen"). */
export const MAX_INVITE_MAILS_PER_DAY = 10;
// Højst så mange invitationer pr. modtageradresse pr. døgn, uanset afsender (hindrer, at en adresse oversvømmes).
export const MAX_INVITES_PER_RECIPIENT_PER_DAY = 3;

/** Små bogstaver, uden mellemrum rundt om. */
export function normalizeInviteEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

/** Enkelt, bevidst stramt tjek: ét @, tekst på begge sider, domæne med punktum, kun ASCII (som resten af appen). */
export function isValidInviteEmail(email: string): boolean {
  if (email.length < 5 || email.length > 254) return false;
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email);
}

/** "i dag kl. 14.30" / "i morgen kl. 09.10" på dansk tid, til mailen. */
export function formatInviteExpiry(expiresAt: Date, now: Date = new Date()): string {
  const tz = "Europe/Copenhagen";
  const time = new Intl.DateTimeFormat("da-DK", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false })
    .format(expiresAt).replace(":", ".");
  const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
  if (dayKey(expiresAt) === dayKey(now)) return `i dag kl. ${time}`;
  if (dayKey(expiresAt) === dayKey(new Date(now.getTime() + 864e5))) return `i morgen kl. ${time}`;
  const date = new Intl.DateTimeFormat("da-DK", { timeZone: tz, weekday: "long", day: "numeric", month: "short" }).format(expiresAt);
  return `${date} kl. ${time}`;
}
