// @ts-nocheck
import React, { useState } from "react";
import { Icon, showToast, AllergenGlyph } from "./SharedComponents.jsx";
import { ALLERGENS, E_NUMBERS, E_CATEGORIES, DIETS, DIETS_ENABLED } from "./constants.jsx";
import { UI } from "./styleUtils.js";
import { ChoiceChip } from "./DesignSystem.jsx";

// Gluten ↔ Glutenfri-synkronisering (28. sept. 2026, Profil-restrukturering,
// krav 3: "Ændres en valgmulighed ét sted i kodebasen, skal ændringen slå
// igennem både i onboarding og redigering") — udtrukket til ÉN fælles hook
// i stedet for to næsten-identiske kopier (OnboardingScreen.jsx trin 2→3 og
// MemberForm.jsx havde hver sin, opererende på hhv. `user.diets`/`setUser`
// og lokale `diets`/`setDiets`-props). `setDiets` skal altid modtage det
// FULDE nye array, samme kontrakt som DietChipPicker/AllergenChipPickers
// egen `onChange`. Bruges nu tre steder: onboarding, MemberForm og
// ProfileScreen.jsx's "Rediger præferencer".
export function useGlutenFreeSync(allergens, diets, setDiets) {
  const [glutenFreeAutoApplied, setGlutenFreeAutoApplied] = useState(false);
  React.useEffect(() => {
    // Kostpræferencer er sat på pause: ingen automatisk "Glutenfri"-diæt (koden er bevaret til genoptagelse)
    if (!DIETS_ENABLED) return;
    const hasGluten = allergens.includes("gluten");
    const hasGlutenFree = diets.includes("gluten-free");
    if (hasGluten && !hasGlutenFree) {
      setDiets([...diets, "gluten-free"]);
      setGlutenFreeAutoApplied(true);
    } else if (!hasGluten && hasGlutenFree && glutenFreeAutoApplied) {
      setDiets(diets.filter(d => d !== "gluten-free"));
      setGlutenFreeAutoApplied(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allergens]);
  return [glutenFreeAutoApplied, setGlutenFreeAutoApplied];
}

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
      <ChoiceChip key={a.id} selected={on} showCheck={false}
        onClick={() => onChange(on ? selected.filter(x => x !== a.id) : [...selected, a.id])}>
        <span style={UI.flex1}><AllergenGlyph a={a} size={14} /> {a.label}</span>
        {a.note && (
          <span role="button" aria-label={`Om ${a.label}`}
            onClick={e => { e.stopPropagation(); showToast(a.note, "info"); }}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", width:18, height:18, flexShrink:0, color: on ? "var(--green)" : "var(--muted)" }}>
            <Icon name="info" size={14} color="currentColor" />
          </span>
        )}
        {on && <div className="chip-check"><Icon name="check" size={9} color="var(--ink)" /></div>}
      </ChoiceChip>
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

// Følsomhed pr. valgt allergen (allergen_levels, 1. okt. 2026): "Også spor" (standard, spor flagges som advarsel) eller
// "Kun direkte indhold" (spor flagges ikke, men vises som en rolig info-linje). SIMPEL førsteversion, som Bjørn
// kan finpudse (design) — se to do "Design: følsomhed pr. allergen (spor)". levels: { [allergenId]: "direct_only" }.
export const AllergenSensitivity = ({ selected, levels, onChange }) => {
  const items = (selected || []).map(id => ALLERGENS.find(a => a.id === id)).filter(Boolean);
  if (items.length === 0) return null;
  const toggle = (id) => {
    const next = { ...(levels || {}) };
    if (next[id] === "direct_only") delete next[id]; else next[id] = "direct_only";
    onChange(next);
  };
  return (
    <div className="allergen-sensitivity" style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)" }}>
      <div style={UI.sectionLbl6}>Reagerer du på spor?</div>
      <div style={{ fontSize:12, color:"var(--muted)", margin:"4px 0 6px", lineHeight:1.4 }}>
        Vælg "Kun direkte indhold", hvis du ikke reagerer på spor ("kan indeholde"). Så flagges spor ikke som advarsel.
      </div>
      {items.map(a => {
        const only = levels?.[a.id] === "direct_only";
        return (
          <div key={a.id}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"6px 0" }}>
              <span style={{ fontSize:13.5, fontWeight:600 }}>{a.label}</span>
              <button type="button" className="btn btn-outline btn-sm" role="switch" aria-checked={!only}
                aria-label={`${a.label}: ${only ? "kun direkte indhold" : "også spor"}`} onClick={() => toggle(a.id)}>
                {only ? "Kun direkte indhold" : "Også spor"}
              </button>
            </div>
            {only && (a.id === "gluten" || a.id === "hvede") && (
              <div style={{ fontSize:11.5, color:"var(--amber)", lineHeight:1.4, paddingBottom:6 }}>
                Spor af gluten kan have betydning ved cøliaki. Tal med din læge, før du undlader at få advarsler om spor.
              </div>
            )}
          </div>
        );
      })}
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
            <ChoiceChip key={d.id} selected={on} showCheck={false}
              style={isDanglingLast ? { gridColumn:"1 / -1" } : undefined}
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
              {on && <div className="chip-check"><Icon name="check" size={9} color="var(--ink)" /></div>}
            </ChoiceChip>
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

  return (
    <div>
      {/* Valgte — vises øverst, ikke nederst under hele listen (25. sept.
          2026, brugerfeedback: man skal kunne se sine egne valg med det
          samme man åbner sektionen, ikke skulle scrolle forbi hele listen
          for at finde dem). Kun tallet vises IKKE her længere (29. sept.
          2026, "E-numre kompakt accordion") — det viste allerede samme tal
          som den omsluttende Accordion-header, så en gentaget "(X)" her var
          ren duplikering. Selve chipsene er nu det ENE, tydelige sted
          valgte E-numre præsenteres (den tidligere "populære"-quick-select-
          række herunder viste samtidig de samme valgte numre en tredje
          gang, fremhævet grønne — fjernet helt, se dens tidligere kommentar
          i git-historikken). */}
      {selected.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={UI.sectionLbl6}>Valgte E-numre</div>
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
          // Fast 3-kolonne-struktur (25. sept. 2026, brugerfeedback): en fast
          // kode-kolonne (76px) til venstre, en tekst-kolonne til navn +
          // beskrivelse (samme venstre kant for begge, uanset linjeantal —
          // begge ligger nu i samme grid-celle i stedet for at beskrivelsen
          // var en selvstændig søskende-boks med sin egen, ikke-matchende
          // padding-left), og et fast chevron/check-område (36px) til højre.
          return (
            <div key={e} className="enum-row"
              style={{ borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none", background: on?"var(--green-lt)":"var(--surface)" }}>
              <div onClick={() => onChange(on ? selected.filter(x=>x!==e) : [...selected, e])}
                style={{ display:"grid", gridTemplateColumns:"76px 1fr 36px", alignItems:"start", padding:"8px 12px", cursor:"pointer" }}>
                <div style={{ fontSize:12, fontWeight:800, color:on?"var(--green)":"var(--ink)" }}>{e}</div>
                <div style={{ minWidth:0, textAlign:"left" }}>
                  <div style={{ fontSize:12, color:on?"var(--green)":"var(--ink2)", lineHeight:1.4, textAlign:"left" }}>{shortName}</div>
                  {isExpanded && detail && (
                    <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.4, marginTop:4, textAlign:"left" }}>{detail}</div>
                  )}
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:4 }}>
                  {detail && (
                    <div role="button" aria-label={isExpanded ? "Skjul detaljer" : "Vis detaljer"}
                      onClick={ev => { ev.stopPropagation(); setExpandedRows(s => ({...s, [e]: !s[e]})); }}
                      style={{ flexShrink:0, padding:4, margin:-4, display:"flex", transform: isExpanded ? "rotate(180deg)" : "none", transition:".2s" }}>
                      <Icon name="chevronDown" size={13} color="var(--muted)" />
                    </div>
                  )}
                  {on && <div style={{ flexShrink:0, display:"flex" }}><Icon name="check" size={11} color="var(--green)" /></div>}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding:"16px", fontSize:13, color:"var(--muted)", textAlign:"center" }}>Ingen resultater</div>}
      </div>
    </div>
  );
};




// Selvmodsigende subtype-kombinationer — disse kan ikke vælges samtidig

