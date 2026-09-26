// @ts-nocheck
import React, { useState, useEffect } from "react";
import { ALLERGENS, SCREENS, DIETS, E_NUMBERS, E_CATEGORIES, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { initials, timeAgo, getAllergenLabels, makeHeaders, apiCall, buildActiveProfileList, computeProfileResults, extractENumbers } from "./helpers.js";
import { EatSafeLogo, Icon, ProductImage, ProfileBadges, showToast } from "./SharedComponents.jsx";
import { MemberForm, CategorySelect } from "./MemberForm.jsx";
import { TextLink } from "./DesignSystem.jsx";
import { ENumberPicker } from "./AllergenPicker.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";
import { useAdminContext } from "./AdminContext.jsx";
import { useFamilyFormContext } from "./FamilyFormContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";

// ── Historik: status-sprog, kompakt filter ──────────────────────────────────
// Samme grøn/rød/orange-farvesprog og ikon+tekst+farve-mønster som
// Indkøbslistens itemStatus (ListScreen.jsx) — én kilde til hvad "Konflikt"/
// "Kan ikke afgøres sikkert"/"Matcher" betyder på tværs af appen, ikke en
// selvstændig kopi af logikken. "not_found" er specifikt for Historik (et
// scan der ikke gav noget produkt at vurdere) og findes ikke i Indkøbslisten.
const HISTORY_STATUS_COLOR = { danger:"var(--red)", warn:"var(--amber)", safe:"var(--green)", not_found:"var(--muted)" };
const HISTORY_STATUS_ICON  = { danger:"warning", warn:"warning", safe:"check", not_found:"info" };
const HISTORY_FILTERS = [
  { id:"all",       label:"Alle" },
  { id:"safe",      label:"Sikker" },
  { id:"danger",    label:"Konflikt" },
  { id:"warn",      label:"Usikker" },
  { id:"not_found", label:"Ikke fundet" },
];

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

function GamificationCard({ history, family, activeProfiles, setScreen, SCREENS }) {
  const streak        = computeStreak(history);
  const total         = history.length;
  const dangers       = history.filter(h => (h.result || h.status) === "danger").length;
  const safes         = history.filter(h => (h.result || h.status) === "safe").length;
  const familyActive  = activeProfiles.filter(id => id !== "me" && id !== "user").length;

  const metrics = [
    { icon:"flame",  value: streak,       label:"Dages streak",       color:"#f97316", bg:"rgba(249,115,22,.12)", border:"rgba(249,115,22,.25)" },
    { icon:"search", value: total,        label:"Scanninger i alt",   color:"var(--green)", bg:"var(--green-lt)", border:"var(--green-mid)" },
    { icon:"warning",value: dangers,      label:"Advarsler fanget",   color:"var(--red)", bg:"var(--red-lt)", border:"var(--red-md)" },
    { icon:"check",  value: safes,        label:"Sikre opdagelser",   color:"var(--green)", bg:"var(--green-lt)", border:"var(--green-mid)" },
    { icon:"family", value: familyActive, label:"Familie aktive",    color:"#818cf8", bg:"rgba(129,140,248,.12)", border:"rgba(129,140,248,.25)" },
  ];

  return (
    // Tertiær: sjove/motiverende tal, ikke sikkerhedskritisk data — holdes bevidst
    // fladt med kun en accent-kant, samme mønster som dagens-tip-kortet på Hjem,
    // så det ikke konkurrerer visuelt med "Mine præferencer" ovenfor.
    <div style={{ ...UI.ubgsurface_bd1pxsolid_br14_p14px16px_mb10, boxShadow:"none", borderLeft:"2px solid var(--blue)" }}>
      <div style={UI.udflex_aicenter_jcspacebet_mb12}>
        <div>
          <div style={UI.boldInk13}>Din aktivitet</div>
          <div style={UI.muted11mt2}>Streak · Scanninger · Opdagelser</div>
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
            <span>Ugentlig streak</span>
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
  lookupProduct,
}) {
  const { user, setUser, userId, accessToken, loginEmail } = useAuthContext();
  const { allergens, setAllergens, customAllerg, setCustomAllerg, family, setFamily, activeProfiles, setActiveProfiles } = useProfileContext();
  const { screen, setScreen } = useNavigationContext();
  const { history, favorites, historyLoading, historyScope, favoritesScope, loadHistory, loadFavorites, toggleFavorite, setFavoriteCategory } = useHistoryContext();
  const [household, setHousehold] = useState([]);
  const [householdLoading, setHouseholdLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setHouseholdLoading(true);
    apiCall(`${SUPABASE_URL}/functions/v1/family/group`, { headers: makeHeaders(accessToken) })
      .then(data => { if (data?.success) setHousehold(data.members || []); })
      .catch(() => {})
      .finally(() => setHouseholdLoading(false));
  }, [accessToken]);
  const {
    loadAdminStats, loadSubmissions, loadTickets,
    setAdminSection, setSubmissionFilter,
  } = useAdminContext();
  const {
    newMemberName, setNewMemberName,
    newMemberBirthYear, setNewMemberBirthYear,
    newMemberGender, setNewMemberGender,
    newMemberAllerg, setNewMemberAllerg,
    newMemberCustomAllerg, setNewMemberCustomAllerg,
    newMemberDiets, setNewMemberDiets,
    newMemberENumbers, setNewMemberENumbers,
    newMemberSubtypes, setNewMemberSubtypes,
    newMemberCustomInput, setNewMemberCustomInput,
    editingMemberId,
    addMember, updateMember, removeMember, startEditMember, cancelEditMember,
  } = useFamilyFormContext();
  const {
    eSearch, setESearch, eCategory, setECategory,
    allergenSubtypes, setAllergenSubtypes,
    selectedENumbers, setSelectedENumbers,
    activeSubtypeModal, setActiveSubtypeModal,
  } = useAllergenPrefsContext();

  // Historik hentes ved allerførste mount (Profil/Favoritter læser også
  // `history`, fx GamificationCard/"Senest scannet", uden selv at besøge
  // Historik-fanen) — uden dette viser de 0 scanninger indtil et separat
  // besøg på Historik tilfældigvis trigger et hent.
  useEffect(() => {
    if (userId && accessToken) loadHistory();
  }, [userId, accessToken, loadHistory]);

  // Historikken opdaterer automatisk ved hvert besøg på selve Historik-fanen
  // (26. sept. 2026, brugerfeedback: "historikken skal opdatere automatisk",
  // erstatter den tidligere manuelle "Opdater"-knap) — ProfileScreen skifter
  // kun INTERN gren ved navigation mellem Profil/Historik/Familie/
  // Favoritter (forbliver mount'et), så mount-effekten ovenfor alene ikke er
  // nok til at give et friskt hent hver gang man navigerer IND på Historik.
  // Bevidst kun `screen` som trigger, ikke `loadHistory`/scope — de ville
  // ellers også genudløse ved fx et Mine/Husstanden-skift, som allerede
  // kalder loadHistory() direkte selv.
  useEffect(() => {
    if (screen === SCREENS.HISTORY && userId && accessToken) loadHistory(historyScope);
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Invite state ────────────────────────────────────────────────────────────
  const [inviteLink, setInviteLink] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState([]);
  const [categoryMenuFor, setCategoryMenuFor] = useState(null);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  // ── Historik: kompakt filter + status pr. post ──────────────────────────────
  const [historyFilter, setHistoryFilter] = useState("all");

  // Beregner samme sikkerhedsvurdering som Indkøbslisten (buildActiveProfileList
  // + computeProfileResults, helpers.js) — men ud fra den FROSNE `flags_triggered`
  // og `active_profiles`, som blev gemt PÅ SELVE SCANNINGSTIDSPUNKTET, i stedet
  // for appens nuværende aktive profiler/produktdata. Det gør statuslinjen i
  // selve historik-rækken konsistent med hvad der reelt blev vist dengang,
  // uanset om brugeren siden har skiftet aktive profiler. Ingrediens-/
  // næringsdata er IKKE gemt i historikken (kun allergen_flags via
  // flags_triggered) — diæt-/E-nummer-baserede advarsler indgår derfor ikke
  // her, kun det primære allergen-match, som er den dominerende faktor bag
  // "Konflikt"/"Kan ikke afgøres sikkert" alligevel.
  const historyDetails = (h) => {
    const rawStatus = h.result || h.status;
    const ids = (h.active_profiles && h.active_profiles.length) ? h.active_profiles : activeProfiles;
    const profiles = buildActiveProfileList({ user, family, allergens, customAllerg, selectedENumbers, activeProfiles: ids });
    // "Tjekket for: Alle" når scanningen dækkede ALLE nuværende profiler (mig
    // + hele familien), "Carsten + Kaj" ved specifikke navne, ellers et enkelt
    // navn (26. sept. 2026, opfølgning — eksplicit ordlyd fra brugeren).
    // Sammenlignet mod den NUVÆRENDE familieliste, ikke en frosset liste fra
    // scanningstidspunktet (den findes ikke i skemaet) — en rimelig
    // forenkling, dokumenteret her fremfor at fremstå som en fejl.
    const allCurrentIds = ["me", ...family.map(m => m.id)];
    const isAllProfiles = profiles.length > 1 && allCurrentIds.every(id => ids.includes(id));
    const names = profiles.map(p => p.name.split(" ")[0]);
    const checkedFor = names.length === 0 ? null : isAllProfiles ? "Alle" : names.join(" + ");
    // "Produkt ikke fundet" står allerede som selve rækkens overskrift — en
    // ekstra statuslinje med samme tekst er ren gentagelse (26. sept. 2026,
    // brugerfeedback: "fjern den dobbelte tekst"). Ingen `text` her betyder
    // ingen tredje linje overhovedet, se render-koden.
    if (rawStatus === "not_found") return { status:"not_found", text:null, checkedFor };
    if (profiles.length === 0) return { status:null, text:null, checkedFor: null };
    const flags = h.flags_triggered || {};
    const results = computeProfileResults(profiles, { allergen_flags: flags, ingredients:"", nutrition:null, productENumbers:[] });
    const dangerNames = results.filter(r => r.status === "danger").map(r => r.name.split(" ")[0]);
    if (dangerNames.length > 0) {
      return { status:"danger", text: dangerNames.length <= 2 ? `Konflikt for ${dangerNames.join(", ")}` : "Passer ikke til valgte profiler", checkedFor };
    }
    if (results.some(r => r.status === "warn")) return { status:"warn", text:"Kan ikke afgøres sikkert", checkedFor };
    return { status:"safe", text:"Matcher valgte profiler", checkedFor };
  };

  // Genåbner et tidligere scan-resultat for SAMME profiler som ved den
  // oprindelige scanning (26. sept. 2026, brugerfeedback) — sætter appens
  // aktive profiler til den historiske liste og genbruger derefter PRÆCIS
  // samme lookupProduct-kald som resten af appen (Favoritter, "Senest
  // scannet" m.fl.), i stedet for at bygge en selvstændig visning af et
  // frosset resultat. Bevidst valg at hente FRISK produktdata i stedet for
  // at genbruge `flags_triggered` her: allergendata kan være rettet siden
  // scanningen (fx en fejlrettelse efter en indsendelse), og et frosset,
  // muligvis forældet "sikkert"-resultat ville være et reelt sikkerheds-
  // problem i en allergi-app. Ingen automatisk gendannelse af de tidligere
  // aktive profiler ved tilbage-navigation — samme model som resten af
  // appen, hvor "aktive profiler" er ét delt, globalt valg.
  const openHistoryEntry = (h) => {
    if ((h.result || h.status) === "not_found") return;
    if (h.active_profiles?.length) setActiveProfiles(h.active_profiles);
    lookupProduct(h.ean_scanned || h.code);
  };

  // Samler gentagne "produkt ikke fundet"-scanninger af SAMME stregkode til
  // én række med et antal (26. sept. 2026, brugerfeedback: "historikken kan
  // hurtigt blive fyldt med identiske mislykkede scanninger") — kun for
  // ikke-fundne produkter, IKKE for fundne produkter (at scanne den samme
  // yoghurt to gange med to ugers mellemrum er reel, adskilt historik, ikke
  // støj, der skal slås sammen). `history` kommer allerede nyest-først fra
  // API'et, så den FØRSTE forekomst af et EAN i iterationsrækkefølgen er
  // automatisk den seneste — den bruges som rækkens tidspunkt/plads i
  // listen, øvrige forekomster tælles ind i samme objekt og udelades selv.
  const groupNotFoundDuplicates = (list) => {
    const seenByEan = new Map();
    const result = [];
    for (const h of list) {
      const isNF = (h.result || h.status) === "not_found";
      const ean = h.ean_scanned || h.code;
      if (!isNF || !ean) { result.push(h); continue; }
      const existing = seenByEan.get(ean);
      if (existing) { existing.__count++; continue; }
      const group = { ...h, __count: 1 };
      seenByEan.set(ean, group);
      result.push(group);
    }
    return result;
  };

  const FamilyChips = () => {
    const allIds = ["me", ...family.map(m => m.id)];
    const isAll = allIds.every(id => activeProfiles.includes(id));
    const toggleAll = () => setActiveProfiles(isAll ? ["me"] : allIds);
    const toggleOne = (id) => {
      if (isAll) { setActiveProfiles([id]); return; }
      const next = activeProfiles.includes(id) ? activeProfiles.filter(x => x !== id) : [...activeProfiles, id];
      setActiveProfiles(next.length === 0 ? [id] : next);
    };
    return (
      <div style={UI.wrapGap7}>
        <div className={`ap-chip${isAll?" on":""}`} onClick={toggleAll}>Hele familien</div>
        <div className={`ap-chip${!isAll&&activeProfiles.includes("me")?" on":""}`} onClick={() => toggleOne("me")}>
          <div style={UI.uw20_h20_br50_bggreen_dflex_aicenter_jccenter_fs10_fw800_cin}>{initials(user.name||"Mig")}</div>
          {(user.name||"Mig").split(" ")[0]}
        </div>
        {family.map(m => (
          <div key={m.id} className={`ap-chip${!isAll&&activeProfiles.includes(m.id)?" on":""}`} onClick={() => toggleOne(m.id)}>
            <div style={{width:20,height:20,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"var(--ink)"}}>{initials(m.name)}</div>
            {m.name.split(" ")[0]}
          </div>
        ))}
      </div>
    );
  };
  return (
    <>
        {screen === SCREENS.HISTORY && (
          <div className="screen fade-in">
            {/* .screen-title er centreret som standard (theme.jsx, delt af alle
                skærme) — venstrestillet her med en lokal inline-override
                (26. sept. 2026, brugerfeedback: "centreret titel + venstre-
                stillet undertekst ser tilfældigt ud, venstrestil begge så
                siden matcher en funktionel listevisning bedre", samme
                reference som Indkøbslistens allerede venstrestillede titel).
                Ændrer IKKE den delte klasse — resten af appens skærme, som
                ikke blev nævnt, beholder deres centrerede titel uændret. */}
            <div className="screen-title" style={{ textAlign:"left", width:"auto" }}>Historik</div>
            <div className="screen-sub">
              {historyScope === "family" ? "Alle scanninger i din husstand." : "Alle dine tidligere scanninger."}
            </div>
            {household.length > 0 && (
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <div onClick={() => loadHistory("own")}
                  style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700,
                    background: historyScope==="own" ? "var(--green)" : "var(--surface)", color: historyScope==="own" ? "var(--on-green)" : "var(--muted)",
                    border:`1px solid ${historyScope==="own" ? "var(--green)" : "var(--border)"}` }}>
                  Mine
                </div>
                <div onClick={() => loadHistory("family")}
                  style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700,
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                    background: historyScope==="family" ? "var(--green)" : "var(--surface)", color: historyScope==="family" ? "var(--on-green)" : "var(--muted)",
                    border:`1px solid ${historyScope==="family" ? "var(--green)" : "var(--border)"}` }}>
                  <Icon name="family" size={12} color={historyScope==="family" ? "var(--on-green)" : "var(--muted)"} /> Husstanden
                </div>
              </div>
            )}

            {historyLoading && (
              <div className="fade-in">
                {[1,2,3,4].map(i => (
                  <div key={i} className="skeleton-row">
                    <div className="skeleton-block skeleton-avatar" />
                    <div style={UI.flex1}>
                      <div className="skeleton-block skeleton-title" />
                      <div className="skeleton-block skeleton-sub" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!historyLoading && history.length===0 && (
              <div className="empty-state">
                <span className="empty-icon"><Icon name="search" size={26} color="var(--muted)" /></span>
                <div className="empty-txt">Ingen scanninger endnu</div>
                <div className="empty-sub">Skan dit første produkt for at se din historik her</div>
                <button className="btn btn-primary btn-sm" style={UI.mt12} onClick={() => setScreen(SCREENS.HOME)}>Scan nu</button>
              </div>
            )}

            {/* Kompakt filter — kun når historikken reelt indeholder nok til at
                et filter giver mening (26. sept. 2026, brugerfeedback: "tilføj
                ikke permanente filtre endnu ved få poster... ved ca. 10-15+
                scanninger kan der senere tilføjes"). Tærsklen er selve
                mekanismen der gør det "senere" — ingen ny kodeændring nødvendig
                når en bruger vokser forbi den. Genbruger den allerede
                eksisterende, men hidtil ubrugte .filter-chip-klasse
                (theme.jsx) i stedet for at style'e nye chips til formålet. */}
            {!historyLoading && history.length >= 10 && (
              <div style={{ ...UI.wrapGap7, marginBottom:12 }}>
                {HISTORY_FILTERS.map(f => (
                  <div key={f.id} className={`filter-chip${historyFilter===f.id?" active":""}`} onClick={() => setHistoryFilter(f.id)}>
                    {f.label}
                  </div>
                ))}
              </div>
            )}

            {!historyLoading && history.length > 0 && (() => {
              const filtered = historyFilter === "all"
                ? history
                : history.filter(h => historyDetails(h).status === historyFilter);
              if (filtered.length === 0) {
                return <div style={{ textAlign:"center", padding:"32px 0", fontSize:12.5, color:"var(--muted)" }}>Ingen scanninger matcher dette filter</div>;
              }
              const grouped = groupNotFoundDuplicates(filtered);
              return grouped.map((h,i) => {
                const d = historyDetails(h);
                const isNotFound = d.status === "not_found";
                const name = isNotFound ? "Produkt ikke fundet" : (h.products?.name || h.name || "Ukendt produkt");
                const prod = { name: h.products?.name || h.name, brand: h.products?.brand || h.brand, image_url: h.products?.image_url || null };
                const scannedBySuffix = historyScope === "family" && h.user_id !== userId && h.users?.name ? ` · ${h.users.name.split(" ")[0]}` : "";
                return (
                  <div key={h.id ?? i} className="hist-row" style={{ padding:"12px 0", cursor: isNotFound ? "default" : "pointer" }}
                    // Genbruger samme lookupProduct-kald som "Senest scannet" og
                    // favoritter, men sætter først appens aktive profiler til den
                    // historiske liste — se openHistoryEntry ovenfor for hvorfor.
                    onClick={() => openHistoryEntry(h)}>
                    {/* Ukendte produkter (26. sept. 2026, opfølgning) får en
                        neutral stregkode-ikon-boks i stedet for ProductImages
                        emoji-kategori-gæt (som for et helt ukendt produkt bare
                        endte som en generisk indkøbsvogn) — samme
                        charcoal/grå ikonstil som resten af appens Icon-
                        bibliotek, ikke endnu en emoji-variant. */}
                    {isNotFound
                      ? <div style={{ width:40, height:40, background:"var(--paper2)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <Icon name="barcode" size={19} color="var(--muted)" />
                        </div>
                      : <ProductImage product={prod} size={40} />}
                    <div className="hist-info" style={{ marginLeft:2 }}>
                      <div className="hist-name">{name}</div>
                      <div className="hist-time">
                        {isNotFound
                          ? `Stregkode ${h.ean_scanned || h.code || "?"} · ${h.__count > 1 ? `Scannet ${h.__count} gange, senest ${timeAgo(h.scanned_at||h.timestamp)}` : `${timeAgo(h.scanned_at||h.timestamp)}`}`
                          : `${timeAgo(h.scanned_at||h.timestamp)}${d.checkedFor ? ` · Tjekket for: ${d.checkedFor}` : ""}`}
                        {scannedBySuffix}
                      </div>
                      {/* Altid ikon + tekst + farve, aldrig farve alene (26. sept.
                          2026, brugerfeedback) — samme mønster som Indkøbslistens
                          itemStatus-linje (ListScreen.jsx). Ingen linje her for
                          "produkt ikke fundet" (d.text er bevidst null, se
                          historyDetails) — overskriften siger det allerede,
                          en gentagelse nedenunder var det brugeren bad om at
                          fjerne. */}
                      {d.status && d.text && (
                        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3, fontSize:11, fontWeight:700, color: HISTORY_STATUS_COLOR[d.status] }}>
                          <Icon name={HISTORY_STATUS_ICON[d.status]} size={11} color="currentColor" />
                          {d.text}
                        </div>
                      )}
                    </div>
                    {/* Diskret chevron KUN på rækker der reelt kan genåbnes —
                        "produkt ikke fundet" har intet resultat at vise (26.
                        sept. 2026, brugerfeedback). Samme chevron-mønster som
                        fx ProfileMenu.jsx's menupunkter. */}
                    {!isNotFound && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0 }}>
                        <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {screen === SCREENS.PROFILE && (
          <div className="screen fade-in">

            {/* Hero */}
            <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:20, padding:"22px 20px", marginBottom:14, boxShadow:"var(--sh)" }}>
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
                  <div style={UI.muted11mt2}>Allergier · Intolerancer · Diæter · E-numre</div>
                </div>
                <button onClick={() => setScreen(SCREENS.EDITPROFILE)}
                  style={{ background:"var(--green-lt)", border:"none", borderRadius:8, padding:"4px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--green)", cursor:"pointer" }}>
                  Rediger
                </button>
              </div>
              {allergens.length + customAllerg.length + (selectedENumbers?.length || 0) + (user?.diets?.length || 0) === 0
                ? <div style={{ textAlign:"center", padding:"16px 0" }}><div style={{ marginBottom:8, display:"flex", justifyContent:"center" }}><Icon name="info" size={30} color="var(--muted)" /></div><div style={{ fontSize:13, color:"var(--muted)", marginBottom:10 }}>Ingen præferencer registreret endnu</div><button className="btn btn-outline btn-sm" onClick={() => setScreen(SCREENS.EDITPROFILE)}>Tilføj allergener</button></div>
                : (
                  <div>
                    {/* Gruppér: allergener, intoleranser, diæter */}
                    {allergens.filter(id => ALLERGENS.some(a => a.id === id)).length > 0 && (
                      <div style={UI.mb8}>
                        <div style={UI.sectionLbl4Ink}>Allergier</div>
                        <div className="tags">{allergens.filter(id => ALLERGENS.some(a => a.id === id)).map(id => { const a = ALLERGENS.find(x=>x.id===id); return a ? <div key={id} className="tag" style={{ background:"var(--red-lt)", color:"var(--red)", borderColor:"var(--red-md)" }}>{a.emoji} {a.label}</div> : null; })}</div>
                      </div>
                    )}
                    {customAllerg.length > 0 && (
                      <div style={UI.mb8}>
                        <div style={UI.sectionLbl4Ink}>Intolerancer</div>
                        <div className="tags">{customAllerg.map((c,i) => <div key={i} className="tag" style={{ display:"flex", alignItems:"center", gap:4, background:"var(--amber-lt)", color:"var(--amber)", borderColor:"var(--amber-md)" }}><Icon name="edit" size={10} color="var(--amber)" /> {c}</div>)}</div>
                      </div>
                    )}
                    {(user?.diets?.length > 0) && (
                      <div style={UI.mb8}>
                        <div style={UI.sectionLbl4Ink}>Diæter</div>
                        <div className="tags">{user.diets.map(d => { const diet = DIETS.find(x=>x.id===d); return diet ? <div key={d} className="tag" style={UI.ubggreenlt_cgreen_bdcgreenmid}>{diet.emoji || "🥗"} {diet.label}</div> : null; })}</div>
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

            {/* Min husstand — rigtige inviterede konti, adskilt fra allergi-profilerne i "Familie" */}
            <div style={UI.ubgsurface_bd1pxsolid_br14_p14px16px_mb10}>
              <div style={{ ...UI.boldInk13, display:"flex", alignItems:"center", gap:6 }}><Icon name="family" size={13} color="var(--ink)" /> Min husstand</div>
              <div style={{ ...UI.muted11mt2, marginBottom:10 }}>Konti du deler scanninger, favoritter og indkøbslister med</div>
              {householdLoading ? (
                <div style={{ fontSize:12, color:"var(--muted)" }}>Henter…</div>
              ) : household.length === 0 ? (
                <div style={{ fontSize:12, color:"var(--muted)" }}>Du har ikke inviteret nogen endnu — gå til "Familie" for at oprette et invitationslink.</div>
              ) : (
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {household.map(m => (
                    <div key={m.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px 6px 6px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:20 }}>
                      <div style={{ width:24, height:24, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"var(--ink)" }}>
                        {initials(m.name || m.email)}
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:"var(--ink)" }}>{m.name || m.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gamification */}
            <GamificationCard
              history={history}
              family={family}
              activeProfiles={activeProfiles}
              setScreen={setScreen}
              SCREENS={SCREENS}
            />

            {/* Konto, Push-notifikationer og Notifikations-kategorier er
                flyttet til SettingsScreen.jsx (26. sept. 2026, bruger-
                feedback: "Indstillinger mangler i menuen") — nås nu via
                ProfileMenu.jsx's "Indstillinger", ikke længere herfra. */}

            {/* ── Footer: kontakt + privatlivspolitik ── */}
            <div style={{ marginTop:24, paddingBottom:8, textAlign:"center" }}>
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
                <a href="https://eatsafe.dk/privacy" target="_blank" rel="noopener noreferrer"
                  style={{ color:"var(--muted)", textDecoration:"underline", textUnderlineOffset:3 }}>
                  Privatlivspolitik
                </a>
                <span>·</span>
                <span>EatSafe Beta</span>
              </div>
            </div>

          </div>
        )}

        {screen === SCREENS.FAVORITES && (
          <div className="screen fade-in">
            <div className="screen-title"> Favoritter</div>

            {household.length > 0 && (
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <div onClick={() => loadFavorites("own")}
                  style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700,
                    background: favoritesScope==="own" ? "var(--green)" : "var(--surface)", color: favoritesScope==="own" ? "var(--on-green)" : "var(--muted)",
                    border:`1px solid ${favoritesScope==="own" ? "var(--green)" : "var(--border)"}` }}>
                  Mine
                </div>
                <div onClick={() => loadFavorites("family")}
                  style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700,
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                    background: favoritesScope==="family" ? "var(--green)" : "var(--surface)", color: favoritesScope==="family" ? "var(--on-green)" : "var(--muted)",
                    border:`1px solid ${favoritesScope==="family" ? "var(--green)" : "var(--border)"}` }}>
                  <Icon name="family" size={12} color={favoritesScope==="family" ? "var(--on-green)" : "var(--muted)"} /> Husstanden
                </div>
              </div>
            )}

            {/* Seneste scanninger */}
            {history.filter(h => h.result !== "not_found" && (h.products?.name || h.name)).length > 0 && (
              <div className="card" style={UI.mb10}>
                <div className="card-lbl" style={{ display:"flex", justifyContent:"space-between" }}>
                  <span>Senest scannet</span>
                  <span style={{ cursor:"pointer", color:"var(--green)", fontWeight:700, fontSize:11 }} onClick={() => { loadHistory(); setScreen(SCREENS.HISTORY); }}>Se alle</span>
                </div>
                {history.filter(h => h.result !== "not_found").slice(0,3).map((h,i) => {
                  const s = h.result || h.status;
                  const name = h.products?.name || h.name || h.ean_scanned || "Ukendt";
                  const prod = { name, brand: h.products?.brand||h.brand||"", image_url: h.products?.image_url||null };
                  const color = s==="safe" ? "var(--green)" : s==="danger" ? "var(--red)" : "var(--amber)";
                  const bg = s==="safe" ? "var(--green-lt)" : s==="danger" ? "var(--red-lt)" : "var(--amber-lt)";
                  return (
                    <div key={i} className="hist-row" style={UI.ucurpointer}
                      onClick={() => lookupProduct(h.ean_scanned || h.code)}>
                      <ProductImage product={prod} size={36} />
                      <div className="hist-info" style={{ marginLeft:8 }}>
                        <div className="hist-name">{name}</div>
                        <div className="hist-time">{timeAgo(h.scanned_at||h.timestamp)}</div>
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, color, background:bg, border:`1px solid ${color}`, borderRadius:20, padding:"3px 10px", flexShrink:0 }}>
                        {s==="safe"?"Sikker":s==="danger"?"Farlig":"Advarsel"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Gemte favoritter — grupperet i kategorier */}
            {favorites.length === 0 && (
              <div className="empty-state"><span className="empty-icon"><Icon name="heart" size={26} color="var(--muted)" /></span><div className="empty-txt">Ingen favoritter endnu</div><div className="empty-sub">Tryk hjertet på et produkt under scanning for at gemme det her</div>
              </div>
            )}
            {favorites.length > 0 && (() => {
              const existingCategories = [...new Set(favorites.map(f => f.category).filter(Boolean))].sort();
              const groups = {};
              favorites.forEach(f => {
                const key = f.category || "Ukategoriseret";
                (groups[key] = groups[key] || []).push(f);
              });
              const orderedKeys = [...existingCategories, ...(groups["Ukategoriseret"] ? ["Ukategoriseret"] : [])];
              return orderedKeys.map(cat => {
                const isCollapsed = collapsedCategories.includes(cat);
                return (
                  <div key={cat} style={UI.mb10}>
                    <div onClick={() => setCollapsedCategories(c => isCollapsed ? c.filter(x=>x!==cat) : [...c, cat])}
                      style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"4px 2px", marginBottom:6 }}>
                      <div className="card-lbl" style={{ display:"flex", alignItems:"center", gap:6, marginBottom:0 }}>
                        <Icon name={cat === "Ukategoriseret" ? "package" : "tag"} size={11} color="var(--neutral)" />
                        {cat === "Ukategoriseret" ? "Ukategoriseret" : cat} ({groups[cat].length})
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"
                        style={{ transform: isCollapsed ? "none" : "rotate(180deg)", transition:"transform .2s" }}>
                        <path strokeLinecap="round" d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                    {!isCollapsed && groups[cat].map((f,i) => (
                      <div key={i} className="card" style={{ padding:"12px 14px", cursor:"pointer", marginBottom:8, position:"relative" }}
                        onClick={() => lookupProduct(f.ean || f.code || f.id)}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <ProductImage product={f} size={48} />
                          <div style={UI.flexMin}>
                            <div style={{ fontWeight:700, fontSize:14 }}>{f.name || "Ukendt"}</div>
                            {f.brand && <div style={UI.ufs12_cmuted_mt1}>{f.brand}</div>}
                            {favoritesScope==="family" && !f.savedByMe && f.savedBy && (
                              <div style={{ fontSize:11, color:"var(--green)", fontWeight:700, marginTop:2 }}>Gemt af {f.savedBy.split(" ")[0]}</div>
                            )}
                            <div style={{ marginTop:6 }}>
                              <ProfileBadges allergenFlags={f.allergen_flags||{}} allergens={allergens} customAllerg={customAllerg} family={family} activeProfiles={activeProfiles} size={22} />
                            </div>
                          </div>
                          {f.savedByMe !== false && (
                            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, flexShrink:0 }}>
                              <button className="btn btn-ghost btn-sm" style={{ fontSize:12, padding:"2px 6px" }} aria-label={`Flyt "${f.name || "produkt"}" til en kategori`}
                                onClick={e => { e.stopPropagation(); setCategoryMenuFor(categoryMenuFor === f.ean ? null : f.ean); setNewCategoryInput(""); }}>
                                <Icon name="tag" size={12} color="var(--ink2)" />
                              </button>
                              <button className="btn btn-ghost btn-sm" style={{ fontSize:12 }} aria-label={`Fjern "${f.name || "produkt"}" fra favoritter`}
                                onClick={e => { e.stopPropagation(); toggleFavorite(f); }}>
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                        {categoryMenuFor === f.ean && (
                          <div onClick={e => e.stopPropagation()}
                            style={{ marginTop:10, paddingTop:10, borderTop:"1px solid var(--border)" }}>
                            <div style={UI.ufs11_cmuted_mb8}>Flyt til kategori</div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                              {f.category && (
                                <div onClick={() => { setFavoriteCategory(f.ean, null); setCategoryMenuFor(null); }}
                                  style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", background:"var(--surface2)", border:"1px solid var(--border2)", color:"var(--muted)" }}>
                                  <Icon name="package" size={10} color="var(--muted)" /> Fjern kategori
                                </div>
                              )}
                              {existingCategories.filter(c => c !== f.category).map(c => (
                                <div key={c} onClick={() => { setFavoriteCategory(f.ean, c); setCategoryMenuFor(null); }}
                                  style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", background:"var(--green-lt)", border:"1px solid var(--green-mid)", color:"var(--green)" }}>
                                  <Icon name="tag" size={10} color="var(--green)" /> {c}
                                </div>
                              ))}
                            </div>
                            <div className="input-row">
                              <input className="field" placeholder="Ny kategori…" value={newCategoryInput}
                                onChange={e => setNewCategoryInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && newCategoryInput.trim()) { setFavoriteCategory(f.ean, newCategoryInput.trim()); setCategoryMenuFor(null); } }} />
                              <button className="btn btn-primary btn-sm" style={UI.uwsnowrap}
                                onClick={() => { if (newCategoryInput.trim()) { setFavoriteCategory(f.ean, newCategoryInput.trim()); setCategoryMenuFor(null); } }}>
                                Opret
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {screen === SCREENS.EDITPROFILE && (
          <div className="screen fade-in">
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 0 20px" }}>
              
              <div style={UI.ufs18_fw800_cink}>Rediger profil</div>
            </div>

            {/* Navn og kontakt */}
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
              <div style={UI.mb10}>
                <label className="field-lbl">Alder <span style={UI.red}>*</span></label>
                <input className="field" type="number" placeholder="Fx. 34" min="1" max="120"
                  value={user.birth_year ? String(new Date().getFullYear() - parseInt(user.birth_year)) : ""}
                  onChange={e => {
                    const age = e.target.value;
                    setUser(u => ({ ...u, birth_year: age ? String(new Date().getFullYear() - parseInt(age)) : "" }));
                  }} />
              </div>
              <label className="field-lbl">Køn <span style={UI.red}>*</span></label>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                {["Mand","Kvinde","Andet"].map(g => (
                  <div key={g} onClick={() => setUser(u => ({...u, gender:g}))}
                    style={{ flex:1, padding:"8px 0", textAlign:"center", borderRadius:8, border:`1px solid ${user.gender===g?"var(--green)":"var(--border)"}`, background:user.gender===g?"var(--green-lt)":"var(--surface)", fontSize:13, fontWeight:700, color:user.gender===g?"var(--green)":"var(--muted)", cursor:"pointer" }}>
                    {g}
                  </div>
                ))}
              </div>
              {(!user.name?.trim() || !user.birth_year || !user.gender) && (
                <div style={UI.ufs11_cmuted_mb10}>
                  <span style={UI.red}>*</span> Navn, alder og køn er obligatoriske
                </div>
              )}
            </div>

            {/* Allergier */}
            {/* Diæt */}
            <div className="card" style={UI.mb10}>
              <div className="card-lbl">Diæt</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10, lineHeight:1.5 }}>Vælg din diæt — bruges til filtrering af produkter og opskrifter.</div>
              <div className="chip-grid" style={UI.mb8}>
                {DIETS.map(d => {
                  const on = (user.diets||[]).includes(d.id);
                  return (
                    <div key={d.id} className={`chip${on?" on":""}`}
                      onClick={() => setUser(u => ({ ...u, diets: on ? (u.diets||[]).filter(x=>x!==d.id) : [...(u.diets||[]), d.id] }))}>
                      <div style={UI.flex1}>
                        <div style={UI.ufw700}>{d.label}</div>
                        <div style={UI.ufs10_cmuted_mt1}>{d.desc}</div>
                      </div>
                      {on && <div className="chip-check"><Icon name="check" size={9} color="var(--on-green)" /></div>}
                    </div>
                  );
                })}
              </div>
              {(user.diets||[]).length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setUser(u => ({...u, diets:[]}))}>Nulstil diæt</button>
              )}
            </div>

            <div className="card" style={UI.mb10}>
              <div className="card-lbl">Mine allergier / intolerancer</div>
              <div style={{ fontSize:11, color:"var(--muted)", marginBottom:10, lineHeight:1.4 }}>
                Tryk for at markere en allergi eller intolerance
              </div>
              <div className="chip-grid" style={UI.mb10}>
                {ALLERGENS.map(a => {
                  const on = allergens.includes(a.id);
                  return (
                    <div key={a.id} className="chip" style={{
                      background: on ? "var(--red-lt)" : "var(--surface)",
                      border: `1px solid ${on ? "var(--red)" : "var(--border)"}`,
                      color: on ? "var(--red)" : "var(--ink)",
                    }}
                      onClick={() => setAllergens(p => on ? p.filter(x => x !== a.id) : [...p, a.id])}>
                      <span style={UI.flex1}>{a.emoji} {a.label}</span>
                      {on && <div style={UI.redBadge9}><Icon name="check" size={9} color="#fff" /></div>}
                    </div>
                  );
                })}
              </div>
              <div className="card-lbl">Andre allergier</div>
              <div className="input-row" style={{ marginBottom: customAllerg.length ? 8 : 0 }}>
                <input className="field" placeholder="Fx. Fruktose…" value={customInput} onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if(e.key==="Enter"&&customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}} />
                <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}}>+</button>
              </div>
              {customAllerg.length > 0 && <div className="tags">{customAllerg.map((a,i) => <div key={i} className="tag" style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Icon name="edit" size={10} color="currentColor" /> {a}<span className="tag-x" role="button" aria-label={`Fjern "${a}"`} tabIndex={0}
                onClick={() => setCustomAllerg(c=>c.filter((_,j)=>j!==i))} onKeyDown={e => e.key === "Enter" && setCustomAllerg(c=>c.filter((_,j)=>j!==i))}>×</span></div>)}</div>}
            </div>

            {/* E-numre i rediger profil */}
            <div className="card" style={UI.mb10}>
              <div className="card-lbl">E-numre der undgås</div>
              <input className="field" placeholder="Søg E-nummer..." value={eSearch}
                onChange={e => setESearch(e.target.value)} style={UI.mb8} />
              <select className="field" value={eCategory} onChange={e => setECategory(e.target.value)} style={UI.mb8}>
                <option value="alle">Alle kategorier</option>
                {E_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label} ({c.range})</option>)}
              </select>
              <div style={UI.umxh320_ovyauto_bd1pxsolid_br8}>
                {Object.entries(E_NUMBERS).filter(([e,name]) => {
                  const matchSearch = !eSearch || e.toLowerCase().includes(eSearch.toLowerCase()) || name.toLowerCase().includes(eSearch.toLowerCase());
                  if (!matchSearch) return false;
                  if (eCategory==="alle") return true;
                  const cat = E_CATEGORIES.find(c=>c.id===eCategory);
                  const num = parseInt(e.replace(/[^0-9]/g,""));
                  return cat ? num>=cat.min && num<=cat.max : true;
                }).map(([e,name],i,arr) => {
                  const on = selectedENumbers.includes(e);
                  return (
                    <div key={e} onClick={() => setSelectedENumbers(p => on?p.filter(x=>x!==e):[...p,e])}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
                        borderBottom:i<arr.length-1?"1px solid var(--border)":"none",
                        background:on?"var(--red-lt)":"var(--surface)", cursor:"pointer" }}>
                      <div style={{ fontSize:12, fontWeight:800, color:on?"var(--red)":"var(--ink)", width:44 }}>{e}</div>
                      <div style={{ fontSize:11, color:on?"var(--red)":"var(--muted2)", flex:1, lineHeight:1.3 }}>{name}</div>
                      {on && <Icon name="check" size={13} color="var(--red)" />}
                    </div>
                  );
                })}
              </div>
              {selectedENumbers.length > 0 && (
                <div style={{ marginTop:8, fontSize:11, fontWeight:700, color:"var(--red)" }}>
                  {selectedENumbers.length} E-numre valgt
                </div>
              )}
            </div>

            <button className="btn btn-primary btn-full" style={UI.mb16}
              disabled={!user.name?.trim() || !user.birth_year || !user.gender || savingProfile}
              onClick={async () => {
                setSavingProfile(true);
                try {
                  // Flush en evt. ikke-tilføjet tekst i "Andre allergier"-feltet, så den ikke går tabt
                  const pendingCustom = customInput.trim();
                  const allCustom = pendingCustom ? [...customAllerg, pendingCustom] : customAllerg;
                  if (pendingCustom) { setCustomAllerg(allCustom); setCustomInput(""); }

                  await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
                    method:"PATCH",
                    headers:{ ...makeHeaders(accessToken), "Prefer":"return=minimal" },
                    body:JSON.stringify({
                      name:user.name, phone:user.phone||null,
                      birth_year:user.birth_year?parseInt(user.birth_year):null,
                      gender:user.gender||null, diets:user.diets||[],
                      e_numbers:selectedENumbers||[],
                    }),
                  });

                  // Samlet DELETE + én bulk-POST i stedet for et loop af enkelt-POSTs —
                  // ellers kan et fejlet kald midtvejs efterlade en delvist gemt liste
                  await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, { method:"DELETE", headers:makeHeaders(accessToken) });
                  const rows = [
                    ...allergens.map(a => ({ user_id:userId, allergen:a, type:"allergen" })),
                    ...allCustom.map(c => ({ user_id:userId, allergen:c, type:"custom" })),
                  ];
                  if (rows.length > 0) {
                    await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, { method:"POST", headers:{ ...makeHeaders(accessToken), "Prefer":"return=minimal" }, body:JSON.stringify(rows) });
                  }
                  setScreen(SCREENS.PROFILE);
                } catch (e) {
                  showToast("Fejl: " + e.message, "error");
                } finally {
                  setSavingProfile(false);
                }
              }}>{savingProfile ? "Gemmer…" : "Gem ændringer"}</button>
          </div>
        )}

        {screen === SCREENS.FAMILY && (
          <div className="screen fade-in">
            <div className="screen-title">Familie</div>
            <div className="screen-sub">Alle i din familie — dem du har oprettet en allergiprofil for, og dem med egen EatSafe-konto.</div>
            <div className="card" style={UI.up12px14px}>
              <div className="card-lbl">Aktive profiler ved scanning</div>
              <FamilyChips />
            </div>
            {family.length===0 && household.length===0 && <div className="empty-state"><span className="empty-icon"><Icon name="family" size={28} color="var(--muted)" /></span><div className="empty-txt">Ingen i familien endnu</div><div className="empty-sub">Tilføj fx et barn eller en partner for at scanne for dem, eller invitér en med egen konto</div></div>}
            {family.map(m => (
              <div key={`p-${m.id}`} className="family-member" style={editingMemberId === m.id ? { border:"1.5px solid var(--green)", background:"var(--green-selected-bg)" } : undefined}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:m.allergens.length?10:0 }}>
                  <div className="fm-avatar" style={{ background:m.color, color:"var(--ink)" }}>{initials(m.name)}</div>
                  <div style={UI.flex1}>
                    <div style={{ fontWeight:800, fontSize:15 }}>{m.name}</div>
                    <div style={UI.muted11mt2}>
                      {[m.birth_year && `${new Date().getFullYear() - m.birth_year} år`, m.gender, m.allergens.length && `${m.allergens.length} allergi${m.allergens.length!==1?"er":""}`, "Ingen egen konto"].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <button type="button" onClick={() => startEditMember(m)} aria-label={`Rediger ${m.name}`}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:"10px 6px", minHeight:44, fontFamily:"var(--f)", fontSize:12.5, fontWeight:700, color: editingMemberId === m.id ? "var(--green)" : "var(--muted2)" }}>
                    Rediger
                  </button>
                  <button type="button" onClick={() => removeMember(m.id)} aria-label={`Fjern ${m.name}`}
                    style={{ background:"none", border:"none", cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", opacity:.5, flexShrink:0 }}>
                    <Icon name="trash" size={18} color="var(--muted)" />
                  </button>
                </div>
                {m.allergens.length>0 && <div className="tags">{getAllergenLabels(m.allergens,m.custom||[]).map((a,j) => <div key={j} className="tag" style={{ fontSize:11 }}>{a}</div>)}</div>}
              </div>
            ))}
            {household.map(m => (
              <div key={`h-${m.id}`} className="family-member">
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div className="fm-avatar" style={{ background:"var(--green)", color:"var(--ink)" }}>{initials(m.name || m.email)}</div>
                  <div style={UI.flex1}>
                    <div style={{ fontWeight:800, fontSize:15 }}>{m.name || m.email}</div>
                    <div style={UI.muted11mt2}>
                      {["Egen EatSafe-konto", !m.canRemove && "Inviterede dig"].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {m.canRemove && (
                    <span style={{ cursor:"pointer", opacity:.35, fontSize:18, padding:4 }} aria-label={`Fjern ${m.name || m.email} fra familien`} role="button" tabIndex={0}
                      onClick={async () => {
                        if (!confirm(`Fjern ${m.name || m.email} fra din familie? I mister adgang til hinandens delte data.`)) return;
                        await apiCall(`${SUPABASE_URL}/functions/v1/family/group/${m.id}`, { method: "DELETE", headers: makeHeaders(accessToken) });
                        setHousehold(h => h.filter(x => x.id !== m.id));
                      }}
                      onKeyDown={async e => { if (e.key !== "Enter") return;
                        if (!confirm(`Fjern ${m.name || m.email} fra din familie? I mister adgang til hinandens delte data.`)) return;
                        await apiCall(`${SUPABASE_URL}/functions/v1/family/group/${m.id}`, { method: "DELETE", headers: makeHeaders(accessToken) });
                        setHousehold(h => h.filter(x => x.id !== m.id));
                      }}>
                      <Icon name="trash" size={18} color="var(--muted)" />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* ── Invitér familiemedlem via link ── */}
            <div className="card" style={UI.mb12}>
              <div style={{ ...UI.ufs13_fw800_cink_mb4, display:"flex", alignItems:"center", gap:6 }}>
                <Icon name="link" size={13} color="var(--ink)" /> Invitér med egen konto
              </div>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:12, lineHeight:1.5 }}>
                Send et link til et familiemedlem, der skal have sin egen EatSafe-konto. Når de opretter sig via linket, deles I automatisk scanninger, favoritter og indkøbslister.
              </div>

              {!inviteLink && (
                <button
                  onClick={async () => {
                    setInviteLoading(true);
                    setInviteError("");
                    try {
                      const data = await apiCall(
                        `${SUPABASE_URL}/rest/v1/family_invites`,
                        {
                          method: "POST",
                          headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
                          body: JSON.stringify({ invited_by: userId }),
                        }
                      );
                      if (Array.isArray(data) && data[0]?.token) {
                        setInviteLink(`https://eatsafe.dk/invite/${data[0].token}`);
                      } else {
                        setInviteError("Kunne ikke oprette invitation. Prøv igen.");
                      }
                    } catch {
                      setInviteError("Noget gik galt. Tjek din forbindelse.");
                    }
                    setInviteLoading(false);
                  }}
                  disabled={inviteLoading}
                  style={{ width:"100%", padding:"12px", background:"var(--green)", color:"var(--on-green)", border:"none", borderRadius:10, fontFamily:"var(--f)", fontSize:13, fontWeight:800, cursor:"pointer", opacity: inviteLoading ? .6 : 1 }}>
                  {inviteLoading ? "Opretter link…" : "Opret invitationslink"}
                </button>
              )}

              {inviteError && (
                <div style={{ fontSize:12, color:"var(--red)", marginTop:8 }}>{inviteError}</div>
              )}

              {inviteLink && (
                <div>
                  <div style={{ padding:"10px 12px", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:8, fontFamily:"monospace", fontSize:11, color:"var(--ink)", wordBreak:"break-all", marginBottom:8 }}>
                    {inviteLink}
                  </div>
                  <div style={UI.rowGap8}>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(inviteLink);
                        setInviteCopied(true);
                        setTimeout(() => setInviteCopied(false), 2000);
                      }}
                      style={{ flex:1, padding:"10px", background: inviteCopied ? "var(--green-lt)" : "var(--surface)", border:`1px solid ${inviteCopied ? "var(--green)" : "var(--border2)"}`, borderRadius:8, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color: inviteCopied ? "var(--green)" : "var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      <Icon name={inviteCopied ? "check" : "link"} size={12} color={inviteCopied ? "var(--green)" : "var(--ink)"} /> {inviteCopied ? "Kopieret!" : "Kopiér link"}
                    </button>
                    <button
                      onClick={() => navigator.share?.({ title:"EatSafe invitation", url: inviteLink })}
                      style={{ flex:1, padding:"10px", background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:8, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      <Icon name="share" size={12} color="var(--ink)" /> Del
                    </button>
                    <button
                      onClick={() => { setInviteLink(null); setInviteCopied(false); }}
                      style={{ padding:"10px 12px", background:"none", border:"1px solid var(--border)", borderRadius:8, fontFamily:"var(--f)", fontSize:12, color:"var(--muted)", cursor:"pointer" }}>
                      ×
                    </button>
                  </div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:8 }}>
                    ⏱ Linket udløber om 24 timer
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div className="card-title">{editingMemberId ? "Rediger familiemedlem" : "+ Tilføj uden egen konto"}</div>
                {editingMemberId && <TextLink onClick={cancelEditMember}>Annuller</TextLink>}
              </div>
              <MemberForm
                name={newMemberName} setName={setNewMemberName}
                birthYear={newMemberBirthYear} setBirthYear={setNewMemberBirthYear}
                gender={newMemberGender} setGender={setNewMemberGender}
                allergens={newMemberAllerg} setAllergens={setNewMemberAllerg}
                customAllerg={newMemberCustomAllerg} setCustomAllerg={setNewMemberCustomAllerg}
                subtypes={newMemberSubtypes} setSubtypes={setNewMemberSubtypes}
                diets={newMemberDiets} setDiets={setNewMemberDiets}
                eNumbers={newMemberENumbers} setENumbers={setNewMemberENumbers}
                customInput={newMemberCustomInput} setCustomInput={setNewMemberCustomInput}
                onAdd={editingMemberId ? updateMember : addMember}
                addLabel={editingMemberId ? "Gem ændringer" : "+ Tilføj familiemedlem"}
              />
            </div>
          </div>
        )}
    </>
  );
}
