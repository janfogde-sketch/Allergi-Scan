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
    expect(html).toContain("[data-ogsc] .text{color:#C9CFCC!important}");
    expect(html).toContain("[data-ogsb] .paper{background-color:#1C1F1E!important}");
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

describe("mørkt logo", () => {
  it("findes som fil, så mailene kan hente det", () => {
    expect(existsSync("public/brand/EatSafe_Logo_Email_Dark.png")).toBe(true);
  });
});
