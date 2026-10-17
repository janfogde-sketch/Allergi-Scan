// @ts-nocheck
import React, { useEffect, useMemo } from "react";
import { ALLERGENS, SCREENS } from "./constants.jsx";
import { allergenChoiceLabel, initials } from "./helpers.js";
import { Icon, AllergenGlyph } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";
import { computeScanStats } from "./profileStats.js";
import HistoryScreen from "./HistoryScreen.jsx";
import FavoritesScreen from "./FavoritesScreen.jsx";
import EditProfileScreen from "./EditProfileScreen.jsx";
import EditPreferencesScreen from "./EditPreferencesScreen.jsx";
import FamilyScreen from "./FamilyScreen.jsx";

// ProfileScreen viser Profil-siden og router til de fem profil-relaterede
// skærme (Historik, Favoritter, Rediger profil, Rediger præferencer,
// Familie), som indtil 30. sept. 2026 lå i denne fil (arkitektur-audit A8:
// én skærm = én fil). Komponenten forbliver mount'et, mens man skifter
// mellem dem, så det, der deles, bor her: husstanden (vises både på Profil
// og Familie), første hent af historikken og gluten↔glutenfri-
// synkroniseringen.

// ── Din aktivitet ─────────────────────────────────────────────────────────────
// Tre tal, ingen belønninger (streak og "dage i træk" er fjernet fra visningen, 17. okt. 2026, Bjørn). Definitionerne står i profileStats.js.
function StatCard({ icon, iconColor, value, label, big }) {
  return (
    <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, padding: big ? "12px 14px" : "10px 12px", display:"flex", alignItems:"center", gap:12, minWidth:0 }}>
      <Icon name={icon} size={big ? 20 : 18} color={iconColor} />
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize: big ? 26 : 22, fontWeight:800, color:"var(--ink)", lineHeight:1.1, letterSpacing:"-.3px" }}>{value}</div>
        <div style={{ fontSize:12, color:"var(--ink2)", fontWeight:500, marginTop:2, lineHeight:1.3, overflowWrap:"break-word" }}>{label}</div>
      </div>
    </div>
  );
}

function ActivityCard({ stats, setScreen, SCREENS }) {
  const more = stats.truncated ? "+" : "";
  return (
    <div style={{ ...CARD, boxShadow:"none" }}>
      <div style={{ ...UI.boldInk13, marginBottom:10 }}>Din aktivitet</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <StatCard big icon="search" iconColor="var(--green)" value={`${stats.total}${more}`} label="Scanninger i alt" />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:8 }}>
          <StatCard icon="warning" iconColor="var(--amber)" value={`${stats.withWarning}${more}`} label="Scanninger med advarsel" />
          <StatCard icon="check" iconColor="var(--green)" value={`${stats.withoutConflict}${more}`} label="Scanninger uden registrerede konflikter" />
        </div>
        {stats.truncated && <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.4 }}>Opgjort for dine seneste 50 scanninger og opslag.</div>}
        <button type="button" className="row-btn" onClick={() => setScreen(SCREENS.HISTORY)}
          style={{ minHeight:44, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
          <div style={UI.boldInk12}>Se fuld scanningshistorik</div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

// Præferencechips: samme størrelse, afstand og skrift; kun tonen skifter med typen.
const CHIP_TONES = {
  allergy:   { background:"var(--red-lt)",   color:"var(--red)",   borderColor:"var(--red-md)" },
  intolerance: { background:"var(--amber-lt)", color:"var(--amber)", borderColor:"var(--amber-md)" },
  enumber:   { background:"var(--blue-lt)",  color:"var(--blue)",  borderColor:"var(--blue-md)" },
  custom:    { background:"var(--surface2)", color:"var(--ink2)",  borderColor:"var(--border2)" },
};
function PrefGroup({ label, children }) {
  return (
    <div style={{ marginTop:10 }}>
      <div style={{ ...UI.sectionLbl4Ink, marginBottom:6 }}>{label}</div>
      <div className="tags">{children}</div>
    </div>
  );
}
const PrefChip = ({ tone, icon, children }) => (
  <div className="tag" style={CHIP_TONES[tone]}>{icon} {children}</div>
);

const CARD = { ...UI.ubgsurface_bd1pxsolid_br14_p14px16px_mb10, marginBottom:8 };

export default function ProfileScreen({
  customInput, setCustomInput,
  lookupProduct, onScanNow,
}) {
  const { user, setUser, userId, accessToken, loginEmail } = useAuthContext();
  const { allergens, customAllerg, family, scanFamily, activeProfiles, household, setHousehold, householdLoading, loadHousehold } = useProfileContext();
  const { screen, setScreen, openLegal } = useNavigationContext();
  const { history, loadHistory } = useHistoryContext();
  const { selectedENumbers } = useAllergenPrefsContext();
  // Husstanden (rigtige konti) hentes nu i App.jsx (useHousehold, 1. okt. 2026), så den også kan
  // vælges som profil ved scanning m.m. — her læses den kun fra ProfileContext.

  // Historik hentes ved allerførste mount (Profil/Favoritter læser også
  // `history`, fx GamificationCard/"Senest scannet", uden selv at besøge
  // Historik-fanen) — uden dette viser de 0 scanninger indtil et separat
  // besøg på Historik tilfældigvis trigger et hent.
  useEffect(() => {
    if (userId && accessToken) loadHistory("own"); // tallene her gælder altid brugerens egne scanninger, også efter familievisning i Historik
  }, [userId, accessToken, loadHistory]);

  const stats = useMemo(
    () => computeScanStats(history, { user, family: scanFamily, allergens, customAllerg, selectedENumbers, activeProfiles }),
    [history, user, scanFamily, allergens, customAllerg, selectedENumbers, activeProfiles]
  );

  if (screen === SCREENS.HISTORY) return <HistoryScreen household={household} lookupProduct={lookupProduct} onScanNow={onScanNow} />;
  if (screen === SCREENS.FAVORITES) return <FavoritesScreen household={household} lookupProduct={lookupProduct} />;
  if (screen === SCREENS.EDITPROFILE) return <EditProfileScreen />;
  if (screen === SCREENS.EDITPREFERENCES) {
    return (
      <EditPreferencesScreen
        customInput={customInput} setCustomInput={setCustomInput}
      />
    );
  }
  if (screen === SCREENS.FAMILY) return <FamilyScreen household={household} setHousehold={setHousehold} loadHousehold={loadHousehold} />;
  if (screen !== SCREENS.PROFILE) return null;

  // Præferencerne grupperes efter den faktiske type: intolerancer og medicinske tilstande (fx cøliaki) for sig, resten er allergier.
  const allergenIds = allergens.filter(id => ALLERGENS.some(a => a.id === id));
  const allergyList = allergenIds.map(id => ALLERGENS.find(a => a.id === id)).filter(a => a && a.type !== "intolerance");
  const intoleranceList = allergenIds.map(id => ALLERGENS.find(a => a.id === id)).filter(a => a && a.type === "intolerance");

  return (
      <div className="screen fade-in">

        {/* Profilkort: kompakt, initialer til venstre, navn og e-mail, Rediger til højre */}
        <div style={{ ...CARD, background:"var(--surface2)", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:800, color:"var(--on-green)", flexShrink:0 }}>
            {initials(user.name||"?")}
          </div>
          <div style={{ ...UI.flex1, minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)", letterSpacing:"-.3px", lineHeight:1.2, overflowWrap:"break-word" }}>{user.name||"Din profil"}</div>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, overflowWrap:"anywhere" }}>{user.email||loginEmail||""}</div>
          </div>
          <button type="button" className="btn btn-outline btn-sm" style={{ flexShrink:0 }} onClick={() => setScreen(SCREENS.EDITPROFILE)}>Rediger</button>
        </div>

        {/* Mine præferencer: sikkerhedskritisk, driver appens allergitjek. Kun grupper med valg vises, og alt kommer fra brugerens faktiske valg. */}
        <div style={{ ...CARD, boxShadow:"var(--sh2)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
            <div style={UI.boldInk13}>Mine præferencer</div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setScreen(SCREENS.EDITPREFERENCES)}>Rediger</button>
          </div>
          {allergenIds.length + customAllerg.length + (selectedENumbers?.length || 0) === 0
            ? (
              <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10 }}>
                <Icon name="info" size={18} color="var(--muted)" />
                <div style={{ fontSize:13, color:"var(--ink2)", lineHeight:1.45 }}>Du har ikke valgt nogen fødevarehensyn endnu. Tilføj dem, så EatSafe kan vurdere produkter for dig.</div>
              </div>
            )
            : (
              <>
                {allergyList.length > 0 && (
                  <PrefGroup label="Allergier">
                    {allergyList.map(a => <PrefChip key={a.id} tone="allergy" icon={<AllergenGlyph a={a} size={11} />}>{allergenChoiceLabel(a)}</PrefChip>)}
                  </PrefGroup>
                )}
                {intoleranceList.length > 0 && (
                  <PrefGroup label="Intolerancer og tilstande">
                    {intoleranceList.map(a => <PrefChip key={a.id} tone="intolerance" icon={<AllergenGlyph a={a} size={11} />}>{allergenChoiceLabel(a)}</PrefChip>)}
                  </PrefGroup>
                )}
                {selectedENumbers && selectedENumbers.length > 0 && (
                  <PrefGroup label="Overvågede E-numre">
                    {selectedENumbers.map((e,i) => <PrefChip key={`${e}-${i}`} tone="enumber" icon={<Icon name="hash" size={11} color="var(--blue)" />}>{e}</PrefChip>)}
                  </PrefGroup>
                )}
                {customAllerg.length > 0 && (
                  <PrefGroup label="Øvrige valg">
                    {customAllerg.map((c,i) => <PrefChip key={`${c}-${i}`} tone="custom" icon={<Icon name="edit" size={11} color="var(--ink2)" />}>{c}</PrefChip>)}
                  </PrefGroup>
                )}
              </>
            )
          }
        </div>

        {/* Familie: kun en genvej til den eksisterende Familie-side, ingen duplikeret administration. Tæller både administrerede profiler og husstandskonti. */}
        <button type="button" className="row-btn" onClick={() => setScreen(SCREENS.FAMILY)}
          style={{ ...CARD, width:"100%", minHeight:44, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, cursor:"pointer", textAlign:"left", fontFamily:"var(--f)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
            <Icon name="family" size={16} color="var(--ink)" />
            <div style={{ minWidth:0 }}>
              <div style={UI.boldInk13}>Familie</div>
              <div style={UI.muted11mt2}>
                {householdLoading
                  ? "Henter…"
                  : (family.length + household.length) === 0
                    ? "Ingen i familien endnu"
                    : `${family.length + household.length} ${family.length + household.length === 1 ? "person" : "personer"}`}
              </div>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0 }} aria-hidden="true"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
        </button>

        <ActivityCard stats={stats} setScreen={setScreen} SCREENS={SCREENS} />

        {/* Konto, Push-notifikationer og Notifikations-kategorier er
            flyttet til SettingsScreen.jsx (26. sept. 2026, bruger-
            feedback: "Indstillinger mangler i menuen") — nås nu via
            ProfileMenu.jsx's "Indstillinger", ikke længere herfra. */}

        {/* Footer: diskret. Bunden friholdes for den faste bundnavigation (ca. 77 px + safe area) af .screen og denne bund-padding. */}
        <div style={{ marginTop:16, paddingBottom:"calc(64px + env(safe-area-inset-bottom))", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
          <a href="mailto:hej@eatsafe.dk"
            style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, minHeight:44, padding:"0 12px", fontSize:12, fontWeight:600, color:"var(--muted)", textDecoration:"none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,12 2,6"/>
            </svg>
            hej@eatsafe.dk
          </a>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:11, color:"var(--muted)" }}>
            <button type="button" onClick={() => openLegal(SCREENS.PRIVACY)}
              style={{ background:"none", border:"none", minHeight:44, padding:"0 8px", font:"inherit", color:"var(--muted)", textDecoration:"underline", textUnderlineOffset:3, cursor:"pointer" }}>
              Privatlivspolitik
            </button>
            <span aria-hidden="true">·</span>
            <span>EatSafe Beta</span>
          </div>
        </div>

      </div>
  );
}
