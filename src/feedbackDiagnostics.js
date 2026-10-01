// @ts-nocheck
// Diagnostik, der sendes med en feedback. ÉN kilde: den samme kontekst bruges både til afsendelsen og til oversigten, brugeren kan
// folde ud i feedback-modalen, så der aldrig sendes noget, som ikke vises. Felterne `personal: true` er personoplysninger
// (navn, e-mail, allergener m.m.) og vises i en egen, tydeligt mærket gruppe.
import { SCREENS, PAGE_IDS } from "./constants.jsx";

export function detectDevice(ua = "") {
  return /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : "Desktop";
}

// Felter, der er sat sammen af app-state. `env` er browser-værdierne (sendes ind, så funktionen kan testes uden DOM).
export function buildFeedbackContext({ type, env, app, state, traces = [], recentErrors = [] }) {
  const { screen, scanResult, madpasLang, selectedRecipe, onboardStep } = state;
  const ctx = {
    screen_id:        screen,
    screen_label:     app.screenLabel,
    page_id:          PAGE_IDS[screen] || "–",
    url:              env.url,
    user_agent:       env.userAgent,
    platform:         env.platform,
    language:         env.language,
    screen_size:      env.screenSize,
    viewport:         env.viewport,
    online:           env.online,
    timestamp:        env.timestamp,
    build_time:       app.buildTime,
    commit_sha:       app.commitSha,
    user_id:          state.userId || null,
    user_name:        state.user?.name || null,
    user_email:       state.user?.email || state.loginEmail || null,
    user_role:        state.user?.role || null,
    allergens:        state.allergens,
    allergens_count:  state.allergens?.length || 0,
    family_count:     state.family?.length || 0,
    history_count:    state.history?.length || 0,
    active_profiles:  state.activeProfiles,
    scan_result_ean:  scanResult?.ean || scanResult?.code || null,
    scan_result_name: scanResult?.name || null,
    madpas_lang:      madpasLang || null,
    selected_recipe:  selectedRecipe?.name || null,
    onboard_step:     screen === SCREENS.ONBOARD ? onboardStep : null,
    app_version:      "beta-1.0",
    debug_trace:      traces.slice(-50), // Seneste 50 trace-entries
  };
  // Crash: de seneste fejl, appen selv har registreret på enheden (hvis der er nogen), så brugeren ikke selv skal beskrive teknikken
  if (type === "crash") ctx.recent_errors = recentErrors;
  return ctx;
}

// Rækker til oversigten, i to grupper. Alt det, der sendes, står her (undtagen de rå trace-linjer, som vises for sig).
export function diagnosticGroups(ctx, { type, formatBuild } = {}) {
  const tech = [
    ["Skærm",       `${ctx.screen_label} (${ctx.page_id})`],
    ["Enhed",       detectDevice(ctx.user_agent)],
    ["Viewport",    String(ctx.viewport).replace("x", "×")],
    ["Skærmstørrelse", String(ctx.screen_size).replace("x", "×")],
    ["Online",      ctx.online ? "Ja" : "Nej"],
    ["Sprog",       ctx.language || "—"],
    ["Build",       `${formatBuild ? formatBuild() : ctx.build_time} (${ctx.commit_sha})`],
    ["Version",     ctx.app_version],
    ["Rolle",       ctx.user_role || "—"],
    ...(ctx.scan_result_name || ctx.scan_result_ean ? [["Produkt", `${ctx.scan_result_name || "—"} [${ctx.scan_result_ean || "—"}]`]] : []),
    ...(ctx.selected_recipe ? [["Opskrift", ctx.selected_recipe]] : []),
    ...(ctx.onboard_step ? [["Onboarding-trin", String(ctx.onboard_step)]] : []),
    ["Historik",    `${ctx.history_count} scanninger`],
  ];
  const personal = [
    ["Navn",        ctx.user_name || "anonym"],
    ["E-mail",      ctx.user_email || "—"],
    ["Allergener",  ctx.allergens?.length ? ctx.allergens.join(", ") : "ingen"],
    ["Familie",     `${ctx.family_count} profiler`],
  ];
  const groups = [
    { id: "tech", title: "Teknisk", rows: tech },
    { id: "personal", title: "Personoplysninger, der følger med", rows: personal, personal: true },
  ];
  if (type === "crash") {
    const errs = ctx.recent_errors || [];
    groups.push({
      id: "errors", title: "Seneste fejl på enheden",
      rows: errs.length ? errs.map(e => [e.ts?.slice(11, 19) || "—", `${e.message}${e.screen ? ` (${e.screen})` : ""}`]) : [["Fejl", "Ingen fejl registreret på denne enhed"]],
    });
  }
  return groups;
}
