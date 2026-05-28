// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, DIETS, AVATAR_COLORS, E_NUMBERS, E_CATEGORIES } from "./constants.jsx";
import { ENumberPicker } from "./AllergenPicker.jsx";

export const MemberForm = ({
  name, setName,
  age, setAge,
  gender, setGender,
  allergens, setAllergens,
  customAllerg, setCustomAllerg,
  diets, setDiets,
  eNumbers, setENumbers,
  customInput, setCustomInput,
  onAdd, addLabel,
}) => {
  const [eSearch, setESearch] = React.useState("");
  const [eCat, setECat] = React.useState("alle");

  const isValid = name?.trim() && age && gender;

  return (
    <div>

      {/* Navn * */}
      <label className="field-lbl">Navn <span style={{ color:"var(--red)" }}>*</span></label>
      <input className="field" placeholder="Fx. Mia" value={name}
        onChange={e => setName(e.target.value)}
        style={{ marginBottom:10, borderColor: name?.trim() ? "var(--border2)" : "" }} />

      {/* Alder * */}
      <label className="field-lbl">Alder <span style={{ color:"var(--red)" }}>*</span></label>
      <input className="field" type="number" placeholder="Fx. 8" min="0" max="120"
        value={age || ""}
        onChange={e => setAge(e.target.value)}
        style={{ marginBottom:10 }} />

      {/* Køn * */}
      <label className="field-lbl">Køn <span style={{ color:"var(--red)" }}>*</span></label>
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {["Mand","Kvinde","Andet"].map(g => (
          <div key={g} onClick={() => setGender(g)}
            style={{ flex:1, padding:"9px 0", textAlign:"center", borderRadius:8,
              border:`1.5px solid ${gender===g?"var(--green)":"var(--border)"}`,
              background: gender===g ? "var(--green-lt)" : "#fff",
              fontSize:13, fontWeight:700,
              color: gender===g ? "var(--green)" : "var(--muted2)",
              cursor:"pointer", transition:"all .15s" }}>
            {g}
          </div>
        ))}
      </div>

      {/* Allergier / intolerancer — 3-state identisk med egen profil */}
      <div className="card-lbl" style={{ marginBottom:6 }}>Allergier / intolerancer</div>



      <div className="chip-grid" style={{ marginBottom:10 }}>
        {ALLERGENS.map(a => {
          const on = allergens.includes(a.id);
          return (
            <div key={a.id} className="chip" style={{
              background: on ? "var(--red-lt)" : "var(--paper2)",
              border: `1.5px solid ${on ? "var(--red)" : "var(--border)"}`,
              color: on ? "var(--red)" : "var(--ink)",
            }}
              onClick={() => setAllergens(p => on ? p.filter(x => x !== a.id) : [...p, a.id])}>
              <span style={{ flex:1 }}>{a.emoji} {a.label}</span>
              {on && <div style={{ fontSize:9, fontWeight:800, color:"var(--red)" }}>✓</div>}
            </div>
          );
        })}
      </div>

      {/* Custom allergier */}
      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Kan ikke finde allergi?</div>
      <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>Vi tilføjer løbende flere valgmuligheder med større sikkerhed.</div>
      <div className="input-row" style={{ marginBottom: customAllerg.length ? 8 : 12 }}>
        <input className="field" placeholder="Fx. Fructose…" value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if(e.key==="Enter"&&customInput.trim()){ setCustomAllerg(p=>[...p,customInput.trim()]); setCustomInput(""); }}} />
        <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(p=>[...p,customInput.trim()]); setCustomInput(""); }}}>+</button>
      </div>
      {customAllerg.length > 0 && (
        <div className="tags" style={{ marginBottom:12 }}>
          {customAllerg.map((a,i) => (
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



      <div style={{ maxHeight:200, overflowY:"auto", border:"1px solid var(--border)", borderRadius:8, marginBottom:eNumbers.length ? 8 : 12 }}>
        {Object.entries(E_NUMBERS).filter(([e,name]) => {
          const ms = !eSearch || e.toLowerCase().includes(eSearch.toLowerCase()) || name.toLowerCase().includes(eSearch.toLowerCase());
          if (!ms) return false;
          if (eCat==="alle") return true;
          const cat = E_CATEGORIES.find(c=>c.id===eCat);
          const num = parseInt(e.replace(/[^0-9]/g,""));
          return cat ? num>=cat.min && num<=cat.max : true;
        }).map(([e,name],i,arr) => {
          const on = eNumbers.includes(e);
          return (
            <div key={e} onClick={() => setENumbers(p => on ? p.filter(x=>x!==e) : [...p,e])}
              style={{ display:"flex", gap:8, padding:"7px 12px",
                borderBottom:i<arr.length-1?"1px solid var(--border)":"none",
                background:on?"var(--red-lt)":"#fff", cursor:"pointer" }}>
              <div style={{ fontSize:11, fontWeight:800, color:on?"var(--red)":"var(--ink)", width:44, flexShrink:0 }}>{e}</div>
              <div style={{ fontSize:11, color:on?"var(--red)":"var(--muted2)", flex:1, lineHeight:1.3 }}>{name}</div>
              {on && <div style={{ fontSize:9, fontWeight:800, color:"var(--red)" }}>✓</div>}
            </div>
          );
        })}
      </div>

      {eNumbers.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", marginBottom:4 }}>Valgte ({eNumbers.length})</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {eNumbers.map(e => (
              <div key={e} style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20,
                background:"var(--red-lt)", color:"var(--red)",
                border:"1px solid var(--red)", cursor:"pointer" }}
                onClick={() => setENumbers(p=>p.filter(x=>x!==e))}>
                {e} ×
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Obligatoriske felter — hjælpetekst */}
      {!isValid && (
        <div style={{ fontSize:11, color:"var(--muted)", marginBottom:10, lineHeight:1.5 }}>
          <span style={{ color:"var(--red)" }}>*</span> Navn, alder og køn er obligatoriske
        </div>
      )}

      {/* Gem knap */}
      <button className="btn btn-primary btn-full" onClick={onAdd}
        disabled={!isValid}>
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
