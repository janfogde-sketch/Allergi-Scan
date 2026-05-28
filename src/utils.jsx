// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// utils.jsx — EatSafe hjælpefunktioner
//
// Samler app-niveau utilities der ikke hører til helpers.js (som er pure JS)
// og ikke hører til constants.jsx (som er data).
// ─────────────────────────────────────────────────────────────────────────────

import { SCREENS, PAGE_IDS } from "./constants.jsx";

// ── BUILD-INFO ───────────────────────────────────────────────────────────────
// __BUILD_TIME__ og __COMMIT_SHA__ injiceres af vite.config.ts ved deploy.

/* global __BUILD_TIME__, __COMMIT_SHA__ */
export const BUILD_TIME = (typeof __BUILD_TIME__ !== "undefined")
  ? __BUILD_TIME__
  : new Date().toISOString();

export const COMMIT_SHA = (typeof __COMMIT_SHA__ !== "undefined")
  ? __COMMIT_SHA__
  : "local";

export const formatBuildTime = () => {
  try {
    const d = new Date(BUILD_TIME);
    return d.toLocaleString("da-DK", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch(e) { return BUILD_TIME; }
};

// ── HILSEN ───────────────────────────────────────────────────────────────────
// Returnerer tidspunktsbaseret hilsen på dansk.

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5)  return "God nat";
  if (hour < 10) return "God morgen";
  if (hour < 12) return "God formiddag";
  if (hour < 17) return "God dag";
  if (hour < 22) return "God aften";
  return "God nat";
};

// ── SKÆRMBESKRIVELSE TIL FEEDBACK ────────────────────────────────────────────
// Bygger en præcis dansk beskrivelse af brugerens aktuelle placering i appen.
// Bruges i feedback_tickets.context.screen_label.

export const buildScreenLabel = ({
  screen,
  authTab,
  onboardStep,
  scanResult,
  madpasWaiterView,
  madpasLang,
  selectedRecipe,
  editMode,
  showManualEan,
  profilePopup,
}) => {
  const labels = {
    [SCREENS.WELCOME]:      "Velkomstskærm",
    [SCREENS.LOGIN]:        `Login / Opret konto (fane: ${authTab === "login" ? "Log ind" : "Ny bruger"})`,
    [SCREENS.ONBOARD]:      `Onboarding — trin ${onboardStep} af 7`,
    [SCREENS.HOME]:         "Hjemskærm",
    [SCREENS.SEARCH]:       "Søg produkter",
    [SCREENS.LIST]:         "Indkøbsliste",
    [SCREENS.PROFILE]:      "Profil",
    [SCREENS.FAMILY]:       "Familie",
    [SCREENS.FAVORITES]:    "Favoritter",
    [SCREENS.HISTORY]:      "Scanningshistorik",
    [SCREENS.RESULT]:       scanResult
      ? `Produktresultat — ${scanResult.name || "ukendt"} [EAN: ${scanResult.ean || scanResult.code || "–"}]`
      : "Produktresultat",
    [SCREENS.NOTFOUND]:     "Produkt ikke fundet",
    [SCREENS.SUBMITTED]:    "Produkt indsendt",
    [SCREENS.SUGGEST_EDIT]: `Foreslå rettelse${scanResult ? ` — ${scanResult.name}` : ""}`,
    [SCREENS.MADPAS]:       madpasWaiterView
      ? `Madpas — Tjenervisning (sprog: ${madpasLang})`
      : `Madpas (sprog: ${madpasLang})`,
    [SCREENS.RECIPES]:      selectedRecipe
      ? `Opskrifter — ${selectedRecipe.name || "ukendt opskrift"}`
      : "Opskrifter — liste",
    [SCREENS.EDITPROFILE]:  `Rediger profil${editMode ? " (onboarding-flow)" : ""}`,
    [SCREENS.ADMIN]:        "Admin dashboard",
  };

  const extras = [];
  if (showManualEan)   extras.push("Manuel EAN-input åben");
  if (madpasWaiterView) extras.push("Madpas tjenervisning");
  if (editMode)        extras.push("Redigeringstilstand");
  if (profilePopup)    extras.push(`Profil-popup: ${profilePopup}`);
  if (selectedRecipe)  extras.push(`Opskrift: ${selectedRecipe.name}`);

  return [labels[screen] || screen, ...extras].join(" · ");
};
