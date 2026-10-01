// @ts-nocheck
import { describe, it, expect } from "vitest";
import { verifyStandardWebhook } from "../supabase/functions/_shared/standardWebhook.ts";

const rawKey = crypto.getRandomValues(new Uint8Array(24));
const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
const SECRET = `v1,whsec_${b64(rawKey)}`;
const NOW = 1_790_000_000_000;

async function sign(id, ts, body, key = rawKey) {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `v1,${b64(new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${id}.${ts}.${body}`))))}`;
}

const body = JSON.stringify({ user: { email: "a@b.dk" }, email_data: { email_action_type: "signup" } });
const ts = String(Math.floor(NOW / 1000));

describe("verifyStandardWebhook", () => {
  it("accepterer en korrekt signeret besked", async () => {
    const headers = { "webhook-id": "msg_1", "webhook-timestamp": ts, "webhook-signature": await sign("msg_1", ts, body) };
    expect(await verifyStandardWebhook(body, headers, SECRET, { now: NOW })).toBe(true);
  });
  it("virker også med Headers-objekt og flere signaturer (én gyldig)", async () => {
    const headers = new Headers({ "webhook-id": "msg_2", "webhook-timestamp": ts, "webhook-signature": `v1,AAAA ${await sign("msg_2", ts, body)}` });
    expect(await verifyStandardWebhook(body, headers, SECRET, { now: NOW })).toBe(true);
  });
  it("afviser en ændret krop", async () => {
    const headers = { "webhook-id": "m", "webhook-timestamp": ts, "webhook-signature": await sign("m", ts, body) };
    expect(await verifyStandardWebhook(body.replace("a@b.dk", "x@y.dk"), headers, SECRET, { now: NOW })).toBe(false);
  });
  it("afviser en forkert hemmelighed", async () => {
    const other = crypto.getRandomValues(new Uint8Array(24));
    const headers = { "webhook-id": "m", "webhook-timestamp": ts, "webhook-signature": await sign("m", ts, body, other) };
    expect(await verifyStandardWebhook(body, headers, SECRET, { now: NOW })).toBe(false);
  });
  it("afviser et andet id eller tidsstempel end det signerede", async () => {
    const sig = await sign("m", ts, body);
    expect(await verifyStandardWebhook(body, { "webhook-id": "andet", "webhook-timestamp": ts, "webhook-signature": sig }, SECRET, { now: NOW })).toBe(false);
    expect(await verifyStandardWebhook(body, { "webhook-id": "m", "webhook-timestamp": String(Number(ts) + 1), "webhook-signature": sig }, SECRET, { now: NOW })).toBe(false);
  });
  it("afviser for gamle og fremtidige tidsstempler", async () => {
    const old = String(Math.floor(NOW / 1000) - 3600);
    const future = String(Math.floor(NOW / 1000) + 3600);
    expect(await verifyStandardWebhook(body, { "webhook-id": "m", "webhook-timestamp": old, "webhook-signature": await sign("m", old, body) }, SECRET, { now: NOW })).toBe(false);
    expect(await verifyStandardWebhook(body, { "webhook-id": "m", "webhook-timestamp": future, "webhook-signature": await sign("m", future, body) }, SECRET, { now: NOW })).toBe(false);
  });
  it("afviser manglende headers, tom hemmelighed og ugyldig signaturversion", async () => {
    expect(await verifyStandardWebhook(body, {}, SECRET, { now: NOW })).toBe(false);
    const sig = await sign("m", ts, body);
    expect(await verifyStandardWebhook(body, { "webhook-id": "m", "webhook-timestamp": ts, "webhook-signature": sig }, "", { now: NOW })).toBe(false);
    expect(await verifyStandardWebhook(body, { "webhook-id": "m", "webhook-timestamp": ts, "webhook-signature": sig.replace("v1,", "v2,") }, SECRET, { now: NOW })).toBe(false);
  });
});
