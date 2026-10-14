import { describe, it, expect, vi } from "vitest";
import { validOffImagePath, fetchOffImage } from "../api/_offImageLogic.js";
import { displayImageUrl, verifiedImageUrl, imageAttribution } from "./helpers.js";

const OK = "images/products/570/123/456/7890/front_da.400.jpg";
const mk = (status, type, bytes = 10, len) => async () => ({
  ok: status < 400, status,
  headers: { get: (k) => (k === "content-type" ? type : k === "content-length" ? len ?? null : null) },
  arrayBuffer: async () => new ArrayBuffer(bytes),
});

describe("api/off-image — stivalidering", () => {
  it("tillader kun OFFs produktbilleder", () => {
    expect(validOffImagePath(OK)).toBe(true);
    expect(validOffImagePath("images/products/5701234567890/1.jpg")).toBe(true);
  });
  it("afviser alt andet", () => {
    for (const p of [undefined, null, "", "../etc/passwd", "images/products/../../x.jpg", "images/products/123/x.svg", "images/products/123/x.jpg?a=1",
      "https://evil.com/x.jpg", "//evil.com/x.jpg", "images/other/123/x.jpg", "images/products/abc/x.jpg", "images/products/1/2/3/4/5/6/x.jpg", ["a"]])
      expect(validOffImagePath(p), String(p)).toBe(false);
  });
});

describe("api/off-image — hentning", () => {
  it("sender kun en User-Agent og cacher i 30 dage", async () => {
    const f = vi.fn(mk(200, "image/jpeg"));
    const out = await fetchOffImage(OK, f);
    expect(out.status).toBe(200);
    expect(out.headers["Cache-Control"]).toContain("s-maxage=2592000");
    expect(f.mock.calls[0][0]).toBe("https://images.openfoodfacts.org/" + OK);
    expect(Object.keys(f.mock.calls[0][1].headers)).toEqual(["User-Agent"]);
    expect(f.mock.calls[0][1].redirect).toBe("error");
  });
  it("afviser ikke-billeder, for store filer og fejl", async () => {
    expect((await fetchOffImage(OK, mk(200, "text/html"))).status).toBe(502);
    expect((await fetchOffImage(OK, mk(200, "image/jpeg", 10, "3000000"))).status).toBe(413);
    expect((await fetchOffImage(OK, mk(200, "image/jpeg", 3000000))).status).toBe(413);
    expect((await fetchOffImage(OK, mk(404, "image/jpeg"))).status).toBe(404);
    expect((await fetchOffImage(OK, async () => { throw new Error("x"); })).status).toBe(502);
    expect((await fetchOffImage("bad", mk(200, "image/jpeg"))).status).toBe(400);
  });
});

describe("displayImageUrl", () => {
  const off = "https://images.openfoodfacts.org/images/products/570/123/456/7890/front_da.400.jpg";
  it("omskriver OFF-billeder til egen adresse", () => {
    const u = displayImageUrl(off);
    expect(u.startsWith("/api/off-image?p=")).toBe(true);
    expect(decodeURIComponent(u.split("p=")[1])).toBe(OK);
  });
  it("lader andre adresser og tomme værdier være", () => {
    expect(displayImageUrl("https://x.supabase.co/a.jpg")).toBe("https://x.supabase.co/a.jpg");
    expect(displayImageUrl("https://images.openfoodfacts.org/evil/x.jpg")).toBe("https://images.openfoodfacts.org/evil/x.jpg");
    expect(displayImageUrl(null)).toBeNull();
  });
  it("kildeangivelse og EAN-kontrol virker stadig på den oprindelige adresse", () => {
    expect(imageAttribution(off)).toMatch(/Open Food Facts/);
    expect(verifiedImageUrl({ ean: "5701234567890", image_url: off })).toBe(off);
    expect(verifiedImageUrl({ ean: "5709999999999", image_url: off })).toBeNull();
  });
});
