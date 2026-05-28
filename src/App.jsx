// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";

import {
  SUPABASE_URL, SUPABASE_ANON_KEY, ALLERGENS, SCREENS, DIETS,
  AVATAR_COLORS, HOME_TIPS, DEMO_CODES, DUMMY_PRODUCT, MOCK_PRODUCTS,
  ALLERGEN_EXAMPLES, E_NUMBERS, E_CATEGORIES, ALLERGEN_SUBTYPES,
  INCOMPATIBLE_SUBTYPES, MADPAS_LANGUAGES, ALLERGEN_T, MADPAS_INTRO,
  PAGE_IDS, uid
} from "./constants.jsx";

import {
  initials, timeAgo, getAllergenLabels, verifiedBadge,
  makeHeaders, apiCall, compareAllergens
} from "./helpers.js";

import {
  EatSafeLogo, Icon, IngredientsList, ProfileBadges,
  getProductIcon, ProductImage
} from "./SharedComponents.jsx";

import { ENumberPicker, SubtypeModal, AllergyForm } from "./AllergenPicker.jsx";
import { MemberForm, CategorySelect } from "./MemberForm.jsx";
import AdminScreen from './AdminScreen.jsx';
import OnboardingScreen from './OnboardingScreen.jsx';
import MadpasScreen from './MadpasScreen.jsx';
import ProfileScreen from './ProfileScreen.jsx';
import ScannerScreen from './ScannerScreen.jsx';
import RecipesScreen from './RecipesScreen.jsx';

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
.screen{flex:1;padding:0 16px 110px;}
.bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:390px;background:var(--paper);border-top:1px solid var(--border);display:flex;padding:6px 4px 16px;z-index:100;box-shadow:0 -1px 0 var(--border),0 -4px 16px rgba(31,39,51,.06);}
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
.field{width:100%;background:var(--paper2);border:1.5px solid var(--border2);border-radius:10px;padding:11px 14px;color:var(--ink);font-family:var(--f);font-size:16px;outline:none;transition:border-color .15s,background .15s;}
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
.welcome-screen{min-height:100vh;background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 28px;text-align:center;}
.welcome-logo-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:40px;}
.welcome-wordmark{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px;}
.welcome-wordmark-text{font-family:var(--f);font-size:32px;font-weight:800;color:var(--ink);letter-spacing:-.8px;line-height:1;}
.welcome-wordmark-text span{color:var(--green);font-style:italic;font-weight:800;}
.welcome-tagline{font-size:15px;color:var(--muted);margin-top:10px;letter-spacing:.2px;font-weight:400;}
.welcome-divider{width:40px;height:2px;background:var(--border2);border-radius:2px;margin:32px auto;}
.welcome-features{display:flex;flex-direction:column;gap:14px;margin-bottom:44px;width:100%;}
.welcome-feat{display:flex;align-items:center;gap:14px;text-align:left;padding:12px 14px;background:#fff;border:1px solid var(--border);border-radius:12px;}
.welcome-feat-icon{width:38px;height:38px;background:var(--green-lt);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.welcome-feat-text{font-size:13px;color:var(--muted2);font-weight:500;line-height:1.45;}
.welcome-feat-text strong{color:var(--ink);font-weight:700;display:block;margin-bottom:2px;}
.welcome-btn{background:var(--ink);color:var(--paper);border:none;border-radius:12px;padding:15px 32px;font-family:var(--f);font-size:15px;font-weight:700;cursor:pointer;width:100%;transition:all .18s;margin-bottom:10px;letter-spacing:-.1px;box-shadow:0 2px 10px rgba(31,39,51,.15);}
.welcome-btn:hover{background:var(--ink2);transform:translateY(-1px);}
.welcome-btn-ghost{background:transparent;color:var(--ink2);border:1.5px solid var(--border2);border-radius:12px;padding:13px 32px;font-family:var(--f);font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:all .18s;}
.welcome-btn-ghost:hover{background:var(--paper2);}

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
.screen-title{font-size:21px;font-weight:800;color:var(--ink);margin:20px 0 16px;letter-spacing:-.4px;text-align:center;width:100%;}
.screen-sub{font-size:13px;color:var(--muted2);margin-bottom:16px;line-height:1.5;font-weight:500;}
.tab-row{display:flex;gap:3px;background:var(--paper2);border-radius:10px;padding:3px;margin-bottom:14px;border:1px solid var(--border);}
.tab{flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;color:var(--muted2);transition:all .15s;}
.tab.active{background:#fff;color:var(--ink);box-shadow:var(--sh);}
#qr-reader{width:100%!important;border:none!important;min-height:200px;}
#qr-reader video{width:100%!important;height:auto!important;border-radius:8px!important;display:block!important;}
#qr-reader__dashboard{display:none!important;}
#qr-reader__scan_region{width:100%!important;}
#qr-reader-home{width:100%!important;overflow:hidden;}
#qr-reader-home>div{padding:0!important;border:none!important;background:transparent!important;}
#qr-reader-home img{display:none!important;}
#qr-reader-home video{width:100%!important;height:260px!important;object-fit:cover!important;display:block!important;}
#qr-reader__dashboard{display:none!important;}
#qr-reader__status_span{display:none!important;}
#qr-reader img{display:none!important;}
/* ── PRODUKT HERO ── */
.product-hero{background:#fff;border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:10px;box-shadow:var(--sh);}
.product-hero-img{width:100%;height:180px;object-fit:contain;background:var(--paper2);display:block;}
.product-hero-img-placeholder{width:100%;height:180px;background:var(--paper2);display:flex;align-items:center;justify-content:center;font-size:72px;}
.product-hero-body{padding:14px 16px;}
.product-hero-name{font-size:19px;font-weight:800;color:var(--ink);letter-spacing:-.4px;line-height:1.2;margin-bottom:3px;}
.product-hero-brand{font-size:13px;color:var(--muted);font-weight:500;margin-bottom:10px;}
.product-hero-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.product-hero-source{font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;letterSpacing:.3px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.fade-in{animation:fadeUp .18s ease both;}

/* ── MADPAS ── */
.mp-page{background:var(--paper);display:flex;flex-direction:column;flex:1;}
.mp-scroll{flex:1;overflow-y:auto;padding:0 20px 120px;}
.mp-head{padding:20px 20px 0;}
.mp-title{font-size:26px;font-weight:900;color:var(--ink);letter-spacing:-.5px;margin-bottom:5px;}
.mp-subtitle{font-size:13px;color:var(--muted2);font-weight:500;line-height:1.5;margin-bottom:20px;}
.mp-section-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin:0 0 8px;}
.mp-lang-dropdown{width:100%;background:#fff;border:1.5px solid var(--border2);border-radius:13px;padding:13px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s;margin-bottom:16px;box-sizing:border-box;}
.mp-lang-dropdown:hover{border-color:var(--green);}
.mp-lang-flag{font-size:22px;flex-shrink:0;}
.mp-lang-name{flex:1;font-size:15px;font-weight:700;color:var(--ink);}
.mp-lang-arrow{font-size:14px;color:var(--muted);}
.mp-lang-list{background:#fff;border:1.5px solid var(--border2);border-radius:13px;overflow:hidden;margin-bottom:16px;max-height:320px;overflow-y:auto;}
.mp-lang-opt{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;transition:background .1s;border-bottom:1px solid var(--border);}
.mp-lang-opt:last-child{border-bottom:none;}
.mp-lang-opt:hover{background:var(--paper2);}
.mp-lang-opt.on{background:var(--green-lt);}
.mp-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:14px;box-shadow:var(--sh);}
.mp-allergen-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;background:var(--red-lt);border:1px solid var(--red-md);border-radius:100px;font-weight:800;color:var(--red);margin:3px;}
.mp-allergen-pill.custom{background:var(--paper2);border-color:var(--border2);color:var(--ink2);}
.mp-big-btn{width:100%;background:var(--ink);color:var(--paper);border:none;border-radius:14px;padding:16px;font-family:var(--f);font-size:16px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;box-shadow:0 3px 12px rgba(31,39,51,.18);}
.mp-big-btn:hover{background:var(--ink2);}
.mp-speak-btn{background:var(--green);color:#fff;border:none;border-radius:10px;padding:8px 14px;font-family:var(--f);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;flex:1;}
.mp-speak-btn.speaking{background:var(--amber);}
.mp-aa{background:var(--paper2);color:var(--muted2);border:1.5px solid var(--border2);border-radius:9px;padding:7px 11px;font-family:var(--f);font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;}
.mp-aa.on{background:var(--green-lt);border-color:var(--green);color:var(--green);}
.mp-family-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 0;border-bottom:1px solid var(--border);}
.mp-family-row:last-child{border-bottom:none;}

/* ── OPSKRIFTER ── */
.recipe-grid{display:flex;flex-direction:column;gap:12px;}
.recipe-card{background:#fff;border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--sh);cursor:pointer;transition:transform .15s,box-shadow .15s;position:relative;}
.recipe-card:active{transform:scale(.99);}
.recipe-card-img{width:100%;height:180px;object-fit:cover;display:block;background:var(--paper2);}
.recipe-card-img-placeholder{width:100%;height:140px;background:linear-gradient(135deg,var(--paper2) 0%,var(--border) 100%);display:flex;align-items:center;justify-content:center;font-size:52px;}
.recipe-card-body{padding:14px 16px 16px;}
.recipe-card-title{font-size:16px;font-weight:800;color:var(--ink);line-height:1.25;margin-bottom:6px;letter-spacing:-.2px;}
.recipe-card-desc{font-size:12px;color:var(--muted2);line-height:1.55;margin-bottom:10px;}
.recipe-card-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.recipe-pill{font-size:10px;font-weight:700;border-radius:100px;padding:3px 9px;border:1px solid;white-space:nowrap;}
.recipe-safe-bar{display:flex;gap:5px;flex-wrap:wrap;padding:10px 14px 0;border-top:1px solid var(--border);margin-top:10px;}
.recipe-profile-badge{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;border:1px solid;}
.recipe-fav-btn{position:absolute;top:10px;right:10px;z-index:2;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.35);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:background .15s;}
.recipe-filter-row{display:flex;gap:7px;overflow-x:auto;padding-bottom:4px;margin-bottom:12px;scrollbar-width:none;}
.recipe-filter-row::-webkit-scrollbar{display:none;}
.recipe-filter-chip{flex-shrink:0;padding:7px 14px;border-radius:100px;border:1.5px solid var(--border2);background:#fff;font-size:12px;font-weight:700;cursor:pointer;color:var(--muted2);transition:all .15s;white-space:nowrap;}
.recipe-filter-chip.active{border-color:var(--green);background:var(--green-lt);color:var(--ink);box-shadow:0 0 0 2px var(--green-lt);}
.recipe-search-wrap{position:relative;margin-bottom:12px;}
.recipe-search-input{width:100%;padding:11px 14px 11px 42px;border:1.5px solid var(--border2);border-radius:12px;background:var(--paper2);font-family:var(--f);font-size:14px;color:var(--ink);outline:none;box-sizing:border-box;transition:border-color .15s,background .15s;}
.recipe-search-input:focus{border-color:var(--green);background:#fff;box-shadow:0 0 0 3px var(--green-lt);}
.recipe-search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none;}
.recipe-detail-hero{position:relative;margin:-1px -16px 0;}
.recipe-detail-img{width:100%;height:240px;object-fit:cover;display:block;}
.recipe-detail-img-placeholder{width:100%;height:200px;background:linear-gradient(135deg,var(--paper2),var(--border));display:flex;align-items:center;justify-content:center;font-size:80px;}
.recipe-detail-back{position:absolute;top:14px;left:14px;z-index:3;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.45);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;}
.recipe-detail-fav{position:absolute;top:14px;right:14px;z-index:3;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.45);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;}
.recipe-detail-title{font-size:24px;font-weight:900;color:var(--ink);letter-spacing:-.5px;line-height:1.2;margin-bottom:8px;}
.recipe-meta-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;}
.recipe-meta-pill{display:flex;align-items:center;gap:4px;padding:4px 10px;background:var(--paper2);border:1px solid var(--border);border-radius:100px;font-size:11px;font-weight:700;color:var(--muted2);}
.ingredient-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--border);}
.ingredient-row:last-child{border-bottom:none;}
.ingredient-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:2px;}
.step-row{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:opacity .2s;}
.step-row:last-child{border-bottom:none;}
.step-circle{width:32px;height:32px;border-radius:50%;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.servings-ctrl{display:flex;align-items:center;gap:10px;background:var(--paper2);border:1px solid var(--border);border-radius:10px;padding:5px 12px;}
.servings-btn{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--border2);background:#fff;cursor:pointer;font-size:16px;font-weight:700;color:var(--ink);display:flex;align-items:center;justify-content:center;line-height:1;transition:all .15s;font-family:var(--f);}
.servings-btn:hover{border-color:var(--green);color:var(--green);}
.servings-num{font-size:15px;font-weight:800;color:var(--ink);min-width:22px;text-align:center;}
.recipe-skeleton{background:#fff;border-radius:16px;overflow:hidden;border:1px solid var(--border);margin-bottom:12px;}
.skeleton-img{width:100%;height:140px;background:linear-gradient(90deg,var(--paper2) 25%,var(--border) 50%,var(--paper2) 75%);background-size:400% 100%;animation:shimmer 1.4s ease-in-out infinite;}
.skeleton-line{height:12px;border-radius:6px;background:linear-gradient(90deg,var(--paper2) 25%,var(--border) 50%,var(--paper2) 75%);background-size:400% 100%;animation:shimmer 1.4s ease-in-out infinite;margin-bottom:8px;}
@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
.youtube-btn{display:flex;align-items:center;gap:8px;padding:10px 16px;background:#FF0000;border:none;border-radius:10px;cursor:pointer;font-family:var(--f);font-size:13px;font-weight:700;color:#fff;width:100%;justify-content:center;transition:background .15s;margin-bottom:10px;}
.youtube-btn:hover{background:#CC0000;}

/* ── ACCESSIBILITY ── */
/* Minimum touch target 44x44px */
.btn{min-height:44px;}
.nav-item{min-height:44px;min-width:44px;}
.chip{min-height:44px;}
/* Focus synlig for keyboard-navigation */
*:focus-visible{outline:2.5px solid var(--green);outline-offset:2px;border-radius:4px;}
/* Skip-link for screen readers */
.skip-link{position:absolute;top:-100px;left:16px;background:var(--ink);color:#fff;padding:8px 16px;border-radius:8px;font-size:14px;font-weight:700;z-index:9999;text-decoration:none;}
.skip-link:focus{top:8px;}
/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;}
  .spinner{animation:none;border-color:var(--green);}
}
/* Bedre kontrast for muted tekst */
@media (prefers-contrast: more) {
  :root{--muted:#555;--muted2:#444;--border:#999;--border2:#777;}
}
/* Større tekst support */
@media (min-resolution: 2dppx) {
  .field{font-size:16px;} /* Undgår iOS zoom ved focus */
}
`;


// ─── HOVED KOMPONENT ─────────────────────────────────────────────────────────

export default function EatSafe() {
  // Auth state
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("as_token") || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("as_refresh") || null);
  const [userId, setUserId] = useState(() => localStorage.getItem("as_user_id") || null);

  // UI state
  const [screen, setScreen] = useState(accessToken ? SCREENS.HOME : SCREENS.WELCOME);
  const [onboardStep, setOnboardStep] = useState(1);
  const [editMode, setEditMode] = useState(false);

  // User data
  const [user, setUser] = useState({ name:"", age:"", email:"", phone:"", password:"", role:"" });
  const [allergens, setAllergens] = useState([]);
  const [customAllerg, setCustomAllerg] = useState([]);
  const [family, setFamily] = useState([]);
  const [activeProfiles, setActiveProfiles] = useState(["me"]);

  // Scan state
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [showIng, setShowIng] = useState(true); // Automatisk åben
  const [showNutrition, setShowNutrition] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const productCacheRef = useRef({}); // Cache af seneste 50 scannede produkter
  const [torchOn, setTorchOn] = useState(false);
  const [profilePopup, setProfilePopup] = useState(null); // id af profil der vises popup for
  const galleryInputRef = useRef(null);
  const torchTrackRef = useRef(null);
  const qrRef = useRef(null);
  const html5QrRef = useRef(null);

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Admin
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [adminSection, setAdminSection] = useState("dashboard");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminTicketFilter, setAdminTicketFilter] = useState("all");
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [openAdminUser, setOpenAdminUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchParam, setUserSearchParam] = useState("all"); // all | name | email | role | onboarding
  const [openSubmission, setOpenSubmission] = useState(null);
  const [submissionFilter, setSubmissionFilter] = useState("pending");
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [cleaningOcr, setCleaningOcr] = useState(false);
  const [cleanedOcrText, setCleanedOcrText] = useState(null);

  // Shopping list
  const [shoppingList, setShoppingList] = useState([]);
  const [shoppingListId, setShoppingListId] = useState(null);
  const [newItemName, setNewItemName] = useState("");

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("alle");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
    const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("as_favorites") || "[]"); } catch { return []; }
  });
  const [madpasLang, setMadpasLang] = useState(() => localStorage.getItem("as_madpas_lang") || "en");
  const [madpasProfileId, setMadpasProfileId] = useState("self");
  const madpasActiveProfile = madpasProfileId === "self" ? null : family.find(m => m.id === madpasProfileId);
  const mpAllergens = madpasActiveProfile ? (madpasActiveProfile.allergens || []) : allergens;
  const mpCustom = madpasActiveProfile ? (madpasActiveProfile.customAllerg || []) : customAllerg;
  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [recipeFilter, setRecipeFilter] = useState("alle");
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [showSubmitRecipe, setShowSubmitRecipe] = useState(false);
  const [submitRecipe, setSubmitRecipe] = useState({ title:"", description:"", category:"aftensmad", tags:[] });
  const [submitSteps, setSubmitSteps] = useState([""]);
  const [submitIngredients, setSubmitIngredients] = useState([{ name:"", amount:"", unit:"" }]);
  const [submittingRecipe, setSubmittingRecipe] = useState(false);
  const [recipeTermsOpen, setRecipeTermsOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({});
  const [showManualEan, setShowManualEan] = useState(false);
  const [selectedENumbers, setSelectedENumbers] = useState([]);
  const [allergenSubtypes, setAllergenSubtypes] = useState({}); // { "laktose": "laktose_protein", ... }
  const [activeSubtypeModal, setActiveSubtypeModal] = useState(null); // allergen id der vises modal for
  const [eSearch, setESearch] = useState("");
  const [eCategory, setECategory] = useState("alle");
  const [recipeTermsAccepted, setRecipeTermsAccepted] = useState(false);
  const [madpasSpeaking, setMadpasSpeaking] = useState(false);
  const [madpasBig, setMadpasBig] = useState(false);
  const [madpasWaiterView, setMadpasWaiterView] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [showSafeOnly, setShowSafeOnly] = useState(false);
  const [recipeServings, setRecipeServings] = useState(4);
  const [editStep, setEditStep] = useState("start");
  const [editIngText, setEditIngText] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editType, setEditType] = useState(null);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeSafeOnly, setRecipeSafeOnly] = useState(false);

  // Family form
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAllerg, setNewMemberAllerg] = useState([]);
  const [newMemberCustomAllerg, setNewMemberCustomAllerg] = useState([]);
  const [newMemberDiets, setNewMemberDiets] = useState([]);
  const [newMemberENumbers, setNewMemberENumbers] = useState([]);
  const [newMemberSubtypes, setNewMemberSubtypes] = useState({});
  const [newMemberSubtypeModal, setNewMemberSubtypeModal] = useState(null);
  const [newMemberCustomInput, setNewMemberCustomInput] = useState("");
  const [customInput, setCustomInput] = useState("");

  // Auth form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authTab, setAuthTab] = useState("signup"); // signup | login

  // NOT FOUND flow
  const [notFoundEan, setNotFoundEan] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [editOcrText, setEditOcrText] = useState("");
  const [editOcrLoading, setEditOcrLoading] = useState(false);
  const [editProductImage, setEditProductImage] = useState(null);
  const [editProductImageB64, setEditProductImageB64] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [proposedFlags, setProposedFlags] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notFoundStep, setNotFoundStep] = useState(1); // 1=forside, 2=ingredienser, 3=bekræft
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourIdx, setTourIdx] = useState(0);
  const [isOAuth, setIsOAuth] = useState(false);
  const [feedbackType, setFeedbackType] = useState("bug");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackImage, setFeedbackImage] = useState(null);
  const [feedbackImageB64, setFeedbackImageB64] = useState(null);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [adminTickets, setAdminTickets] = useState([]);
  const [openTicket, setOpenTicket] = useState(null);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [proposedName, setProposedName] = useState("");
  const [productImageBase64, setProductImageBase64] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [ocrImageBase64, setOcrImageBase64] = useState(null);
  const [ocrImagePreview, setOcrImagePreview] = useState(null);

  // ── TOKEN HELPERS ──────────────────────────────────────────────────────────
  const saveTokens = useCallback((access, refresh, uid) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setUserId(uid);
    localStorage.setItem("as_token", access);
    localStorage.setItem("as_refresh", refresh);
    localStorage.setItem("as_user_id", uid);
  }, []);

  // Håndter OAuth callback — fang access_token fra URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.replace("#", "?").replace("#", "&"));
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    if (access && refresh) {
      try {
        const payload = JSON.parse(atob(access.split(".")[1]));
        const uid = payload.sub;
        saveTokens(access, refresh, uid);

        // Tjek om brugeren er ny — hent profil fra Supabase
        fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}&select=name,created_at,onboarding_completed`, {
          headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${access}`, "Accept": "application/json" },
        })
          .then(r => r.json())
          .then(data => {
            const profile = data?.[0];
            const createdAt = profile?.created_at ? new Date(profile.created_at) : null;
            // Ny bruger = onboarding ikke gennemført ELLER oprettet inden for 2 min
            const isNew = !profile || profile.onboarding_completed === false || !createdAt || (Date.now() - createdAt.getTime() < 120000);
            if (isNew) {
              const meta = payload.user_metadata || {};
              setUser(u => ({ ...u, email: payload.email || meta.email || "", name: meta.full_name || meta.name || "" }));
              setOnboardStep(1);
              setIsOAuth(true);
              setScreen(SCREENS.ONBOARD);
            } else {
              setScreen(SCREENS.HOME);
            }
          })
          .catch(() => setScreen(SCREENS.HOME));

        // Ryd URL hash
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("OAuth callback fejl:", e);
        setScreen(SCREENS.HOME);
      }
    }
  }, [saveTokens]);

  const clearAuth = useCallback(() => {
    setAccessToken(null); setRefreshToken(null); setUserId(null);
    localStorage.removeItem("as_token");
    localStorage.removeItem("as_refresh");
    localStorage.removeItem("as_user_id");
    setUser({ name:"", age:"", email:"", phone:"", password:"", role:"" });
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

  const loadRecipes = async (filter = "alle") => {
    setRecipesLoading(true);
    try {
      let url = `${SUPABASE_URL}/rest/v1/recipes?select=id,title,category,image_url,tags,allergen_flags,servings,prep_time_minutes,cook_time_minutes,description&limit=50`;
      // Prøv med status filter først
      url += `&status=eq.approved`;
      if (filter !== "alle") {
        url += `&category=eq.${filter}`;
      }
      const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Accept": "application/json",
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      };
      const res = await fetch(url, { headers });
      const text = await res.text();
      if (!res.ok) {
        console.error("loadRecipes fejl:", res.status, text.slice(0, 200));
        // Fallback: prøv uden status filter
        const url2 = `${SUPABASE_URL}/rest/v1/recipes?select=id,title,category,image_url,tags,allergen_flags,servings,description&limit=50${filter !== "alle" ? `&category=eq.${filter}` : ""}`;
        const res2 = await fetch(url2, { headers });
        const data2 = await res2.json();
        setRecipes(Array.isArray(data2) ? data2 : []);
        return;
      }
      const data = JSON.parse(text);
      setRecipes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("loadRecipes fejl:", e.message);
      setRecipes([]);
    }
    setRecipesLoading(false);
  };

  const loadRecipeIngredients = async (recipeId) => {
    try {
      const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Accept": "application/json",
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      };
      // Hent fuld opskrift inkl. ingredients_raw og instructions
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/recipes?id=eq.${recipeId}&select=id,ingredients_raw,instructions`,
        { headers }
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        setSelectedRecipe(prev => prev ? { ...prev, ...data[0] } : prev);
      }
    } catch {}
    setRecipeIngredients([]);
  };

  const submitUserRecipe = async () => {
    if (!submitRecipe.title.trim() || submitIngredients.filter(i => i.name.trim()).length === 0) return;
    setSubmittingRecipe(true);
    try {
      const [recipe] = await apiCall(`${SUPABASE_URL}/rest/v1/recipes`, {
        method: "POST",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
        body: JSON.stringify({
          ...submitRecipe,
          instructions: JSON.stringify(submitSteps.filter(s => s.trim())),
          submitted_by: userId,
          source: "user",
          language: "da",
          status: "pending",
          disclaimer: "Allergener er vejledende. Tjek altid ingrediensernes emballage ved alvorlige allergier.",
        }),
      });
      for (let i = 0; i < submitIngredients.length; i++) {
        const ing = submitIngredients[i];
        if (!ing.name.trim()) continue;
        await apiCall(`${SUPABASE_URL}/rest/v1/recipe_ingredients`, {
          method: "POST",
          headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
          body: JSON.stringify({ recipe_id: recipe.id, name: ing.name, amount: ing.amount, unit: ing.unit, sort_order: i }),
        });
      }
      setShowSubmitRecipe(false);
      setSubmitRecipe({ title:"", description:"", category:"aftensmad", tags:[] });
      setSubmitSteps([""]);
      setSubmitIngredients([{ name:"", amount:"", unit:"" }]);
      alert("Tak! Din opskrift er sendt til godkendelse.");
    } catch (e) { alert("Fejl: " + e.message); }
    setSubmittingRecipe(false);
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

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  const loadSubmissions = async (filter) => {
    const f = filter || submissionFilter;
    if (f === "tickets") return;
    setSubmissionsLoading(true);
    try {
      const headers = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" };
      const url = `${SUPABASE_URL}/rest/v1/product_submissions?status=eq.${f}&order=created_at.desc&limit=100`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch { setSubmissions([]); }
    setSubmissionsLoading(false);
  };

  const deleteOwnAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "slet") return;
    setDeletingAccount(true);
    try {
      // Slet relaterede data
      const h = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}` };
      await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/shopping_lists?owner_id=eq.${userId}`, { method:"DELETE", headers:h }),
        fetch(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, { method:"DELETE", headers:h }),
        fetch(`${SUPABASE_URL}/rest/v1/family_members?user_id=eq.${userId}`, { method:"DELETE", headers:h }),
        fetch(`${SUPABASE_URL}/rest/v1/scan_history?user_id=eq.${userId}`, { method:"DELETE", headers:h }),
        fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?submitted_by=eq.${userId}`, { method:"DELETE", headers:h }),
      ]);
      // Slet bruger fra public.users
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, { method:"DELETE", headers:h });
      // Log ud
      clearAuth();
      setShowDeleteAccount(false);
    } catch (e) {
      alert("Fejl: " + e.message + "\nKontakt support@eatsafe.dk");
    }
    setDeletingAccount(false);
  };

  const loadAdminStats = async () => {
    try {
      const h = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json", "Prefer": "count=exact" };
      const hNoCount = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" };
      const today = new Date(); today.setHours(0,0,0,0);
      const todayISO = today.toISOString();

      const [users, products, scans, submissions, families, tickets, scansToday, newUsersToday] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/users?select=id`, { headers: h }).then(async r => { const ct = r.headers.get("content-range"); return ct ? parseInt(ct.split("/")[1]) : (await r.json()).length; }),
        fetch(`${SUPABASE_URL}/rest/v1/products?select=id`, { headers: h }).then(async r => { const ct = r.headers.get("content-range"); return ct ? parseInt(ct.split("/")[1]) : (await r.json()).length; }),
        fetch(`${SUPABASE_URL}/rest/v1/scan_history?select=id`, { headers: h }).then(async r => { const ct = r.headers.get("content-range"); return ct ? parseInt(ct.split("/")[1]) : (await r.json()).length; }),
        fetch(`${SUPABASE_URL}/rest/v1/product_submissions?status=eq.pending&select=id`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/family_members?select=id`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?status=eq.open&select=id`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/scan_history?select=id&scanned_at=gte.${todayISO}`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/users?select=id&created_at=gte.${todayISO}`, { headers: hNoCount }).then(r => r.json()),
      ]);

      setAdminStats({
        total_users:          typeof users === "number" ? users : (Array.isArray(users) ? users.length : 0),
        total_products:       typeof products === "number" ? products : (Array.isArray(products) ? products.length : 0),
        total_scans:          typeof scans === "number" ? scans : (Array.isArray(scans) ? scans.length : 0),
        pending_submissions:  Array.isArray(submissions) ? submissions.length : 0,
        total_families:       Array.isArray(families) ? families.length : 0,
        open_tickets:         Array.isArray(tickets) ? tickets.length : 0,
        scans_today:          Array.isArray(scansToday) ? scansToday.length : 0,
        new_users_today:      Array.isArray(newUsersToday) ? newUsersToday.length : 0,
      });
    } catch (e) { console.error("loadAdminStats fejl:", e.message); }
  };

  const cleanOcrWithAI = async (rawText) => {
    if (!rawText) return;
    setCleaningOcr(true);
    setCleanedOcrText(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Du er en assistent der renskriver ingredienslister fra OCR-scanning.

REGLER (MEGET VIGTIGT):
- Du må ALDRIG tilføje ingredienser der ikke er i originalteksten
- Du må ALDRIG fjerne ingredienser fra originalteksten
- Du må ALDRIG ændre mængdeangivelser (%, g, mg etc.)
- Du må kun rette åbenlyse OCR-fejl (fx "Hvedek|ad" → "Hvedeklid")
- Du må fjerne tekst der åbenlyst IKKE er ingredienser (fx "Opbevares køligt", "Bedst før", adresser, telefonnumre)
- Behold parenteser og underingredienser
- Formater som en kommasepareret liste

Renskiv denne ingrediensliste:
${rawText}

Svar KUN med den renskrevne ingrediensliste — ingen forklaring, ingen kommentar.`
          }]
        })
      });
      const data = await res.json();
      const cleaned = data.content?.[0]?.text?.trim();
      if (cleaned) setCleanedOcrText(cleaned);
    } catch (e) {
      alert("AI fejl: " + e.message);
    }
    setCleaningOcr(false);
  };

  const updateSubmissionAndApprove = async (submission, edits) => {
    try {
      const headers = { "Content-Type":"application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Prefer":"return=minimal" };
      // Opdater status i product_submissions tabellen
      const res = await fetch(`${SUPABASE_URL}/rest/v1/product_submissions?id=eq.${submission.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "approved",
          reviewed_by: userId,
          product_name: edits.name || submission.ai_parsed_data?.name || "Ukendt produkt",
          brand: edits.brand || submission.ai_parsed_data?.brand || null,
          ingredients: edits.ingredients_text || submission.ocr_raw_text || null,
          notes: `Godkendt af admin. Allergener: ${JSON.stringify(edits.allergen_flags || {})}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOpenSubmission(null);
      setEditingSubmission(null);
      // Reload med samme filter (pending) — submission forsvinder herfra
      await loadSubmissions("pending");
      loadAdminStats();
    } catch (e) {
      alert("Fejl ved godkendelse: " + e.message);
    }
  };

  const approveSubmission = async (submission) => {
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions/${submission.id}`, {
        method: "PATCH",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          status: "approved",
          reviewed_by: userId,
          name: submission.ai_parsed_data?.name || "Ukendt produkt",
          brand: submission.ai_parsed_data?.brand || null,
          ingredients_text: submission.ocr_raw_text || null,
          allergen_flags: submission.ai_parsed_data || null,
        }),
      });
      setSubmissions(s => s.filter(x => x.id !== submission.id));
    } catch (e) {
      alert("Fejl ved godkendelse: " + e.message);
    }
  };

  const rejectSubmission = async (id) => {
    try {
      const headers = { "Content-Type":"application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Prefer":"return=minimal" };
      await fetch(`${SUPABASE_URL}/rest/v1/product_submissions?id=eq.${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "rejected", reviewed_by: userId }),
      });
      setOpenSubmission(null);
      setEditingSubmission(null);
      await loadSubmissions("pending");
      loadAdminStats();
    } catch (e) {
      alert("Fejl ved afvisning: " + e.message);
    }
  };
  // ── FAVORITTER ────────────────────────────────────────────────────────────
  const toggleFavorite = (product) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.ean === product.ean || f.code === product.code);
      const updated = exists
        ? prev.filter(f => f.ean !== product.ean && f.code !== product.code)
        : [...prev, { ...product, savedAt: Date.now() }];
      localStorage.setItem("as_favorites", JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (ean) => favorites.some(f => f.ean === ean || f.code === ean);

  // ── AUTH ───────────────────────────────────────────────────────────────────
  const handleOAuth = async (provider) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const redirectTo = "https://eatsafe.dk/";
      const params = new URLSearchParams({
        provider,
        redirect_to: redirectTo,
        ...(provider === "google" ? { prompt: "select_account" } : {}),
      });
      window.location.href = `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;
    } catch (e) {
      setAuthError(`${provider} login fejlede: ${e.message}`);
      setAuthLoading(false);
    }
  };

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
  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setFeedbackSending(true);
    try {
      // Saml al diagnostisk info automatisk
      const ctx = {
        screen,
        url: window.location.href,
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen_size: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine,
        timestamp: new Date().toISOString(),
        user_id: userId || null,
        user_name: user?.name || null,
        user_email: user?.email || loginEmail || null,
        user_role: user?.role || null,
        allergens_count: allergens.length,
        family_count: family.length,
        history_count: history.length,
        active_profiles: activeProfiles,
        app_version: "beta-1.0",
      };
      const headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      };
      await fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=minimal" },
        body: JSON.stringify({
          type: feedbackType,
          description: feedbackText,
          context: ctx,
          image_base64: feedbackImageB64 || null,
          status: "open",
          submitted_by: userId || null,
        }),
      });
      setFeedbackDone(true);
      setTimeout(() => { setFeedbackOpen(false); setFeedbackDone(false); setFeedbackText(""); setFeedbackImage(null); setFeedbackImageB64(null); setFeedbackType("bug"); }, 2000);
    } catch(e) { alert("Fejl: " + e.message); }
    setFeedbackSending(false);
  };

  const loadAdminUsers = async () => {
    setAdminUsersLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,name,email,role,created_at,onboarding_completed,phone,age,plan_id,preferred_stores&order=created_at.desc&limit=1000`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json", "Prefer": "count=exact" },
      });
      const data = await res.json();
      setAdminUsers(Array.isArray(data) ? data : []);
    } catch { setAdminUsers([]); }
    setAdminUsersLoading(false);
  };

  const updateUserRole = async (uid, role) => {
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Prefer":"return=minimal" },
      body: JSON.stringify({ role }),
    });
    setAdminUsers(u => u.map(x => x.id === uid ? { ...x, role } : x));
  };

  const deleteUser = async (uid) => {
    if (!window.confirm("Er du sikker? Dette kan ikke fortrydes.")) return;
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}`, { method: "DELETE", headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}` } });
    setAdminUsers(u => u.filter(x => x.id !== uid));
  };

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?order=created_at.desc&limit=100`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" },
      });
      const data = await res.json();
      setAdminTickets(Array.isArray(data) ? data : []);
    } catch { setAdminTickets([]); }
    setTicketsLoading(false);
  };

  const updateTicketStatus = async (id, status) => {
    await fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Prefer":"return=minimal" },
      body: JSON.stringify({ status }),
    });
    setAdminTickets(t => t.map(x => x.id === id ? { ...x, status } : x));
    if (openTicket?.id === id) setOpenTicket(t => ({ ...t, status }));
  };

  // ── ONBOARDING GEM ─────────────────────────────────────────────────────────
  const saveProfileStep1 = async () => {
    if (!(user.name || "").trim()) return;
    const emailToSave = user.email || loginEmail || "";
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
        body: JSON.stringify({
          name: user.name,
          email: emailToSave || null,
          phone: user.phone || null,
          age: user.age ? parseInt(user.age) : null,
        }),
      });
      if (emailToSave) setUser(u => ({ ...u, email: emailToSave }));
    } catch { /* silent */ }
    setOnboardStep(4);
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
    // step styres af knappen
  };

  const finishOnboard = async () => {
    // Marker onboarding som gennemført
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { "Content-Type":"application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Prefer":"return=minimal" },
        body: JSON.stringify({ onboarding_completed: true }),
      });
    } catch {}
    setScreen(SCREENS.HOME);
    setEditMode(false);
    setIsOAuth(false);
  };

  // ── SCANNING ───────────────────────────────────────────────────────────────
  const allActive = useCallback(() => {
    const ids = new Set(activeProfiles.includes("me") ? allergens : []);
    family.filter(m => activeProfiles.includes(m.id)).forEach(m => m.allergens.forEach(a => ids.add(a)));
    return { ids: [...ids], custom: [...customAllerg] };
  }, [allergens, customAllerg, family, activeProfiles]);

  const lastScannedRef = useRef(null); // Anti-duplikat
  const startCamera = async () => {
    if (cameraActive) return;
    setScanError("");
    setTorchOn(false);
    torchTrackRef.current = null;
    lastScannedRef.current = null;

    // Tjek browser-support
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Kamera ikke understøttet. Prøv Chrome eller Safari.");
      return;
    }

    // iPhone kræver simpel constraints — avancerede constraints fejler på Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const constraints = isIOS
      ? { video: { facingMode: { exact: "environment" } } }
      : { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } };

    // Bed om kamera-tilladelse
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = stream.getVideoTracks()[0];
      if (track) torchTrackRef.current = track;
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setScanError("Kamera-adgang nægtet. Gå til telefonens indstillinger og tillad kamera for denne app.");
      } else if (e.name === "NotFoundError") {
        setScanError("Intet kamera fundet på denne enhed.");
      } else if (e.name === "OverconstrainedError" && isIOS) {
        // iOS fallback — prøv uden exact
        try {
          const stream2 = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          stream2.getTracks().forEach(t => t.stop());
        } catch {
          setScanError("Kunne ikke starte kamera. Prøv at genindlæse siden.");
          return;
        }
      } else {
        setScanError("Kamera fejl: " + e.message);
        return;
      }
    }

    setCameraActive(true);
    await new Promise(r => setTimeout(r, isIOS ? 300 : 150)); // iOS har brug for lidt mere tid

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const readerId = "qr-reader-home";

      if (html5QrRef.current) {
        try { await html5QrRef.current.stop(); } catch {}
        html5QrRef.current = null;
      }

      const readerEl = document.getElementById(readerId);
      if (!readerEl) {
        setScanError("Kamera-element ikke fundet. Genindlæs siden.");
        setCameraActive(false);
        return;
      }

      html5QrRef.current = new Html5Qrcode(readerId, { verbose: false });

      const qrConfig = {
        fps: isIOS ? 10 : 20, // iOS klarer ikke 30fps
        qrbox: (w, h) => {
          const side = Math.min(w, h) * 0.8;
          return { width: Math.round(side), height: Math.round(side * 0.45) };
        },
        aspectRatio: isIOS ? undefined : 1.0, // iOS: lad den bestemme selv
        disableFlip: false,
        formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Alle stregkode-formater
        videoConstraints: isIOS
          ? { facingMode: { exact: "environment" } }
          : {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
              focusMode: "continuous",
              exposureMode: "continuous",
            },
      };

      await html5QrRef.current.start(
        { facingMode: isIOS ? { exact: "environment" } : "environment" },
        qrConfig,
        (code) => {
          // Anti-duplikat — ignorer samme kode inden for 2 sekunder
          const now = Date.now();
          if (lastScannedRef.current?.code === code && now - lastScannedRef.current.time < 2000) return;
          lastScannedRef.current = { code, time: now };

          // Vibration feedback
          if (navigator.vibrate) navigator.vibrate([40, 20, 40]);

          // Bip lyd
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 1800;
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.12);
          } catch {}

          stopCamera();
          lookupProduct(code);
        },
        () => {} // Scan fejl — stille fejl, kameraet fortsætter
      );

      // Opsnap video track til torch — vent lidt på iOS
      await new Promise(r => setTimeout(r, 500));
      const videoEl = document.querySelector("#qr-reader-home video");
      if (videoEl?.srcObject) {
        const track = videoEl.srcObject.getVideoTracks()[0];
        if (track) torchTrackRef.current = track;
      }

    } catch (e) {
      setCameraActive(false);
      // iPhone-venlig fejlbesked
      if (e.message?.includes("constraint") || e.message?.includes("Constraint")) {
        // Prøv igen uden constraints
        setTimeout(() => startCamera(), 500);
      } else {
        setScanError("Kamera kunne ikke starte. Prøv at lukke andre apps og prøv igen.");
      }
    }
  };

  const scanFromGallery = async (file) => {
    if (!file) return;
    setScanError("");
    setLoading(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader-gallery");
      const result = await scanner.scanFile(file, true);
      scanner.clear();
      lookupProduct(result);
    } catch (e) {
      setLoading(false);
      setScanError("Ingen stregkode fundet i billedet. Prøv et klarere billede.");
    }
  };

  const toggleTorch = async () => {
    try {
      // Find aktiv video track
      const videoEl = document.querySelector("#qr-reader-home video");
      const track = videoEl?.srcObject?.getVideoTracks?.()?.[0] || torchTrackRef.current;
      if (!track) return;
      const capabilities = track.getCapabilities?.();
      if (!capabilities?.torch) {
        setScanError("Lygte ikke understøttet på denne enhed.");
        return;
      }
      const newState = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: newState }] });
      setTorchOn(newState);
    } catch (e) {
      setScanError("Kunne ikke tænde lygte: " + e.message);
    }
  };

  const stopCamera = () => {
    if (html5QrRef.current) {
      html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
    // Sluk torch
    if (torchTrackRef.current) {
      try { torchTrackRef.current.applyConstraints({ advanced: [{ torch: false }] }); } catch {}
      torchTrackRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  useEffect(() => {
    if (screen !== SCREENS.HOME) stopCamera();
    if (screen === SCREENS.RECIPES && recipes.length === 0 && !recipesLoading) {
      loadRecipes("alle");
    }
  }, [screen]);

  // Intercepter Android/browser back-knap
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      // Gå tilbage i app-flow i stedet for at lukke
      if (activeSubtypeModal) { setActiveSubtypeModal(null); return; }
      if (madpasWaiterView) { setMadpasWaiterView(false); return; }
      if (showManualEan) { setShowManualEan(false); return; }
      if (showSubmitRecipe) { setShowSubmitRecipe(false); return; }
      if (selectedRecipe) { setSelectedRecipe(null); return; }
      if (screen === SCREENS.RESULT) { setScreen(SCREENS.HOME); return; }
      if (screen === SCREENS.SEARCH) { setScreen(SCREENS.HOME); return; }
      if (screen === SCREENS.LIST) { setScreen(SCREENS.HOME); return; }
      if (screen === SCREENS.FAVORITES) { setScreen(SCREENS.PROFILE); return; }
      if (screen === SCREENS.FAMILY) { setScreen(SCREENS.PROFILE); return; }
      if (screen === SCREENS.MADPAS) { setScreen(SCREENS.PROFILE); return; }
      if (screen === SCREENS.EDITPROFILE) { setScreen(SCREENS.PROFILE); return; }
      if (screen === SCREENS.SUGGEST_EDIT) { setScreen(SCREENS.RESULT); return; }
      if (screen === SCREENS.ADMIN) { setScreen(SCREENS.PROFILE); return; }
      if (screen === SCREENS.RECIPES) { setScreen(SCREENS.HOME); return; }
      if (screen === SCREENS.NOTFOUND) { setScreen(SCREENS.HOME); return; }
      // Hvis vi er på HOME, lad browser håndtere det
      window.history.pushState(null, "", window.location.href);
    };
    // Push en state så vi har noget at gå tilbage til
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [screen, activeSubtypeModal, madpasWaiterView, showManualEan, showSubmitRecipe, selectedRecipe]);

  const { ids: activeIds } = allActive();

  const lookupProduct = useCallback(async (ean) => {
    if (!ean?.trim()) return;
    
    // Vibrer ved scan
    if (navigator.vibrate) navigator.vibrate(40);
    
    // Tjek cache først
    const cached = productCacheRef.current[ean.trim()];
    if (cached) {
      setScanResult(cached);
      setScreen(SCREENS.RESULT);
      return;
    }
    
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
        setNotFoundStep(1);
        setOcrText("");
        setProposedName("");
        setProposedFlags(Object.fromEntries(ALLERGENS.map(a => [a.id, false])));
        setProductImagePreview(null);
        setProductImageBase64(null);
        return;
      }

      const product = data.product;
      const flags = data.allergen_flags || {};
      const { status, matchedDanger, matchedWarning, hasUnknown } = compareAllergens(flags, activeIds);

      const flagList = [
        ...matchedDanger.map(id => ({ type:"bad", text:`Indeholder ${ALLERGENS.find(a=>a.id===id)?.label||id}` })),
        ...matchedWarning.map(id => ({ type:"maybe", text:`Kan indeholde spor af ${ALLERGENS.find(a=>a.id===id)?.label||id}` })),
        ...(hasUnknown ? [{ type:"maybe", text:"Visse allergener er ukendte — tjek altid pakken" }] : []),
        ...(matchedDanger.length===0 && matchedWarning.length===0 && !hasUnknown ? [{ type:"good", text:"Ingen af dine allergener fundet" }] : []),
      ];

      const headlines = { safe:"Sikkert produkt", danger:"Indeholder allergen", warn:"Mulige spor" };
      const summaries = {
        safe:"Ingen af dine registrerede allergener er fundet i dette produkt.",
        danger:`Produktet indeholder ${matchedDanger.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id).join(", ")}.`,
        warn:`Produktet kan indeholde spor af ${matchedWarning.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id).join(", ")}.`,
      };

      // Beregn per-familiemedlem påvirkning
      const familyImpact = [];
      if (family.length > 0) {
        for (const member of family.filter(m => activeProfiles.includes(m.id))) {
          const memberResult = compareAllergens(flags, member.allergens || []);
          if (memberResult.matchedDanger.length > 0 || memberResult.matchedWarning.length > 0) {
            familyImpact.push({
              name: member.name,
              color: member.color,
              danger: memberResult.matchedDanger,
              warning: memberResult.matchedWarning,
            });
          }
        }
      }

      const result = {
        code: ean.trim(),
        name: product.name || "Ukendt produkt",
        brand: product.brand || "",
        image_url: product.image_url || null,
        category: product.category || null,
        ingredients: data.ingredients?.raw_text || product.ingredients_text || product.ingredients?.raw_text || "",
        nutrition: data.nutrition || product.nutrition || null,
        verified_status: product.verified_status || "unverified",
        status,
        headline: headlines[status],
        summary: summaries[status],
        flags: flagList,
        allergen_flags: flags,
        matchedDanger,
        matchedWarning,
        familyImpact,
        source: data.source,
        hasUnknown,
        timestamp: Date.now(),
      };

      // Gem i cache (max 50 produkter)
      productCacheRef.current[ean.trim()] = result;
      const cacheKeys = Object.keys(productCacheRef.current);
      if (cacheKeys.length > 50) delete productCacheRef.current[cacheKeys[0]];
      
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
  // Forsøg at udtrække produktnavn fra OCR tekst
  const extractProductName = (text) => {
    if (!text) return "";
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2 && l.length < 50);
    // Find linjer der ligner et produktnavn (ikke tal, ikke for korte)
    const candidates = lines.filter(l => 
      !/^[0-9\s\.,gkJ%]+$/.test(l) &&
      !/^(ingredienser|næringsindhold|opbevaring|bedst|energi|fedt|protein|salt|kulhydrat)/i.test(l) &&
      l.length > 3
    );
    return candidates[0] || "";
  };

  const handleProductImageCapture = async (e) => {
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
      setProductImageBase64(base64);
      setProductImagePreview(URL.createObjectURL(file));

      // Brug Supabase OCR til at hente produktnavn fra forsidebilledet
      try {
        const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ image_base64: base64, mode: "product_name" }),
        });
        if (ocrData.success && ocrData.text) {
          // Ekstrakt produktnavn — første linje der ikke er tal/EAN
          const name = extractProductName(ocrData.text);
          if (name) setProposedName(name);
        }
      } catch { /* silent — bruger kan stadig skrive manuelt */ }
    } catch { setScanError("Billedet kunne ikke læses. Prøv igen."); }
    setOcrLoading(false);
    setNotFoundStep(2); // Gå automatisk til trin 2
  };

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
      setOcrImageBase64(base64);
      const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ image_base64: base64 }),
      });
      if (ocrData.success) {
        setOcrText(ocrData.text);
        if (!proposedName) setProposedName(extractProductName(ocrData.text));
        const allergenData = await apiCall(`${SUPABASE_URL}/functions/v1/allergens`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ text: ocrData.text }),
        });
        if (allergenData.success) setProposedFlags(allergenData.allergen_flags);
        setNotFoundStep(3); // Gå automatisk til bekræft
      } else {
        setScanError("Billedet kunne ikke læses. Prøv at tage et klarere billede.");
      }
    } catch { setScanError("Billedet kunne ikke analyseres. Prøv igen."); }
    setOcrLoading(false);
  };

  const handleEditIngredientCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditOcrLoading(true);
    try {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{ role:"user", content:[
            { type:"image", source:{ type:"base64", media_type:file.type, data:b64 } },
            { type:"text", text:"Udpak ingredienslisten fra dette billede. Returner kun den rene ingredienstekst, ingen forklaring." }
          ]}]
        })
      });
      const data = await resp.json();
      const text = data.content?.[0]?.text || "";
      setEditOcrText(text);
    } catch (e) { console.error(e); }
    setEditOcrLoading(false);
  };

  const handleEditProductCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setEditProductImage(url);
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = () => rej();
      r.readAsDataURL(file);
    });
    setEditProductImageB64(b64);
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
          raw_label_image: ocrImageBase64 || null,
          ai_parsed_data: { ...proposedFlags, name: proposedName, product_image_base64: productImageBase64 },
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
    const tempMember = {
      id: uid(),
      name: newMemberName.trim(),
      allergens: newMemberAllerg,
      custom: newMemberCustomAllerg.filter(c => !c.endsWith("_intolerance")),
      diets: newMemberDiets,
      eNumbers: newMemberENumbers,
      subtypes: newMemberSubtypes,
      color
    };
    setFamily(f => [...f, tempMember]);
    setNewMemberName("");
    setNewMemberAllerg([]);
    setNewMemberCustomAllerg([]);
    setNewMemberDiets([]);
    setNewMemberENumbers([]);
    setNewMemberSubtypes({});
    setNewMemberCustomInput("");
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

  // ── SØGNING via Edge Function ───────────────────────────────────────────────

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchResults([]);
      const q = searchQuery.trim();

      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/search?q=${encodeURIComponent(q)}`,
          { headers: { "apikey": SUPABASE_ANON_KEY, ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}) } }
        );
        const data = await res.json();
        if (data.success) {
          setSearchResults((data.products || []).map(p => ({ ...p, source:"local", verified:p.verified_status, conflicts:[] })));
        }
      } catch {
        // silent
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, accessToken]);

    // ── HJÆLPEKOMPONENTER ──────────────────────────────────────────────────────

  // ── MADPAS SPEAK ────────────────────────────────────────────────────────────
  const madpasSpeak = () => {
    if (!window.speechSynthesis) return;
    if (madpasSpeaking) { window.speechSynthesis.cancel(); setMadpasSpeaking(false); return; }
    const lang = madpasLang;
    const bcp = MADPAS_LANGUAGES.find(l => l.code === lang)?.bcp || "en-US";

    // Byg præcis den tekst der vises på skærmen
    const introText = {
      da:"Hej! Jeg har nogle fødevareallergier og ønsker gerne din hjælp til at finde noget, jeg kan spise trygt.",
      en:"Hi! I have some food allergies and would love your help finding something safe for me to eat.",
      de:"Hallo! Ich habe einige Lebensmittelallergien und würde mich über Ihre Hilfe freuen.",
      fr:"Bonjour ! J'ai des allergies alimentaires et j'aurais besoin de votre aide.",
      es:"¡Hola! Tengo algunas alergias alimentarias y agradecería su ayuda.",
      it:"Ciao! Ho alcune allergie alimentari e apprezzerei il suo aiuto.",
      nl:"Hallo! Ik heb wat voedselallergieën en zou graag uw hulp willen.",
      pt:"Olá! Tenho algumas alergias alimentares e gostaria da sua ajuda.",
      pl:"Cześć! Mam kilka alergii pokarmowych i chciałbym prosić o pomoc.",
      sv:"Hej! Jag har några matallergier och skulle uppskatta din hjälp.",
      no:"Hei! Jeg har noen matallergier og ønsker gjerne din hjelp.",
      ja:"こんにちは！食物アレルギーがあります。安全な食事を見つけるお手伝いをお願いできますか。",
      zh:"您好！我有食物过敏，希望您能帮助我找到安全的食物。",
      ar:"مرحباً! لدي بعض الحساسية الغذائية وأود مساعدتك في إيجاد شيء آمن لي.",
      tr:"Merhaba! Gıda alerjilerim var ve güvenli bir şey bulmam için yardımınıza ihtiyacım var.",
      el:"Γεια σας! Έχω κάποιες αλλεργίες τροφίμων και θα εκτιμούσα τη βοήθειά σας.",
    };
    const cannotText = {
      da:"Jeg kan ikke spise", en:"I cannot eat", de:"Ich kann nicht essen",
      fr:"Je ne peux pas manger", es:"No puedo comer", it:"Non posso mangiare",
      nl:"Ik kan niet eten", pt:"Não posso comer", pl:"Nie mogę jeść",
      sv:"Jag kan inte äta", no:"Jeg kan ikke spise", ja:"食べられません",
      zh:"我不能吃", ar:"لا أستطيع تناول", tr:"Yiyemiyorum", el:"Δεν μπορώ να φάω",
    };
    const outroText = {
      da:"Tak for din hjælp — det betyder rigtig meget for mig.",
      en:"Thank you so much for your help — it means a lot to me.",
      de:"Vielen Dank für Ihre Hilfe — das bedeutet mir sehr viel.",
      fr:"Merci beaucoup pour votre aide — cela compte beaucoup pour moi.",
      es:"Muchas gracias por su ayuda — significa mucho para mí.",
      it:"Grazie mille per il suo aiuto — significa molto per me.",
      nl:"Heel erg bedankt voor uw hulp — dat betekent veel voor mij.",
      pt:"Muito obrigado pela sua ajuda — significa muito para mim.",
      pl:"Bardzo dziękuję za pomoc — wiele dla mnie znaczy.",
      sv:"Tack så mycket för din hjälp — det betyder mycket för mig.",
      no:"Tusen takk for hjelpen — det betyr mye for meg.",
      ja:"ご協力ありがとうございます。本当に助かります。",
      zh:"非常感谢您的帮助，对我来说意义重大。",
      ar:"شكراً جزيلاً على مساعدتك — هذا يعني لي الكثير.",
      tr:"Yardımınız için çok teşekkür ederim — bu benim için çok şey ifade ediyor.",
      el:"Σας ευχαριστώ πολύ για τη βοήθειά σας — σημαίνει πολλά για μένα.",
    };

    const parts = [];
    parts.push(introText[lang] || introText.en);

    // Allergener — samme rækkefølge og tekst som på skærmen
    const allItems = [...allergens, ...customAllerg.filter(c => !c.endsWith("_intolerance") && !allergens.includes(c))];
    allItems.forEach((item, i) => {
      if (typeof item !== "string") return;
      const a = ALLERGENS.find(x => x.id === item);
      const label = a ? (ALLERGEN_T[item]?.[lang]?.n || ALLERGEN_T[item]?.en?.n || a.label) : item;
      const ex = a ? ALLERGEN_EXAMPLES[item] : null;
      const exProducts = ex?.products?.[lang] || ex?.products?.en || [];
      const exIngredients = ex?.ingredients?.[lang] || ex?.ingredients?.en || [];
      const exText = [...exProducts.slice(0,3), ...exIngredients.slice(0,4)].join(", ");
      const prefix = i === 0 ? (cannotText[lang] || cannotText.en) + ": " : "";
      parts.push(prefix + label + (exText ? ". " + exText : ""));
    });

    // Diæt
    if (user.diets && user.diets.length > 0) {
      const dietNames = user.diets.map(d => DIETS.find(x=>x.id===d)?.label).filter(Boolean).join(", ");
      parts.push(dietNames);
    }

    // E-numre
    if (selectedENumbers && selectedENumbers.length > 0) {
      parts.push(selectedENumbers.join(", "));
    }

    parts.push(outroText[lang] || outroText.en);

    const utter = new SpeechSynthesisUtterance(parts.join(". "));
    utter.lang = bcp;
    utter.rate = 0.85;
    utter.onstart = () => setMadpasSpeaking(true);
    utter.onend = () => setMadpasSpeaking(false);
    utter.onerror = () => setMadpasSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

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
        <div className={`ap-chip${isAll?" on":""}`} onClick={toggleAll}>Hele familien</div>
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
      <div className="app" role="application" aria-label="EatSafe">
        {/* Skip-link for tastatur/screen reader brugere */}
        <a href="#main-content" className="skip-link">Spring til indhold</a>

        {/* ══ VELKOMST ══ */}
        {/* ══ ONBOARDING SCREENS ══ */}
        {(screen === SCREENS.WELCOME || screen === SCREENS.LOGIN || screen === SCREENS.ONBOARD || editMode) && (
          <OnboardingScreen
            screen={screen} setScreen={setScreen}
            authTab={authTab} setAuthTab={setAuthTab}
            authError={authError} setAuthError={setAuthError}
            authLoading={authLoading}
            loginEmail={loginEmail} setLoginEmail={setLoginEmail}
            loginPassword={loginPassword} setLoginPassword={setLoginPassword}
            user={user} setUser={setUser}
            onboardStep={onboardStep} setOnboardStep={setOnboardStep}
            allergens={allergens} setAllergens={setAllergens}
            customAllerg={customAllerg} setCustomAllerg={setCustomAllerg}
            selectedENumbers={selectedENumbers} setSelectedENumbers={setSelectedENumbers}
            activeSubtypeModal={activeSubtypeModal} setActiveSubtypeModal={setActiveSubtypeModal}
            family={family} setFamily={setFamily}
            activeProfiles={activeProfiles} setActiveProfiles={setActiveProfiles}
            isOAuth={isOAuth}
            tourIdx={tourIdx} setTourIdx={setTourIdx}
            editMode={editMode} setEditMode={setEditMode}
            history={history} setHistory={setHistory}
            shoppingList={shoppingList} setShoppingList={setShoppingList}
            newMemberName={newMemberName} setNewMemberName={setNewMemberName}
            newMemberAllerg={newMemberAllerg} setNewMemberAllerg={setNewMemberAllerg}
            newMemberCustomAllerg={newMemberCustomAllerg} setNewMemberCustomAllerg={setNewMemberCustomAllerg}
            newMemberDiets={newMemberDiets} setNewMemberDiets={setNewMemberDiets}
            newMemberENumbers={newMemberENumbers} setNewMemberENumbers={setNewMemberENumbers}
            newMemberSubtypes={newMemberSubtypes} setNewMemberSubtypes={setNewMemberSubtypes}
            newMemberCustomInput={newMemberCustomInput} setNewMemberCustomInput={setNewMemberCustomInput}
            customInput={customInput} setCustomInput={setCustomInput}
            handleLogin={handleLogin} handleSignup={handleSignup} handleOAuth={handleOAuth}
            saveAllergensStep2={saveAllergensStep2}
            saveProfileStep1={saveProfileStep1} finishOnboard={finishOnboard}
          />
        )}
        {/* TOPBAR */}
        {!isOnboard && (
          <header className="topbar">
            <div className="topbar-logo">
              <div className="topbar-shield" style={{background:"none",padding:0}}><EatSafeLogo size={34} variant="light" /></div>
              <div className="topbar-name">Eat<span>Safe</span></div>
              <div style={{ background:"var(--amber)", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:100, letterSpacing:".5px", marginLeft:4, marginTop:2 }}>BETA</div>
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              {/* Hjælp-knap */}
              <button onClick={() => setHelpOpen(true)}
                style={{ background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:"50%", width:32, height:32, fontFamily:"var(--f)", fontSize:15, fontWeight:800, color:"var(--muted2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                ?
              </button>
              {/* Feedback-knap */}
              <button onClick={() => { setFeedbackOpen(true); setFeedbackDone(false); }}
                style={{ background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:100, padding:"5px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--muted2)", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Feedback
              </button>
            </div>
          </header>
        )}

        {/* Feedback-knap under onboarding */}
        {isOnboard && (
          <div style={{ position:"fixed", top:12, right:12, zIndex:1000 }}>
            <button onClick={() => { setFeedbackOpen(true); setFeedbackDone(false); }}
              style={{ background:"rgba(255,255,255,.85)", backdropFilter:"blur(8px)", border:"1px solid var(--border2)", borderRadius:100, padding:"5px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--muted2)", cursor:"pointer", display:"flex", alignItems:"center", gap:5, boxShadow:"0 2px 8px rgba(0,0,0,.08)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Feedback
            </button>
          </div>
        )}

        {/* ══ HJÆLP MODAL ══ */}
        {helpOpen && (() => {
          const helpContent = {
            "home": { title:"📷 Scanner", tips:[
              { icon:"📱", title:"Skan stregkode", desc:"Tryk på scan-feltet og hold kameraet roligt over stregkoden. Appen scanner automatisk." },
              { icon:"🔍", title:"Søg manuelt", desc:"Kan du ikke scanne? Brug søgefeltet til at finde produkter ved navn." },
              { icon:"⚡", title:"Hurtig scanning", desc:"God belysning og rolig hånd giver hurtigere og mere præcist resultat." },
              { icon:"📜", title:"Historik", desc:"Dine seneste scanninger gemmes automatisk — find dem under Profil." },
            ]},
            "recipes": { title:"🍝 Opskrifter", tips:[
              { icon:"🔍", title:"Søg og filtrer", desc:"Søg på navn eller vælg kategori. Slå 'Kun sikre' til for at skjule opskrifter med dine allergener." },
              { icon:"❤️", title:"Favoritter", desc:"Tryk hjerte-ikonet for at gemme en opskrift til Favoritter-fanen." },
              { icon:"👤", title:"Portionsjustering", desc:"Åbn en opskrift og tryk + / − for at skalere ingredienser automatisk." },
              { icon:"🛒", title:"Indkøbsliste", desc:"Tryk 'Tilføj til indkøbsliste' for at sende ingredienser direkte til din liste." },
            ]},
            "list": { title:"🛒 Indkøbsliste", tips:[
              { icon:"✏️", title:"Tilføj varer", desc:"Skriv en vare og tryk Tilføj — eller tilføj direkte fra en opskrift." },
              { icon:"✓", title:"Afkryds varer", desc:"Tryk på en vare for at markere den som købt." },
              { icon:"🗑️", title:"Ryd listen", desc:"Brug 'Ryd' for at fjerne alle afkrydsede varer på én gang." },
            ]},
            "profile": { title:"👤 Profil & præferencer", tips:[
              { icon:"🚨", title:"Allergi vs. intolerance", desc:"Tryk én gang = intolerance (gul advarsel). To gange = allergi (rød advarsel)." },
              { icon:"👨‍👩‍👧", title:"Familie", desc:"Opret profiler for børn og partner — se allergencheck for alle på én gang." },
              { icon:"✏️", title:"E-numre og diæter", desc:"Brug 'Tilføj eget' for intoleranser, E-numre eller diæter der ikke er på listen." },
            ]},
            "madpas": { title:"🌍 Madpas", tips:[
              { icon:"🌐", title:"Vælg sprog", desc:"Vælg sproget for landet du besøger. EatSafe oversætter dine allergier automatisk." },
              { icon:"📋", title:"Vis til tjeneren", desc:"Tryk 'Vis til tjener' for en stor, tydelig skærm du kan vise restaurantpersonalet." },
              { icon:"🔊", title:"Oplæsning", desc:"Tryk højttalerikonet for at høre udtalen på det lokale sprog." },
            ]},
          };
          const content = helpContent[screen] || { title:"ℹ️ Hjælp", tips:[
            { icon:"💬", title:"Send feedback", desc:"Brug Feedback-knappen øverst til at rapportere problemer eller forslag." },
          ]};
          return (
            <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end" }}
              onClick={e => e.target === e.currentTarget && setHelpOpen(false)}>
              <div style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"80vh", overflowY:"auto" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <div style={{ fontSize:18, fontWeight:900, color:"var(--ink)" }}>{content.title}</div>
                  <button onClick={() => setHelpOpen(false)}
                    style={{ background:"var(--paper2)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--muted)" }}>×</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                  {content.tips.map((tip, i) => (
                    <div key={i} style={{ display:"flex", gap:12, padding:"12px 14px", background:"#fff", border:"1px solid var(--border)", borderRadius:12 }}>
                      <div style={{ fontSize:22, flexShrink:0 }}>{tip.icon}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:3 }}>{tip.title}</div>
                        <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>{tip.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setHelpOpen(false); setFeedbackOpen(true); setFeedbackDone(false); }}
                  style={{ width:"100%", padding:"12px", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--muted2)", cursor:"pointer" }}>
                  💬 Send feedback eller rapportér fejl
                </button>
              </div>
            </div>
          );
        })()}

        {/* ══ SLET KONTO MODAL ══ */}
        {showDeleteAccount && (
          <div style={{ position:"fixed", inset:0, zIndex:9997, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"flex-end" }}
            onClick={e => e.target === e.currentTarget && setShowDeleteAccount(false)}>
            <div style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0", padding:"24px 16px 40px", width:"100%" }}
              onClick={e => e.stopPropagation()}>

              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ fontSize:48, marginBottom:10 }}>⚠️</div>
                <div style={{ fontSize:19, fontWeight:900, color:"var(--red)", marginBottom:8 }}>Slet din konto</div>
                <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.7 }}>
                  Dette sletter permanent alle dine data — allergier, familie, historik og præferencer. Handlingen kan ikke fortrydes.
                </div>
              </div>

              {/* Hvad slettes */}
              <div style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--red)", marginBottom:8 }}>FØLGENDE DATA SLETTES:</div>
                {["Din profil og login","Allergier og præferencer","Familiemedlemmer","Scanningshistorik","Indkøbslister","Feedback og tickets"].map(item => (
                  <div key={item} style={{ fontSize:12, color:"var(--red)", padding:"3px 0", display:"flex", gap:8 }}>
                    <span>✗</span><span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Bekræftelse */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>
                  Skriv <strong>"slet"</strong> for at bekræfte:
                </div>
                <input
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="slet"
                  autoCapitalize="none"
                  style={{ width:"100%", padding:"13px 14px", border:`1.5px solid ${deleteConfirmText.toLowerCase()==="slet" ? "var(--red)" : "var(--border2)"}`, borderRadius:12, fontFamily:"var(--f)", fontSize:16, outline:"none", boxSizing:"border-box", background:"#fff", color:"var(--ink)" }}
                />
              </div>

              <button onClick={deleteOwnAccount}
                disabled={deleteConfirmText.toLowerCase() !== "slet" || deletingAccount}
                style={{ width:"100%", padding:"15px", background: deleteConfirmText.toLowerCase()==="slet" ? "var(--red)" : "var(--border2)", border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:15, fontWeight:800, color:"#fff", cursor: deleteConfirmText.toLowerCase()==="slet" ? "pointer" : "not-allowed", marginBottom:10 }}>
                {deletingAccount ? "Sletter…" : "🗑️ Slet min konto permanent"}
              </button>

              <button onClick={() => setShowDeleteAccount(false)}
                style={{ width:"100%", padding:"13px", background:"none", border:"none", fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--muted)", cursor:"pointer" }}>
                Annullér — behold min konto
              </button>

            </div>
          </div>
        )}

        {/* ══ FEEDBACK MODAL ══ */}
        {feedbackOpen && (
          <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end" }}
            onClick={e => e.target === e.currentTarget && setFeedbackOpen(false)}>
            <div style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"85vh", overflowY:"auto" }}
              onClick={e => e.stopPropagation()}>

              {feedbackDone ? (
                <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🙏</div>
                  <div style={{ fontSize:18, fontWeight:900, color:"var(--ink)" }}>Tak for din feedback!</div>
                  <div style={{ fontSize:13, color:"var(--muted)", marginTop:6 }}>Vi kigger på det hurtigst muligt.</div>
                </div>
              ) : (
                <>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                    <div>
                      <div style={{ fontSize:17, fontWeight:900, color:"var(--ink)" }}>Send feedback</div>
                      <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>Skærm: {screen} · Beta v1.0</div>
                    </div>
                    <button onClick={() => setFeedbackOpen(false)}
                      style={{ background:"var(--paper2)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--muted)" }}>×</button>
                  </div>

                  {/* Type dropdown */}
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--ink)", display:"block", marginBottom:6 }}>Type</label>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {[
                        { id:"bug",        emoji:"🐛", label:"Fejl / bug" },
                        { id:"ui",         emoji:"🎨", label:"Design / UI" },
                        { id:"missing",    emoji:"💡", label:"Mangler noget" },
                        { id:"content",    emoji:"📦", label:"Forkert indhold" },
                        { id:"crash",      emoji:"💥", label:"App crasher" },
                        { id:"suggestion", emoji:"✨", label:"Forslag" },
                      ].map(t => (
                        <div key={t.id} onClick={() => setFeedbackType(t.id)}
                          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, cursor:"pointer",
                            border:`1.5px solid ${feedbackType===t.id?"var(--ink)":"var(--border)"}`,
                            background: feedbackType===t.id ? "var(--ink)" : "#fff" }}>
                          <span style={{ fontSize:16 }}>{t.emoji}</span>
                          <span style={{ fontSize:12, fontWeight:700, color: feedbackType===t.id ? "#fff" : "var(--ink2)" }}>{t.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Beskrivelse */}
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--ink)", display:"block", marginBottom:6 }}>Beskriv problemet</label>
                    <textarea
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      rows={4}
                      placeholder="Fx. 'Når jeg trykker på X sker der Y…' — jo mere detail, jo bedre"
                      style={{ width:"100%", padding:"12px 14px", border:"1.5px solid var(--border2)", borderRadius:12, background:"var(--paper2)", fontFamily:"var(--f)", fontSize:14, color:"var(--ink)", resize:"none", outline:"none", lineHeight:1.6, boxSizing:"border-box" }}
                    />
                  </div>

                  {/* Vedhæft billede */}
                  <div style={{ marginBottom:16 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--ink)", display:"block", marginBottom:6 }}>Skærmbillede (valgfrit)</label>
                    {feedbackImage ? (
                      <div style={{ position:"relative", display:"inline-block" }}>
                        <img src={feedbackImage} alt="Screenshot" style={{ maxWidth:"100%", maxHeight:160, borderRadius:10, objectFit:"contain", border:"1px solid var(--border)" }} />
                        <button onClick={() => { setFeedbackImage(null); setFeedbackImageB64(null); }}
                          style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,.6)", border:"none", borderRadius:"50%", width:24, height:24, color:"#fff", cursor:"pointer", fontSize:14 }}>×</button>
                      </div>
                    ) : (
                      <label style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 14px", border:"1.5px dashed var(--border2)", borderRadius:12, cursor:"pointer", background:"var(--paper2)" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        <span style={{ fontSize:13, color:"var(--muted)" }}>Tag skærmbillede eller vælg fra galleri</span>
                        <input type="file" accept="image/*" style={{ display:"none" }} onChange={async e => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setFeedbackImage(URL.createObjectURL(f));
                          const b64 = await new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(f); });
                          setFeedbackImageB64(b64);
                        }} />
                      </label>
                    )}
                  </div>

                  {/* Auto-context info */}
                  <div style={{ background:"var(--paper2)", borderRadius:10, padding:"10px 12px", marginBottom:14 }}>
                    <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, marginBottom:4 }}>📊 Automatisk inkluderet diagnostik</div>
                    <div style={{ fontSize:10, color:"var(--muted)", lineHeight:1.7 }}>
                      Skærm: <b>{screen}</b> · Bruger: <b>{user?.name || "anonym"}</b> · Enhed: <b>{/iPhone|iPad/.test(navigator.userAgent)?"iOS":/Android/.test(navigator.userAgent)?"Android":"Desktop"}</b> · Viewport: <b>{window.innerWidth}×{window.innerHeight}</b>
                    </div>
                  </div>

                  <button onClick={submitFeedback} disabled={feedbackSending || !feedbackText.trim()}
                    style={{ width:"100%", background: feedbackText.trim() ? "var(--ink)" : "var(--border2)", border:"none", borderRadius:12, padding:"15px", fontFamily:"var(--f)", fontSize:15, fontWeight:800, color:"#fff", cursor: feedbackText.trim() ? "pointer" : "not-allowed" }}>
                    {feedbackSending ? "Sender…" : "Send feedback →"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ HJEM ══ */}
        {/* ══ SCANNER SCREENS ══ */}
        {(screen === SCREENS.HOME || screen === SCREENS.RESULT || screen === SCREENS.NOTFOUND || screen === SCREENS.SUBMITTED || screen === SCREENS.SEARCH || screen === SCREENS.LIST || screen === SCREENS.SUGGEST_EDIT) && (
          <ScannerScreen
            screen={screen} setScreen={setScreen}
            scanResult={scanResult} notFoundEan={notFoundEan}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            searchResults={searchResults} setSearchResults={setSearchResults}
            searchCategory={searchCategory} setSearchCategory={setSearchCategory}
            scanError={scanError}
            shoppingList={shoppingList} newItemName={newItemName} setNewItemName={setNewItemName}
            history={history} favorites={favorites}
            family={family} activeProfiles={activeProfiles} setActiveProfiles={setActiveProfiles}
            allergens={allergens} customAllerg={customAllerg}
            accessToken={accessToken} userId={userId} user={user}
            notFoundStep={notFoundStep} setNotFoundStep={setNotFoundStep}
            proposedName={proposedName} setProposedName={setProposedName}
            proposedFlags={proposedFlags} setProposedFlags={setProposedFlags}
            ocrLoading={ocrLoading} ocrText={ocrText} setOcrText={setOcrText}
            productImagePreview={productImagePreview}
            submitting={submitting} submitProduct={submitProduct}
            editStep={editStep} setEditStep={setEditStep}
            editType={editType} setEditType={setEditType}
            editNote={editNote} setEditNote={setEditNote}
            editIngText={editIngText} setEditIngText={setEditIngText}
            showIng={showIng} setShowIng={setShowIng}
            showNutrition={showNutrition} setShowNutrition={setShowNutrition}
            showManualEan={showManualEan} setShowManualEan={setShowManualEan}
            showSafeOnly={showSafeOnly} setShowSafeOnly={setShowSafeOnly}
            profilePopup={profilePopup} setProfilePopup={setProfilePopup}
            greeting={greeting}
            cameraActive={cameraActive} setCameraActive={setCameraActive}
            galleryInputRef={galleryInputRef}
            lastScannedRef={lastScannedRef}
            addToList={addToList}
            handleEditProductCapture={handleEditProductCapture}
            handleImageCapture={handleImageCapture}
            handleProductImageCapture={handleProductImageCapture}
            toggleFavorite={toggleFavorite}
            clearDone={clearDone}
            editProductImage={editProductImage}
            isFavorite={isFavorite}
            removeItem={removeItem}
            scanFromGallery={scanFromGallery}
            searchLoading={searchLoading}
            startCamera={startCamera}
            stopCamera={stopCamera}
            toggleItem={toggleItem}
            toggleTorch={toggleTorch}
            torchOn={torchOn}
          />
        )}

        {/* ══ MADPAS SCREEN ══ */}
        {(screen === SCREENS.MADPAS || madpasWaiterView) && (
          <MadpasScreen
            screen={screen}
            madpasLang={madpasLang} setMadpasLang={setMadpasLang}
            madpasProfileId={madpasProfileId} setMadpasProfileId={setMadpasProfileId}
            madpasSpeaking={madpasSpeaking} setMadpasSpeaking={setMadpasSpeaking}
            madpasBig={madpasBig}
            madpasWaiterView={madpasWaiterView} setMadpasWaiterView={setMadpasWaiterView}
            mpAllergens={mpAllergens} mpCustom={mpCustom}
            family={family} user={user}
            langOpen={langOpen} setLangOpen={setLangOpen}
            madpasSpeak={madpasSpeak}
            selectedENumbers={selectedENumbers}
          />
        )}

        {/* ══ PROFILE SCREENS ══ */}
        {(screen === SCREENS.HISTORY || screen === SCREENS.PROFILE ||
          screen === SCREENS.FAVORITES || screen === SCREENS.EDITPROFILE ||
          screen === SCREENS.FAMILY) && (
          <ProfileScreen
            screen={screen} setScreen={setScreen}
            user={user} setUser={setUser}
            allergens={allergens} setAllergens={setAllergens}
            customAllerg={customAllerg} setCustomAllerg={setCustomAllerg}
            family={family} setFamily={setFamily}
            activeProfiles={activeProfiles} setActiveProfiles={setActiveProfiles}
            history={history} favorites={favorites}
            userId={userId} accessToken={accessToken}
            showDeleteAccount={showDeleteAccount} setShowDeleteAccount={setShowDeleteAccount}
            deleteConfirmText={deleteConfirmText} setDeleteConfirmText={setDeleteConfirmText}
            deletingAccount={deletingAccount} deleteOwnAccount={deleteOwnAccount}
            clearAuth={clearAuth}
            eSearch={eSearch} setESearch={setESearch}
            eCategory={eCategory} setECategory={setECategory}
            allergenSubtypes={allergenSubtypes} setAllergenSubtypes={setAllergenSubtypes}
            loadHistory={loadHistory}
            selectedENumbers={selectedENumbers} setSelectedENumbers={setSelectedENumbers}
            activeSubtypeModal={activeSubtypeModal} setActiveSubtypeModal={setActiveSubtypeModal}
            customInput={customInput} setCustomInput={setCustomInput}
            newMemberName={newMemberName} setNewMemberName={setNewMemberName}
            newMemberAllerg={newMemberAllerg} setNewMemberAllerg={setNewMemberAllerg}
            newMemberCustomAllerg={newMemberCustomAllerg} setNewMemberCustomAllerg={setNewMemberCustomAllerg}
            newMemberDiets={newMemberDiets} setNewMemberDiets={setNewMemberDiets}
            newMemberENumbers={newMemberENumbers} setNewMemberENumbers={setNewMemberENumbers}
            newMemberSubtypes={newMemberSubtypes} setNewMemberSubtypes={setNewMemberSubtypes}
            newMemberCustomInput={newMemberCustomInput} setNewMemberCustomInput={setNewMemberCustomInput}
            addMember={addMember} removeMember={removeMember}
            ticketsLoading={ticketsLoading}
            setScanResult={setScanResult}
            historyLoading={historyLoading}
            loadAdminStats={loadAdminStats} loadSubmissions={loadSubmissions} loadTickets={loadTickets}
            setAdminSection={setAdminSection} setSubmissionFilter={setSubmissionFilter}
          />
        )}

        {/* ══ RECIPES SCREEN ══ */}
        {screen === SCREENS.RECIPES && (
          <RecipesScreen
            screen={screen} setScreen={setScreen}
            recipes={recipes} recipesLoading={recipesLoading}
            selectedRecipe={selectedRecipe} setSelectedRecipe={setSelectedRecipe}
            recipeSearch={recipeSearch} setRecipeSearch={setRecipeSearch}
            showSafeOnly={showSafeOnly} setShowSafeOnly={setShowSafeOnly}
            allergens={allergens} customAllerg={customAllerg}
            family={family} activeProfiles={activeProfiles}
            favorites={favorites} accessToken={accessToken}
            showSubmitRecipe={showSubmitRecipe} setShowSubmitRecipe={setShowSubmitRecipe}
            submitRecipe={submitRecipe} setSubmitRecipe={setSubmitRecipe}
            submitSteps={submitSteps} setSubmitSteps={setSubmitSteps}
            submitIngredients={submitIngredients} setSubmitIngredients={setSubmitIngredients}
            submittingRecipe={submittingRecipe}
            loadRecipes={loadRecipes} loadRecipeIngredients={loadRecipeIngredients}
            loading={loading}
            toggleFavorite={toggleFavorite}
            user={user}
            recipeFilter={recipeFilter} setRecipeFilter={setRecipeFilter}
            recipeSafeOnly={recipeSafeOnly} setRecipeSafeOnly={setRecipeSafeOnly}
            favoriteRecipes={favoriteRecipes} setFavoriteRecipes={setFavoriteRecipes}
            activeIds={allActive().ids}
            completedSteps={completedSteps} setCompletedSteps={setCompletedSteps}
            recipeServings={recipeServings} setRecipeServings={setRecipeServings}
            setRecipes={setRecipes}
            addToList={addToList}
          />
        )}

        {/* ALLERGEN SUBTYPE MODAL */}
        {activeSubtypeModal && (
          <SubtypeModal
            allergenId={activeSubtypeModal}
            selectedSubtypes={allergenSubtypes[activeSubtypeModal] || []}
            onToggle={(id) => setAllergenSubtypes(s => {
              const cur = s[activeSubtypeModal] || [];
              return { ...s, [activeSubtypeModal]: cur.includes(id) ? cur.filter(x=>x!==id) : [...cur, id] };
            })}
            onClose={() => setActiveSubtypeModal(null)}
          />
        )}

        {/* BUNDNAVIGATION */}
        {!isOnboard && !madpasWaiterView && (
          <nav className="bottom-nav" role="navigation" aria-label="Hovednavigation">
            {[
              [SCREENS.RECIPES, "recipes",  "Opskrifter"],
              [SCREENS.LIST,    "cart",     "Indkøbsliste"],
              [SCREENS.HOME,    "home",     "Hjem"],
              [SCREENS.MADPAS,  "globe",    "Madpas"],
              [SCREENS.PROFILE, "profile",  "Profil"],
            ].map(([s,icon,lbl]) => (
              <div key={s} className={`nav-item${(
                screen===s ||
                (screen===SCREENS.RESULT && s===SCREENS.HOME) ||
                (screen===SCREENS.NOTFOUND && s===SCREENS.HOME) ||
                (screen===SCREENS.SUBMITTED && s===SCREENS.HOME) ||
                (screen===SCREENS.SEARCH && s===SCREENS.HOME) ||
                (screen===SCREENS.HISTORY && s===SCREENS.PROFILE) ||
                (screen===SCREENS.FAVORITES && s===SCREENS.PROFILE) ||
                (screen===SCREENS.FAMILY && s===SCREENS.PROFILE) ||
                (screen===SCREENS.ADMIN && s===SCREENS.PROFILE)
              )?" active":""}`}
                onClick={() => setScreen(s)}
                role="button"
                aria-label={lbl}
                aria-current={screen===s ? "page" : undefined}
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setScreen(s)}>
                <div className="nav-icon"><Icon name={icon} size={22} /></div>
                <div className="nav-lbl">{lbl}</div>
              </div>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}