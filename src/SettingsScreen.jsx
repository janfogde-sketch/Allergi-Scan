// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// SettingsScreen.jsx
// Ny, selvstændig skærm (26. sept. 2026, brugerfeedback: "Indstillinger
// mangler i menuen — den bør være her hvis I har eller får funktioner som
// notifikationer, sprog, konto, app-præferencer"). Notifikations- og konto-
// indholdet FLYTTET herind fra ProfileScreen.jsx (var tidligere en del af
// profilsiden) — samme hooks/handlers, ingen ny funktionalitet opfundet.
// ProfileScreen.jsx er urørt bortset fra at disse tre kort er fjernet
// derfra, så de ikke findes to steder.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { Icon } from "./SharedComponents.jsx";
import { usePush } from "./usePush.js";
import { useNotificationPrefs } from "./useNotificationPrefs.js";
import { useAuthContext } from "./AuthContext.jsx";
import { UI } from "./styleUtils.js";

export default function SettingsScreen({ setShowDeleteAccount, setDeleteConfirmText }) {
  const { accessToken, userId, clearAuth } = useAuthContext();

  // ── Push-notifikationer (hooks skal være på komponent-niveau) ────────────────
  const { supported: pushSupported, permission: pushPermission, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePush();
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState(pushPermission);

  // ── Notifikations-kategorier (hvilke typer, via hvilke kanaler) ──────────────
  const { prefs: notifPrefs, savingKeys: notifSavingKeys, setPref: setNotifPref, categories: notifCategories } = useNotificationPrefs({ accessToken, userId });

  const handlePushToggle = async () => {
    setPushLoading(true);
    if (pushStatus === "granted") {
      await pushUnsubscribe(accessToken);
      setPushStatus("default");
    } else {
      const result = await pushSubscribe(accessToken);
      setPushStatus(result.ok ? "granted" : "denied");
    }
    setPushLoading(false);
  };

  return (
    <div className="screen fade-in">
      <div className="screen-title">Indstillinger</div>

      {/* Konto */}
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", boxShadow:"var(--sh)", marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:12 }}>Konto</div>
        <div style={UI.rowGap8}>
          <button onClick={clearAuth}
            style={{ flex:1, padding:"12px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:10, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--ink)", cursor:"pointer" }}>
            Log ud
          </button>
          <button onClick={() => { setShowDeleteAccount(true); setDeleteConfirmText(""); }}
            style={{ flex:1, padding:"12px", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--red)", cursor:"pointer" }}>
            Slet konto
          </button>
        </div>
      </div>

      {/* ── Notifikationer ── (26. sept. 2026, opfølgning: den tidligere
          separate "Push-notifikationer"-kort er slået sammen med dette,
          som første række, i stedet for at være et selvstændigt kort —
          ét kort i stedet for to reducerer skærmens samlede højde/antal
          adskilte bokse, så Indstillinger matcher den nyligt oprydede,
          rolige menu i stedet for at føles overfyldt. Samme
          hooks/handlers, ingen funktionalitet ændret.) */}
      <div className="card" style={UI.mb12}>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:14, fontWeight:800, color:"var(--ink)", marginBottom:2 }}>
          <Icon name="bell" size={14} color="var(--ink)" /> Notifikationer
        </div>

        {pushSupported && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", marginTop:6, borderBottom:"1px solid var(--border)" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink)" }}>Push-tilladelse</div>
              <div style={{ fontSize:10.5, color:"var(--muted)", lineHeight:1.4 }}>
                {pushStatus === "granted"
                  ? "Aktiveret i denne browser"
                  : pushStatus === "denied"
                  ? "Blokeret i browserindstillinger"
                  : "Skal aktiveres, før push-beskeder kan sendes"}
              </div>
              {pushStatus === "denied" && (
                <div style={{ marginTop:6, fontSize:11, color:"var(--amber)", background:"var(--amber-lt)", borderRadius:8, padding:"6px 10px" }}>
                  Aktivér push i din browsers indstillinger.
                </div>
              )}
            </div>
            {pushStatus !== "denied" && (
              <button onClick={handlePushToggle} disabled={pushLoading}
                style={{
                  width:48, height:28, borderRadius:14, border:"none", cursor:"pointer",
                  background: pushStatus === "granted" ? "var(--green)" : "var(--border2)",
                  position:"relative", transition:"background .2s", flexShrink:0,
                  opacity: pushLoading ? 0.6 : 1,
                }}>
                <div style={{
                  width:22, height:22, borderRadius:"50%", background:"var(--ink)",
                  position:"absolute", top:3,
                  left: pushStatus === "granted" ? 23 : 3,
                  transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.3)"
                }} />
              </button>
            )}
          </div>
        )}

        <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5, margin:"12px 0" }}>
          Vælg hvilke beskeder du vil have, og om de skal komme som push, email — eller begge dele.
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {notifCategories.map(cat => (
            <div key={cat.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink)" }}>{cat.label}</div>
                <div style={{ fontSize:10.5, color:"var(--muted)", lineHeight:1.4 }}>{cat.description}</div>
              </div>
              <div style={{ display:"flex", gap:12, flexShrink:0 }}>
                {[{ ch:"push", label:"Push" }, { ch:"email", label:"Mail" }].map(({ ch, label }) => {
                  const key = `${cat.id}:${ch}`;
                  const on = notifPrefs[key] !== false;
                  const busy = !!notifSavingKeys[key];
                  return (
                    <div key={ch} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                      <div style={{ fontSize:9, fontWeight:700, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:.3 }}>{label}</div>
                      <button
                        onClick={() => setNotifPref(cat.id, ch, !on)}
                        disabled={busy}
                        aria-label={`${label}-notifikation for ${cat.label}`}
                        style={{
                          width:36, height:20, borderRadius:10, border:"none", cursor:"pointer",
                          background: on ? "var(--green)" : "var(--border2)",
                          position:"relative", transition:"background .2s", flexShrink:0,
                          opacity: busy ? 0.6 : 1,
                        }}>
                        <div style={{
                          width:16, height:16, borderRadius:"50%", background:"var(--ink)",
                          position:"absolute", top:2,
                          left: on ? 18 : 2,
                          transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.3)"
                        }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
