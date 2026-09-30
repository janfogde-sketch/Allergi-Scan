// @ts-nocheck
import React, { useState } from "react";
import { SCREENS, SUPABASE_URL } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";
import { AgeStepper, GenderPicker } from "./FormFields.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { UI } from "./styleUtils.js";

// "Rediger profil" — KUN personlige konto-/profiloplysninger (28.
// sept. 2026, Profil-restrukturering, krav 1): navn, telefon,
// alder og køn. Alder/køn blev fjernet 28. sept. og er sat tilbage
// 30. sept. (Jans beslutning: de er obligatoriske i onboarding, så
// brugeren skal kunne rette dem). Ingen allergier/intolerancer/
// diæter/E-numre/husstand her — det er "Rediger præferencer".
// Udskilt fra ProfileScreen.jsx 30. sept. 2026 (arkitektur-audit A8).
export default function EditProfileScreen() {
  const { user, setUser, userId, accessToken } = useAuthContext();
  const { setScreen } = useNavigationContext();
  const [savingProfile, setSavingProfile] = useState(false);
  const editAgeNum = Number(user?.age);
  const editAgeOk = Number.isFinite(editAgeNum) && editAgeNum >= 1 && editAgeNum <= 120;

  return (
    <div className="screen fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 0 20px" }}>
        <div className="screen-title" style={{ textAlign:"left", width:"auto" }}>Rediger profil</div>
      </div>

      <div className="card" style={UI.mb10}>
        <div className="card-lbl">Personlige oplysninger</div>
        {[["Dit navn","text","Fx. Anna Hansen","name"],["Telefon","tel","+45 12 34 56 78","phone"]].map(([lbl,type,ph,key]) => (
          <div key={key} style={UI.mb10}>
            <label className="field-lbl">
              {lbl} {key==="name" && <span style={UI.red}>*</span>}
            </label>
            <input className="field" type={type} placeholder={ph} value={user[key]||""} onChange={e => setUser(u => ({ ...u, [key]: e.target.value }))} />
          </div>
        ))}
        {/* Alder og køn (30. sept. 2026, Jans punkt 4) — obligatoriske i
            onboarding, så brugeren skal også kunne rette dem bagefter.
            Samme delte AgeStepper/GenderPicker som onboarding trin 1. */}
        <div style={UI.mb10}>
          <label className="field-lbl">Alder <span style={UI.red}>*</span></label>
          <AgeStepper value={user.age} onChange={age => setUser(u => ({ ...u, age }))} />
          {!editAgeOk && String(user.age || "").trim() !== "" && (
            <div style={{ fontSize:11.5, color:"var(--red)", fontWeight:600, marginTop:6 }}>Angiv en alder mellem 1 og 120.</div>
          )}
        </div>
        <div style={UI.mb10}>
          <label className="field-lbl">Køn <span style={UI.red}>*</span></label>
          <GenderPicker value={user.gender} onChange={gender => setUser(u => ({ ...u, gender }))} />
        </div>
        {(!user.name?.trim() || !editAgeOk || !user.gender) && (
          <div style={UI.ufs11_cmuted_mb10}>
            <span style={UI.red}>*</span> Navn, alder og køn er obligatoriske
          </div>
        )}
      </div>

      <button className="btn btn-primary btn-full" style={UI.mb16}
        disabled={!user.name?.trim() || !editAgeOk || !user.gender || savingProfile}
        onClick={async () => {
          setSavingProfile(true);
          try {
            await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
              method:"PATCH",
              headers:{ ...makeHeaders(accessToken), "Prefer":"return=minimal" },
              body:JSON.stringify({
                name:user.name.trim(), phone:user.phone||null,
                // Gemmes som fødselsår, samme skema som onboarding.
                birth_year: new Date().getFullYear() - Number(user.age),
                gender: user.gender,
              }),
            });
            setUser(u => ({ ...u, name:(u.name || "").trim() }));
            setScreen(SCREENS.PROFILE);
          } catch (e) {
            showToast("Profilen kunne ikke gemmes. Tjek din forbindelse og prøv igen.", "error");
          } finally {
            setSavingProfile(false);
          }
        }}>{savingProfile ? "Gemmer…" : "Gem ændringer"}</button>
    </div>
  );
}
