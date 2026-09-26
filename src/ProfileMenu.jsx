// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// ProfileMenu.jsx
// Højreside-menu åbnet fra hamburger-ikonet i topbaren. Erstatter den tidligere
// "Profil"-fane i bundnavigationen — al navigation der før lå der (favoritter,
// familie, opskrifter, viden, madpas) samt selve profilen ligger nu her i stedet.
//
// Redesignet 26. sept. 2026 (brugerfeedback: "gør menuen mere rolig, premium,
// overskuelig og konsekvent med designsystemet") — se enkeltkommentarer
// nedenfor for hvert konkret punkt. Selve drawer-mekanikken (portal, fast
// højrepanel, mørkt overlay, luk-knap) er UÆNDRET, kun indholdet er
// omstruktureret.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { createPortal } from "react-dom";
import { SCREENS } from "./constants.jsx";
import { initials } from "./helpers.js";
import { useAuthContext } from "./AuthContext.jsx";
import { Icon } from "./SharedComponents.jsx";

// Delt række-komponent, så ethvert menupunkt (uanset gruppe) ser og opfører
// sig ens: ikon til venstre, titel + evt. sekundær beskrivelse, evt. chevron
// til højre. Samme tekst-/ikonfarve for ALLE punkter, "Log ud" inklusive
// (26. sept. 2026, brugerfeedback: en dæmpet grå "Log ud" så ud som om den
// var disabled/ikke-trykbar — "tydeligt sekundær" opnås i stedet alene via
// placering nederst + ingen chevron, ikke en anden tekstfarve).
// `secondary` (samme dag, opfølgning) — en anelse mindre fremtrædende end de
// øvrige app-punkter: lidt mere luft ovenfor + en smule lettere skriftvægt.
// STADIG samme --ink-tekstfarve, ikke grå/dæmpet — kun typografisk vægt og
// afstand adskiller den, ikke farve.
function MenuRow({ icon, label, sub, chevron = true, onClick, secondary = false }) {
  return (
    <div className="menu-item" onClick={onClick} style={secondary ? { marginTop:10 } : undefined}>
      <div style={{ width:36, height:36, borderRadius:9, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon name={icon} size={17} color="var(--ink2)" />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight: secondary ? 600 : 700, color:"var(--ink)" }}>{label}</div>
        {sub && <div style={{ fontSize:10.5, color:"var(--muted)", marginTop:1 }}>{sub}</div>}
      </div>
      {chevron && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0 }}>
          <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
        </svg>
      )}
    </div>
  );
}

export default function ProfileMenu({ open, onClose, onNavigate, onOpenBetaInfo }) {
  const { user, clearAuth } = useAuthContext();

  if (!open) return null;

  // Ny informationsarkitektur (26. sept. 2026, brugerfeedback) — tre
  // tydelige grupper i stedet for én lang, udifferentieret liste:
  // PERSONLIGT (brugerens egne data), UDFORSK (indhold/værktøjer),
  // APP (om appen + konto). Fjernet: Restaurantguide (helt), Scannings-
  // historik (findes allerede som fast fane i bundnavigationen — ingen
  // grund til at have den to steder). "Viden" omdøbt til "Allergileksikon",
  // da funktionen reelt er et leksikon, ikke en generel videns-side.
  const sections = [
    {
      label: "PERSONLIGT",
      items: [
        { icon:"star", label:"Favoritter", sub:"Gemte produkter og opskrifter", screen: SCREENS.FAVORITES },
        { icon:"family", label:"Familie", sub:"Allergiprofiler og husstand", screen: SCREENS.FAMILY },
      ],
    },
    {
      label: "UDFORSK",
      items: [
        { icon:"recipes", label:"Opskrifter", sub:"Find opskrifter der passer til dine allergier", screen: SCREENS.RECIPES },
        { icon:"book", label:"Allergileksikon", sub:"Opslag om allergener, intolerancer, E-numre og kost", screen: SCREENS.KNOWLEDGE },
        { icon:"madpas", label:"Madpas", sub:"Vis dine allergier til restaurantpersonale", screen: SCREENS.MADPAS },
      ],
    },
    {
      label: "APP",
      items: [
        ...(user?.role === "admin" ? [{ icon:"shield", label:"Admin panel", sub:"Godkend og administrér produkter", screen: SCREENS.ADMIN }] : []),
        // Genåbner Beta-intro-overlayet manuelt (25. sept. 2026) — erstatter
        // den tidligere permanente "Beta-information"-knap på Scan-forsiden,
        // som IKKE er genindført.
        { icon:"bug", label:"Om EatSafe Beta", sub:"Se velkomst- og sikkerhedsinformation igen", action: onOpenBetaInfo },
        // Genindført (26. sept. 2026, brugerfeedback) — huser notifikations-
        // og kontoindstillinger (flyttet fra ProfileScreen.jsx, se
        // SettingsScreen.jsx), klar til fremtidige punkter (sprog, app-
        // præferencer) uden at skulle omstrukturere menuen igen.
        { icon:"settings", label:"Indstillinger", screen: SCREENS.SETTINGS },
        // Samme eksterne privatlivspolitik som ProfileScreen.jsx allerede
        // linker til nederst på profilsiden — ingen ny kilde opfundet.
        { icon:"file", label:"Privatliv", href:"https://eatsafe.dk/privacy" },
        // Ingen chevron (det er en handling, ikke en navigation) og ALDRIG
        // rød i normal tilstand (brugerfeedback: "rød kan først bruges i
        // en evt. bekræftelse"). Samme tekstfarve som alle andre punkter —
        // en tidligere dæmpet grå udgave så disabled/ikke-trykbar ud;
        // "tydeligt sekundær" opnås alene via placering nederst. Samme
        // clearAuth() som ProfileScreens "Log ud"-knap, ingen selvstændig
        // bekræftelses-dialog tilføjet — matcher eksisterende adfærd
        // ét-til-ét. `secondary` (se MenuRow) gør den en anelse mindre
        // fremtrædende end de øvrige APP-punkter uden at gøre den grå.
        { icon:"x", label:"Log ud", action: clearAuth, chevron:false, secondary:true },
      ],
    },
  ];

  const handleItemClick = (item) => {
    if (item.href) { window.open(item.href, "_blank", "noopener,noreferrer"); return; }
    if (item.action) { item.action(); return; }
    onNavigate(item.screen);
  };

  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9996, background:"rgba(0,0,0,.5)" }} onClick={onClose}>
      {/* Ren, varm off-white baggrund i stedet for det tidligere ingrediens-
          /madvarebillede (26. sept. 2026, brugerfeedback: "menuen skal
          føles som en ren, premium app-menu, ikke endnu en dekorativ
          fødevareskærm" — den slags baggrunde hører fortsat kun hjemme på
          Scan-forsiden og andre bevidste brand-flader). var(--surface3)
          (samme eksisterende, allerede-brugte token som fx .recent-list)
          i stedet for var(--paper) — var(--paper) er reelt ren hvid
          (#FFFFFF), hvilket blev oplevet som for koldt/sterilt til denne
          menu; var(--surface3) er en meget svag, subtil off-white i
          stedet, ikke en ny farve. Drawer-positionering/animation og det
          mørke overlay ovenfor er UÆNDREDE. */}
      <div style={{ position:"absolute", top:0, right:0, bottom:0, width:"min(320px, 86vw)",
          background:"var(--surface3)",
          boxShadow:"-10px 0 28px rgba(0,0,0,.18)", display:"flex", flexDirection:"column", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 14px 14px" }}>
          <div style={{ fontSize:16, fontWeight:900, color:"var(--ink)" }}>Menu</div>
          <button onClick={onClose} aria-label="Luk menu"
            style={{ background:"var(--surface)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--ink)" }}>×</button>
        </div>

        {/* Profilkort — menuens primære element, uændret placering. Meget
            diskret grøn tone (var(--green-selected-bg), samme SOLIDE lyse
            grøn-token designsystemet allerede bruger til lette accent-/
            valgt-tilstande andre steder) i stedet for en neutral grå
            baggrund — ikke en ny farve, kun en anden eksisterende token. */}
        <div className="menu-profile-card" onClick={() => onNavigate(SCREENS.PROFILE)}
          style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", margin:"0 10px 10px", background:"var(--green-selected-bg)", border:"1px solid var(--border)", borderRadius:12 }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:"var(--green-lt)", border:"1.5px solid var(--green-mid)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"var(--green)", flexShrink:0 }}>
            {initials(user?.name || "?")}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13.5, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name || "Min profil"}</div>
            <div style={{ fontSize:11, color:"var(--muted)" }}>Se og redigér din profil</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
        </div>

        {/* Grupperet liste — diskrete sektionsoverskrifter (.card-lbl,
            samme uppercase/muted-mønster som fx ShareSheets "ELLER VÆLG
            UDVALGTE PERSONER") i stedet for én lang, udifferentieret
            liste. Ingen kort/bokse omkring de enkelte punkter — kun
            .menu-items indbyggede bund-streg mellem rækker (native-
            navigation-følelse, ikke "endnu et kort"). */}
        <div style={{ padding:"0 10px" }}>
          {sections.map((section, i) => (
            <div key={section.label} style={{ marginTop: i === 0 ? 2 : 20 }}>
              <div className="card-lbl" style={{ padding:"0 4px" }}>{section.label}</div>
              {section.items.map(item => (
                <MenuRow key={item.label} {...item} onClick={() => handleItemClick(item)} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
