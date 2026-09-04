// supabase/functions/send-push/index.ts
// Sender Web Push notifikation til en bruger via VAPID
// Kald: POST { user_id, title, body, url? }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// VAPID-nøgler — generér med: npx web-push generate-vapid-keys
// Sæt som Supabase secrets:
//   supabase secrets set VAPID_PUBLIC_KEY=...
//   supabase secrets set VAPID_PRIVATE_KEY=...
//   supabase secrets set VAPID_SUBJECT=mailto:hej@eatsafe.dk
const VAPID_PUBLIC_KEY  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT     = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hej@eatsafe.dk";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { user_id, title, body, url } = await req.json();
    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "Mangler user_id, title eller body" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Hent push tokens for brugeren
    const { data: tokens, error } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", user_id);

    if (error) throw error;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "Ingen tokens fundet" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Byg VAPID JWT
    const vapidJwt = await buildVapidJwt(VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT);

    const payload = JSON.stringify({
      title,
      body,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      url: url ?? "https://eatsafe.dk",
    });

    let sent = 0;
    const staleTokens: string[] = [];

    for (const { token } of tokens) {
      try {
        const sub = JSON.parse(token);
        const res = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Authorization": `vapid t=${vapidJwt},k=${VAPID_PUBLIC_KEY}`,
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "TTL": "86400",
          },
          body: await encryptPayload(payload, sub),
        });

        if (res.status === 201 || res.status === 200) {
          sent++;
        } else if (res.status === 410 || res.status === 404) {
          // Token er udløbet — slet det
          staleTokens.push(token);
        }
      } catch (e) {
        console.error("Push fejl for token:", e);
      }
    }

    // Ryd udløbne tokens
    if (staleTokens.length > 0) {
      await supabase.from("push_tokens").delete().in("token", staleTokens);
    }

    return new Response(JSON.stringify({ sent, stale_removed: staleTokens.length }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

// ── VAPID JWT builder ────────────────────────────────────────────────────────
async function buildVapidJwt(pubKey: string, privKey: string, subject: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payload = btoa(JSON.stringify({ aud: "https://fcm.googleapis.com", exp: now + 43200, sub: subject })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const sigInput = `${header}.${payload}`;

  const keyBytes = base64urlDecode(privKey);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(sigInput)
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${sigInput}.${sigB64}`;
}

// ── Web Push payload kryptering (aes128gcm) ──────────────────────────────────
async function encryptPayload(payload: string, sub: { keys: { p256dh: string; auth: string } }): Promise<Uint8Array> {
  const clientPublicKey = base64urlDecode(sub.keys.p256dh);
  const clientAuth      = base64urlDecode(sub.keys.auth);

  const serverKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]);
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeyPair.publicKey));

  const clientKey = await crypto.subtle.importKey("raw", clientPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, serverKeyPair.privateKey, 256));

  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF
  const prk = await hkdf(clientAuth, sharedSecret, concat(new TextEncoder().encode("WebPush: info\0"), clientPublicKey, serverPublicKeyRaw), 32);
  const cek = await hkdf(salt, prk, new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, prk, new TextEncoder().encode("Content-Encoding: nonce\0"), 12);

  const cryptoKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const paddedPayload = concat(new TextEncoder().encode(payload), new Uint8Array([2]));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cryptoKey, paddedPayload));

  // aes128gcm header: salt (16) + record size (4) + key length (1) + server public key (65)
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);

  return concat(salt, recordSize, new Uint8Array([serverPublicKeyRaw.length]), serverPublicKeyRaw, encrypted);
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8));
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

function base64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + (4 - str.length % 4) % 4, "=");
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}
