// Browsertest af appens routing for invitationslinks (72 kontroller): ?invite=, &login=1, ugyldigt token og uden link, 6 browserstrenge,
// hver 3 gange med en helt ny profil (første besøg: service workeren genindlæser siden). Kræver en kørende app: npm run build && npx vite preview --port 4174.
// Kør: node scripts/e2e/app-invite.mjs  (kun Chromium; andre browsere er emuleret med browserstreng).
import { createRequire } from "node:module";
const require = createRequire(process.env.PW_NODE_MODULES || "/opt/node-tools/node_modules/");
const { chromium } = require("playwright-core");
const TOKEN = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718";
const A = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";
const UAS = [
  ["iPhone Safari", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1", [390, 844]],
  ["Pixel Chrome", A, [412, 915]],
  ["Samsung Internet", "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36", [412, 915]],
  ["Firefox Android", "Mozilla/5.0 (Android 14; Mobile; rv:126.0) Gecko/126.0 Firefox/126.0", [412, 915]],
  ["Edge Android", `${A} EdgA/125.0.0.0`, [412, 915]],
  ["Desktop Chrome", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36", [1280, 800]],
];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
let total = 0, bad = 0;
const screenOf = (t) => /Opret gratis konto/.test(t) ? "VELKOMST" : /Ny bruger Log ind/.test(t) ? (/Velkommen tilbage/.test(t) ? "LOGIN" : "OPRET") : "ANDET";
for (const [name, ua, vp] of UAS) {
  // tre forsøg pr. kombination, hver med en helt ny browserprofil (= første besøg, service worker registreres og genindlæser)
  for (const [url, expected, label] of [[`/?invite=${TOKEN}`, "OPRET", "link"], [`/?invite=${TOKEN}&login=1`, null, "link + login=1"], [`/?invite=forkert!!`, "OPRET", "ugyldigt token (sendes stadig til oprettelse, men gemmes ikke)"], [`/`, "VELKOMST", "uden link"]]) {
    for (let i = 1; i <= 3; i++) {
      const ctx = await browser.newContext({ userAgent: ua, viewport: { width: vp[0], height: vp[1] }, isMobile: vp[0] < 600, hasTouch: vp[0] < 600 });
      const page = await ctx.newPage();
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
      await page.goto("http://localhost:4174" + url, { waitUntil: "networkidle" });
      await page.waitForTimeout(2500);
      const t = (await page.innerText("body")).replace(/\s+/g, " ");
      const scr = screenOf(t);
      const tok = await page.evaluate(() => localStorage.getItem("as_pending_invite"));
      const addrClean = !/invite=/.test(page.url());
      // login=1 kan efter genindlæsning ikke genskabes (adressen er væk); OPRET eller LOGIN er begge acceptable, VELKOMST er det ikke
      const okScreen = expected === null ? (scr === "LOGIN" || scr === "OPRET") : scr === expected;
      const okToken = url.includes(TOKEN) ? tok === TOKEN : tok === null;
      total++;
      if (!(okScreen && okToken && addrClean)) { bad++; console.log("FEJL", name, label, "forsøg", i, "→ skærm", scr, "token", tok, "adresse", page.url()); }
      await ctx.close();
    }
  }
}
await browser.close();
console.log(`${total - bad}/${total} OK, ${bad} FEJL`);
