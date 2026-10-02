// @ts-nocheck
// Mailen om nye varer på en delt liste sendes fra supabase/functions/_shared/listMail.ts, en kopi af
// supabase/templates/resend/P3-delt-indkoebsliste.html (kør node scripts/build-list-mail.mjs efter ændringer).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { LIST_MAIL_HTML, LIST_MAIL_KEYS, renderListMail } from "../supabase/functions/_shared/listMail.ts";
import { renderNotification, pushVariablesFor, validatePushOverride } from "../supabase/functions/_shared/notificationContent.js";
import { buildMailVariables } from "../supabase/functions/_shared/mailSend.ts";

const DATA = { listName: "Weekend", listId: "l1", adders: "Jan og Bjørn", countText: "4 varer", itemList: "• Mælk\n• Æg\n• Brød\n• Smør" };

describe("P3: hvem har tilføjet hvad", () => {
  it("mail-HTML'en er identisk med skabelonfilen", () => {
    expect(LIST_MAIL_HTML).toBe(readFileSync("supabase/templates/resend/P3-delt-indkoebsliste.html", "utf-8"));
    expect([...LIST_MAIL_KEYS].sort()).toEqual(["P3:many", "P3:one"]);
  });

  it("emne, overskrift og push siger hvem og hvor mange", () => {
    const r = renderNotification("P3:many", DATA);
    expect(r.mail.subject).toBe("Jan og Bjørn har tilføjet 4 varer til Weekend");
    expect(r.title).toBe("Jan og Bjørn har tilføjet 4 varer");
    expect(r.pushTitle).toBe("Jan og Bjørn har tilføjet 4 varer");
    expect(r.pushBody).toBe("til Weekend. Se listen i EatSafe.");
    expect(r.blocks[0]).toEqual({ type: "heading", text: "Jan og Bjørn har tilføjet 4 varer til Weekend" });
  });

  it("push nævner aldrig varenavne, og varenavne kan ikke indsættes i en redigeret push", () => {
    const r = renderNotification("P3:many", DATA);
    expect(`${r.pushTitle} ${r.pushBody}`).not.toMatch(/Mælk|Æg|Brød|Smør/);
    expect(pushVariablesFor("P3:many")).not.toContain("itemList");
    expect(validatePushOverride("P3:many", { body: "Nye: {{itemList}}" }).ok).toBe(false);
  });

  it("varerne står som liste i appens besked og i mailen", () => {
    const r = renderNotification("P3:one", { ...DATA, adders: "Jan", countText: "en vare", itemList: "• Havregryn" });
    const panel = r.blocks.find((b) => b.type === "panel");
    expect(panel.blocks[0].parts[0].text).toBe("• Havregryn");
    const html = renderListMail(buildMailVariables({ ...r.mailVars }, "Anna Hansen"));
    expect(html).toContain("Hej Anna");
    expect(html).toContain("Jan har tilføjet en vare til Weekend</h1>");
    expect(html).toContain("• Havregryn");
    expect(html).not.toMatch(/\{\{\{/);
  });

  it("flere varer bliver til én linje hver (<br>) i mailen, og navne escapes", () => {
    const r = renderNotification("P3:many", { ...DATA, adders: "<b>Jan</b>" });
    const html = renderListMail(buildMailVariables({ ...r.mailVars }, "Anna"));
    expect(html).toContain("• Mælk<br>• Æg<br>• Brød<br>• Smør");
    expect(html).toContain("&lt;b&gt;Jan&lt;/b&gt; har tilføjet");
  });
});
