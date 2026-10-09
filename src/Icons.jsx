// @ts-nocheck
import React from "react";
import lactoseDropImg from "./assets/icons/lactose-drop.webp";
import allergenHvedeImg from "./assets/icons/allergen-hvede.webp";
import allergenMaelkImg from "./assets/icons/allergen-maelk.webp";
import allergenAegImg from "./assets/icons/allergen-aeg.webp";
import allergenNoedderImg from "./assets/icons/allergen-noedder.webp";
import allergenJordnoedderImg from "./assets/icons/allergen-jordnoedder.webp";
import allergenSojaImg from "./assets/icons/allergen-soja.webp";
import allergenFiskImg from "./assets/icons/allergen-fisk.webp";
import allergenSkaldyrImg from "./assets/icons/allergen-skaldyr.webp";
import allergenSelleriImg from "./assets/icons/allergen-selleri.webp";
import allergenSennepImg from "./assets/icons/allergen-sennep.webp";
import allergenSesamImg from "./assets/icons/allergen-sesam.webp";
import allergenLupinImg from "./assets/icons/allergen-lupin.webp";
import allergenBloeddyrImg from "./assets/icons/allergen-bloeddyr.webp";
import allergenGlutenImg from "./assets/icons/allergen-gluten.webp";
import allergenSvovlImg from "./assets/icons/allergen-svovl.webp";

// ─── E-NUMMER VÆLGER KOMPONENT ───────────────────────────────────────────────
// ─── SIMPLE IKONER ────────────────────────────────────────────────────────────

export const Icon = ({ name, size=18, color="currentColor" }) => {
  const icons = {
    home: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>,
    scan: <><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h1M4 10h1M4 14h1M7 6h1M7 14h1M10 6h4M10 10h4M10 14h4M16 6h1M16 10h1M16 14h1"/><rect x="2" y="2" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1" strokeWidth="1.5"/></>,
    barcode: <><line x1="3" y1="5" x2="3" y2="19" strokeWidth="1.5"/><line x1="6" y1="5" x2="6" y2="19" strokeWidth="1"/><line x1="8.5" y1="5" x2="8.5" y2="19" strokeWidth="2.5"/><line x1="11.5" y1="5" x2="11.5" y2="19" strokeWidth="1"/><line x1="14" y1="5" x2="14" y2="19" strokeWidth="1.5"/><line x1="16.5" y1="5" x2="16.5" y2="19" strokeWidth="2.5"/><line x1="19" y1="5" x2="19" y2="19" strokeWidth="1"/><line x1="21" y1="5" x2="21" y2="19" strokeWidth="1.5"/></>,
    // Scanner-viewfinder (fire hjørne-vinkler) med stregkode-barer i midten —
    // samme visuelle sprog som det rigtige kamera-scan-overlays hjørne-
    // markører (ScannerScreen.jsx), genbrugt på hjem-forsidens CTA-knap for
    // at signalere "peg og scan" tydeligere end den bare barcode-ikon gjorde.
    scanframe: <><path strokeLinecap="round" strokeLinejoin="round" d="M3 8V5a2 2 0 012-2h3"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 8V5a2 2 0 00-2-2h-3"/><path strokeLinecap="round" strokeLinejoin="round" d="M3 16v3a2 2 0 002 2h3"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 16v3a2 2 0 01-2 2h-3"/><line x1="9" y1="8" x2="9" y2="16" strokeWidth="1.3"/><line x1="11" y1="8" x2="11" y2="16" strokeWidth="2"/><line x1="13" y1="8" x2="13" y2="16" strokeWidth="1.3"/><line x1="15" y1="8" x2="15" y2="16" strokeWidth="2"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></>,
    list: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>,
    profile: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>,
    // Kokkehue (29. sept. 2026, brugerønske) — erstatter den tidligere
    // åbne-bog-ikon, som ikke signalerede "opskrifter/madlavning" tydeligt
    // nok. Puf-toppen (buet path, samme linjevægt/afrundede hjørner som
    // resten af ikonsættet) + et vandret bånd nederst, samme mønster som
    // fx "door"/"building" (path + skilleliner), ikke et nyt SVG-udtryk.
    recipes: <><path strokeLinecap="round" strokeLinejoin="round" d="M17 21a1 1 0 001-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 00-2.134-7.589 5 5 0 00-9.186 0 4 4 0 00-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 001 1z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 17h12"/></>,
    star: <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>,
    globe: <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>,
    check: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>,
    x: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>,
    warning: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>,
    info: <><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 16v-4M12 8h.01"/></>,
    wifiOff: <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M8.5 16.4a5 5 0 017 0M5 12.9a10 10 0 015.2-2.8M19 12.9a10 10 0 00-2.4-1.7M1.6 9.3a15 15 0 014.2-2.7M22.4 9.3A15 15 0 0010.7 5M12 20h.01"/>,
    more: <path strokeLinecap="round" strokeWidth="3" d="M5 12h.01M12 12h.01M19 12h.01"/>,
    chevronLeft: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>,
    chevronRight: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>,
    chevronDown: <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>,
    chevronUp: <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>,
    heart: <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>,
    trash: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>,
    share: <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>,
    cart: <><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></>,
    camera: <><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3.5"/></>,
    bulb: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 00-4.899 11.947c.492.54.899 1.197.899 1.553v.5h8v-.5c0-.356.407-1.013.9-1.553A7 7 0 0012 2z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v1a3 3 0 006 0v-1"/><path strokeLinecap="round" strokeLinejoin="round" d="M9.5 17h5"/></>,
    speaker: <><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12l-4-3H5a1 1 0 01-1-1V9a1 1 0 011-1h3l4-3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728"/></>,
    speakerOff: <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>,
    plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>,
    edit: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>,
    family: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>,
    madpas: <><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M3 8c0-2.5 4-2.5 4 0v4H3M17 3v5a4 4 0 01-8 0V3"/><path strokeLinecap="round" strokeLinejoin="round" d="M13 3v18"/></>,
    book: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></>,
    flame: <path strokeLinecap="round" strokeLinejoin="round" d="M12 22c4.418 0 8-3.14 8-7.5 0-3.5-2-5.5-3-7.5-.5 2-1.5 3-2.5 2 1-3-1-6-3.5-7 .5 3-1 5-3 7-1.5 1.5-4 4-4 5.5 0 4.36 3.582 7.5 8 7.5z"/>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.75"/><circle cx="8.5" cy="9.5" r="1.5" strokeWidth="1.75"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 16l-5.5-5.5a2 2 0 00-2.83 0L4 19"/></>,
    flashlight: <><path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6l1 4-2 2v12a2 2 0 01-2 2h-0a2 2 0 01-2-2V8L8 6l1-4z"/><path strokeLinecap="round" d="M9 10h6"/></>,
    shield: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/></>,
    block: <><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M6.5 6.5l11 11"/></>,
    link: <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5"/>,
    bell: <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>,
    tag: <><path strokeLinecap="round" strokeLinejoin="round" d="M11.5 3H6a3 3 0 00-3 3v5.5a2 2 0 00.586 1.414l8 8a2 2 0 002.828 0l6.5-6.5a2 2 0 000-2.828l-8-8A2 2 0 0011.5 3z"/><circle cx="8" cy="8" r="1.25" fill="currentColor" stroke="none"/></>,
    package: <><path strokeLinecap="round" strokeLinejoin="round" d="M21 8l-9-5-9 5 9 5 9-5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M3 8v8l9 5 9-5V8"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 13v8"/></>,
    message: <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>,
    chart: <><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v16a2 2 0 002 2h16"/><rect x="7" y="12" width="3" height="6" rx="0.5" strokeWidth="1.75"/><rect x="12.5" y="8" width="3" height="10" rx="0.5" strokeWidth="1.75"/><rect x="18" y="5" width="3" height="13" rx="0.5" strokeWidth="1.75"/></>,
    bug: <><circle cx="12" cy="7" r="2" strokeWidth="1.75"/><path strokeLinecap="round" d="M10.5 5.5L9 4M13.5 5.5L15 4"/><rect x="8" y="9" width="8" height="10" rx="4" strokeWidth="1.75"/><path strokeLinecap="round" d="M8 12H4M16 12h4M8 15H4M16 15h4M8 18H5M16 18h3"/></>,
    download: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4"/><path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></>,
    eye: <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><circle cx="12" cy="12" r="3" strokeWidth="1.75"/></>,
    eyeOff: <><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></>,
    refresh: <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.75"/><path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="1.75"/><path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4"/></>,
    key: <><circle cx="8" cy="15" r="4" strokeWidth="1.75"/><path strokeLinecap="round" strokeLinejoin="round" d="M11.5 11.5L20 3m-4 4l2 2m-6-6l2 2"/></>,
    file: <><path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5"/></>,
    clock: <><circle cx="12" cy="12" r="9" strokeWidth="1.75"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3.5 2"/></>,
    save: <><path strokeLinecap="round" strokeLinejoin="round" d="M5 4h11l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 4v5h7V4M8 20v-6h8v6"/></>,
    // Mælkekarton (1. okt. 2026) — stregikon til Madpas-kortet i stedet for
    // det illustrerede glas, som lignede en emoji.
    milk: <><path strokeLinecap="round" strokeLinejoin="round" d="M9 2.5h6M9 2.5 6.5 7.5h11L15 2.5M6.5 7.5V20a1.5 1.5 0 001.5 1.5h8a1.5 1.5 0 001.5-1.5V7.5"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 11.5c-1.3 1.6-2 2.8-2 3.7a2 2 0 004 0c0-.9-.7-2.1-2-3.7z"/></>,
    // Allergen-stregikoner til Madpas-kortet (1. okt. 2026) — samme stil som
    // milk: 24x24, streg 1.75, runde ender. Mappes fra allergen-id i MadpasScreen.jsx.
    wheat: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 21.5V7"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 7c-1.1-1.2-1.1-3 0-4.5 1.1 1.5 1.1 3.3 0 4.5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c-2.2 0-3.8-1.4-3.8-3.3 2.2 0 3.8 1.4 3.8 3.3zM12 11c2.2 0 3.8-1.4 3.8-3.3-2.2 0-3.8 1.4-3.8 3.3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 15c-2.2 0-3.8-1.4-3.8-3.3 2.2 0 3.8 1.4 3.8 3.3zM12 15c2.2 0 3.8-1.4 3.8-3.3-2.2 0-3.8 1.4-3.8 3.3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 19c-2.2 0-3.8-1.4-3.8-3.3 2.2 0 3.8 1.4 3.8 3.3zM12 19c2.2 0 3.8-1.4 3.8-3.3-2.2 0-3.8 1.4-3.8 3.3z"/></>,
    bread: <><path strokeLinecap="round" strokeLinejoin="round" d="M6.5 11.6C4.8 11 3.5 9.6 3.5 7.8 3.5 5.4 5.6 3.5 8.2 3.5h7.6c2.6 0 4.7 1.9 4.7 4.3 0 1.8-1.3 3.2-3 3.8V19.5a1 1 0 01-1 1h-9a1 1 0 01-1-1z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9.5 10l1.5-2M13 12l1.5-2"/></>,
    glass: <><path strokeLinecap="round" strokeLinejoin="round" d="M6.5 3h11l-1.6 16.6a1.6 1.6 0 01-1.6 1.4H9.7a1.6 1.6 0 01-1.6-1.4L6.5 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M7.2 9.5c1.6-.8 3.2-.8 4.8 0s3.2.8 4.8 0"/></>,
    egg: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.8c3.4 0 6.3 5.3 6.3 10a6.3 6.3 0 01-12.6 0c0-4.7 2.9-10 6.3-10z"/></>,
    acorn: <><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5c0-3.3 3.4-5.5 7.5-5.5s7.5 2.2 7.5 5.5h-15z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 5V2.5M12 2.5l2 1"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 10.5c0 5 2.8 8.8 6 10.8 3.2-2 6-5.8 6-10.8"/></>,
    peanut: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.8c2.6 0 4.3 1.9 4.3 4.2 0 1.6-.9 2.5-.9 3.7s1.4 2.1 1.4 4.4c0 3.2-2.4 6.1-4.8 6.1s-4.8-2.9-4.8-6.1c0-2.3 1.4-3.2 1.4-4.4S7.7 8.6 7.7 7c0-2.3 1.7-4.2 4.3-4.2z"/><path strokeLinecap="round" strokeLinejoin="round" d="M10.3 6.5h.01M13.6 7.6h.01M10.5 14.4h.01M13.4 16.6h.01"/></>,
    soy: <><path strokeLinecap="round" strokeLinejoin="round" d="M4.6 19.4c-1.6-1.6-1-4.8 2-7.8l5-5c3-3 6.2-3.6 7.8-2 1.6 1.6 1 4.8-2 7.8l-5 5c-3 3-6.2 3.6-7.8 2z"/><circle strokeLinecap="round" strokeLinejoin="round" cx="8.6" cy="15.4" r="1.6"/><circle strokeLinecap="round" strokeLinejoin="round" cx="12" cy="12" r="1.6"/><circle strokeLinecap="round" strokeLinejoin="round" cx="15.4" cy="8.6" r="1.6"/></>,
    fish: <><path strokeLinecap="round" strokeLinejoin="round" d="M5 12c2.5-3.3 5.7-5 8.8-5 3.4 0 6 2.1 7.7 5-1.7 2.9-4.3 5-7.7 5-3.1 0-6.3-1.7-8.8-5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M5 12 2 8.5v7L5 12z"/><path strokeLinecap="round" strokeLinejoin="round" d="M17 11h.01"/><path strokeLinecap="round" strokeLinejoin="round" d="M11 9.5c.8 1.6.8 3.4 0 5"/></>,
    shrimp: <><path strokeLinecap="round" strokeLinejoin="round" d="M18 4.5C11.5 4.5 6.5 8.6 6.5 14c0 3.2 2.3 5.5 5.5 5.5"/><path strokeLinecap="round" strokeLinejoin="round" d="M18 9.5c-3.6 0-6.5 2.3-6.5 5 0 1.3.8 2.3 2 2.6"/><path strokeLinecap="round" strokeLinejoin="round" d="M18 4.5v5"/><path strokeLinecap="round" strokeLinejoin="round" d="M12.2 5.4l1.6 4.5M8.7 8.2l3.8 3.2M6.8 12.6l4.8 1.3"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5l1 2.5M13.5 17.1l2.6 1.6"/><path strokeLinecap="round" strokeLinejoin="round" d="M18 4.5c1.3-1.1 2.3-2.2 2.8-3.5M18 6.2c1.6-.4 2.9-.3 4 .4"/></>,
    shell: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5 5.6 13.6c-.7-.7-1.1-1.6-1.1-2.6a7.5 7.5 0 0115 0c0 1-.4 1.9-1.1 2.6L12 19.5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5V3.5M12 19.5 8.3 4.5M12 19.5l3.7-15M12 19.5 5 8.2M12 19.5l7-11.3"/><path strokeLinecap="round" strokeLinejoin="round" d="M10 21.5h4"/></>,
    celery: <><path strokeLinecap="round" strokeLinejoin="round" d="M8.5 21V11.5M12 21V9M15.5 21V11.5"/><path strokeLinecap="round" strokeLinejoin="round" d="M8.5 11.5C6.4 11.2 5.2 9.6 5.5 7.5c1.8.1 3 1.6 3 4zM12 9c-1.4-1.5-1.4-4 0-6.5 1.4 2.5 1.4 5 0 6.5zM15.5 11.5c2.1-.3 3.3-1.9 3-4-1.8.1-3 1.6-3 4z"/><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10"/></>,
    mustard: <><path strokeLinecap="round" strokeLinejoin="round" d="M10 2.5h4v3h-4z"/><path strokeLinecap="round" strokeLinejoin="round" d="M8.5 5.5h7l1 3v11.5a1.5 1.5 0 01-1.5 1.5H9a1.5 1.5 0 01-1.5-1.5V8.5l1-3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 13h9"/></>,
    sesame: <><path strokeLinecap="round" strokeLinejoin="round" d="M8 3c1.6 1.4 2.3 3.2 2 5-.2 1.4-1.3 2.2-2 2.2S6.2 9.4 6 8c-.3-1.8.4-3.6 2-5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 6.5c1.6 1.4 2.3 3.2 2 5-.2 1.4-1.3 2.2-2 2.2s-1.8-.8-2-2.2c-.3-1.8.4-3.6 2-5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9.5 13.5c1.6 1.4 2.3 3.2 2 5-.2 1.4-1.3 2.2-2 2.2s-1.8-.8-2-2.2c-.3-1.8.4-3.6 2-5z"/></>,
    lupin: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 21.5V6"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 9c-1.6 0-2.8-.9-2.8-2.2 1.6 0 2.8.9 2.8 2.2zM12 9c1.6 0 2.8-.9 2.8-2.2-1.6 0-2.8.9-2.8 2.2zM12 13c-1.9 0-3.3-1-3.3-2.6 1.9 0 3.3 1 3.3 2.6zM12 13c1.9 0 3.3-1 3.3-2.6-1.9 0-3.3 1-3.3 2.6zM12 17c-2.2 0-3.8-1.2-3.8-2.9 2.2 0 3.8 1.2 3.8 2.9zM12 17c2.2 0 3.8-1.2 3.8-2.9-2.2 0-3.8 1.2-3.8 2.9z"/></>,
    wine: <><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 2.5h9l.6 5a5.1 5.1 0 01-10.2 0l.6-5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M7.2 6.5h9.6"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 12.7v8M8.5 21h7"/></>,
    utensils: <><path strokeLinecap="round" strokeLinejoin="round" d="M7 3v7a2 2 0 002 2h0a2 2 0 002-2V3M9 12v9M16 3c-1.5 1.5-2 3-2 6s.5 4.5 2 6v6"/></>,
    hash: <path strokeLinecap="round" strokeLinejoin="round" d="M5 9h14M5 15h14M10 4L8 20m8-16l-2 16"/>,
    zap: <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>,
    // "Sliders"-stil indstillings-ikon (25. sept. 2026, ProfileMenu.jsx's
    // "Indstillinger") — generisk nok til at dække notifikationer/sprog/
    // konto/app-præferencer efterhånden som de tilføjes, i stedet for et
    // ikon der kun betyder én bestemt indstillingstype (fx "bell").
    settings: <><line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round"/><line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round"/><line x1="4" y1="18" x2="20" y2="18" strokeLinecap="round"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" style={{ flexShrink:0, display:"block" }}>
      {icons[name]}
    </svg>
  );
};

// ─── LAKTOSE-IKON (29.-30. sept. 2026) ────────────────────────────────────────
// Alle andre allergener bruger stadig deres rigtige Unicode-emoji direkte
// (a.emoji, se constants.jsx/ALLERGENS — bevidst, se CLAUDE.md afsnit 6: kun
// content-emoji, ikke UI-chrome, er tilbage i appen). "Laktose" er en
// specifik, begrundet undtagelse: dens tidligere emoji (🍬, slik) havde
// ingen visuel sammenhæng med laktose overhovedet, og et almindeligt
// mælke-glas-emoji ville skabe forveksling med "Mælk"s eget 🥛 (allergi over
// for mælkeprotein er noget andet end laktoseintolerance). Et hånd-tegnet,
// fladt to-linjers SVG-udkast (29. sept.) blev erstattet dagen efter med et
// brugerleveret, blankt 3D-renderet ikon (afrundet cremefarvet mælkedråbe
// med et glansfyldt grønt "L") — importeret som `src/assets/icons/
// lactose-drop.png` (nedskaleret til 320×320, rigeligt til den største
// brugsstørrelse på 32px i Madpas' fremvisningsskærm). Kildebilledet havde
// en ensfarvet hvid baggrund uden alfakanal, som ville vise sig som en
// firkantet hvid boks på selected-chip-baggrunden (lys grøn) — løst med en
// glat spline-`clipPath` der følger dråbens silhuet (målt punkt-for-punkt
// fra kildebilledet, med indadgående margin, interpoleret til en jævn
// kurve via Catmull-Rom→Bezier), i stedet for et pixel-baseret
// baggrunds-fjernelsesværktøj (upålideligt her, da dråbens egen cremefarve
// mange steder ligger meget tæt på selve baggrundens hvide tone).
const LactoseIcon = ({ size = 16, style }) => {
  const clipId = React.useId();
  return (
    // viewBox er beskåret stramt til selve dråbens silhuet (30. sept. 2026,
    // størrelses-opfølgning) — det oprindelige "0 0 320 320" havde meget
    // luft omkring dråben (samme billede-kilde, bare et større "lærred"),
    // så ikonet virkede tydeligt mindre end de omkringliggende allergen-
    // emojier ved samme `size`-værdi. Beskæres nu til dråbens faktiske
    // grænser (+ lidt luft), så den fylder sin boks ligesom emojierne gør.
    <svg width={size} height={size} viewBox="84 49 154 217" style={style} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clipId}>
          <path d="M 160.00,57.42 C 160.43,57.42 159.36,60.61 160.77,63.80 C 162.17,66.99 164.17,70.18 168.42,76.56 C 172.67,82.93 179.90,93.57 186.28,102.07 C 192.66,110.58 200.32,117.94 206.70,127.59 C 213.08,137.25 220.73,149.37 224.56,160.00 C 228.39,170.63 230.52,181.90 229.67,191.39 C 228.81,200.87 223.71,209.25 219.46,216.91 C 215.20,224.56 209.25,232.22 204.15,237.32 C 199.04,242.42 194.36,244.76 188.84,247.53 C 183.31,250.29 175.78,252.21 170.97,253.91 C 166.17,255.61 163.83,257.74 160.00,257.74 C 156.17,257.74 152.98,255.61 148.01,253.91 C 143.03,252.21 135.67,250.29 130.14,247.53 C 124.61,244.76 119.94,242.42 114.83,237.32 C 109.73,232.22 103.35,224.56 99.52,216.91 C 95.69,209.25 92.72,200.87 91.87,191.39 C 91.02,181.90 91.02,170.63 94.42,160.00 C 97.82,149.37 105.90,137.25 112.28,127.59 C 118.66,117.94 126.32,110.58 132.70,102.07 C 139.07,93.57 146.31,82.93 150.56,76.56 C 154.81,70.18 156.64,66.99 158.21,63.80 C 159.79,60.61 159.57,57.42 160.00,57.42 Z" />
        </clipPath>
      </defs>
      <image href={lactoseDropImg} x="0" y="0" width="320" height="320" clipPath={`url(#${clipId})`} />
    </svg>
  );
};

// ─── ALLERGEN-IKONSÆT (30. sept. 2026) ────────────────────────────────────────
// Brugerleveret, blankt 3D-illustreret ikonsæt (samme stil/kilde som Laktose-
// dråben) for de resterende 15 allergener — erstatter deres Unicode-emoji
// (a.emoji) et for et. Hvert billede er udtrukket fra en 4×4-gitteroversigt,
// beskåret til objektets egen silhuet og eksporteret med reel alfa-
// gennemsigtighed, så de — ligesom Laktose-dråben — fungerer uændret på både
// hvid og selected-chip-baggrund (lys grøn). De fleste blev renset med en
// grænse-flood-fill (baggrunden er ensfarvet hvid uden alfakanal i kilde-
// billedet); "Mælk" (glas) og "Æg" havde samme lav-kontrast-problem som
// Laktose (deres egen lyse farve ligger for tæt på baggrundens hvide tone
// til automatisk fjernelse) og er derfor maskeret med samme håndmålte
// spline-silhuet-teknik som LactoseIcon, bagt til en rigtig alfakanal i
// stedet for en klip-sti ved kørsel (simplere — ét fælles renderings-
// mønster for alle 16 ikoner).
const ALLERGEN_ICON_MAP = {
  hvede: allergenHvedeImg,
  maelkeallergi: allergenMaelkImg,
  aeg: allergenAegImg,
  noedder: allergenNoedderImg,
  jordnoedder: allergenJordnoedderImg,
  soja: allergenSojaImg,
  fisk: allergenFiskImg,
  skaldyr: allergenSkaldyrImg,
  selleri: allergenSelleriImg,
  sennep: allergenSennepImg,
  sesam: allergenSesamImg,
  lupin: allergenLupinImg,
  bloeddyr: allergenBloeddyrImg,
  gluten: allergenGlutenImg,
  svovl: allergenSvovlImg,
};

// Centraliserer allergen-ikonerne ét sted, så hver chip-visning i appen
// (Madpas, Familie, Profil, Rediger præferencer, Resultatside, Opskrifter,
// Admin) automatisk viser samme ikonsæt, i stedet for at hvert kaldested
// selv skal kende til specialtilfældene. `a` kan være undefined/null (samme
// tolerance som de tidligere `{a?.emoji}`-kaldesteder). Falder tilbage til
// det rigtige emoji, hvis et allergen-id ikke (endnu) har et ikon.
export const AllergenGlyph = ({ a, size = 14 }) => {
  if (a?.id === "laktose") return <LactoseIcon size={size} style={{ verticalAlign:"-2px" }} />;
  const img = a?.id && ALLERGEN_ICON_MAP[a.id];
  if (img) return <img src={img} alt="" width={size} height={size} style={{ objectFit:"contain", verticalAlign:"-2px" }} />;
  return <>{a?.emoji}</>;
};
