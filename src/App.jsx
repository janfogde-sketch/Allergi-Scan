// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from "react";

// ─── LOGO KOMPONENT (inline — ingen ekstern fil nødvendig) ───────────────────
function AllergiScanLogo({ size = 32, variant = "light" }) {
  const isDark = variant === "dark";
  const bg = isDark ? "#1F2733" : "#FAFAF7";
  const barColor = isDark ? "#3A4452" : "#1F2733";
  const id = "as-" + size + "-" + variant;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} aria-label="Allergi Scan">
      <defs>
        <clipPath id={"sq-"+id}>
          <path d="M 50 0 C 85 0, 100 15, 100 50 C 100 85, 85 100, 50 100 C 15 100, 0 85, 0 50 C 0 15, 15 0, 50 0 Z" />
        </clipPath>
        <filter id={"glow-"+id} x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur stdDeviation={isDark ? 2.4 : 1.6} result="blur" />
          <feMerge>
            {isDark && <feMergeNode in="blur" />}
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={"gline-"+id} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <g clipPath={"url(#sq-"+id+")"}>
        <rect width="100" height="100" fill={bg} />
        <g fill={barColor}>
          <rect x="18.00" y="16" width="8.31" height="68" rx="1.49" />
          <rect x="29.05" y="22" width="4.15" height="56" rx="0.75" />
          <rect x="35.94" y="16" width="5.54" height="68" rx="1.00" />
          <rect x="44.21" y="22" width="2.77" height="56" rx="0.50" />
          <rect x="49.71" y="16" width="3.32" height="68" rx="0.60" />
          <rect x="55.76" y="22" width="6.92" height="56" rx="1.25" />
          <rect x="65.41" y="16" width="4.43" height="68" rx="0.80" />
          <rect x="72.57" y="22" width="5.54" height="56" rx="1.00" />
          <rect x="80.84" y="16" width="3.88" height="68" rx="0.70" />
        </g>
        <g filter={"url(#glow-"+id+")"}>
          <path
            d="M 20 58 L 70 58 L 76 64 L 86 50"
            fill="none"
            stroke={isDark ? "#4ADE80" : "url(#gline-"+id+")"}
            strokeWidth="4.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}


// ─── KONFIGURATION ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://jegrpcflyguadyxialkm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZ3JwY2ZseWd1YWR5eGlhbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjY5NjQsImV4cCI6MjA5NDc0Mjk2NH0.QErfbw2xmsdYjTZCS1WUOUwQHv6G2PKQRldyj8rdGq8";

// ─── KONSTANTER ──────────────────────────────────────────────────────────────
const ALLERGENS = [
  { id:"gluten",      label:"Gluten",         emoji:"🌾" },
  { id:"laktose",     label:"Laktose / Mælk", emoji:"🥛" },
  { id:"aeg",         label:"Æg",             emoji:"🥚" },
  { id:"noedder",     label:"Nødder",         emoji:"🌰" },
  { id:"jordnoedder", label:"Jordnødder",     emoji:"🥜" },
  { id:"soja",        label:"Soja",           emoji:"🫘" },
  { id:"fisk",        label:"Fisk",           emoji:"🐟" },
  { id:"skaldyr",     label:"Skaldyr",        emoji:"🦐" },
  { id:"selleri",     label:"Selleri",        emoji:"🥬" },
  { id:"sennep",      label:"Sennep",         emoji:"🌶️" },
  { id:"sesam",       label:"Sesam",          emoji:"🌿" },
  { id:"svovl",       label:"Sulfitter",      emoji:"🍷" },
  { id:"lupin",       label:"Lupin",          emoji:"🌸" },
  { id:"bloeddyr",    label:"Bløddyr",        emoji:"🦑" },
];

const DEMO_CODES = [
  { code:"3017620422003", label:"Nutella" },
  { code:"5449000054227", label:"Coca-Cola" },
  { code:"7394376616566", label:"Oatly" },
  { code:"5701029015306", label:"Lurpak" },
];

const SCREENS = {
  WELCOME:"welcome", LOGIN:"login", ONBOARD:"onboard",
  HOME:"home", SCAN:"scan", SEARCH:"search",
  LIST:"list", PROFILE:"profile", FAMILY:"family",
  RESULT:"result", HISTORY:"history",
  NOTFOUND:"notfound", SUBMITTED:"submitted",
};

const AVATAR_COLORS = ["#52b788","#74c69d","#40916c","#b7e4c7","#2d6a4f","#95d5b2","#f4a261","#e76f51"];

// ─── HJÆLPEFUNKTIONER ────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,9);
const initials = n => (n||"").split(" ").filter(Boolean).map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";
const timeAgo = ts => { const d=Date.now()-new Date(ts).getTime(); if(d<60000)return"Lige nu"; if(d<3600000)return`${Math.floor(d/60000)} min siden`; if(d<86400000)return`${Math.floor(d/3600000)} t siden`; return`${Math.floor(d/86400000)} d siden`; };
const getAllergenLabels = (ids,custom=[]) => [...ids.map(id=>ALLERGENS.find(a=>a.id===id)).filter(Boolean).map(a=>`${a.emoji} ${a.label}`),...custom.map(c=>`✏️ ${c}`)];
const verifiedBadge = v => v==="verified"||v===true?{label:"✓ Verificeret",bg:"rgba(34,197,94,.1)",color:"#16a34a"}:v==="partial"?{label:"⚡ Delvist",bg:"rgba(217,119,6,.08)",color:"#d97706"}:{label:"? Ubekræftet",bg:"rgba(230,57,70,.08)",color:"#e63946"};

// ─── SUPABASE API-HJÆLPER ────────────────────────────────────────────────────
function makeHeaders(token) {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

async function apiCall(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// ─── ALLERGEN SAMMENLIGNING ──────────────────────────────────────────────────
function compareAllergens(flags, activeAllergenIds) {
  if (!flags || activeAllergenIds.length === 0) return { status:"safe", matchedDanger:[], matchedWarning:[], hasUnknown:false };
  const matchedDanger = [];
  const matchedWarning = [];
  let hasUnknown = false;
  for (const id of activeAllergenIds) {
    const val = flags[id];
    if (val === "yes") matchedDanger.push(id);
    else if (val === "traces") matchedWarning.push(id);
    else if (val === "unknown") hasUnknown = true;
  }
  let status = "safe";
  if (matchedDanger.length > 0) status = "danger";
  else if (matchedWarning.length > 0) status = "warn";
  return { status, matchedDanger, matchedWarning, hasUnknown };
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  /* Logo-afledte farver */
  --ink:#1F2733;        /* logoets stregkode-farve */
  --ink2:#2d3a48;       /* lidt lysere ink */
  --ink3:#3d4e5e;       /* endnu lysere */
  --paper:#FAFAF7;      /* logoets baggrund */
  --paper2:#F2F2EE;     /* lidt mørkere paper */
  --green:#22C55E;      /* signalgrøn fra logoet */
  --green-glow:#4ADE80; /* glow-grøn fra logoet */
  --green-lt:rgba(34,197,94,.1);
  --green-mid:rgba(34,197,94,.18);
  --border:#E4E4DF;     /* diskret paper-farvet border */
  --border2:#D0D0C8;    /* lidt tydeligere */
  --red:#E63946;--red-lt:rgba(230,57,70,.08);--red-md:rgba(230,57,70,.15);
  --amber:#D97706;--amber-lt:rgba(217,119,6,.08);--amber-md:rgba(217,119,6,.14);
  --blue:#2563EB;--blue-lt:rgba(37,99,235,.08);
  --muted:#8A9099;      /* grå-blå neutral */
  --muted2:#6B7280;
  --r:12px;
  --f:'Inter',system-ui,sans-serif;
  --sh:0 1px 3px rgba(31,39,51,.06),0 2px 8px rgba(31,39,51,.05);
  --sh2:0 4px 16px rgba(31,39,51,.12);
  --sh3:0 8px 32px rgba(31,39,51,.16);
}
body{background:var(--paper);color:var(--ink);font-family:var(--f);-webkit-font-smoothing:antialiased;}
.app{max-width:390px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--paper);width:100%;position:relative;overflow-x:hidden;}

/* ── TOPBAR ── */
.topbar{background:var(--paper);border-bottom:1px solid var(--border);padding:12px 18px 10px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:60;backdrop-filter:blur(8px);}
.topbar-logo{display:flex;align-items:center;gap:8px;}
.topbar-shield{width:32px;height:32px;background:none;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}
.topbar-name{font-size:17px;font-weight:800;color:var(--ink);letter-spacing:-.5px;font-family:var(--f);}
.topbar-name span{color:var(--green);font-style:italic;font-weight:800;}
.topbar-avatar{width:32px;height:32px;background:var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--paper);cursor:pointer;transition:all .15s;letter-spacing:.5px;}
.topbar-avatar:hover{background:var(--ink2);}

/* ── LAYOUT ── */
.screen{flex:1;padding:0 16px 96px;}
.bottom-nav{position:sticky;bottom:0;width:100%;background:var(--paper);border-top:1px solid var(--border);display:flex;padding:6px 4px 16px;z-index:100;box-shadow:0 -1px 0 var(--border),0 -4px 16px rgba(31,39,51,.06);}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;opacity:.3;transition:all .15s;}
.nav-item.active{opacity:1;}
.nav-icon{width:42px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:background .15s;}
.nav-item.active .nav-icon{background:var(--green-lt);}
.nav-lbl{font-size:9.5px;font-weight:700;color:var(--ink);letter-spacing:.2px;}
.nav-item.active .nav-lbl{color:var(--green);}

/* ── CARDS & COMPONENTS ── */
.card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:10px;box-shadow:var(--sh);}
.card-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin-bottom:10px;}
.card-title{font-size:15px;font-weight:800;color:var(--ink);margin-bottom:4px;letter-spacing:-.2px;}
.field{width:100%;background:var(--paper2);border:1.5px solid var(--border2);border-radius:10px;padding:11px 14px;color:var(--ink);font-family:var(--f);font-size:15px;outline:none;transition:border-color .15s,background .15s;}
.field:focus{border-color:var(--green);background:#fff;box-shadow:0 0 0 3px var(--green-lt);}
.field-lbl{font-size:11.5px;font-weight:700;color:var(--ink2);margin-bottom:5px;display:block;letter-spacing:.1px;}
.input-row{display:flex;gap:8px;}

/* ── BUTTONS ── */
.btn{padding:12px 20px;border-radius:10px;border:none;font-family:var(--f);font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;gap:6px;letter-spacing:-.1px;}
.btn-full{width:100%;}
.btn-primary{background:var(--ink);color:var(--paper);box-shadow:0 2px 8px rgba(31,39,51,.2);}
.btn-primary:hover{background:var(--ink2);transform:translateY(-1px);box-shadow:var(--sh2);}
.btn-green{background:var(--green);color:#fff;box-shadow:0 2px 8px rgba(34,197,94,.25);}
.btn-green:hover{background:var(--green-glow);transform:translateY(-1px);}
.btn-outline{background:transparent;color:var(--ink);border:1.5px solid var(--border2);}
.btn-outline:hover{border-color:var(--ink);background:var(--paper2);}
.btn-danger{background:transparent;color:var(--red);border:1.5px solid rgba(230,57,70,.3);}
.btn-danger:hover{background:var(--red-lt);}
.btn-sm{padding:7px 13px;font-size:12.5px;border-radius:8px;}
.btn-ghost{background:var(--paper2);color:var(--ink2);border:1px solid var(--border);}
.btn-ghost:hover{background:var(--border);color:var(--ink);}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important;}

/* ── CHIPS & TAGS ── */
.chip-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.chip{display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:10px;border:1.5px solid var(--border2);background:#fff;cursor:pointer;transition:all .15s;font-size:12.5px;font-weight:600;color:var(--muted2);user-select:none;}
.chip:hover{border-color:var(--ink3);color:var(--ink);}
.chip.on{border-color:var(--green);background:var(--green-lt);color:var(--ink);font-weight:700;}
.chip-check{margin-left:auto;width:16px;height:16px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;flex-shrink:0;}
.tags{display:flex;flex-wrap:wrap;gap:5px;}
.tag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--green-lt);border:1px solid var(--green-mid);border-radius:100px;font-size:12px;color:var(--ink);font-weight:600;}
.tag-x{cursor:pointer;opacity:.4;font-size:13px;margin-left:1px;}.tag-x:hover{opacity:.8;}

/* ── BADGES ── */
.badge{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;letter-spacing:.2px;}
.badge.safe{background:var(--green-lt);color:var(--green);border:1px solid var(--green-mid);}
.badge.danger{background:var(--red-lt);color:var(--red);border:1px solid var(--red-md);}
.badge.warn{background:var(--amber-lt);color:var(--amber);border:1px solid var(--amber-md);}

.divider{display:flex;align-items:center;gap:10px;margin:12px 0;color:var(--muted);font-size:11.5px;font-weight:600;letter-spacing:.3px;}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border);}

/* ── WELCOME ── */
.welcome-screen{min-height:100vh;background:var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 28px;text-align:center;}
.welcome-shield{width:96px;height:96px;background:rgba(250,250,247,.06);border-radius:28px;display:flex;align-items:center;justify-content:center;margin:0 auto 32px;border:1px solid rgba(250,250,247,.1);overflow:hidden;}
.welcome-title{font-size:36px;font-weight:800;color:var(--paper);line-height:1.1;margin-bottom:14px;letter-spacing:-.8px;}
.welcome-title span{color:var(--green);font-style:italic;}
.welcome-sub{font-size:15px;color:rgba(250,250,247,.5);line-height:1.65;margin-bottom:44px;font-weight:400;}
.welcome-features{display:flex;flex-direction:column;gap:16px;margin-bottom:44px;width:100%;}
.welcome-feat{display:flex;align-items:center;gap:14px;text-align:left;}
.welcome-feat-icon{width:40px;height:40px;background:rgba(250,250,247,.07);border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:1px solid rgba(250,250,247,.08);}
.welcome-feat-text{font-size:13.5px;color:rgba(250,250,247,.7);font-weight:500;line-height:1.45;}
.welcome-feat-text strong{color:var(--paper);font-weight:700;}
.welcome-btn{background:var(--green);color:#fff;border:none;border-radius:11px;padding:15px 32px;font-family:var(--f);font-size:15px;font-weight:700;cursor:pointer;width:100%;transition:all .18s;margin-bottom:10px;letter-spacing:-.1px;}
.welcome-btn:hover{background:var(--green-glow);transform:translateY(-1px);}
.welcome-btn-ghost{background:rgba(250,250,247,.07);color:rgba(250,250,247,.75);border:1px solid rgba(250,250,247,.12);border-radius:11px;padding:13px 32px;font-family:var(--f);font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:all .18s;}
.welcome-btn-ghost:hover{background:rgba(250,250,247,.11);}

/* ── LOGIN ── */
.login-wrap{min-height:100vh;background:var(--paper);display:flex;flex-direction:column;padding:48px 20px 32px;}
.login-header{text-align:center;margin-bottom:28px;}
.login-shield{width:64px;height:64px;background:none;border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;overflow:hidden;}
.login-title{font-size:24px;font-weight:800;color:var(--ink);letter-spacing:-.5px;}
.login-sub{font-size:13px;color:var(--muted);margin-top:4px;}

/* ── ONBOARDING ── */
.onboard-wrap{padding:20px 16px 100px;}
.step-seg{height:3px;flex:1;border-radius:2px;background:var(--border2);transition:background .3s;}
.step-seg.done{background:var(--green);}
.step-num{font-size:11px;font-weight:700;color:var(--muted);white-space:nowrap;}
.step-title{font-size:17px;font-weight:800;margin-bottom:5px;color:var(--ink);letter-spacing:-.3px;}
.step-sub{font-size:13px;color:var(--muted2);margin-bottom:16px;line-height:1.55;}
.onboard-skip{font-size:12px;color:var(--muted);text-align:center;margin-top:8px;}

/* ── HOME ── */
.greeting{padding:20px 0 14px;}
.greeting-main{font-size:21px;font-weight:800;color:var(--ink);letter-spacing:-.4px;}
.greeting-sub{font-size:13px;color:var(--muted2);margin-top:3px;font-weight:500;}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.stat-card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px;box-shadow:var(--sh);}
.stat-num{font-size:26px;font-weight:800;color:var(--ink);line-height:1;letter-spacing:-.5px;}
.stat-lbl{font-size:11px;color:var(--muted);margin-top:4px;font-weight:600;letter-spacing:.2px;}
.scan-hero{background:var(--ink);border-radius:16px;padding:20px 18px;margin-bottom:10px;display:flex;align-items:center;gap:16px;cursor:pointer;transition:all .18s;box-shadow:var(--sh2);position:relative;overflow:hidden;}
.scan-hero::after{content:'';position:absolute;right:-10px;bottom:-10px;width:80px;height:80px;background:radial-gradient(circle,rgba(34,197,94,.15) 0%,transparent 70%);pointer-events:none;}
.scan-hero:hover{transform:translateY(-2px);box-shadow:var(--sh3);}
.scan-hero-icon{font-size:36px;flex-shrink:0;filter:grayscale(1) brightness(3);}
.scan-hero-title{font-size:18px;font-weight:800;color:var(--paper);letter-spacing:-.4px;}
.scan-hero-sub{font-size:12px;color:rgba(250,250,247,.45);margin-top:3px;font-weight:500;}
.scan-hero-arrow{font-size:18px;color:var(--green);margin-left:auto;flex-shrink:0;}
.quick-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.quick-btn{background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s;box-shadow:var(--sh);}
.quick-btn:hover{border-color:var(--green-mid);background:var(--green-lt);}
.quick-icon{font-size:20px;flex-shrink:0;}
.quick-label{font-size:13px;font-weight:700;color:var(--ink);letter-spacing:-.1px;}

/* ── SCAN ── */
.scan-box{background:var(--ink);border-radius:16px;overflow:hidden;margin-bottom:12px;position:relative;}
.scan-viewfinder{height:220px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;position:relative;cursor:pointer;}
.scan-corner{position:absolute;width:28px;height:28px;border-color:rgba(250,250,247,.5);border-style:solid;border-width:0;}
.scan-corner.tl{top:18px;left:18px;border-top-width:2.5px;border-left-width:2.5px;border-radius:3px 0 0 0;}
.scan-corner.tr{top:18px;right:18px;border-top-width:2.5px;border-right-width:2.5px;border-radius:0 3px 0 0;}
.scan-corner.bl{bottom:18px;left:18px;border-bottom-width:2.5px;border-left-width:2.5px;border-radius:0 0 0 3px;}
.scan-corner.br{bottom:18px;right:18px;border-bottom-width:2.5px;border-right-width:2.5px;border-radius:0 0 3px 0;}
.scan-laser{position:absolute;left:22px;right:22px;height:2px;background:linear-gradient(90deg,transparent,var(--green),var(--green-glow),var(--green),transparent);animation:laserMove 2s ease-in-out infinite;filter:drop-shadow(0 0 4px var(--green));}
@keyframes laserMove{0%,100%{top:20px;opacity:.4;}50%{top:calc(100% - 20px);opacity:1;}}
.scan-camera-text{color:rgba(250,250,247,.45);font-size:12.5px;font-weight:600;position:relative;z-index:1;letter-spacing:.1px;}
.scan-camera-icon{font-size:40px;position:relative;z-index:1;filter:grayscale(1) brightness(3) opacity(.6);}
.scan-bar{background:rgba(0,0,0,.25);padding:11px 16px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(250,250,247,.06);}
.scan-bar-txt{color:rgba(250,250,247,.5);font-size:11.5px;font-weight:600;}

/* ── RESULT ── */
.result-banner{border-radius:12px;padding:16px 18px;margin-bottom:10px;display:flex;align-items:center;gap:14px;}
.result-banner.safe{background:var(--green-lt);border:1px solid var(--green-mid);}
.result-banner.danger{background:var(--red-lt);border:1px solid var(--red-md);}
.result-banner.warn{background:var(--amber-lt);border:1px solid var(--amber-md);}
.result-banner.unknown{background:var(--paper2);border:1px solid var(--border2);}
.rb-icon{font-size:34px;flex-shrink:0;}
.rb-title{font-size:18px;font-weight:800;letter-spacing:-.3px;}
.rb-title.safe{color:var(--green);}.rb-title.danger{color:var(--red);}.rb-title.warn{color:var(--amber);}.rb-title.unknown{color:var(--muted2);}
.rb-sub{font-size:11.5px;color:var(--muted);margin-top:3px;font-weight:500;}
.flag{display:flex;align-items:center;gap:8px;padding:8px 11px;border-radius:8px;font-size:12.5px;font-weight:600;margin-bottom:6px;}
.flag.bad{background:var(--red-lt);color:var(--red);}
.flag.maybe{background:var(--amber-lt);color:var(--amber);}
.flag.good{background:var(--green-lt);color:var(--green);}
.ing-toggle{display:flex;align-items:center;justify-content:space-between;padding:10px 0;cursor:pointer;font-size:12.5px;font-weight:700;color:var(--muted2);border-top:1px solid var(--border);margin-top:10px;}
.ing-toggle:hover{color:var(--ink);}
.ing-text{font-size:11.5px;color:var(--muted2);line-height:1.75;padding:8px 0;max-height:100px;overflow-y:auto;}

/* ── SEARCH ── */
.filter-chip{padding:5px 12px;border-radius:100px;border:1.5px solid var(--border2);background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted2);}
.filter-chip:hover{border-color:var(--ink3);color:var(--ink);}
.filter-chip.active{border-color:var(--green);background:var(--green-lt);color:var(--ink);}
.product-card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:13px;margin-bottom:8px;box-shadow:var(--sh);display:flex;align-items:center;gap:11px;}
.product-card:hover{border-color:var(--border2);box-shadow:var(--sh2);}
.product-emoji{width:44px;height:44px;background:var(--paper2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;border:1px solid var(--border);}
.product-name{font-size:13.5px;font-weight:700;letter-spacing:-.1px;}
.product-brand{font-size:11.5px;color:var(--muted);margin-top:2px;}
.verified-pill{display:inline-flex;align-items:center;padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;margin-top:4px;letter-spacing:.2px;}

/* ── LIST ── */
.list-item{display:flex;align-items:center;gap:11px;padding:11px 13px;background:#fff;border:1px solid var(--border);border-radius:11px;margin-bottom:7px;box-shadow:var(--sh);}
.list-item.done{opacity:.4;}
.list-check{width:20px;height:20px;border-radius:6px;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .18s;font-size:11px;color:#fff;}
.list-check.checked{background:var(--green);border-color:var(--green);}
.list-name{font-size:14px;font-weight:600;flex:1;letter-spacing:-.1px;}
.list-name.done{text-decoration:line-through;color:var(--muted);}
.list-del{font-size:15px;cursor:pointer;opacity:.2;padding:4px;transition:opacity .15s;}.list-del:hover{opacity:.6;}
.list-section{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin:14px 0 7px;}

/* ── PROFILE ── */
.profile-hero{background:var(--ink);border-radius:16px;padding:20px 18px;margin:16px 0 12px;display:flex;align-items:center;gap:14px;}
.pa-lg{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:var(--ink);background:var(--paper);flex-shrink:0;}
.profile-hero-name{font-size:18px;font-weight:800;color:var(--paper);letter-spacing:-.4px;}
.profile-hero-sub{font-size:11.5px;color:rgba(250,250,247,.45);margin-top:3px;font-weight:500;}
.profile-edit-btn{margin-left:auto;background:rgba(250,250,247,.08);border:1px solid rgba(250,250,247,.12);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;color:var(--paper);cursor:pointer;font-family:var(--f);transition:all .15s;}
.profile-edit-btn:hover{background:rgba(250,250,247,.14);}
.stat3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;text-align:center;}
.stat3-item{background:var(--paper2);border-radius:10px;padding:12px 8px;border:1px solid var(--border);}
.stat3-num{font-size:20px;font-weight:800;letter-spacing:-.3px;}
.stat3-lbl{font-size:10.5px;color:var(--muted);font-weight:600;margin-top:3px;letter-spacing:.2px;}

/* ── FAMILY ── */
.family-member{background:#fff;border:1px solid var(--border);border-radius:12px;padding:13px 15px;margin-bottom:9px;box-shadow:var(--sh);}
.fm-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0;}
.ap-chip{display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:100px;border:1.5px solid var(--border2);background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted2);}
.ap-chip:hover{border-color:var(--ink3);color:var(--ink);}
.ap-chip.on{border-color:var(--green);background:var(--green-lt);color:var(--ink);}

/* ── HISTORY ── */
.hist-row{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:opacity .1s;}
.hist-row:hover{opacity:.75;}
.hist-row:last-child{border-bottom:none;}
.hist-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.hist-dot.safe{background:var(--green);}.hist-dot.danger{background:var(--red);}.hist-dot.warn,.hist-dot.warning{background:var(--amber);}.hist-dot.not_found{background:var(--muted);}
.hist-info{flex:1;min-width:0;}
.hist-name{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.1px;}
.hist-time{font-size:11px;color:var(--muted);margin-top:1px;font-weight:500;}

/* ── UTILS ── */
.loader{display:flex;flex-direction:column;align-items:center;gap:10px;padding:28px;background:#fff;border-radius:12px;box-shadow:var(--sh);margin-bottom:10px;}
.spinner{width:32px;height:32px;border:2.5px solid var(--border2);border-top-color:var(--green);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.loader-txt{font-size:13.5px;font-weight:700;color:var(--ink);letter-spacing:-.1px;}
.loader-sub{font-size:11.5px;color:var(--muted);}
.error-box{background:var(--red-lt);border:1px solid var(--red-md);border-radius:10px;padding:11px 14px;font-size:12.5px;color:var(--red);font-weight:600;margin-bottom:10px;display:flex;align-items:flex-start;gap:8px;}
.info-box{background:var(--blue-lt);border:1px solid rgba(37,99,235,.2);border-radius:10px;padding:11px 14px;font-size:12.5px;color:var(--blue);font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.warn-box{background:var(--amber-lt);border:1px solid var(--amber-md);border-radius:10px;padding:11px 14px;font-size:12.5px;color:var(--amber);font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.share-bar{display:flex;gap:8px;padding:11px 13px;background:var(--blue-lt);border-radius:10px;margin-bottom:10px;align-items:center;border:1px solid rgba(37,99,235,.12);}
.share-txt{flex:1;font-size:12.5px;color:var(--blue);font-weight:600;}
.empty-state{text-align:center;padding:52px 20px;color:var(--muted);}
.empty-icon{font-size:40px;margin-bottom:12px;display:block;filter:grayscale(1);opacity:.4;}
.empty-txt{font-size:15px;font-weight:700;color:var(--ink2);letter-spacing:-.2px;}
.empty-sub{font-size:13px;margin-top:5px;color:var(--muted);font-weight:500;}
.demo-code{padding:4px 10px;background:#fff;border:1px solid var(--border2);border-radius:7px;font-size:12px;font-weight:700;color:var(--ink2);cursor:pointer;transition:all .15s;display:inline-block;margin:3px;font-family:monospace;}
.demo-code:hover{border-color:var(--green);color:var(--green);background:var(--green-lt);}
.screen-title{font-size:21px;font-weight:800;color:var(--ink);margin:20px 0 3px;letter-spacing:-.4px;}
.screen-sub{font-size:13px;color:var(--muted2);margin-bottom:16px;line-height:1.5;font-weight:500;}
.tab-row{display:flex;gap:3px;background:var(--paper2);border-radius:10px;padding:3px;margin-bottom:14px;border:1px solid var(--border);}
.tab{flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;color:var(--muted2);transition:all .15s;}
.tab.active{background:#fff;color:var(--ink);box-shadow:var(--sh);}
#qr-reader{width:100%!important;border:none!important;}
#qr-reader video{border-radius:0!important;}
#qr-reader__dashboard{display:none!important;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.fade-in{animation:fadeUp .18s ease both;}
`;

// ─── HOVED KOMPONENT ─────────────────────────────────────────────────────────
export default function AllergiScan() {
  // Auth state
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("as_token") || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("as_refresh") || null);
  const [userId, setUserId] = useState(() => localStorage.getItem("as_user_id") || null);

  // UI state
  const [screen, setScreen] = useState(accessToken ? SCREENS.HOME : SCREENS.WELCOME);
  const [onboardStep, setOnboardStep] = useState(1);
  const [editMode, setEditMode] = useState(false);

  // User data
  const [user, setUser] = useState({ name:"", age:"", email:"", phone:"", password:"" });
  const [allergens, setAllergens] = useState([]);
  const [customAllerg, setCustomAllerg] = useState([]);
  const [family, setFamily] = useState([]);
  const [activeProfiles, setActiveProfiles] = useState(["me"]);

  // Scan state
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [showIng, setShowIng] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const qrRef = useRef(null);
  const html5QrRef = useRef(null);

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Shopping list
  const [shoppingList, setShoppingList] = useState([]);
  const [shoppingListId, setShoppingListId] = useState(null);
  const [newItemName, setNewItemName] = useState("");

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSafeOnly, setShowSafeOnly] = useState(false);

  // Family form
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAllerg, setNewMemberAllerg] = useState([]);
  const [customInput, setCustomInput] = useState("");

  // Auth form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authTab, setAuthTab] = useState("login"); // login | signup

  // NOT FOUND flow
  const [notFoundEan, setNotFoundEan] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [proposedFlags, setProposedFlags] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── TOKEN HELPERS ──────────────────────────────────────────────────────────
  const saveTokens = useCallback((access, refresh, uid) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setUserId(uid);
    localStorage.setItem("as_token", access);
    localStorage.setItem("as_refresh", refresh);
    localStorage.setItem("as_user_id", uid);
  }, []);

  const clearAuth = useCallback(() => {
    setAccessToken(null); setRefreshToken(null); setUserId(null);
    localStorage.removeItem("as_token");
    localStorage.removeItem("as_refresh");
    localStorage.removeItem("as_user_id");
    setUser({ name:"", age:"", email:"", phone:"", password:"" });
    setAllergens([]); setCustomAllerg([]); setFamily([]); setHistory([]); setShoppingList([]);
    setScreen(SCREENS.WELCOME);
  }, []);

  // Auto-refresh token every 45 minutes
  useEffect(() => {
    if (!refreshToken) return;
    const refresh = async () => {
      try {
        const data = await apiCall(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: makeHeaders(null),
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (data.access_token) saveTokens(data.access_token, data.refresh_token, data.user?.id);
      } catch { /* silent */ }
    };
    const interval = setInterval(refresh, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshToken, saveTokens]);

  // ── LOAD USER DATA PÅ LOGIN ────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !userId) return;
    loadUserProfile();
    loadAllergens();
    loadFamily();
    loadHistory();
    loadShoppingList();
  }, [accessToken, userId]);

  const loadUserProfile = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
        headers: { ...makeHeaders(accessToken), "Accept": "application/json" },
      });
      if (data[0]) setUser(u => ({ ...u, ...data[0] }));
    } catch { /* silent */ }
  };

  const loadAllergens = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}&select=*`, {
        headers: { ...makeHeaders(accessToken), "Accept": "application/json" },
      });
      const standard = data.filter(a => a.type === "allergen").map(a => a.allergen);
      const custom = data.filter(a => a.type === "custom").map(a => a.allergen);
      setAllergens(standard);
      setCustomAllerg(custom);
    } catch { /* silent */ }
  };

  const loadFamily = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/family?user_id=${userId}`, {
        headers: makeHeaders(accessToken),
      });
      if (data.success && data.families) {
        const members = data.families.flatMap(f =>
          (f.managed_members || []).map(m => ({
            id: m.id,
            name: m.name,
            color: m.color || AVATAR_COLORS[0],
            allergens: m.allergens || [],
            custom: m.custom_allergens || [],
          }))
        );
        setFamily(members);
      }
    } catch { /* silent */ }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/history?user_id=${userId}&limit=50&offset=0`, {
        headers: makeHeaders(accessToken),
      });
      if (data.success && data.scans) setHistory(data.scans);
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  };

  const loadShoppingList = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/shopping?user_id=${userId}`, {
        headers: makeHeaders(accessToken),
      });
      if (data.success && data.lists && data.lists.length > 0) {
        const list = data.lists[0];
        setShoppingListId(list.id);
        setShoppingList(list.items || []);
      } else {
        // Opret en standardliste
        const newList = await apiCall(`${SUPABASE_URL}/functions/v1/shopping`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ owner_id: userId, name: "Min indkøbsliste", type: "personal" }),
        });
        if (newList.success) { setShoppingListId(newList.list?.id); setShoppingList([]); }
      }
    } catch { /* silent */ }
  };

  // ── AUTH ───────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return;
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const text = await res.text();
      // Tjek for allowlist-fejl (returneres som plain text, ikke JSON)
      if (text === "Host not in allowlist") {
        setAuthError("⚙️ Supabase er ikke konfigureret til dette domæne. Jan skal tilføje denne sides URL i Supabase → Authentication → URL Configuration → Allowed Origins.");
        setAuthLoading(false); return;
      }
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error_description || data.message || "Login fejlede");
      saveTokens(data.access_token, data.refresh_token, data.user.id);
      setScreen(SCREENS.HOME);
    } catch (e) {
      if (e.message?.includes("allowlist") || e.message?.includes("Host")) {
        setAuthError("⚙️ Supabase er ikke konfigureret til dette domæne. Jan skal tilføje URL'en i Supabase → Authentication → URL Configuration.");
      } else {
        setAuthError("Forkert email eller kodeord. Prøv igen. (" + (e.message||"") + ")");
      }
    }
    setAuthLoading(false);
  };

  const handleSignup = async () => {
    if (!loginEmail || !loginPassword) return;
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const text = await res.text();
      if (text === "Host not in allowlist") {
        setAuthError("⚙️ Supabase er ikke konfigureret til dette domæne. Jan skal tilføje denne sides URL i Supabase → Authentication → URL Configuration → Allowed Origins.");
        setAuthLoading(false); return;
      }
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error_description || data.message || "Oprettelse fejlede");
      if (data.access_token) {
        saveTokens(data.access_token, data.refresh_token, data.user.id);
        setUser(u => ({ ...u, email: loginEmail }));
        setScreen(SCREENS.ONBOARD);
        setOnboardStep(1);
      } else {
        setAuthError("Tjek din email for bekræftelse — eller prøv at logge ind.");
      }
    } catch (e) {
      setAuthError(e.message || "Oprettelse fejlede. Prøv igen.");
    }
    setAuthLoading(false);
  };

  // ── ONBOARDING GEM ─────────────────────────────────────────────────────────
  const saveProfileStep1 = async () => {
    if (!(user.name || "").trim()) return;
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
        body: JSON.stringify({ name: user.name, phone: user.phone || null, age: user.age ? parseInt(user.age) : null }),
      });
    } catch { /* silent */ }
    setOnboardStep(2);
  };

  const saveAllergensStep2 = async () => {
    try {
      // Slet alle eksisterende, gem nye
      await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, {
        method: "DELETE",
        headers: makeHeaders(accessToken),
      });
      for (const a of allergens) {
        await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ user_id: userId, allergen: a, type: "allergen" }),
        });
      }
      for (const c of customAllerg) {
        await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ user_id: userId, allergen: c, type: "custom" }),
        });
      }
    } catch { /* silent */ }
    setOnboardStep(3);
  };

  const finishOnboard = () => { setScreen(SCREENS.HOME); setEditMode(false); };

  // ── SCANNING ───────────────────────────────────────────────────────────────
  const allActive = useCallback(() => {
    const ids = new Set(allergens);
    family.filter(m => activeProfiles.includes(m.id)).forEach(m => m.allergens.forEach(a => ids.add(a)));
    return { ids: [...ids], custom: [...customAllerg] };
  }, [allergens, customAllerg, family, activeProfiles]);

  const startCamera = async () => {
    if (cameraActive) return;
    setScanError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      const videoEl = document.getElementById("qr-video");
      if (videoEl) {
        videoEl.srcObject = stream;
        await videoEl.play();
      }
      html5QrRef.current = stream;
      setCameraActive(true);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const scan = async () => {
        if (!html5QrRef.current) return;
        if (videoEl && videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
          canvas.width = videoEl.videoWidth;
          canvas.height = videoEl.videoHeight;
          ctx.drawImage(videoEl, 0, 0);
          try {
            const { BarcodeDetector } = window;
            if (BarcodeDetector) {
              const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
              const barcodes = await detector.detect(canvas);
              if (barcodes.length > 0) {
                stopCamera();
                lookupProduct(barcodes[0].rawValue);
                return;
              }
            }
          } catch {}
        }
        requestAnimationFrame(scan);
      };
      requestAnimationFrame(scan);
    } catch (e) {
      if (e.name === "NotAllowedError") {
        setScanError("Kamera-adgang nægtet. Tillad kamera i din browsers indstillinger og prøv igen.");
      } else if (e.name === "NotFoundError") {
        setScanError("Intet kamera fundet på denne enhed.");
      } else {
        setScanError("Kamera ikke tilgængeligt. Brug manuel stregkode nedenfor.");
      }
    }
  };

  const stopCamera = () => {
    if (html5QrRef.current) {
      const tracks = html5QrRef.current.getTracks ? html5QrRef.current.getTracks() : [];
      tracks.forEach(t => t.stop());
      html5QrRef.current = null;
    }
    const videoEl = document.getElementById("qr-video");
    if (videoEl) videoEl.srcObject = null;
    setCameraActive(false);
  };

  useEffect(() => {
    if (screen !== SCREENS.SCAN) stopCamera();
  }, [screen]);

  const { ids: activeIds } = allActive();

  const lookupProduct = useCallback(async (ean) => {
    if (!ean?.trim()) return;
    setLoading(true); setScanResult(null); setScanError(""); setShowIng(false);
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/products/${ean.trim()}`, {
        headers: makeHeaders(accessToken),
      });

      if (!data.found) {
        // Produkt ikke fundet
        setNotFoundEan(ean.trim());
        await saveHistoryEntry(ean.trim(), null, "not_found", {});
        setLoading(false);
        setScreen(SCREENS.NOTFOUND);
        return;
      }

      const product = data.product;
      const flags = product.allergen_flags || {};
      const { status, matchedDanger, matchedWarning, hasUnknown } = compareAllergens(flags, activeIds);

      const flagList = [
        ...matchedDanger.map(id => ({ type:"bad", text:`Indeholder ${ALLERGENS.find(a=>a.id===id)?.label||id}` })),
        ...matchedWarning.map(id => ({ type:"maybe", text:`Kan indeholde spor af ${ALLERGENS.find(a=>a.id===id)?.label||id}` })),
        ...(hasUnknown ? [{ type:"maybe", text:"Visse allergener er ukendte — tjek altid pakken" }] : []),
        ...(matchedDanger.length===0 && matchedWarning.length===0 && !hasUnknown ? [{ type:"good", text:"Ingen af dine allergener fundet" }] : []),
      ];

      const headlines = { safe:"Sikkert produkt ✅", danger:"Indeholder allergen! 🚫", warn:"Mulige spor ⚠️" };
      const summaries = {
        safe:"Ingen af dine registrerede allergener er fundet i dette produkt.",
        danger:`Produktet indeholder ${matchedDanger.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id).join(", ")}.`,
        warn:`Produktet kan indeholde spor af ${matchedWarning.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id).join(", ")}.`,
      };

      const result = {
        code: ean.trim(),
        name: product.name || "Ukendt produkt",
        brand: product.brand || "",
        ingredients: product.ingredients?.raw_text || "",
        status,
        headline: headlines[status],
        summary: summaries[status],
        flags: flagList,
        source: data.source,
        hasUnknown,
        timestamp: Date.now(),
      };

      setScanResult(result);
      setHistory(h => [result, ...h].slice(0, 50));
      await saveHistoryEntry(ean.trim(), product.id, status, flags);
      setScreen(SCREENS.RESULT);
    } catch (e) {
      setScanError("Der opstod en fejl. Tjek din forbindelse og prøv igen.");
    }
    setLoading(false);
  }, [accessToken, activeIds]);

  const saveHistoryEntry = async (ean, productId, result, flags) => {
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/history`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          user_id: userId,
          ean_scanned: ean,
          product_id: productId || null,
          result,
          flags_triggered: flags,
          active_profiles: activeProfiles,
        }),
      });
    } catch { /* silent */ }
  };

  // ── OCR FLOW ───────────────────────────────────────────────────────────────
  const handleImageCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ image_base64: base64 }),
      });
      if (ocrData.success) {
        setOcrText(ocrData.text);
        // Kør allergenanalyse
        const allergenData = await apiCall(`${SUPABASE_URL}/functions/v1/allergens`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ text: ocrData.text }),
        });
        if (allergenData.success) setProposedFlags(allergenData.allergen_flags);
      }
    } catch { setScanError("Billedet kunne ikke analyseres. Prøv igen."); }
    setOcrLoading(false);
  };

  const submitProduct = async () => {
    setSubmitting(true);
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          ean: notFoundEan,
          submitted_by: userId,
          ocr_raw_text: ocrText,
          ai_parsed_data: proposedFlags,
          user_confirmed: true,
        }),
      });
      setScreen(SCREENS.SUBMITTED);
    } catch { setScanError("Indsendelse fejlede. Prøv igen."); }
    setSubmitting(false);
  };

  // ── INDKØBSLISTE ───────────────────────────────────────────────────────────
  const addToList = async (name) => {
    if (!name?.trim()) return;
    const tempId = uid();
    const newItem = { id: tempId, name: name.trim(), checked: false };
    setShoppingList(l => [...l, newItem]);
    setNewItemName("");
    try {
      if (shoppingListId) {
        const data = await apiCall(`${SUPABASE_URL}/functions/v1/shopping/${shoppingListId}/items`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ name: name.trim(), quantity: 1, added_by: userId }),
        });
        if (data.item?.id) setShoppingList(l => l.map(i => i.id === tempId ? { ...i, id: data.item.id } : i));
      }
    } catch { /* silent — keep optimistic update */ }
  };

  const toggleItem = async (id) => {
    const item = shoppingList.find(i => i.id === id);
    setShoppingList(l => l.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    try {
      if (shoppingListId) {
        await apiCall(`${SUPABASE_URL}/functions/v1/shopping/${shoppingListId}/items/${id}`, {
          method: "PATCH",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ checked: !item?.checked }),
        });
      }
    } catch { /* silent */ }
  };

  const removeItem = async (id) => {
    setShoppingList(l => l.filter(i => i.id !== id));
    try {
      if (shoppingListId) {
        await apiCall(`${SUPABASE_URL}/functions/v1/shopping/${shoppingListId}/items/${id}`, {
          method: "DELETE",
          headers: makeHeaders(accessToken),
        });
      }
    } catch { /* silent */ }
  };

  const clearDone = () => shoppingList.filter(i => i.checked).forEach(i => removeItem(i.id));

  // ── FAMILIE ────────────────────────────────────────────────────────────────
  const addMember = async () => {
    if (!newMemberName.trim()) return;
    const color = AVATAR_COLORS[family.length % AVATAR_COLORS.length];
    const tempMember = { id: uid(), name: newMemberName.trim(), allergens: newMemberAllerg, custom: [], color };
    setFamily(f => [...f, tempMember]);
    setNewMemberName(""); setNewMemberAllerg([]);
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/family/members`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ user_id: userId, name: tempMember.name, color }),
      });
      if (data.member?.id) setFamily(f => f.map(m => m.id === tempMember.id ? { ...m, id: data.member.id } : m));
    } catch { /* silent */ }
  };

  const removeMember = async (id) => {
    setFamily(f => f.filter(m => m.id !== id));
    setActiveProfiles(a => a.filter(x => x !== id));
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/family/members/${id}`, {
        method: "DELETE",
        headers: makeHeaders(accessToken),
      });
    } catch { /* silent */ }
  };

  // ── SØGNING ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim() || !accessToken) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await apiCall(
          `${SUPABASE_URL}/rest/v1/products?or=(name.ilike.*${encodeURIComponent(searchQuery)}*,brand.ilike.*${encodeURIComponent(searchQuery)}*)&select=id,name,brand,category,verified_status&limit=20`,
          { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
        );
        setSearchResults(Array.isArray(data) ? data.map(p => ({
          ...p,
          emoji: "🍽️",
          allergens: [],
          verified: p.verified_status,
          conflicts: [],
        })) : []);
      } catch { setSearchResults([]); }
      setSearchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, accessToken]);

  // ── HJÆLPEKOMPONENTER ──────────────────────────────────────────────────────
  const isOnboard = screen === SCREENS.WELCOME || screen === SCREENS.LOGIN || screen === SCREENS.ONBOARD || editMode;

  const FamilyChips = () => {
    const allIds = ["me", ...family.map(m => m.id)];
    const isAll = allIds.every(id => activeProfiles.includes(id));
    const toggleAll = () => setActiveProfiles(isAll ? ["me"] : allIds);
    const toggleOne = (id) => {
      if (isAll) { setActiveProfiles([id]); return; }
      const next = activeProfiles.includes(id) ? activeProfiles.filter(x => x !== id) : [...activeProfiles, id];
      setActiveProfiles(next.length === 0 ? [id] : next);
    };
    return (
      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
        <div className={`ap-chip${isAll?" on":""}`} onClick={toggleAll}>👨‍👩‍👧 Hele familien</div>
        <div className={`ap-chip${!isAll&&activeProfiles.includes("me")?" on":""}`} onClick={() => toggleOne("me")}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"var(--green)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(user.name||"Mig")}</div>
          {(user.name||"Mig").split(" ")[0]}
        </div>
        {family.map(m => (
          <div key={m.id} className={`ap-chip${!isAll&&activeProfiles.includes(m.id)?" on":""}`} onClick={() => toggleOne(m.id)}>
            <div style={{width:20,height:20,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(m.name)}</div>
            {m.name.split(" ")[0]}
          </div>
        ))}
      </div>
    );
  };

  const StepBar = ({ total, current }) => (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:22 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`step-seg${i <= current-1 ? " done" : ""}`} />
      ))}
      <span className="step-num">{current}/{total}</span>
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour<5?"God nat":hour<10?"God morgen":hour<12?"God formiddag":hour<17?"God dag":hour<22?"God aften":"God nat";

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* ══ VELKOMST ══ */}
        {screen === SCREENS.WELCOME && (
          <div className="welcome-screen fade-in">
            <div className="welcome-shield" style={{background:"none",border:"none",padding:0}}><AllergiScanLogo size={80} variant="light" /></div>
            <h1 className="welcome-title">Spis trygt med<br /><span>Allergi Scan</span></h1>
            <p className="welcome-sub">Din personlige allergiguide. Skan stregkoder og få øjeblikkeligt svar om produktet er sikkert for dig.</p>
            <div className="welcome-features">
              {[["📷","Skan på sekunder","Hold kameraet over stregkoden og få svar med det samme"],
                ["👨‍👩‍👧","Hele familien","Administrér allergiprofiler for alle i familien på ét sted"],
                ["🛒","Smarte indkøbslister","Delte lister med allergencheck for hele familien"]
              ].map(([icon,title,text]) => (
                <div key={title} className="welcome-feat">
                  <div className="welcome-feat-icon">{icon}</div>
                  <div className="welcome-feat-text"><strong>{title}</strong><br />{text}</div>
                </div>
              ))}
            </div>
            <button className="welcome-btn" onClick={() => setScreen(SCREENS.LOGIN)}>Opret konto →</button>
            <button className="welcome-btn-ghost" onClick={() => { setAuthTab("login"); setScreen(SCREENS.LOGIN); }}>Log ind</button>
          </div>
        )}

        {/* ══ LOGIN / REGISTRERING ══ */}
        {screen === SCREENS.LOGIN && (
          <div className="login-wrap fade-in">
            <div className="login-header">
              <div className="login-shield" style={{background:"none",padding:0,width:64,height:64}}><AllergiScanLogo size={64} variant="light" /></div>
              <div className="login-title">Allergi <span style={{color:"#22C55E",fontStyle:"italic"}}>Scan</span></div>
              <div className="login-sub">{authTab === "login" ? "Log ind på din konto" : "Opret en ny konto"}</div>
            </div>
            <div className="tab-row">
              <div className={`tab${authTab==="login"?" active":""}`} onClick={() => { setAuthTab("login"); setAuthError(""); }}>Log ind</div>
              <div className={`tab${authTab==="signup"?" active":""}`} onClick={() => { setAuthTab("signup"); setAuthError(""); }}>Opret konto</div>
            </div>
            <div className="card">
              <label className="field-lbl">Email</label>
              <input className="field" type="email" placeholder="din@email.dk" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={{ marginBottom:12 }} onKeyDown={e => e.key==="Enter" && (authTab==="login"?handleLogin():handleSignup())} />
              <label className="field-lbl">Kodeord</label>
              <input className="field" type="password" placeholder="Minimum 8 tegn" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && (authTab==="login"?handleLogin():handleSignup())} />
            </div>
            {authError && (
              <div className="error-box" style={{ flexDirection:"column", alignItems:"flex-start", gap:4 }}>
                <span style={{ fontWeight:800 }}>⚠️ {authError.startsWith("Opsætning") || authError.includes("Supabase") ? "Opsætningsfejl" : "Login fejlede"}</span>
                <span style={{ fontWeight:500, fontSize:12, lineHeight:1.5 }}>{authError}</span>
              </div>
            )}
            <button className="btn btn-primary btn-full" onClick={authTab==="login"?handleLogin:handleSignup} disabled={authLoading}>
              {authLoading ? "Vent…" : authTab==="login" ? "Log ind →" : "Opret konto →"}
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"14px 0 4px" }}>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
              <span style={{ fontSize:12, color:"var(--muted)", fontWeight:600 }}>eller</span>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
            </div>
            <button className="btn btn-ghost btn-full" onClick={() => {
              setUser({ name:"Bjørn", age:"", email:"bjorn@preview.dk", phone:"" });
              setAllergens(["gluten"]);
              setFamily([{id:"f1",name:"Frederikke",allergens:["laktose"],custom:[],color:"#74c69d"},{id:"f2",name:"Tage",allergens:["jordnoedder"],custom:[],color:"#40916c"}]);
              setHistory([
                {code:"3017620422003",name:"Nutella",brand:"Ferrero",status:"danger",result:"danger",headline:"Indeholder nødder!",summary:"Produktet indeholder hasselnødder.",flags:[{type:"bad",text:"Indeholder hasselnødder"}],timestamp:Date.now()-180000,scanned_at:new Date(Date.now()-180000).toISOString()},
                {code:"5449000054227",name:"Coca-Cola",brand:"Coca-Cola",status:"safe",result:"safe",headline:"Sikkert produkt",summary:"Ingen allergener fundet.",flags:[{type:"good",text:"Ingen kendte allergener"}],timestamp:Date.now()-7200000,scanned_at:new Date(Date.now()-7200000).toISOString()},
              ]);
              setShoppingList([{id:"s1",name:"Glutenfri pasta",checked:false},{id:"s2",name:"Havremælk",checked:true}]);
              setScreen(SCREENS.HOME);
            }}>
              🔓 Prøv app uden login (preview)
            </button>
            <button className="btn btn-ghost btn-full" style={{ marginTop:8 }} onClick={() => setScreen(SCREENS.WELCOME)}>← Tilbage</button>
          </div>
        )}

        {/* ══ ONBOARDING ══ */}
        {(screen === SCREENS.ONBOARD || editMode) && (
          <div className="onboard-wrap fade-in">
            {!editMode && (
              <div style={{ textAlign:"center", padding:"4px 0 20px" }}>
                <div style={{ marginBottom:6 }}><AllergiScanLogo size={40} variant="light" /></div>
                <div style={{ fontSize:20, fontWeight:800, color:"var(--text)" }}>Opsæt din profil</div>
                <div style={{ fontSize:13, color:"var(--muted)", marginTop:4 }}>Tager under 2 minutter</div>
              </div>
            )}
            {editMode && <div style={{ height:4 }} />}
            <StepBar total={4} current={onboardStep} />

            {onboardStep === 1 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">👤 Din profil</div>
                  <div className="step-sub">Fortæl os lidt om dig.</div>
                  {[["Dit fulde navn *","text","Fx. Anna Hansen","name"],["Telefon","tel","+45 12 34 56 78","phone"],["Alder","number","Fx. 32","age"]].map(([lbl,type,ph,key]) => (
                    <div key={key} style={{ marginBottom:10 }}>
                      <label className="field-lbl">{lbl}</label>
                      <input className="field" type={type} placeholder={ph} value={user[key]||""} onChange={e => setUser(u => ({ ...u, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary btn-full" onClick={saveProfileStep1}>Fortsæt →</button>
                {!(user.name||"").trim() && <div style={{ fontSize:12,color:"var(--muted)",textAlign:"center",marginTop:8 }}>Navn er påkrævet</div>}
              </div>
            )}

            {onboardStep === 2 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">🌾 Dine allergier</div>
                  <div className="step-sub">Vælg dine allergener. Kan ændres senere.</div>
                  <div className="chip-grid">
                    {ALLERGENS.map(a => { const on = allergens.includes(a.id); return (
                      <div key={a.id} className={`chip${on?" on":""}`} onClick={() => setAllergens(p => on ? p.filter(x => x !== a.id) : [...p, a.id])}>
                        <span>{a.emoji}</span><span style={{ flex:1 }}>{a.label}</span>{on && <div className="chip-check">✓</div>}
                      </div>
                    );})}
                  </div>
                </div>
                <div className="card">
                  <div className="card-lbl">Andre intoleranser</div>
                  <div className="input-row" style={{ marginBottom: customAllerg.length ? 10 : 0 }}>
                    <input className="field" placeholder="Fx. Fructose…" value={customInput} onChange={e => setCustomInput(e.target.value)}
                      onKeyDown={e => { if (e.key==="Enter"&&customInput.trim()) { setCustomAllerg(c => [...c, customInput.trim()]); setCustomInput(""); }}} />
                    <button className="btn btn-outline btn-sm" onClick={() => { if (customInput.trim()) { setCustomAllerg(c => [...c, customInput.trim()]); setCustomInput(""); }}}>+</button>
                  </div>
                  {customAllerg.length > 0 && <div className="tags">{customAllerg.map((a, i) => <div key={i} className="tag">✏️ {a}<span className="tag-x" onClick={() => setCustomAllerg(c => c.filter((_, j) => j !== i))}>×</span></div>)}</div>}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(1)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={saveAllergensStep2}>Fortsæt →</button>
                </div>
                <div className="onboard-skip">Kan springes over</div>
              </div>
            )}

            {onboardStep === 3 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">👨‍👩‍👧 Familiemedlemmer</div>
                  <div className="step-sub">Tilføj familiemedlemmer med egne allergier. Valgfrit.</div>
                  {family.map(m => (
                    <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                      <div className="fm-avatar" style={{ background:m.color, color:"#fff" }}>{initials(m.name)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:14 }}>{m.name}</div>
                        <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{m.allergens.map(id => ALLERGENS.find(a => a.id === id)?.emoji).join(" ")||"Ingen allergier"}</div>
                      </div>
                      <span style={{ cursor:"pointer", opacity:.4, fontSize:18 }} onClick={() => removeMember(m.id)}>🗑</span>
                    </div>
                  ))}
                  <div className="divider">Tilføj nyt medlem</div>
                  <label className="field-lbl">Navn</label>
                  <input className="field" placeholder="Fx. Mia (8 år)" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} style={{ marginBottom:10 }} />
                  <div className="card-lbl" style={{ marginBottom:8 }}>Allergier</div>
                  <div className="chip-grid" style={{ marginBottom:12 }}>
                    {ALLERGENS.map(a => { const on = newMemberAllerg.includes(a.id); return (
                      <div key={a.id} className={`chip${on?" on":""}`} onClick={() => setNewMemberAllerg(p => on ? p.filter(x => x !== a.id) : [...p, a.id])}>
                        <span>{a.emoji}</span><span style={{ flex:1 }}>{a.label}</span>{on && <div className="chip-check">✓</div>}
                      </div>
                    );})}
                  </div>
                  <button className="btn btn-outline btn-full btn-sm" onClick={addMember}>+ Tilføj {newMemberName||"familiemedlem"}</button>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(2)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setOnboardStep(4)}>Fortsæt →</button>
                </div>
                <div className="onboard-skip">Kan springes over</div>
              </div>
            )}

            {onboardStep === 4 && (
              <div className="fade-in">
                <div className="card" style={{ textAlign:"center", padding:"32px 20px" }}>
                  <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
                  <div style={{ fontSize:22, fontWeight:900, color:"var(--text)", marginBottom:8 }}>Du er klar!</div>
                  <div style={{ fontSize:14, color:"var(--muted)", lineHeight:1.6, marginBottom:20 }}>
                    Profil oprettet med {allergens.length+customAllerg.length} allergi{allergens.length+customAllerg.length!==1?"er":""} og {family.length} familiemedlem{family.length!==1?"mer":""}.
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {allergens.length>0&&<div className="tag" style={{justifyContent:"center"}}>🌾 {allergens.length} allergi{allergens.length!==1?"er":""} valgt</div>}
                    {family.length>0&&<div className="tag" style={{justifyContent:"center"}}>👨‍👩‍👧 {family.length} familiemedlem{family.length!==1?"mer":""}</div>}
                    {allergens.length===0&&family.length===0&&<div style={{fontSize:13,color:"var(--muted)"}}>Du kan tilføje allergier og familiemedlemmer i din profil.</div>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(3)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={finishOnboard}>
                    {editMode ? "Gem ændringer ✓" : "Gå til appen →"}
                  </button>
                </div>
                {editMode && <button className="btn btn-outline btn-full" style={{ marginTop:8 }} onClick={() => { setEditMode(false); setScreen(SCREENS.PROFILE); }}>Annuller</button>}
              </div>
            )}
          </div>
        )}

        {/* TOPBAR */}
        {!isOnboard && (
          <header className="topbar">
            <div className="topbar-logo">
              <div className="topbar-shield" style={{background:"none",padding:0}}><AllergiScanLogo size={34} variant="light" /></div>
              <div className="topbar-name">Allergi <span>Scan</span></div>
            </div>
            <div className="topbar-avatar" onClick={() => setScreen(SCREENS.PROFILE)}>{initials(user.name||"?")}</div>
          </header>
        )}

        {/* ══ HJEM ══ */}
        {screen === SCREENS.HOME && (
          <div className="screen fade-in">
            <div className="greeting">
              <div className="greeting-main">{greeting}, {user.name||"der"} 👋</div>
              <div className="greeting-sub">{activeIds.length>0?`Tjekker for ${activeIds.length} allergen${activeIds.length!==1?"er":""}`:"Ingen aktive allergier — tjek din profil"}</div>
            </div>
            {family.length>0&&(
              <div className="card" style={{ padding:"12px 14px" }}>
                <div className="card-lbl">Tjekker for</div>
                <FamilyChips />
              </div>
            )}
            <div className="scan-hero" onClick={() => setScreen(SCREENS.SCAN)}>
              <div className="scan-hero-icon" style={{width:44,height:44,flexShrink:0}}>
                <svg viewBox="0 0 100 100" width="44" height="44">
                  <g fill="#3d4e5e">
                    <rect x="18" y="16" width="8.31" height="68" rx="1.49"/>
                    <rect x="29.05" y="22" width="4.15" height="56" rx="0.75"/>
                    <rect x="35.94" y="16" width="5.54" height="68" rx="1"/>
                    <rect x="44.21" y="22" width="2.77" height="56" rx="0.5"/>
                    <rect x="49.71" y="16" width="3.32" height="68" rx="0.6"/>
                    <rect x="55.76" y="22" width="6.92" height="56" rx="1.25"/>
                    <rect x="65.41" y="16" width="4.43" height="68" rx="0.8"/>
                    <rect x="72.57" y="22" width="5.54" height="56" rx="1"/>
                    <rect x="80.84" y="16" width="3.88" height="68" rx="0.7"/>
                  </g>
                  <path d="M 20 58 L 70 58 L 76 64 L 86 50" fill="none" stroke="#22C55E" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" style={{filter:"drop-shadow(0 0 3px #22C55E)"}}/>
                </svg>
              </div>
              <div>
                <div className="scan-hero-title">Skan produkt</div>
                <div className="scan-hero-sub">Hold kameraet over stregkoden</div>
              </div>
              <div className="scan-hero-arrow">›</div>
            </div>
            <div className="stat-grid">
              <div className="stat-card"><div className="stat-num">{history.length}</div><div className="stat-lbl">📷 Scanninger</div></div>
              <div className="stat-card"><div className="stat-num">{history.filter(h=>h.result==="safe"||h.status==="safe").length}</div><div className="stat-lbl">✅ Sikre</div></div>
              <div className="stat-card"><div className="stat-num">{history.filter(h=>h.result==="danger"||h.status==="danger").length}</div><div className="stat-lbl">🚫 Farlige</div></div>
              <div className="stat-card"><div className="stat-num">{family.length+1}</div><div className="stat-lbl">👥 Profiler</div></div>
            </div>
            <div className="quick-grid">
              <div className="quick-btn" onClick={() => setScreen(SCREENS.SEARCH)}><span className="quick-icon">🔎</span><span className="quick-label">Søg varer</span></div>
              <div className="quick-btn" onClick={() => setScreen(SCREENS.LIST)}><span className="quick-icon">🛒</span><span className="quick-label">Indkøbsliste</span></div>
              <div className="quick-btn" onClick={() => setScreen(SCREENS.FAMILY)}><span className="quick-icon">👨‍👩‍👧</span><span className="quick-label">Familie</span></div>
              <div className="quick-btn" onClick={() => { loadHistory(); setScreen(SCREENS.HISTORY); }}><span className="quick-icon">📋</span><span className="quick-label">Historik</span></div>
            </div>
            {history.length>0&&(
              <div className="card">
                <div className="card-lbl">Seneste scanninger</div>
                {history.slice(0,5).map((h,i) => {
                  const s = h.result || h.status;
                  const name = h.products?.name || h.name || h.ean_scanned || "Ukendt";
                  return (
                    <div key={i} className="hist-row" onClick={() => { if(h.status||h.result) { setScanResult({...h, code:h.ean_scanned||h.code, name, brand:h.products?.brand||h.brand||"", headline: s==="safe"?"Sikkert produkt":s==="danger"?"Indeholder allergen!":"Mulige spor", flags:[], summary:""}); setScreen(SCREENS.RESULT); }}}>
                      <div className={`hist-dot ${s}`} />
                      <div className="hist-info"><div className="hist-name">{name}</div><div className="hist-time">{timeAgo(h.scanned_at||h.timestamp)}</div></div>
                      <div className={`badge ${s==="safe"?"safe":s==="danger"?"danger":"warn"}`}>{s==="safe"?"Sikker":s==="danger"?"Farlig":s==="not_found"?"Ikke fundet":"Advarsel"}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ SKAN ══ */}
        {screen === SCREENS.SCAN && (
          <div className="screen fade-in">
            <div className="screen-title">📷 Skan produkt</div>
            <div className="screen-sub">Skan stregkoden eller indtast den manuelt.</div>
            <div className="scan-box">
              {cameraActive ? (
                <div>
                  <video id="qr-video" style={{ width:"100%", borderRadius:"8px" }} playsInline muted autoPlay />
                  <div className="scan-bar">
                    <span className="scan-bar-txt">📷 Kamera aktivt — hold stregkoden ind i rammen</span>
                    <button className="btn btn-sm" style={{ background:"rgba(255,255,255,.2)",color:"#fff",border:"none",fontSize:12 }} onClick={stopCamera}>Stop</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="scan-viewfinder" onClick={startCamera}>
                    <div className="scan-corner tl" /><div className="scan-corner tr" />
                    <div className="scan-corner bl" /><div className="scan-corner br" />
                    <div className="scan-laser" />
                    <div className="scan-camera-icon">📷</div>
                    <div className="scan-camera-text">Tryk for at åbne kamera</div>
                  </div>
                  <div className="scan-bar"><span className="scan-bar-txt">📱 Tryk for at starte kamera-scanning</span></div>
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-lbl">Manuel stregkode</div>
              <div className="input-row" style={{ marginBottom:10 }}>
                <input className="field" placeholder="Indtast EAN-kode…" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={e => e.key==="Enter" && lookupProduct(barcodeInput)} />
                <button className="btn btn-primary btn-sm" style={{ whiteSpace:"nowrap" }} onClick={() => lookupProduct(barcodeInput)} disabled={loading}>Søg</button>
              </div>
              <div className="card-lbl">Prøv en demo-kode</div>
              <div style={{ display:"flex", flexWrap:"wrap" }}>
                {DEMO_CODES.map(d => <span key={d.code} className="demo-code" onClick={() => { setBarcodeInput(d.code); lookupProduct(d.code); }}>{d.label}</span>)}
              </div>
            </div>
            {loading && <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Analyserer produkt…</div><div className="loader-sub">Slår op i databasen</div></div>}
            {scanError && !loading && <div className="error-box">⚠️ {scanError}</div>}
            {history.length>0&&!loading&&(
              <div className="card">
                <div className="card-lbl">Seneste scanninger</div>
                {history.slice(0,4).map((h,i) => {
                  const s = h.result||h.status; const name = h.products?.name||h.name||h.ean_scanned||"Ukendt";
                  return (
                    <div key={i} className="hist-row" onClick={() => { setScanResult({...h,code:h.ean_scanned||h.code,name,brand:h.products?.brand||h.brand||"",headline:s==="safe"?"Sikkert produkt":s==="danger"?"Indeholder allergen!":"Mulige spor",flags:[],summary:""}); setScreen(SCREENS.RESULT); }}>
                      <div className={`hist-dot ${s}`} />
                      <div className="hist-info"><div className="hist-name">{name}</div><div className="hist-time">{timeAgo(h.scanned_at||h.timestamp)}</div></div>
                      <div className={`badge ${s==="safe"?"safe":s==="danger"?"danger":"warn"}`}>{s==="safe"?"Sikker":s==="danger"?"Farlig":s==="not_found"?"Ikke fundet":"Advarsel"}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ RESULTAT ══ */}
        {screen === SCREENS.RESULT && scanResult && (
          <div className="screen fade-in">
            <button className="btn btn-ghost btn-sm" style={{ marginTop:16, marginBottom:12 }} onClick={() => setScreen(SCREENS.SCAN)}>← Tilbage til scan</button>
            {scanResult.source === "open_food_facts" && (
              <div className="warn-box">⚠️ Data fra Open Food Facts — ikke verificeret af Allergi Scan</div>
            )}
            <div className={`result-banner ${scanResult.status}`}>
              <div className="rb-icon">{scanResult.status==="safe"?"✅":scanResult.status==="danger"?"🚫":"⚠️"}</div>
              <div>
                <div className={`rb-title ${scanResult.status}`}>{scanResult.headline}</div>
                <div className="rb-sub">Stregkode: {scanResult.code}</div>
              </div>
            </div>
            <div className="card">
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <div style={{ width:50,height:50,background:"var(--surface2)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,border:"1px solid var(--border)",flexShrink:0 }}>
                  {scanResult.status==="safe"?"🟢":scanResult.status==="danger"?"🔴":"🟡"}
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:800 }}>{scanResult.name}</div>
                  {scanResult.brand && <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{scanResult.brand}</div>}
                </div>
              </div>
              {scanResult.flags?.map((f,i) => <div key={i} className={`flag ${f.type}`}><span>{f.type==="bad"?"🚫":f.type==="maybe"?"⚠️":"✓"}</span>{f.text}</div>)}
              {scanResult.summary && <div style={{ fontSize:13, color:"var(--text2)", lineHeight:1.7, marginTop:8 }}>{scanResult.summary}</div>}
              {scanResult.ingredients && (
                <><div className="ing-toggle" onClick={() => setShowIng(v => !v)}><span>Se ingrediensliste</span><span>{showIng?"▲":"▼"}</span></div>
                {showIng && <div className="ing-text">{scanResult.ingredients}</div>}</>
              )}
            </div>
            <div className="card">
              <div className="card-lbl">Handlinger</div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={() => { addToList(scanResult.name); setScreen(SCREENS.LIST); }}>🛒 Tilføj til liste</button>
                <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => { if(navigator.share) navigator.share({title:scanResult.name, text:scanResult.headline}); else alert("Del ikke tilgængeligt"); }}>📤 Del</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ PRODUKT IKKE FUNDET ══ */}
        {screen === SCREENS.NOTFOUND && (
          <div className="screen fade-in">
            <button className="btn btn-ghost btn-sm" style={{ marginTop:16, marginBottom:12 }} onClick={() => setScreen(SCREENS.SCAN)}>← Tilbage</button>
            <div className="card" style={{ textAlign:"center", padding:"28px 20px" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
              <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Produktet blev ikke fundet</div>
              <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>Stregkode: <strong>{notFoundEan}</strong><br />Produktet er ikke i vores database endnu. Du kan hjælpe ved at fotografere ingredienslisten.</div>
            </div>
            {ocrLoading && <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Analyserer billede…</div><div className="loader-sub">OCR og allergendetektering</div></div>}
            {!ocrText && !ocrLoading && (
              <div className="card">
                <div className="card-lbl">Bidrag til databasen</div>
                <div style={{ fontSize:13, color:"var(--muted)", marginBottom:12, lineHeight:1.6 }}>Fotografér ingredienslisten på pakken. Vi bruger AI til at læse den og foreslå allergener.</div>
                <label className="btn btn-primary btn-full" style={{ cursor:"pointer" }}>
                  📸 Fotografér ingredienslisten
                  <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleImageCapture} />
                </label>
              </div>
            )}
            {ocrText && !ocrLoading && (
              <div className="fade-in">
                <div className="card">
                  <div className="card-lbl">OCR-tekst fra billedet</div>
                  <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.7, maxHeight:100, overflowY:"auto" }}>{ocrText}</div>
                </div>
                {proposedFlags && (
                  <div className="card">
                    <div className="card-lbl">Foreslåede allergener</div>
                    <div className="tags">
                      {Object.entries(proposedFlags).filter(([,v]) => v==="yes"||v==="traces").map(([k,v]) => {
                        const a = ALLERGENS.find(x=>x.id===k);
                        return a ? <div key={k} className="tag" style={v==="traces"?{background:"var(--amber-lt)",color:"var(--amber-dk)"}:{}}>{a.emoji} {a.label}{v==="traces"?" (spor)":""}</div> : null;
                      })}
                    </div>
                    {scanError && <div className="error-box" style={{ marginTop:8 }}>⚠️ {scanError}</div>}
                    <button className="btn btn-primary btn-full" style={{ marginTop:12 }} onClick={submitProduct} disabled={submitting}>
                      {submitting ? "Sender…" : "✓ Bekræft og indsend"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ INDSENDELSE BEKRÆFTET ══ */}
        {screen === SCREENS.SUBMITTED && (
          <div className="screen fade-in">
            <div className="card" style={{ textAlign:"center", padding:"40px 24px", marginTop:32 }}>
              <div style={{ fontSize:56, marginBottom:16 }}>🙏</div>
              <div style={{ fontSize:22, fontWeight:900, color:"var(--text)", marginBottom:8 }}>Tak for dit bidrag!</div>
              <div style={{ fontSize:14, color:"var(--muted)", lineHeight:1.7, marginBottom:20 }}>
                Din indsendelse er modtaget og afventer godkendelse af vores team. Når produktet er godkendt, vil det være tilgængeligt for alle brugere.
              </div>
              <div className="info-box" style={{ textAlign:"left" }}>ℹ️ Midlertidigt allergenresultat er baseret på OCR-analysen og er ikke verificeret endnu.</div>
              {proposedFlags && (
                <div style={{ textAlign:"left", marginBottom:16 }}>
                  <div className="card-lbl">Analyserede allergener</div>
                  <div className="tags">
                    {Object.entries(proposedFlags).filter(([,v]) => v==="yes"||v==="traces").map(([k,v]) => {
                      const a = ALLERGENS.find(x=>x.id===k);
                      return a ? <div key={k} className="tag">{a.emoji} {a.label}</div> : null;
                    })}
                    {Object.entries(proposedFlags).filter(([,v]) => v==="yes"||v==="traces").length===0 && <div style={{fontSize:13,color:"var(--muted)"}}>Ingen allergener detekteret</div>}
                  </div>
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-full" onClick={() => { setOcrText(""); setProposedFlags(null); setScreen(SCREENS.HOME); }}>← Tilbage til hjem</button>
          </div>
        )}

        {/* ══ SØG ══ */}
        {screen === SCREENS.SEARCH && (
          <div className="screen fade-in">
            <div className="screen-title">🔎 Søg varer</div>
            <div className="screen-sub">Find produkter der er sikre for dig og familien.</div>
            <input className="field" placeholder="Søg på produkt eller mærke…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ marginBottom:10 }} autoFocus />
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div className={`filter-chip${showSafeOnly?" active":""}`} onClick={() => setShowSafeOnly(v => !v)}>
                {showSafeOnly ? "✅ Kun sikre" : "Vis kun sikre"}
              </div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>{searchResults.length} resultat{searchResults.length!==1?"er":""}</div>
            </div>
            {searchLoading && <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Søger…</div></div>}
            {!searchLoading && searchQuery && searchResults.length===0 && (
              <div className="empty-state"><span className="empty-icon">🔍</span><div className="empty-txt">Ingen resultater</div><div className="empty-sub">Prøv et andet søgeord</div></div>
            )}
            {!searchQuery && (
              <div className="empty-state"><span className="empty-icon">🔎</span><div className="empty-txt">Søg efter et produkt</div><div className="empty-sub">Skriv et produktnavn eller mærke</div></div>
            )}
            {searchResults.filter(p => !showSafeOnly || p.conflicts.length === 0).map(p => {
              const vb = verifiedBadge(p.verified||p.verified_status);
              return (
                <div key={p.id} className="product-card">
                  <div className="product-emoji">{p.emoji||"🍽️"}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="product-name">{p.name}</div>
                    <div className="product-brand">{p.brand}{p.category?` · ${p.category}`:""}</div>
                    <div className="verified-pill" style={{ background:vb.bg, color:vb.color }}>{vb.label}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, flexShrink:0 }}>
                    {p.conflicts.length>0?<div className="badge danger">⚠️ Konflikt</div>:<div className="badge safe">✓ Sikker</div>}
                    <button className="btn btn-ghost btn-sm" style={{ fontSize:11, padding:"5px 9px" }} onClick={() => addToList(p.name)}>+ Liste</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ INDKØBSLISTE ══ */}
        {screen === SCREENS.LIST && (
          <div className="screen fade-in">
            <div className="screen-title">🛒 Indkøbsliste</div>
            <div className="share-bar">
              <span style={{ fontSize:18 }}>🔗</span>
              <span className="share-txt">Del listen med familie via link</span>
              <button className="btn btn-ghost btn-sm" style={{ fontSize:12 }} onClick={() => { navigator.clipboard?.writeText(window.location.href); alert("Link kopieret! 📋"); }}>Kopiér</button>
            </div>
            <div className="card" style={{ padding:"13px 14px", marginBottom:14 }}>
              <div className="card-lbl">Tilføj vare</div>
              <div className="input-row">
                <input className="field" placeholder="Fx. Glutenfri pasta…" value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key==="Enter" && addToList(newItemName)} />
                <button className="btn btn-primary btn-sm" style={{ whiteSpace:"nowrap" }} onClick={() => addToList(newItemName)}>Tilføj</button>
              </div>
            </div>
            {shoppingList.length===0 && <div className="empty-state"><span className="empty-icon">🛒</span><div className="empty-txt">Listen er tom</div><div className="empty-sub">Tilføj din første vare</div></div>}
            {shoppingList.filter(i => !i.checked).length>0 && (
              <><div className="list-section">Mangler ({shoppingList.filter(i=>!i.checked).length})</div>
              {shoppingList.filter(i => !i.checked).map(item => (
                <div key={item.id} className="list-item">
                  <div className="list-check" onClick={() => toggleItem(item.id)} />
                  <div className="list-name">{item.name}</div>
                  <div className="list-del" onClick={() => removeItem(item.id)}>🗑</div>
                </div>
              ))}</>
            )}
            {shoppingList.filter(i => i.checked).length>0 && (
              <><div className="list-section" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>Købt ({shoppingList.filter(i=>i.checked).length})</span>
                <span style={{ cursor:"pointer", color:"var(--red)", fontWeight:700, fontSize:12 }} onClick={clearDone}>Ryd</span>
              </div>
              {shoppingList.filter(i => i.checked).map(item => (
                <div key={item.id} className="list-item done">
                  <div className="list-check checked" onClick={() => toggleItem(item.id)}>✓</div>
                  <div className="list-name done">{item.name}</div>
                  <div className="list-del" onClick={() => removeItem(item.id)}>🗑</div>
                </div>
              ))}</>
            )}
          </div>
        )}

        {/* ══ HISTORIK ══ */}
        {screen === SCREENS.HISTORY && (
          <div className="screen fade-in">
            <div className="screen-title">📋 Scanningshistorik</div>
            <div className="screen-sub">Alle dine tidligere scanninger.</div>
            <button className="btn btn-ghost btn-sm" style={{ marginBottom:14 }} onClick={() => { loadHistory(); }}>🔄 Opdater</button>
            {historyLoading && <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Henter historik…</div></div>}
            {!historyLoading && history.length===0 && (
              <div className="empty-state"><span className="empty-icon">📋</span><div className="empty-txt">Ingen scanninger endnu</div><div className="empty-sub">Skan dit første produkt</div></div>
            )}
            {history.map((h,i) => {
              const s = h.result||h.status;
              const name = h.products?.name||h.name||h.ean_scanned||"Ukendt";
              return (
                <div key={i} className="hist-row" style={{ padding:"12px 0" }} onClick={() => {
                  setScanResult({ code:h.ean_scanned||h.code, name, brand:h.products?.brand||h.brand||"", status:s, headline:s==="safe"?"Sikkert produkt":s==="danger"?"Indeholder allergen!":"Mulige spor", flags:[], summary:"", timestamp:new Date(h.scanned_at||h.timestamp).getTime() });
                  setScreen(SCREENS.RESULT);
                }}>
                  <div className={`hist-dot ${s}`} />
                  <div className="hist-info"><div className="hist-name">{name}</div><div className="hist-time">{timeAgo(h.scanned_at||h.timestamp)}</div></div>
                  <div className={`badge ${s==="safe"?"safe":s==="danger"?"danger":s==="not_found"?"":"warn"}`}>{s==="safe"?"Sikker":s==="danger"?"Farlig":s==="not_found"?"Ikke fundet":"Advarsel"}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ PROFIL ══ */}
        {screen === SCREENS.PROFILE && (
          <div className="screen fade-in">
            <div className="profile-hero">
              <div className="pa-lg">{initials(user.name||"?")}</div>
              <div style={{ flex:1 }}>
                <div className="profile-hero-name">{user.name||"Din profil"}</div>
                <div className="profile-hero-sub">{allergens.length+customAllerg.length} allergi{allergens.length+customAllerg.length!==1?"er":""} · {family.length} familiemedlem{family.length!==1?"mer":""}</div>
              </div>
              <button className="profile-edit-btn" onClick={() => { setEditMode(true); setOnboardStep(1); }}>Rediger</button>
            </div>
            <div className="card">
              <div className="card-lbl" style={{ display:"flex", justifyContent:"space-between" }}>
                <span>Mine allergier</span>
                <span style={{ cursor:"pointer", color:"var(--green)", fontWeight:700, fontSize:11 }} onClick={() => { setEditMode(true); setOnboardStep(2); }}>Rediger</span>
              </div>
              {allergens.length+customAllerg.length===0
                ? <div style={{ fontSize:13, color:"var(--muted)" }}>Ingen registreret — tryk Rediger</div>
                : <div className="tags">{getAllergenLabels(allergens,customAllerg).map((a,i) => <div key={i} className="tag">{a}</div>)}</div>}
            </div>
            <div className="card">
              <div className="card-lbl">Konto</div>
              <div style={{ fontSize:13, color:"var(--muted)", marginBottom:4 }}>Email</div>
              <div style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{user.email||loginEmail||"—"}</div>
            </div>
            <div className="card">
              <div className="card-lbl">Scanningsstatistik</div>
              <div className="stat3">
                {[[history.filter(h=>h.result==="safe"||h.status==="safe").length,"✅","Sikre"],
                  [history.filter(h=>h.result==="warning"||h.status==="warn").length,"⚠️","Advarsler"],
                  [history.filter(h=>h.result==="danger"||h.status==="danger").length,"🚫","Farlige"]
                ].map(([n,ic,lbl]) => (
                  <div key={lbl} className="stat3-item">
                    <div style={{ fontSize:20 }}>{ic}</div>
                    <div className="stat3-num">{n}</div>
                    <div className="stat3-lbl">{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-ghost btn-full" style={{ marginBottom:8 }} onClick={() => { loadHistory(); setScreen(SCREENS.HISTORY); }}>📋 Se fuld historik</button>
            <button className="btn btn-danger btn-full" style={{ marginBottom:8 }} onClick={() => { if(window.confirm("Er du sikker på at du vil slette din konto? Dette kan ikke fortrydes.")) alert("Kontakt support for at slette konto."); }}>Slet konto</button>
            <button className="btn btn-ghost btn-full" style={{ marginBottom:16 }} onClick={clearAuth}>Log ud</button>
          </div>
        )}

        {/* ══ FAMILIE ══ */}
        {screen === SCREENS.FAMILY && (
          <div className="screen fade-in">
            <div className="screen-title">👨‍👩‍👧 Familie</div>
            <div className="screen-sub">Administrér familiemedlemmers allergiprofiler.</div>
            <div className="card" style={{ padding:"12px 14px" }}>
              <div className="card-lbl">Aktive profiler ved scanning</div>
              <FamilyChips />
            </div>
            {family.length===0 && <div className="empty-state"><span className="empty-icon">👨‍👩‍👧</span><div className="empty-txt">Ingen familiemedlemmer endnu</div><div className="empty-sub">Tilføj nedenfor</div></div>}
            {family.map(m => (
              <div key={m.id} className="family-member">
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:m.allergens.length?10:0 }}>
                  <div className="fm-avatar" style={{ background:m.color, color:"#fff" }}>{initials(m.name)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:15 }}>{m.name}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{m.allergens.length} allergi{m.allergens.length!==1?"er":""}</div>
                  </div>
                  <span style={{ cursor:"pointer", opacity:.35, fontSize:18, padding:4 }} onClick={() => removeMember(m.id)}>🗑</span>
                </div>
                {m.allergens.length>0 && <div className="tags">{getAllergenLabels(m.allergens,m.custom||[]).map((a,j) => <div key={j} className="tag" style={{ fontSize:11 }}>{a}</div>)}</div>}
              </div>
            ))}
            <div className="card">
              <div className="card-title">+ Tilføj familiemedlem</div>
              <label className="field-lbl" style={{ marginTop:8 }}>Navn</label>
              <input className="field" placeholder="Fx. Peter (12 år)" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} style={{ marginBottom:12 }} />
              <div className="card-lbl">Allergier</div>
              <div className="chip-grid" style={{ marginBottom:12 }}>
                {ALLERGENS.map(a => { const on = newMemberAllerg.includes(a.id); return (
                  <div key={a.id} className={`chip${on?" on":""}`} onClick={() => setNewMemberAllerg(p => on ? p.filter(x => x !== a.id) : [...p, a.id])}>
                    <span>{a.emoji}</span><span style={{ flex:1 }}>{a.label}</span>{on && <div className="chip-check">✓</div>}
                  </div>
                );})}
              </div>
              <button className="btn btn-primary btn-full" onClick={addMember}>+ Tilføj {newMemberName||"familiemedlem"}</button>
            </div>
          </div>
        )}

        {/* BUNDNAVIGATION */}
        {!isOnboard && (
          <nav className="bottom-nav">
            {[
              [SCREENS.HOME,"🏠","Hjem"],
              [SCREENS.SCAN,"📷","Skan"],
              [SCREENS.SEARCH,"🔎","Søg"],
              [SCREENS.LIST,"🛒","Liste"],
              [SCREENS.FAMILY,"👨‍👩‍👧","Familie"],
            ].map(([s,icon,lbl]) => (
              <div key={s} className={`nav-item${(screen===s||(screen===SCREENS.RESULT&&s===SCREENS.SCAN)||(screen===SCREENS.NOTFOUND&&s===SCREENS.SCAN)||(screen===SCREENS.SUBMITTED&&s===SCREENS.SCAN)||(screen===SCREENS.HISTORY&&s===SCREENS.HOME))?" active":""}`} onClick={() => setScreen(s)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-lbl">{lbl}</div>
              </div>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}