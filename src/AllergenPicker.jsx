// @ts-nocheck
import React, { useState } from "react";
import { Icon } from "./SharedComponents.jsx";
import { ALLERGENS, E_NUMBERS, E_CATEGORIES, ALLERGEN_SUBTYPES, INCOMPATIBLE_SUBTYPES, DIETS } from "./constants.jsx";

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

export const SubtypeModal = ({ allergenId, selectedSubtypes = [], onToggle, onClose }) => {
  const data = ALLERGEN_SUBTYPES[allergenId];
  if (!data) return null;

  const isDisabled = (optId) => {
    const incompatible = INCOMPATIBLE_SUBTYPES[optId] || [];
    return selectedSubtypes.some(s => incompatible.includes(s));
  };

  const isSelected = (optId) => selectedSubtypes.includes(optId);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end" }}>
      <div style={{ background:"var(--paper)", width:"100%", borderRadius:"20px 20px 0 0", padding:"24px 20px 40px", maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Præciser din {data.label}-reaktion</div>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:4, lineHeight:1.5 }}>{data.intro}</div>
          </div>
          <div onClick={onClose} style={{ cursor:"pointer", padding:4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
        </div>

        <div style={{ fontSize:11, color:"var(--green)", fontWeight:600, marginBottom:14 }}>
          Du kan vælge flere — kombinationer der modsiger hinanden er låst.
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {data.options.map(opt => {
            const selected = isSelected(opt.id);
            const disabled = !selected && isDisabled(opt.id);
            return (
              <div key={opt.id}
                onClick={() => !disabled && onToggle(opt.id)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                  border:`1.5px solid ${selected?"var(--green)":disabled?"var(--border)":"var(--border)"}`,
                  background:selected?"var(--green-lt)":disabled?"var(--paper2)":"#fff",
                  borderRadius:12, cursor:disabled?"not-allowed":"pointer",
                  opacity:disabled?0.45:1, transition:"all .15s" }}>
                <div style={{ fontSize:22, flexShrink:0 }}>{opt.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:selected?"var(--green)":"var(--ink)", marginBottom:2 }}>{opt.label}</div>
                  <div style={{ fontSize:11, color:"var(--muted2)", lineHeight:1.4 }}>{opt.desc}</div>
                  {disabled && (
                    <div style={{ fontSize:10, color:"var(--muted)", marginTop:3 }}>Modstrider valgt kombination</div>
                  )}
                </div>
                {selected && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5">
                    <path strokeLinecap="round" d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </div>
            );
          })}
          <div onClick={() => { data.options.forEach(o => isSelected(o.id) && onToggle(o.id)); onClose(); }}
            style={{ padding:"10px 14px", border:"1px solid var(--border)", borderRadius:12,
              cursor:"pointer", textAlign:"center", fontSize:12, color:"var(--muted)" }}>
            Nulstil — behold bred kategori ({data.label})
          </div>
        </div>

        <button className="btn btn-primary btn-full" style={{ marginTop:16 }} onClick={onClose}>
          Gem valg
        </button>
      </div>
    </div>
  );
};


// ─── FÆLLES ALLERGI/PROFIL FORMULAR ──────────────────────────────────────────
// Bruges identisk i: onboarding trin 4, rediger profil, familie (onboarding + rediger)

export const AllergyForm = ({ allergens, setAllergens, customAllerg, setCustomAllerg,
  selectedENumbers, setSelectedENumbers, allergenSubtypes, setAllergenSubtypes,
  activeSubtypeModal, setActiveSubtypeModal, showENumbers = true }) => {

  const [customInput, setCustomInput] = React.useState("");
  const [eSearch, setESearch] = React.useState("");
  const [eCategory, setECategory] = React.useState("alle");

  return (
    <div>
      {/* Farveforklaring */}
      <div style={{ display:"flex", gap:6, marginBottom:10 }}>
        {[["var(--border)","var(--ink)","Ingen"],["var(--amber)","var(--amber)","Intolerance"],["var(--red)","var(--red)","Allergi"]].map(([border,color,label]) => (
          <div key={label} style={{ flex:1, display:"flex", alignItems:"center", gap:5, padding:"5px 8px",
            border:`1.5px solid ${border}`, borderRadius:8,
            background:color==="var(--ink)"?"var(--paper2)":color==="var(--amber)"?"var(--amber-lt)":"var(--red-lt)" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }}/>
            <span style={{ fontSize:10, fontWeight:700, color }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:11, color:"var(--muted)", marginBottom:12, lineHeight:1.4 }}>
        Tryk 1x = Intolerance · 2x = Allergi · 3x = Fjern
      </div>

      {/* Allergen chips — 3-state */}
      <div className="chip-grid">
        {ALLERGENS.map(a => {
          const isAllergen = allergens.includes(a.id) && !customAllerg.includes(a.id+"_intolerance");
          const isIntolerance = allergens.includes(a.id) && customAllerg.includes(a.id+"_intolerance");
          const state = isAllergen ? "allergen" : isIntolerance ? "intolerance" : "none";
          const bg = state==="allergen"?"var(--red-lt)":state==="intolerance"?"var(--amber-lt)":"var(--paper2)";
          const border = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--border)";
          const color = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--ink)";
          return (
            <div key={a.id} className="chip" style={{ background:bg, border:`1.5px solid ${border}`, color }}
              onClick={() => {
                if (state==="none") {
                  setAllergens(p => [...p, a.id]);
                  setCustomAllerg(p => [...p, a.id+"_intolerance"]);
                } else if (state==="intolerance") {
                  setCustomAllerg(p => p.filter(x => x !== a.id+"_intolerance"));
                } else {
                  setAllergens(p => p.filter(x => x !== a.id));
                }
              }}>
              <span style={{ flex:1 }}>{a.label}</span>
              {state!=="none" && allergenSubtypes[a.id] && <div style={{ fontSize:8, fontWeight:800, color }}>✓</div>}
              {state!=="none" && !allergenSubtypes[a.id] && <div style={{ fontSize:9, fontWeight:800, color }}>{state==="allergen"?"Allergi":"Intolerance"}</div>}
            </div>
          );
        })}
      </div>

      {/* Præciser valgte allergier */}
      {allergens.some(id => ALLERGEN_SUBTYPES[id]) && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>Tilpas din allergi præcist til dig selv</div>
          <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>
            For størst mulig tryghed kan du præcisere hvad du reagerer på inden for hver kategori.
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {allergens.filter(id => ALLERGEN_SUBTYPES[id]).map(id => {
              const data = ALLERGEN_SUBTYPES[id];
              const subtype = allergenSubtypes[id];
              const subtypeLabel = subtype && subtype.length > 0 ? subtype.map(id => data.options.find(o=>o.id===id)?.label).filter(Boolean).join(", ") : null;
              return (
                <div key={id} onClick={() => setActiveSubtypeModal(id)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                    border:"1.5px solid var(--green)", background:"var(--green-lt)",
                    borderRadius:10, cursor:"pointer" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--green)" }}>{data.label}</div>
                    <div style={{ fontSize:11, color:"var(--muted2)", marginTop:2 }}>{subtypeLabel || "Tryk for at præcisere →"}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                    <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skriv selv */}
      <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Kan ikke finde din allergi?</div>
        <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>Skriv det selv herunder. Vi tilføjer løbende flere valgmuligheder med større sikkerhed.</div>
        <div className="input-row" style={{ marginBottom: customAllerg.filter(c=>!c.endsWith("_intolerance")).length ? 8 : 0 }}>
          <input className="field" placeholder="Fx. Fructose…" value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter"&&customInput.trim()){ setCustomAllerg(p=>[...p,customInput.trim()]); setCustomInput(""); }}} />
          <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(p=>[...p,customInput.trim()]); setCustomInput(""); }}}>+</button>
        </div>
        {customAllerg.filter(c=>!c.endsWith("_intolerance")).length > 0 && (
          <div className="tags">
            {customAllerg.filter(c=>!c.endsWith("_intolerance")).map((a,i) => (
              <div key={i} className="tag">{a}<span className="tag-x" onClick={() => setCustomAllerg(p=>p.filter(x=>x!==a))}>×</span></div>
            ))}
          </div>
        )}
      </div>

      {/* E-numre */}
      {showENumbers && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>E-numre der undgås</div>
          <ENumberPicker selected={selectedENumbers} onChange={setSelectedENumbers} />
        </div>
      )}
    </div>
  );
};


// ─── FÆLLES FAMILIE FORMULAR ─────────────────────────────────────────────────
// Bruges 1-1 identisk i onboarding trin 6, familie-skærm og redigering af familiemedlem
