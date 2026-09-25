// supabase/functions/send-push/index.ts
// Sender Web Push notifikation til en bruger via VAPID
// Kald: POST { user_id, title, body, url?, category? }
//
// `category` er valgfri af hensyn til bagudkompatibilitet, men bør sendes
// af enhver ny/ændret kalder — matcher en af notification_preferences'
// tilladte kategorier ('submission_status', 'missing_product_found',
// 'family', 'feedback', 'weekly_digest'). Uden den sendes push'en altid,
// uanset brugerens indstillinger.

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

  // Verificér kalderen: enten vores eget interne kald (weekly-digest,
  // identificeret via service-role-nøglen) eller en rigtig indlogget bruger.
  // Uden dette kunne enhver med den offentlige anon-nøgle (som ligger i
  // frontend-bundlen) sende en push-notifikation med helt selvvalgt
  // titel/tekst/link til en vilkårlig bruger — et oplagt phishing-setup.
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  const isInternalCall = !!serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;
  let caller: { id: string } | null = null;

  if (!isInternalCall) {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Ikke autoriseret" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    caller = user;
  }

  try {
    const { user_id, title, body, url, category } = await req.json();
    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "Mangler user_id, title eller body" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Respekter brugerens notifikationsindstillinger — manglende række =
    // default til (se notification_preferences/notification_enabled()).
    if (category) {
      const { data: pref } = await supabase
        .from("notification_preferences")
        .select("enabled")
        .eq("user_id", user_id)
        .eq("category", category)
        .eq("channel", "push")
        .maybeSingle();
      if (pref?.enabled === false) {
        return new Response(JSON.stringify({ sent: 0, reason: "Bruger har slået denne notifikationstype fra" }), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    // Autorisation af PUSH-MÅLET: at være logget ind er ikke nok til at
    // sende push til en VILKÅRLIG anden bruger — det var præcis det forrige
    // fix kun delvist lukkede (det krævede blot en gyldig session, uanset
    // hvem user_id var). Tre legitime tilfælde findes i appen: man
    // notificerer sig selv; en admin notificerer en indsenders/scanners
    // konto ved godkendelse af indsendelser (useAdmin.js); eller et
    // familiemedlem notificerer et andet medlem af samme familiegruppe
    // ved invitations-accept (App.jsx). Alt andet afvises.
    if (!isInternalCall && caller) {
      const isSelf = user_id === caller.id;
      let authorized = isSelf;
      if (!authorized) {
        const { data: callerRow } = await supabase.from("users").select("role").eq("id", caller.id).single();
        authorized = callerRow?.role === "admin";
      }
      if (!authorized) {
        const { data: groupIds } = await supabase.rpc("family_group", { p_uid: caller.id });
        authorized = Array.isArray(groupIds) && groupIds.includes(user_id);
      }
      if (!authorized) {
        return new Response(JSON.stringify({ error: "Ikke autoriseret til at sende push til denne bruger" }), {
          status: 403, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

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
