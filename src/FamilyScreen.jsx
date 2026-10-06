// @ts-nocheck
import React, { useState, useEffect } from "react";
import { DIETS, SUPABASE_URL, SCREENS } from "./constants.jsx";
import { initials, getAllergenLabels, makeHeaders, apiCall, visibleDiets } from "./helpers.js";
import { Icon, showToast, ConfirmDialog, AllergenGlyph } from "./SharedComponents.jsx";
import HelpModal from "./HelpModal.jsx";
import { MemberForm } from "./MemberForm.jsx";
import { TextLink } from "./DesignSystem.jsx";
import { InvitePanel, PendingInviteCard } from "./FamilyInvite.jsx";
import { useMeasuredHeight } from "./useMeasuredHeight.js";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useFamilyFormContext } from "./FamilyFormContext.jsx";
import { UI } from "./styleUtils.js";

// SCREENS.FAMILY — udskilt fra ProfileScreen.jsx 30. sept. 2026
// (arkitektur-audit A8, én skærm = én fil). Husstanden (household) ejes
// stadig af ProfileScreen, fordi Profil-siden også viser antallet.
// Samme overskriftsstil som appens øvrige sektioner (.list-section, UI.sectionLbl*): 11 px, 700, versaler, 1 px spacing.
const SECTION = { fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", margin:"16px 0 4px" };
const SECTION_SUB = { fontSize:12, color:"var(--muted)", lineHeight:1.45, marginBottom:8 };

// Kompakt tom tilstand pr. sektion: kun forklarende tekst (ingen handling), neutral lys baggrund og almindelig diskret kant
// (4. okt. 2026: den stiplede ramme lignede en upload-zone/deaktiveret tilstand).
function EmptyRow({ title, text }) {
  return (
    <div style={{ padding:"10px 14px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, marginBottom:8 }}>
      <div style={{ fontSize:13, fontWeight:700, color:"var(--ink2)" }}>{title}</div>
      <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>{text}</div>
    </div>
  );
}

export default function FamilyScreen({ household, setHousehold, loadHousehold }) {
  const { userId, accessToken } = useAuthContext();
  const { family, setFamily } = useProfileContext();
  const { openLegal } = useNavigationContext();
  const {
    newMemberName, setNewMemberName,
    newMemberBirthYear, setNewMemberBirthYear,
    newMemberGender, setNewMemberGender,
    newMemberAllerg, setNewMemberAllerg,
    newMemberCustomAllerg, setNewMemberCustomAllerg,
    newMemberDiets, setNewMemberDiets,
    newMemberLevels, setNewMemberLevels,
    newMemberENumbers, setNewMemberENumbers,
    newMemberSubtypes, setNewMemberSubtypes,
    newMemberCustomInput, setNewMemberCustomInput,
    editingMemberId,
    addMember, updateMember, removeMember, startEditMember, cancelEditMember,
  } = useFamilyFormContext();

  // ── Invitation: panelet (FamilyInvite.jsx) ejer selve oprettelsen; her huskes kun id'et, så den ikke vises to gange i oversigten.
  const [inviteId, setInviteId] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  // Bundnavigationens faktiske højde (inkl. iOS safe area), så invitationskortet og formularerne altid kan scrolles helt fri af den.
  const navH = useMeasuredHeight(() => document.querySelector(".bottom-nav"));

  // ── Familie-redesign (26. sept. 2026): "+ Tilføj familiemedlem" viser først
  // et valg mellem de to tilføjelses-måder, i stedet for at have et stort
  // formular-kort (eller invitationskortet) permanent udfoldet — se
  // CLAUDE.md's Familie-redesign-note. null = kun "+"-knappen synlig,
  // "choose" = de to valg, "form" = MemberForm (genbruges uændret),
  // "invite" = invitations-panelet.
  const [familyAddMode, setFamilyAddMode] = useState(null);
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState(null); // administreret profil, der afventer "Slet profil"-bekræftelse
  const [confirmRemoveHousehold, setConfirmRemoveHousehold] = useState(null); // rigtig konto, der afventer "Fjern fra familien"-bekræftelse
  const [expandedChipsFor, setExpandedChipsFor] = useState([]); // række-nøgler hvor "+N" er trykket, så alle chips vises i stedet for kun de første

  // ── Ventende invitationer (26. sept. 2026, Familie-redesign) ────────────────
  // Selve invitations-OPRETTELSEN sker stadig i "Invitér med egen konto"-
  // panelet nedenfor, men en invitation, der allerede er sendt (og endnu ikke
  // accepteret eller udløbet), skal også kunne ses direkte i familie-
  // oversigten med status "Invitation afventer" — uden at man behøver åbne
  // panelet igen for at sende mailen igen eller annullere invitationen.
  const [pendingInvites, setPendingInvites] = useState([]);
  const loadPendingInvites = () => {
    if (!accessToken || !userId) return;
    apiCall(`${SUPABASE_URL}/rest/v1/family_invites?invited_by=eq.${userId}&status=eq.pending&order=created_at.desc&select=id,invitee_email,expires_at,kind,token`, { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } })
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
    if (!accessToken) return;
    loadHousehold();
    loadPendingInvites();
    const interval = setInterval(() => { loadHousehold(); loadPendingInvites(); }, 12000);
    return () => clearInterval(interval);
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scanningsrelevante chips (allergier → kostpræferencer → E-numre) ───────
  // Fælles for administrerede profiler OG rigtige husstandskonti (26. sept.
  // 2026, Familie-redesign: "brugeren skal med ét blik kunne se, hvad
  // profilen faktisk bliver kontrolleret imod ved scanning" gælder alle
  // familiemedlemmer). Rækkefølgen er bevidst — allergier/intolerancer først
  // (vigtigst for sikkerheden), så kostpræferencer, så overvågede E-numre.
  const CHIP_VISIBLE_LIMIT = 4;
  const buildMemberChips = (m) => [
    ...getAllergenLabels(m.allergens || [], m.custom || []).map(item => ({ item, variant: item.id ? "allergy" : "custom" })),
    ...visibleDiets(m.diets).map(id => DIETS.find(d => d.id === id)?.label).filter(Boolean).map(text => ({ text, variant:"diet" })),
    ...(m.eNumbers || []).map(text => ({ text, variant:"enumber" })),
  ];
  // Allergi-chips bruger den delte .tag-klasse med Profil-sidens farver.
  // Kostpræferencer får en diskret, lysere grøn/neutral
  // variant, E-numre en helt neutral variant — ingen nye, stærke farver,
  // kun eksisterende designsystem-tokens.
  // Allergi-tags har samme farver som på Profil-siden (4. okt. 2026, Bjørn): røde for valgte allergener, ravgule med blyant for egne valg.
  const CHIP_VARIANT_STYLE = {
    allergy: { background:"var(--red-lt)", color:"var(--red)", borderColor:"var(--red-md)" },
    custom: { background:"var(--amber-lt)", color:"var(--amber)", borderColor:"var(--amber-md)" },
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
        {visible.map((c,j) => <div key={j} className="tag" style={CHIP_VARIANT_STYLE[c.variant]}>{c.variant==="allergy" ? <><AllergenGlyph a={c.item} size={11} /> {c.item.label}</> : c.variant==="custom" ? <><Icon name="edit" size={10} color="var(--amber)" /> {c.item.label}</> : c.text}</div>)}
        {overflow>0 && (
          <button type="button" onClick={() => setExpandedChipsFor(f => [...f, rowKey])}
            className="tag" style={{ color:"var(--muted)", background:"var(--surface2)", borderColor:"var(--border)", cursor:"pointer", fontFamily:"var(--f)" }}>
            +{overflow}
          </button>
        )}
      </div>
    );
  };

  // Bundpadding: den målte navigationshøjde plus luft (6. okt. 2026). Den faste "110px + safe area" var for lidt på iPhones med
  // hjemmeindikator, så invitationskortets sidste knap kunne ende bag navigationen. Uden måling (fx i test) bruges den gamle værdi.
  const bottomPad = navH ? `${navH + 40}px` : "calc(110px + env(safe-area-inset-bottom))";
  const openInvite = () => {
    setFamilyAddMode("invite");
    setTimeout(() => document.getElementById("family-invite-panel")?.scrollIntoView({ behavior:"smooth", block:"start" }), 60);
  };
  const openChildForm = () => {
    setFamilyAddMode("form");
    setTimeout(() => document.getElementById("family-member-form")?.scrollIntoView({ behavior:"smooth", block:"start" }), 60);
  };
  return (
    <div className="screen fade-in" style={{ paddingBottom: bottomPad }}>
      <div className="screen-title" style={{ textAlign:"left", width:"auto" }}>Familie</div>
      <div className="screen-sub">Saml personer, du tjekker varer for, og voksne du deler indkøbslister med.</div>
      <div style={{ marginBottom:12 }}><TextLink onClick={() => setShowHowItWorks(true)}>Sådan virker Familie</TextLink></div>

      <div style={SECTION}>Familiemedlemmer med egen konto</div>
      <div style={SECTION_SUB}>Voksne med egen EatSafe-konto, som du er forbundet med.</div>
      {household.length === 0 && pendingInvites.length === 0 && <EmptyRow title="Ingen endnu" text="Invitér en voksen til familien." />}
      {household.map(m => (
        <div key={`h-${m.id}`} className="family-member">
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div className="fm-avatar" style={{ background:"var(--green)", color:"var(--on-green)" }}>{initials(m.name || m.email)}</div>
            <div style={UI.flex1}>
              <div style={{ fontWeight:800, fontSize:15 }}>{m.name || m.email}</div>
              <div style={UI.muted11mt2}>{m.invitedByMe ? "Har egen konto · Du inviterede" : "Har egen konto · Inviterede dig"}</div>
            </div>
            {m.canRemove && (
              <button type="button" onClick={() => setConfirmRemoveHousehold(m)} aria-label={`Fjern ${m.name || m.email} fra familien`}
                style={{ background:"none", border:"none", cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", opacity:.5, flexShrink:0 }}>
                <Icon name="trash" size={18} color="var(--muted)" />
              </button>
            )}
          </div>
          {renderMemberChips(m, `h-${m.id}`)}
        </div>
      ))}
      {pendingInvites.filter(inv => inv.id !== inviteId).map(inv => (
        <PendingInviteCard key={`inv-${inv.id}`} invite={inv} accessToken={accessToken} onCancel={async () => {
          try {
            await apiCall(`${SUPABASE_URL}/rest/v1/family_invites?id=eq.${inv.id}`, { method:"DELETE", headers: makeHeaders(accessToken) });
            setPendingInvites(p => p.filter(x => x.id !== inv.id));
          } catch {
            showToast("Kunne ikke annullere invitationen. Prøv igen.", "error");
          }
        }} />
      ))}

      <div style={SECTION}>Profiler du administrerer</div>
      <div style={SECTION_SUB}>Børn under 18 år uden egen konto. Du administrerer deres profil.</div>
      {family.length === 0 && <EmptyRow title="Ingen endnu" text="Opret en profil til et barn." />}
      {family.map(m => (
        <div key={`p-${m.id}`} className="family-member" style={editingMemberId === m.id ? { border:"1.5px solid var(--green)", background:"var(--green-selected-bg)" } : undefined}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div className="fm-avatar" style={{ background:m.color, color:"var(--ink)" }}>{initials(m.name)}</div>
            <div style={UI.flex1}>
              <div style={{ fontWeight:800, fontSize:15 }}>{m.name}</div>
              <div style={UI.muted11mt2}>
                {[m.birth_year && `${new Date().getFullYear() - m.birth_year} år`, m.gender, "Børneprofil"].filter(Boolean).join(" · ")}
              </div>
            </div>
            {/* Kun Rediger på kortet (4. okt. 2026): "Slet profil" ligger i Rediger-flowet bag en bekræftelse,
                så et enkelt fejltryk på kortet aldrig kan slette en profil. */}
            <button type="button" onClick={() => { setFamilyAddMode(null); startEditMember(m); }} aria-label={`Rediger ${m.name}`}
              style={{ background:"none", border:"none", cursor:"pointer", padding:"0 8px", minHeight:44, marginRight:-8, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color: editingMemberId === m.id ? "var(--green)" : "var(--ink2)" }}>
              Rediger
            </button>
          </div>
          {m.birth_year && new Date().getFullYear() - m.birth_year >= 18 && (
            <div role="note" style={{ margin:"0 0 10px", padding:"10px 12px", borderRadius:12, background:"var(--surface2)", border:"1px solid var(--border)" }}>
              <div style={{ fontSize:12.5, color:"var(--ink)", lineHeight:1.5 }}>Denne profil skal nu overgå til en personlig EatSafe-konto.</div>
              <button type="button" className="btn btn-outline btn-sm" style={{ marginTop:8, minHeight:44 }} onClick={() => { cancelEditMember(); openInvite(); }}>Invitér til egen konto</button>
            </div>
          )}
          {renderMemberChips(m, `p-${m.id}`)}
        </div>
      ))}

      {/* ── Tilføj: ét valg mellem de to måder, hver med en forklaring ── */}
      {!editingMemberId && familyAddMode === null && (
        <button type="button" onClick={() => setFamilyAddMode("choose")}
          style={{ width:"100%", padding:"14px", background:"var(--green)", color:"var(--on-green)", border:"none", borderRadius:"var(--r)", fontFamily:"var(--f)", fontSize:14, fontWeight:800, cursor:"pointer", margin:"16px 0 10px" }}>
          + Tilføj til familien
        </button>
      )}

      {!editingMemberId && familyAddMode === "choose" && (
        <div className="card" style={{ marginTop:16 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div className="card-title" style={{ marginBottom:0 }}>Tilføj til familien</div>
            <TextLink underline={false} onClick={() => setFamilyAddMode(null)}>Annuller</TextLink>
          </div>
          <button type="button" onClick={openInvite}
            style={{ display:"flex", alignItems:"center", gap:12, width:"100%", textAlign:"left", cursor:"pointer", fontFamily:"var(--f)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
            <span style={{ width:38, height:38, borderRadius:"50%", background:"var(--green-selected-bg)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="mail" size={18} color="var(--green)" />
            </span>
            <span>
              <div style={{ fontWeight:800, fontSize:14, color:"var(--ink)" }}>Invitér til familien</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>Voksen med egen EatSafe-konto. Send en mail eller del et link.</div>
            </span>
          </button>
          <button type="button" onClick={openChildForm}
            style={{ display:"flex", alignItems:"center", gap:12, width:"100%", textAlign:"left", cursor:"pointer", fontFamily:"var(--f)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px", marginBottom:0 }}>
            <span style={{ width:38, height:38, borderRadius:"50%", background:"var(--green-selected-bg)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="family" size={18} color="var(--green)" />
            </span>
            <span>
              <div style={{ fontWeight:800, fontSize:14, color:"var(--ink)" }}>Opret profil til et barn</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>Barn under 18 år uden egen konto.</div>
            </span>
          </button>
        </div>
      )}

      {!editingMemberId && familyAddMode === "invite" && (
        <div id="family-invite-panel" style={{ marginTop:16, scrollMarginTop:16, scrollMarginBottom: navH + 16 }}>
          <InvitePanel accessToken={accessToken}
            onInviteId={setInviteId} onChanged={loadPendingInvites}
            onClose={() => { setFamilyAddMode(null); setInviteId(null); loadPendingInvites(); }} />
        </div>
      )}

      {(familyAddMode === "form" || editingMemberId) && (
        <div id="family-member-form" className="card" style={{ scrollMarginTop:16, scrollMarginBottom: navH + 16 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div className="card-title">{editingMemberId ? "Rediger profil" : "Opret profil til et barn"}</div>
            <TextLink underline={false} onClick={() => { cancelEditMember(); setFamilyAddMode(null); }}>Annuller</TextLink>
          </div>
          <MemberForm key={editingMemberId || "new"} editing={!!editingMemberId}
            openPrivacy={() => openLegal(SCREENS.PRIVACY)}
            onInviteAdult={() => { cancelEditMember(); openInvite(); }}
            onInviteOwnAccount={() => { cancelEditMember(); openInvite(); }}
            name={newMemberName} setName={setNewMemberName}
            birthYear={newMemberBirthYear} setBirthYear={setNewMemberBirthYear}
            gender={newMemberGender} setGender={setNewMemberGender}
            allergens={newMemberAllerg} setAllergens={setNewMemberAllerg}
            customAllerg={newMemberCustomAllerg} setCustomAllerg={setNewMemberCustomAllerg}
            subtypes={newMemberSubtypes} setSubtypes={setNewMemberSubtypes}
            diets={newMemberDiets} setDiets={setNewMemberDiets}
            levels={newMemberLevels} setLevels={setNewMemberLevels}
            eNumbers={newMemberENumbers} setENumbers={setNewMemberENumbers}
            customInput={newMemberCustomInput} setCustomInput={setNewMemberCustomInput}
            onAdd={editingMemberId ? updateMember : () => {
              const valid = newMemberName.trim() && newMemberBirthYear && newMemberGender;
              addMember();
              if (valid) setFamilyAddMode(null);
            }}
            addLabel={editingMemberId ? "Gem ændringer" : "+ Tilføj børneprofil"}
          />
          {editingMemberId && (
            <div style={{ marginTop:16, paddingTop:12, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"center" }}>
              <button type="button" onClick={() => { const m = family.find(x => x.id === editingMemberId); if (m) setConfirmDeleteProfile(m); }}
                style={{ background:"none", border:"none", cursor:"pointer", minHeight:44, padding:"0 12px", display:"flex", alignItems:"center", gap:6, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--red)" }}>
                <Icon name="trash" size={15} color="var(--red)" /> Slet profil
              </button>
            </div>
          )}
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
      {showHowItWorks && <HelpModal screen="family" closeLabel="Forstået" onClose={() => setShowHowItWorks(false)} />}
      {confirmDeleteProfile && (
        <ConfirmDialog
          title={`Slet profilen for ${confirmDeleteProfile.name}?`}
          message="Profilen og alle tilknyttede allergivalg fjernes permanent."
          confirmLabel="Slet profil"
          onConfirm={() => { const id = confirmDeleteProfile.id; if (editingMemberId === id) cancelEditMember(); removeMember(id); setConfirmDeleteProfile(null); }}
          onCancel={() => setConfirmDeleteProfile(null)}
        />
      )}
      {confirmRemoveHousehold && (
        <ConfirmDialog
          title={`Fjern ${confirmRemoveHousehold.name || confirmRemoveHousehold.email} fra familien?`}
          message="Indkøbslister, I har delt med hinanden, deles ikke længere, og I mister adgang til hinandens allergier, historik og favoritter. Ingen af jeres egne konti eller data slettes, og I kan forbinde jer igen med en ny invitation."
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
  );
}
