// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, DIETS, AVATAR_COLORS, ALLERGEN_SUBTYPES, INCOMPATIBLE_SUBTYPES, E_CATEGORIES, E_NUMBERS } from "./constants.jsx";
import { ENumberPicker, SubtypeModal, AllergyForm } from "./AllergenPicker.jsx";

export const MemberForm = ({
  name, setName,
  allergens, setAllergens,
  customAllerg, setCustomAllerg,
  subtypes, setSubtypes,
  diets, setDiets,
  eNumbers, setENumbers,
  customInput, setCustomInput,
  onAdd, addLabel,
}) => {
  const [activeSubModal, setActiveSubModal] = React.useState(null);
  const [eSearch, setESearch] = React.useState("");
  const [eCat, setECat] = React.useState("alle");

  return (
    <div>
      {activeSubModal && (
        <SubtypeModal
          allergenId={activeSubModal}
          selectedSubtypes={subtypes[activeSubModal] || []}
          onToggle={(id) => setSubtypes(s => {
            const cur = s[activeSubModal] || [];
            return { ...s, [activeSubModal]: cur.includes(id) ? cur.filter(x=>x!==id) : [...cur, id] };
          })}
          onClose={() => setActiveSubModal(null)}
        />
      )}

      {/* Navn */}
      <label className="field-lbl">Navn</label>
      <input className="field" placeholder="Fx. Mia (8 år)" value={name}
        onChange={e => setName(e.target.value)} style={{ marginBottom:14 }} />

      {/* Allergier / intolerancer — 3-state identisk med egen profil */}
      <div className="card-lbl" style={{ marginBottom:6 }}>Allergier / intolerancer</div>

      {/* Farveforklaring */}
      <div style={{ display:"flex", gap:6, marginBottom:10 }}>
        {[["var(--border)","var(--ink)","Ingen"],["var(--amber)","var(--amber)","Intolerance"],["var(--red)","var(--red)","Allergi"]].map(([border,color,label]) => (
          <div key={label} style={{ flex:1, display:"flex", alignItems:"center", gap:5, padding:"4px 8px",
            border:`1.5px solid ${border}`, borderRadius:8,
            background:color==="var(--ink)"?"var(--paper2)":color==="var(--amber)"?"var(--amber-lt)":"var(--red-lt)" }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0 }}/>
            <span style={{ fontSize:10, fontWeight:700, color }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:10, color:"var(--muted)", marginBottom:10 }}>Tryk 1x = Intolerance · 2x = Allergi · 3x = Fjern</div>

      <div className="chip-grid" style={{ marginBottom:10 }}>
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
              {state!=="none" && (
                <div style={{ fontSize:9, fontWeight:800, color }}>
                  {subtypes[a.id] ? "✓" : state==="allergen"?"Allergi":"Intolerance"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Præciser allergi */}
      {allergens.some(id => ALLERGEN_SUBTYPES[id]) && (
        <div style={{ marginBottom:12, paddingBottom:12, borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>Tilpas allergi præcist til dig selv</div>
          <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>For størst mulig tryghed — præciser hvad du reagerer på.</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {allergens.filter(id => ALLERGEN_SUBTYPES[id]).map(id => {
              const data = ALLERGEN_SUBTYPES[id];
              const subtype = subtypes[id];
              const subtypeLabel = subtype && subtype.length > 0 ? subtype.map(id => data.options.find(o=>o.id===id)?.label).filter(Boolean).join(", ") : null;
              return (
                <div key={id} onClick={() => setActiveSubModal(id)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                    border:"1.5px solid var(--green)", background:"var(--green-lt)", borderRadius:10, cursor:"pointer" }}>
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

      {/* Custom allergier */}
      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Kan ikke finde allergi?</div>
      <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>Vi tilføjer løbende flere valgmuligheder med større sikkerhed.</div>
      <div className="input-row" style={{ marginBottom:customAllerg.filter(c=>!c.endsWith("_intolerance")).length ? 8 : 12 }}>
        <input className="field" placeholder="Fx. Fructose…" value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if(e.key==="Enter"&&customInput.trim()){ setCustomAllerg(p=>[...p,customInput.trim()]); setCustomInput(""); }}} />
        <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(p=>[...p,customInput.trim()]); setCustomInput(""); }}}>+</button>
      </div>
      {customAllerg.filter(c=>!c.endsWith("_intolerance")).length > 0 && (
        <div className="tags" style={{ marginBottom:12 }}>
          {customAllerg.filter(c=>!c.endsWith("_intolerance")).map((a,i) => (
            <div key={i} className="tag">{a}<span className="tag-x" onClick={() => setCustomAllerg(p=>p.filter(x=>x!==a))}>×</span></div>
          ))}
        </div>
      )}

      {/* Diæt */}
      <div className="card-lbl" style={{ marginBottom:8 }}>Diæt</div>
      <div className="chip-grid" style={{ marginBottom:12 }}>
        {DIETS.map(d => {
          const on = diets.includes(d.id);
          return (
            <div key={d.id} className={`chip${on?" on":""}`}
              onClick={() => setDiets(p => on ? p.filter(x=>x!==d.id) : [...p,d.id])}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700 }}>{d.label}</div>
                <div style={{ fontSize:10, color:"var(--muted)", marginTop:1 }}>{d.desc}</div>
              </div>
              {on && <div className="chip-check">✓</div>}
            </div>
          );
        })}
      </div>

      {/* E-numre */}
      <div className="card-lbl" style={{ marginBottom:6 }}>E-numre der undgås</div>
      <input className="field" placeholder="Søg E-nummer..." value={eSearch}
        onChange={e => setESearch(e.target.value)} style={{ marginBottom:6 }} />
      <select className="field" value={eCat} onChange={e => setECat(e.target.value)} style={{ marginBottom:8 }}>
        <option value="alle">Alle kategorier</option>
        {E_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label} ({c.range})</option>)}
      </select>

      {/* E-numre farveforklaring */}
      <div style={{ display:"flex", gap:6, marginBottom:6 }}>
        {[["var(--border)","var(--ink)","Ingen"],["var(--amber)","var(--amber)","Intolerance"],["var(--red)","var(--red)","Allergi"]].map(([border,color,label]) => (
          <div key={label} style={{ flex:1, display:"flex", alignItems:"center", gap:4, padding:"3px 6px", border:`1.5px solid ${border}`, borderRadius:6,
            background:color==="var(--ink)"?"var(--paper2)":color==="var(--amber)"?"var(--amber-lt)":"var(--red-lt)" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }}/>
            <span style={{ fontSize:9, fontWeight:700, color }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:9, color:"var(--muted)", marginBottom:6 }}>Tryk 1x = Intolerance · 2x = Allergi · 3x = Fjern</div>

      <div style={{ maxHeight:200, overflowY:"auto", border:"1px solid var(--border)", borderRadius:8, marginBottom:eNumbers.length ? 8 : 12 }}>
        {Object.entries(E_NUMBERS).filter(([e,name]) => {
          const ms = !eSearch || e.toLowerCase().includes(eSearch.toLowerCase()) || name.toLowerCase().includes(eSearch.toLowerCase());
          if (!ms) return false;
          if (eCat==="alle") return true;
          const cat = E_CATEGORIES.find(c=>c.id===eCat);
          const num = parseInt(e.replace(/[^0-9]/g,""));
          return cat ? num>=cat.min && num<=cat.max : true;
        }).map(([e,name],i,arr) => {
          const state = eNumbers.includes(e+"_intolerance") ? "intolerance" : eNumbers.includes(e) ? "allergen" : "none";
          const bg = state==="allergen"?"var(--red-lt)":state==="intolerance"?"var(--amber-lt)":"#fff";
          const col = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--ink)";
          return (
            <div key={e} onClick={() => {
              if (state==="none") setENumbers(p=>[...p,e+"_intolerance"]);
              else if (state==="intolerance") setENumbers(p=>[...p.filter(x=>x!==e+"_intolerance"),e]);
              else setENumbers(p=>p.filter(x=>x!==e));
            }} style={{ display:"flex", gap:8, padding:"7px 12px",
              borderBottom:i<arr.length-1?"1px solid var(--border)":"none",
              background:bg, cursor:"pointer" }}>
              <div style={{ fontSize:11, fontWeight:800, color:col, width:44, flexShrink:0 }}>{e}</div>
              <div style={{ fontSize:11, color:col==="var(--ink)"?"var(--muted2)":col, flex:1, lineHeight:1.3 }}>{name}</div>
              {state!=="none" && <div style={{ fontSize:9, fontWeight:800, color:col }}>{state==="allergen"?"Allergi":"Intol."}</div>}
            </div>
          );
        })}
      </div>

      {eNumbers.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", marginBottom:4 }}>Valgte ({eNumbers.length})</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {eNumbers.map(e => {
              const isInt = e.endsWith("_intolerance");
              const eId = isInt ? e.replace("_intolerance","") : e;
              const col = isInt ? "var(--amber)" : "var(--red)";
              return (
                <div key={e} style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20,
                  background:isInt?"var(--amber-lt)":"var(--red-lt)", color:col,
                  border:`1px solid ${col}`, cursor:"pointer" }}
                  onClick={() => setENumbers(p=>p.filter(x=>x!==e))}>
                  {eId} ×
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gem knap */}
      <button className="btn btn-primary btn-full" onClick={onAdd}
        disabled={!name.trim()}>
        {addLabel || "+ Tilføj familiemedlem"}
      </button>
    </div>
  );
};


// ─── KATEGORI VÆLGER ─────────────────────────────────────────────────────────

export const CategorySelect = ({ value, onChange, options, placeholder="Alle kategorier" }) => {
  const selected = options.find(o => o.id === value);
  return (
    <div style={{ position:"relative", display:"inline-block", minWidth:160 }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance:"none", WebkitAppearance:"none",
          padding:"8px 36px 8px 14px",
          borderRadius:24, border:"1.5px solid var(--border)",
          background:"var(--paper2)", fontSize:13, fontWeight:600,
          color: value === "alle" ? "var(--muted2)" : "var(--ink)",
          cursor:"pointer", fontFamily:"var(--f)",
          outline:"none", width:"100%",
          boxShadow: value !== "alle" ? "0 0 0 2px var(--green)" : "none",
          borderColor: value !== "alle" ? "var(--green)" : "var(--border)",
        }}>
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      {/* Pile-ikon */}
      <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--muted2)", fontSize:11 }}>▾</div>
    </div>
  );
};

// ─── ALLERGEN UNDERKATEGORIER ────────────────────────────────────────────────
