// @ts-nocheck
import React from "react";
import { Icon, showToast, ConfirmDialog } from "./SharedComponents.jsx";
import { useHealthConsent } from "./useHealthConsent.js";
import HealthConsentBox from "./HealthConsentBox.jsx";
import { memberConsentTexts } from "./healthConsent.js";
import { UI } from "./styleUtils.js";
import { AgeSelect, GenderPicker } from "./FormFields.jsx";
import { AllergenChipPicker, AllergenSensitivity, CustomAllergenField, DietChipPicker, ENumberPicker, useGlutenFreeSync } from "./AllergenPicker.jsx";
import { Accordion, PrimaryButton, SecondaryButton, InputField } from "./DesignSystem.jsx";
import { pruneAllergenLevels } from "./helpers.js";
import { DIETS_ENABLED } from "./constants.jsx";

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
  levels, setLevels,
  eNumbers, setENumbers,
  customInput, setCustomInput,
  onAdd, addLabel, editing = false,
  // Profiler uden egen konto er kun til børn under 18: alderen kan ikke sættes højere end 17. Forsøger man alligevel, vises en note; `onInviteAdult`
  // fører direkte til invitation af en voksen (findes ikke i onboarding, hvor `inviteHint` forklarer, hvor invitationen sker). `onInviteOwnAccount`
  // bruges ved en ældre profil, der er fyldt 18, til at invitere personen til en egen konto. `openPrivacy` åbner politikken.
  onInviteAdult, onInviteOwnAccount, inviteHint = "Du kan invitere personen under Familie, når din profil er oprettet.", openPrivacy,
}) => {
  const age = birthYear ? String(new Date().getFullYear() - parseInt(birthYear)) : "";
  // Børneprofil: 0-17 år. En ældre, allerede oprettet profil, der er fyldt 18, kan stadig redigeres (og får en overgangsnote), men en ny kan aldrig være 18+.
  const legacyAdult = editing && age !== "" && Number(age) >= 18;
  const ageOk = age !== "" && Number(age) >= 0 && (legacyAdult || Number(age) <= 17);
  const ageKnown = age !== "" && ageOk;
  const [adultTried, setAdultTried] = React.useState(false); // brugeren forsøgte at vælge 18 år eller derover
  const hasHealthData = ((allergens?.length || 0) + (customAllerg?.length || 0)) > 0;
  // Allergivalget skal være aktivt: mindst én allergi/intolerance ELLER et eksplicit "ingen". Ved redigering af et medlem
  // uden allergier tæller det som det eksplicitte valg. Formularen remountes pr. medlem (key), så startværdien er korrekt.
  const [noAllergies, setNoAllergies] = React.useState(editing && !hasHealthData);
  const [confirmNone, setConfirmNone] = React.useState(false);
  const allergyChoiceOk = hasHealthData || noAllergies;
  const isValid = name?.trim() && birthYear && ageOk && gender && allergyChoiceOk;
  // "Navn, alder og køn er obligatoriske"-teksten må først vises EFTER et
  // forsøgt tryk på "+ Tilføj familiemedlem", ikke proaktivt fra starten
  // (25. sept. 2026, brugerfeedback — samme princip som trin 1's
  // step1Attempted). Knappen har derfor bevidst IKKE det native
  // disabled-attribut (ville blokere selve klikket og dermed forsøget).
  const [attempted, setAttempted] = React.useState(false);
  // Samtykke (2. okt. 2026): en profil tilhører en ANDEN person, så kontoejeren bekræfter på dennes vegne (forælder/værge eller personens
  // eget samtykke), med tekst efter hvem oplysningerne vedrører, aldrig "mine". Kræves, før en NY profil med allergier gemmes. Ved
  // bekræftelsen logges kontoens helbredssamtykke (consent_log), hvis det ikke allerede findes.
  const consent = useHealthConsent();
  const [consentChecked, setConsentChecked] = React.useState(false);
  const memberConsent = memberConsentTexts({ name, age });
  const needsMemberConfirm = hasHealthData && !editing && ageKnown;
  const consentOk = !needsMemberConfirm || consentChecked;
  // E-numre skal være lukket som standard, ligesom trin 2 — ellers bliver
  // trin 4 unødigt langt for en valgfri funktion (25. sept. 2026,
  // brugerfeedback). Lokal state, da MemberForm er en selvstændig,
  // genbrugelig komponent uden adgang til onboardingens egen state.
  const [showENumre, setShowENumre] = React.useState(false);

  // Gluten ↔ Glutenfri-synkronisering — samme delte hook som onboarding og
  // ProfileScreen.jsx's "Rediger præferencer" bruger (28. sept. 2026,
  // Profil-restrukturering: én implementering af logikken i stedet for tre
  // kopier), så hovedprofil og familiemedlemmer ikke opfører sig forskelligt.
  const [glutenFreeAutoApplied, setGlutenFreeAutoApplied] = useGlutenFreeSync(allergens, diets, setDiets);

  return (
    <div>

      {/* Navn * */}
      <InputField label="Navn" required style={{ marginBottom:17 }}
        placeholder="Fx Mia" value={name} onChange={e => setName(e.target.value)} />

      {/* Alder * — vælger med 0-17 år (6. okt. 2026, Bjørn: "– | Vælg alder | +" uden startværdi var ikke intuitiv). Gemmes internt som
          fødselsår (birthYear-prop uændret). */}
      <div style={{ marginBottom:19 }}>
        <label className="field-lbl" htmlFor="member-age">Alder <span style={UI.red}>*</span></label>
        <AgeSelect id="member-age" value={age} max={17} onOverMax={legacyAdult ? undefined : () => setAdultTried(true)}
          onChange={a => { setAdultTried(false); setBirthYear(a ? String(new Date().getFullYear() - parseInt(a)) : ""); }} />
        {/* Kun børn under 18: forsøg på 18+ forklares og fører til invitation af en voksen. */}
        {adultTried && (
          <div role="note" style={{ marginTop:10, padding:"12px 14px", borderRadius:12, background:"var(--surface2)", border:"1px solid var(--border)" }}>
            <div style={{ fontSize:13, color:"var(--ink)", lineHeight:1.5 }}>Personer på 18 år eller derover skal have deres egen EatSafe-konto.</div>
            {onInviteAdult
              ? <SecondaryButton style={{ minHeight:44, marginTop:10 }} onClick={onInviteAdult}>Invitér til familien</SecondaryButton>
              : <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, marginTop:6 }}>{inviteHint}</div>}
          </div>
        )}
        {/* En profil, der er fyldt 18, skal over på en personlig konto (ingen blindgyde). */}
        {legacyAdult && (
          <div role="note" style={{ marginTop:10, padding:"12px 14px", borderRadius:12, background:"var(--surface2)", border:"1px solid var(--border)" }}>
            <div style={{ fontSize:13, color:"var(--ink)", lineHeight:1.5 }}>Denne profil skal nu overgå til en personlig EatSafe-konto.</div>
            {onInviteOwnAccount && <SecondaryButton style={{ minHeight:44, marginTop:10 }} onClick={onInviteOwnAccount}>Invitér til egen konto</SecondaryButton>}
          </div>
        )}
      </div>

      <>
      {/* Køn * — delt GenderPicker-komponent, samme fire valgmuligheder
          (inkl. "Vil ikke oplyse") som trin 1. */}
      <div style={{ marginBottom:17 }}>
        <label className="field-lbl">Køn <span style={UI.red}>*</span></label>
        <GenderPicker value={gender} onChange={setGender} />
      </div>

      {/* Allergier / intolerancer — delt AllergenChipPicker, samme som
          trin 2 (grøn valgt-state, allergi/intolerance-opdeling, ⓘ-note). */}
      <div className="card-lbl" style={UI.mb8}>Allergier / intolerancer</div>
      <AllergenChipPicker selected={allergens} onChange={arr => {
        setAllergens(arr);
        // Fjernes et allergen, fjernes dets sporvalg også (ingen skjulte værdier)
        if (setLevels) setLevels(pruneAllergenLevels(levels, arr));
        if (arr.length > 0) setNoAllergies(false);
      }} />

      {/* Skriv selv — samme delte felt som onboarding og Rediger præferencer */}
      <CustomAllergenField customAllerg={customAllerg} setCustomAllerg={setCustomAllerg} customInput={customInput} setCustomInput={setCustomInput}
        onChange={() => setNoAllergies(false)} />

      {/* Eksplicit "ingen": et medlem uden allergier skal vælges aktivt, så "glemt" og "ingen" ikke ligner hinanden. Vælges det,
          mens der allerede er valgt noget, spørger vi først, så profilen aldrig både har allergier og står som "ingen". */}
      {/* Neutral, når den ikke er valgt (6. okt. 2026, Bjørn): den må ikke ligne en aktiv, primær mulighed ved siden af valgte allergier.
          Gensidigt eksklusiv: et allergi- eller fritekstvalg fjerner markeringen, og "ingen" rydder alle valg (efter bekræftelse). */}
      <SecondaryButton active={noAllergies}
        style={{ marginTop:12, minHeight:44, ...(noAllergies ? {} : { color:"var(--ink2)", border:"1.5px solid var(--border2)", fontWeight:600 }) }}
        onClick={() => { if (noAllergies) setNoAllergies(false); else if (hasHealthData) setConfirmNone(true); else setNoAllergies(true); }}>
        Ingen allergier eller intolerancer
      </SecondaryButton>
      {confirmNone && (
        <ConfirmDialog title="Fjern de valgte allergier?"
          message="Du har allerede valgt allergier eller intolerancer. Hvis du fortsætter, bliver disse valg fjernet."
          confirmLabel="Ja, fjern valgene"
          onCancel={() => setConfirmNone(false)}
          onConfirm={() => { setAllergens([]); setCustomAllerg([]); setCustomInput(""); if (setLevels) setLevels({}); setNoAllergies(true); setConfirmNone(false); }} />
      )}

      {/* Spor af allergener — efter allergivalget, så rækkefølgen er Allergier → Spor → E-numre */}
      {setLevels && <AllergenSensitivity selected={allergens} levels={levels} onChange={setLevels} />}

      {/* Kostpræferencer — delt DietChipPicker, samme som trin 3 (grøn
          valgt-state, sidste-ulige-kort spænder hele bredden). */}
      {DIETS_ENABLED && (
        <>
          <div className="card-lbl" style={{ marginTop:16, marginBottom:8 }}>Kostpræferencer</div>
          <DietChipPicker selected={diets}
            autoNote={glutenFreeAutoApplied ? { id:"gluten-free", text:"Valgt ud fra gluten" } : undefined}
            onChange={arr => {
              if (arr.includes("gluten-free") !== diets.includes("gluten-free")) setGlutenFreeAutoApplied(false);
              setDiets(arr);
            }} />
        </>
      )}

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
          <span style={UI.red}>*</span> Navn, alder, køn og allergivalg er obligatoriske
        </div>
      )}

      {needsMemberConfirm && (
        <div style={{ marginTop:12 }}>
          <HealthConsentBox id="member-consent" checked={consentChecked} onChange={setConsentChecked} text={memberConsent.text} subText={memberConsent.sub} openPrivacy={openPrivacy} />
        </div>
      )}

      {/* Gem knap */}
      <PrimaryButton style={{ marginTop:12 }} softDisabled={!isValid || !consentOk}
        onClick={async () => {
          if (!isValid) { setAttempted(true); return; }
          if (!consentOk) return;
          try {
            if (needsMemberConfirm && !consent.given) await consent.give();
          } catch { showToast("Samtykket kunne ikke gemmes. Tjek din forbindelse og prøv igen.", "error"); return; }
          onAdd();
          setAttempted(false);
        }}>
        {addLabel || "+ Tilføj børneprofil"}
      </PrimaryButton>
      </>
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
      <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", display:"flex" }} aria-hidden="true"><Icon name="chevronDown" size={13} color="var(--muted)" /></div>
    </div>
  );
};

// ─── ALLERGEN UNDERKATEGORIER ────────────────────────────────────────────────

