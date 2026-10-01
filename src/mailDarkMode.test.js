// Mørk tilstand i alle EatSafe-mails (1. okt. 2026): 6 auth-skabeloner + 22 Resend-skabeloner.
// Testen låser paletten og strukturen, så en ny eller ændret skabelon ikke ryger tilbage til lav kontrast.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const root = "supabase/templates";
const files = [
  ...readdirSync(`${root}/auth`).filter(f => f.endsWith(".html")).map(f => `${root}/auth/${f}`),
  ...readdirSync(`${root}/resend`).filter(f => f.endsWith(".html")).map(f => `${root}/resend/${f}`),
];

const DARK = {
  canvas: "#121413", card: "#1C1F1E", panel: "#262A28",
  heading: "#F4F7F5", body: "#C9CFCC", muted: "#9FA8A3", green: "#79D5A7", button: "#0F7D4F",
};
const LEGACY = ["#121914", "#1c2520", "#edf3ee", "#bdcbc1", "#26342b", "#435447"];

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

describe("mails i mørk tilstand — palette", () => {
  it("overskrift, brødtekst og sekundær tekst har WCAG AA på både kort og ydre baggrund", () => {
    for (const bg of [DARK.canvas, DARK.card, DARK.panel]) {
      expect(ratio(DARK.heading, bg)).toBeGreaterThanOrEqual(7);
      expect(ratio(DARK.body, bg)).toBeGreaterThanOrEqual(7);
      expect(ratio(DARK.muted, bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(DARK.green, bg)).toBeGreaterThanOrEqual(7);
    }
    expect(ratio("#FFFFFF", DARK.button)).toBeGreaterThanOrEqual(4.5);
  });
  it("kortet er lidt lysere end den ydre baggrund", () => {
    expect(lum(DARK.card)).toBeGreaterThan(lum(DARK.canvas));
    expect(lum(DARK.panel)).toBeGreaterThan(lum(DARK.card));
  });
});

describe.each(files)("%s", (file) => {
  const html = readFileSync(file, "utf-8");
  const dark = html.match(/@media\(prefers-color-scheme:dark\)\{.*?\}\}\n/s)?.[0] ?? "";

  it("understøtter både lys og mørk tilstand", () => {
    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain('<meta name="supported-color-schemes" content="light dark">');
  });
  it("har mørk palette med de aftalte farver og ingen af de gamle", () => {
    expect(dark).not.toBe("");
    for (const c of [DARK.canvas, DARK.card, DARK.heading, DARK.body, DARK.muted, DARK.button]) {
      expect(dark.toUpperCase()).toContain(c);
    }
    for (const old of LEGACY) expect(html.toLowerCase()).not.toContain(old);
  });
  it("har Outlook-regler (data-ogsc/data-ogsb), så auto-inversion ikke gør tekst usynlig", () => {
    expect(html).toContain("[data-ogsc] .text,.text[data-ogsc]{color:#C9CFCC!important}");
    expect(html).toContain("[data-ogsb] .paper,.paper[data-ogsb]{background-color:#1C1F1E!important}");
  });
  it("tåler automatisk farveinversion (Outlook.com m.fl.): kun meget mørke eller hvide tekstfarver", () => {
    // Klienter, der ignorerer vores mørke CSS, vender kun meget mørke tekstfarver. Mellemtoner (fx #3C4A41, #647167)
    // bliver stående og er næsten usynlige på den mørke baggrund (målt i Outlook, 1. okt. 2026).
    const inline = [...html.matchAll(/style="([^"]*)"/g)].map(m => m[1]).join(";"); // kun inline-stilene, ikke <style>-blokken
    const colors = [...inline.matchAll(/(?<![-\w])color:(#[0-9a-fA-F]{6})/g)].map(m => m[1]);
    for (const c of colors) expect(lum(c) < 0.03 || lum(c) > 0.8, `${file}: ${c}`).toBe(true);
    // sekundær tekst bruger nær-sort + opacity, ikke en grå mellemtone
    for (const old of ["#3C4A41", "#536157", "#647167", "#4c5e51", "#426149"]) expect(html.toLowerCase()).not.toContain("color:" + old.toLowerCase());
  });
  it("har ingen lyse kanter, som lyser op i mørk tilstand, og logoets plade ligger i selve billedet", () => {
    expect(html).not.toContain("border:1px solid #E6EAE1");
    expect(html).not.toMatch(/class="logo logo-light"[^>]*background-color/);
    expect(html).toMatch(/EatSafe_Logo_Email(_Light|_Light_Cream)?\.png/);
  });
  it("skifter logo: lyst som standard, mørkt (hvid Eat, grøn Safe) i mørk tilstand", () => {
    expect(html).toContain("logo-light");
    expect(html).toContain("logo-dark");
    expect(html).toContain("EatSafe_Logo_Email_Dark.png");
    expect(dark).toContain(".logo-light{display:none!important");
    expect(dark).toContain(".logo-dark{display:block!important");
    // det mørke logo er skjult som standard, også i klienter uden media queries (Gmail, Outlook)
    expect(html).toMatch(/class="logo logo-dark"[^>]*style="display:none;max-height:0;overflow:hidden;mso-hide:all;/);
  });
  it("CTA-knappen (hvis mailen har en) er EatSafe-grøn med hvid tekst i begge tilstande", () => {
    // reauthentication har kun en kode og ingen knap
    const cells = html.match(/<td[^>]*bgcolor="#0F7D4F"/g) ?? [];
    for (const c of cells) expect(c).toContain('class="btn-cell"');
    if (cells.length) {
      expect(html).toMatch(/class="btn"[^>]*color:#ffffff/i);
      expect(dark).toContain(".btn{background-color:#0F7D4F!important;border-color:#0F7D4F!important;color:#FFFFFF!important}");
    }
  });
});

describe("logoer til mails", () => {
  it("findes som filer, så mailene kan hente dem", () => {
    for (const f of ["Dark", "Light", "Light_Cream"]) expect(existsSync(`public/brand/EatSafe_Logo_Email_${f}.png`)).toBe(true);
  });
});
