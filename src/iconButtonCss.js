// @ts-check
// Fælles CSS til EatSafes navigationsikoner, brugt af både appen (theme.jsx) og administrationen (admin/adminTheme.js).
// Kun ikonet er synligt: ingen cirkel, ramme eller fast baggrund. Trykfladen er 44 × 44 px (usynlig). Ved tryk (og med mus) vises en diskret, svag cirkel som feedback,
// og med tastatur er fokus tydeligt (grøn ring). Ikonets størrelse, streg og farve står i navIcon.js.
export const iconButtonCss = `
.ibtn{position:relative;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;min-height:44px;margin:-3px;padding:0;border:none;background:none;border-radius:50%;cursor:pointer;font-family:inherit;color:var(--ink);-webkit-tap-highlight-color:transparent;}
.ibtn-c{width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:transparent;transition:background .15s;}
.ibtn:active .ibtn-c{background:rgba(21,32,26,.10);}
@media (hover:hover){.ibtn:hover:not(:disabled) .ibtn-c{background:rgba(21,32,26,.06);}}
.ibtn:focus-visible{outline:2px solid var(--green);outline-offset:0;}
html[data-modality="pointer"] .ibtn:focus-visible,html[data-modality="pointer"] .icon-btn:focus-visible{outline:none;}
.ibtn:disabled{cursor:default;opacity:.5;}
.ibtn.spinning{opacity:1;}
.ibtn.spinning .ibtn-c svg{animation:ibtn-spin .8s linear infinite;}
.ibtn-dot{position:absolute;top:6px;right:6px;width:9px;height:9px;border-radius:50%;background:var(--green);border:1.5px solid var(--paper);}
@keyframes ibtn-spin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion:reduce){.ibtn-c,.icon-btn{transition:none;}.ibtn.spinning .ibtn-c svg{animation-duration:2s;}}
.icon-btn{width:44px;height:44px;min-height:44px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;padding:0;border-radius:50%;background:none;border:none;color:var(--ink);cursor:pointer;transition:background .15s;-webkit-tap-highlight-color:transparent;}
.icon-btn:active{background:rgba(21,32,26,.10);}
@media (hover:hover){.icon-btn:hover:not(:disabled){background:rgba(21,32,26,.06);}}
.icon-btn:focus-visible{outline:2px solid var(--green);outline-offset:0;}
.icon-btn:disabled{cursor:default;opacity:.5;}
`;
