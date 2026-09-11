// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// ProfileMenu.jsx
// Højreside-menu åbnet fra hamburger-ikonet i topbaren. Erstatter den tidligere
// "Profil"-fane i bundnavigationen — al navigation der før lå der (favoritter,
// familie, historik, opskrifter, viden, madpas, restaurantguide, admin) samt
// selve profilen ligger nu her i stedet.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { createPortal } from "react-dom";
import { SCREENS } from "./constants.jsx";
import { initials } from "./helpers.js";
import { useAuthContext } from "./AuthContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";

export default function ProfileMenu({ open, onClose, onNavigate }) {
  const { user } = useAuthContext();
  const { history } = useHistoryContext();

  if (!open) return null;

  const items = [
    { icon:"⭐", label:"Favoritter", sub:"Gemte produkter og opskrifter", screen: SCREENS.FAVORITES },
    { icon:"👨‍👩‍👧", label:"Familie", sub:"Allergiprofiler og husstand", screen: SCREENS.FAMILY },
    { icon:"📋", label:"Scanningshistorik", sub:`${history.length} produkter scannet`, screen: SCREENS.HISTORY },
    { icon:"🍳", label:"Opskrifter", sub:"Find opskrifter der passer til dine allergier", screen: SCREENS.RECIPES },
    { icon:"📚", label:"Viden", sub:"Opslag om allergener, E-numre og diæter", screen: SCREENS.KNOWLEDGE },
    { icon:"🌍", label:"Madpas", sub:"Vis allergier til restaurantpersonale", screen: SCREENS.MADPAS },
    { icon:"🍽️", label:"Restaurantguide", sub:"Spis trygt ude — tips & rettigheder", screen: SCREENS.RESTAURANTGUIDE },
    ...(user?.role === "admin" ? [{ icon:"🛡️", label:"Admin panel", sub:"Godkend og administrér produkter", screen: SCREENS.ADMIN }] : []),
  ];

  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9996, background:"rgba(0,0,0,.5)" }} onClick={onClose}>
      <div style={{ position:"absolute", top:0, right:0, bottom:0, width:"min(320px, 86vw)", background:"var(--sheet)", boxShadow:"-10px 0 28px rgba(0,0,0,.18)", display:"flex", flexDirection:"column", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 14px 14px" }}>
          <div style={{ fontSize:16, fontWeight:900, color:"var(--ink)" }}>Menu</div>
          <button onClick={onClose} aria-label="Luk menu"
            style={{ background:"var(--surface)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--ink)" }}>×</button>
        </div>

        {/* Profil — går til sin egen side i stedet for at være en del af menuen */}
        <div onClick={() => onNavigate(SCREENS.PROFILE)}
          style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", margin:"0 10px 10px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer" }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:"var(--green-lt)", border:"1.5px solid var(--green-mid)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"var(--green)", flexShrink:0 }}>
            {initials(user?.name || "?")}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13.5, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name || "Min profil"}</div>
            <div style={{ fontSize:11, color:"var(--muted)" }}>Se og redigér din profil</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
        </div>

        <div style={{ padding:"0 10px" }}>
          {items.map((item, i) => (
            <div key={item.label} onClick={() => onNavigate(item.screen)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 4px", borderBottom: i < items.length-1 ? "1px solid var(--border)" : "none", cursor:"pointer" }}>
              <div style={{ width:36, height:36, borderRadius:9, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                {item.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{item.label}</div>
                <div style={{ fontSize:10.5, color:"var(--muted)", marginTop:1 }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
