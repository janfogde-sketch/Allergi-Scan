// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';

// ─── Data ────────────────────────────────────────────────────────────────────
const ALLERGENS = [
  {
    id: 'gluten',
    label: 'Gluten',
    emoji: '🌾',
    desc: 'Hvede, rug, byg, spelt',
  },
  {
    id: 'laktose',
    label: 'Laktose / Mælk',
    emoji: '🥛',
    desc: 'Mælk, ost, smør, fløde',
  },
  {
    id: 'aeg',
    label: 'Æg',
    emoji: '🥚',
    desc: 'Hele æg, æggehvide, æggeblomme',
  },
  {
    id: 'noedder',
    label: 'Nødder',
    emoji: '🥜',
    desc: 'Jordnødder, mandler, valnødder mv.',
  },
  { id: 'soja', label: 'Soja', emoji: '🫘', desc: 'Sojabønner, sojamælk, tofu' },
  { id: 'fisk', label: 'Fisk', emoji: '🐟', desc: 'Alle fiskearter' },
  {
    id: 'skaldyr',
    label: 'Skaldyr',
    emoji: '🦐',
    desc: 'Rejer, krabber, muslinger',
  },
  {
    id: 'selleri',
    label: 'Selleri',
    emoji: '🥬',
    desc: 'Selleri, selleriolie, sellerisalt',
  },
  {
    id: 'sennep',
    label: 'Sennep',
    emoji: '🌶️',
    desc: 'Sennepsfrø, sennepspulver',
  },
  {
    id: 'sesam',
    label: 'Sesam',
    emoji: '🌿',
    desc: 'Sesamfrø, tahini, sesamolie',
  },
  {
    id: 'svovl',
    label: 'Sulfitter',
    emoji: '🍷',
    desc: 'Tørret frugt, vin, syltetøj',
  },
  { id: 'lupin', label: 'Lupin', emoji: '🌸', desc: 'Lupinfrø, lupinmel' },
];

const SUPERMARKETS = [
  { id: 'netto', label: 'Netto', emoji: '🟡' },
  { id: 'foetex', label: 'Føtex', emoji: '🔵' },
  { id: 'bilka', label: 'Bilka', emoji: '🔴' },
  { id: 'irma', label: 'Irma', emoji: '🟢' },
  { id: 'meny', label: 'Meny', emoji: '🟣' },
  { id: 'rema', label: 'Rema 1000', emoji: '⚫' },
  { id: 'aldi', label: 'Aldi', emoji: '🔵' },
  { id: 'lidl', label: 'Lidl', emoji: '🟠' },
];

const DEMO_CODES = [
  { code: '3017620422003', label: 'Nutella' },
  { code: '5449000054227', label: 'Coca-Cola' },
  { code: '7394376616566', label: 'Oatly' },
  { code: '8000500310427', label: 'Ferrero' },
  { code: '5701029015306', label: 'Lurpak' },
];

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Øko Havremælk',
    brand: 'Oatly',
    emoji: '🥛',
    allergens: ['gluten'],
    safe_for: ['laktose'],
    stores: ['netto', 'foetex', 'meny'],
    category: 'Drikkevarer',
  },
  {
    id: 2,
    name: 'Glutenfri Brød',
    brand: 'Schär',
    emoji: '🍞',
    allergens: ['aeg'],
    safe_for: ['gluten'],
    stores: ['foetex', 'bilka', 'irma'],
    category: 'Brød & bagværk',
  },
  {
    id: 3,
    name: 'Alpro Soja Drink',
    brand: 'Alpro',
    emoji: '🫘',
    allergens: ['soja'],
    safe_for: ['laktose', 'gluten'],
    stores: ['netto', 'meny', 'rema'],
    category: 'Drikkevarer',
  },
  {
    id: 4,
    name: 'Lurpak Smør',
    brand: 'Arla',
    emoji: '🧈',
    allergens: ['laktose'],
    safe_for: ['gluten'],
    stores: ['netto', 'foetex', 'bilka', 'rema'],
    category: 'Mejeri',
  },
  {
    id: 5,
    name: 'Røget Laks',
    brand: 'Læsø Laks',
    emoji: '🐟',
    allergens: ['fisk'],
    safe_for: ['gluten', 'laktose'],
    stores: ['netto', 'foetex'],
    category: 'Fisk',
  },
  {
    id: 6,
    name: 'Cashewnødder',
    brand: 'Sæson',
    emoji: '🥜',
    allergens: ['noedder'],
    safe_for: ['gluten', 'laktose'],
    stores: ['netto', 'foetex', 'irma'],
    category: 'Snacks',
  },
  {
    id: 7,
    name: 'Ris Naturel',
    brand: "Uncle Ben's",
    emoji: '🍚',
    allergens: [],
    safe_for: ['gluten', 'laktose', 'noedder', 'soja', 'aeg'],
    stores: ['netto', 'foetex', 'bilka', 'rema', 'aldi'],
    category: 'Korn & ris',
  },
  {
    id: 8,
    name: 'Æble Juice',
    brand: 'Rynkeby',
    emoji: '🍎',
    allergens: [],
    safe_for: ['gluten', 'laktose', 'noedder'],
    stores: ['netto', 'foetex', 'bilka', 'rema'],
    category: 'Drikkevarer',
  },
  {
    id: 9,
    name: 'Kokosmælk',
    brand: 'Aroy-D',
    emoji: '🥥',
    allergens: [],
    safe_for: ['gluten', 'laktose', 'noedder', 'soja'],
    stores: ['foetex', 'bilka', 'meny'],
    category: 'Madlavning',
  },
  {
    id: 10,
    name: 'Havre Grød',
    brand: 'Naturli',
    emoji: '🥣',
    allergens: ['gluten'],
    safe_for: ['laktose'],
    stores: ['netto', 'foetex', 'rema', 'aldi'],
    category: 'Morgenmad',
  },
];

const SCREENS = {
  ONBOARD: 'onboard',
  HOME: 'home',
  SCAN: 'scan',
  SEARCH: 'search',
  LIST: 'list',
  PROFILE: 'profile',
  FAMILY: 'family',
  RESULT: 'result',
};
const AVATAR_COLORS = [
  '#52b788',
  '#74c69d',
  '#40916c',
  '#b7e4c7',
  '#2d6a4f',
  '#95d5b2',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const initials = (n) =>
  n
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
const timeAgo = (ts) => {
  const d = Date.now() - ts;
  if (d < 60000) return 'lige nu';
  if (d < 3600000) return `${Math.floor(d / 60000)} min siden`;
  if (d < 86400000) return `${Math.floor(d / 3600000)} t siden`;
  return `${Math.floor(d / 86400000)} d siden`;
};
const getAllergenLabels = (ids, custom = []) => [
  ...ids
    .map((id) => ALLERGENS.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => `${a.emoji} ${a.label}`),
  ...custom.map((c) => `✏️ ${c}`),
];
const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const save = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

// ─── CSS ─────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Lato:wght@300;400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#f0f4f0;--surface:#fff;--surface2:#e8ede8;--border:#d4ddd4;
  --g1:#1b4332;--g2:#2d6a4f;--g3:#40916c;--g4:#52b788;--g5:#95d5b2;--g6:#d8f3dc;
  --red:#c1121f;--red-lt:#ffe0e1;--amber:#e76f00;--amber-lt:#fff0d9;
  --blue:#1565c0;--blue-lt:#e3eeff;
  --text:#0f2318;--text2:#2d5016;--muted:#6b8f6b;
  --r:14px;--fh:'Nunito',sans-serif;--fb:'Lato',sans-serif;
  --sh:0 2px 8px rgba(27,67,50,.10);--sh2:0 6px 24px rgba(27,67,50,.16);
}
body{background:var(--bg);color:var(--text);font-family:var(--fb);min-height:100vh;}
.app{max-width:430px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--bg);position:relative;}

.topbar{background:var(--g1);padding:14px 18px 12px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:60;}
.topbar-logo{display:flex;align-items:center;gap:8px;}
.topbar-icon{width:32px;height:32px;background:var(--g4);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;}
.topbar-name{font-family:var(--fh);font-size:18px;font-weight:900;color:#fff;letter-spacing:-.3px;}
.topbar-name span{color:var(--g5);}
.topbar-right{display:flex;align-items:center;gap:8px;}
.topbar-avatar{width:32px;height:32px;background:var(--g4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--g1);cursor:pointer;border:2px solid var(--g5);}

.screen{flex:1;padding:0 16px 90px;}
.screen-title{font-family:var(--fh);font-size:22px;font-weight:900;color:var(--text);margin:20px 0 4px;}
.screen-sub{font-size:13px;color:var(--muted);margin-bottom:18px;line-height:1.5;}

.bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:430px;background:var(--surface);border-top:1px solid var(--border);display:flex;padding:8px 0 20px;z-index:100;box-shadow:0 -4px 16px rgba(0,0,0,.07);}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;opacity:.38;transition:opacity .15s;}
.nav-item.active{opacity:1;}
.nav-icon{width:44px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:10px;font-size:21px;transition:background .15s;}
.nav-item.active .nav-icon{background:var(--g6);}
.nav-lbl{font-size:10px;font-weight:700;font-family:var(--fh);color:var(--g2);letter-spacing:.2px;}

.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:12px;box-shadow:var(--sh);}
.card-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.3px;color:var(--muted);margin-bottom:10px;}
.card-title{font-family:var(--fh);font-size:16px;font-weight:800;color:var(--text);margin-bottom:4px;}

.field{width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:11px;padding:11px 14px;color:var(--text);font-family:var(--fb);font-size:15px;outline:none;transition:border-color .18s,box-shadow .18s;}
.field:focus{border-color:var(--g4);box-shadow:0 0 0 3px rgba(82,183,136,.15);}
.field-lbl{font-size:12px;font-weight:700;color:var(--text2);margin-bottom:5px;display:block;}
.input-row{display:flex;gap:8px;}

.btn{padding:13px 20px;border-radius:11px;border:none;font-family:var(--fh);font-size:15px;font-weight:800;cursor:pointer;transition:all .18s;display:inline-flex;align-items:center;justify-content:center;gap:7px;}
.btn-full{width:100%;}
.btn-primary{background:var(--g2);color:#fff;box-shadow:0 4px 14px rgba(45,106,79,.28);}
.btn-primary:hover{background:var(--g3);transform:translateY(-1px);}
.btn-outline{background:transparent;color:var(--g2);border:1.5px solid var(--g2);}
.btn-outline:hover{background:var(--g6);}
.btn-danger{background:transparent;color:var(--red);border:1.5px solid var(--red);}
.btn-sm{padding:8px 14px;font-size:13px;border-radius:9px;}
.btn-ghost{background:var(--surface2);color:var(--text2);border:1px solid var(--border);}
.btn-ghost:hover{background:var(--g6);}

.chip-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
.chip{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:11px;border:1.5px solid var(--border);background:var(--surface2);cursor:pointer;transition:all .18s;font-size:13px;font-weight:600;color:var(--muted);user-select:none;}
.chip:hover{border-color:var(--g4);}
.chip.on{border-color:var(--g3);background:var(--g6);color:var(--g2);}
.chip-check{margin-left:auto;width:17px;height:17px;background:var(--g3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;flex-shrink:0;}

.tags{display:flex;flex-wrap:wrap;gap:6px;}
.tag{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;background:var(--g6);border:1px solid rgba(82,183,136,.3);border-radius:100px;font-size:12px;color:var(--g2);font-weight:700;}
.tag.red{background:var(--red-lt);border-color:rgba(193,18,31,.2);color:var(--red);}
.tag-x{cursor:pointer;opacity:.5;font-size:13px;}.tag-x:hover{opacity:1;}

.badge{font-size:11px;font-weight:800;padding:3px 9px;border-radius:100px;}
.badge.safe{background:var(--g6);color:var(--g2);}
.badge.danger{background:var(--red-lt);color:var(--red);}
.badge.warn{background:var(--amber-lt);color:var(--amber);}

.onboard-wrap{padding:0 16px 100px;}
.onboard-hero{text-align:center;padding:36px 0 28px;}
.onboard-logo{width:80px;height:80px;background:var(--g2);border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:38px;margin:0 auto 18px;box-shadow:0 10px 30px rgba(45,106,79,.30);}
.onboard-hero h1{font-family:var(--fh);font-size:30px;font-weight:900;color:var(--text);line-height:1.15;margin-bottom:8px;}
.onboard-hero h1 span{color:var(--g3);}
.onboard-hero p{font-size:14px;color:var(--muted);line-height:1.6;}
.step-dot-row{display:flex;justify-content:center;gap:6px;margin-bottom:24px;}
.step-dot{width:8px;height:8px;border-radius:50%;background:var(--border);transition:all .2s;}
.step-dot.active{background:var(--g3);width:20px;border-radius:4px;}
.step-title{font-family:var(--fh);font-size:18px;font-weight:900;margin-bottom:6px;color:var(--text);}
.step-sub{font-size:13px;color:var(--muted);margin-bottom:18px;line-height:1.5;}

.home-header{background:var(--g1);padding:20px 18px 28px;}
.home-greeting{font-size:13px;color:rgba(255,255,255,.6);font-weight:500;}
.home-name{font-family:var(--fh);font-size:24px;font-weight:900;color:#fff;margin-top:2px;}
.home-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;}
.stat-card{background:rgba(255,255,255,.10);border-radius:13px;padding:13px 14px;border:1px solid rgba(255,255,255,.12);}
.stat-num{font-family:var(--fh);font-size:26px;font-weight:900;color:#fff;}
.stat-lbl{font-size:11px;color:rgba(255,255,255,.55);margin-top:1px;font-weight:600;}

.quick-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
.qa-btn{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 14px;display:flex;flex-direction:column;align-items:flex-start;gap:7px;cursor:pointer;transition:all .18s;box-shadow:var(--sh);}
.qa-btn:hover{transform:translateY(-2px);box-shadow:var(--sh2);border-color:var(--g4);}
.qa-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;}
.qa-icon.green{background:var(--g6);}.qa-icon.blue{background:var(--blue-lt);}.qa-icon.amber{background:var(--amber-lt);}.qa-icon.red{background:var(--red-lt);}
.qa-title{font-family:var(--fh);font-size:14px;font-weight:800;color:var(--text);}
.qa-sub{font-size:11px;color:var(--muted);}

.scanner-btn{background:var(--g2);border-radius:18px;padding:24px 20px;text-align:center;cursor:pointer;transition:all .2s;box-shadow:var(--sh2);margin-bottom:14px;position:relative;overflow:hidden;}
.scanner-btn::before{content:'';position:absolute;top:-50px;right:-50px;width:180px;height:180px;background:rgba(255,255,255,.06);border-radius:50%;}
.scanner-btn:hover{transform:translateY(-2px);}
.scan-icon-big{font-size:50px;margin-bottom:10px;position:relative;z-index:1;}
.scan-title{font-family:var(--fh);font-size:18px;font-weight:900;color:#fff;position:relative;z-index:1;}
.scan-sub{font-size:12px;color:rgba(255,255,255,.6);margin-top:3px;position:relative;z-index:1;}
.scan-bars{display:flex;gap:3px;align-items:flex-end;justify-content:center;height:50px;margin:8px 0;position:relative;z-index:1;}
.scan-bar{width:4px;background:rgba(255,255,255,.5);border-radius:2px;animation:barP 1.3s ease-in-out infinite;}
@keyframes barP{0%,100%{height:14px;opacity:.35;}50%{height:44px;opacity:1;}}
.scan-beam{position:absolute;left:10%;right:10%;height:2px;background:linear-gradient(90deg,transparent,#fff,transparent);animation:beam 1.8s ease-in-out infinite;box-shadow:0 0 8px rgba(255,255,255,.8);z-index:2;}
@keyframes beam{0%{top:12%;opacity:0;}20%{opacity:1;}80%{opacity:1;}100%{top:88%;opacity:0;}}
.scan-line-wrap{position:relative;height:60px;}

.result-banner{border-radius:16px;padding:18px;margin-bottom:12px;display:flex;align-items:center;gap:14px;}
.result-banner.safe{background:var(--g6);border:1.5px solid var(--g4);}
.result-banner.danger{background:var(--red-lt);border:1.5px solid var(--red);}
.result-banner.warn{background:var(--amber-lt);border:1.5px solid var(--amber);}
.rb-icon{font-size:40px;flex-shrink:0;}
.rb-title{font-family:var(--fh);font-size:20px;font-weight:900;}
.rb-title.safe{color:var(--g2);}.rb-title.danger{color:var(--red);}.rb-title.warn{color:var(--amber);}
.rb-sub{font-size:12px;color:var(--muted);margin-top:3px;font-weight:600;}
.flag{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:10px;font-size:13px;font-weight:700;margin-bottom:7px;}
.flag.bad{background:var(--red-lt);color:var(--red);}
.flag.maybe{background:var(--amber-lt);color:var(--amber);}
.flag.good{background:var(--g6);color:var(--g2);}
.ing-toggle{display:flex;align-items:center;justify-content:space-between;padding:10px 0;cursor:pointer;font-size:13px;font-weight:700;color:var(--text2);border-top:1px solid var(--border);margin-top:10px;}
.ing-text{font-size:12px;color:var(--muted);line-height:1.7;padding:8px 0;max-height:80px;overflow-y:auto;}
.summary-txt{font-size:13px;color:var(--text2);line-height:1.7;}

.list-item{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;margin-bottom:8px;box-shadow:var(--sh);}
.list-item.done{opacity:.45;}
.list-check{width:22px;height:22px;border-radius:7px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .2s;font-size:12px;}
.list-check.checked{background:var(--g3);border-color:var(--g3);color:#fff;}
.list-name{flex:1;font-size:14px;font-weight:700;}
.list-name.done{text-decoration:line-through;color:var(--muted);}
.list-store{font-size:11px;color:var(--muted);}
.list-del{font-size:16px;cursor:pointer;opacity:.35;padding:4px;}.list-del:hover{opacity:1;}
.list-section{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:var(--muted);margin:14px 0 7px;}
.empty-list{text-align:center;padding:40px 20px;color:var(--muted);}
.empty-icon{font-size:48px;margin-bottom:12px;}.empty-txt{font-size:14px;font-weight:600;}.empty-sub{font-size:12px;margin-top:4px;opacity:.7;}

.filter-chip{padding:6px 13px;border-radius:100px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted);}
.filter-chip.active{border-color:var(--g3);background:var(--g6);color:var(--g2);}
.product-card{background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px;margin-bottom:10px;box-shadow:var(--sh);display:flex;align-items:center;gap:12px;transition:all .18s;}
.product-card:hover{transform:translateY(-1px);box-shadow:var(--sh2);}
.product-emoji{width:48px;height:48px;background:var(--surface2);border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}
.product-name{font-size:14px;font-weight:700;}.product-brand{font-size:12px;color:var(--muted);margin-top:2px;}.product-stores{font-size:11px;color:var(--g3);margin-top:3px;font-weight:600;}

.profile-hero{background:var(--g1);border-radius:18px;padding:22px 18px;margin:16px 0 14px;display:flex;align-items:center;gap:14px;}
.pa-lg{width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:var(--g1);flex-shrink:0;border:3px solid rgba(255,255,255,.25);}
.profile-hero-name{font-family:var(--fh);font-size:20px;font-weight:900;color:#fff;}
.profile-hero-sub{font-size:12px;color:rgba(255,255,255,.55);margin-top:2px;}
.profile-edit-btn{margin-left:auto;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:9px;padding:7px 13px;font-size:12px;font-weight:800;color:#fff;cursor:pointer;font-family:var(--fh);}

.family-member{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:var(--sh);}
.fm-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;flex-shrink:0;}

.hist-row{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;}
.hist-row:last-child{border-bottom:none;}
.hist-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
.hist-dot.safe{background:var(--g4);}.hist-dot.danger{background:var(--red);}.hist-dot.warn{background:var(--amber);}
.hist-info{flex:1;min-width:0;}
.hist-name{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hist-time{font-size:11px;color:var(--muted);margin-top:1px;}

.loader{display:flex;flex-direction:column;align-items:center;gap:12px;padding:28px;background:var(--surface);border-radius:16px;box-shadow:var(--sh);margin-bottom:12px;}
.spinner{width:38px;height:38px;border:3px solid var(--g6);border-top-color:var(--g3);border-radius:50%;animation:spin .75s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.loader-txt{font-size:14px;font-weight:700;color:var(--text2);}
.loader-sub{font-size:12px;color:var(--muted);}

.error-box{background:var(--red-lt);border:1px solid var(--red);border-radius:12px;padding:12px 15px;font-size:13px;color:var(--red);font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;}

.sm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.sm-chip{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;border-radius:11px;border:1.5px solid var(--border);background:var(--surface2);cursor:pointer;transition:all .18s;font-size:11px;font-weight:700;color:var(--muted);}
.sm-chip.on{border-color:var(--g3);background:var(--g6);color:var(--g2);}
.sm-emoji{font-size:20px;}

.divider{display:flex;align-items:center;gap:10px;margin:12px 0;color:var(--muted);font-size:12px;}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border);}

.share-bar{display:flex;gap:8px;padding:12px 14px;background:var(--blue-lt);border-radius:12px;margin-bottom:12px;align-items:center;border:1px solid rgba(21,101,192,.15);}
.share-txt{flex:1;font-size:13px;color:var(--blue);font-weight:600;}

.demo-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
.demo-code{padding:5px 11px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:12px;font-weight:700;color:var(--text2);cursor:pointer;transition:all .15s;}
.demo-code:hover{border-color:var(--g4);color:var(--g2);background:var(--g6);}

.ap-chip{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:100px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted);}
.ap-chip.on{border-color:var(--g3);background:var(--g6);color:var(--g2);}

@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.fade-in{animation:fadeUp .25s ease both;}
`;

export default function AllergiScan() {
  const [screen, setScreen] = useState(SCREENS.ONBOARD);
  const [onboardStep, setOnboardStep] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState(
    load('as_user', { name: '', age: '', email: '', phone: '' })
  );
  const [allergens, setAllergens] = useState(load('as_allergens', []));
  const [customAllerg, setCustomAllerg] = useState(load('as_custom', []));
  const [family, setFamily] = useState(load('as_family', []));
  const [activeProfiles, setActiveProfiles] = useState(
    load('as_active', ['me'])
  );
  const [supermarkets, setSupermarkets] = useState(load('as_supermarkets', []));
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [showIng, setShowIng] = useState(false);
  const [history, setHistory] = useState(load('as_history', []));
  const [shoppingList, setShoppingList] = useState(load('as_list', []));
  const [newItemName, setNewItemName] = useState('');
  const [newItemStore, setNewItemStore] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStore, setSearchStore] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAllerg, setNewMemberAllerg] = useState([]);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    save('as_user', user);
  }, [user]);
  useEffect(() => {
    save('as_allergens', allergens);
  }, [allergens]);
  useEffect(() => {
    save('as_custom', customAllerg);
  }, [customAllerg]);
  useEffect(() => {
    save('as_family', family);
  }, [family]);
  useEffect(() => {
    save('as_active', activeProfiles);
  }, [activeProfiles]);
  useEffect(() => {
    save('as_supermarkets', supermarkets);
  }, [supermarkets]);
  useEffect(() => {
    save('as_history', history);
  }, [history]);
  useEffect(() => {
    save('as_list', shoppingList);
  }, [shoppingList]);
  useEffect(() => {
    if (user.name) setScreen(SCREENS.HOME);
  }, []);

  const allActive = useCallback(() => {
    const ids = new Set(allergens);
    const cust = [...customAllerg];
    family
      .filter((m) => activeProfiles.includes(m.id))
      .forEach((m) => {
        m.allergens.forEach((a) => ids.add(a));
        m.custom.forEach((c) => {
          if (!cust.includes(c)) cust.push(c);
        });
      });
    return { ids: [...ids], custom: cust };
  }, [allergens, customAllerg, family, activeProfiles]);

  const lookup = useCallback(
    async (code) => {
      if (!code.trim()) return;
      setLoading(true);
      setScanResult(null);
      setScanError('');
      setShowIng(false);
      try {
        const res = await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${code.trim()}.json`
        );
        const data = await res.json();
        if (data.status !== 1) {
          setScanError('Produktet blev ikke fundet. Prøv en anden stregkode.');
          setLoading(false);
          return;
        }
        const p = data.product;
        const name = p.product_name_da || p.product_name || 'Ukendt produkt';
        const brand = p.brands || '';
        const ingredients = p.ingredients_text_da || p.ingredients_text || '';
        const allergenTags = p.allergens_tags || [];
        const { ids: aIds, custom: aCust } = allActive();
        const allergyList = [
          ...aIds
            .map((id) => ALLERGENS.find((a) => a.id === id)?.label)
            .filter(Boolean),
          ...aCust,
        ];
        const who =
          activeProfiles.length > 1 ||
          (activeProfiles.length === 1 && activeProfiles[0] !== 'me')
            ? `Aktive profiler: ${[
                activeProfiles.includes('me') ? user.name.split(' ')[0] : null,
                ...family
                  .filter((m) => activeProfiles.includes(m.id))
                  .map((m) => m.name.split(' ')[0]),
              ]
                .filter(Boolean)
                .join(', ')}.`
            : '';
        const prompt = `Du er en præcis fødevareallergi-assistent. ${who} Allergier/intoleranser: ${
          allergyList.join(', ') || 'ingen angivet'
        }.
Produkt: ${name}\nMærke: ${brand}\nIngredienser: ${
          ingredients || '(ikke tilgængeligt)'
        }\nAllergener fra database: ${allergenTags.join(', ') || 'ingen'}
Analyser produktets sikkerhed. Svar KUN med JSON (ingen markdown): {"status":"safe"|"danger"|"warn","headline":"maks 7 ord på dansk","summary":"2 sætninger på dansk","flags":[{"type":"bad"|"maybe"|"good","text":"konkret observation på dansk"}]}`;
        const cr = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        const cd = await cr.json();
        const txt = cd.content?.map((c) => c.text || '').join('') || '';
        const analysis = JSON.parse(txt.replace(/```json|```/g, '').trim());
        const newResult = {
          code,
          name,
          brand,
          ingredients,
          ...analysis,
          timestamp: Date.now(),
        };
        setScanResult(newResult);
        setScreen(SCREENS.RESULT);
        setHistory((h) => [newResult, ...h].slice(0, 50));
      } catch {
        setScanError('Der opstod en fejl. Tjek din forbindelse og prøv igen.');
      }
      setLoading(false);
    },
    [allActive, activeProfiles, family, user]
  );

  const simulateScan = () => {
    if (scanning || loading) return;
    setScanning(true);
    const pick = DEMO_CODES[Math.floor(Math.random() * DEMO_CODES.length)];
    setTimeout(() => {
      setScanning(false);
      setBarcodeInput(pick.code);
      lookup(pick.code);
    }, 2000);
  };

  const addToList = (name, store = '') => {
    if (!name.trim()) return;
    setShoppingList((l) => [
      ...l,
      { id: uid(), name: name.trim(), store, checked: false },
    ]);
    setNewItemName('');
    setNewItemStore('');
  };
  const toggleItem = (id) =>
    setShoppingList((l) =>
      l.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  const removeItem = (id) =>
    setShoppingList((l) => l.filter((i) => i.id !== id));
  const clearDone = () => setShoppingList((l) => l.filter((i) => !i.checked));

  const addMember = () => {
    if (!newMemberName.trim()) return;
    setFamily((f) => [
      ...f,
      {
        id: uid(),
        name: newMemberName.trim(),
        allergens: newMemberAllerg,
        custom: [],
        color: AVATAR_COLORS[f.length % AVATAR_COLORS.length],
      },
    ]);
    setNewMemberName('');
    setNewMemberAllerg([]);
  };
  const removeMember = (id) => {
    setFamily((f) => f.filter((m) => m.id !== id));
    setActiveProfiles((a) => a.filter((x) => x !== id));
  };
  const toggleActive = (id) =>
    setActiveProfiles((a) =>
      a.includes(id) ? a.filter((x) => x !== id) : [...a, id]
    );
  const finishOnboard = () => {
    save('as_user', user);
    setScreen(SCREENS.HOME);
    setEditMode(false);
  };

  const { ids: activeIds } = allActive();
  const filteredProducts = MOCK_PRODUCTS.filter((p) => {
    const mQ =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const mS = !searchStore || p.stores.includes(searchStore);
    return mQ && mS;
  }).map((p) => ({
    ...p,
    conflicts: activeIds.filter((id) => p.allergens.includes(id)),
  }));

  const isOnboard = screen === SCREENS.ONBOARD || editMode;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* ── Topbar ── */}
        {!isOnboard && (
          <header className="topbar">
            <div className="topbar-logo">
              <div className="topbar-icon">🔍</div>
              <div className="topbar-name">
                Allergi <span>Scan</span>
              </div>
            </div>
            <div className="topbar-right">
              <div
                className="topbar-avatar"
                onClick={() => setScreen(SCREENS.PROFILE)}
              >
                {initials(user.name)}
              </div>
            </div>
          </header>
        )}

        {/* ══ ONBOARDING ══ */}
        {isOnboard && (
          <div className="onboard-wrap fade-in">
            {!editMode && (
              <div className="onboard-hero">
                <div className="onboard-logo">🔍</div>
                <h1>
                  Spis trygt med
                  <br />
                  <span>Allergi Scan</span>
                </h1>
                <p>
                  Din personlige allergiguide til danske supermarkeder. Opret
                  din profil på 2 minutter.
                </p>
              </div>
            )}
            {editMode && <div style={{ height: 20 }} />}
            <div className="step-dot-row">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`step-dot${onboardStep === s ? ' active' : ''}`}
                />
              ))}
            </div>

            {/* Step 1 */}
            {onboardStep === 1 && (
              <div className="card fade-in">
                <div className="step-title">👤 Fortæl os om dig</div>
                <div className="step-sub">
                  Vi bruger disse oplysninger til din profil.
                </div>
                {[
                  ['Dit navn *', 'text', 'Fx. Anna Hansen', 'name'],
                  ['Alder', 'number', 'Fx. 32', 'age'],
                  ['E-mail', 'email', 'din@email.dk', 'email'],
                  ['Telefon', 'tel', '+45 12 34 56 78', 'phone'],
                ].map(([lbl, type, ph, key]) => (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <label className="field-lbl">{lbl}</label>
                    <input
                      className="field"
                      type={type}
                      placeholder={ph}
                      value={user[key]}
                      onChange={(e) =>
                        setUser((u) => ({ ...u, [key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
                <button
                  className="btn btn-primary btn-full"
                  style={{ marginTop: 6 }}
                  onClick={() => user.name.trim() && setOnboardStep(2)}
                >
                  Fortsæt →
                </button>
              </div>
            )}

            {/* Step 2 */}
            {onboardStep === 2 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">🌾 Dine allergier</div>
                  <div className="step-sub">
                    Vælg de allergener du ikke kan tåle.
                  </div>
                  <div className="chip-grid">
                    {ALLERGENS.map((a) => {
                      const on = allergens.includes(a.id);
                      return (
                        <div
                          key={a.id}
                          className={`chip${on ? ' on' : ''}`}
                          onClick={() =>
                            setAllergens((p) =>
                              on ? p.filter((x) => x !== a.id) : [...p, a.id]
                            )
                          }
                        >
                          <span>{a.emoji}</span>
                          <span style={{ flex: 1 }}>{a.label}</span>
                          {on && <div className="chip-check">✓</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="card">
                  <div className="card-lbl">Andre intoleranser</div>
                  <div
                    className="input-row"
                    style={{ marginBottom: customAllerg.length ? 10 : 0 }}
                  >
                    <input
                      className="field"
                      placeholder="Fx. Fructose, Histamin…"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customInput.trim()) {
                          setCustomAllerg((c) => [...c, customInput.trim()]);
                          setCustomInput('');
                        }
                      }}
                    />
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        if (customInput.trim()) {
                          setCustomAllerg((c) => [...c, customInput.trim()]);
                          setCustomInput('');
                        }
                      }}
                    >
                      +
                    </button>
                  </div>
                  {customAllerg.length > 0 && (
                    <div className="tags">
                      {customAllerg.map((a, i) => (
                        <div key={i} className="tag">
                          ✏️ {a}
                          <span
                            className="tag-x"
                            onClick={() =>
                              setCustomAllerg((c) =>
                                c.filter((_, j) => j !== i)
                              )
                            }
                          >
                            ×
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setOnboardStep(1)}
                  >
                    ← Tilbage
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => setOnboardStep(3)}
                  >
                    Fortsæt →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Family */}
            {onboardStep === 3 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">👨‍👩‍👧 Familiemedlemmer</div>
                  <div className="step-sub">
                    Tilføj familiemedlemmer med egne allergier. Valgfrit.
                  </div>
                  {family.map((m) => (
                    <div
                      key={m.id}
                      className="family-member"
                      style={{ marginBottom: 10 }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          className="fm-avatar"
                          style={{ background: m.color, color: '#fff' }}
                        >
                          {initials(m.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>
                            {m.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {m.allergens
                              .map(
                                (id) =>
                                  ALLERGENS.find((a) => a.id === id)?.emoji
                              )
                              .join(' ') || 'Ingen allergier'}
                          </div>
                        </div>
                        <span
                          style={{
                            cursor: 'pointer',
                            opacity: 0.4,
                            fontSize: 18,
                          }}
                          onClick={() => removeMember(m.id)}
                        >
                          🗑
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="divider">Tilføj nyt medlem</div>
                  <label className="field-lbl">Navn</label>
                  <input
                    className="field"
                    placeholder="Fx. Mia (8 år)"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    style={{ marginBottom: 10 }}
                  />
                  <div className="card-lbl" style={{ marginBottom: 8 }}>
                    Allergier
                  </div>
                  <div className="chip-grid" style={{ marginBottom: 12 }}>
                    {ALLERGENS.map((a) => {
                      const on = newMemberAllerg.includes(a.id);
                      return (
                        <div
                          key={a.id}
                          className={`chip${on ? ' on' : ''}`}
                          onClick={() =>
                            setNewMemberAllerg((p) =>
                              on ? p.filter((x) => x !== a.id) : [...p, a.id]
                            )
                          }
                        >
                          <span>{a.emoji}</span>
                          <span style={{ flex: 1 }}>{a.label}</span>
                          {on && <div className="chip-check">✓</div>}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    className="btn btn-outline btn-full btn-sm"
                    onClick={addMember}
                  >
                    + Tilføj {newMemberName || 'familiemedlem'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setOnboardStep(2)}
                  >
                    ← Tilbage
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => setOnboardStep(4)}
                  >
                    Fortsæt →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Supermarkets */}
            {onboardStep === 4 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">🛒 Dine supermarkeder</div>
                  <div className="step-sub">
                    Vælg de butikker du normalt handler i.
                  </div>
                  <div className="sm-grid">
                    {SUPERMARKETS.map((s) => {
                      const on = supermarkets.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          className={`sm-chip${on ? ' on' : ''}`}
                          onClick={() =>
                            setSupermarkets((p) =>
                              on ? p.filter((x) => x !== s.id) : [...p, s.id]
                            )
                          }
                        >
                          <span className="sm-emoji">{s.emoji}</span>
                          <span>{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setOnboardStep(3)}
                  >
                    ← Tilbage
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={finishOnboard}
                  >
                    {editMode ? 'Gem ændringer ✓' : 'Kom i gang →'}
                  </button>
                </div>
                {editMode && (
                  <button
                    className="btn btn-outline btn-full"
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      setEditMode(false);
                      setScreen(SCREENS.PROFILE);
                    }}
                  >
                    Annuller
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ HOME ══ */}
        {screen === SCREENS.HOME && (
          <div className="screen fade-in" style={{ padding: 0 }}>
            <div className="home-header">
              <div className="home-greeting">God dag 👋</div>
              <div className="home-name">{user.name}</div>
              <div className="home-stats">
                <div className="stat-card">
                  <div className="stat-num">
                    {allergens.length + customAllerg.length}
                  </div>
                  <div className="stat-lbl">Mine allergier</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{family.length}</div>
                  <div className="stat-lbl">Familiemedlemmer</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{history.length}</div>
                  <div className="stat-lbl">Scanninger i alt</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">
                    {shoppingList.filter((i) => !i.checked).length}
                  </div>
                  <div className="stat-lbl">På indkøbslisten</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 16px 90px' }}>
              {family.length > 0 && (
                <div className="card" style={{ padding: '12px 14px' }}>
                  <div className="card-lbl">Aktive profiler ved scanning</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    <div
                      className={`ap-chip${
                        activeProfiles.includes('me') ? ' on' : ''
                      }`}
                      onClick={() => toggleActive('me')}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'var(--g4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 800,
                          color: 'var(--g1)',
                        }}
                      >
                        {initials(user.name)}
                      </div>
                      {user.name.split(' ')[0]}
                    </div>
                    {family.map((m) => (
                      <div
                        key={m.id}
                        className={`ap-chip${
                          activeProfiles.includes(m.id) ? ' on' : ''
                        }`}
                        onClick={() => toggleActive(m.id)}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: m.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 800,
                            color: '#fff',
                          }}
                        >
                          {initials(m.name)}
                        </div>
                        {m.name.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="quick-actions">
                <div className="qa-btn" onClick={() => setScreen(SCREENS.SCAN)}>
                  <div className="qa-icon green">📷</div>
                  <div className="qa-title">Skan produkt</div>
                  <div className="qa-sub">Tjek stregkode</div>
                </div>
                <div
                  className="qa-btn"
                  onClick={() => setScreen(SCREENS.SEARCH)}
                >
                  <div className="qa-icon blue">🔎</div>
                  <div className="qa-title">Søg varer</div>
                  <div className="qa-sub">Find sikre produkter</div>
                </div>
                <div className="qa-btn" onClick={() => setScreen(SCREENS.LIST)}>
                  <div className="qa-icon amber">🛒</div>
                  <div className="qa-title">Indkøbsliste</div>
                  <div className="qa-sub">
                    {shoppingList.filter((i) => !i.checked).length} varer
                    mangler
                  </div>
                </div>
                <div
                  className="qa-btn"
                  onClick={() => setScreen(SCREENS.FAMILY)}
                >
                  <div className="qa-icon red">👨‍👩‍👧</div>
                  <div className="qa-title">Familie</div>
                  <div className="qa-sub">{family.length} medlemmer</div>
                </div>
              </div>
              <div className="card">
                <div className="card-lbl">Mine allergier</div>
                {allergens.length + customAllerg.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                    Ingen allergier registreret.{' '}
                    <span
                      style={{
                        color: 'var(--g3)',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                      onClick={() => {
                        setEditMode(true);
                        setOnboardStep(2);
                      }}
                    >
                      Tilføj →
                    </span>
                  </div>
                ) : (
                  <div className="tags">
                    {getAllergenLabels(allergens, customAllerg).map((a, i) => (
                      <div key={i} className="tag">
                        {a}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {history.length > 0 && (
                <div className="card">
                  <div className="card-lbl">Seneste scanninger</div>
                  {history.slice(0, 4).map((h, i) => (
                    <div
                      key={i}
                      className="hist-row"
                      onClick={() => {
                        setScanResult(h);
                        setScreen(SCREENS.RESULT);
                      }}
                    >
                      <div className={`hist-dot ${h.status}`} />
                      <div className="hist-info">
                        <div className="hist-name">{h.name}</div>
                        <div className="hist-time">{timeAgo(h.timestamp)}</div>
                      </div>
                      <div className={`badge ${h.status}`}>
                        {h.status === 'safe'
                          ? 'Sikker'
                          : h.status === 'danger'
                          ? 'Farlig'
                          : 'Advarsel'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ SCAN ══ */}
        {screen === SCREENS.SCAN && (
          <div className="screen fade-in">
            <div className="screen-title">📷 Skan produkt</div>
            <div className="screen-sub">
              Scan stregkoden på en madvare for at tjekke den mod dine
              allergier.
            </div>
            {family.length > 0 && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--g3)',
                  fontWeight: 700,
                  marginBottom: 12,
                  padding: '7px 12px',
                  background: 'var(--g6)',
                  borderRadius: 9,
                }}
              >
                🧑‍🤝‍🧑 Tjekker for:{' '}
                {[
                  activeProfiles.includes('me')
                    ? user.name.split(' ')[0]
                    : null,
                  ...family
                    .filter((m) => activeProfiles.includes(m.id))
                    .map((m) => m.name.split(' ')[0]),
                ]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            )}
            <div
              className={`scanner-btn${scanning ? ' scanning' : ''}`}
              onClick={simulateScan}
            >
              {scanning ? (
                <>
                  <div className="scan-line-wrap">
                    <div className="scan-bars">
                      {[
                        24, 36, 50, 62, 50, 36, 24, 50, 62, 36, 24, 50, 36, 62,
                        24, 50,
                      ].map((h, i) => (
                        <div
                          key={i}
                          className="scan-bar"
                          style={{ height: h, animationDelay: `${i * 0.08}s` }}
                        />
                      ))}
                    </div>
                    <div className="scan-beam" />
                  </div>
                  <div className="scan-title">Scanner stregkode…</div>
                  <div className="scan-sub">Hold produktet stille</div>
                </>
              ) : (
                <>
                  <div className="scan-icon-big">📷</div>
                  <div className="scan-title">Tryk for at scanne</div>
                  <div className="scan-sub">Simulerer kamerascanning</div>
                </>
              )}
            </div>
            <div className="card" style={{ padding: '13px 14px' }}>
              <div className="card-lbl">Eller indtast stregkode manuelt</div>
              <div className="input-row">
                <input
                  className="field"
                  placeholder="Fx. 3017620422003"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookup(barcodeInput)}
                />
                <button
                  className="btn btn-primary btn-sm"
                  style={{ whiteSpace: 'nowrap', width: 'auto' }}
                  onClick={() => lookup(barcodeInput)}
                >
                  Tjek
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div className="card-lbl" style={{ marginBottom: 7 }}>
                Prøv disse produkter
              </div>
              <div className="demo-row">
                {DEMO_CODES.map((d) => (
                  <div
                    key={d.code}
                    className="demo-code"
                    onClick={() => {
                      setBarcodeInput(d.code);
                      lookup(d.code);
                    }}
                  >
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
            {loading && (
              <div className="loader fade-in">
                <div className="spinner" />
                <div className="loader-txt">Analyserer produkt…</div>
                <div className="loader-sub">
                  Tjekker mod dine allergier med AI
                </div>
              </div>
            )}
            {scanError && !loading && (
              <div className="error-box">⚠️ {scanError}</div>
            )}
            {history.length > 0 && !loading && (
              <div className="card">
                <div className="card-lbl">
                  Scanningshistorik ({history.length})
                </div>
                {history.slice(0, 8).map((h, i) => (
                  <div
                    key={i}
                    className="hist-row"
                    onClick={() => {
                      setScanResult(h);
                      setScreen(SCREENS.RESULT);
                    }}
                  >
                    <div className={`hist-dot ${h.status}`} />
                    <div className="hist-info">
                      <div className="hist-name">{h.name}</div>
                      <div className="hist-time">{timeAgo(h.timestamp)}</div>
                    </div>
                    <div className={`badge ${h.status}`}>
                      {h.status === 'safe'
                        ? 'Sikker'
                        : h.status === 'danger'
                        ? 'Farlig'
                        : 'Advarsel'}
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    if (confirm('Ryd al historik?')) setHistory([]);
                  }}
                >
                  🗑 Ryd historik
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ RESULT ══ */}
        {screen === SCREENS.RESULT && scanResult && (
          <div className="screen fade-in">
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 16, marginBottom: 12 }}
              onClick={() => setScreen(SCREENS.SCAN)}
            >
              ← Tilbage til scan
            </button>
            <div className={`result-banner ${scanResult.status}`}>
              <div className="rb-icon">
                {scanResult.status === 'safe'
                  ? '✅'
                  : scanResult.status === 'danger'
                  ? '🚫'
                  : '⚠️'}
              </div>
              <div>
                <div className={`rb-title ${scanResult.status}`}>
                  {scanResult.headline}
                </div>
                <div className="rb-sub">Stregkode: {scanResult.code}</div>
              </div>
            </div>
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    background: 'var(--surface2)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    border: '1px solid var(--border)',
                    flexShrink: 0,
                  }}
                >
                  {scanResult.status === 'safe'
                    ? '🟢'
                    : scanResult.status === 'danger'
                    ? '🔴'
                    : '🟡'}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--fh)',
                      fontSize: 16,
                      fontWeight: 800,
                    }}
                  >
                    {scanResult.name}
                  </div>
                  {scanResult.brand && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--muted)',
                        marginTop: 2,
                      }}
                    >
                      {scanResult.brand}
                    </div>
                  )}
                </div>
              </div>
              {scanResult.flags?.map((f, i) => (
                <div key={i} className={`flag ${f.type}`}>
                  <span>
                    {f.type === 'bad' ? '🚫' : f.type === 'maybe' ? '⚠️' : '✓'}
                  </span>
                  {f.text}
                </div>
              ))}
              <div className="summary-txt" style={{ marginTop: 8 }}>
                {scanResult.summary}
              </div>
              {scanResult.ingredients && (
                <>
                  <div
                    className="ing-toggle"
                    onClick={() => setShowIng((v) => !v)}
                  >
                    <span>Ingrediensliste</span>
                    <span>{showIng ? '▲' : '▼'}</span>
                  </div>
                  {showIng && (
                    <div className="ing-text">{scanResult.ingredients}</div>
                  )}
                </>
              )}
            </div>
            <div className="card">
              <div className="card-lbl">Gem til indkøbsliste</div>
              <button
                className="btn btn-outline btn-full btn-sm"
                onClick={() => {
                  addToList(scanResult.name);
                  setScreen(SCREENS.LIST);
                }}
              >
                🛒 Tilføj til indkøbsliste
              </button>
            </div>
          </div>
        )}

        {/* ══ SEARCH ══ */}
        {screen === SCREENS.SEARCH && (
          <div className="screen fade-in">
            <div className="screen-title">🔎 Søg varer</div>
            <div className="screen-sub">
              Find produkter der er sikre for dig i dine foretrukne
              supermarkeder.
            </div>
            <input
              className="field"
              placeholder="Søg på produkt eller mærke…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <div className="card-lbl">Filtrer på butik</div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 14,
              }}
            >
              <div
                className={`filter-chip${!searchStore ? ' active' : ''}`}
                onClick={() => setSearchStore('')}
              >
                Alle butikker
              </div>
              {SUPERMARKETS.filter(
                (s) => !supermarkets.length || supermarkets.includes(s.id)
              ).map((s) => (
                <div
                  key={s.id}
                  className={`filter-chip${
                    searchStore === s.id ? ' active' : ''
                  }`}
                  onClick={() =>
                    setSearchStore(searchStore === s.id ? '' : s.id)
                  }
                >
                  {s.emoji} {s.label}
                </div>
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="empty-list">
                <div className="empty-icon">🔍</div>
                <div className="empty-txt">Ingen resultater</div>
                <div className="empty-sub">Prøv en anden søgning</div>
              </div>
            )}
            {filteredProducts.map((p) => (
              <div key={p.id} className="product-card">
                <div className="product-emoji">{p.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div className="product-name">{p.name}</div>
                  <div className="product-brand">
                    {p.brand} · {p.category}
                  </div>
                  <div className="product-stores">
                    {p.stores
                      .slice(0, 3)
                      .map((id) => SUPERMARKETS.find((s) => s.id === id)?.label)
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 5,
                  }}
                >
                  {p.conflicts.length > 0 ? (
                    <div className="badge danger">⚠️ Konflikt</div>
                  ) : (
                    <div className="badge safe">✓ Sikker</div>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11, padding: '5px 9px' }}
                    onClick={() => addToList(p.name, p.stores[0])}
                  >
                    + Liste
                  </button>
                </div>
              </div>
            ))}
            {filteredProducts.length > 0 && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  textAlign: 'center',
                  padding: '8px 0',
                }}
              >
                {
                  filteredProducts.filter((p) => p.conflicts.length === 0)
                    .length
                }{' '}
                sikre produkter fundet
              </div>
            )}
          </div>
        )}

        {/* ══ LIST ══ */}
        {screen === SCREENS.LIST && (
          <div className="screen fade-in">
            <div className="screen-title">🛒 Indkøbsliste</div>
            <div className="screen-sub">
              Din personlige indkøbsliste. Del den med familien via link.
            </div>
            <div className="share-bar">
              <span style={{ fontSize: 18 }}>🔗</span>
              <span className="share-txt">Del listen med familie via link</span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12 }}
                onClick={() => alert('Link kopieret! (Demo)')}
              >
                Kopiér
              </button>
            </div>
            <div
              className="card"
              style={{ padding: '13px 14px', marginBottom: 14 }}
            >
              <div className="card-lbl">Tilføj vare</div>
              <div className="input-row" style={{ marginBottom: 8 }}>
                <input
                  className="field"
                  placeholder="Fx. Glutenfri pasta…"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && addToList(newItemName, newItemStore)
                  }
                />
                <button
                  className="btn btn-primary btn-sm"
                  style={{ whiteSpace: 'nowrap', width: 'auto' }}
                  onClick={() => addToList(newItemName, newItemStore)}
                >
                  Tilføj
                </button>
              </div>
              <select
                className="field"
                value={newItemStore}
                onChange={(e) => setNewItemStore(e.target.value)}
                style={{ fontSize: 13 }}
              >
                <option value="">Vælg butik (valgfrit)</option>
                {SUPERMARKETS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.label}
                  </option>
                ))}
              </select>
            </div>
            {shoppingList.length === 0 ? (
              <div className="empty-list">
                <div className="empty-icon">🛒</div>
                <div className="empty-txt">Indkøbslisten er tom</div>
                <div className="empty-sub">Tilføj varer ovenfor</div>
              </div>
            ) : (
              <>
                {shoppingList.filter((i) => !i.checked).length > 0 && (
                  <>
                    <div className="list-section">
                      Mangler ({shoppingList.filter((i) => !i.checked).length})
                    </div>
                    {shoppingList
                      .filter((i) => !i.checked)
                      .map((item) => (
                        <div key={item.id} className="list-item">
                          <div
                            className={`list-check${
                              item.checked ? ' checked' : ''
                            }`}
                            onClick={() => toggleItem(item.id)}
                          >
                            {item.checked && '✓'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="list-name">{item.name}</div>
                            {item.store && (
                              <div className="list-store">
                                {
                                  SUPERMARKETS.find((s) => s.id === item.store)
                                    ?.emoji
                                }{' '}
                                {
                                  SUPERMARKETS.find((s) => s.id === item.store)
                                    ?.label
                                }
                              </div>
                            )}
                          </div>
                          <div
                            className="list-del"
                            onClick={() => removeItem(item.id)}
                          >
                            🗑
                          </div>
                        </div>
                      ))}
                  </>
                )}
                {shoppingList.filter((i) => i.checked).length > 0 && (
                  <>
                    <div
                      className="list-section"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        Købt ({shoppingList.filter((i) => i.checked).length})
                      </span>
                      <span
                        style={{
                          cursor: 'pointer',
                          color: 'var(--red)',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                        onClick={clearDone}
                      >
                        Ryd
                      </span>
                    </div>
                    {shoppingList
                      .filter((i) => i.checked)
                      .map((item) => (
                        <div key={item.id} className="list-item done">
                          <div
                            className="list-check checked"
                            onClick={() => toggleItem(item.id)}
                          >
                            ✓
                          </div>
                          <div className="list-name done">{item.name}</div>
                          <div
                            className="list-del"
                            onClick={() => removeItem(item.id)}
                          >
                            🗑
                          </div>
                        </div>
                      ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ PROFILE ══ */}
        {screen === SCREENS.PROFILE && (
          <div className="screen fade-in">
            <div className="profile-hero">
              <div className="pa-lg" style={{ background: 'var(--g4)' }}>
                {initials(user.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div className="profile-hero-name">{user.name}</div>
                <div className="profile-hero-sub">
                  {allergens.length + customAllerg.length} allergier ·{' '}
                  {family.length} familiemedlemmer
                </div>
              </div>
              <button
                className="profile-edit-btn"
                onClick={() => {
                  setEditMode(true);
                  setOnboardStep(1);
                }}
              >
                Rediger
              </button>
            </div>
            <div className="card">
              <div className="card-lbl">Personlige oplysninger</div>
              {[
                ['📧', 'E-mail', user.email],
                ['📱', 'Telefon', user.phone],
                ['🎂', 'Alder', user.age],
              ].map(([ic, lbl, val]) =>
                val ? (
                  <div
                    key={lbl}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border)',
                      fontSize: 13,
                    }}
                  >
                    <span>{ic}</span>
                    <span
                      style={{
                        color: 'var(--muted)',
                        fontWeight: 600,
                        width: 70,
                      }}
                    >
                      {lbl}
                    </span>
                    <span style={{ fontWeight: 700 }}>{val}</span>
                  </div>
                ) : null
              )}
            </div>
            <div className="card">
              <div
                className="card-lbl"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <span>Mine allergier</span>
                <span
                  style={{
                    cursor: 'pointer',
                    color: 'var(--g3)',
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                  onClick={() => {
                    setEditMode(true);
                    setOnboardStep(2);
                  }}
                >
                  Rediger
                </span>
              </div>
              {allergens.length + customAllerg.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Ingen registreret
                </div>
              ) : (
                <div className="tags">
                  {getAllergenLabels(allergens, customAllerg).map((a, i) => (
                    <div key={i} className="tag">
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <div
                className="card-lbl"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <span>Mine supermarkeder</span>
                <span
                  style={{
                    cursor: 'pointer',
                    color: 'var(--g3)',
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                  onClick={() => {
                    setEditMode(true);
                    setOnboardStep(4);
                  }}
                >
                  Rediger
                </span>
              </div>
              {supermarkets.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Ingen valgt
                </div>
              ) : (
                <div className="tags">
                  {supermarkets.map((id) => {
                    const s = SUPERMARKETS.find((x) => x.id === id);
                    return s ? (
                      <div key={id} className="tag">
                        {s.emoji} {s.label}
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-lbl">Scanningsstatistik</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                  textAlign: 'center',
                }}
              >
                {[
                  [
                    history.filter((h) => h.status === 'safe').length,
                    '✅',
                    'Sikre',
                  ],
                  [
                    history.filter((h) => h.status === 'warn').length,
                    '⚠️',
                    'Advarsler',
                  ],
                  [
                    history.filter((h) => h.status === 'danger').length,
                    '🚫',
                    'Farlige',
                  ],
                ].map(([n, ic, lbl]) => (
                  <div
                    key={lbl}
                    style={{
                      background: 'var(--surface2)',
                      borderRadius: 11,
                      padding: '12px 8px',
                    }}
                  >
                    <div style={{ fontSize: 20 }}>{ic}</div>
                    <div
                      style={{
                        fontFamily: 'var(--fh)',
                        fontSize: 22,
                        fontWeight: 900,
                      }}
                    >
                      {n}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        fontWeight: 600,
                      }}
                    >
                      {lbl}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {history.length > 0 && (
              <div className="card">
                <div className="card-lbl">Fuld scanningshistorik</div>
                {history.slice(0, 10).map((h, i) => (
                  <div
                    key={i}
                    className="hist-row"
                    onClick={() => {
                      setScanResult(h);
                      setScreen(SCREENS.RESULT);
                    }}
                  >
                    <div className={`hist-dot ${h.status}`} />
                    <div className="hist-info">
                      <div className="hist-name">{h.name}</div>
                      <div className="hist-time">{timeAgo(h.timestamp)}</div>
                    </div>
                    <div className={`badge ${h.status}`}>
                      {h.status === 'safe'
                        ? 'Sikker'
                        : h.status === 'danger'
                        ? 'Farlig'
                        : 'Advarsel'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              className="btn btn-danger btn-full"
              style={{ marginBottom: 8 }}
              onClick={() => {
                if (confirm('Nulstil alt data og profil?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            >
              Nulstil profil
            </button>
          </div>
        )}

        {/* ══ FAMILY ══ */}
        {screen === SCREENS.FAMILY && (
          <div className="screen fade-in">
            <div className="screen-title">👨‍👩‍👧 Familie</div>
            <div className="screen-sub">
              Administrer familiemedlemmers allergiprofiler og filtrer for hele
              familien på én gang.
            </div>
            <div className="card" style={{ padding: '12px 14px' }}>
              <div className="card-lbl">
                Aktive profiler (bruges ved scanning)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                <div
                  className={`ap-chip${
                    activeProfiles.includes('me') ? ' on' : ''
                  }`}
                  onClick={() => toggleActive('me')}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--g4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 800,
                      color: 'var(--g1)',
                    }}
                  >
                    {initials(user.name)}
                  </div>
                  {user.name.split(' ')[0]}
                </div>
                {family.map((m) => (
                  <div
                    key={m.id}
                    className={`ap-chip${
                      activeProfiles.includes(m.id) ? ' on' : ''
                    }`}
                    onClick={() => toggleActive(m.id)}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: m.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 800,
                        color: '#fff',
                      }}
                    >
                      {initials(m.name)}
                    </div>
                    {m.name.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>
            {family.length === 0 && (
              <div className="empty-list" style={{ padding: '30px 0' }}>
                <div className="empty-icon">👨‍👩‍👧</div>
                <div className="empty-txt">Ingen familiemedlemmer endnu</div>
                <div className="empty-sub">Tilføj nedenfor</div>
              </div>
            )}
            {family.map((m) => (
              <div key={m.id} className="family-member">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: m.allergens.length ? 10 : 0,
                  }}
                >
                  <div
                    className="fm-avatar"
                    style={{ background: m.color, color: '#fff' }}
                  >
                    {initials(m.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: 'var(--fh)',
                        fontWeight: 800,
                        fontSize: 15,
                      }}
                    >
                      {m.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        marginTop: 2,
                      }}
                    >
                      {m.allergens.length + m.custom.length} allergier
                    </div>
                  </div>
                  <span
                    style={{
                      cursor: 'pointer',
                      opacity: 0.4,
                      fontSize: 18,
                      padding: 4,
                    }}
                    onClick={() => removeMember(m.id)}
                  >
                    🗑
                  </span>
                </div>
                {m.allergens.length > 0 && (
                  <div className="tags">
                    {getAllergenLabels(m.allergens, m.custom).map((a, j) => (
                      <div key={j} className="tag" style={{ fontSize: 11 }}>
                        {a}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="card">
              <div className="card-title">+ Tilføj familiemedlem</div>
              <label className="field-lbl" style={{ marginTop: 8 }}>
                Navn
              </label>
              <input
                className="field"
                placeholder="Fx. Peter (12 år)"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <div className="card-lbl">Allergier</div>
              <div className="chip-grid" style={{ marginBottom: 12 }}>
                {ALLERGENS.map((a) => {
                  const on = newMemberAllerg.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      className={`chip${on ? ' on' : ''}`}
                      onClick={() =>
                        setNewMemberAllerg((p) =>
                          on ? p.filter((x) => x !== a.id) : [...p, a.id]
                        )
                      }
                    >
                      <span>{a.emoji}</span>
                      <span style={{ flex: 1 }}>{a.label}</span>
                      {on && <div className="chip-check">✓</div>}
                    </div>
                  );
                })}
              </div>
              <button className="btn btn-primary btn-full" onClick={addMember}>
                + Tilføj {newMemberName || 'familiemedlem'}
              </button>
            </div>
          </div>
        )}

        {/* ── Bottom Nav ── */}
        {!isOnboard && (
          <nav className="bottom-nav">
            {[
              [SCREENS.HOME, '🏠', 'Hjem'],
              [SCREENS.SCAN, '📷', 'Scan'],
              [SCREENS.SEARCH, '🔎', 'Søg'],
              [SCREENS.LIST, '🛒', 'Liste'],
              [SCREENS.FAMILY, '👨‍👩‍👧', 'Familie'],
            ].map(([s, icon, lbl]) => (
              <div
                key={s}
                className={`nav-item${
                  screen === s ||
                  (screen === SCREENS.RESULT && s === SCREENS.SCAN)
                    ? ' active'
                    : ''
                }`}
                onClick={() => setScreen(s)}
              >
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
