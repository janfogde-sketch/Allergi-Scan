// @ts-check
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
  --green:#0F7D4F;--green-dark:#0C643F;--green-lt:rgba(15,125,79,.10);--green-mid:rgba(15,125,79,.18);--green-selected-bg:#EFF9F4;--on-green:#FFFFFF;
  --green-accent:#34D06A;--green-accent-lt:rgba(52,208,106,.14);--green-accent-mid:rgba(52,208,106,.26);
  --red:#C8402E;--red-lt:rgba(200,64,46,.08);--red-md:rgba(200,64,46,.18);
  --amber:#9A6514;--amber-lt:rgba(181,121,26,.08);--amber-md:rgba(181,121,26,.18);
  --blue:#3A6EA5;--blue-lt:rgba(58,110,165,.10);--blue-md:rgba(58,110,165,.20);
  --border:rgba(21,32,26,.10);--border2:rgba(21,32,26,.16);
  --muted:rgba(21,32,26,.66);--muted2:rgba(21,32,26,.40);
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
.admin-login-logo{display:flex;align-items:center;gap:8px;font-size:19px;font-weight:900;color:var(--ink);margin-bottom:4px;}
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
.admin-sidebar{width:var(--sidebar-w);flex-shrink:0;position:sticky;top:0;height:100vh;height:100dvh;box-sizing:border-box;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;}
.admin-sidebar-head{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:calc(16px + env(safe-area-inset-top)) 12px 12px 22px;}
.admin-sidebar-logo{display:flex;align-items:center;gap:7px;font-size:17px;font-weight:900;color:var(--ink);}
.admin-nav-close{display:none;}
.admin-nav{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;padding:0 12px 8px;}
.admin-nav-group{display:flex;flex-direction:column;margin-bottom:2px;}
.admin-nav-group-head{display:flex;align-items:center;gap:6px;min-height:34px;padding:4px 10px;border:none;background:none;font-family:var(--f);font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);cursor:pointer;width:100%;text-align:left;border-radius:6px;}
@media (hover:hover){.admin-nav-group-head:hover{background:var(--surface2);}}.admin-nav-group-head:active{background:var(--surface2);}
.admin-nav-group-label{flex:1;min-width:0;overflow-wrap:anywhere;}
.admin-nav-chev{display:inline-flex;flex:none;}
.admin-nav-chev.closed{transform:rotate(-90deg);}
.admin-nav-items{display:flex;flex-direction:column;}
.admin-nav-item{display:flex;align-items:center;gap:10px;min-height:36px;padding:4px 10px 4px 14px;border-radius:8px;font-size:13px;font-weight:600;color:var(--ink2);cursor:pointer;border:none;background:none;font-family:var(--f);text-align:left;width:100%;}
@media (hover:hover){.admin-nav-item:hover{background:var(--surface2);}}
.admin-nav-item:active{background:var(--surface2);}
.admin-nav-item.active,.admin-nav-item.active:hover,.admin-nav-item.active:active{background:var(--green-lt);color:var(--green);font-weight:800;}
.admin-nav-label{flex:1;min-width:0;line-height:1.25;overflow-wrap:anywhere;}
.admin-nav-item:focus-visible,.admin-nav-group-head:focus-visible,.admin-nav-close:focus-visible{outline:2px solid var(--green);outline-offset:-2px;}
.admin-nav-item .badge,.admin-nav-group-head .badge{margin-left:auto;flex:none;box-sizing:border-box;min-width:20px;height:20px;padding:0 6px;border-radius:10px;font-size:11px;font-weight:800;line-height:20px;text-align:center;letter-spacing:0;text-transform:none;background:var(--surface2);color:var(--ink2);}
.admin-nav-item .badge.warn,.admin-nav-group-head .badge.warn{background:var(--amber-lt);color:var(--amber);}
.admin-nav-item .badge.crit,.admin-nav-group-head .badge.crit{background:var(--red);color:#fff;}
.admin-sidebar-footer{flex:0 0 auto;display:flex;flex-direction:column;gap:4px;border-top:1px solid var(--border);padding:8px 12px calc(8px + env(safe-area-inset-bottom));}
.admin-sidebar-user{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);padding:0 10px;min-width:0;}.admin-sidebar-user span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.admin-sidebar-footer .admin-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;}.admin-btn-quiet{color:var(--muted);}
@media (max-height:480px){.admin-sidebar-footer{flex-direction:row;flex-wrap:wrap;}.admin-sidebar-user{flex:1 1 100%;}.admin-sidebar-footer>*:not(.admin-sidebar-user){flex:1 1 0;min-width:0;}}
.admin-main{flex:1;min-width:0;display:flex;flex-direction:column;}
.admin-topbar{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;border-bottom:1px solid var(--border);background:var(--surface);}
.admin-topbar h1{font-size:18px;font-weight:900;margin:0;}
.admin-content{flex:1;padding:24px 28px;max-width:1320px;width:100%;}

/* ── Cards / stats ── */
.admin-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px;}
.admin-stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:10px 12px;min-height:76px;box-sizing:border-box;text-align:left;font-family:var(--f);display:block;}
.admin-stat-link{cursor:pointer;width:100%;}
.admin-stat-link:hover{border-color:var(--green);}
.admin-stat-link:active{background:var(--surface2);}
.admin-stat-num{font-size:24px;font-weight:900;color:var(--ink);line-height:1.1;font-variant-numeric:tabular-nums;}
.admin-stat-label{font-size:11.5px;color:var(--ink2);font-weight:700;margin-top:3px;}
.admin-stat-hint{font-size:10.5px;color:var(--muted);margin-top:1px;line-height:1.3;}
.admin-skeleton .admin-stat-num{background:var(--surface2);border-radius:6px;width:60%;}
.admin-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
.admin-bar{flex:1;min-width:2px;height:100%;display:flex;align-items:flex-end;padding:0;border:none;background:none;cursor:pointer;}
.admin-bar:focus-visible{outline:2px solid var(--ink);outline-offset:1px;}
.admin-segment{display:inline-flex;border:1px solid var(--border);border-radius:10px;overflow:hidden;}
.admin-segment button{background:var(--surface);border:none;border-right:1px solid var(--border);font-family:var(--f);font-size:12.5px;font-weight:700;color:var(--muted);padding:8px 14px;min-height:36px;cursor:pointer;}
.admin-segment button:last-child{border-right:none;}
.admin-segment button.active{background:var(--green-lt);color:var(--green);}
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
.admin-pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:100px;font-size:11px;font-weight:700;white-space:nowrap;}
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

/* ── To do-liste ── */
select.admin-select{padding:8px 10px;border:1px solid var(--border2);border-radius:8px;font-family:var(--f);font-size:13px;background:var(--surface);color:var(--ink);max-width:100%;}
select.admin-select:focus,.admin-field input[type=date]:focus{outline:2px solid var(--green);outline-offset:-1px;border-color:var(--green);}
.admin-field select.admin-select{width:100%;padding:9px 12px;font-size:13.5px;}
.admin-modal{overflow-x:hidden;min-width:0;overscroll-behavior:contain;}
.todo-panel{display:flex;flex-direction:column;padding:0;overflow:hidden;}
.todo-panel-head{flex:0 0 auto;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border);}
.todo-panel-body{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding:16px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}
.todo-panel-foot{flex:0 0 auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 16px calc(8px + env(safe-area-inset-bottom));border-top:1px solid var(--border);background:var(--surface);}
.todo-panel-foot .todo-spacer{margin-left:auto;}
.todo-panel-foot .admin-btn-primary:disabled{background:var(--surface2);color:var(--muted);border:1px solid var(--border2);opacity:1;cursor:default;}
.todo-panel .admin-field,.todo-panel .admin-field *,.todo-comment,.todo-comment *{min-width:0;max-width:100%;}
.todo-panel .admin-field select.admin-select,.todo-panel textarea.admin-textarea,.todo-panel .admin-field input{width:100%;}
.todo-date-row{display:flex;gap:8px;align-items:stretch;}
.todo-date-field{position:relative;flex:1 1 auto;display:flex;align-items:center;gap:8px;min-height:44px;padding:9px 12px;border:1px solid var(--border2);border-radius:8px;background:var(--surface);font-size:13.5px;font-weight:500;color:var(--ink);cursor:pointer;margin:0;}
.todo-date-field:focus-within{outline:2px solid var(--green);outline-offset:-1px;border-color:var(--green);}
.todo-date-field input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0;}
textarea.todo-title-input{min-height:44px;resize:none;overflow:hidden;font-size:13.5px;line-height:1.4;font-family:var(--f);color:var(--ink);background:var(--surface);}
textarea.todo-title-input:focus{outline:2px solid var(--green);outline-offset:-1px;border-color:var(--green);}
.todo-comment-body.clamped{display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden;}
.todo-comment-body{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;font-size:13px;line-height:1.45;margin-top:3px;}
.todo-activity{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;font-size:12px;line-height:1.4;overflow-wrap:anywhere;}
.todo-comment.fresh{border-color:var(--green);background:var(--green-selected-bg);}
.todo-confirm{background:var(--red-lt);border:1px solid var(--red-md);border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:13px;}
.admin-icon-btn.spinning svg{animation:admin-spin .8s linear infinite;}
.audit-head{display:flex !important;flex-wrap:nowrap !important;justify-content:space-between;align-items:center;margin-bottom:10px;gap:12px;}
.audit-intro{flex:1;min-width:0;font-size:13px;color:var(--muted);}
.admin-disclosure{margin-top:10px;}
.admin-disclosure-head{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:44px;padding:8px 2px;background:none;border:none;border-top:1px solid var(--border);font-family:var(--f);font-size:12.5px;font-weight:700;color:var(--ink2);cursor:pointer;text-align:left;}
.admin-disclosure-head:focus-visible{outline:2px solid var(--green);outline-offset:-2px;}
.admin-disclosure-chev{display:inline-flex;transition:transform .15s ease;}
.admin-disclosure-chev.open{transform:rotate(180deg);}
.admin-disclosure-meta{flex:none;font-size:12.5px;font-weight:600;color:var(--ink2);font-variant-numeric:tabular-nums;white-space:nowrap;}
.admin-disclosure-body{padding:0 2px 6px;font-size:12.5px;color:var(--muted);line-height:1.5;}
.audit-sheet-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:14px;}
.audit-sheet-title{font-size:16px;font-weight:800;color:var(--ink);overflow-wrap:anywhere;}
.audit-sheet-time{font-size:12px;color:var(--muted);margin-top:2px;}
.audit-sheet-close{margin:-8px -8px 0 0;}
.audit-tech{display:flex;flex-direction:column;gap:6px;margin:0;}
.audit-tech-row{display:grid;grid-template-columns:96px minmax(0,1fr) 44px;align-items:start;column-gap:8px;}
.audit-tech-row dt{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;padding-top:2px;}
.audit-tech-row dd{margin:0;min-width:0;font-family:var(--mono,ui-monospace,monospace);font-size:12px;color:var(--ink2);overflow-wrap:anywhere;word-break:break-word;padding-top:1px;}
@media (max-width:520px){.audit-tech-row{grid-template-columns:minmax(0,1fr) 44px;}.audit-tech-row dt{grid-column:1;grid-row:1;align-self:center;padding-top:0;}.audit-tech-row .audit-copy{grid-column:2;grid-row:1;}.audit-tech-row dd{grid-column:1/-1;grid-row:2;}}
.audit-results{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:2px 2px 8px;font-size:12.5px;color:var(--muted);}
.audit-copy{flex:none;width:44px;height:44px;margin:-8px -8px -8px 0;display:inline-flex;align-items:center;justify-content:center;background:none;border:none;border-radius:8px;cursor:pointer;}
.audit-copy:active{background:var(--surface2);}
.audit-card{position:relative;padding-right:36px;text-align:left;}
.audit-card-cat{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:2px;}
.audit-card-outcome{font-size:12px;font-weight:700;color:var(--red);margin-top:2px;}
.audit-card-chev{position:absolute;right:12px;top:50%;transform:translateY(-50%);display:flex;}
.audit-card-title{display:flex;align-items:center;gap:6px;}
.audit-search-chip{display:inline-flex;align-items:center;gap:6px;max-width:100%;min-height:32px;padding:4px 6px 4px 10px;margin:0 0 8px;border:1px solid var(--green);background:var(--green-selected-bg,var(--green-lt));color:var(--green);border-radius:999px;font-size:12.5px;font-weight:700;font-family:var(--f);cursor:pointer;}
.audit-sheet-safe{padding-bottom:env(safe-area-inset-bottom);}
.audit-filter-search,.audit-filter-wide{grid-column:1/-1;}
.audit-filter-panel{grid-template-columns:repeat(auto-fit,minmax(min(150px,100%),1fr));}
.audit-filter-panel .admin-select,.audit-filter-panel input[type=date],.audit-filter-panel .admin-search{width:100%;min-height:40px;box-sizing:border-box;}
.audit-filter-panel input[type=date]{padding:8px 10px;border:1px solid var(--border2);border-radius:8px;font-family:var(--f);font-size:13px;background:var(--surface);color:var(--ink);}
.ai-kpi-sub{font-size:11px;color:var(--muted);margin-top:2px;font-weight:600;}
.ai-kpi-sub.up{color:var(--amber);}
.ai-controls{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;margin-bottom:10px;}
.ai-controls label{display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px;}
.ai-controls select,.ai-controls input[type=date]{min-height:40px;padding:8px 10px;border:1px solid var(--border2);border-radius:8px;font-family:var(--f);font-size:13px;background:var(--surface);color:var(--ink);box-sizing:border-box;}
.ai-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:12px;}
.ai-card-title{font-size:13px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.ai-card-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;}
.ai-card-head .ai-card-title{margin:0;}
.ai-progress{height:8px;border-radius:999px;background:var(--surface2);overflow:hidden;}
.ai-progress>span{display:block;height:100%;border-radius:999px;background:var(--green);}
.ai-progress.warn>span{background:var(--amber);}
.ai-progress.over>span{background:var(--red);}
.ai-progress.muted>span{background:var(--muted2);}
.onb-row.zero{opacity:.55;}
.ai-fn{margin-bottom:10px;}
.ai-fn:last-child{margin-bottom:0;}
.ai-fn-top{display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:700;margin-bottom:4px;}
.ai-fn-top span:last-child{font-variant-numeric:tabular-nums;white-space:nowrap;}
.ai-fn-sub{font-size:11.5px;color:var(--muted);margin-top:3px;}
.ai-detail{margin:0;display:grid;grid-template-columns:1fr auto;gap:4px 12px;font-size:12.5px;}
.ai-detail dt{color:var(--muted);}
.ai-detail dd{margin:0;text-align:right;color:var(--ink);font-variant-numeric:tabular-nums;}
.ai-flag{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:999px;background:var(--amber-lt);color:var(--amber);font-size:10.5px;font-weight:800;vertical-align:middle;}
.ai-note{font-size:12px;color:var(--muted);margin:8px 0 0;}
.ai-chart-note{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.ai-info-btn{flex:none;width:44px;height:44px;margin:-12px -10px -12px 0;display:inline-flex;align-items:center;justify-content:center;background:none;border:none;border-radius:8px;cursor:pointer;}
.ai-info-btn:focus-visible{outline:2px solid var(--green);outline-offset:-2px;}
.ai-focus{margin-top:6px;}
.ai-day{margin-top:8px;padding:10px 12px;background:var(--surface2);border-radius:10px;}
.ai-day-title{font-size:13px;font-weight:800;color:var(--ink);margin-bottom:6px;}
.audit-state{display:flex;flex-direction:column;align-items:center;gap:4px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:32px 20px;}
.audit-state-icon{width:44px;height:44px;border-radius:50%;background:var(--surface2);display:flex;align-items:center;justify-content:center;margin-bottom:6px;}
.audit-state-title{font-size:14px;font-weight:800;color:var(--ink);}
.audit-card{display:block;}
.audit-card-head{display:flex;align-items:center;gap:8px;margin-bottom:4px;}
.audit-card-title{font-size:13.5px;font-weight:800;color:var(--ink);}
.audit-card-text{font-size:13px;color:var(--ink2);overflow-wrap:anywhere;}
.audit-card-change{font-size:12.5px;color:var(--muted);margin-top:2px;overflow-wrap:anywhere;}
.audit-card-date{font-size:12px;color:var(--muted);margin-top:4px;}
.audit-detail{margin:0 0 8px;display:flex;flex-direction:column;gap:8px;}
.audit-detail-row{display:flex;flex-direction:column;gap:1px;}
.audit-detail dt{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
.audit-detail dd{margin:0;font-size:13.5px;color:var(--ink);overflow-wrap:anywhere;}
.err-tabs{margin-bottom:12px;}
.err-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;}
.err-stats div{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:8px 10px;min-width:0;}
.err-stats b{display:block;font-size:16px;font-weight:800;color:var(--ink);font-variant-numeric:tabular-nums;}
.err-stats span{display:block;font-size:11px;color:var(--muted);line-height:1.3;}
.err-card{position:relative;padding-right:36px;}
.err-card-top{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:4px;}
.err-card-area{font-size:13.5px;font-weight:800;color:var(--ink);overflow-wrap:anywhere;margin-right:2px;}
.err-card-msg{font-size:13px;color:var(--ink2);overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.err-card-meta{font-size:12px;color:var(--muted);margin-top:4px;}
.err-sev{display:inline-flex;align-items:center;padding:1px 8px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;border:1px solid var(--border2);color:var(--ink2);background:transparent;}
.err-sev-critical{background:var(--ink);border-color:var(--ink);color:var(--surface);}
.err-sev-high{border-color:var(--amber-md);color:var(--amber);background:var(--amber-lt);}
.err-sev-medium{border-color:var(--blue-md);color:var(--blue);background:var(--blue-lt);}
.err-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;}
.err-sheet{min-width:0;}
.err-message{margin:0 0 10px;font-size:14px;font-weight:600;color:var(--ink);overflow-wrap:anywhere;word-break:break-word;}
.err-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 8px;}
.err-actions .admin-btn{flex:1 1 140px;justify-content:center;}
.err-prompt-btn{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:6px;margin-bottom:8px;}
.err-ignore{margin:12px 0 8px;display:flex;flex-direction:column;gap:6px;}
.err-ignore label,.err-sevrow label{font-size:11px;font-weight:700;color:var(--muted);}
.err-ignore textarea{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border2);border-radius:8px;font-family:var(--f);font-size:14px;background:var(--surface);color:var(--ink);resize:vertical;}
.err-sevrow{display:flex;flex-direction:column;gap:4px;margin:8px 0;}
.err-sevrow .admin-select{width:100%;min-height:40px;box-sizing:border-box;}
.err-sevhelp{font-size:12px;color:var(--muted);}
.err-tech{display:flex;flex-direction:column;gap:10px;min-width:0;}
.err-code-wrap{min-width:0;}
.err-code-head{display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
.err-code-head .audit-copy{margin:-8px -8px -8px 0;}
.err-code{margin:2px 0 0;padding:8px 10px;max-width:100%;max-height:260px;overflow:auto;box-sizing:border-box;background:var(--surface2);border:1px solid var(--border);border-radius:8px;font-family:var(--mono,ui-monospace,monospace);font-size:11.5px;line-height:1.45;color:var(--ink2);white-space:pre;-webkit-overflow-scrolling:touch;}
.err-code-wrap.more-x .err-code{box-shadow:inset -14px 0 10px -10px var(--border2);}
.err-code-wrap.more-y .err-code{box-shadow:inset 0 -14px 10px -10px var(--border2);}
.err-code-wrap.more-x.more-y .err-code{box-shadow:inset -14px -14px 10px -10px var(--border2);}
.err-orig{margin:2px 0 4px;}
.err-resolve .err-ignore{margin-top:4px;}
.usr-tabs{margin-bottom:12px;}
.usr-tabs .admin-tab-btn{padding-left:11px;padding-right:11px;}
.admin-item-card.audit-card,.admin-item-card.err-card,.admin-item-card.usr-row{padding-right:36px;}
.usr-row{position:relative;padding-right:36px;}
.usr-row-name{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:800;color:var(--ink);overflow-wrap:anywhere;}
.usr-row-mail{font-size:13px;color:var(--ink2);overflow-wrap:anywhere;}
.usr-row-meta{font-size:12px;color:var(--muted);margin-top:3px;}
.usr-warn{color:var(--amber);font-weight:700;}
.np-layout{display:block;}
.np-list{min-width:0;}
.np-detail{min-width:0;}
.np-items{display:flex;flex-direction:column;gap:2px;padding:0 0 6px;}
.np-item{display:flex;align-items:center;gap:8px;width:100%;min-height:44px;padding:8px 10px;background:none;border:none;border-left:3px solid transparent;border-radius:8px;font-family:var(--f);font-size:14px;color:var(--ink);text-align:left;cursor:pointer;}
.np-item.active{border-left-color:var(--green);background:var(--green-lt);font-weight:700;}
.np-item:focus-visible{outline:2px solid var(--green);outline-offset:-2px;}
.np-item-name{flex:1;min-width:0;overflow-wrap:anywhere;}
.np-editor-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.np-editor-title{font-size:17px;font-weight:800;overflow-wrap:anywhere;}
.np-editor-sub{font-size:12px;color:var(--muted);}
.np-field-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;}
.np-count{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums;}
.np-count.over{color:var(--red);font-weight:700;}
.np-vars{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:12px;}
.np-vars-label{font-size:12px;color:var(--muted);flex:1 1 100%;}
.np-push{background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:12px 14px;max-width:360px;}
.np-push-head{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--muted);margin-bottom:4px;font-weight:700;letter-spacing:.03em;}
.np-push-tag{font-weight:600;letter-spacing:0;}
.np-push-title{font-size:14px;font-weight:700;overflow-wrap:anywhere;}
.np-push-body{font-size:13.5px;color:var(--ink2);overflow-wrap:anywhere;line-height:1.4;}
.np-note{font-size:12.5px;color:var(--muted);line-height:1.5;margin:8px 0;}
.np-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px;}
.np-dirty{font-size:12px;font-weight:700;color:var(--amber);}
.np-modes{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0;}
.np-bigbtn{margin-left:auto;}
.np-frame{display:block;width:100%;max-width:640px;border:1px solid var(--border);border-radius:10px;background:var(--paper);margin:0 auto;}
.np-big{width:100%;max-width:720px;height:min(92dvh,900px);}
.np-big-body{flex:1 1 auto;min-height:0;display:flex;overflow:hidden;}
.np-frame-big{flex:1 1 auto;width:100%;max-width:none;height:100%;border:0;border-radius:0;margin:0;}
.np-info-btn{display:inline-flex;vertical-align:middle;margin:-12px 0 -12px 2px;}
.np-mono{font-family:var(--mono);font-size:12px;overflow-wrap:anywhere;}
.np-channels{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;}
.np-channels label{display:flex;gap:6px;align-items:center;font-size:13.5px;min-height:44px;}
.np-channels input[type=checkbox]{width:auto;}
.np-result{margin-top:12px;border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.5;border:1px solid var(--border);}
.np-result.ok{background:var(--green-lt);}
.np-result.partial{background:var(--surface2);border-color:var(--amber);}
.np-result.failed{background:var(--surface2);border-color:var(--red);}
.np-result-title{font-weight:800;margin-bottom:4px;}
.np-result .bad{color:var(--red);}
@media (max-width:899px){.np-layout.editing .np-list{display:none;}.np-layout:not(.editing) .np-detail{display:none;}}
@media (min-width:900px){.np-layout{display:grid;grid-template-columns:minmax(240px,300px) 1fr;gap:20px;align-items:start;}.np-back{display:none;}}
.fam-filters-wrap{position:relative;}
.fam-filters-wrap.more::after{content:"";position:absolute;top:0;right:0;bottom:12px;width:28px;pointer-events:none;background:linear-gradient(to right,transparent,var(--paper));}
.fam-empty{font-size:12.5px;color:var(--muted);padding:4px 0 8px;}
.fam-off .admin-disclosure{margin-top:4px;}
.fam-filters{overflow-x:auto;flex-wrap:nowrap;scrollbar-width:thin;-webkit-overflow-scrolling:touch;}
.fam-filters .admin-tab-btn{flex:0 0 auto;white-space:nowrap;}
.pe-panel{max-width:600px;width:100%;}
.pe-section{font-size:12px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:var(--ink2);margin:18px 0 8px;padding-top:12px;border-top:1px solid var(--border);}
.pe-section:first-child{margin-top:0;border-top:none;padding-top:0;}
.pe-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
@media (max-width:520px){.pe-grid{grid-template-columns:1fr;}}
.pe-notice{font-size:12.5px;line-height:1.45;border-radius:10px;padding:8px 10px;margin:0 0 8px;border:1px solid var(--border);}
.pe-amber{background:var(--amber-lt);border-color:var(--amber-md);color:var(--ink);}
.pe-red{background:var(--red-lt);border-color:var(--red-md);color:var(--ink);}
.pe-flags{display:flex;flex-direction:column;gap:6px;margin:8px 0;}
.pe-flag{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 10px;border:1px solid var(--border);border-left-width:4px;border-radius:10px;background:var(--surface);}
.pe-flag label{font-size:13.5px;font-weight:600;min-width:0;overflow-wrap:anywhere;}
.pe-flag select{width:176px;flex:none;min-height:40px;}
.pe-t-neutral{border-left-color:var(--border2);}
.pe-t-red{border-left-color:var(--red);background:var(--red-lt);}
.pe-t-amber{border-left-color:var(--amber);background:var(--amber-lt);}
.pe-t-green{border-left-color:var(--green);}
.pe-conflict{outline:2px solid var(--amber);outline-offset:-2px;}
.pe-legend{margin:6px 0 0;padding-left:18px;}
.pe-legend li{margin-bottom:4px;}
.pe-history{list-style:none;margin:0;padding:0;}
.pe-history li{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);font-size:12.5px;}
.pe-muted{font-size:12.5px;color:var(--muted);padding:6px 0;}
.pe-danger{margin-top:22px;padding-top:14px;border-top:1px solid var(--border);}
.pe-del{color:var(--red);border-color:var(--red-md);}
.fam-sub{font-size:12px;font-weight:800;color:var(--ink2);margin:14px 0 6px;}
.fam-line{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);}
.fam-line-title{font-size:14px;font-weight:700;overflow-wrap:anywhere;}
.fam-line-meta{font-size:12px;color:var(--muted);margin-top:2px;}
.fam-reason{margin-top:10px;}
.usr-export{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--ink2);}
.usr-export:hover{color:var(--green);}
.usr-export:disabled{opacity:.5;cursor:default;}
.usr-chips{display:flex;flex-wrap:wrap;gap:6px;min-width:0;}
.usr-chip{display:inline-flex;align-items:center;gap:5px;max-width:100%;min-height:36px;padding:4px 11px;border:1px solid var(--border2);border-radius:999px;background:var(--surface);color:var(--ink2);font-family:var(--f);font-size:12.5px;font-weight:700;cursor:pointer;overflow-wrap:anywhere;}
.usr-chip.on{border-color:var(--green);background:var(--green-selected-bg,var(--green-lt));color:var(--ink);}
span.usr-chip{cursor:default;min-height:30px;}
.usr-chip:focus-visible{outline:2px solid var(--green);outline-offset:1px;}
.usr-chip-x{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin-right:-6px;border:none;background:none;border-radius:50%;cursor:pointer;}
.usr-none,.usr-hint{font-size:12.5px;color:var(--muted);margin-top:4px;}
.usr-err{font-size:12px;color:var(--red);margin-top:4px;}
.usr-add{display:flex;gap:8px;align-items:center;margin-top:8px;}
.usr-add input{flex:1;min-width:0;}
.usr-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.usr-readonly{background:var(--surface2) !important;color:var(--muted) !important;}
.usr-check{display:flex !important;align-items:flex-start;gap:10px;min-height:44px;padding:6px 0;font-size:13px !important;font-weight:600 !important;color:var(--ink2) !important;cursor:pointer;margin-bottom:0 !important;}
.usr-check span{flex:1;min-width:0;overflow-wrap:anywhere;}
.admin-field .usr-check input[type=checkbox],.usr-check input[type=checkbox]{width:20px;height:20px;flex:none;padding:0;margin:2px 0 0;accent-color:var(--green);}
.usr-traces{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;font-size:13px;}
.usr-traces li{display:flex;justify-content:space-between;gap:10px;}
.usr-traces li span:last-child{color:var(--muted);text-align:right;}
.usr-diff{margin:6px 0 0;padding-left:18px;font-size:13px;color:var(--ink2);display:flex;flex-direction:column;gap:3px;}
.usr-line{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:13.5px;}
.usr-edit-btn{width:100%;margin-top:8px;}
.usr-panel .admin-tabs{padding:0 12px;margin:0;}
.usr-panel .admin-field input,.usr-panel .admin-field select.admin-select,.usr-panel textarea.admin-textarea{max-width:100%;box-sizing:border-box;}
.err-history{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;}
.err-history-title{font-size:13px;font-weight:700;color:var(--ink);}
.err-history-meta{font-size:12px;color:var(--muted);}
.err-history-reason{font-size:12.5px;color:var(--ink2);overflow-wrap:anywhere;}
.todo-toolbar{gap:6px;margin-bottom:6px;}
.todo-search{position:relative;flex:1 1 180px;min-width:0;}
.todo-search .admin-search{width:100%;max-width:none;min-height:40px;padding:8px 44px 8px 34px;box-sizing:border-box;background:var(--surface);border:1px solid var(--border2);border-radius:8px;-webkit-appearance:none;appearance:none;}
.todo-search .admin-search:focus{outline:2px solid var(--green);outline-offset:-1px;border-color:var(--green);}
.todo-search .admin-search::-webkit-search-cancel-button{-webkit-appearance:none;display:none;}
.todo-toolbar>.admin-select,.todo-toolbar>select{flex:0 1 auto;width:auto;max-width:190px;min-height:40px;}
.todo-toolbar>.admin-btn{min-height:40px;white-space:nowrap;}
.todo-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);display:flex;pointer-events:none;}
.todo-search-clear{position:absolute;right:0;top:0;bottom:0;width:44px;background:none;border:none;cursor:pointer;color:var(--muted);display:flex;align-items:center;justify-content:center;}
.todo-card-title{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.admin-item-card .todo-meta{gap:4px;margin-top:4px;}
.admin-item-card .todo-meta .admin-pill{padding:2px 8px;font-size:11px;}
.admin-item-card .todo-meta-line{margin-top:4px;}
textarea.todo-grow{resize:none;overflow:hidden;line-height:1.45;font-family:var(--f);color:var(--ink);background:var(--surface);}
textarea.todo-desc-input{min-height:120px;line-height:1.6;white-space:pre-wrap;}
textarea.todo-comment-input{flex:1;min-height:60px;max-height:160px;font-size:13px;}
textarea.todo-grow:focus{outline:2px solid var(--green);outline-offset:-1px;border-color:var(--green);}
@media (max-width:480px){.todo-grid{grid-template-columns:1fr;}}
.todo-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 0 6px;margin-bottom:6px;-webkit-overflow-scrolling:touch;scroll-padding-inline:0;}
.todo-chips::after{content:"";flex:0 0 16px;}
.todo-chips.more{-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 36px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 36px),transparent);}
.todo-chips::-webkit-scrollbar{display:none;}
.todo-chip{flex:0 0 auto;font-family:var(--f);font-size:12.5px;font-weight:700;color:var(--ink2);background:var(--surface);border:1px solid var(--border2);border-radius:999px;padding:6px 12px;min-height:36px;cursor:pointer;white-space:nowrap;}
.todo-chip.active{border-color:var(--green);background:var(--green-selected-bg);color:var(--green);}
.todo-chip:focus-visible,.todo-check:focus-visible,.admin-item-card:focus-visible{outline:2px solid var(--green);outline-offset:2px;}
.todo-check{position:relative;}
.todo-check::after{content:"";position:absolute;inset:-11px;}
.todo-meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px;}
.todo-meta-line{font-size:12.5px;color:var(--muted);margin-top:6px;overflow-wrap:anywhere;}
.todo-meta-line strong{color:var(--ink2);font-weight:600;}
.todo-meta-line .late{color:var(--amber);font-weight:800;}
.admin-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:10px;border:1px solid var(--border2);background:var(--surface);color:var(--ink2);cursor:pointer;padding:0;}
.admin-icon-btn:hover{border-color:var(--green);color:var(--green);}
.admin-icon-btn:focus-visible{outline:2px solid var(--green);outline-offset:2px;}
.todo-undo{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom));z-index:120;display:flex;align-items:center;gap:12px;background:var(--ink);color:#fff;border-radius:12px;padding:8px 8px 8px 16px;font-size:13px;max-width:calc(100vw - 32px);box-shadow:var(--sh);}
.todo-undo button{background:none;border:none;color:#fff;font-family:var(--f);font-weight:800;font-size:13px;text-decoration:underline;cursor:pointer;min-height:44px;padding:0 12px;}
.beta-cell{color:var(--ink);background:var(--surface2);border-radius:10px;padding:10px 12px;min-height:56px;text-align:left;border:none;font-family:var(--f);}
.beta-cell b{display:block;font-size:20px;font-weight:800;line-height:1.1;}
.beta-cell span{font-size:11.5px;color:var(--muted);}
button.beta-cell{cursor:pointer;} button.beta-cell:focus-visible{outline:2px solid var(--green);outline-offset:2px;}
.admin-axis{display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;font-size:10px;color:var(--muted);height:64px;padding-right:6px;min-width:22px;}
.dash{display:flex;flex-direction:column;gap:20px;}
.dash .admin-card,.dash .admin-chart-grid{margin-bottom:0;}
.dash-top{display:grid;gap:20px;grid-template-columns:minmax(0,1fr);}
.dash-head{display:flex;justify-content:space-between;align-items:center;gap:4px 8px;flex-wrap:wrap;margin-bottom:8px;min-height:36px;}
.dash-h{font-size:13px;font-weight:800;margin:0;color:var(--ink);}
.dash-info-btn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;margin:-8px 0;background:none;border:none;border-radius:50%;color:var(--muted);cursor:pointer;padding:0;}
.dash-info-btn:hover{color:var(--green);}
.dash-info-btn:focus-visible,.dash-attn-row:focus-visible,.dash-dist-row:focus-visible,.dash-more:focus-visible{outline:2px solid var(--green);outline-offset:2px;}
.dash-stat-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.dash .admin-stat-hint{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;}
.dash-attn{padding:6px 8px;}
.dash-attn-row{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;background:none;border:none;border-radius:8px;padding:6px 8px;font-family:var(--f);font-size:13px;font-weight:600;color:var(--ink);cursor:pointer;text-align:left;}
.dash-attn-row:hover{background:var(--surface2);}
.dash-attn-icon{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;flex-shrink:0;}
.dash-attn-icon.info{background:var(--surface2);color:var(--ink2);}
.dash-attn-icon.warn{background:var(--amber-lt);color:var(--amber);}
.dash-attn-icon.late{background:var(--red-lt);color:var(--red);}
.dash-attn-text{flex:1;min-width:0;overflow-wrap:anywhere;}
.dash-empty{padding:10px 8px;font-size:13px;color:var(--muted);}
.dash-chart{padding:14px 16px;}
.dash-chart-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:8px;}
.dash-chart-title{font-size:13px;font-weight:800;}
.dash-chart-total{font-size:11px;color:var(--muted);}
.dash-plot{display:flex;align-items:flex-end;height:64px;border-bottom:1px solid var(--border);touch-action:pan-y;user-select:none;-webkit-user-select:none;}
.admin-bar.sel{background:var(--surface2);}
.dash-tip{position:absolute;z-index:5;width:104px;height:34px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;background:var(--surface);color:var(--ink);border:1px solid var(--border2);border-radius:8px;box-shadow:var(--sh);padding:2px 6px;font-size:11px;line-height:1.25;text-align:center;pointer-events:none;}
.dash-tip b{font-size:11px;font-weight:800;white-space:nowrap;}
.dash-tip span{color:var(--ink2);font-weight:600;white-space:nowrap;}
.dash-period button{flex:1 1 auto;min-width:56px;white-space:nowrap;padding-left:10px;padding-right:10px;text-align:center;}
.dash-chev{display:inline-flex;transition:transform .15s ease;}
.dash-chev.open{transform:rotate(180deg);}
@media(max-width:559px){.dash-head.stack{flex-direction:column;align-items:stretch;}.dash-head.stack .dash-period{width:100%;}}
.dash-more{display:inline-flex;align-items:center;gap:6px;background:none;border:none;color:var(--muted);font-family:var(--f);font-size:12.5px;font-weight:700;cursor:pointer;min-height:44px;padding:0 4px;margin-top:2px;}
.dash-dist{margin-top:10px;padding-top:12px;border-top:1px solid var(--border);}
.dash-dist-label{font-size:11.5px;font-weight:700;color:var(--muted);margin-bottom:4px;}
.dash-dist-row{display:flex;align-items:center;gap:10px;width:100%;min-height:40px;background:none;border:none;border-radius:8px;padding:0 4px;font-family:var(--f);color:var(--ink);cursor:pointer;text-align:left;}
.dash-dist-row:hover{background:var(--surface2);}
.dash-dist-name{flex:0 0 38%;min-width:0;font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dash-dist-bar{flex:1;height:6px;border-radius:3px;background:var(--surface2);overflow:hidden;}
.dash-dist-bar>span{display:block;height:100%;border-radius:3px;}
.dash-dist-count{flex:0 0 28px;text-align:right;font-size:12.5px;font-weight:800;font-variant-numeric:tabular-nums;}
.beta-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
@media(min-width:560px){.beta-grid{grid-template-columns:repeat(4,minmax(0,1fr));}}
@media(min-width:700px){.dash-stat-grid{grid-template-columns:repeat(4,minmax(0,1fr));}}
@media(min-width:1100px){.dash-top{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);align-items:start;}}
.todo-add{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px 14px;}
.todo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(140px,100%),1fr));gap:0 14px;}
.todo-grid>*{min-width:0;}
.todo-check{width:22px;height:22px;border-radius:50%;border:2px solid var(--border2);background:var(--surface);color:#fff;font-size:12px;font-weight:900;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;}
.todo-check:hover{border-color:var(--green);}
.todo-check.done{background:var(--green);border-color:var(--green);}
.todo-title{font-weight:700;overflow-wrap:anywhere;}
.todo-title.done{color:var(--ink2);font-weight:600;}
.todo-desc{font-size:12px;color:var(--muted);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:anywhere;}
.todo-ext{font-size:11.5px;font-weight:700;color:var(--green);}
.todo-comment{background:var(--surface3);border:1px solid var(--border);border-radius:8px;padding:8px 10px;}
.todo-link-btn{background:none;border:none;color:var(--muted);font-family:var(--f);font-size:11.5px;font-weight:700;cursor:pointer;padding:0;}
.todo-link-btn:hover{color:var(--red);}

/* ── Fælles kort-, menu- og søgekomponenter (13. okt. 2026) ── */
.admin-touch{min-height:36px;}
.admin-menu-wrap{position:relative;display:inline-block;}
.admin-menu{position:absolute;right:0;top:calc(100% + 6px);min-width:220px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:6px;z-index:60;box-shadow:0 8px 24px rgba(21,32,26,.12);}
.admin-menu-item{display:flex;flex-direction:column;align-items:flex-start;width:100%;min-height:44px;justify-content:center;background:none;border:none;border-radius:8px;padding:8px 12px;font-family:var(--f);font-size:13px;font-weight:600;color:var(--ink);cursor:pointer;text-align:left;}
.admin-menu-item:hover:not(:disabled){background:var(--surface2);}
.admin-menu-item:disabled{color:var(--muted2);cursor:default;}
.admin-menu-item.has-icon{flex-direction:row;align-items:center;justify-content:flex-start;gap:10px;}
.admin-menu{max-width:calc(100vw - 24px);}
.admin-menu-hint{font-size:11px;font-weight:500;color:var(--muted);}
.admin-card-list{display:flex;flex-direction:column;gap:10px;margin-bottom:16px;}
.admin-item-card{display:block;width:100%;text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;font-family:var(--f);color:var(--ink);cursor:pointer;box-sizing:border-box;}
.admin-item-card:active{background:var(--surface2);}
.admin-item-title{font-size:14px;font-weight:800;line-height:1.35;overflow-wrap:anywhere;}
.admin-item-title.done{color:var(--ink2);font-weight:600;}
.admin-item-excerpt{font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:anywhere;}
.admin-item-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center;}
.admin-item-facts{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:12.5px;margin-top:8px;}
.admin-item-facts dt{color:var(--muted);}
.admin-item-facts dd{margin:0;font-weight:600;overflow-wrap:anywhere;}
.admin-item-actions{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap;}
.admin-filter-panel{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;}
.admin-filter-panel label{display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px;}
.admin-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;}
.admin-toolbar .admin-search{flex:1 1 180px;max-width:none;}
.admin-info-note{font-size:12.5px;color:var(--muted);line-height:1.5;background:var(--surface2);border-radius:10px;padding:10px 12px;margin-bottom:12px;}
.admin-search-sheet{position:fixed;inset:0;z-index:200;background:var(--paper,#fff);display:flex;flex-direction:column;padding-top:env(safe-area-inset-top);}
.admin-search-sheet-bar{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--border);}
.admin-search-sheet-bar form{flex:1;}
.admin-search-sheet-body{flex:1;overflow-y:auto;padding:12px 16px;}
.admin-search-sheet-body div[style*="cursor"]{padding:12px 4px !important;}
.admin-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:none;background:none;border-radius:10px;cursor:pointer;flex-shrink:0;}
.admin-iconbtn:active{background:var(--surface2);}
.admin-iconbtn:disabled{cursor:default;}
.admin-iconbtn:focus-visible{outline:2px solid var(--green);outline-offset:-2px;}
.admin-iconbtn.spinning svg{animation:admin-spin .8s linear infinite;}
.admin-topbar .admin-iconbtn svg{stroke-width:2.2;}
.admin-topbar-actions{display:flex;align-items:center;gap:4px;flex-shrink:0;}

/* ── Mobil: sidemenuen bliver en udtrækskuffe, indholdet fylder hele bredden ── */
.admin-menu-btn,.admin-nav-backdrop{display:none;}
@media (max-width:820px){
  .admin-sidebar{position:fixed;left:0;top:0;bottom:0;height:auto;z-index:120;transform:translateX(-100%);visibility:hidden;transition:transform .2s ease,visibility 0s linear .2s;box-shadow:none;border-right:none;width:min(272px,84vw);}
  .admin-sidebar.open{transform:none;visibility:visible;transition:transform .2s ease;box-shadow:0 0 40px rgba(21,32,26,.25);}
  .admin-sidebar-head{padding-left:18px;}
  .admin-nav-close{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;margin:-6px 0;border:none;background:none;border-radius:8px;cursor:pointer;flex-shrink:0;}
  .admin-nav-close:active{background:var(--surface2);}
  .admin-nav-group-head{min-height:40px;}
  .admin-sidebar-footer .admin-btn{min-height:40px;}
  .admin-nav-backdrop{display:block;position:fixed;inset:0;background:rgba(21,32,26,.45);z-index:110;}
  .admin-menu-btn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;margin:0;border:none;background:none;border-radius:8px;cursor:pointer;flex-shrink:0;}
  .admin-menu-btn:active{background:var(--surface2);}
  .admin-topbar{padding:0 8px 0 12px;min-height:56px;padding-top:env(safe-area-inset-top);position:sticky;top:0;z-index:50;gap:4px;}
  .admin-topbar h1{flex:1;min-width:0;font-size:17px;line-height:1.2;}
  .admin-menu-btn{width:44px;height:44px;margin:0 2px 0 -6px;}
  .admin-content{padding:16px;}
  .admin-nav-item{min-height:44px;}
  .admin-table-wrap{overflow:visible;background:none;border:none;border-radius:0;}
  table.admin-table:not([data-no-cards]){min-width:0;display:block;}
  table.admin-table:not([data-no-cards]) thead{display:none;}
  table.admin-table:not([data-no-cards]) tbody{display:flex;flex-direction:column;gap:10px;}
  table.admin-table:not([data-no-cards]) tr{display:block;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:8px 14px;}
  table.admin-table:not([data-no-cards]) td{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:6px 0;border-bottom:none;text-align:right;overflow-wrap:anywhere;min-height:32px;}
  table.admin-table:not([data-no-cards]) td::before{content:attr(data-label);flex:0 0 34%;max-width:40%;text-align:left;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:var(--muted);}
  table.admin-table:not([data-no-cards]) td:not([data-label]){justify-content:flex-start;text-align:left;}
  table.admin-table:not([data-no-cards]) td:not([data-label])::before{content:none;}
  table.admin-table:not([data-no-cards]) td:not([data-label]){flex-direction:column;align-items:flex-start;min-width:0;}
  table.admin-table:not([data-no-cards]) td:not([data-label]):has(>.admin-btn){flex-direction:row;flex-wrap:wrap;align-items:center;}
  table.admin-table:not([data-no-cards]) td[data-label]>*{min-width:0;}
  table.admin-table:not([data-no-cards]) tr:hover td{background:none;}
  table.admin-table[data-no-cards]{min-width:560px;}
  .admin-table-wrap:has(table.admin-table[data-no-cards]){overflow-x:auto;-webkit-overflow-scrolling:touch;background:var(--surface);border:1px solid var(--border);border-radius:12px;}
  .admin-table-empty{background:var(--surface);border:1px solid var(--border);border-radius:12px;}
  .admin-modal-overlay{padding:0;align-items:flex-end;overflow:hidden;}
  .admin-modal{max-width:none;max-height:92vh;border-radius:14px 14px 0 0;padding:18px 16px;}
  .admin-modal.todo-panel{width:100%;height:100dvh;max-height:100dvh;border-radius:0;padding:0;}
  .admin-touch{min-height:44px;}
  .todo-chip{min-height:44px;}
  .dash-period button{min-height:44px;}
  .todo-panel .admin-btn{min-height:44px;}
  .todo-date-field,textarea.todo-title-input{font-size:16px;}
  .admin-search{max-width:none;}
  .admin-content > div[style*="display: flex"]{flex-wrap:wrap;row-gap:8px;}
  .admin-content > div[style*="display: flex"] > .admin-tabs{flex:1 1 100%;max-width:100%;min-width:0;}
  .admin-content > div[style*="display: flex"] > .admin-search{flex:1 1 160px;min-width:0;}
  .admin-btn{min-height:36px;}
  .admin-btn-sm{min-height:36px;}
  .admin-content [style*="grid-template-columns"]{grid-template-columns:1fr !important;}
  .admin-content .admin-stat-grid{grid-template-columns:repeat(2,1fr) !important;gap:10px;}
  .admin-chart-grid{grid-template-columns:1fr;}
  .admin-content img{max-width:100%;}
  .admin-tabs{overflow-x:auto;white-space:nowrap;flex-wrap:nowrap !important;scrollbar-width:none;}
  .admin-tabs::-webkit-scrollbar{display:none;}
  .admin-tab-btn{flex-shrink:0;min-height:44px;}
  .admin-field input,.admin-field select.admin-select,select.admin-select,.admin-search,textarea.admin-textarea{font-size:16px;}
}
@media (prefers-reduced-motion: reduce) {
  *,*::before,*::after{animation-duration:0.01ms !important;animation-delay:0s !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;transition-delay:0s !important;scroll-behavior:auto !important;}
}
`;
