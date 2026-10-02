// @ts-nocheck
import React, { useState } from "react";
import { Icon, showToast, AllergenGlyph } from "./SharedComponents.jsx";
import { ALLERGENS, E_NUMBERS, E_CATEGORIES, DIETS, DIETS_ENABLED } from "./constants.jsx";
import { UI } from "./styleUtils.js";
import { ChoiceChip } from "./DesignSystem.jsx";
import { addUniqueCustom, traceEligible, COELIAC_ID } from "./helpers.js";

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
        style={(a.pickerLabel || a.label).length > 12 ? { gridColumn:"1 / -1" } : undefined}
        onClick={() => onChange(on ? selected.filter(x => x !== a.id) : [...selected, a.id])}>
        <span style={{ ...UI.flex1, minWidth:0, display:"flex", alignItems:"center", gap:6 }}><AllergenGlyph a={a} size={14} /><span style={{ minWidth:0 }}>{a.pickerLabel || a.label}</span></span>
        {a.note && (
          <span role="button" aria-label={`Om ${a.pickerLabel || a.label}`}
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

// "Mangler din allergi eller intolerance?" — felt + plus-knap + tags (2. okt. 2026, Bjørn: ens i onboarding, Rediger præferencer og
// familieformularen). Tidligere tre næsten ens kopier; nu ét sted. `onChange` kaldes ved enhver ændring (tilføj/fjern), så kalderen
// kan nulstille sin egen tilstand (fx onboardingens "ingen allergier" eller Rediger præferencers ugemte-markering).
export const CustomAllergenField = ({ customAllerg, setCustomAllerg, customInput, setCustomInput, onChange }) => {
  const add = () => {
    if (!customInput.trim()) return;
    onChange?.();
    setCustomAllerg(c => addUniqueCustom(c, customInput));
    setCustomInput("");
  };
  const remove = (a) => { onChange?.(); setCustomAllerg(c => c.filter(x => x !== a)); };
  return (
    <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)" }}>
      <div style={UI.sectionLbl6}>Mangler din allergi eller intolerance?</div>
      <div className="input-row" style={{ marginTop:6, marginBottom: customAllerg.length ? 8 : 0, alignItems:"stretch" }}>
        <input className="field" placeholder='Skriv fx "Fruktose"…' value={customInput}
          aria-label="Egen allergi eller intolerance"
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") add(); }} />
        <button className="btn btn-outline" aria-label="Tilføj" onClick={add}
          style={{ width:46, minHeight:0, padding:0, borderRadius:10, fontSize:19, flexShrink:0 }}>+</button>
      </div>
      {customAllerg.length > 0 && (
        <div style={{ fontSize:11.5, color:"var(--muted)", lineHeight:1.45, marginBottom:6 }}>
          Egne valg tjekkes mod ingredienslisten som tekst. De har ingen sporvalg.
        </div>
      )}
      {customAllerg.length > 0 && (
        <div className="tags">
          {customAllerg.map((a, i) => (
            <div key={i} className="tag">{a}<span className="tag-x" role="button" aria-label={`Fjern "${a}"`} tabIndex={0}
              onClick={() => remove(a)} onKeyDown={e => e.key === "Enter" && remove(a)}>×</span></div>
          ))}
        </div>
      )}
    </div>
  );
};

// Følsomhed pr. valgt allergen (allergen_levels, 1. okt. 2026): hvad skal der ske, når pakken siger "Kan indeholde spor af …"?
// "Advar mig" (standard, sikreste valg) eller "Kun ved ingrediens" (advar kun, hvis allergenet står i ingredienslisten).
// Gemmes som levels: { [allergenId]: "direct_only" } (tom = advar også ved spor). Hvert valgt allergen har sin egen række,
// også Gluten og Hvede (to forskellige valg). Cøliaki-vejledning vises KUN under rækken Cøliaki (eget, eksplicit valg): appen antager aldrig
// en diagnose ud fra Gluten, Hvede eller andre valg, og Gluten/Hvede får kun den generelle sporinfo.
// Design (2. okt. 2026, Bjørn): segmenteret kontrol (.trace-seg i theme.jsx, 44 px høje knapper, solid grøn valgt-state med flueben)
// og én kort linje under det valgte valg.
// `bare` fjerner kortets øverste skillelinje (bruges i onboarding, hvor trinnet selv har overskrift); `showTitle` skjuler overskriften.
const TRACE_NOTE = {
  warn: "Du advares både ved ingrediens og ved spor.",
  direct: "Du advares kun, hvis allergenet står i ingredienslisten.",
};
const COELIAC_GUIDANCE = "Har du cøliaki, bør du vælge Advar mig: selv små spor kan give symptomer. Er du i tvivl, så spørg din læge.";
export const AllergenSensitivity = ({ selected, levels, onChange, showIntro = true, showTitle = true, bare = false }) => {
  // Kun allergener, hvor sporvalg giver mening (ikke laktose), og aldrig egne valg
  const ids = traceEligible(selected);
  const rows = ids.map(id => ALLERGENS.find(x => x.id === id)).filter(Boolean).map(a => ({ key: a.id, label: a.pickerLabel || a.label, ids: [a.id] }));
  if (rows.length === 0) return null;
  const isDirect = (row) => row.ids.every(i => levels?.[i] === "direct_only");
  const set = (row, direct) => {
    const next = { ...(levels || {}) };
    for (const i of row.ids) { if (direct) next[i] = "direct_only"; else delete next[i]; }
    onChange(next);
  };
  const opt = (row, direct, active, label) => (
    <button type="button" aria-pressed={active} onClick={() => set(row, direct)}>
      {active && <Icon name="check" size={13} color="var(--green)" />}
      <span>{label}</span>
    </button>
  );
  return (
    <div className="allergen-sensitivity" style={bare ? undefined : { marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)" }}>
      {showTitle && <div style={UI.sectionLbl6}>Spor af allergener</div>}
      {showIntro && (
        <div style={{ fontSize:13, color:"var(--ink2)", margin: "0 0 4px", lineHeight:1.5 }}>
          Mange pakker skriver "kan indeholde spor af", selv om allergenet ikke er en ingrediens. Vælg, hvornår du vil advares.
        </div>
      )}
      {rows.map(row => {
        const direct = isDirect(row);
        return (
          <div key={row.key} style={{ padding:"8px 0" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>{row.label}</div>
            <div className="trace-seg" role="group" aria-label={`${row.label}: advarsel ved spor`}>
              {opt(row, false, !direct, "Advar mig")}
              {opt(row, true, direct, "Kun ved ingrediens")}
            </div>
            <div style={{ fontSize:12.5, color:"var(--muted)", lineHeight:1.45, marginTop:6 }}>{direct ? TRACE_NOTE.direct : TRACE_NOTE.warn}</div>
            {row.key === COELIAC_ID && <div style={{ fontSize:12.5, color:"var(--ink2)", lineHeight:1.45, marginTop:4 }}>{COELIAC_GUIDANCE}</div>}
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
          // Fast 4-kolonne-struktur (2. okt. 2026, onboarding-polering): en tydelig afkrydsningsboks til venstre (selve valget), en fast
          // kode-kolonne, en tekst-kolonne til navn + beskrivelse og en separat info-knap (chevron) til højre, som KUN folder detaljer ud.
          // Hele rækken kan også trykkes for at vælge, så man kan afkrydse direkte i listen uden at åbne hver post.
          const toggle = () => onChange(on ? selected.filter(x => x !== e) : [...selected, e]);
          return (
            <div key={e} className={`enum-row${on ? " on" : ""}`} onClick={toggle}
              style={{ borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none" }}>
              <button type="button" role="checkbox" aria-checked={on} aria-label={`${e} ${shortName}`} className="enum-check"
                onClick={ev => { ev.stopPropagation(); toggle(); }}>
                {on && <Icon name="check" size={13} color="var(--on-green)" />}
              </button>
              <div className="enum-code">{e}</div>
              <div style={{ minWidth:0, textAlign:"left" }}>
                <div className="enum-name">{shortName}</div>
                {isExpanded && detail && <div className="enum-detail">{detail}</div>}
              </div>
              {detail ? (
                <button type="button" className="enum-info" aria-expanded={isExpanded} aria-label={`${isExpanded ? "Skjul" : "Vis"} information om ${e}`}
                  onClick={ev => { ev.stopPropagation(); setExpandedRows(st => ({ ...st, [e]: !st[e] })); }}>
                  <span style={{ display:"flex", transform: isExpanded ? "rotate(180deg)" : "none", transition:".2s" }}>
                    <Icon name="chevronDown" size={14} color="var(--muted)" />
                  </span>
                </button>
              ) : <span />}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding:"16px", fontSize:13, color:"var(--muted)", textAlign:"center" }}>Ingen resultater</div>}
      </div>
    </div>
  );
};




// Selvmodsigende subtype-kombinationer — disse kan ikke vælges samtidig

