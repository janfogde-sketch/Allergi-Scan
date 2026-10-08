// @ts-nocheck
import React from "react";
import { Icon } from "./SharedComponents.jsx";
import { AgeStepper, GenderPicker } from "./FormFields.jsx";
import { PrimaryButton, FormCard, InputField } from "./DesignSystem.jsx";
import { UI } from "./styleUtils.js";

export function makeRenderStep1(c) {
  const { isOAuth, loginEmail, saveProfileStep1, setOnboardStep, setStep1Attempted, setUser, step1Attempted, user } = c;

  const renderStep1 = () => {
    const nameOk = (user.name||"").trim().length > 0;
    const emailOk = (user.email||loginEmail||"").trim().length > 0;
    // Alder skal være et realistisk tal (1-120) — AgeStepper begrænser kun
    // +/-, ikke et tal der tastes direkte ind (fx "999").
    const ageNum = Number(user.age);
    const ageEntered = (user.age||"").toString().trim().length > 0;
    const ageOk = ageEntered && Number.isFinite(ageNum) && ageNum >= 1 && ageNum <= 120;
    const genderOk = !!(user.gender);
    // Telefon er fjernet fra onboarding (30. sept. 2026) — alder og køn er
    // fortsat obligatoriske (Jans beslutning, D2) og kan kun udfyldes her;
    // Rediger profil ændrer kun navnet.
    const allOk = nameOk && emailOk && ageOk && genderOk;
    const emailIsSaved = !!(loginEmail || isOAuth);
    return (
      <div className="fade-in">
        <div style={UI.mb14}>
          <div style={{ fontSize:19, fontWeight:900, color:"var(--ink)", marginBottom:4 }}>Hvem er du?</div>
          {/* Begge undertekster gjort en anelse mørkere (25. sept. 2026,
              opfølgning) — var hhv. --muted2 og --muted, lidt for lyse til
              at læse uden anstrengelse ved siden af de mørkere overskrifter.
              27. sept. 2026, "FINAL 10/10 POLISH": teksten omformuleret —
              "bruges til din personlige allergiprofil" antydede fejlagtigt
              at ALLE felter her (navn/telefon/alder/køn) er nødvendige for
              selve allergi-logikken, hvilket kun allergier/diæter reelt er
              (indsamlet på senere trin) — disse felter er kontooplysninger. */}
          <div style={{ ...UI.ufs13_cmuted2_lh15, color:"var(--ink2)" }}>Alder og køn bruges til at tilpasse tjenesten og forstå, hvem den bruges af.</div>
        </div>

        {/* Ekstra, blød hvid glød lige bag kortet (25. sept. 2026,
            opfølgning: "dæmp ingredienserne 5-10% lige bag formularen...
            kun så kortet står lidt renere") — lagt oven på .card's
            eksisterende var(--sh)-skygge, ikke en erstatning af den, og
            KUN på dette kort, ikke en ændring af den delte .card-klasse
            (brugt bredt andre steder i appen uden dette behov). */}
        <FormCard glow style={UI.mb12}>
          {/* Navn — kanten var rød fra allerførste render (25. sept. 2026,
              opfølgning: "rødlig kant selv om brugeren endnu ikke har gjort
              noget forkert"). Bug: user.name initialiseres til "" i
              App.jsx, ikke undefined, så `user.name !== undefined` var
              sandt med det samme — rød kant IKKE betinget af noget
              brugeren faktisk havde gjort. Erstattet med step1Attempted
              (samme gate som de felt-specifikke fejltekster nedenfor) —
              rød betyder nu kun "du prøvede at fortsætte, og dette felt
              mangler stadig". 27. sept. 2026: hver fejltekst er nu inline
              direkte under sit eget felt (i stedet for én samlet
              "Mangler: ..."-sætning nederst), samme mønster som Opret
              konto/Log ind-skærmens felt-fejl. */}
          <div style={{ marginBottom:17 }}>
            <InputField label="Fulde navn" required
              type="text" placeholder="Fx Anna Hansen"
              value={user.name||""} onChange={e => setUser(u => ({...u, name:e.target.value}))}
              error={step1Attempted && !nameOk} />
            {step1Attempted && !nameOk && (
              <div style={{ fontSize:11.5, color:"var(--red)", fontWeight:600, marginTop:5 }}>Indtast dit fulde navn.</div>
            )}
          </div>

          {/* E-mail — "Email" uden bindestreg blev tidligere brugt her,
              mens login/signup-skærmene konsekvent bruger "E-mail" (25.
              sept. 2026, opfølgning: terminologi-ensretning).
              27. sept. 2026, "FINAL 10/10 POLISH": den prefillede/read-only
              tilstand brugte tidligere kun `opacity:.6` — samme visuelle
              "dæmpet"-signal som et disabled/fejlramt felt ville have,
              præcis det brugeren bad om at undgå ("brugeren skal forstå at
              e-mailen er gemt, ikke at feltet er slået fra/i fejl").
              Erstattet med en let, positiv grøn baggrundstone (samme
              --green-lt/--green-mid-par som appens øvrige "gemt/aktiv"-
              tilstande) + fuld tekstkontrast (ingen opacity-dæmpning) + en
              tydelig undertekst. isOAuth-checkmarket er samtidig flyttet
              fra en rå inline-SVG til den delte Icon-komponent, og vises nu
              for BEGGE tilfælde (ikke kun OAuth), med hver sin præcise
              forklaringstekst. */}
          <div style={{ marginBottom:17 }}>
            <InputField label="E-mail" required
              type="email" placeholder="din@email.dk"
              value={user.email||loginEmail||""}
              onChange={e => setUser(u => ({...u, email:e.target.value}))}
              readOnly={emailIsSaved}
              inputStyle={emailIsSaved ? { background:"var(--green-lt)", borderColor:"var(--green-mid)", color:"var(--ink)", cursor:"default" } : undefined} />
            {emailIsSaved && (
              <div style={{ fontSize:10, color:"var(--green)", marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                <Icon name="check" size={10} color="var(--green)" />
                {isOAuth === "google" ? "Bekræftet via Google" : isOAuth === "facebook" ? "Bekræftet via Facebook" : isOAuth === "apple" ? "Bekræftet via Apple" : isOAuth ? "E-mail bekræftet" : "Allerede gemt fra din konto"}
              </div>
            )}
          </div>

          {/* Alder — delt AgeStepper-komponent (FormFields.jsx), også brugt
              af MemberForm.jsx (25. sept. 2026: familie-trinnet skal
              genbruge præcis samme komponent, ikke sit eget parallelle
              design). */}
          <div style={{ marginBottom:19 }}>
            <label className="field-lbl">Alder <span style={UI.red}>*</span></label>
            <AgeStepper value={user.age} onChange={age => setUser(u => ({...u, age}))} />
            {step1Attempted && !ageOk && (
              <div style={{ fontSize:11.5, color:"var(--red)", fontWeight:600, marginTop:6 }}>{ageEntered ? "Angiv en alder mellem 1 og 120." : "Angiv din alder."}</div>
            )}
          </div>

          {/* Køn — delt GenderPicker-komponent (FormFields.jsx), samme
              begrundelse som Alder ovenfor. */}
          <div>
            <label className="field-lbl">Køn <span style={UI.red}>*</span></label>
            <GenderPicker value={user.gender} onChange={gender => setUser(u => ({...u, gender}))} />
            {step1Attempted && !genderOk && (
              <div style={{ fontSize:11.5, color:"var(--red)", fontWeight:600, marginTop:8 }}>Vælg en mulighed.</div>
            )}
          </div>
        </FormCard>

        {/* Disabled-tilstanden bruger PrimaryButtons låste softDisabled-
            udseende (lys grøn baggrund + fuld-styrke grøn tekst, samme
            "lys baggrund, mørk tekst"-mønster som Køn-valgene ovenfor) i
            stedet for en gennemgående opacity-dæmpning, der gjorde hvid
            knap-tekst svær at læse. softDisabled (ikke disabled) holder
            knappen klikbar, så første forsøg stadig kan fanges og vise de
            felt-specifikke fejltekster ovenfor. */}
        <PrimaryButton
          softDisabled={!allOk}
          onClick={() => {
            if (!allOk) { setStep1Attempted(true); return; }
            saveProfileStep1().then(() => setOnboardStep(2));
          }}>
          Fortsæt →
        </PrimaryButton>
      </div>
    );
  };

  return renderStep1;
}
