// src/usePush.js
// Håndterer push-notifikation tilladelse, service worker og token-opbevaring

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { makeHeaders } from "./helpers.js";

// VAPID public key — skal matche den genererede nøgle i Supabase secrets
// Generér med: npx web-push generate-vapid-keys
// Indsæt din VAPID_PUBLIC_KEY her:
const VAPID_PUBLIC_KEY = "BJYPtJFzv1T3iPhd4V9EvRfsvn5mvreXeaTjL8BviWt1nMi7TlyXP83vsplYPFsWaC8byu3-KnCABVW1XMWdVgM";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Gem push token i Supabase
async function saveTokenToSupabase(token, accessToken) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/push_tokens`, {
      method: "POST",
      headers: {
        ...makeHeaders(accessToken),
        "Prefer": "resolution=ignore-duplicates",
      },
      body: JSON.stringify({ token: JSON.stringify(token) }),
    });
  } catch (e) {
    console.warn("[usePush] Kunne ikke gemme token:", e);
  }
}

// Slet push token fra Supabase (ved afmelding)
async function deleteTokenFromSupabase(token, accessToken) {
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/push_tokens?token=eq.${encodeURIComponent(JSON.stringify(token))}`,
      { method: "DELETE", headers: makeHeaders(accessToken) }
    );
  } catch (e) {
    console.warn("[usePush] Kunne ikke slette token:", e);
  }
}

// Returnerer { supported, permission, subscribe, unsubscribe }
export function usePush() {
  const supported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  const permission = supported ? Notification.permission : "denied";

  // Registrér SW og abonnér på push
  async function subscribe(accessToken) {
    if (!supported) return { ok: false, reason: "Ikke understøttet" };
    if (VAPID_PUBLIC_KEY === "DIN_VAPID_PUBLIC_KEY_HER") {
      console.warn("[usePush] VAPID_PUBLIC_KEY er ikke sat — se usePush.js");
      return { ok: false, reason: "VAPID ikke konfigureret" };
    }

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const result = await Notification.requestPermission();
      if (result !== "granted") return { ok: false, reason: "Tilladelse afvist" };

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await saveTokenToSupabase(existing.toJSON(), accessToken);
        return { ok: true, subscription: existing };
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await saveTokenToSupabase(subscription.toJSON(), accessToken);
      return { ok: true, subscription };
    } catch (e) {
      console.error("[usePush] subscribe fejl:", e);
      return { ok: false, reason: String(e) };
    }
  }

  // Afmeld push
  async function unsubscribe(accessToken) {
    if (!supported) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await deleteTokenFromSupabase(sub.toJSON(), accessToken);
      await sub.unsubscribe();
    } catch (e) {
      console.error("[usePush] unsubscribe fejl:", e);
    }
  }

  return { supported, permission, subscribe, unsubscribe };
}

// Hjælpefunktion til at sende push fra frontend (kun til eget brug — admin bruger Edge Function)
export async function sendPushToUser(userId, title, body, url, accessToken) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: "POST",
      headers: { ...makeHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, title, body, url }),
    });
    return await res.json();
  } catch (e) {
    console.error("[usePush] sendPushToUser fejl:", e);
    return { error: String(e) };
  }
}
