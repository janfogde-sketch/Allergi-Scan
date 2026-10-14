import { Buffer } from "node:buffer";
// Proxy til produktbilleder fra Open Food Facts: billedet hentes af vores server uden brugerens oplysninger.
// Kun OFFs produktmappe og kun billedfiler tillades, så funktionen ikke kan misbruges som "hent hvad som helst".
const OFF_HOST = "https://images.openfoodfacts.org/";
const PATH_RE = /^images\/products\/(\d+\/){1,5}[\w.-]+\.(jpg|jpeg|png|webp)$/i;
export const MAX_BYTES = 2 * 1024 * 1024;

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
