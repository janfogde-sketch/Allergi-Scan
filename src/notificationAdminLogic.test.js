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
    for (const k of Object.keys(DEFINITIONS).filter((key) => DEFINITIONS[key].mail)) expect(resendTemplateUrl(k)).toMatch(/^https:\/\/resend\.com\/templates\/[0-9a-f-]{36}$/);
    for (const k of Object.keys(DEFINITIONS).filter((key) => !DEFINITIONS[key].mail)) expect(resendTemplateUrl(k)).toBeNull();
  });
});

describe("kategorier og hjælpefunktioner (16. okt. 2026)", () => {
  it("kategorierne har brugerrettede danske navne i fast rækkefølge, og ingen intern nøgle vises", async () => {
    const labels = listNotifications().map((g) => g.label);
    expect(labels).toEqual(["Indsendelser", "Manglende produkter", "Familie", "Feedback", "Produktændringer", "Tilbagekaldelser", "Delte lister"]);
    expect(labels.join(" ")).not.toMatch(/_|missing|feedback$/);
    const fam = listNotifications().find((g) => g.label === "Familie").items.map((i) => i.name);
    expect(fam).toEqual(["Invitation accepteret", "Anmodning om forbindelse (delt link)", "Anmodning godkendt (delt link)", "Anmodning ikke godkendt (delt link)", "Invitation udløber snart"]);
  });
  it("variabel indsættes ved markøren eller erstatter markeringen", async () => {
    const { insertVariableAt } = await import("./admin/notificationAdminLogic.js");
    expect(insertVariableAt("Hej verden", 4, 4, "productName")).toEqual({ text: "Hej {{productName}}verden", cursor: 4 + "{{productName}}".length });
    expect(insertVariableAt("Hej XX verden", 4, 6, "reason").text).toBe("Hej {{reason}} verden");
    expect(insertVariableAt("abc", undefined, undefined, "x").text).toBe("abc{{x}}");
  });
  it("test: delvist lykkedes er aldrig fuldt gennemført, og ingen enhed er en fejl", async () => {
    const { summarizeTest } = await import("./admin/notificationAdminLogic.js");
    expect(summarizeTest({ push: { devices: 1, sent: 1, failed: 0 }, mail: { sent: true } }, ["push", "mail"]).overall).toBe("ok");
    expect(summarizeTest({ push: { devices: 1, sent: 1, failed: 0 }, mail: { sent: false, error: "x" } }, ["push", "mail"]).overall).toBe("partial");
    expect(summarizeTest({ push: { devices: 0, sent: 0, failed: 0 } }, ["push"]).overall).toBe("failed");
    expect(summarizeTest({ push: { devices: 2, sent: 1, failed: 1, errors: ["e"] } }, ["push"]).overall).toBe("partial");
    expect(summarizeTest(null, ["push"]).overall).toBe("failed");
  });
  it("mail-preview: logo hentes fra egen adresse, og mørk/lys efterlignes uden at røre designet", async () => {
    const { prepareMailPreview } = await import("./admin/notificationAdminLogic.js");
    const html = '<style>@media(prefers-color-scheme:dark){.x{color:#fff}}</style><img src="https://www.eatsafe.dk/brand/EatSafe_Logo_Email_Dark.png">';
    const light = prepareMailPreview(html, "light", "https://dev.eatsafe.dk");
    expect(light).toContain('src="https://dev.eatsafe.dk/brand/EatSafe_Logo_Email_Dark.png"');
    expect(light).toContain("@media not all");
    expect(prepareMailPreview(html, "dark", "https://x.dk")).toContain("@media all");
  });
});
