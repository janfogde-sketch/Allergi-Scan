// @ts-nocheck
import React, { useState } from "react";
import { Icon, showToast } from "./SharedComponents.jsx";
import { ALLERGENS, E_NUMBERS, E_CATEGORIES, DIETS } from "./constants.jsx";
import { UI } from "./styleUtils.js";

// Delt allergi-vælger (grøn valgt-state, ✓, allergi/intolerance-opdeling,
// ⓘ-note på gluten) — udtrukket fra OnboardingScreen.jsx's trin 2 (25. sept.
// 2026, brugerfeedback: familie-formularen på trin 4 skal genbruge PRÆCIS
// denne komponent i stedet for sin egen, røde parallel-version).
export const AllergenChipPicker = ({ selected, onChange }) => {
  const allergiItems = ALLERGENS.filter(a => a.type !== "intolerance");
  const intoleranceItems = ALLERGENS.filter(a => a.type === "intolerance");

  const renderChip = a => {
    const on = selected.includes(a.id);
    return (
      <div key={a.id} className={`chip${on ? " on" : ""}`}
        style={on ? { borderColor:"var(--green)", borderWidth:1.5 } : undefined}
        onClick={() => onChange(on ? selected.filter(x => x !== a.id) : [...selected, a.id])}>
        <span style={UI.flex1}>{a.emoji} {a.label}</span>
        {a.note && (
          <span role="button" aria-label={`Om ${a.label}`}
            onClick={e => { e.stopPropagation(); showToast(a.note, "info"); }}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", width:18, height:18, flexShrink:0, color: on ? "var(--green)" : "var(--muted)" }}>
            <Icon name="info" size={14} color="currentColor" />
          </span>
        )}
        {on && <div className="chip-check"><Icon name="check" size={9} color="var(--on-green)" /></div>}
      </div>
    );
  };

  return (
    <div>
      <div style={UI.sectionLbl6}>Allergier</div>
      <div className="chip-grid" style={{ marginBottom:16 }}>
        {allergiItems.map(renderChip)}
      </div>
      <div style={UI.sectionLbl6}>Intolerancer / andre følsomheder</div>
      <div className="chip-grid">
        {intoleranceItems.map(renderChip)}
      </div>
    </div>
  );
};

// Delt kostpræference-vælger (grøn valgt-state, ✓, sidste-ulige-kort spænder
// hele bredden) — udtrukket fra OnboardingScreen.jsx's trin 3, samme
// begrundelse som AllergenChipPicker ovenfor. `autoNote` er valgfri:
// { id, text } viser en forklarende note under ét specifikt kort i stedet
// for dets normale beskrivelse (bruges til den Gluten→Glutenfri-afledte
// note på trin 3 — MemberForm bruger den ikke).
export const DietChipPicker = ({ selected, onChange, showCount = true, autoNote }) => {
  const selectedCount = selected.length;
  return (
    <div>
      {showCount && (
        <div style={{ fontSize:12, fontWeight:700, color: selectedCount > 0 ? "var(--green)" : "var(--muted)", marginBottom:14 }}>
          {selectedCount} valgt
        </div>
      )}
      <div className="chip-grid">
        {DIETS.map((d, i, arr) => {
          const on = selected.includes(d.id);
          const isDanglingLast = i === arr.length - 1 && arr.length % 2 !== 0;
          const showAutoNote = autoNote && d.id === autoNote.id;
          return (
            <div key={d.id} className={`chip${on ? " on" : ""}`}
              style={{
                ...(on ? { borderColor:"var(--green)", borderWidth:1.5 } : {}),
                ...(isDanglingLast ? { gridColumn:"1 / -1" } : {}),
              }}
              onClick={() => onChange(on ? selected.filter(x => x !== d.id) : [...selected, d.id])}>
              <div style={UI.flex1}>
                <div style={UI.ufw700}>{d.label}</div>
                {showAutoNote ? (
                  <div style={{ fontSize:9.5, color: on ? "var(--green)" : "var(--muted)", fontWeight:500, marginTop:2, lineHeight:1.3 }}>
                    {autoNote.text}
                  </div>
                ) : (
                  <div style={UI.muted11mt2}>{d.desc}</div>
                )}
              </div>
              {on && <div className="chip-check"><Icon name="check" size={9} color="var(--on-green)" /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ENumberPicker = ({ selected, onChange }) => {
  const [search, setSearch] = React.useState("");
  const [cat, setCat] = React.useState("alle");
  // Rækkerne viste tidligere hele E_NUMBERS-beskrivelsen ("Navn — detaljer")
  // direkte i listen, hvilket gjorde den langsom at skimme (25. sept. 2026,
  // brugerfeedback). E_NUMBERS-strengene bruger allerede konsekvent " — "
  // som skilletegn mellem kort navn og uddybende detalje, så vi kan splitte
  // på det i stedet for at ændre selve dataen — kort navn vises altid,
  // detaljen foldes ud pr. række ved tryk på chevronen.
  const [expandedRows, setExpandedRows] = React.useState({});

  const filtered = Object.entries(E_NUMBERS).filter(([e, name]) => {
    const matchSearch = !search || e.toLowerCase().includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (cat === "alle") return true;
    const num = parseInt(e.slice(1).replace(/[^0-9]/g,''));
    const ranges = { farve:[100,199], konserv:[200,299], antioxid:[300,399], emulg:[400,499], smags:[600,699], sode:[900,999] };
    const r = ranges[cat];
    return r ? (num >= r[0] && num <= r[1]) : true;
  });

  const popular = ["E621","E211","E102","E951","E250","E320","E150d","E110","E129"];

  return (
    <div>
      {/* Populære */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
        {popular.filter(e => E_NUMBERS[e]).map(e => {
          const on = selected.includes(e);
          return (
            <div key={e} onClick={() => onChange(on ? selected.filter(x=>x!==e) : [...selected,e])} className="enum-chip"
              style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20,
                background: on?"var(--green-lt)":"var(--surface)",
                color: on?"var(--green)":"var(--ink)",
                border:`1px solid ${on?"var(--green)":"var(--border)"}` }}>
              {e}{on && <Icon name="check" size={10} color="var(--green)" />}
            </div>
          );
        })}
      </div>

      {/* Søg */}
      <input style={{ width:"100%", padding:"8px 12px", border:"1px solid var(--border2)", borderRadius:8, fontSize:13, fontFamily:"var(--f)", marginBottom:8, boxSizing:"border-box", background:"var(--surface)", color:"var(--ink)" }}
        placeholder="Søg E-nummer eller navn..." value={search} onChange={e => setSearch(e.target.value)} />

      {/* Kategori */}
      <select style={{ width:"100%", padding:"8px 12px", border:"1px solid var(--border2)", borderRadius:8, fontSize:13, fontFamily:"var(--f)", marginBottom:8, background:"var(--surface)", color:"var(--ink)", boxSizing:"border-box" }}
        value={cat} onChange={e => setCat(e.target.value)}>
        <option value="alle">Alle kategorier</option>
        <option value="farve">Farvestoffer (E100–E199)</option>
        <option value="konserv">Konserveringsmidler (E200–E299)</option>
        <option value="antioxid">Antioxidanter (E300–E399)</option>
        <option value="emulg">Emulgatorer / Stabilisatorer (E400–E499)</option>
        <option value="smags">Smagsforstærkere (E600–E699)</option>
        <option value="sode">Sødestoffer (E900–E999)</option>
      </select>



      {/* Liste */}
      <div style={UI.umxh320_ovyauto_bd1pxsolid_br8}>
        {filtered.map(([e, name], i, arr) => {
          const on = selected.includes(e);
          const dashIdx = name.indexOf(" — ");
          const shortName = dashIdx === -1 ? name : name.slice(0, dashIdx);
          const detail = dashIdx === -1 ? "" : name.slice(dashIdx + 3);
          const isExpanded = !!expandedRows[e];
          return (
            <div key={e} className="enum-row"
              style={{ borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none", background: on?"var(--green-lt)":"var(--surface)" }}>
              <div onClick={() => onChange(on ? selected.filter(x=>x!==e) : [...selected, e])}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", cursor:"pointer" }}>
                <div style={{ fontSize:12, fontWeight:800, color:on?"var(--green)":"var(--ink)", width:48, flexShrink:0 }}>{e}</div>
                <div style={{ fontSize:12, color:on?"var(--green)":"var(--ink2)", flex:1, lineHeight:1.4 }}>{shortName}</div>
                {detail && (
                  <div role="button" aria-label={isExpanded ? "Skjul detaljer" : "Vis detaljer"}
                    onClick={ev => { ev.stopPropagation(); setExpandedRows(s => ({...s, [e]: !s[e]})); }}
                    style={{ flexShrink:0, padding:4, margin:-4, display:"flex", transform: isExpanded ? "rotate(180deg)" : "none", transition:".2s" }}>
                    <Icon name="chevronDown" size={13} color="var(--muted)" />
                  </div>
                )}
                {on && <div style={{ flexShrink:0 }}><Icon name="check" size={11} color="var(--green)" /></div>}
              </div>
              {isExpanded && detail && (
                <div style={{ padding:"0 12px 8px 58px", fontSize:11, color:"var(--muted)", lineHeight:1.4 }}>{detail}</div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding:"16px", fontSize:13, color:"var(--muted)", textAlign:"center" }}>Ingen resultater</div>}
      </div>

      {/* Valgte */}
      {selected.length > 0 && (
        <div style={{ marginTop:10 }}>
          <div style={UI.sectionLbl6}>Valgte ({selected.length})</div>
          <div style={UI.wrapGap4}>
            {selected.map(e => (
              <div key={e} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px",
                background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:20 }}>
                <div style={{ fontSize:11, fontWeight:800, color:"var(--green)" }}>{e}</div>
                <div onClick={() => onChange(selected.filter(x=>x!==e))}
                  onKeyDown={ev => ev.key === "Enter" && onChange(selected.filter(x=>x!==e))}
                  role="button" aria-label={`Fjern ${e}`} tabIndex={0} className="enum-remove"
                  style={{ lineHeight:0, padding:6, margin:-6 }}>
                  <Icon name="x" size={11} color="var(--green)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};




// Selvmodsigende subtype-kombinationer — disse kan ikke vælges samtidig

