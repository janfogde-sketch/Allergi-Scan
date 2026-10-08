// Signerer en Standard Webhooks-nyttelast (som Supabase Auth gør) til handlertests. Returnerer headers.
export async function signStandardWebhook(body, secret, { id = "msg_test", now = Date.now() } = {}) {
  const timestamp = String(Math.floor(now / 1000));
  const keyBytes = Uint8Array.from(atob(secret.trim().replace(/^v1,/, "").replace(/^whsec_/, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)));
  return { "webhook-id": id, "webhook-timestamp": timestamp, "webhook-signature": `v1,${btoa(String.fromCharCode(...sig))}` };
}
