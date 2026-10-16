// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { installModalGuard } from "./modalGuard.js";

let cleanup;
afterEach(() => { cleanup?.(); cleanup = undefined; document.body.innerHTML = ""; vi.useRealTimers(); });
const tick = () => new Promise((r) => setTimeout(r, 0));
const overlay = (inner = "") => { const o = document.createElement("div"); o.className = "admin-modal-overlay"; o.innerHTML = inner; document.body.appendChild(o); return o; };

describe("installModalGuard", () => {
  it("låser baggrunden, mens et modalvindue er åbent, og låser op igen", async () => {
    cleanup = installModalGuard();
    expect(document.documentElement.classList.contains("admin-modal-open")).toBe(false);
    const o = overlay();
    await tick();
    expect(document.documentElement.classList.contains("admin-modal-open")).toBe(true);
    o.remove();
    await tick();
    expect(document.documentElement.classList.contains("admin-modal-open")).toBe(false);
  });
  it("rydder helt op, når den afinstalleres", async () => {
    cleanup = installModalGuard();
    overlay();
    await tick();
    cleanup(); cleanup = undefined;
    expect(document.documentElement.classList.contains("admin-modal-open")).toBe(false);
  });
  it("scroller et valgt felt i vinduet frem, men ikke felter uden for vinduer", () => {
    vi.useFakeTimers();
    cleanup = installModalGuard();
    const o = overlay('<textarea id="a"></textarea>');
    const out = document.createElement("input"); document.body.appendChild(out);
    const a = o.querySelector("#a"); a.scrollIntoView = vi.fn(); out.scrollIntoView = vi.fn();
    a.focus(); vi.advanceTimersByTime(400);
    expect(a.scrollIntoView).toHaveBeenCalledWith({ block: "center" });
    out.focus(); vi.advanceTimersByTime(400);
    expect(out.scrollIntoView).not.toHaveBeenCalled();
  });
  it("et tryk uden for felterne skjuler tastaturet, et tryk på en knap gør ikke", () => {
    cleanup = installModalGuard();
    const o = overlay('<textarea id="a"></textarea><p id="p">tekst</p><button id="b">Gem</button>');
    const a = o.querySelector("#a"); a.focus();
    o.querySelector("#b").dispatchEvent(new Event("touchstart", { bubbles: true }));
    expect(document.activeElement).toBe(a);
    o.querySelector("#p").dispatchEvent(new Event("touchstart", { bubbles: true }));
    expect(document.activeElement).not.toBe(a);
  });
});
