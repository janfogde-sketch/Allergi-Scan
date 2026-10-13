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
.admin-sidebar{width:var(--sidebar-w);flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto;box-sizing:border-box;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:20px 12px;}
.admin-sidebar-logo{display:flex;align-items:center;gap:7px;font-size:17px;font-weight:900;color:var(--ink);padding:0 10px 20px;}
.admin-nav{display:flex;flex-direction:column;gap:2px;flex:1;}
.admin-nav-group{display:flex;flex-direction:column;gap:2px;margin-bottom:8px;}
.admin-nav-group-head{display:flex;align-items:center;gap:6px;padding:6px 10px;border:none;background:none;font-family:var(--f);font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);cursor:pointer;width:100%;text-align:left;border-radius:6px;}
.admin-nav-group-head:hover{background:var(--surface2);}
.admin-nav-group-head .badge{margin-left:auto;background:var(--red);color:#fff;font-size:10px;font-weight:800;border-radius:10px;padding:1px 6px;min-width:16px;text-align:center;letter-spacing:0;}
.admin-nav-sub{padding-left:14px;}
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
.admin-stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;min-height:92px;box-sizing:border-box;text-align:left;font-family:var(--f);display:block;}
.admin-stat-link{cursor:pointer;width:100%;}
.admin-stat-link:hover{border-color:var(--green);}
.admin-stat-link:active{background:var(--surface2);}
.admin-stat-num{font-size:24px;font-weight:900;color:var(--ink);line-height:1.1;font-variant-numeric:tabular-nums;}
.admin-stat-label{font-size:11.5px;color:var(--ink2);font-weight:700;margin-top:4px;}
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
.todo-panel-foot{flex:0 0 auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--border);background:var(--surface);}
.todo-panel-foot .todo-spacer{margin-left:auto;}
.todo-panel .admin-field,.todo-panel .admin-field *,.todo-comment,.todo-comment *{min-width:0;max-width:100%;}
.todo-panel .admin-field select.admin-select,.todo-panel textarea.admin-textarea,.todo-panel .admin-field input{width:100%;}
.todo-date-row{display:flex;gap:8px;align-items:stretch;}
.todo-date-row input{flex:1 1 auto;}
.todo-comment-body{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;font-size:13px;line-height:1.45;margin-top:3px;}
.todo-comment.fresh{border-color:var(--green);background:var(--green-selected-bg);}
.todo-confirm{background:var(--red-lt);border:1px solid var(--red-md);border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:13px;}
.todo-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 0 6px;margin-bottom:6px;-webkit-overflow-scrolling:touch;}
.todo-chips::-webkit-scrollbar{display:none;}
.todo-chip{flex:0 0 auto;font-family:var(--f);font-size:12.5px;font-weight:700;color:var(--ink2);background:var(--surface);border:1px solid var(--border2);border-radius:999px;padding:6px 12px;min-height:36px;cursor:pointer;white-space:nowrap;}
.todo-chip.active{border-color:var(--green);background:var(--green-selected-bg);color:var(--green);}
.todo-chip:focus-visible,.todo-check:focus-visible,.admin-item-card:focus-visible{outline:2px solid var(--green);outline-offset:2px;}
.todo-check{position:relative;}
.todo-check::after{content:"";position:absolute;inset:-11px;}
.todo-meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px;}
.todo-meta-line{font-size:12.5px;color:var(--muted);margin-top:6px;overflow-wrap:anywhere;}
.todo-meta-line strong{color:var(--ink2);font-weight:600;}
.todo-meta-line .late{color:var(--red);font-weight:800;}
.admin-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:10px;border:1px solid var(--border2);background:var(--surface);color:var(--ink2);cursor:pointer;padding:0;}
.admin-icon-btn:hover{border-color:var(--green);color:var(--green);}
.admin-icon-btn:focus-visible{outline:2px solid var(--green);outline-offset:2px;}
.todo-undo{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom));z-index:120;display:flex;align-items:center;gap:12px;background:var(--ink);color:#fff;border-radius:12px;padding:8px 8px 8px 16px;font-size:13px;max-width:calc(100vw - 32px);box-shadow:var(--sh);}
.todo-undo button{background:none;border:none;color:#fff;font-family:var(--f);font-weight:800;font-size:13px;text-decoration:underline;cursor:pointer;min-height:44px;padding:0 12px;}
.beta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;}
.beta-cell{background:var(--surface2);border-radius:10px;padding:10px 12px;text-align:left;border:none;font-family:var(--f);}
.beta-cell b{display:block;font-size:20px;font-weight:800;line-height:1.1;}
.beta-cell span{font-size:11.5px;color:var(--muted);}
button.beta-cell{cursor:pointer;} button.beta-cell:focus-visible{outline:2px solid var(--green);outline-offset:2px;}
.admin-axis{display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;font-size:10px;color:var(--muted);height:72px;padding-right:6px;min-width:22px;}
.todo-add{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px 14px;}
.todo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(140px,100%),1fr));gap:0 14px;}
.todo-grid>*{min-width:0;}
.todo-check{width:22px;height:22px;border-radius:50%;border:2px solid var(--border2);background:var(--surface);color:#fff;font-size:12px;font-weight:900;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;}
.todo-check:hover{border-color:var(--green);}
.todo-check.done{background:var(--green);border-color:var(--green);}
.todo-title{font-weight:700;overflow-wrap:anywhere;}
.todo-title.done{text-decoration:line-through;color:var(--muted);font-weight:600;}
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
.admin-menu-hint{font-size:11px;font-weight:500;color:var(--muted);}
.admin-card-list{display:flex;flex-direction:column;gap:10px;margin-bottom:16px;}
.admin-item-card{display:block;width:100%;text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;font-family:var(--f);color:var(--ink);cursor:pointer;box-sizing:border-box;}
.admin-item-card:active{background:var(--surface2);}
.admin-item-title{font-size:14px;font-weight:800;line-height:1.35;overflow-wrap:anywhere;}
.admin-item-title.done{text-decoration:line-through;color:var(--muted);font-weight:600;}
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

/* ── Mobil: sidemenuen bliver en udtrækskuffe, indholdet fylder hele bredden ── */
.admin-menu-btn,.admin-nav-backdrop{display:none;}
@media (max-width:820px){
  .admin-sidebar{position:fixed;left:0;top:0;bottom:0;z-index:120;transform:translateX(-100%);transition:transform .2s ease;box-shadow:none;width:min(280px,86vw);}
  .admin-sidebar.open{transform:none;box-shadow:0 0 40px rgba(21,32,26,.25);}
  .admin-nav-backdrop{display:block;position:fixed;inset:0;background:rgba(21,32,26,.45);z-index:110;}
  .admin-menu-btn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;margin:0;border:none;background:none;border-radius:8px;cursor:pointer;flex-shrink:0;}
  .admin-menu-btn:active{background:var(--surface2);}
  .admin-topbar{padding:0 8px 0 12px;min-height:56px;padding-top:env(safe-area-inset-top);position:sticky;top:0;z-index:50;gap:4px;}
  .admin-topbar h1{flex:1;min-width:0;font-size:17px;line-height:1.2;}
  .admin-menu-btn{width:44px;height:44px;margin:0 2px 0 -6px;}
  .admin-content{padding:16px;}
  .admin-nav-item{padding:12px 10px;}
  .admin-table-wrap{overflow:visible;background:none;border:none;border-radius:0;}
  table.admin-table:not([data-no-cards]){min-width:0;display:block;}
  table.admin-table:not([data-no-cards]) thead{display:none;}
  table.admin-table:not([data-no-cards]) tbody{display:flex;flex-direction:column;gap:10px;}
  table.admin-table:not([data-no-cards]) tr{display:block;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:8px 14px;}
  table.admin-table:not([data-no-cards]) td{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:6px 0;border-bottom:none;text-align:right;overflow-wrap:anywhere;min-height:32px;}
  table.admin-table:not([data-no-cards]) td::before{content:attr(data-label);flex:0 0 34%;max-width:40%;text-align:left;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:var(--muted);}
  table.admin-table:not([data-no-cards]) td:not([data-label]){justify-content:flex-start;text-align:left;}
  table.admin-table:not([data-no-cards]) td:not([data-label])::before{content:none;}
  table.admin-table:not([data-no-cards]) tr:hover td{background:none;}
  table.admin-table[data-no-cards]{min-width:560px;}
  .admin-table-wrap:has(table.admin-table[data-no-cards]){overflow-x:auto;-webkit-overflow-scrolling:touch;background:var(--surface);border:1px solid var(--border);border-radius:12px;}
  .admin-table-empty{background:var(--surface);border:1px solid var(--border);border-radius:12px;}
  .admin-modal-overlay{padding:0;align-items:flex-end;overflow:hidden;}
  .admin-modal{max-width:none;max-height:92vh;border-radius:14px 14px 0 0;padding:18px 16px;}
  .admin-modal.todo-panel{width:100%;height:100dvh;max-height:100dvh;border-radius:0;padding:0;}
  .admin-touch{min-height:44px;}
  .todo-chip{min-height:44px;}
  .todo-panel .admin-btn{min-height:44px;}
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
`;
