// @ts-nocheck
import React, { useState } from "react";
import { SCREENS, SUPABASE_URL } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { UI } from "./styleUtils.js";

// "Rediger profil" — kun navnet kan ændres (30. sept. 2026, Bjørns
// beslutning; erstatter Jans punkt 4 om alder/køn her). Alder og køn
// udfyldes i onboarding og bliver gemt, men redigeres ikke bagefter.
// Telefon indsamles ikke længere. Allergier/intolerancer/diæter/E-numre
// er "Rediger præferencer". Udskilt fra ProfileScreen.jsx 30. sept. 2026
// (arkitektur-audit A8).
export default function EditProfileScreen() {
  const { user, setUser, userId, accessToken } = useAuthContext();
  const { setScreen } = useNavigationContext();
  const [savingProfile, setSavingProfile] = useState(false);
  const nameOk = !!user.name?.trim();

  return (
    <div className="screen fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 0 20px" }}>
        <div className="screen-title" style={{ textAlign:"left", width:"auto" }}>Rediger profil</div>
      </div>

      <div className="card" style={UI.mb10}>
        <div className="card-lbl">Personlige oplysninger</div>
        <div style={UI.mb10}>
          <label className="field-lbl" htmlFor="edit-name">Dit navn <span style={UI.red}>*</span></label>
          <input id="edit-name" className="field" type="text" autoComplete="name" placeholder="Fx. Anna Hansen" value={user.name||""}
            onChange={e => setUser(u => ({ ...u, name: e.target.value }))} />
        </div>
        {!nameOk && (
          <div style={UI.ufs11_cmuted_mb10}>
            <span style={UI.red}>*</span> Navn er obligatorisk
          </div>
        )}
      </div>

      <button className="btn btn-primary btn-full" style={UI.mb16}
        disabled={!nameOk || savingProfile}
        onClick={async () => {
          setSavingProfile(true);
          try {
            await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
              method:"PATCH",
              headers:{ ...makeHeaders(accessToken), "Prefer":"return=minimal" },
              body:JSON.stringify({ name:user.name.trim() }),
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
