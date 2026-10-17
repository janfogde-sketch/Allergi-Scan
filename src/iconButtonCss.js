// @ts-check
// Fælles CSS til EatSafes ikonknapper, brugt af både appen (theme.jsx) og administrationen (admin/adminTheme.js), så de to områder ser ens ud.
// Referencen er hamburgerknappen i appens header: en rund 38 px knap med neutral kant og diskret skygge, inde i en usynlig trykflade på 44 px.
// Luk-knappen (.icon-btn) er appens eksisterende. Farver, kant og skygge kommer fra de fælles tokens.
export const iconButtonCss = `
.ibtn{position:relative;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;min-height:44px;margin:-3px;padding:0;border:none;background:none;border-radius:50%;cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent;}
.ibtn-c{width:38px;height:38px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--paper2);border:1px solid var(--border2);box-shadow:var(--sh,0 1px 0 rgba(255,255,255,.7) inset,0 2px 8px -2px rgba(21,32,26,.10));transition:transform .15s,background .15s;}
.ibtn:active .ibtn-c{transform:scale(.97);background:var(--paper);}
@media (hover:hover){.ibtn:hover:not(:disabled) .ibtn-c{background:var(--paper);}}
.ibtn:focus-visible{outline:2px solid var(--green);outline-offset:0;}
.ibtn:disabled{cursor:default;}
.ibtn.spinning .ibtn-c svg{animation:ibtn-spin .8s linear infinite;}
.ibtn-dot{position:absolute;top:2px;right:2px;width:9px;height:9px;border-radius:50%;background:var(--green);border:1.5px solid var(--paper);}
@keyframes ibtn-spin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion:reduce){.ibtn-c{transition:none;}.ibtn.spinning .ibtn-c svg{animation-duration:2s;}}
.icon-btn{width:44px;height:44px;min-height:44px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;padding:0;border-radius:50%;background:var(--surface);border:1px solid var(--border);color:var(--ink);cursor:pointer;transition:transform .15s;}
.icon-btn:active{transform:scale(.97);}
.icon-btn:focus-visible{outline:2px solid var(--green);outline-offset:0;}
.icon-btn:disabled{cursor:default;opacity:.5;}
.icon-btn.is-plain{background:none;border:none;}
`;
