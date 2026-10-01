import { describe, it, expect } from "vitest";
import { listNotifications, previewPush, defaultPush, validatePushOverride } from "./admin/notificationAdminLogic.js";
import { renderNotification, DEFINITIONS } from "../supabase/functions/_shared/notificationContent.js";
import { mockDataFor } from "../supabase/functions/_shared/notificationMock.js";

describe("admin → Notifikationer", () => {
  it("alle definitioner kan vises med eksempeldata", () => {
    const keys = listNotifications().flatMap((g) => g.items.map((i) => i.key));
    expect(keys.sort()).toEqual(Object.keys(DEFINITIONS).sort());
    for (const k of keys) {
      const p = previewPush(k, null);
      expect(p.title).toBeTruthy();
      expect(p.body).not.toMatch(/\{\{/);
    }
  });

  it("en rettet push-tekst bruges, og mailen røres ikke", () => {
    const k = "N2a:default";
    const base = renderNotification(k, mockDataFor(k));
    const r = renderNotification(k, mockDataFor(k), { pushOverride: { title: "Godkendt!", body: "{{productName}} er live." } });
    expect(r.pushTitle).toBe("Godkendt!");
    expect(r.pushBody).toBe("Arla Økologisk Letmælk er live.");
    expect(r.title).toBe(base.title);
    expect(r.mail).toEqual(base.mail);
    expect(r.blocks).toEqual(base.blocks);
  });

  it("afviser ukendte variabler og for lange tekster, og tom tekst betyder standard", () => {
    expect(validatePushOverride("N2a:default", { title: "x", body: "{{hemmelig}}" }).ok).toBe(false);
    expect(validatePushOverride("N2a:default", { title: "x".repeat(61), body: "" }).ok).toBe(false);
    expect(validatePushOverride("N2a:default", { title: "", body: "" }).ok).toBe(true);
    const k = "N2a:default";
    const r = renderNotification(k, mockDataFor(k), { pushOverride: { title: "", body: "{{nope}}" } });
    expect(r.pushBody).toBe(renderNotification(k, mockDataFor(k)).pushBody);
    expect(defaultPush(k).title).toBe(DEFINITIONS[k].push.title);
  });
});

describe("Resend-link", () => {
  it("hver notifikation med mail linker direkte til sin skabelon", async () => {
    const { resendTemplateUrl } = await import("./admin/notificationAdminLogic.js");
    expect(resendTemplateUrl("N2a:default")).toBe("https://resend.com/templates/eccf4c47-2e02-4515-82c7-c9ee437aec27");
    for (const k of Object.keys(DEFINITIONS)) expect(resendTemplateUrl(k)).toMatch(/^https:\/\/resend\.com\/templates\/[0-9a-f-]{36}$/);
  });
});
