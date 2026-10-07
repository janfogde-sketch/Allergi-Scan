// supabase/functions/_shared/standardWebhook.ts
//
// Verificerer signaturen på en webhook efter Standard Webhooks-formatet (https://www.standardwebhooks.com),
// som Supabase Auth bruger til Send Email Hook. Kun WebCrypto, så koden kører i Deno og i Vitest.
//
// Headers: webhook-id, webhook-timestamp (sekunder) og webhook-signature ("v1,<base64>", flere adskilt af mellemrum).
// Signeret indhold: `${id}.${timestamp}.${body}`, HMAC-SHA256 med nøglen fra hemmeligheden ("v1,whsec_<base64>").

const b64decode = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyStandardWebhook(
  body: string,
  headers: Headers | Record<string, string | undefined>,
  secret: string,
  opts: { now?: number; toleranceSeconds?: number } = {},
): Promise<boolean> {
  const get = (name: string) => (headers instanceof Headers ? headers.get(name) : headers[name]) ?? "";
  const id = get("webhook-id");
  const timestamp = get("webhook-timestamp");
  const signatures = get("webhook-signature");
  if (!id || !timestamp || !signatures || !secret) return false;

  // Afvis gamle og fremtidige beskeder (replay-beskyttelse)
  const ts = Number(timestamp);
  const now = (opts.now ?? Date.now()) / 1000;
  if (!Number.isFinite(ts) || Math.abs(now - ts) > (opts.toleranceSeconds ?? 300)) return false;

  let keyBytes: Uint8Array<ArrayBuffer>;
  try { keyBytes = b64decode(secret.trim().replace(/^v1,/, "").replace(/^whsec_/, "")); } catch { return false; }
  if (keyBytes.length === 0) return false;

  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)));

  for (const part of signatures.split(" ")) {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) continue;
    let got: Uint8Array;
    try { got = b64decode(sig); } catch { continue; }
    if (timingSafeEqual(got, expected)) return true;
  }
  return false;
}
