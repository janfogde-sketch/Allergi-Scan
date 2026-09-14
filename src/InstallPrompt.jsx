// @ts-nocheck
// InstallPrompt.jsx — Vises kun når man lander på appen via beta-installations-
// QR'en (?src=beta-qr, sat af public/install.html). Fanger browserens
// "beforeinstallprompt" og viser en stor knap der udløser den native
// installations-dialog med ét tryk — ingen browser tillader et helt automatisk,
// tryk-frit install, men dette er det tætteste man kommer.
import React from "react";
import { usePwaInstall } from "./usePwaInstall.js";
import { Icon } from "./SharedComponents.jsx";

export default function InstallPrompt() {
  const params = new URLSearchParams(window.location.search);
  const active = params.get("src") === "beta-qr";
  const { canInstall, installed, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = React.useState(false);
  const [waited, setWaited] = React.useState(false);
  const [installing, setInstalling] = React.useState(false);

  // Giv browseren tid til at nå at sende "beforeinstallprompt", før vi falder
  // tilbage til manuel vejledning — særligt vigtigt lige efter en service
  // worker-opdatering, hvor siden kan nå at genindlæse én gang undervejs
  // (se controllerchange-håndteringen i index.html).
  React.useEffect(() => {
    const t = setTimeout(() => setWaited(true), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!active || dismissed || installed) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await promptInstall();
    setInstalling(false);
    if (accepted) setDismissed(true);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={() => setDismissed(true)}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:"var(--sheet)", borderRadius:24, padding:"28px 24px", maxWidth:340, width:"100%", textAlign:"center", position:"relative" }}>
        <button onClick={() => setDismissed(true)} aria-label="Luk"
          style={{ position:"absolute", top:14, right:14, background:"var(--surface2)", border:"none", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <Icon name="x" size={14} color="var(--muted)" />
        </button>

        <div style={{ width:56, height:56, margin:"0 auto 14px", borderRadius:16, background:"var(--green-lt)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon name="home" size={26} color="var(--green)" />
        </div>

        <div style={{ fontSize:18, fontWeight:800, color:"var(--ink)", letterSpacing:"-.3px", marginBottom:6 }}>Installér EatSafe</div>
        <div style={{ fontSize:12.5, color:"var(--muted)", lineHeight:1.5, marginBottom:20 }}>
          Få EatSafe som en app på din hjemmeskærm — hurtigere at åbne, fylder mindre, virker offline.
        </div>

        {canInstall ? (
          <button onClick={handleInstall} disabled={installing}
            style={{ width:"100%", padding:14, background:"var(--green)", color:"var(--on-green)", border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:14, fontWeight:800, cursor:"pointer", opacity: installing ? .7 : 1 }}>
            {installing ? "Installerer…" : "Installér nu"}
          </button>
        ) : waited ? (
          <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", textAlign:"left", fontSize:11.5, color:"var(--muted)", lineHeight:1.6 }}>
            Din browser gav ikke appen en automatisk installations-knap. Tryk på menuen
            (⋮ øverst til højre i Chrome) og vælg <strong style={{ color:"var(--ink2)" }}>"Installer app"</strong> eller
            <strong style={{ color:"var(--ink2)" }}> "Føj til startskærm"</strong>.
          </div>
        ) : (
          <div style={{ fontSize:12, color:"var(--muted)" }}>Gør klar …</div>
        )}
      </div>
    </div>
  );
}
