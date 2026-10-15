import { Buffer } from "node:buffer";
// Proxy til produktbilleder fra Open Food Facts: billedet hentes af vores server uden brugerens oplysninger.
// Kun OFFs produktmappe og kun billedfiler tillades, så funktionen ikke kan misbruges som "hent hvad som helst".
const OFF_HOST = "https://images.openfoodfacts.org/";
const PATH_RE = /^images\/products\/(\d+\/){1,5}[\w.-]+\.(jpg|jpeg|png|webp)$/i;
export const MAX_BYTES = 2 * 1024 * 1024;

// Spærring mod misbrug (sikkerhedsfund S6, 15. okt. 2026). Kun billeder, der ikke allerede ligger i Vercels cache, når hertil,
// og hver af dem koster lidt af kvoten. Derfor: 1) kun kald fra vores egne sider, 2) højst RATE_MAX nye billeder pr. minut pr. IP.
// Tælleren bor i hukommelsen pr. server-kopi (ingen database, ingen ny leverandør); Vercels firewall ligger ovenpå.
const OWN_HOSTS = new Set(["www.eatsafe.dk", "eatsafe.dk", "dev.eatsafe.dk"]);
export const RATE_MAX = 120;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_KEYS = 5000;
const hits = new Map();

/** @param {Record<string, string | string[] | undefined>} headers */
function header(headers, k) {
  const v = headers?.[k];
  return Array.isArray(v) ? v[0] || "" : v || "";
}

// Kommer kaldet fra en af vores egne sider? Moderne browsere sender Sec-Fetch-Site; ellers bruges Referer.
export function isOwnPageRequest(headers) {
  const site = header(headers, "sec-fetch-site");
  if (site) return site === "same-origin" || site === "same-site";
  try { return OWN_HOSTS.has(new URL(header(headers, "referer")).hostname); } catch { return false; }
}

export function clientIp(headers) {
  return header(headers, "x-forwarded-for").split(",")[0].trim() || header(headers, "x-real-ip") || "ukendt";
}

// Sand, hvis IP'en har brugt sin kvote i det nuværende minut.
export function overRateLimit(ip, now = Date.now()) {
  let h = hits.get(ip);
  if (!h || now - h.start >= RATE_WINDOW_MS) {
    if (!h && hits.size >= RATE_MAX_KEYS) hits.clear();
    h = { start: now, count: 0 };
    hits.set(ip, h);
  }
  h.count += 1;
  return h.count > RATE_MAX;
}

export function resetRateLimit() { hits.clear(); }

// Returnerer null, når kaldet må fortsætte, ellers { status, error, retryAfter? }.
export function checkOffImageAccess(headers, now = Date.now()) {
  if (!isOwnPageRequest(headers)) return { status: 403, error: "kun fra eatsafe.dk" };
  if (overRateLimit(clientIp(headers), now)) return { status: 429, error: "for mange billeder", retryAfter: 60 };
  return null;
}

export function validOffImagePath(p) {
  return typeof p === "string" && p.length <= 200 && !p.includes("..") && PATH_RE.test(p);
}

// Returnerer { status, headers, body (Buffer) } eller { status, error }.
export async function fetchOffImage(p, fetchImpl = fetch) {
  if (!validOffImagePath(p)) return { status: 400, error: "ugyldig sti" };
  let r;
  try {
    r = await fetchImpl(OFF_HOST + p, {
      headers: { "User-Agent": "EatSafe/1.0 (+https://www.eatsafe.dk)" },
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return { status: 502, error: "kilde utilgængelig" };
  }
  if (r.status === 404) return { status: 404, error: "ikke fundet" };
  if (!r.ok) return { status: 502, error: "kilde fejlede" };
  const type = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!/^image\/(jpeg|png|webp)$/.test(type)) return { status: 502, error: "ikke et billede" };
  const len = Number(r.headers.get("content-length") || 0);
  if (len > MAX_BYTES) return { status: 413, error: "for stort" };
  const body = Buffer.from(await r.arrayBuffer());
  if (body.length > MAX_BYTES) return { status: 413, error: "for stort" };
  return {
    status: 200,
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
    body,
  };
}
