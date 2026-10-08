// Browsertest af public/invite.html: 28 enheder/browsere (emuleret i Chromium) og alle tilstande (774 kontroller). Database-kald er mocket.
// Kør: node scripts/e2e/invite-page.mjs  (kræver playwright-core og Chromium; stier kan sættes med PW_NODE_MODULES og CHROMIUM_PATH).
// OBS: kun Chromium-motoren. Safari-, Firefox- og Samsung-strenge er EMULERET (browserstreng, skærm, berøring), ikke rigtige motorer.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(process.env.PW_NODE_MODULES || "/opt/node-tools/node_modules/");
const { chromium } = require("playwright-core");

const ROOT = new URL("../../public", import.meta.url).pathname;
const TOKEN = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718";
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.startsWith("/invite/")) p = "/invite.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("nej"); return; }
  res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(4173, r));

const SOON = new Date(Date.now() + 20 * 3600e3).toISOString();
const PAST = new Date(Date.now() - 3600e3).toISOString();
const STATES = {
  mail:     { found: true, status: "pending", kind: "email", locked: false, expires_at: SOON, inviter_first_name: "Jan", invitee_email_hint: "f•••••••••@gmail.com" },
  link:     { found: true, status: "pending", kind: "link", locked: false, expires_at: SOON, inviter_first_name: "Jan", invitee_email_hint: null },
  locked:   { found: true, status: "pending", kind: "link", locked: true, expires_at: SOON, inviter_first_name: "Jan", invitee_email_hint: null },
  accepted: { found: true, status: "accepted", kind: "email", locked: false, expires_at: SOON },
  revoked:  { found: true, status: "revoked", kind: "email", locked: false, expires_at: SOON },
  expired:  { found: true, status: "pending", kind: "email", locked: false, expires_at: PAST },
  notfound: { found: false },
};
const EXPECT = {
  mail:     { h1: "Du er inviteret!", has: [/Jan har inviteret dig til sin familie/, /f•••••••••@gmail\.com/, /Facebook eller en anden adresse/], not: [/Sådan virker det/], buttons: true },
  link:     { h1: "Du er inviteret!", has: [/Jan har inviteret dig til sin familie/, /Sådan virker det: Opret dig eller log ind, og tryk ja i appen\. Så får Jan en anmodning og skal godkende/], not: [/Facebook eller en anden adresse/], buttons: true },
  locked:   { h1: "Linket er allerede brugt", has: [/virker kun til én person/], not: [], buttons: false },
  accepted: { h1: "Allerede accepteret", has: [/allerede brugt/], not: [], buttons: false },
  revoked:  { h1: "Invitationen er trukket tilbage", has: [/Bed afsenderen om en ny/], not: [], buttons: false },
  expired:  { h1: "Invitationen er udløbet", has: [/Bed familiemedlemmet/], not: [], buttons: false },
  notfound: { h1: "Ugyldig invitation", has: [/findes ikke/], not: [], buttons: false },
};

const A = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";
const IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)";
const DEVICES = [
  // name, UA, viewport, touch, kind: ios|android|desktop, inApp, tipRegex
  ["iPhone Safari",            `${IOS} Version/17.4 Mobile/15E148 Safari/604.1`, [390, 844], 5, "ios", false, /Safari: tryk på Del-ikonet og vælg Føj til hjemmeskærm/],
  ["iPhone Chrome (CriOS)",    `${IOS} CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1`, [390, 844], 5, "ios", false, /Safari: tryk på Del-ikonet/],
  ["iPhone Firefox (FxiOS)",   `${IOS} FxiOS/126.0 Mobile/15E148 Safari/605.1.15`, [390, 844], 5, "ios", false, /Safari: tryk på Del-ikonet/],
  ["iPhone Edge (EdgiOS)",     `${IOS} EdgiOS/125.0.2535.60 Version/17.0 Mobile/15E148 Safari/604.1`, [390, 844], 5, "ios", false, /Safari: tryk på Del-ikonet/],
  ["iPad Safari (iPadOS)",     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15", [820, 1180], 5, "ios", false, /Safari: tryk på Del-ikonet/],
  ["iPhone SE lille skærm",    `${IOS} Version/17.4 Mobile/15E148 Safari/604.1`, [320, 568], 5, "ios", false, /Safari: tryk på Del-ikonet/],
  ["Pixel Chrome",             A, [412, 915], 5, "android", false, /Chrome\) og vælger Installér app|menuen i din browser \(fx Chrome\)/],
  ["Android 360px Chrome",     A, [360, 740], 5, "android", false, /menuen i din browser/],
  ["Samsung Internet",         "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36", [412, 915], 5, "android", false, /Samsung Internet åbner du menuen og vælger Tilføj side til → Startskærm/],
  ["Firefox Android",          "Mozilla/5.0 (Android 14; Mobile; rv:126.0) Gecko/126.0 Firefox/126.0", [412, 915], 5, "android", false, /Firefox åbner du menuen \(⋮\) og vælger Installér/],
  ["Edge Android",             `${A} EdgA/125.0.0.0`, [412, 915], 5, "android", false, /Edge åbner du menuen \(⋯\) og vælger Føj til telefon eller Installér app/],
  ["Opera Android",            `${A} OPR/80.0.0.0`, [412, 915], 5, "android", false, /Opera åbner du menuen og vælger Startskærm/],
  ["Brave Android (Chrome-UA)", A, [412, 915], 5, "android", false, /menuen i din browser/],
  ["Chrome desktop Windows",   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36", [1280, 800], 0, "desktop", false, /EatSafe er lavet til telefonen/],
  ["Firefox desktop",          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0", [1280, 800], 0, "desktop", false, /EatSafe er lavet til telefonen/],
  ["Safari macOS",             "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15", [1280, 800], 0, "desktop", false, /EatSafe er lavet til telefonen/],
  ["Edge desktop",             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0", [1280, 800], 0, "desktop", false, /EatSafe er lavet til telefonen/],
  // app-browsere
  ["Messenger Android",        `${A} [FB_IAB/Orca-Android;FBAV/450.0.0.0.0;]`, [412, 915], 5, "android", true, /./],
  ["Messenger iOS",            `${IOS} Mobile/15E148 [FBAN/FBIOS;FBAV/450.0;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBLC/da_DK;FBOP/5]`, [390, 844], 5, "ios", true, /./],
  ["Facebook Android",         `${A} [FB_IAB/FB4A;FBAV/450.0.0.0.0;]`, [412, 915], 5, "android", true, /./],
  ["Instagram iOS",            `${IOS} Mobile/15E148 Instagram 320.0.0.0.0 (iPhone15,2; iOS 17_4; da_DK)`, [390, 844], 5, "ios", true, /./],
  ["Instagram Android",        `${A} Instagram 320.0.0.0.0 Android`, [412, 915], 5, "android", true, /./],
  ["Google-appen iOS (GSA)",   `${IOS} Version/17.4 Mobile/15E148 Safari/604.1 GSA/300.0.598994205`, [390, 844], 5, "ios", true, /./],
  ["Snapchat",                 `${IOS} Mobile/15E148 Snapchat/12.80.0.40 (like Safari/8617)`, [390, 844], 5, "ios", true, /./],
  ["TikTok Android",           `${A} musical_ly_2023 TikTok 33.0.0`, [412, 915], 5, "android", true, /./],
  ["Pinterest",                `${A} [Pinterest/Android]`, [412, 915], 5, "android", true, /./],
  ["Viber",                    `${A} Viber/20.0.0`, [412, 915], 5, "android", true, /./],
  ["LinkedIn",                 `${IOS} Mobile/15E148 LinkedInApp`, [390, 844], 5, "ios", true, /./],
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const results = []; let fails = 0;
const record = (ok, name, detail = "") => { results.push({ ok, name, detail }); if (!ok) fails++; };

async function open(device, state, { network = false } = {}) {
  const [name, ua, vp, touch] = device;
  const context = await browser.newContext({ userAgent: ua, viewport: { width: vp[0], height: vp[1] }, hasTouch: touch > 0, isMobile: touch > 0, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.route("**/rest/v1/rpc/get_invite_preview", (route) => network ? route.abort("failed") : route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STATES[state]) }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://localhost:4173/invite/${TOKEN}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#content", { state: "visible", timeout: 5000 });
  return { page, context, errors };
}

for (const device of DEVICES) {
  const [name, , vp, , kind, inApp, tip] = device;
  for (const state of ["mail", "link"]) {
    const { page, context, errors } = await open(device, state);
    const text = (await page.innerText("body")).replace(/\s+/g, " ");
    const label = `${name} · ${state}`;
    record((await page.innerText("h1")) === EXPECT[state].h1, `${label}: overskrift`);
    for (const re of EXPECT[state].has) record(re.test(text), `${label}: tekst ${re}`, text.slice(0, 160));
    for (const re of EXPECT[state].not) record(!re.test(text), `${label}: ingen tekst ${re}`);
    const hrefs = await page.$$eval("a.btn", (as) => as.map((a) => a.getAttribute("href")));
    record(hrefs.includes(`https://www.eatsafe.dk?invite=${TOKEN}`) && hrefs.includes(`https://www.eatsafe.dk?invite=${TOKEN}&login=1`), `${label}: knapperne sender tokenet med`, hrefs.join(" | "));
    // app-browser: advarsel + kopiér-knap, ellers ingen
    const notice = await page.$(".notice");
    record(!!notice === inApp, `${label}: app-browser-advarsel ${inApp ? "vises" : "vises ikke"}`);
    if (inApp) {
      const noticeText = (await notice.innerText()).replace(/\s+/g, " ");
      record(/Åbn invitationen i din browser/.test(noticeText) && /Messenger eller Instagram/.test(noticeText), `${label}: advarslens tekst`, noticeText);
      record(kind === "ios" ? /i Safari/.test(noticeText) : /Chrome, Samsung Internet, Firefox eller Edge/.test(noticeText), `${label}: advarslen nævner de rigtige browsere`, noticeText);
      if (state === "mail") {
        await page.click("#copy-link");
        let copiedText = "";
        try { await page.waitForFunction(() => /kopieret/i.test(document.querySelector("#copy-link").textContent), null, { timeout: 3000 }); } catch { /* fanges nedenfor */ }
        copiedText = await page.innerText("#copy-link");
        record(/Link kopieret/.test(copiedText), `${label}: kopiér-knappen virker`, copiedText);
        const clip = await page.evaluate(() => navigator.clipboard.readText());
        record(clip.endsWith(`/invite/${TOKEN}`), `${label}: linket er kopieret til udklipsholderen`, clip);
      }
    }
    // installationsråd
    const install = await page.$(".install");
    record(!!install, `${label}: installationsråd vises`);
    if (install) {
      const tipText = (await install.innerText()).replace(/\s+/g, " ");
      record(tip.test(tipText), `${label}: installationsråd passer til browseren`, tipText);
      if (kind === "desktop") record(!/Android|iPhone/.test(tipText), `${label}: computer-råd nævner hverken Android eller iPhone`, tipText);
      if (kind === "android") record(!/iPhone|Safari/.test(tipText), `${label}: Android-råd nævner ikke iPhone/Safari`, tipText);
      if (kind === "ios") record(!/Android|Chrome\)/.test(tipText), `${label}: iPhone-råd nævner ikke Android/Chrome`, tipText);
    }
    // layout og fejl
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    record(overflow <= 1, `${label}: ingen vandret scroll`, `overflow ${overflow}px`);
    record(errors.length === 0, `${label}: ingen konsolfejl`, errors.join(" | "));
    if (["iPhone Safari", "Samsung Internet", "Messenger Android", "Chrome desktop Windows", "iPhone SE lille skærm"].includes(name) && state === "mail") {
      await page.screenshot({ path: `${process.env.SHOT_DIR || "/tmp"}/invite-${name.replace(/[^a-z0-9]+/gi, "_")}.png`, fullPage: true });
    }
    await context.close();
  }
}

// Øvrige tilstande på tre repræsentative enheder
for (const di of [0, 8, 17]) {
  const device = DEVICES[di];
  for (const state of ["locked", "accepted", "revoked", "expired", "notfound"]) {
    const { page, context, errors } = await open(device, state);
    const text = (await page.innerText("body")).replace(/\s+/g, " ");
    const label = `${device[0]} · ${state}`;
    record((await page.innerText("h1")) === EXPECT[state].h1, `${label}: overskrift`, await page.innerText("h1"));
    for (const re of EXPECT[state].has) record(re.test(text), `${label}: tekst ${re}`, text.slice(0, 160));
    record((await page.$$("a.btn")).length === 1 && !(await page.$(".install")), `${label}: kun én knap og ingen installationsråd`);
    record(errors.length === 0, `${label}: ingen konsolfejl`, errors.join(" | "));
    await context.close();
  }
  const { page, context } = await open(device, "mail", { network: true });
  record(/Noget gik galt/.test(await page.innerText("h1")), `${device[0]} · netværksfejl: "Noget gik galt"`);
  await context.close();
}

// Ugyldig adresse (intet token)
{
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route("**/rest/v1/rpc/get_invite_preview", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ found: false }) }));
  await page.route(/fonts\./, (r) => r.abort());
  await page.goto("http://localhost:4173/invite/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#content", { state: "visible" });
  record(/Ugyldig/.test(await page.innerText("h1")), "adresse uden token: Ugyldig invitation");
  await context.close();
}

await browser.close(); server.close();
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length}/${results.length} kontroller OK, ${bad.length} FEJL`);
for (const r of bad) console.log("FEJL:", r.name, "→", r.detail);
process.exit(bad.length ? 1 : 0);
