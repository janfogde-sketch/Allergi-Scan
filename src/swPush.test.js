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

describe("public/sw.js offline-side", () => {
  function loadFetch(fetchImpl, cached) {
    const listeners = {};
    const self = { addEventListener: (t, fn) => { listeners[t] = fn; }, location: { origin: "https://www.eatsafe.dk" }, skipWaiting: () => {}, clients: { claim: () => Promise.resolve() } };
    const context = { self, clients: self.clients, caches: { match: () => Promise.resolve(cached) }, fetch: fetchImpl, Response: { error: () => "fejl" }, URL, Date, console };
    vm.runInNewContext(readFileSync(resolve(__dirname, "../public/sw.js"), "utf8"), context);
    return listeners.fetch;
  }
  const nav = (url = "https://www.eatsafe.dk/") => ({ request: { mode: "navigate", url }, respondWith: vi.fn() });

  it("viser offline-siden, når en navigation fejler", async () => {
    const f = loadFetch(() => Promise.reject(new Error("offline")), "OFFLINE");
    const e = nav();
    f(e);
    expect(await e.respondWith.mock.calls[0][0]).toBe("OFFLINE");
  });

  it("sender en navigation med net uændret igennem", async () => {
    const f = loadFetch(() => Promise.resolve("SIDE"), "OFFLINE");
    const e = nav();
    f(e);
    expect(await e.respondWith.mock.calls[0][0]).toBe("SIDE");
  });

  it("rører ikke ved andre forespørgsler", () => {
    const f = loadFetch(() => Promise.resolve("X"), "OFFLINE");
    const e = { request: { mode: "cors", url: "https://www.eatsafe.dk/assets/a.js" }, respondWith: vi.fn() };
    f(e);
    expect(e.respondWith).not.toHaveBeenCalled();
  });
});
