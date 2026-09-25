// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// adminTheme.js — Desktop admin-panelets CSS.
// Bevidst adskilt fra src/theme.jsx (den mobile PWA's store, skærm-specifikke
// CSS-streng) — genbruger kun designsystemets farve-tokens for visuel
// konsistens, men bygger et helt andet layout (sidebar, tabeller, brede
// formularer) tilpasset en computer-skærm, ikke en telefon.
// ─────────────────────────────────────────────────────────────────────────────

export const adminCss = `
:root{
  --ink:#15201A;--ink2:rgba(21,32,26,.78);
  --paper:#F6F8F3;--paper2:#EEF1E9;
  --surface:#FFFFFF;--surface2:#F1F3EC;--surface3:#FAFBF8;
  --green:#0E8F5A;--green-dark:#08734A;--green-lt:rgba(14,143,90,.10);--green-mid:rgba(14,143,90,.18);--green-selected-bg:#EFF9F4;--on-green:#FFFFFF;
  --red:#C8402E;--red-lt:rgba(200,64,46,.08);--red-md:rgba(200,64,46,.18);
  --amber:#B5791A;--amber-lt:rgba(181,121,26,.08);--amber-md:rgba(181,121,26,.18);
  --blue:#3A6EA5;--blue-lt:rgba(58,110,165,.10);--blue-md:rgba(58,110,165,.20);
  --border:rgba(21,32,26,.10);--border2:rgba(21,32,26,.16);
  --muted:rgba(21,32,26,.58);--muted2:rgba(21,32,26,.40);
  --r:10px;--f:'DM Sans',system-ui,-apple-system,sans-serif;--mono:'DM Mono','SF Mono',monospace;
  --sidebar-w:232px;
}
*{box-sizing:border-box;}
html,body{margin:0;padding:0;}
body{
  font-family:var(--f);background:var(--paper);color:var(--ink);
  -webkit-font-smoothing:antialiased;font-size:14px;line-height:1.5;
}
#admin-root{min-height:100vh;}

/* ── Login ── */
.admin-login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
.admin-login-card{width:100%;max-width:360px;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:32px;box-shadow:0 2px 12px -4px rgba(21,32,26,.10);}
.admin-login-logo{font-size:19px;font-weight:900;color:var(--green);margin-bottom:4px;}
.admin-login-logo span{color:var(--ink);}
.admin-login-sub{font-size:12.5px;color:var(--muted);margin-bottom:24px;}
.admin-field{margin-bottom:14px;}
.admin-field label{display:block;font-size:11.5px;font-weight:700;color:var(--ink2);margin-bottom:5px;}
.admin-field input{width:100%;padding:9px 12px;border:1px solid var(--border2);border-radius:8px;font-family:var(--f);font-size:13.5px;background:var(--surface);color:var(--ink);}
.admin-field input:focus{outline:2px solid var(--green);outline-offset:-1px;border-color:var(--green);}
.admin-error{background:var(--red-lt);border:1px solid var(--red-md);color:var(--red);border-radius:8px;padding:9px 12px;font-size:12.5px;margin-bottom:14px;}

/* ── Buttons ── */
.admin-btn{font-family:var(--f);font-size:12.5px;font-weight:700;border-radius:8px;padding:8px 14px;cursor:pointer;border:1px solid transparent;display:inline-flex;align-items:center;gap:6px;transition:background .12s,border-color .12s;}
.admin-btn:disabled{opacity:.55;cursor:not-allowed;}
.admin-btn-primary{background:var(--green);color:var(--on-green);}
.admin-btn-primary:hover:not(:disabled){background:#146e40;}
.admin-btn-ghost{background:var(--surface);border-color:var(--border2);color:var(--ink);}
.admin-btn-ghost:hover:not(:disabled){background:var(--surface2);}
.admin-btn-danger{background:var(--red-lt);border-color:var(--red-md);color:var(--red);}
.admin-btn-danger:hover:not(:disabled){background:var(--red-md);}
.admin-btn-sm{padding:5px 10px;font-size:11.5px;}
.admin-btn-full{width:100%;justify-content:center;}

/* ── Layout ── */
.admin-shell{display:flex;min-height:100vh;}
.admin-sidebar{width:var(--sidebar-w);flex-shrink:0;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:20px 12px;}
.admin-sidebar-logo{font-size:17px;font-weight:900;color:var(--green);padding:0 10px 20px;}
.admin-sidebar-logo span{color:var(--ink);}
.admin-nav{display:flex;flex-direction:column;gap:2px;flex:1;}
.admin-nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;font-size:13px;font-weight:600;color:var(--ink2);cursor:pointer;border:none;background:none;font-family:var(--f);text-align:left;width:100%;}
.admin-nav-item:hover{background:var(--surface2);}
.admin-nav-item.active{background:var(--green-lt);color:var(--green);font-weight:800;}
.admin-nav-item .badge{margin-left:auto;background:var(--red);color:#fff;font-size:10px;font-weight:800;border-radius:10px;padding:1px 6px;min-width:16px;text-align:center;}
.admin-sidebar-footer{border-top:1px solid var(--border);padding-top:12px;margin-top:12px;}
.admin-sidebar-user{font-size:11.5px;color:var(--muted);padding:0 10px 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

.admin-main{flex:1;min-width:0;display:flex;flex-direction:column;}
.admin-topbar{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;border-bottom:1px solid var(--border);background:var(--surface);}
.admin-topbar h1{font-size:18px;font-weight:900;margin:0;}
.admin-content{flex:1;padding:24px 28px;max-width:1320px;width:100%;}

/* ── Cards / stats ── */
.admin-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px;}
.admin-stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 18px;}
.admin-stat-num{font-size:26px;font-weight:900;color:var(--ink);line-height:1.1;}
.admin-stat-label{font-size:11.5px;color:var(--muted);font-weight:600;margin-top:4px;}
.admin-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin-bottom:16px;}

/* ── Tables ── */
.admin-table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;}
table.admin-table{width:100%;border-collapse:collapse;font-size:13px;}
table.admin-table th{text-align:left;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:var(--muted);padding:10px 14px;background:var(--surface3);border-bottom:1px solid var(--border);white-space:nowrap;}
table.admin-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:middle;}
table.admin-table tr:last-child td{border-bottom:none;}
table.admin-table tr:hover td{background:var(--surface3);}
.admin-table-empty{padding:40px 20px;text-align:center;color:var(--muted);font-size:13px;}

/* ── Misc ── */
.admin-pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:100px;font-size:11px;font-weight:700;}
.admin-pill-green{background:var(--green-lt);color:var(--green);}
.admin-pill-red{background:var(--red-lt);color:var(--red);}
.admin-pill-amber{background:var(--amber-lt);color:var(--amber);}
.admin-pill-neutral{background:var(--surface2);color:var(--ink2);}
.admin-tabs{display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid var(--border);}
.admin-tab-btn{background:none;border:none;font-family:var(--f);font-size:12.5px;font-weight:700;color:var(--muted);padding:9px 14px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;}
.admin-tab-btn.active{color:var(--green);border-bottom-color:var(--green);}
.admin-search{width:100%;max-width:320px;padding:8px 12px;border:1px solid var(--border2);border-radius:8px;font-family:var(--f);font-size:13px;}
.admin-spinner{width:16px;height:16px;border:2px solid var(--border2);border-top-color:var(--green);border-radius:50%;animation:admin-spin .8s linear infinite;}
@keyframes admin-spin{to{transform:rotate(360deg);}}
.admin-loading-row{display:flex;align-items:center;gap:10px;padding:24px;color:var(--muted);font-size:13px;}
.admin-modal-overlay{position:fixed;inset:0;background:rgba(21,32,26,.45);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}
.admin-modal{background:var(--surface);border-radius:14px;max-width:640px;width:100%;max-height:88vh;overflow-y:auto;padding:24px;}
.admin-modal-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
textarea.admin-textarea{width:100%;padding:9px 12px;border:1px solid var(--border2);border-radius:8px;font-family:var(--f);font-size:13px;resize:vertical;min-height:90px;}
.admin-label{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px;display:block;}
`;
