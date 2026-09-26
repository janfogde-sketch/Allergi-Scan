// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// SettingsScreen.jsx
// Oprindeligt en ny, selvstændig skærm (26. sept. 2026, brugerfeedback:
// "Indstillinger mangler i menuen"). Overhalet 28. sept. 2026 ("FORBEDR
// INDSTILLINGER I EATSAFE") til seks logiske sektioner (Konto/Sprog/Scanning/
// Notifikationer/Privatliv & data/Om EatSafe) — samme visuelle stil (kort,
// toggles, farver) som resten af appen, ingen nye designtokens. Genbruger
// eksisterende state/hooks/UI-mønstre fra andre skærme i stedet for at
// opfinde nye (Madpas-sprogvælgeren er en 1:1-genbrug af MadpasScreen.jsx's
// egen `.mp-lang-*`-dropdown/-liste, konto-slet-flowet er uændret, kun
// flyttet hertil).
//
// Bevidst UDELADT (se begrundelse i hvert punkt nedenfor, ikke bare glemt):
// - "App-sprog": EatSafes UI har intet i18n-system — al tekst er hardkodet
//   dansk i hver skærms JSX. Kun Madpas har reel sprog-understøttelse
//   (MADPAS_LANGUAGES + oversatte tekst-tabeller i constants.jsx). Et
//   "App-sprog"-valg ville derfor være en toggle der ikke ændrer nogen
//   reel funktion — præcis det antimønster resten af denne skærms egen
//   opgave beder om at undgå.
// - "Åbn resultat automatisk efter scanning": scan-flowet
//   (runLookupProduct i useProduct.js) navigerer ALTID direkte til
//   SCREENS.RESULT efter et opslag — der findes ingen manuel/udskudt
//   visnings-tilstand at slå til/fra, så en sådan toggle ville heller
//   ikke styre noget reelt.
// - "Eksportér mine data": ingen eksisterende Edge Function/RPC
//   understøtter en data-eksport endnu.
// - "Vilkår": ingen selvstændig vilkårs-side findes i public/ (kun
//   privacy.html) — samme velkendte begrænsning som OnboardingScreen.jsx
//   allerede dokumenterer for sin egen "Handelsbetingelser"-tekst.
// - En "Åbn Indstillinger"-genvej ved afvist push-tilladelse: der findes
//   ingen cross-browser JS-API til at åbne systemets/browserens egne
//   indstillinger fra en PWA — den eksisterende tekstforklaring
//   ("Aktivér push i din browsers indstillinger") er den ærlige erstatning.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { Icon } from "./SharedComponents.jsx";
import { usePush } from "./usePush.js";
import { useNotificationPrefs } from "./useNotificationPrefs.js";
import { useAuthContext } from "./AuthContext.jsx";
import { MADPAS_LANGUAGES } from "./constants.jsx";
import { formatBuildTime, COMMIT_SHA } from "./utils.jsx";

// ── Lokale rækkekomponenter ──────────────────────────────────────────────────
// Kun brugt i denne skærm (8+ ensartede rækker på tværs af seks kort) —
// samme "lokal helper i skærmens egen fil"-mønster som ProfileScreen.jsx's
// GamificationCard, ikke en ny delt fil, da ingen anden skærm har brug for dem.

function BigToggle({ on, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        width:48, height:28, borderRadius:14, border:"none", cursor: disabled ? "default" : "pointer",
        background: on ? "var(--green)" : "var(--border2)",
        position:"relative", transition:"background .2s", flexShrink:0,
        opacity: disabled ? 0.5 : 1,
      }}>
      <div style={{
        width:22, height:22, borderRadius:"50%", background:"var(--ink)",
        position:"absolute", top:3, left: on ? 23 : 3,
        transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.3)",
      }} />
    </button>
  );
}

function SmallToggle({ on, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-pressed={on}
      style={{
        width:36, height:20, borderRadius:10, border:"none", cursor: disabled ? "default" : "pointer",
        background: on ? "var(--green)" : "var(--border2)",
        position:"relative", transition:"background .2s", flexShrink:0,
        opacity: disabled ? 0.4 : 1,
      }}>
      <div style={{
        width:16, height:16, borderRadius:"50%", background:"var(--ink)",
        position:"absolute", top:2, left: on ? 18 : 2,
        transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.3)",
      }} />
    </button>
  );
}

// On/off-række — Vibration/Lyd/Push-notifikationer.
function ToggleRow({ label, sub, note, on, onToggle, disabled, last }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div style={{ flex:1, minWidth:0, paddingRight:12 }}>
        <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink)" }}>{label}</div>
        {sub && <div style={{ fontSize:10.5, color:"var(--muted)", lineHeight:1.4, marginTop:2 }}>{sub}</div>}
        {note && <div style={{ marginTop:6, fontSize:11, color:"var(--amber)", background:"var(--amber-lt)", borderRadius:8, padding:"6px 10px" }}>{note}</div>}
      </div>
      <BigToggle on={on} onClick={onToggle} disabled={disabled} />
    </div>
  );
}

// Navigations-/valg-række (chevron) — Sprog-værdi, Privatlivspolitik, Data,
// Kontakt/feedback, Beta-info, Version. Uden `onClick` bliver den en ren
// info-linje (ingen chevron, ikke klikbar) — bruges til "Version".
function ChevronRow({ icon, label, sub, value, onClick, last, danger }) {
  return (
    <div onClick={onClick}
      style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"12px 0", borderBottom: last ? "none" : "1px solid var(--border)", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
        {icon && <Icon name={icon} size={15} color={danger ? "var(--red)" : "var(--ink2)"} />}
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:12.5, fontWeight:700, color: danger ? "var(--red)" : "var(--ink)" }}>{label}</div>
          {sub && <div style={{ fontSize:10.5, color:"var(--muted)", lineHeight:1.4, marginTop:2 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
        {value && <span style={{ fontSize:12, color:"var(--muted)", fontWeight:600 }}>{value}</span>}
        {onClick && <Icon name="chevronRight" size={14} color="var(--muted)" />}
      </div>
    </div>
  );
}

// Samme dataliste som DeleteAccountModal.jsx's "FØLGENDE DATA SLETTES" —
// bevidst dupliceret her (begge er små, statiske arrays, samme mønster som
// andre små inline-lister i appen) i stedet for en fælles fil for to
// brugssteder.
const ACCOUNT_DATA_CATEGORIES = ["Din profil og login", "Allergier og præferencer", "Familiemedlemmer", "Scanningshistorik", "Indkøbslister", "Feedback og tickets"];

export default function SettingsScreen({
  setShowDeleteAccount, setDeleteConfirmText,
  madpasLang, setMadpasLang,
  vibrateOnWarning, setVibrateOnWarning,
  soundOnWarning, setSoundOnWarning,
  onOpenFeedback, onOpenBetaInfo,
}) {
  const { accessToken, userId, clearAuth } = useAuthContext();

  // ── Push-notifikationer (hooks skal være på komponent-niveau) ────────────────
  const { supported: pushSupported, permission: pushPermission, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePush();
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState(pushPermission);

  // ── Notifikations-kategorier (hvilke typer, via hvilke kanaler) ──────────────
  const { prefs: notifPrefs, savingKeys: notifSavingKeys, setPref: setNotifPref, categories: notifCategories } = useNotificationPrefs({ accessToken, userId });

  const [langOpen, setLangOpen] = useState(false);
  const [showDataInfo, setShowDataInfo] = useState(false);

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

  // Scanning-toggles — localStorage er kilden til sandhed (samme mønster
  // som madpasCrossContact), App.jsx-state opdateres for at holde den
  // aktive scan-pipeline (useProduct.js) i sync uden en genindlæsning.
  const toggleVibrate = () => {
    const next = !vibrateOnWarning;
    setVibrateOnWarning(next);
    try { localStorage.setItem("as_vibrate_on_warning", next ? "1" : "0"); } catch { /* ignoreres */ }
  };
  const toggleSound = () => {
    const next = !soundOnWarning;
    setSoundOnWarning(next);
    try { localStorage.setItem("as_sound_on_warning", next ? "1" : "0"); } catch { /* ignoreres */ }
  };

  const currentLang = MADPAS_LANGUAGES.find(l => l.code === madpasLang);
  const pushDenied = pushStatus === "denied";
  // Kun PUSH-kolonnen i notifikations-gridet skal reagere på system-
  // tilladelsen — Mail-kolonnen er uafhængig af browserens push-tilladelse
  // og skal forblive fuldt funktionel uanset pushStatus.
  const pushChannelUsable = pushStatus === "granted";

  return (
    <div className="screen fade-in">
      <div className="screen-title">Indstillinger</div>

      {/* ── Konto ── */}
      <div className="card">
        <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:12 }}>Konto</div>
        <button onClick={clearAuth}
          style={{ width:"100%", padding:"12px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:10, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--ink)", cursor:"pointer" }}>
          Log ud
        </button>
      </div>

      {/* ── Sprog ── */}
      <div className="card">
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:14, fontWeight:800, color:"var(--ink)", marginBottom:10 }}>
          <Icon name="globe" size={14} color="var(--ink)" /> Sprog
        </div>
        <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>Standard-sprog til Madpas</div>
        <div style={{ fontSize:10.5, color:"var(--muted)", lineHeight:1.4, marginBottom:10 }}>
          Sproget dit madpas åbner i, medmindre du vælger et andet direkte på Madpas-siden.
        </div>
        {!langOpen ? (
          <div className="mp-lang-dropdown" onClick={() => setLangOpen(true)}>
            <span className="mp-lang-flag">{currentLang?.flag || "🌍"}</span>
            <span className="mp-lang-name">{currentLang?.name || "English"}</span>
            <span className="mp-lang-arrow">▾</span>
          </div>
        ) : (
          <div className="mp-lang-list">
            {MADPAS_LANGUAGES.map(l => (
              <div key={l.code} className={`mp-lang-opt${madpasLang===l.code?" on":""}`}
                onClick={() => { setMadpasLang(l.code); try { localStorage.setItem("as_madpas_lang", l.code); } catch { /* ignoreres */ } setLangOpen(false); }}>
                <span style={{ fontSize:20 }}>{l.flag}</span>
                <span style={{ fontSize:14, fontWeight:madpasLang===l.code?800:600, color:madpasLang===l.code?"var(--green)":"var(--ink)" }}>{l.name}</span>
                {madpasLang===l.code && <span style={{ marginLeft:"auto", display:"flex" }}><Icon name="check" size={13} color="var(--green)" /></span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Scanning ── */}
      <div className="card">
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:14, fontWeight:800, color:"var(--ink)", marginBottom:2 }}>
          <Icon name="scanframe" size={14} color="var(--ink)" /> Scanning
        </div>
        <ToggleRow label="Vibration ved advarsel" sub="Kort vibration når et scannet produkt matcher en allergi" on={vibrateOnWarning} onToggle={toggleVibrate} />
        <ToggleRow label="Lyd ved advarsel" sub="Kort lyd når et scannet produkt matcher en allergi" on={soundOnWarning} onToggle={toggleSound} last />
      </div>

      {/* ── Notifikationer ── */}
      <div className="card">
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:14, fontWeight:800, color:"var(--ink)", marginBottom:2 }}>
          <Icon name="bell" size={14} color="var(--ink)" /> Notifikationer
        </div>

        {pushSupported && (
          <ToggleRow
            label="Push-notifikationer"
            sub={pushStatus === "granted"
              ? "Aktiveret i denne browser"
              : pushStatus === "denied"
              ? "Blokeret i browserindstillinger"
              : "Skal aktiveres, før push-beskeder kan sendes"}
            note={pushDenied ? "Aktivér push i din browsers indstillinger." : null}
            on={pushStatus === "granted"}
            onToggle={pushDenied ? undefined : handlePushToggle}
            disabled={pushLoading || pushDenied}
          />
        )}

        <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5, margin:"12px 0 8px" }}>
          Vælg hvilke beskeder du vil have, og om de skal komme som push, e-mail — eller begge dele.
        </div>

        {pushSupported && !pushChannelUsable && (
          <div style={{ fontSize:10.5, color:"var(--muted)", marginBottom:8, fontStyle:"italic" }}>
            Push kræver at push-notifikationer er slået til ovenfor.
          </div>
        )}

        {/* Fælles kolonneheader — erstatter tidligere PUSH/MAIL-labels
            gentaget på hver enkelt række. */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>
          <div style={{ flex:1 }} />
          <div style={{ display:"flex", gap:12, flexShrink:0 }}>
            {["Push", "E-mail"].map(label => (
              <div key={label} style={{ width:36, textAlign:"center", fontSize:9, fontWeight:700, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:.3 }}>{label}</div>
            ))}
          </div>
        </div>

        <div>
          {notifCategories.map((cat, i) => (
            <div key={cat.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"12px 0", borderBottom: i === notifCategories.length - 1 ? "none" : "1px solid var(--border)" }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink)" }}>{cat.label}</div>
                <div style={{ fontSize:10.5, color:"var(--muted)", lineHeight:1.4, marginTop:2 }}>{cat.description}</div>
              </div>
              <div style={{ display:"flex", gap:12, flexShrink:0 }}>
                {[{ ch:"push", label:"Push" }, { ch:"email", label:"E-mail" }].map(({ ch, label }) => {
                  const key = `${cat.id}:${ch}`;
                  const on = notifPrefs[key] !== false;
                  const busy = !!notifSavingKeys[key];
                  const channelDisabled = ch === "push" && !pushChannelUsable;
                  return (
                    <div key={ch} style={{ width:36, display:"flex", justifyContent:"center" }}>
                      <SmallToggle
                        on={channelDisabled ? false : on}
                        onClick={() => setNotifPref(cat.id, ch, !on)}
                        disabled={busy || channelDisabled}
                        aria-label={`${label}-notifikation for ${cat.label}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Privatliv & data ── */}
      <div className="card">
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:14, fontWeight:800, color:"var(--ink)", marginBottom:2 }}>
          <Icon name="shield" size={14} color="var(--ink)" /> Privatliv & data
        </div>
        <ChevronRow icon="file" label="Privatlivspolitik"
          onClick={() => window.open("https://eatsafe.dk/privacy", "_blank", "noopener,noreferrer")} />
        <ChevronRow icon="info" label="Hvilke data EatSafe gemmer"
          onClick={() => setShowDataInfo(v => !v)} last={!showDataInfo} />
        {showDataInfo && (
          <div style={{ background:"var(--surface2)", borderRadius:10, padding:"10px 12px", margin:"0 0 12px" }}>
            {ACCOUNT_DATA_CATEGORIES.map(item => (
              <div key={item} style={{ fontSize:11.5, color:"var(--ink2)", padding:"3px 0", display:"flex", alignItems:"center", gap:8 }}>
                <Icon name="check" size={10} color="var(--muted)" /><span>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Farezone — visuelt adskilt fra almindelige konto-/privacy-
            handlinger ovenfor, ikke en ligeværdig knap blandt dem.
            Bekræftelses-trinnet ("skriv 'slet'") ligger i den delte
            DeleteAccountModal.jsx, uændret. */}
        <div style={{ paddingTop:14, borderTop:"1px solid var(--border)" }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:"var(--muted)", marginBottom:10 }}>Farezone</div>
          <button onClick={() => { setShowDeleteAccount(true); setDeleteConfirmText(""); }}
            style={{ background:"none", border:"none", padding:0, fontFamily:"var(--f)", fontSize:12.5, fontWeight:700, color:"var(--red)", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            <Icon name="trash" size={13} color="var(--red)" /> Slet konto
          </button>
        </div>
      </div>

      {/* ── Om EatSafe ── */}
      <div className="card">
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:14, fontWeight:800, color:"var(--ink)", marginBottom:2 }}>
          <Icon name="info" size={14} color="var(--ink)" /> Om EatSafe
        </div>
        <ChevronRow icon="clock" label="Version" sub={`Bygget ${formatBuildTime()} · ${COMMIT_SHA}`} />
        <ChevronRow icon="bug" label="Om EatSafe Beta" sub="Se velkomst- og sikkerhedsinformation igen" onClick={onOpenBetaInfo} />
        <ChevronRow icon="message" label="Kontakt & feedback" onClick={onOpenFeedback} last />
      </div>
    </div>
  );
}
