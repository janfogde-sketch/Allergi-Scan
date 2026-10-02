// @ts-nocheck
import React, { useEffect } from "react";
import { ALLERGENS, SCREENS, DIETS, DIETS_ENABLED } from "./constants.jsx";
import { allergenChoiceLabel, initials, visibleDiets } from "./helpers.js";
import { Icon, AllergenGlyph } from "./SharedComponents.jsx";
import { useGlutenFreeSync } from "./AllergenPicker.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";
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

// ── Gamification helpers ──────────────────────────────────────────────────────
function computeStreak(history) {
  if (!history?.length) return 0;
  const days = new Set(
    history.map(h => {
      const d = new Date(h.scanned_at || h.timestamp);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (days.has(key)) streak++;
    else if (i > 0) break; // tillad at i dag mangler (streak brækker kun ved gap > 1)
  }
  return streak;
}

function GamificationCard({ history, setScreen, SCREENS }) {
  const streak        = computeStreak(history);
  const total         = history.length;
  const dangers       = history.filter(h => (h.result || h.status) === "danger").length;
  const safes         = history.filter(h => (h.result || h.status) === "safe").length;

  // "Familie aktive" fjernet (28. sept. 2026, Profil-oprydning) — Husstand
  // har nu sin egen tydelige genvej på Profil-siden (se ovenfor), så et
  // separat aktivitets-tal for familie-tilstedeværelse var overflødigt her.
  // Rent 2×2-grid tilbage.
  const metrics = [
    { icon:"flame",  value: streak,  label:"Dage i træk",        color:"#f97316", bg:"rgba(249,115,22,.12)", border:"rgba(249,115,22,.25)" },
    { icon:"search", value: total,   label:"Scanninger i alt",   color:"var(--green)", bg:"var(--green-lt)", border:"var(--green-mid)" },
    { icon:"warning",value: dangers, label:"Advarsler fanget",   color:"var(--red)", bg:"var(--red-lt)", border:"var(--red-md)" },
    { icon:"check",  value: safes,   label:"Sikre opdagelser",   color:"var(--green)", bg:"var(--green-lt)", border:"var(--green-mid)" },
  ];

  return (
    // Tertiær: sjove/motiverende tal, ikke sikkerhedskritisk data — holdes
    // bevidst fladt, uden accent-kant (28. sept. 2026, Profil-oprydning:
    // den tidligere blå venstre-kant er fjernet, ingen anden accent
    // tilføjet i stedet), så det ikke konkurrerer visuelt med "Mine
    // præferencer" ovenfor.
    <div style={{ ...UI.ubgsurface_bd1pxsolid_br14_p14px16px_mb10, boxShadow:"none" }}>
      <div style={UI.udflex_aicenter_jcspacebet_mb12}>
        <div>
          <div style={UI.boldInk13}>Din aktivitet</div>
          {/* "Streak" fjernet herfra (28. sept. 2026, Profil-oprydning) —
              allerede kommunikeret via "3 dage!"-badgen og "Dage i
              træk"-feltet nedenfor, ingen grund til en tredje omtale. */}
          <div style={UI.muted11mt2}>Scanninger · Opdagelser</div>
        </div>
        {streak >= 3 && (
          <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:800, color:"#f97316", background:"rgba(249,115,22,.12)", border:"1px solid rgba(249,115,22,.25)", borderRadius:20, padding:"3px 10px" }}>
            <Icon name="flame" size={11} color="#f97316" /> {streak} dage!
          </div>
        )}
      </div>

      {/* Streak progress-bar */}
      {streak > 0 && (
        <div style={UI.mb12}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--muted)", marginBottom:4, fontWeight:600 }}>
            <span>Ugentlig aktivitet</span>
            <span>{Math.min(streak, 7)}/7 dage</span>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {Array.from({ length: 7 }).map((_, i) => {
              const active = i < Math.min(streak, 7);
              return (
                <div key={i} style={{
                  flex:1, height:6, borderRadius:3,
                  background: active ? "#f97316" : "var(--border2)",
                  transition:"background .3s",
                  boxShadow: active ? "0 0 4px rgba(249,115,22,.5)" : "none",
                }} />
              );
            })}
          </div>
        </div>
      )}

      {/* Metrics grid */}
      <div style={UI.grid2gap8}>
        {metrics.map(m => (
          <div key={m.label} style={{
            background: m.bg,
            border:`1px solid ${m.border}`,
            borderRadius:10,
            padding:"10px 12px",
            display:"flex",
            alignItems:"center",
            gap:10,
          }}>
            <div style={{ flexShrink:0 }}><Icon name={m.icon} size={20} color={m.color} /></div>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color: m.color, lineHeight:1 }}>{m.value}</div>
              <div style={{ fontSize:10, color:"var(--muted)", fontWeight:600, marginTop:2, lineHeight:1.2 }}>{m.label}</div>
            </div>
          </div>
        ))}
        {/* Fuld bredde: Se historik */}
        <div onClick={() => setScreen(SCREENS.HISTORY)}
          style={{
            gridColumn:"1 / -1",
            background:"var(--surface2)",
            border:"1px solid var(--border2)",
            borderRadius:10,
            padding:"10px 14px",
            display:"flex",
            alignItems:"center",
            justifyContent:"space-between",
            cursor:"pointer",
          }}>
          <div style={UI.boldInk12}>Se fuld scanningshistorik</div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
    </div>
  );
}

export default function ProfileScreen({
  customInput, setCustomInput,
  lookupProduct, onScanNow,
}) {
  const { user, setUser, userId, accessToken, loginEmail } = useAuthContext();
  const { allergens, customAllerg, family, household, setHousehold, householdLoading, loadHousehold } = useProfileContext();
  const { screen, setScreen, openLegal } = useNavigationContext();
  const { history, loadHistory } = useHistoryContext();
  const { selectedENumbers } = useAllergenPrefsContext();
  // Husstanden (rigtige konti) hentes nu i App.jsx (useHousehold, 1. okt. 2026), så den også kan
  // vælges som profil ved scanning m.m. — her læses den kun fra ProfileContext.

  // "Rediger præferencer" (28. sept. 2026, Profil-restrukturering) — samme
  // delte gluten↔glutenfri-sync-hook som onboarding/MemberForm bruger (se
  // AllergenPicker.jsx). Bliver her (ikke i EditPreferencesScreen), fordi
  // den altid har kørt, mens profil-skærmene er åbne.
  const [glutenFreeAutoApplied, setGlutenFreeAutoApplied] = useGlutenFreeSync(
    allergens, user.diets || [], (arr) => setUser(u => ({ ...u, diets: arr }))
  );

  // Historik hentes ved allerførste mount (Profil/Favoritter læser også
  // `history`, fx GamificationCard/"Senest scannet", uden selv at besøge
  // Historik-fanen) — uden dette viser de 0 scanninger indtil et separat
  // besøg på Historik tilfældigvis trigger et hent.
  useEffect(() => {
    if (userId && accessToken) loadHistory();
  }, [userId, accessToken, loadHistory]);

  if (screen === SCREENS.HISTORY) return <HistoryScreen household={household} lookupProduct={lookupProduct} onScanNow={onScanNow} />;
  if (screen === SCREENS.FAVORITES) return <FavoritesScreen household={household} lookupProduct={lookupProduct} />;
  if (screen === SCREENS.EDITPROFILE) return <EditProfileScreen />;
  if (screen === SCREENS.EDITPREFERENCES) {
    return (
      <EditPreferencesScreen
        customInput={customInput} setCustomInput={setCustomInput}
        glutenFreeAutoApplied={glutenFreeAutoApplied} setGlutenFreeAutoApplied={setGlutenFreeAutoApplied}
      />
    );
  }
  if (screen === SCREENS.FAMILY) return <FamilyScreen household={household} setHousehold={setHousehold} loadHousehold={loadHousehold} />;
  if (screen !== SCREENS.PROFILE) return null;

  return (
      <div className="screen fade-in">

        {/* Hero */}
        <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:20, padding:"24px 20px", marginBottom:14, boxShadow:"var(--sh)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"var(--ink)", flexShrink:0 }}>
              {initials(user.name||"?")}
            </div>
            <div style={UI.flex1}>
              <div style={{ fontSize:19, fontWeight:900, color:"var(--ink)", letterSpacing:"-.3px" }}>{user.name||"Din profil"}</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:3 }}>{user.email||loginEmail||""}</div>
            </div>
            <button onClick={() => setScreen(SCREENS.EDITPROFILE)}
              style={{ background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:10, padding:"8px 14px", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer" }}>
              Rediger
            </button>
          </div>
        </div>

        {/* Mine præferencer — primær: den sikkerhedskritiske data der driver
            hele appens allergi-tjek, så den bærer skærmens kraftigste skygge
            (samme hierarki-tanke som scan-boksen på Hjem). */}
        <div style={{ ...UI.ubgsurface_bd1pxsolid_br14_p14px16px_mb10, boxShadow:"var(--sh2)" }}>
          <div style={UI.rowBetweenMb10}>
            <div>
              <div style={UI.boldInk13}>Mine præferencer</div>
              <div style={UI.muted11mt2}>{DIETS_ENABLED ? "Allergier · Intolerancer · Diæter · E-numre" : "Allergier · Intolerancer · E-numre"}</div>
            </div>
            <button onClick={() => setScreen(SCREENS.EDITPREFERENCES)}
              style={{ background:"var(--green-lt)", border:"none", borderRadius:8, padding:"4px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--green)", cursor:"pointer" }}>
              Rediger
            </button>
          </div>
          {allergens.length + customAllerg.length + (selectedENumbers?.length || 0) + visibleDiets(user?.diets).length === 0
            ? <div style={{ textAlign:"center", padding:"16px 0" }}><div style={{ marginBottom:8, display:"flex", justifyContent:"center" }}><Icon name="info" size={30} color="var(--muted)" /></div><div style={{ fontSize:13, color:"var(--muted)", marginBottom:10 }}>Ingen præferencer registreret endnu</div><button className="btn btn-outline btn-sm" onClick={() => setScreen(SCREENS.EDITPREFERENCES)}>Tilføj allergener</button></div>
            : (
              <div>
                {/* Gruppér: allergener, intoleranser, diæter */}
                {allergens.filter(id => ALLERGENS.some(a => a.id === id)).length > 0 && (
                  <div style={UI.mb8}>
                    <div style={UI.sectionLbl4Ink}>Allergier</div>
                    <div className="tags">{allergens.filter(id => ALLERGENS.some(a => a.id === id)).map(id => { const a = ALLERGENS.find(x=>x.id===id); return a ? <div key={id} className="tag" style={{ background:"var(--red-lt)", color:"var(--red)", borderColor:"var(--red-md)" }}><AllergenGlyph a={a} size={11} /> {allergenChoiceLabel(a)}</div> : null; })}</div>
                  </div>
                )}
                {customAllerg.length > 0 && (
                  <div style={UI.mb8}>
                    <div style={UI.sectionLbl4Ink}>Intolerancer</div>
                    <div className="tags">{customAllerg.map((c,i) => <div key={i} className="tag" style={{ display:"flex", alignItems:"center", gap:4, background:"var(--amber-lt)", color:"var(--amber)", borderColor:"var(--amber-md)" }}><Icon name="edit" size={10} color="var(--amber)" /> {c}</div>)}</div>
                  </div>
                )}
                {(visibleDiets(user?.diets).length > 0) && (
                  <div style={UI.mb8}>
                    <div style={UI.sectionLbl4Ink}>Diæter</div>
                    <div className="tags">{visibleDiets(user.diets).map(d => { const diet = DIETS.find(x=>x.id===d); return diet ? <div key={d} className="tag" style={UI.ubggreenlt_cgreen_bdcgreenmid}>{diet.emoji || "🥗"} {diet.label}</div> : null; })}</div>
                  </div>
                )}
                {selectedENumbers && selectedENumbers.length > 0 && (
                  <div style={UI.mb8}>
                    <div style={UI.sectionLbl4Ink}>E-numre</div>
                    <div className="tags">{selectedENumbers.map((e,i) => <div key={i} className="tag" style={{ background:"rgba(99,102,241,.1)", color:"#818cf8", borderColor:"rgba(99,102,241,.3)" }}>⚗️ {e}</div>)}</div>
                  </div>
                )}
              </div>
            )
          }
        </div>

        {/* Husstand — kun en let genvej til den eksisterende husstands-
            side ("Familie"), IKKE en dupliceret administrations-UI (28.
            sept. 2026, Profil-restrukturering, krav 4: "EatSafe har
            allerede en separat husstandsfunktion ... profilområdet skal
            ikke duplikere denne funktion"). Ingen medlem-chips, ingen
            "tilføj medlem", ingen administration her længere — kun et
            antal + chevron, samme mønster som GamificationCards "Se
            fuld scanningshistorik"-række. Tæller BÅDE administrerede
            profiler (family) og rigtige husstandskonti (household) —
            de samme to grupper Familie-siden selv viser samlet. */}
        <div style={{ ...UI.ubgsurface_bd1pxsolid_br14_p14px16px_mb10, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}
          onClick={() => setScreen(SCREENS.FAMILY)}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Icon name="family" size={16} color="var(--ink)" />
            <div>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0 }}><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
        </div>

        {/* Gamification */}
        <GamificationCard
          history={history}
          setScreen={setScreen}
          SCREENS={SCREENS}
        />

        {/* Konto, Push-notifikationer og Notifikations-kategorier er
            flyttet til SettingsScreen.jsx (26. sept. 2026, bruger-
            feedback: "Indstillinger mangler i menuen") — nås nu via
            ProfileMenu.jsx's "Indstillinger", ikke længere herfra. */}

        {/* ── Footer: kontakt + privatlivspolitik ──
            Bund-padding udvidet (26. sept. 2026, sidste polish) — 8px var
            for lidt til at friholde footeren fra den faste, position:fixed
            bottom-nav (se .bottom-nav i theme.jsx: ca. 77px egen højde +
            dens egen env(safe-area-inset-bottom)-bund-padding). Formlen
            her lægger navigationens omtrentlige højde + samme safe-area-
            inset + ekstra luft oveni, så "Spørgsmål eller feedback?",
            mailadressen, privatlivspolitik-linket og "EatSafe Beta" altid
            kan scrolles helt fri af baren, uanset enhedens safe-area. */}
        <div style={{ marginTop:24, paddingBottom:"calc(96px + env(safe-area-inset-bottom))", textAlign:"center" }}>
          <div style={UI.ufs11_cmuted_mb8}>
            Spørgsmål eller feedback?
          </div>
          <a href="mailto:hej@eatsafe.dk"
            style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:"var(--green)", textDecoration:"none", marginBottom:14 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,12 2,6"/>
            </svg>
            hej@eatsafe.dk
          </a>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, fontSize:11, color:"var(--muted)" }}>
            <button type="button" onClick={() => openLegal(SCREENS.PRIVACY)}
              style={{ background:"none", border:"none", padding:0, font:"inherit", color:"var(--muted)", textDecoration:"underline", textUnderlineOffset:3, cursor:"pointer" }}>
              Privatlivspolitik
            </button>
            <span>·</span>
            <span>EatSafe Beta</span>
          </div>
        </div>

      </div>
  );
}
