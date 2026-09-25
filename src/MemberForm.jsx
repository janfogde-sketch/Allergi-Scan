// @ts-nocheck
import React from "react";
import { Icon } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";
import { AgeStepper, GenderPicker } from "./FormFields.jsx";
import { AllergenChipPicker, DietChipPicker, ENumberPicker } from "./AllergenPicker.jsx";
import { Accordion, PrimaryButton, InputField } from "./DesignSystem.jsx";

// Familiemedlem-formularen genbruger nu PRÆCIS de samme felt-komponenter som
// onboarding trin 1-3 (25. sept. 2026, brugerfeedback: "Ingen nye designs...
// Brugeren skal føle at de udfylder det samme for deres familiemedlem, ikke
// møder et nyt formularsystem") — Alder/Køn fra FormFields.jsx, allergi-
// og kostpræference-vælgerne samt E-nummer-vælgeren fra AllergenPicker.jsx.
// Rettede samtidig at hele formularen tidligere brugte RØD som valgt-farve
// for allergier/E-numre (rød er reserveret til "produkt indeholder
// allergen"/fejl i resten af appen) — de delte komponenter bruger allerede
// den korrekte grønne valgt-state.
export const MemberForm = ({
  name, setName,
  birthYear, setBirthYear,
  gender, setGender,
  allergens, setAllergens,
  customAllerg, setCustomAllerg,
  diets, setDiets,
  eNumbers, setENumbers,
  customInput, setCustomInput,
  onAdd, addLabel,
}) => {
  const isValid = name?.trim() && birthYear && gender;
  const age = birthYear ? String(new Date().getFullYear() - parseInt(birthYear)) : "";
  // "Navn, alder og køn er obligatoriske"-teksten må først vises EFTER et
  // forsøgt tryk på "+ Tilføj familiemedlem", ikke proaktivt fra starten
  // (25. sept. 2026, brugerfeedback — samme princip som trin 1's
  // step1Attempted). Knappen har derfor bevidst IKKE det native
  // disabled-attribut (ville blokere selve klikket og dermed forsøget).
  const [attempted, setAttempted] = React.useState(false);
  // E-numre skal være lukket som standard, ligesom trin 2 — ellers bliver
  // trin 4 unødigt langt for en valgfri funktion (25. sept. 2026,
  // brugerfeedback). Lokal state, da MemberForm er en selvstændig,
  // genbrugelig komponent uden adgang til onboardingens egen state.
  const [showENumre, setShowENumre] = React.useState(false);

  return (
    <div>

      {/* Navn * */}
      <InputField label="Navn" required style={{ marginBottom:17 }}
        placeholder="Fx. Mia" value={name} onChange={e => setName(e.target.value)} />

      {/* Alder * — delt AgeStepper-komponent, samme som trin 1. Gemmes
          internt som fødselsår (birthYear-prop uændret). */}
      <div style={{ marginBottom:19 }}>
        <label className="field-lbl">Alder <span style={UI.red}>*</span></label>
        <AgeStepper value={age} min={0}
          onChange={a => setBirthYear(a ? String(new Date().getFullYear() - parseInt(a)) : "")} />
      </div>

      {/* Køn * — delt GenderPicker-komponent, samme fire valgmuligheder
          (inkl. "Vil ikke oplyse") som trin 1. */}
      <div style={{ marginBottom:17 }}>
        <label className="field-lbl">Køn <span style={UI.red}>*</span></label>
        <GenderPicker value={gender} onChange={setGender} />
      </div>

      {/* Allergier / intolerancer — delt AllergenChipPicker, samme som
          trin 2 (grøn valgt-state, allergi/intolerance-opdeling, ⓘ-note). */}
      <div className="card-lbl" style={UI.mb8}>Allergier / intolerancer</div>
      <AllergenChipPicker selected={allergens} onChange={setAllergens} />

      {/* Skriv selv — samme ordlyd/opbygning som trin 2 */}
      <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)" }}>
        <div style={UI.sectionLbl6}>Mangler din allergi eller intolerance?</div>
        <div className="input-row" style={{ marginTop:6, marginBottom: customAllerg.length ? 8 : 0 }}>
          <input className="field" placeholder='Skriv fx "Fruktose"…' value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter"&&customInput.trim()){ setCustomAllerg(p=>[...p,customInput.trim()]); setCustomInput(""); }}} />
          <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(p=>[...p,customInput.trim()]); setCustomInput(""); }}}>+</button>
        </div>
        {customAllerg.length > 0 && (
          <div className="tags">
            {customAllerg.map((a,i) => (
              <div key={i} className="tag">{a}<span className="tag-x" role="button" aria-label={`Fjern "${a}"`} tabIndex={0}
                onClick={() => setCustomAllerg(p=>p.filter(x=>x!==a))} onKeyDown={e => e.key === "Enter" && setCustomAllerg(p=>p.filter(x=>x!==a))}>×</span></div>
            ))}
          </div>
        )}
      </div>

      {/* Kostpræferencer — delt DietChipPicker, samme som trin 3 (grøn
          valgt-state, sidste-ulige-kort spænder hele bredden). */}
      <div className="card-lbl" style={{ marginTop:16, marginBottom:8 }}>Kostpræferencer</div>
      <DietChipPicker selected={diets} onChange={setDiets} />

      {/* E-numre — samme delte ENumberPicker og lukkede-som-standard
          Accordion-mønster som trin 2. Erstatter den tidligere lokale, røde
          søg/liste-implementering. */}
      <Accordion label="Overvåg specifikke E-numre" count={eNumbers.length}
        open={showENumre} onToggle={() => setShowENumre(s => !s)} style={{ marginTop:16 }}>
        <div style={UI.mt8}>
          <ENumberPicker selected={eNumbers} onChange={setENumbers} />
        </div>
      </Accordion>

      {/* Obligatoriske felter — hjælpetekst, kun efter et forsøgt tryk */}
      {attempted && !isValid && (
        <div style={{ fontSize:11, color:"var(--muted)", margin:"12px 0 10px", lineHeight:1.5 }}>
          <span style={UI.red}>*</span> Navn, alder og køn er obligatoriske
        </div>
      )}

      {/* Gem knap */}
      <PrimaryButton style={{ marginTop:12 }} softDisabled={!isValid}
        onClick={() => {
          if (!isValid) { setAttempted(true); return; }
          onAdd();
          setAttempted(false);
        }}>
        {addLabel || "+ Tilføj familiemedlem"}
      </PrimaryButton>
    </div>
  );
};


// ─── KATEGORI VÆLGER ─────────────────────────────────────────────────────────

export const CategorySelect = ({ value, onChange, options, placeholder="Alle kategorier", style }) => {
  const selected = options.find(o => o.id === value);
  return (
    <div style={{ position:"relative", display:"inline-block", minWidth:160, ...style }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance:"none", WebkitAppearance:"none",
          padding:"8px 36px 8px 14px",
          borderRadius:24, border:"1.5px solid var(--border)",
          background:"var(--surface)", fontSize:13, fontWeight:600,
          color: value === "alle" ? "var(--muted2)" : "var(--ink)",
          cursor:"pointer", fontFamily:"var(--f)",
          outline:"none", width:"100%",
          boxShadow: value !== "alle" ? "0 0 0 2px var(--green)" : "none",
          borderColor: value !== "alle" ? "var(--green)" : "var(--border)",
        }}>
        {options.map(o => (
          <option key={o.id} value={o.id} style={{ background:"var(--surface)", color:"var(--ink)" }}>{o.label}</option>
        ))}
      </select>
      {/* Pile-ikon */}
      <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--muted2)", fontSize:11 }}>▾</div>
    </div>
  );
};

// ─── ALLERGEN UNDERKATEGORIER ────────────────────────────────────────────────

