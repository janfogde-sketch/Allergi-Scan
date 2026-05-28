// @ts-nocheck
import React, { useState } from "react";
import { Icon } from "./SharedComponents.jsx";
import { ALLERGENS, E_NUMBERS, E_CATEGORIES, DIETS } from "./constants.jsx";

export const ENumberPicker = ({ selected, onChange }) => {
  const [search, setSearch] = React.useState("");
  const [cat, setCat] = React.useState("alle");

  const filtered = Object.entries(E_NUMBERS).filter(([e, name]) => {
    const matchSearch = !search || e.toLowerCase().includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (cat === "alle") return true;
    const num = parseInt(e.slice(1).replace(/[^0-9]/g,''));
    const ranges = { farve:[100,199], konserv:[200,299], antioxid:[300,399], emulg:[400,499], smags:[600,699], sode:[900,999] };
    const r = ranges[cat];
    return r ? (num >= r[0] && num <= r[1]) : true;
  });

  const popular = ["E621","E211","E102","E951","E250","E320","E150d","E110","E129","E951"];

  return (
    <div>
      {/* Populære */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
        {popular.filter(e => E_NUMBERS[e]).map(e => {
          const on = selected.includes(e);
          return (
            <div key={e} onClick={() => onChange(on ? selected.filter(x=>x!==e) : [...selected,e])}
              style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, cursor:"pointer",
                background: on?"var(--red-lt)":"var(--paper2)",
                color: on?"var(--red)":"var(--ink2)",
                border:`1.5px solid ${on?"var(--red)":"var(--border)"}` }}>
              {e}{on?" ✓":""}
            </div>
          );
        })}
      </div>

      {/* Søg */}
      <input style={{ width:"100%", padding:"8px 12px", border:"1.5px solid var(--border2)", borderRadius:8, fontSize:13, fontFamily:"var(--f)", marginBottom:8, boxSizing:"border-box" }}
        placeholder="Søg E-nummer eller navn..." value={search} onChange={e => setSearch(e.target.value)} />

      {/* Kategori */}
      <select style={{ width:"100%", padding:"8px 12px", border:"1.5px solid var(--border2)", borderRadius:8, fontSize:13, fontFamily:"var(--f)", marginBottom:8, background:"#fff", boxSizing:"border-box" }}
        value={cat} onChange={e => setCat(e.target.value)}>
        <option value="alle">Alle kategorier</option>
        <option value="farve">Farvestoffer (E100–E199)</option>
        <option value="konserv">Konserveringsmidler (E200–E299)</option>
        <option value="antioxid">Antioxidanter (E300–E399)</option>
        <option value="emulg">Emulgatorer / Stabilisatorer (E400–E499)</option>
        <option value="smags">Smagsforstærkere (E600–E699)</option>
        <option value="sode">Sødestoffer (E900–E999)</option>
      </select>

      {/* Farveforklaring */}
      <div style={{ display:"flex", gap:6, marginBottom:8 }}>
        {[["var(--border)","var(--ink)","Ingen"],["var(--amber)","var(--amber)","Intolerance"],["var(--red)","var(--red)","Allergi"]].map(([border,color,label]) => (
          <div key={label} style={{ flex:1, display:"flex", alignItems:"center", gap:5, padding:"4px 8px", border:`1.5px solid ${border}`, borderRadius:8, background:color==="var(--ink)"?"var(--paper2)":color==="var(--amber)"?"var(--amber-lt)":"var(--red-lt)" }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0 }}/>
            <span style={{ fontSize:10, fontWeight:700, color }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:10, color:"var(--muted)", marginBottom:8 }}>Tryk 1x = Intolerance · 2x = Allergi · 3x = Fjern</div>

      {/* Liste */}
      <div style={{ maxHeight:320, overflowY:"auto", border:"1px solid var(--border)", borderRadius:8 }}>
        {filtered.map(([e, name], i, arr) => {
          const state = selected.includes(e+"_intolerance") ? "intolerance" : selected.includes(e) ? "allergen" : "none";
          const bg = state==="allergen"?"var(--red-lt)":state==="intolerance"?"var(--amber-lt)":"#fff";
          const col = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--ink)";
          const colMuted = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--muted2)";
          return (
            <div key={e} onClick={() => {
              if (state==="none") onChange([...selected, e+"_intolerance"]);
              else if (state==="intolerance") onChange([...selected.filter(x=>x!==e+"_intolerance"), e]);
              else onChange(selected.filter(x=>x!==e));
            }} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 12px",
              borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none",
              background: bg, cursor:"pointer" }}>
              <div style={{ fontSize:12, fontWeight:800, color:col, width:48, flexShrink:0, paddingTop:1 }}>{e}</div>
              <div style={{ fontSize:12, color:colMuted, flex:1, lineHeight:1.4 }}>{name}</div>
              {state!=="none" && <div style={{ fontSize:9, fontWeight:800, color:col, flexShrink:0, paddingTop:2 }}>{state==="allergen"?"Allergi":"Intolerance"}</div>}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding:"16px", fontSize:13, color:"var(--muted)", textAlign:"center" }}>Ingen resultater</div>}
      </div>

      {/* Valgte */}
      {selected.length > 0 && (
        <div style={{ marginTop:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Valgte ({selected.length})</div>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {selected.map(e => {
              const isIntolerance = e.endsWith("_intolerance");
              const eId = isIntolerance ? e.replace("_intolerance","") : e;
              const col = isIntolerance ? "var(--amber)" : "var(--red)";
              const bg = isIntolerance ? "var(--amber-lt)" : "var(--red-lt)";
              const border = isIntolerance ? "var(--amber-md)" : "var(--red-md)";
              return (
                <div key={e} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 10px", background:bg, border:`1px solid ${border}`, borderRadius:6 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:col, width:44, flexShrink:0 }}>{eId}</div>
                  <div style={{ fontSize:11, color:col, flex:1, lineHeight:1.3 }}>{(E_NUMBERS[eId]||"").split(" — ")[0]}</div>
                  <div style={{ fontSize:9, fontWeight:700, color:col }}>{isIntolerance?"Intolerance":"Allergi"}</div>
                  <div onClick={() => onChange(selected.filter(x=>x!==e))} style={{ cursor:"pointer", flexShrink:0 }}>
                    <Icon name="x" size={12} color={col} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};




// Selvmodsigende subtype-kombinationer — disse kan ikke vælges samtidig

