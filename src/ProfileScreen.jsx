// @ts-nocheck
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ALLERGENS, SCREENS, DIETS, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { initials, timeAgo, getAllergenLabels, makeHeaders, apiCall, buildActiveProfileList, computeProfileResults, extractENumbers } from "./helpers.js";
import { EatSafeLogo, Icon, ProductImage, showToast, ConfirmDialog } from "./SharedComponents.jsx";
import { MemberForm, CategorySelect } from "./MemberForm.jsx";
import { TextLink, Accordion } from "./DesignSystem.jsx";
import { ENumberPicker, AllergenChipPicker, DietChipPicker, useGlutenFreeSync } from "./AllergenPicker.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";
import { useAdminContext } from "./AdminContext.jsx";
import { useFamilyFormContext } from "./FamilyFormContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";

// ── Historik/Favoritter: status-sprog, kompakt filter ───────────────────────
// Samme grøn/rød/orange-farvesprog og ikon+tekst+farve-mønster som
// Indkøbslistens itemStatus (ListScreen.jsx) — én kilde til hvad "Konflikt"/
// "Kan ikke afgøres sikkert"/"Matcher" betyder på tværs af appen, ikke en
// selvstændig kopi af logikken. Delt mellem Historik og Favoritter (26.
// sept. 2026, opfølgning) — samme tekst/farve/ikon uanset hvilken skærm der
// viser statussen. "not_found" er specifikt for Historik (et scan der ikke
// gav noget produkt at vurdere) og findes ikke i Indkøbslisten/Favoritter.
const STATUS_COLOR = { danger:"var(--red)", warn:"var(--amber)", safe:"var(--green)", not_found:"var(--muted)" };
const STATUS_ICON  = { danger:"warning", warn:"warning", safe:"check", not_found:"info" };
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

// ── Favoritter: kategoriser-bottom sheet ─────────────────────────────────────
// Erstatter det tidligere inline "Flyt til kategori"-panel, der udvidede
// selve produktkortet (26. sept. 2026, brugerfeedback: "lad ikke produkt-
// kortet udvide sig inline"). Samme underliggende data-model som før — ÉN
// kategori pr. favorit, ikke en liste (setFavoriteCategory(ean, category)) —
// så "tilføj til/fjern fra en kategori" her betyder vælge/fravælge kategorien,
// ikke et multi-select. Gemmer DIREKTE ved tryk (samme øjeblikkelige
// gem-mønster som det tidligere inline-panel allerede brugte). Sheetet
// lukker IKKE længere sig selv efter hvert valg (26. sept. 2026, opfølgning:
// "trykker man på den valgte kategori igen, skal varen fjernes, og
// checkmarken skal forsvinde STRAKS") — `favorite` sendes nu ind som det
// FRISKE, live objekt fra `favorites`-arrayet (se kaldsstedet), ikke et
// frosset øjebliksbillede taget da sheetet blev åbnet, så checkmarken altid
// afspejler den nyeste tilstand med det samme, uden at sheetet behøver
// genåbnes. Brugeren lukker selv via ×/baggrundstryk når de er færdige.
// Samme portal-/bottom-sheet-mønster som ShareSheet (ListScreen.jsx) og
// ConfirmDialog (SharedComponents.jsx) — MEN via createPortal til
// document.body (26. sept. 2026, opfølgning: "bundnavigationen lå ovenpå/
// foran sheetet, Ny kategori/Opret var ikke fuldt synlige"). Roden er det
// kendte .screen.fade-in-mønster (se CLAUDE.md afsnit 3): fade-in-
// animationens efterladte transform gør .screen til et CSS "containing
// block" for position:fixed-børn, så en fixed sheet renderet INDE i skærmen
// (som denne var) positioneres relativt til SKÆRMENS boks i stedet for det
// virkelige viewport — det forklarer både hvorfor bundnav'en (som ER fixed
// til det rigtige viewport) kunne ligge foran, og hvorfor sheetets bund
// kunne klippes af. Samme løsning som ListPickerSheet/ProfileMenu.jsx
// allerede bruger: portal til document.body.
function FavoriteCategorySheet({ favorite, existingCategories, onSetCategory, onClose }) {
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const createCategory = () => {
    const name = newCategoryInput.trim();
    if (!name) return;
    onSetCategory(name);
    setNewCategoryInput("");
  };
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.5)" }} onClick={onClose}>
      {/* Bund-padding inkluderer env(safe-area-inset-bottom) (26. sept.
          2026, opfølgning: "Ny kategori/Opret skal altid have korrekt
          safe-area padding nederst") — samme additive mønster som
          .bottom-nav allerede bruger (calc(24px + env(...))), så "Opret"-
          knappen aldrig ender under enhedens home-indikator/safe-area. */}
      <div style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"20px 16px calc(28px + env(safe-area-inset-bottom))", position:"absolute", left:0, right:0, bottom:0, maxHeight:"75vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={UI.rowBetweenMb16}>
          {/* "Kategorisér favorit" → "Kategorier" (26. sept. 2026,
              brugerfeedback: "renere — brugeren kan allerede se produkt-
              navnet nedenunder og forstår handlingen"). Produktnavnet
              herunder er UÆNDRET. */}
          <div style={UI.ufs18_fw900_cink}>Kategorier</div>
          <button onClick={onClose} aria-label="Luk"
            style={{ background:"var(--surface)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--ink)" }}>×</button>
        </div>
        <div style={{ fontSize:12.5, color:"var(--muted)", marginBottom:16 }}>{favorite.name || "Ukendt produkt"}</div>

        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
          {existingCategories.length === 0 && (
            <div style={{ fontSize:12, color:"var(--muted)" }}>Ingen kategorier oprettet endnu — opret den første nedenfor.</div>
          )}
          {existingCategories.map(cat => {
            const selected = favorite.category === cat;
            return (
              <div key={cat} onClick={() => onSetCategory(selected ? null : cat)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", borderRadius:10, cursor:"pointer",
                  background: selected ? "var(--green-selected-bg)" : "var(--surface)", border:`1px solid ${selected ? "var(--green)" : "var(--border)"}` }}>
                <span style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:700, color: selected ? "var(--green)" : "var(--ink)" }}>
                  <Icon name="tag" size={13} color={selected ? "var(--green)" : "var(--muted)"} /> {cat}
                </span>
                {selected && <Icon name="check" size={14} color="var(--green)" />}
              </div>
            );
          })}
        </div>

        <div className="input-row">
          <input className="field" placeholder="Ny kategori…" value={newCategoryInput}
            onChange={e => setNewCategoryInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createCategory(); }} />
          {/* Disabled indtil der reelt står noget i feltet (26. sept. 2026,
              brugerfeedback) — .btn:disabled (theme.jsx) giver allerede
              den dæmpede, ikke-klikbare stil resten af appen bruger. */}
          <button className="btn btn-primary btn-sm" style={UI.uwsnowrap} disabled={!newCategoryInput.trim()} onClick={createCategory}>Opret</button>
        </div>
      </div>
    </div>,
    document.body
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

  // Udtrukket til en selvstændig, genanvendelig funktion (26. sept. 2026,
  // Familie-redesign) — kaldes både ved appstart, ved hvert besøg på
  // Familie-fanen, af det periodiske "opdater automatisk"-tjek mens man er
  // der, og lige efter en vellykket "Kobl til eksisterende profil"-handling
  // (så de nyligt overførte allergener/kostpræferencer/E-numre vises straks).
  const loadHousehold = () => {
    if (!accessToken) return;
    setHouseholdLoading(true);
    return apiCall(`${SUPABASE_URL}/functions/v1/family/group`, { headers: makeHeaders(accessToken) })
      .then(data => { if (data?.success) setHousehold(data.members || []); })
      .catch(() => {})
      .finally(() => setHouseholdLoading(false));
  };

  useEffect(() => {
    loadHousehold();
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps
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
    allergenSubtypes, setAllergenSubtypes,
    selectedENumbers, setSelectedENumbers,
    activeSubtypeModal, setActiveSubtypeModal,
  } = useAllergenPrefsContext();
  // "Rediger præferencer" (28. sept. 2026, Profil-restrukturering) — samme
  // delte gluten↔glutenfri-sync-hook som onboarding/MemberForm bruger (se
  // AllergenPicker.jsx), og samme lukket-som-standard Accordion-mønster for
  // E-numre som MemberForm allerede bruger for familiemedlemmer.
  const [showENumre, setShowENumre] = useState(false);
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
  const [inviteId, setInviteId] = useState(null); // gemmes fra oprettelsen, så "Annullér link" kan slette den rigtige række
  const [inviteLoading, setInviteLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  // ── Familie-redesign (26. sept. 2026): "+ Tilføj familiemedlem" viser først
  // et valg mellem de to tilføjelses-måder, i stedet for at have et stort
  // formular-kort (eller invitationskortet) permanent udfoldet — se
  // CLAUDE.md's Familie-redesign-note. null = kun "+"-knappen synlig,
  // "choose" = de to valg, "form" = MemberForm (genbruges uændret),
  // "invite" = invitations-panelet.
  const [familyAddMode, setFamilyAddMode] = useState(null);
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState(null); // administreret profil, der afventer "Slet profil"-bekræftelse
  const [confirmRemoveHousehold, setConfirmRemoveHousehold] = useState(null); // rigtig konto, der afventer "Fjern fra familien"-bekræftelse
  const [linkPickerFor, setLinkPickerFor] = useState(null); // husstandsmedlems id — åbner "Kobl til en administreret profil"-vælgeren for netop den række
  const [expandedChipsFor, setExpandedChipsFor] = useState([]); // række-nøgler hvor "+N" er trykket, så alle chips vises i stedet for kun de første

  // ── Ventende invitationer (26. sept. 2026, Familie-redesign) ────────────────
  // Selve invitations-OPRETTELSEN sker stadig i "Invitér med egen konto"-
  // panelet nedenfor, men en invitation, der allerede er sendt (og endnu ikke
  // accepteret eller udløbet), skal også kunne ses direkte i familie-
  // oversigten med status "Invitation afventer" — uden at man behøver åbne
  // panelet igen for at kunne kopiere/dele linket igen eller annullere det.
  const [pendingInvites, setPendingInvites] = useState([]);
  const loadPendingInvites = () => {
    if (!accessToken || !userId) return;
    apiCall(`${SUPABASE_URL}/rest/v1/family_invites?invited_by=eq.${userId}&status=eq.pending&order=created_at.desc&select=id,token,expires_at`, { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } })
      .then(data => { if (Array.isArray(data)) setPendingInvites(data.filter(i => new Date(i.expires_at) > new Date())); })
      .catch(() => {});
  };

  // Familie-siden skal "opdatere automatisk" når en invitation bliver
  // accepteret, uden at brugeren selv skal genindlæse — der er ingen
  // realtime-kanal for family_invites/husstanden (kun Indkøbslisten har det,
  // se useShoppingList.js), så et let periodisk tjek mens man rent faktisk
  // ser på Familie-fanen er en proportional løsning i stedet for at bygge en
  // ny WebSocket-kanal til en hændelse der sker sjældent (én gang pr.
  // invitation). Genindlæser også med det samme ved hvert besøg på fanen,
  // samme mønster som Historik-fanens auto-opdatering ovenfor.
  useEffect(() => {
    if (screen !== SCREENS.FAMILY || !accessToken) return;
    loadHousehold();
    loadPendingInvites();
    const interval = setInterval(() => { loadHousehold(); loadPendingInvites(); }, 12000);
    return () => clearInterval(interval);
  }, [screen, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scanningsrelevante chips (allergier → kostpræferencer → E-numre) ───────
  // Fælles for administrerede profiler OG rigtige husstandskonti (26. sept.
  // 2026, Familie-redesign: "brugeren skal med ét blik kunne se, hvad
  // profilen faktisk bliver kontrolleret imod ved scanning" gælder alle
  // familiemedlemmer). Rækkefølgen er bevidst — allergier/intolerancer først
  // (vigtigst for sikkerheden), så kostpræferencer, så overvågede E-numre.
  const CHIP_VISIBLE_LIMIT = 4;
  const buildMemberChips = (m) => [
    ...getAllergenLabels(m.allergens || [], m.custom || []).map(text => ({ text, variant:"allergy" })),
    ...(m.diets || []).map(id => DIETS.find(d => d.id === id)?.label).filter(Boolean).map(text => ({ text, variant:"diet" })),
    ...(m.eNumbers || []).map(text => ({ text, variant:"enumber" })),
  ];
  // Allergi-chips bruger den eksisterende, delte .tag-klasse uændret (grøn
  // selected-chip). Kostpræferencer får en diskret, lysere grøn/neutral
  // variant, E-numre en helt neutral variant — ingen nye, stærke farver,
  // kun eksisterende designsystem-tokens.
  const CHIP_VARIANT_STYLE = {
    diet: { background:"var(--green-selected-bg)", borderColor:"var(--border)", color:"var(--ink2)" },
    enumber: { background:"var(--surface2)", borderColor:"var(--border)", color:"var(--ink2)" },
  };
  const renderMemberChips = (m, rowKey) => {
    const chips = buildMemberChips(m);
    if (chips.length === 0) return null;
    const expanded = expandedChipsFor.includes(rowKey);
    const visible = expanded ? chips : chips.slice(0, CHIP_VISIBLE_LIMIT);
    const overflow = chips.length - visible.length;
    return (
      <div className="tags">
        {visible.map((c,j) => <div key={j} className="tag" style={{ fontSize:11, ...CHIP_VARIANT_STYLE[c.variant] }}>{c.text}</div>)}
        {overflow>0 && (
          <button type="button" onClick={() => setExpandedChipsFor(f => [...f, rowKey])}
            className="tag" style={{ fontSize:11, color:"var(--muted)", background:"var(--surface2)", borderColor:"var(--border)", cursor:"pointer", fontFamily:"var(--f)" }}>
            +{overflow}
          </button>
        )}
      </div>
    );
  };

  // ── Undgå dubletter: kobl en administreret profil til en rigtig konto ──────
  // (26. sept. 2026, Familie-redesign). Bevidst en eksplicit handling
  // husstandens administrator selv vælger — ikke et automatisk navne-match,
  // som let kunne koble den forkerte profil sammen. Overfører data server-
  // side (se supabase/functions/family/index.ts's link-profile-endpoint) og
  // fjerner derefter den nu overflødige administrerede profil lokalt.
  const linkManagedProfile = async (managedMemberId, targetUserId) => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/family/link-profile`, {
        method: "POST",
        headers: { ...makeHeaders(accessToken), "Content-Type": "application/json" },
        body: JSON.stringify({ managed_member_id: managedMemberId, target_user_id: targetUserId }),
      });
      if (data?.success) {
        setFamily(f => f.filter(x => x.id !== managedMemberId));
        setLinkPickerFor(null);
        showToast("Profilerne er koblet sammen");
        loadHousehold();
      } else {
        showToast("Kunne ikke koble profilerne sammen. Prøv igen.", "error");
      }
    } catch {
      showToast("Noget gik galt. Tjek din forbindelse.", "error");
    }
  };

  // ── Favoritter: kategori-filter + kategoriser-sheet ─────────────────────────
  // `categorizingEan` holder EAN'et for favoritten sheeten er åben for (null
  // = lukket) — kun selve identifikatoren, IKKE favorit-objektet selv (26.
  // sept. 2026, opfølgning: sheetet skal vise checkmarken forsvinde STRAKS
  // når man fravælger en kategori, uden at skulle lukkes/genåbnes — det
  // kræver at sheetet altid får det FRISKESTE favorit-objekt fra
  // `favorites`-arrayet på hvert render, se categorizingFavorite nedenfor,
  // ikke et frosset øjebliksbillede taget da sheetet blev åbnet).
  const [favoriteCategoryFilter, setFavoriteCategoryFilter] = useState("all");
  const [categorizingEan, setCategorizingEan] = useState(null);
  const categorizingFavorite = categorizingEan ? favorites.find(f => f.ean === categorizingEan) : null;

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

  // ── Favoritter: samme statuslogik som Indkøbslisten/Historik, ud fra de
  // NUVÆRENDE aktive profiler (26. sept. 2026, brugerfeedback) — en favorit
  // er et løbende gemt produkt, ikke et fastfrosset øjebliksbillede som en
  // historik-scanning, så "relevant EatSafe-status" betyder her "er det
  // sikkert for hvem jeg har valgt LIGE NU", ikke hvem der var valgt dengang
  // produktet blev gemt. `product_snapshot` (gemt af toggleFavorite ud fra
  // det fulde scanResult, se ResultScreen.jsx) indeholder allerede
  // allergen_flags/ingredienser/E-numre — ingen ekstra opslag nødvendigt.
  const activeProfileList = buildActiveProfileList({ user, family, allergens, customAllerg, selectedENumbers, activeProfiles });
  const favoriteStatus = (f) => {
    if (activeProfileList.length === 0 || !f.allergen_flags) return null;
    const ingredientsText = f.ingredients || f.ingredients_text || "";
    const results = computeProfileResults(activeProfileList, {
      allergen_flags: f.allergen_flags, ingredients: ingredientsText, nutrition: f.nutrition,
      productENumbers: f.productENumbers?.length ? f.productENumbers : extractENumbers(ingredientsText),
    });
    const dangerNames = results.filter(r => r.status === "danger").map(r => r.name.split(" ")[0]);
    if (dangerNames.length > 0) {
      return { status:"danger", text: dangerNames.length <= 2 ? `Konflikt for ${dangerNames.join(", ")}` : "Passer ikke til valgte profiler" };
    }
    if (results.some(r => r.status === "warn")) return { status:"warn", text:"Kan ikke afgøres sikkert" };
    return { status:"safe", text:"Matcher valgte profiler" };
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
                        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3, fontSize:11, fontWeight:700, color: STATUS_COLOR[d.status] }}>
                          <Icon name={STATUS_ICON[d.status]} size={11} color="currentColor" />
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
                <button onClick={() => setScreen(SCREENS.EDITPREFERENCES)}
                  style={{ background:"var(--green-lt)", border:"none", borderRadius:8, padding:"4px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--green)", cursor:"pointer" }}>
                  Rediger
                </button>
              </div>
              {allergens.length + customAllerg.length + (selectedENumbers?.length || 0) + (user?.diets?.length || 0) === 0
                ? <div style={{ textAlign:"center", padding:"16px 0" }}><div style={{ marginBottom:8, display:"flex", justifyContent:"center" }}><Icon name="info" size={30} color="var(--muted)" /></div><div style={{ fontSize:13, color:"var(--muted)", marginBottom:10 }}>Ingen præferencer registreret endnu</div><button className="btn btn-outline btn-sm" onClick={() => setScreen(SCREENS.EDITPREFERENCES)}>Tilføj allergener</button></div>
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
                  <div style={UI.boldInk13}>Husstand</div>
                  <div style={UI.muted11mt2}>
                    {householdLoading
                      ? "Henter…"
                      : (family.length + household.length) === 0
                        ? "Ingen medlemmer endnu"
                        : `${family.length + household.length} medlem${family.length + household.length === 1 ? "" : "mer"}`}
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
            {/* Venstrestillet som Historik/Indkøbslisten (26. sept. 2026,
                opfølgning) — samme scopede inline-override af den delte,
                ellers centrerede .screen-title-klasse, ikke en ændring af
                selve klassen. Fjernet et lille, ægte tastefejl (et
                foranstillet mellemrum før "Favoritter"). */}
            <div className="screen-title" style={{ textAlign:"left", width:"auto" }}>Favoritter</div>

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

            {/* "Senest scannet" er FJERNET (26. sept. 2026, brugerfeedback:
                "seneste scanninger hører kun hjemme under Historik") —
                Favoritter viser nu udelukkende gemte favoritter. */}

            {favorites.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon"><Icon name="heart" size={26} color="var(--muted)" /></span>
                <div className="empty-txt">Ingen favoritter endnu</div>
                <div className="empty-sub">Tryk på hjertet ved et produkt for at gemme det her.</div>
              </div>
            )}

            {favorites.length > 0 && (() => {
              const existingCategories = [...new Set(favorites.map(f => f.category).filter(Boolean))].sort();
              // Flad liste + filterchips i stedet for grupperede, kollapsbare
              // sektioner (26. sept. 2026, brugerfeedback: "lad ikke produkt-
              // kortet udvide sig inline" + "eksisterende kategorier som
              // filterchips øverst") — kun vist hvis brugeren faktisk har
              // oprettet mindst én kategori.
              const visibleFavorites = favoriteCategoryFilter === "all"
                ? favorites
                : favorites.filter(f => f.category === favoriteCategoryFilter);
              return (
                <>
                  {existingCategories.length > 0 && (
                    <div style={{ ...UI.wrapGap7, marginBottom:12 }}>
                      <div className={`filter-chip${favoriteCategoryFilter==="all"?" active":""}`} onClick={() => setFavoriteCategoryFilter("all")}>Alle</div>
                      {existingCategories.map(cat => (
                        <div key={cat} className={`filter-chip${favoriteCategoryFilter===cat?" active":""}`} onClick={() => setFavoriteCategoryFilter(cat)}>{cat}</div>
                      ))}
                    </div>
                  )}
                  {visibleFavorites.map((f,i) => {
                    const st = favoriteStatus(f);
                    const metaLine = [f.brand, favoritesScope==="family" && !f.savedByMe && f.savedBy ? `Gemt af ${f.savedBy.split(" ")[0]}` : null].filter(Boolean).join(" · ");
                    // 14px lodret padding (op fra 12px, næste trin på
                    // spacing-skalaen) — Favoritter-rækker er 3 linjer høje
                    // (navn/mærke/status) mod Historiks typisk 2, så lidt
                    // mere luft holder listen let at scanne med mange gemte
                    // varer (26. sept. 2026, opfølgning). .hist-rows egen
                    // bund-kant-divider (theme.jsx) er uændret og giver
                    // fortsat den visuelle adskillelse mellem rækker.
                    return (
                      <div key={f.ean || f.id || i} className="hist-row" style={{ padding:"14px 0", cursor:"pointer" }}
                        onClick={() => lookupProduct(f.ean || f.code || f.id)}>
                        <ProductImage product={f} size={44} />
                        <div className="hist-info" style={{ marginLeft:8 }}>
                          <div className="hist-name">{f.name || "Ukendt produkt"}</div>
                          {metaLine && <div className="hist-time">{metaLine}</div>}
                          {/* Altid ikon + tekst + farve, aldrig farve alene — samme
                              statussprog som Indkøbslisten/Historik, ALDRIG
                              "Farlig" (26. sept. 2026, brugerfeedback). */}
                          {st && (
                            <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3, fontSize:11, fontWeight:700, color: STATUS_COLOR[st.status] }}>
                              <Icon name={STATUS_ICON[st.status]} size={11} color="currentColor" />
                              {st.text}
                            </div>
                          )}
                        </div>
                        {f.savedByMe !== false && (
                          <div style={{ display:"flex", gap:2, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                            <button className="btn btn-ghost btn-sm" style={{ padding:"6px" }} aria-label={`Kategorisér "${f.name || "produkt"}"`}
                              onClick={() => setCategorizingEan(f.ean)}>
                              <Icon name="tag" size={14} color="var(--ink2)" />
                            </button>
                            {/* Samme skraldespand-ikon som resten af EatSafe bruger
                                til at fjerne noget (fx Familie/Indkøbsliste) — det
                                tidligere × var en selvstændig, anden ikonografi for
                                samme handling (26. sept. 2026, brugerfeedback:
                                "samme handling skal altid have samme ikonografi"). */}
                            <button className="btn btn-ghost btn-sm" style={{ padding:"6px" }} aria-label={`Fjern "${f.name || "produkt"}" fra favoritter`}
                              onClick={() => toggleFavorite(f)}>
                              <Icon name="trash" size={14} color="var(--muted)" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })()}

            {categorizingFavorite && (
              <FavoriteCategorySheet
                favorite={categorizingFavorite}
                existingCategories={[...new Set(favorites.map(f => f.category).filter(Boolean))].sort()}
                onSetCategory={(cat) => setFavoriteCategory(categorizingFavorite.ean, cat)}
                onClose={() => setCategorizingEan(null)}
              />
            )}
          </div>
        )}

        {/* "Rediger profil" — KUN personlige konto-/profiloplysninger (28.
            sept. 2026, Profil-restrukturering, krav 1). Alder/køn er
            fjernet helt herfra: EatSafe bruger dem intetsteds til en reel
            funktion (kun til visning i familie-rækker/adminpanelet), så de
            hører ikke hjemme som obligatoriske felter på selve kontoen.
            Ingen allergier/intolerancer/diæter/E-numre/husstand her længere
            — det er nu "Rediger præferencer" nedenfor. */}
        {screen === SCREENS.EDITPROFILE && (
          <div className="screen fade-in">
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 0 20px" }}>
              <div style={UI.ufs18_fw800_cink}>Rediger profil</div>
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
              {!user.name?.trim() && (
                <div style={UI.ufs11_cmuted_mb10}>
                  <span style={UI.red}>*</span> Navn er obligatorisk
                </div>
              )}
            </div>

            <button className="btn btn-primary btn-full" style={UI.mb16}
              disabled={!user.name?.trim() || savingProfile}
              onClick={async () => {
                setSavingProfile(true);
                try {
                  await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
                    method:"PATCH",
                    headers:{ ...makeHeaders(accessToken), "Prefer":"return=minimal" },
                    body:JSON.stringify({ name:user.name, phone:user.phone||null }),
                  });
                  setScreen(SCREENS.PROFILE);
                } catch (e) {
                  showToast("Fejl: " + e.message, "error");
                } finally {
                  setSavingProfile(false);
                }
              }}>{savingProfile ? "Gemmer…" : "Gem ændringer"}</button>
          </div>
        )}

        {/* "Rediger præferencer" — KUN allergier/intolerancer/diæter/
            E-numre (28. sept. 2026, Profil-restrukturering, krav 2-3).
            Genbruger PRÆCIS de samme delte komponenter som onboarding og
            MemberForm.jsx (AllergenChipPicker/DietChipPicker/ENumberPicker,
            samme grønne valgt-state/ikoner/labels — ikke en tredje,
            selvstændig kopi af samme data/UI), og redigeres direkte på én
            side i stedet for et trin-for-trin-flow. Eksisterende valg er
            allerede forudmarkeret, da komponenterne får den samme, delte
            state (allergens/customAllerg/user.diets/selectedENumbers) som
            profilens egen oversigt viser. */}
        {screen === SCREENS.EDITPREFERENCES && (
          <div className="screen fade-in">
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 0 20px" }}>
              <div style={UI.ufs18_fw800_cink}>Rediger præferencer</div>
            </div>

            <div className="card" style={UI.mb10}>
              <div className="card-lbl" style={UI.mb8}>Allergier / intolerancer</div>
              <AllergenChipPicker selected={allergens} onChange={setAllergens} />

              <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)" }}>
                <div style={UI.sectionLbl6}>Mangler din allergi eller intolerance?</div>
                <div className="input-row" style={{ marginTop:6, marginBottom: customAllerg.length ? 8 : 0 }}>
                  <input className="field" placeholder='Skriv fx "Fruktose"…' value={customInput} onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => { if(e.key==="Enter"&&customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}} />
                  <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}}>+</button>
                </div>
                {customAllerg.length > 0 && (
                  <div className="tags">
                    {customAllerg.map((a,i) => (
                      <div key={i} className="tag">{a}<span className="tag-x" role="button" aria-label={`Fjern "${a}"`} tabIndex={0}
                        onClick={() => setCustomAllerg(c=>c.filter((_,j)=>j!==i))} onKeyDown={e => e.key === "Enter" && setCustomAllerg(c=>c.filter((_,j)=>j!==i))}>×</span></div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={UI.mb10}>
              <div className="card-lbl" style={UI.mb8}>Kostpræferencer</div>
              <DietChipPicker selected={user.diets || []}
                autoNote={glutenFreeAutoApplied ? { id:"gluten-free", text:"Valgt ud fra gluten" } : undefined}
                onChange={arr => {
                  if (arr.includes("gluten-free") !== (user.diets||[]).includes("gluten-free")) setGlutenFreeAutoApplied(false);
                  setUser(u => ({ ...u, diets: arr }));
                }} />
            </div>

            <div className="card" style={UI.mb10}>
              <Accordion label="Overvåg specifikke E-numre" count={selectedENumbers.length}
                open={showENumre} onToggle={() => setShowENumre(s => !s)}>
                <div style={UI.mt8}>
                  <ENumberPicker selected={selectedENumbers} onChange={setSelectedENumbers} />
                </div>
              </Accordion>
            </div>

            <button className="btn btn-primary btn-full" style={UI.mb16}
              disabled={savingProfile}
              onClick={async () => {
                setSavingProfile(true);
                try {
                  // Flush en evt. ikke-tilføjet tekst i "Skriv selv"-feltet, så den ikke går tabt
                  const pendingCustom = customInput.trim();
                  const allCustom = pendingCustom ? [...customAllerg, pendingCustom] : customAllerg;
                  if (pendingCustom) { setCustomAllerg(allCustom); setCustomInput(""); }

                  await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
                    method:"PATCH",
                    headers:{ ...makeHeaders(accessToken), "Prefer":"return=minimal" },
                    body:JSON.stringify({ diets:user.diets||[], e_numbers:selectedENumbers||[] }),
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
            <div className="screen-sub">Alle i din familie — både profiler du administrerer, og personer med egen EatSafe-konto.</div>
            {/* "Aktive profiler ved scanning" er fjernet herfra (26. sept.
                2026, Familie-redesign) — hvem der scannes for styres
                allerede af "Scanner for"-vælgeren på Scan-forsiden (samme
                FamilyChips-mønster, se ScannerScreen.jsx/App.jsx). Familie-
                siden skal være en ren husstands-oversigt, ikke endnu et
                sted at vælge scanner-profil. En evt. "Standardprofiler ved
                scanning"-indstilling hører til under Indstillinger, ikke
                her — ikke bygget i denne omgang. */}
            {family.length===0 && household.length===0 && pendingInvites.length===0 && <div className="empty-state"><span className="empty-icon"><Icon name="family" size={28} color="var(--muted)" /></span><div className="empty-txt">Ingen i familien endnu</div><div className="empty-sub">Tilføj fx et barn eller en partner for at scanne for dem, eller invitér en med egen konto</div></div>}
            {family.map(m => (
              <div key={`p-${m.id}`} className="family-member" style={editingMemberId === m.id ? { border:"1.5px solid var(--green)", background:"var(--green-selected-bg)" } : undefined}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div className="fm-avatar" style={{ background:m.color, color:"var(--ink)" }}>{initials(m.name)}</div>
                  <div style={UI.flex1}>
                    <div style={{ fontWeight:800, fontSize:15 }}>{m.name}</div>
                    <div style={UI.muted11mt2}>
                      {[m.birth_year && `${new Date().getFullYear() - m.birth_year} år`, m.gender, "Administreret profil"].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <button type="button" onClick={() => { setFamilyAddMode(null); startEditMember(m); }} aria-label={`Rediger ${m.name}`}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:"10px 6px", minHeight:44, fontFamily:"var(--f)", fontSize:12.5, fontWeight:700, color: editingMemberId === m.id ? "var(--green)" : "var(--muted2)" }}>
                    Rediger
                  </button>
                  <button type="button" onClick={() => setConfirmDeleteProfile(m)} aria-label={`Slet profilen for ${m.name}`}
                    style={{ background:"none", border:"none", cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", opacity:.5, flexShrink:0 }}>
                    <Icon name="trash" size={18} color="var(--muted)" />
                  </button>
                </div>
                {renderMemberChips(m, `p-${m.id}`)}
              </div>
            ))}
            {household.map(m => (
              <div key={`h-${m.id}`} className="family-member">
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div className="fm-avatar" style={{ background:"var(--green)", color:"var(--ink)" }}>{initials(m.name || m.email)}</div>
                  <div style={UI.flex1}>
                    <div style={{ fontWeight:800, fontSize:15 }}>{m.name || m.email}</div>
                    <div style={UI.muted11mt2}>
                      {["Egen EatSafe-konto", !m.canRemove && "Inviterede dig"].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {m.canRemove && (
                    <button type="button" onClick={() => setConfirmRemoveHousehold(m)} aria-label={`Fjern ${m.name || m.email} fra familien`}
                      style={{ background:"none", border:"none", cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", opacity:.5, flexShrink:0 }}>
                      <Icon name="trash" size={18} color="var(--muted)" />
                    </button>
                  )}
                </div>
                {renderMemberChips(m, `h-${m.id}`)}
                {/* Undgå dubletter (26. sept. 2026, Familie-redesign, afsnit
                    9): hvis personen tidligere var en administreret profil,
                    man selv oprettede, og nu har fået sin egen konto, kan
                    de to slås sammen i stedet for at stå som to separate
                    rækker. Kun tilgængelig for den, der administrerer denne
                    husstandsforbindelse (samme canRemove-afgrænsning som
                    fjernelses-handlingen), og kun når der reelt er en
                    administreret profil at vælge imellem. */}
                {m.canRemove && family.length > 0 && linkPickerFor !== m.id && (
                  <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid var(--border)" }}>
                    <TextLink onClick={() => setLinkPickerFor(m.id)}>Kobl til en administreret profil</TextLink>
                  </div>
                )}
                {linkPickerFor === m.id && (
                  <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid var(--border)" }}>
                    <div style={{ fontSize:11.5, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>
                      Vælg hvilken administreret profil der er {m.name || m.email} — allergier, kostpræferencer og E-numre overføres, og den administrerede profil fjernes.
                    </div>
                    {family.map(p => (
                      <button key={p.id} type="button" onClick={() => linkManagedProfile(p.id, m.id)}
                        style={{ display:"flex", alignItems:"center", gap:8, width:"100%", textAlign:"left", cursor:"pointer", fontFamily:"var(--f)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 10px", marginBottom:6 }}>
                        <div className="fm-avatar" style={{ width:26, height:26, fontSize:11, background:p.color, color:"var(--ink)" }}>{initials(p.name)}</div>
                        <span style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{p.name}</span>
                      </button>
                    ))}
                    <TextLink onClick={() => setLinkPickerFor(null)}>Fortryd</TextLink>
                  </div>
                )}
              </div>
            ))}
            {pendingInvites.filter(inv => inv.id !== inviteId).map(inv => (
              <div key={`inv-${inv.id}`} className="family-member">
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div className="fm-avatar" style={{ background:"var(--surface2)" }}><Icon name="link" size={16} color="var(--muted2)" /></div>
                  <div style={UI.flex1}>
                    <div style={{ fontWeight:800, fontSize:15 }}>Invitation afventer</div>
                    <div style={UI.muted11mt2}>Udløber {new Date(inv.expires_at).toLocaleDateString("da-DK")}</div>
                  </div>
                </div>
                <div style={{ ...UI.rowGap8, marginTop:10 }}>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(`https://eatsafe.dk/invite/${inv.token}`); showToast("Invitationslink kopieret"); }}
                    style={{ flex:1, padding:"10px", background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:8, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <Icon name="link" size={12} color="var(--ink)" /> Kopiér invitationslink
                  </button>
                  <button
                    onClick={() => navigator.share?.({ title:"EatSafe invitation", url:`https://eatsafe.dk/invite/${inv.token}` })}
                    style={{ flex:1, padding:"10px", background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:8, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <Icon name="share" size={12} color="var(--ink)" /> Del igen
                  </button>
                </div>
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
                  <TextLink onClick={async () => {
                    try {
                      await apiCall(`${SUPABASE_URL}/rest/v1/family_invites?id=eq.${inv.id}`, { method:"DELETE", headers: makeHeaders(accessToken) });
                      setPendingInvites(p => p.filter(x => x.id !== inv.id));
                    } catch {
                      showToast("Kunne ikke annullere invitationen. Prøv igen.", "error");
                    }
                  }}>Annullér invitation</TextLink>
                </div>
              </div>
            ))}

            {/* ── Tilføj familiemedlem — enkelt "+"-handling, der først viser
                et valg mellem de to måder, i stedet for at have et stort
                formular- eller invitationskort permanent udfoldet (26. sept.
                2026, Familie-redesign: "målet er, at Familie-siden først og
                fremmest føles som en enkel oversigt over husstanden — ikke
                som én lang onboarding-formular"). "Rediger" på et
                eksisterende medlem springer valget over og åbner MemberForm
                direkte, se knappen ovenfor. ── */}
            {!editingMemberId && familyAddMode === null && (
              <button type="button" onClick={() => setFamilyAddMode("choose")}
                style={{ width:"100%", padding:"14px", background:"var(--green)", color:"var(--on-green)", border:"none", borderRadius:"var(--r)", fontFamily:"var(--f)", fontSize:14, fontWeight:800, cursor:"pointer", marginBottom:10 }}>
                + Tilføj familiemedlem
              </button>
            )}

            {!editingMemberId && familyAddMode === "choose" && (
              <div className="card">
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <div className="card-title" style={{ marginBottom:0 }}>Tilføj familiemedlem</div>
                  <TextLink onClick={() => setFamilyAddMode(null)}>Annuller</TextLink>
                </div>
                <button type="button" onClick={() => setFamilyAddMode("form")}
                  style={{ display:"flex", alignItems:"center", gap:12, width:"100%", textAlign:"left", cursor:"pointer", fontFamily:"var(--f)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
                  <span style={{ width:38, height:38, borderRadius:"50%", background:"var(--green-selected-bg)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon name="family" size={18} color="var(--green)" />
                  </span>
                  <span>
                    <div style={{ fontWeight:800, fontSize:14, color:"var(--ink)" }}>Opret profil uden egen konto</div>
                    <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>Til fx børn eller andre, hvis profil du administrerer.</div>
                  </span>
                </button>
                <button type="button" onClick={() => setFamilyAddMode("invite")}
                  style={{ display:"flex", alignItems:"center", gap:12, width:"100%", textAlign:"left", cursor:"pointer", fontFamily:"var(--f)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px", marginBottom:0 }}>
                  <span style={{ width:38, height:38, borderRadius:"50%", background:"var(--green-selected-bg)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon name="link" size={18} color="var(--green)" />
                  </span>
                  <span>
                    <div style={{ fontWeight:800, fontSize:14, color:"var(--ink)" }}>Invitér med egen konto</div>
                    <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>Personen opretter sit eget login og bliver en del af familien.</div>
                  </span>
                </button>
              </div>
            )}

            {!editingMemberId && familyAddMode === "invite" && (
              <div className="card" style={UI.mb12}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                  <div style={{ ...UI.ufs13_fw800_cink_mb4, display:"flex", alignItems:"center", gap:6, marginBottom:0 }}>
                    <Icon name="link" size={13} color="var(--ink)" /> Invitér til familien
                  </div>
                  <TextLink onClick={() => { setFamilyAddMode(null); setInviteLink(null); setInviteId(null); setInviteCopied(false); loadPendingInvites(); }}>Annuller</TextLink>
                </div>
                <div style={{ fontSize:12, color:"var(--muted)", marginBottom:12, lineHeight:1.5 }}>
                  Personen får sin egen EatSafe-konto og bliver en del af din familie.
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
                          setInviteId(data[0].id ?? null);
                          loadPendingInvites();
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
                    <div style={UI.rowGap8}>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(inviteLink);
                          setInviteCopied(true);
                          setTimeout(() => setInviteCopied(false), 2000);
                        }}
                        style={{ flex:1, padding:"10px", background: inviteCopied ? "var(--green-lt)" : "var(--surface)", border:`1px solid ${inviteCopied ? "var(--green)" : "var(--border2)"}`, borderRadius:8, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color: inviteCopied ? "var(--green)" : "var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                        <Icon name={inviteCopied ? "check" : "link"} size={12} color={inviteCopied ? "var(--green)" : "var(--ink)"} /> {inviteCopied ? "Kopieret!" : "Kopiér invitationslink"}
                      </button>
                      <button
                        onClick={() => navigator.share?.({ title:"EatSafe invitation", url: inviteLink })}
                        style={{ flex:1, padding:"10px", background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:8, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                        <Icon name="share" size={12} color="var(--ink)" /> Del
                      </button>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
                      <div style={{ fontSize:11, color:"var(--muted)" }}>Linket udløber om 24 timer</div>
                      <TextLink onClick={async () => {
                        if (inviteId) {
                          try {
                            await apiCall(`${SUPABASE_URL}/rest/v1/family_invites?id=eq.${inviteId}`, { method:"DELETE", headers: makeHeaders(accessToken) });
                            setPendingInvites(p => p.filter(x => x.id !== inviteId));
                          } catch {
                            showToast("Kunne ikke annullere linket. Prøv igen.", "error");
                            return;
                          }
                        }
                        setInviteLink(null);
                        setInviteId(null);
                        setInviteCopied(false);
                      }}>Annullér link</TextLink>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(familyAddMode === "form" || editingMemberId) && (
              <div className="card">
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div className="card-title">{editingMemberId ? "Rediger familiemedlem" : "Opret profil uden egen konto"}</div>
                  <TextLink onClick={() => { cancelEditMember(); setFamilyAddMode(null); }}>Annuller</TextLink>
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
                  onAdd={editingMemberId ? updateMember : () => {
                    const valid = newMemberName.trim() && newMemberBirthYear && newMemberGender;
                    addMember();
                    if (valid) setFamilyAddMode(null);
                  }}
                  addLabel={editingMemberId ? "Gem ændringer" : "+ Tilføj familiemedlem"}
                />
              </div>
            )}

            {/* Bekræft-dialoger for de to sletnings-/fjernelses-handlinger
                (26. sept. 2026, Familie-redesign — administreret profil
                krævede tidligere INGEN bekræftelse overhovedet, se
                CLAUDE.md). Administreret profil = reel data-sletning
                (danger=true, rød "Slet profil"), husstands-fjernelse er en
                reversibel afkobling af to konti — ingen data slettes, kun
                den delte adgang (danger=false, grøn "Fjern fra familien"),
                erstatter den tidligere native window.confirm(). */}
            {confirmDeleteProfile && (
              <ConfirmDialog
                title={`Slet profilen for ${confirmDeleteProfile.name}?`}
                message="Profilen og alle tilknyttede allergivalg fjernes permanent."
                confirmLabel="Slet profil"
                onConfirm={() => { removeMember(confirmDeleteProfile.id); setConfirmDeleteProfile(null); }}
                onCancel={() => setConfirmDeleteProfile(null)}
              />
            )}
            {confirmRemoveHousehold && (
              <ConfirmDialog
                title={`Fjern ${confirmRemoveHousehold.name || confirmRemoveHousehold.email} fra familien?`}
                message="I mister adgang til hinandens delte data. Personens egen EatSafe-konto påvirkes ikke."
                confirmLabel="Fjern fra familien"
                danger={false}
                onConfirm={async () => {
                  const m = confirmRemoveHousehold;
                  setConfirmRemoveHousehold(null);
                  await apiCall(`${SUPABASE_URL}/functions/v1/family/group/${m.id}`, { method: "DELETE", headers: makeHeaders(accessToken) });
                  setHousehold(h => h.filter(x => x.id !== m.id));
                }}
                onCancel={() => setConfirmRemoveHousehold(null)}
              />
            )}
          </div>
        )}
    </>
  );
}
