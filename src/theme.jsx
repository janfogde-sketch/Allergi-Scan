// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// theme.jsx — EatSafe designsystem (Mørkt tema)
//
// Ét sted til at styre hele appens visuelle udtryk.
// Skift tema ved at ændre THEME-objektet herunder — resten følger automatisk.
// ─────────────────────────────────────────────────────────────────────────────

export const THEME = {
  // Baggrunde — neutral mørk med svag grøn undertone
  paper:   "#151d1a",
  paper2:  "#1c2620",

  // Primær tekst — neutral hvid (ikke grønstemt)
  ink:     "#F0F0EE",
  ink2:    "rgba(240,240,238,.72)",
  ink3:    "rgba(240,240,238,.50)",

  // Grøn — KUN til sikker/success/primær CTA
  green:      "#4ADE80",
  greenGlow:  "#6EE89C",
  greenLt:    "rgba(74,222,128,.12)",
  greenMid:   "rgba(74,222,128,.20)",
  greenText:  "#2FB865",

  // Fare — rød
  red:    "#FF5252",
  redLt:  "rgba(255,82,82,.1)",
  redMd:  "rgba(255,82,82,.18)",

  // Advarsel — amber
  amber:   "#FFBA3B",
  amberLt: "rgba(255,186,59,.1)",
  amberMd: "rgba(255,186,59,.18)",

  // Info — blå (links, badges, navigation)
  blue:   "#60A5FA",
  blueLt: "rgba(96,165,250,.12)",
  blueMd: "rgba(96,165,250,.22)",

  // Neutral — grå til labels og metadata
  neutral:   "#94A3B8",
  neutralLt: "rgba(148,163,184,.12)",

  // Varm accent — highlights, tips, madkultur
  warm:   "#E8A87C",
  warmLt: "rgba(232,168,124,.10)",
  warmMd: "rgba(232,168,124,.18)",

  // Tekst-muted — neutral grå (ikke grønstemt)
  muted:  "rgba(240,240,238,.55)",
  muted2: "rgba(240,240,238,.38)",

  // Borders — lidt mere synlige
  border:  "rgba(255,255,255,.09)",
  border2: "rgba(255,255,255,.17)",

  // Surfaces — neutrale glaslag
  surface:  "rgba(255,255,255,.058)",
  surface2: "rgba(255,255,255,.095)",
  surface3: "rgba(255,255,255,.035)",

  // Typografi
  font: "'DM Sans',system-ui,sans-serif",

  // Border radius
  radius: "12px",

  // Skygger
  shadow:  "0 1px 3px rgba(0,0,0,.2),0 2px 8px rgba(0,0,0,.15)",
  shadow2: "0 4px 16px rgba(0,0,0,.3)",
  shadow3: "0 8px 32px rgba(0,0,0,.4)",
};

export const appCss = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  /* Tekst — neutral, ikke grønstemt */
  --ink:#F0F0EE;
  --ink2:rgba(240,240,238,.72);
  --ink3:rgba(240,240,238,.50);
  /* Baggrunde — neutral mørk med svag grøn undertone */
  --paper:#151d1a;
  --paper2:#1c2620;
  /* Grøn — KUN sikker/success/primær CTA */
  --green:#4ADE80;
  --green-logo:#3DCC6E;
  --green-glow:#6EE89C;
  --green-lt:rgba(74,222,128,.12);
  --green-mid:rgba(74,222,128,.20);
  --green-text:#2FB865;
  /* Borders — lidt mere synlige */
  --border:rgba(255,255,255,.09);
  --border2:rgba(255,255,255,.17);
  /* Surfaces — neutrale glaslag */
  --surface:rgba(255,255,255,.058);
  --surface2:rgba(255,255,255,.095);
  --surface3:rgba(255,255,255,.035);
  /* Semantiske farver */
  --red:#FF5252;--red-lt:rgba(255,82,82,.1);--red-md:rgba(255,82,82,.18);
  --amber:#FFBA3B;--amber-lt:rgba(255,186,59,.1);--amber-md:rgba(255,186,59,.18);
  /* Blå — info, links, navigation */
  --blue:#60A5FA;--blue-lt:rgba(96,165,250,.12);--blue-md:rgba(96,165,250,.22);
  /* Neutral grå — labels, metadata */
  --neutral:#94A3B8;--neutral-lt:rgba(148,163,184,.12);
  /* Varm accent — highlights, tips */
  --warm:#E8A87C;--warm-lt:rgba(232,168,124,.10);--warm-md:rgba(232,168,124,.18);
  /* Muted — neutral grå tekst */
  --muted:rgba(240,240,238,.55);
  --muted2:rgba(240,240,238,.38);
  --r:12px;
  --f:'DM Sans',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
  /* Typografi-skala */
  --fs-xs:10px;
  --fs-sm:12px;
  --fs-md:14px;
  --fs-lg:17px;
  --fs-xl:22px;
  --fs-2xl:28px;
  /* Font-weight tokens */
  --fw-normal:400;
  --fw-medium:500;
  --fw-semi:600;
  --fw-bold:700;
  --fw-black:800;
  /* Line-height tokens */
  --lh-tight:1.2;
  --lh-snug:1.4;
  --lh-normal:1.55;
  --sh:0 1px 3px rgba(0,0,0,.2),0 2px 8px rgba(0,0,0,.15);
  --sh2:0 4px 16px rgba(0,0,0,.3);
  --sh3:0 8px 32px rgba(0,0,0,.4);
}
body{
  background:linear-gradient(160deg,#1a2520 0%,#111815 100%);
  color:var(--ink);font-family:var(--f);-webkit-font-smoothing:antialiased;
  min-height:100vh;
}
.app{
  max-width:390px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;
  width:100%;position:relative;overflow-x:hidden;
  background:radial-gradient(ellipse 100% 45% at 50% 0%,rgba(74,222,128,.07) 0%,transparent 60%),
             linear-gradient(175deg,#1e2d24 0%,#182019 40%,#141c18 70%,#111815 100%);
}

/* ── TOPBAR ── */
.topbar{
  background:transparent;border-bottom:none;
  padding:12px 20px 10px;display:flex;align-items:center;justify-content:space-between;
  position:sticky;top:0;z-index:60;
}
.topbar-logo{display:flex;align-items:center;gap:8px;}
.topbar-shield{width:30px;height:30px;background:linear-gradient(135deg,#3DCC6E,#2BA855);border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(61,204,110,.35);overflow:hidden;flex-shrink:0;}
.topbar-name{font-size:15px;font-weight:600;color:var(--ink);letter-spacing:-.3px;font-family:var(--f);}
.topbar-name span{color:var(--green);font-style:normal;}
.topbar-avatar{width:32px;height:32px;background:var(--green-lt);border:1.5px solid var(--green-mid);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--green);cursor:pointer;transition:all .15s;letter-spacing:.3px;}
.topbar-avatar:hover{background:var(--green-mid);}

/* ── LAYOUT ── */
.screen{flex:1;padding:0 16px 110px;}
.bottom-nav{
  position:fixed;bottom:0;left:50%;transform:translateX(-50%);
  width:100%;max-width:390px;
  background:linear-gradient(to bottom,transparent 0%,#111815 38%,#111815 100%);
  border-top:none;
  display:flex;padding:10px 4px 24px;z-index:100;
}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;opacity:.3;transition:all .15s;}
.nav-item.active{opacity:1;}
.nav-icon{width:42px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:background .15s;}
.nav-item.active .nav-icon{background:rgba(96,165,250,.12);}
.nav-lbl{font-size:9px;font-weight:600;color:var(--ink);letter-spacing:.3px;}
.nav-item.active .nav-lbl{color:var(--blue);}

/* ── CARDS & COMPONENTS ── */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:10px;backdrop-filter:blur(8px);}
.card-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--neutral);margin-bottom:10px;}
.card-title{font-size:15px;font-weight:700;color:var(--ink);margin-bottom:4px;letter-spacing:-.2px;}
.field{width:100%;background:var(--surface2);border:1.5px solid var(--border2);border-radius:10px;padding:11px 14px;color:var(--ink);font-family:var(--f);font-size:16px;outline:none;transition:border-color .15s,background .15s;}
.field:focus{border-color:var(--green);background:var(--surface2);box-shadow:0 0 0 3px var(--green-lt);}
.field-lbl{font-size:11.5px;font-weight:700;color:var(--ink2);margin-bottom:5px;display:block;letter-spacing:.1px;}
.input-row{display:flex;gap:8px;}

/* ── BUTTONS ── */
.btn{padding:12px 20px;border-radius:10px;border:none;font-family:var(--f);font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;gap:6px;letter-spacing:-.1px;}
.btn-full{width:100%;}
.btn-primary{background:var(--green);color:#071510;box-shadow:0 2px 12px rgba(74,222,128,.25);}
.btn-primary:hover{background:var(--green-glow);transform:translateY(-1px);}
.btn-green{background:var(--green);color:#071510;box-shadow:0 2px 12px rgba(74,222,128,.25);}
.btn-green:hover{background:var(--green-glow);transform:translateY(-1px);}
.btn-outline{background:transparent;color:var(--ink);border:1.5px solid var(--border2);}
.btn-outline:hover{border-color:var(--ink2);background:var(--surface);}
.btn-danger{background:transparent;color:var(--red);border:1.5px solid rgba(255,82,82,.3);}
.btn-danger:hover{background:var(--red-lt);}
.btn-sm{padding:7px 13px;font-size:12.5px;border-radius:8px;}
.btn-ghost{background:var(--surface2);color:var(--ink2);border:1px solid var(--border);}
.btn-ghost:hover{background:var(--surface2);color:var(--ink);}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important;}

/* ── CHIPS & TAGS ── */
.chip-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.chip{display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:10px;border:1.5px solid var(--border2);background:var(--surface);cursor:pointer;transition:all .15s;font-size:12.5px;font-weight:600;color:var(--ink2);user-select:none;backdrop-filter:blur(8px);}
.chip:hover{border-color:var(--border2);color:var(--ink);}
.chip.on{border-color:rgba(74,222,128,.3);background:var(--green-lt);color:var(--green);font-weight:700;}
.chip-check{margin-left:auto;width:16px;height:16px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:#071510;flex-shrink:0;}
.tags{display:flex;flex-wrap:wrap;gap:5px;}
.tag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--green-lt);border:1px solid var(--green-mid);border-radius:100px;font-size:12px;color:var(--green);font-weight:600;}
.tag-x{cursor:pointer;opacity:.4;font-size:13px;margin-left:1px;}.tag-x:hover{opacity:.8;}

/* ── BADGES ── */
.badge{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;letter-spacing:.2px;}
.badge.safe{background:var(--green-lt);color:var(--green);border:1px solid var(--green-mid);}
.badge.danger{background:var(--red-lt);color:var(--red);border:1px solid var(--red-md);}
.badge.warn{background:var(--amber-lt);color:var(--amber);border:1px solid var(--amber-md);}

.divider{display:flex;align-items:center;gap:10px;margin:12px 0;color:var(--muted);font-size:11.5px;font-weight:600;letter-spacing:.3px;}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border);}

/* ── WELCOME ── */
.welcome-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 28px;text-align:center;}
.welcome-logo-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:40px;}
.welcome-wordmark{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px;}
.welcome-wordmark-text{font-family:var(--f);font-size:32px;font-weight:700;color:var(--ink);letter-spacing:-.8px;line-height:1;}
.welcome-wordmark-text span{color:var(--green);}
.welcome-tagline{font-size:15px;color:var(--muted);margin-top:10px;letter-spacing:.2px;font-weight:400;}
.welcome-divider{width:40px;height:2px;background:var(--border2);border-radius:2px;margin:32px auto;}
.welcome-features{display:flex;flex-direction:column;gap:14px;margin-bottom:44px;width:100%;}
.welcome-feat{display:flex;align-items:center;gap:14px;text-align:left;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;backdrop-filter:blur(8px);}
.welcome-feat-icon{width:38px;height:38px;background:var(--green-lt);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.welcome-feat-text{font-size:13px;color:var(--ink2);font-weight:500;line-height:1.45;}
.welcome-feat-text strong{color:var(--ink);font-weight:700;display:block;margin-bottom:2px;}
.welcome-btn{background:var(--green);color:#071510;border:none;border-radius:12px;padding:15px 32px;font-family:var(--f);font-size:15px;font-weight:700;cursor:pointer;width:100%;transition:all .18s;margin-bottom:10px;letter-spacing:-.1px;box-shadow:0 2px 12px rgba(74,222,128,.3);}
.welcome-btn:hover{background:var(--green-glow);transform:translateY(-1px);}
.welcome-btn-ghost{background:var(--surface);color:var(--ink2);border:1.5px solid var(--border2);border-radius:12px;padding:13px 32px;font-family:var(--f);font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:all .18s;}
.welcome-btn-ghost:hover{background:var(--surface2);}

/* ── LOGIN ── */
.login-wrap{min-height:100vh;display:flex;flex-direction:column;padding:48px 20px 32px;}
.login-header{text-align:center;margin-bottom:28px;}
.login-shield{width:64px;height:64px;background:none;border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;overflow:hidden;}
.login-title{font-size:24px;font-weight:700;color:var(--ink);letter-spacing:-.5px;}
.login-sub{font-size:13px;color:var(--muted);margin-top:4px;}

/* ── ONBOARDING ── */
.onboard-wrap{padding:20px 16px 100px;}
.step-seg{height:3px;flex:1;border-radius:2px;background:var(--border2);transition:background .3s;}
.step-seg.done{background:var(--green);}
.step-num{font-size:11px;font-weight:700;color:var(--muted);white-space:nowrap;}
.step-title{font-size:17px;font-weight:700;margin-bottom:5px;color:var(--ink);letter-spacing:-.3px;}
.step-sub{font-size:13px;color:var(--ink2);margin-bottom:16px;line-height:1.55;}
.onboard-skip{font-size:12px;color:var(--muted);text-align:center;margin-top:8px;}

/* ── HOME ── */
.greeting{padding:20px 0 14px;}
.greeting-eyebrow{font-size:11px;font-weight:500;color:var(--blue);letter-spacing:1.4px;text-transform:uppercase;margin-bottom:4px;}
.greeting-main{font-size:28px;font-weight:300;color:var(--ink);letter-spacing:-.8px;line-height:1;}
.greeting-main strong{font-weight:600;}
.greeting-sub{font-size:13px;color:var(--muted);margin-top:3px;font-weight:400;}

/* Scan card */
.scan-card{
  width:100%;background:var(--surface);border:1px solid var(--border2);
  border-radius:22px;padding:26px 20px 22px;margin-bottom:12px;cursor:pointer;
  position:relative;overflow:hidden;display:flex;flex-direction:column;
  align-items:center;gap:16px;backdrop-filter:blur(12px);
}
.scan-card::before{content:'';position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);width:180px;height:80px;background:radial-gradient(ellipse,rgba(61,204,110,.22) 0%,transparent 70%);pointer-events:none;}
.scan-card::after{content:'';position:absolute;top:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,rgba(61,204,110,.28),transparent);}
.scan-card-text{text-align:center;}
.scan-card-title{font-size:17px;font-weight:600;color:var(--ink);letter-spacing:-.4px;margin-bottom:4px;}
.scan-card-sub{font-size:11px;color:var(--muted2);font-weight:400;line-height:1.5;}

/* Reticle */
.reticle{width:80px;height:80px;position:relative;flex-shrink:0;}
.scan-barcode-wrap{
  width:85%;height:64px;position:relative;flex-shrink:0;margin:0 auto;
}
.scan-barcode-svg{
  position:absolute;left:10px;right:10px;top:50%;transform:translateY(-50%);
  height:38px;width:calc(100% - 20px);
}
.reticle-corner{position:absolute;width:18px;height:18px;border-color:var(--green-logo);border-style:solid;opacity:1;}
.reticle-corner.tl{top:0;left:0;border-width:2px 0 0 2px;border-radius:4px 0 0 0;}
.reticle-corner.tr{top:0;right:0;border-width:2px 2px 0 0;border-radius:0 4px 0 0;}
.reticle-corner.bl{bottom:0;left:0;border-width:0 0 2px 2px;border-radius:0 0 0 4px;}
.reticle-corner.br{bottom:0;right:0;border-width:0 2px 2px 0;border-radius:0 0 4px 0;}
.reticle-line{position:absolute;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent 0%,var(--green-logo) 15%,var(--green-logo) 85%,transparent 100%);animation:scanline 2.2s ease-in-out infinite;box-shadow:0 0 10px var(--green-logo),0 0 3px var(--green-logo);}
@keyframes scanline{0%{top:13px;opacity:0;}15%{opacity:1;}85%{opacity:1;}100%{top:51px;opacity:0;}}

/* Mini cards */
.home-cards-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;}
.home-mini-card{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:15px 14px;cursor:pointer;display:flex;flex-direction:column;gap:10px;backdrop-filter:blur(8px);position:relative;overflow:hidden;transition:border-color .15s;}
.home-mini-card::after{content:'';position:absolute;top:0;left:25%;right:25%;height:1px;background:linear-gradient(90deg,transparent,var(--border2),transparent);}
.home-mini-card:hover{border-color:var(--border2);}
.home-mini-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:var(--green-lt);}
.home-mini-label{font-size:12px;font-weight:600;color:var(--ink);letter-spacing:-.2px;margin-bottom:2px;}
.home-mini-sub{font-size:10px;color:var(--muted2);font-weight:400;}
.home-mini-badge{width:18px;height:18px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#071510;flex-shrink:0;}

/* Section label */
.section-lbl{font-size:9.5px;font-weight:600;color:var(--neutral);text-transform:uppercase;letter-spacing:1.8px;margin-bottom:10px;}

/* Recent list */
.recent-list{background:var(--surface3);border:1px solid var(--border);border-radius:18px;padding:2px 14px;margin-bottom:20px;backdrop-filter:blur(8px);}
.recent-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);}
.recent-item:last-child{border-bottom:none;}
.recent-thumb{width:38px;height:38px;border-radius:10px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;}
.recent-name{font-size:13px;font-weight:500;color:var(--ink);letter-spacing:-.2px;margin-bottom:2px;}
.recent-meta{font-size:10px;color:var(--muted2);font-weight:400;}
.recent-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-left:auto;}
.recent-dot.safe{background:var(--green);box-shadow:0 0 7px rgba(74,222,128,.6);}
.recent-dot.warn{background:var(--amber);}
.recent-dot.danger{background:var(--red);box-shadow:0 0 7px rgba(255,82,82,.5);}
.recent-dot.not_found{background:var(--muted);}

/* Tip card */
.home-tip{background:var(--surface3);border:1px solid var(--border);border-left:2px solid var(--blue);border-radius:14px;padding:12px 14px;margin-bottom:20px;display:flex;gap:10px;backdrop-filter:blur(8px);}
.home-tip-tag{font-size:9px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:3px;}
.home-tip-title{font-size:12px;font-weight:600;color:var(--ink);margin-bottom:3px;letter-spacing:-.2px;}
.home-tip-body{font-size:11px;color:var(--muted2);line-height:1.55;font-weight:400;}

/* Profile chips (home) */
.home-profile-chips{display:flex;gap:6px;margin-bottom:22px;flex-wrap:wrap;}
.home-chip{display:flex;align-items:center;gap:6px;padding:5px 11px 5px 6px;background:var(--surface);border:1px solid var(--border);border-radius:100px;font-size:11px;font-weight:500;color:var(--ink2);cursor:pointer;backdrop-filter:blur(8px);transition:all .15s;min-height:30px;}
.home-chip.active{background:var(--green-lt);border-color:rgba(74,222,128,.25);color:var(--green);}
.home-chip-avatar{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:7.5px;font-weight:700;color:#fff;flex-shrink:0;}

/* Version */
.version-str{font-family:var(--mono);font-size:9px;color:var(--neutral);text-align:center;padding:4px 0 16px;letter-spacing:.5px;opacity:.5;}

/* Stat grid (legacy) */
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;}
.stat-num{font-size:26px;font-weight:700;color:var(--ink);line-height:1;letter-spacing:-.5px;}
.stat-lbl{font-size:11px;color:var(--muted);margin-top:4px;font-weight:600;letter-spacing:.2px;}
.scan-hero{background:var(--surface);border:1px solid var(--border2);border-radius:16px;padding:20px 18px;margin-bottom:10px;display:flex;align-items:center;gap:16px;cursor:pointer;transition:all .18s;position:relative;overflow:hidden;backdrop-filter:blur(12px);}
.scan-hero:hover{background:var(--surface2);}
.scan-hero-icon{width:52px;height:52px;background:var(--green-lt);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.scan-hero-title{font-size:16px;font-weight:700;color:var(--ink);letter-spacing:-.3px;}
.scan-hero-sub{font-size:12px;color:var(--muted);margin-top:2px;font-weight:400;}

/* ── SEARCH ── */
.filter-chip{padding:5px 12px;border-radius:100px;border:1.5px solid var(--border2);background:var(--surface);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted);}
.filter-chip:hover{border-color:var(--border2);color:var(--ink);}
.filter-chip.active{border-color:rgba(74,222,128,.3);background:var(--green-lt);color:var(--green);}
.product-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:13px;margin-bottom:8px;display:flex;align-items:center;gap:11px;backdrop-filter:blur(8px);}
.product-card:hover{border-color:var(--border2);}
.product-emoji{width:44px;height:44px;background:var(--surface2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;border:1px solid var(--border);}
.product-name{font-size:13.5px;font-weight:700;letter-spacing:-.1px;color:var(--ink);}
.product-brand{font-size:11.5px;color:var(--muted);margin-top:2px;}
.verified-pill{display:inline-flex;align-items:center;padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;margin-top:4px;letter-spacing:.2px;}

/* ── LIST ── */
.list-item{display:flex;align-items:center;gap:11px;padding:11px 13px;background:var(--surface);border:1px solid var(--border);border-radius:11px;margin-bottom:7px;backdrop-filter:blur(8px);}
.list-item.done{opacity:.4;}
.list-check{width:20px;height:20px;border-radius:6px;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .18s;font-size:11px;color:#071510;}
.list-check.checked{background:var(--green);border-color:var(--green);}
.list-name{font-size:14px;font-weight:600;flex:1;letter-spacing:-.1px;color:var(--ink);}
.list-name.done{text-decoration:line-through;color:var(--muted);}
.list-del{font-size:15px;cursor:pointer;opacity:.2;padding:4px;transition:opacity .15s;}.list-del:hover{opacity:.6;}
.list-section{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin:14px 0 7px;}

/* ── PROFILE ── */
.profile-hero{background:var(--surface2);border:1px solid var(--border2);border-radius:16px;padding:20px 18px;margin:16px 0 12px;display:flex;align-items:center;gap:14px;backdrop-filter:blur(12px);}
.pa-lg{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#071510;background:var(--green);flex-shrink:0;}
.profile-hero-name{font-size:18px;font-weight:700;color:var(--ink);letter-spacing:-.4px;}
.profile-hero-sub{font-size:11.5px;color:var(--muted);margin-top:3px;font-weight:400;}
.profile-edit-btn{margin-left:auto;background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;color:var(--ink);cursor:pointer;font-family:var(--f);transition:all .15s;}
.profile-edit-btn:hover{background:var(--surface2);border-color:var(--green);}
.stat3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;text-align:center;}
.stat3-item{background:var(--surface);border-radius:10px;padding:12px 8px;border:1px solid var(--border);}
.stat3-num{font-size:20px;font-weight:700;letter-spacing:-.3px;color:var(--ink);}
.stat3-lbl{font-size:10.5px;color:var(--muted);font-weight:600;margin-top:3px;letter-spacing:.2px;}

/* ── FAMILY ── */
.family-member{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:13px 15px;margin-bottom:9px;backdrop-filter:blur(8px);}
.fm-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
.ap-chip{display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:100px;border:1.5px solid var(--border2);background:var(--surface);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted);}
.ap-chip:hover{border-color:var(--border2);color:var(--ink);}
.ap-chip.on{border-color:rgba(74,222,128,.3);background:var(--green-lt);color:var(--green);}

/* ── HISTORY ── */
.hist-row{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:opacity .1s;}
.hist-row:hover{opacity:.75;}
.hist-row:last-child{border-bottom:none;}
.hist-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.hist-dot.safe{background:var(--green);}.hist-dot.danger{background:var(--red);}.hist-dot.warn,.hist-dot.warning{background:var(--amber);}.hist-dot.not_found{background:var(--muted);}
.hist-info{flex:1;min-width:0;}
.hist-name{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.1px;color:var(--ink);}
.hist-time{font-size:11px;color:var(--muted);margin-top:1px;font-weight:400;}

/* ── UTILS ── */
.loader{display:flex;flex-direction:column;align-items:center;gap:10px;padding:28px;background:var(--surface);border-radius:12px;margin-bottom:10px;backdrop-filter:blur(8px);}
.spinner{width:32px;height:32px;border:2.5px solid var(--border2);border-top-color:var(--green);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.loader-txt{font-size:13.5px;font-weight:700;color:var(--ink);letter-spacing:-.1px;}
.loader-sub{font-size:11.5px;color:var(--muted);}
.error-box{background:var(--red-lt);border:1px solid var(--red-md);border-radius:10px;padding:11px 14px;font-size:12.5px;color:var(--red);font-weight:600;margin-bottom:10px;display:flex;align-items:flex-start;gap:8px;}
.info-box{background:var(--blue-lt);border:1px solid rgba(96,165,250,.2);border-radius:10px;padding:11px 14px;font-size:12.5px;color:var(--blue);font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.warn-box{background:var(--amber-lt);border:1px solid var(--amber-md);border-radius:10px;padding:11px 14px;font-size:12.5px;color:var(--amber);font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.share-bar{display:flex;gap:8px;padding:11px 13px;background:var(--blue-lt);border-radius:10px;margin-bottom:10px;align-items:center;border:1px solid rgba(96,165,250,.12);}
.share-txt{flex:1;font-size:12.5px;color:var(--blue);font-weight:600;}
.empty-state{text-align:center;padding:52px 20px;color:var(--muted);}
.empty-icon{font-size:40px;margin-bottom:12px;display:block;filter:grayscale(1);opacity:.4;}
.empty-txt{font-size:15px;font-weight:700;color:var(--ink2);letter-spacing:-.2px;}
.empty-sub{font-size:13px;margin-top:5px;color:var(--muted);font-weight:400;}
.demo-code{padding:4px 10px;background:var(--surface2);border:1px solid var(--border2);border-radius:7px;font-size:12px;font-weight:700;color:var(--ink2);cursor:pointer;transition:all .15s;display:inline-block;margin:3px;font-family:monospace;}
.demo-code:hover{border-color:var(--green);color:var(--green);background:var(--green-lt);}
.screen-title{font-size:21px;font-weight:700;color:var(--ink);margin:20px 0 16px;letter-spacing:-.4px;text-align:center;width:100%;}
.screen-sub{font-size:13px;color:var(--ink2);margin-bottom:16px;line-height:1.5;font-weight:400;}
.tab-row{display:flex;gap:3px;background:var(--surface2);border-radius:10px;padding:3px;margin-bottom:14px;border:1px solid var(--border);}
.tab{flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;color:var(--muted);transition:all .15s;}
.tab.active{background:var(--surface2);color:var(--ink);box-shadow:var(--sh);}
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
.product-hero{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:10px;backdrop-filter:blur(8px);}
.product-hero-img{width:100%;height:180px;object-fit:contain;background:var(--surface2);display:block;}
.product-hero-img-placeholder{width:100%;height:180px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:72px;}
.product-hero-body{padding:14px 16px;}
.product-hero-name{font-size:19px;font-weight:700;color:var(--ink);letter-spacing:-.4px;line-height:1.2;margin-bottom:3px;}
.product-hero-brand{font-size:13px;color:var(--muted);font-weight:400;margin-bottom:10px;}
.product-hero-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.product-hero-source{font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;letterSpacing:.3px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.fade-in{animation:fadeUp .18s ease both;}

/* ── MADPAS ── */
.mp-page{display:flex;flex-direction:column;flex:1;}
.mp-scroll{flex:1;overflow-y:auto;padding:0 20px 120px;}
.mp-head{padding:20px 20px 0;}
.mp-title{font-size:26px;font-weight:700;color:var(--ink);letter-spacing:-.5px;margin-bottom:5px;}
.mp-subtitle{font-size:13px;color:var(--ink2);font-weight:400;line-height:1.5;margin-bottom:20px;}
.mp-section-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin:0 0 8px;}
.mp-lang-dropdown{width:100%;background:var(--surface);border:1.5px solid var(--border2);border-radius:13px;padding:13px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s;margin-bottom:16px;box-sizing:border-box;}
.mp-lang-dropdown:hover{border-color:var(--green);}
.mp-lang-flag{font-size:22px;flex-shrink:0;}
.mp-lang-name{flex:1;font-size:15px;font-weight:700;color:var(--ink);}
.mp-lang-arrow{font-size:14px;color:var(--muted);}
.mp-lang-list{background:var(--surface);border:1.5px solid var(--border2);border-radius:13px;overflow:hidden;margin-bottom:16px;max-height:320px;overflow-y:auto;}
.mp-lang-opt{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;transition:background .1s;border-bottom:1px solid var(--border);}
.mp-lang-opt:last-child{border-bottom:none;}
.mp-lang-opt:hover{background:var(--surface2);}
.mp-lang-opt.on{background:var(--green-lt);}
.mp-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:14px;backdrop-filter:blur(8px);}
.mp-allergen-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;background:var(--red-lt);border:1px solid var(--red-md);border-radius:100px;font-weight:700;color:var(--red);margin:3px;}
.mp-allergen-pill.custom{background:var(--surface2);border-color:var(--border2);color:var(--ink2);}
.mp-big-btn{width:100%;background:var(--green);color:#071510;border:none;border-radius:14px;padding:16px;font-family:var(--f);font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;box-shadow:0 3px 12px rgba(74,222,128,.25);}
.mp-big-btn:hover{background:var(--green-glow);}
.mp-speak-btn{background:var(--green);color:#071510;border:none;border-radius:10px;padding:8px 14px;font-family:var(--f);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;flex:1;}
.mp-speak-btn.speaking{background:var(--amber);color:#071510;}
.mp-aa{background:var(--surface2);color:var(--muted);border:1.5px solid var(--border2);border-radius:9px;padding:7px 11px;font-family:var(--f);font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;}
.mp-aa.on{background:var(--green-lt);border-color:rgba(74,222,128,.3);color:var(--green);}
.mp-family-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 0;border-bottom:1px solid var(--border);}
.mp-family-row:last-child{border-bottom:none;}

/* ── OPSKRIFTER ── */
.recipe-grid{display:flex;flex-direction:column;gap:12px;}
.recipe-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;cursor:pointer;transition:transform .15s,border-color .15s;position:relative;backdrop-filter:blur(8px);}
.recipe-card:active{transform:scale(.99);}
.recipe-card:hover{border-color:var(--border2);}
.recipe-card-img{width:100%;height:180px;object-fit:cover;display:block;background:var(--surface2);}
.recipe-card-img-placeholder{width:100%;height:140px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:52px;}
.recipe-card-body{padding:14px 16px 16px;}
.recipe-card-title{font-size:16px;font-weight:700;color:var(--ink);line-height:1.25;margin-bottom:6px;letter-spacing:-.2px;}
.recipe-card-desc{font-size:12px;color:var(--ink2);line-height:1.55;margin-bottom:10px;}
.recipe-card-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.recipe-pill{font-size:10px;font-weight:700;border-radius:100px;padding:3px 9px;border:1px solid;white-space:nowrap;}
.recipe-safe-bar{display:flex;gap:5px;flex-wrap:wrap;padding:10px 14px 0;border-top:1px solid var(--border);margin-top:10px;}
.recipe-profile-badge{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;border:1px solid;}
.recipe-fav-btn{position:absolute;top:10px;right:10px;z-index:2;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.45);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:background .15s;}
.recipe-filter-row{display:flex;gap:7px;overflow-x:auto;padding-bottom:4px;margin-bottom:12px;scrollbar-width:none;}
.recipe-filter-row::-webkit-scrollbar{display:none;}
.recipe-filter-chip{flex-shrink:0;padding:7px 14px;border-radius:100px;border:1.5px solid var(--border2);background:var(--surface);font-size:12px;font-weight:700;cursor:pointer;color:var(--muted);transition:all .15s;white-space:nowrap;}
.recipe-filter-chip.active{border-color:rgba(74,222,128,.3);background:var(--green-lt);color:var(--green);}
.recipe-search-wrap{position:relative;margin-bottom:12px;}
.recipe-search-input{width:100%;padding:11px 14px 11px 42px;border:1.5px solid var(--border2);border-radius:12px;background:var(--surface);font-family:var(--f);font-size:14px;color:var(--ink);outline:none;box-sizing:border-box;transition:border-color .15s;}
.recipe-search-input:focus{border-color:var(--green);box-shadow:0 0 0 3px var(--green-lt);}
.recipe-search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none;}
.recipe-detail-hero{position:relative;margin:-1px -16px 0;}
.recipe-detail-img{width:100%;height:240px;object-fit:cover;display:block;}
.recipe-detail-img-placeholder{width:100%;height:200px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:80px;}
.recipe-detail-back{position:absolute;top:14px;left:14px;z-index:3;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;}
.recipe-detail-fav{position:absolute;top:14px;right:14px;z-index:3;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;}
.recipe-detail-title{font-size:24px;font-weight:700;color:var(--ink);letter-spacing:-.5px;line-height:1.2;margin-bottom:8px;}
.recipe-meta-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;}
.recipe-meta-pill{display:flex;align-items:center;gap:4px;padding:4px 10px;background:var(--surface);border:1px solid var(--border);border-radius:100px;font-size:11px;font-weight:700;color:var(--muted);}
.ingredient-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--border);}
.ingredient-row:last-child{border-bottom:none;}
.ingredient-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:2px;}
.step-row{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:opacity .2s;}
.step-row:last-child{border-bottom:none;}
.step-circle{width:32px;height:32px;border-radius:50%;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.servings-ctrl{display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:5px 12px;}
.servings-btn{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--border2);background:var(--surface2);cursor:pointer;font-size:16px;font-weight:700;color:var(--ink);display:flex;align-items:center;justify-content:center;line-height:1;transition:all .15s;font-family:var(--f);}
.servings-btn:hover{border-color:var(--green);color:var(--green);}
.servings-num{font-size:15px;font-weight:700;color:var(--ink);min-width:22px;text-align:center;}
.recipe-skeleton{background:var(--surface);border-radius:16px;overflow:hidden;border:1px solid var(--border);margin-bottom:12px;}
.skeleton-img{width:100%;height:140px;background:linear-gradient(90deg,var(--surface) 25%,var(--surface2) 50%,var(--surface) 75%);background-size:400% 100%;animation:shimmer 1.4s ease-in-out infinite;}
.skeleton-line{height:12px;border-radius:6px;background:linear-gradient(90deg,var(--surface) 25%,var(--surface2) 50%,var(--surface) 75%);background-size:400% 100%;animation:shimmer 1.4s ease-in-out infinite;margin-bottom:8px;}
@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
.youtube-btn{display:flex;align-items:center;gap:8px;padding:10px 16px;background:#FF0000;border:none;border-radius:10px;cursor:pointer;font-family:var(--f);font-size:13px;font-weight:700;color:#fff;width:100%;justify-content:center;transition:background .15s;margin-bottom:10px;}
.youtube-btn:hover{background:#CC0000;}

/* ── ACCESSIBILITY ── */
.btn{min-height:44px;}
.nav-item{min-height:44px;min-width:44px;}
*:focus-visible{outline:2.5px solid var(--green);outline-offset:2px;border-radius:4px;}
.skip-link{position:absolute;top:-100px;left:16px;background:var(--green);color:#071510;padding:8px 16px;border-radius:8px;font-size:14px;font-weight:700;z-index:9999;text-decoration:none;}
.skip-link:focus{top:8px;}
@media (prefers-reduced-motion: reduce) {
  *{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;}
  .spinner{animation:none;border-color:var(--green);}
}
@media (prefers-contrast: more) {
  :root{--muted:rgba(240,240,238,.75);--muted2:rgba(240,240,238,.60);--border:rgba(255,255,255,.22);--border2:rgba(255,255,255,.32);}
}
@media (min-resolution: 2dppx) {
  .field{font-size:16px;}
}
`;

export const color = (key) => THEME[key] ?? `var(--${key})`;
