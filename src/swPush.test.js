// @ts-nocheck
// F1-8 (6. okt. 2026): service workeren skal vise en notifikation for HVER push. En stille push
// giver i Chrome "Webstedet er opdateret i baggrunden", og Safari kan trække abonnementet tilbage.

import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

function loadSw() {
  const listeners = {};
  const showNotification = vi.fn(() => Promise.resolve());
  const self = {
    addEventListener: (type, fn) => { listeners[type] = fn; },
    registration: { showNotification },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
  };
  const context = { self, clients: self.clients, caches: {}, fetch: () => {}, URL, Date, console };
  vm.runInNewContext(readFileSync(resolve(__dirname, "../public/sw.js"), "utf8"), context);
  const push = (data) => {
    const waits = [];
    listeners.push({ data, waitUntil: (p) => waits.push(p) });
    return waits;
  };
  return { push, showNotification };
}

const jsonData = (obj) => ({ json: () => obj });

describe("public/sw.js push", () => {
  it("viser den modtagne besked", () => {
    const { push, showNotification } = loadSw();
    push(jsonData({ title: "Tilbagekaldelse", body: "Tjek dit produkt", url: "/?notification=1" }));
    expect(showNotification).toHaveBeenCalledWith("Tilbagekaldelse", expect.objectContaining({ body: "Tjek dit produkt" }));
  });

  it("viser en neutral besked ved tom push", () => {
    const { push, showNotification } = loadSw();
    const waits = push(null);
    expect(waits.length).toBe(1);
    expect(showNotification).toHaveBeenCalledWith("EatSafe", expect.objectContaining({ body: expect.stringContaining("ny besked") }));
  });

  it("viser en neutral besked ved ulæselig push", () => {
    const { push, showNotification } = loadSw();
    push({ json: () => { throw new Error("ikke json"); } });
    expect(showNotification).toHaveBeenCalledTimes(1);
  });

  it("viser ikke forældet indhold, men en neutral linje, når pushen er udløbet", () => {
    const { push, showNotification } = loadSw();
    push(jsonData({ title: "Invitation fra Anna", body: "Svar inden kl. 12", expiresAt: "2000-01-01T00:00:00Z", tag: "inv-1" }));
    const [title, opts] = showNotification.mock.calls[0];
    expect(title).toBe("EatSafe");
    expect(opts.body).not.toContain("Anna");
    expect(opts.tag).toBe("inv-1");
  });
});
