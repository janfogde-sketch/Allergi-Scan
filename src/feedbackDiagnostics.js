// @ts-nocheck
// Diagnostik, der sendes med en feedback. ÉN kilde: den samme kontekst bruges både til afsendelsen og til oversigten, brugeren kan
// folde ud i feedback-modalen, så der aldrig sendes noget, som ikke vises.
//
// Dataminimering (2. okt. 2026): standarddiagnostikken er kun tekniske oplysninger. Navn, e-mail, allergier/intolerancer,
// familieprofiler og andre helbredsrelaterede brugerdata sendes IKKE med. Rapporten kan kobles til en konto via det interne bruger-ID
// (og ticketens `submitted_by`, som serveren sætter ud fra login-tokenet). Produktdata (EAN/navn på det scannede produkt) er ikke
// personoplysninger og følger kun med, når der er et scanresultat.
import { SCREENS, PAGE_IDS } from "./constants.jsx";

export function detectDevice(ua = "") {
  return /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : "Desktop";
}

export function detectDeviceType(ua = "") {
  if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) return "Tablet";
  if (/iPhone|iPod|Mobile/.test(ua)) return "Mobil";
  return "Computer";
}

// Styresystem og version ud fra user-agent. Returnerer { os, version }, fx { os: "iOS", version: "17.4" }.
export function detectOs(ua = "") {
  let m = ua.match(/OS (\d+)[_.](\d+)/);
  if (/iPhone|iPad|iPod/.test(ua)) return { os: "iOS", version: m ? `${m[1]}.${m[2]}` : "" };
  m = ua.match(/Android (\d+(?:\.\d+)?)/);
  if (m) return { os: "Android", version: m[1] };
  m = ua.match(/Windows NT (\d+(?:\.\d+)?)/);
  if (m) return { os: "Windows", version: m[1] };
  m = ua.match(/Mac OS X (\d+)[_.](\d+)/);
  if (m) return { os: "macOS", version: `${m[1]}.${m[2]}` };
  if (/Linux|X11/.test(ua)) return { os: "Linux", version: "" };
  return { os: "Ukendt", version: "" };
}

// Browser og hovedversion, fx "Safari 17" (ikke den rå user-agent).
export function detectBrowser(ua = "") {
  const pick = (re, name) => { const m = ua.match(re); return m ? `${name} ${m[1]}` : null; };
  return pick(/EdgA?\/(\d+)/, "Edge") || pick(/CriOS\/(\d+)/, "Chrome") || pick(/FxiOS\/(\d+)/, "Firefox") || pick(/Firefox\/(\d+)/, "Firefox")
    || pick(/Chrome\/(\d+)/, "Chrome") || pick(/Version\/(\d+)[\d.]* .*Safari/, "Safari") || (/Safari/.test(ua) ? "Safari" : "Ukendt");
}

// Kun sti og et "#…"-tegn: query og hash kan indeholde tokens (bekræftelses-/invitationslinks).
export function safeUrl(href = "") {
  try {
    const u = new URL(href);
    return u.pathname + (u.hash ? "#…" : "");
  } catch { return ""; }
}

// Trace-linjer er tekniske hændelser. Kun denne hvidliste følger med: især ikke matchedDanger/matchedWarning, som afslører,
// hvilke af brugerens allergener et produkt ramte.
const TRACE_KEYS = ["id", "step", "ts", "found", "status", "success", "method", "ean", "name", "textLength", "hasOcr", "hasImage"];
export function sanitizeTraces(traces = []) {
  return traces.map(t => Object.fromEntries(TRACE_KEYS.filter(k => t && t[k] !== undefined).map(k => [k, t[k]])));
}

// Den seneste registrerede fejl uden stack (stacken ligger allerede i client_errors), kun besked, skærm, kilde og tidspunkt.
function latestError(errors = []) {
  const e = errors[errors.length - 1];
  return e ? [{ ts: e.ts || null, message: e.message || "", screen: e.screen || null, source: e.source || null }] : [];
}

// `env` er browser-værdierne (sendes ind, så funktionen kan testes uden DOM).
export function buildFeedbackContext({ type, env, app, state, traces = [], recentErrors = [] }) {
  const { screen, scanResult, madpasLang, selectedRecipe, onboardStep } = state;
  const ua = env.userAgent || "";
  const os = detectOs(ua);
  const ctx = {
    screen_id:        screen,
    screen_label:     app.screenLabel,
    page_id:          PAGE_IDS[screen] || "–",
    url:              safeUrl(env.url),
    os:               os.os,
    os_version:       os.version,
    device_type:      detectDeviceType(ua),
    browser:          detectBrowser(ua),
    platform:         env.platform,
    display_mode:     env.standalone ? "standalone" : "browser",
    language:         env.language,
    screen_size:      env.screenSize,
    viewport:         env.viewport,
    online:           env.online,
    timestamp:        env.timestamp,
    build_time:       app.buildTime,
    commit_sha:       app.commitSha,
    app_version:      "beta-1.0",
    user_id:          state.userId || null, // internt, pseudonymt ID (ingen navn/e-mail)
    user_role:        state.user?.role || null,
    onboard_step:     screen === SCREENS.ONBOARD ? onboardStep : null,
    debug_trace:      sanitizeTraces(traces.slice(-50)),
  };
  // Kun det, der hører til den skærm, fejlen blev meldt fra
  if (scanResult?.ean || scanResult?.code || scanResult?.name) {
    ctx.scan_result_ean = scanResult.ean || scanResult.code || null;
    ctx.scan_result_name = scanResult.name || null;
  }
  if (screen === SCREENS.MADPAS && madpasLang) ctx.madpas_lang = madpasLang;
  if (screen === SCREENS.RECIPES && selectedRecipe?.name) ctx.selected_recipe = selectedRecipe.name;
  // Crash: kun den seneste fejl, appen selv har registreret på enheden (hvis der er nogen)
  if (type === "crash") ctx.recent_errors = latestError(recentErrors);
  return ctx;
}

export const NO_CRASH_TEXT = "Ingen nylig crash-log fundet";

// Rækker til oversigten. Alt det, der sendes, står her (undtagen de rå trace-linjer, som vises for sig).
export function diagnosticGroups(ctx, { type, formatBuild } = {}) {
  const tech = [
    ["Skærm",       `${ctx.screen_label} (${ctx.page_id})`],
    ["Enhed",       ctx.os],
    ["OS-version",  ctx.os_version || "—"],
    ["Enhedstype",  ctx.device_type],
    ["Platform",    ctx.platform || "—"],
    ["Browser",     ctx.browser],
    ["Visning",     ctx.display_mode === "standalone" ? "Installeret app" : "Browser"],
    ["Viewport",    String(ctx.viewport).replace("x", "×")],
    ["Skærmstørrelse", String(ctx.screen_size).replace("x", "×")],
    ["Online",      ctx.online ? "Ja" : "Nej"],
    ["Sprog",       ctx.language || "—"],
    ["Build",       `${formatBuild ? formatBuild() : ctx.build_time} (${ctx.commit_sha})`],
    ["Version",     ctx.app_version],
    ["Rolle",       ctx.user_role || "—"],
    ["Konto-ID (internt)", ctx.user_id || "ikke logget ind"],
    ...(ctx.onboard_step ? [["Onboarding-trin", `${ctx.onboard_step} af 5`]] : []),
    ...(ctx.scan_result_name || ctx.scan_result_ean ? [["Produkt", `${ctx.scan_result_name || "—"} [${ctx.scan_result_ean || "—"}]`]] : []),
    ...(ctx.madpas_lang ? [["Madpas-sprog", ctx.madpas_lang]] : []),
    ...(ctx.selected_recipe ? [["Opskrift", ctx.selected_recipe]] : []),
  ];
  const groups = [{ id: "tech", title: "Teknisk", rows: tech }];
  if (type === "crash") {
    const err = (ctx.recent_errors || [])[0];
    groups.push({
      id: "errors", title: "Fejl",
      rows: [["Seneste fejl", err ? `${err.message}${err.screen ? ` (${err.screen})` : ""}${err.ts ? ` kl. ${err.ts.slice(11, 19)}` : ""}` : NO_CRASH_TEXT]],
    });
  }
  return groups;
}
