// @ts-nocheck
import React, { useState, useEffect } from "react";
import { DIETS, SUPABASE_URL, SCREENS } from "./constants.jsx";
import { initials, getAllergenLabels, makeHeaders, apiCall, visibleDiets } from "./helpers.js";
import { Icon, showToast, ConfirmDialog, AllergenGlyph } from "./SharedComponents.jsx";
import HelpModal from "./HelpModal.jsx";
import { MemberForm } from "./MemberForm.jsx";
import { TextLink } from "./DesignSystem.jsx";
import { InvitePanel, PendingInviteCard, InviteLinkEntry } from "./FamilyInvite.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useFamilyFormContext } from "./FamilyFormContext.jsx";
import { UI } from "./styleUtils.js";

// SCREENS.FAMILY — udskilt fra ProfileScreen.jsx 30. sept. 2026
// (arkitektur-audit A8, én skærm = én fil). Husstanden (household) ejes
// stadig af ProfileScreen, fordi Profil-siden også viser antallet.
const SECTION = { fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".8px", margin:"16px 0 4px" };
const SECTION_SUB = { fontSize:12, color:"var(--muted)", lineHeight:1.45, marginBottom:8 };

// Kompakt tom tilstand pr. sektion: gør funktionen synlig uden et stort tomt kort.
function EmptyRow({ title, text }) {
  return (
    <div style={{ padding:"10px 14px", background:"var(--surface)", border:"1px dashed var(--border2)", borderRadius:12, marginBottom:8 }}>
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
    ...getAllergenLabels(m.allergens || [], m.custom || []).map(item => ({ item, variant:"allergy" })),
    ...visibleDiets(m.diets).map(id => DIETS.find(d => d.id === id)?.label).filter(Boolean).map(text => ({ text, variant:"diet" })),
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
        {visible.map((c,j) => <div key={j} className="tag" style={{ fontSize:11, ...CHIP_VARIANT_STYLE[c.variant] }}>{c.variant==="allergy" ? <><AllergenGlyph a={c.item} size={11} /> {c.item.label}</> : c.text}</div>)}
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

  // Bundpadding med iOS safe area: bundnavigationen er ca. 113 px høj på iPhones med hjemmeindikator, mere end .screens faste 110 px, så
  // formularens sidste knap kunne ligge bag den (2. okt. 2026).
  return (
    <div className="screen fade-in" style={{ paddingBottom:"calc(110px + env(safe-area-inset-bottom))" }}>
      <div className="screen-title" style={{ textAlign:"left", width:"auto" }}>Familie</div>
      <div className="screen-sub">Saml personer, du tjekker varer for og deler indkøbslister med.</div>
      <TextLink onClick={() => setShowHowItWorks(true)}>Sådan virker Familie</TextLink>

      <div style={SECTION}>Familiemedlemmer med egen konto</div>
      <div style={SECTION_SUB}>Voksne med egen EatSafe-konto, som du har inviteret.</div>
      {household.length === 0 && pendingInvites.length === 0 && <EmptyRow title="Ingen endnu" text="Invitér en person til familien." />}
      {household.map(m => (
        <div key={`h-${m.id}`} className="family-member">
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div className="fm-avatar" style={{ background:"var(--green)", color:"var(--ink)" }}>{initials(m.name || m.email)}</div>
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
          {/* Undgå dubletter: hvis personen tidligere var en administreret profil, man selv oprettede, kan de to slås sammen.
              Kun for den, der inviterede (canRemove), og kun når der er en administreret profil at vælge imellem. */}
          {m.canRemove && family.length > 0 && linkPickerFor !== m.id && (
            <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid var(--border)" }}>
              <TextLink onClick={() => setLinkPickerFor(m.id)}>Har du allerede en profil til {m.name || m.email}? Slå dem sammen</TextLink>
            </div>
          )}
          {linkPickerFor === m.id && (
            <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid var(--border)" }}>
              <div style={{ fontSize:11.5, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>
                Vælg den profil, du selv har oprettet til {m.name || m.email}. Allergier, kostvalg og E-numre flyttes over på kontoen, og din egen profil slettes.
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
        <PendingInviteCard key={`inv-${inv.id}`} invite={inv} accessToken={accessToken} onCancel={async () => {
          try {
            await apiCall(`${SUPABASE_URL}/rest/v1/family_invites?id=eq.${inv.id}`, { method:"DELETE", headers: makeHeaders(accessToken) });
            setPendingInvites(p => p.filter(x => x.id !== inv.id));
          } catch {
            showToast("Kunne ikke annullere invitationen. Prøv igen.", "error");
          }
        }} />
      ))}
      <InviteLinkEntry />

      <div style={SECTION}>Profiler du administrerer</div>
      <div style={SECTION_SUB}>Børn under 18 år uden egen konto. Du administrerer deres profil.</div>
      {family.length === 0 && <EmptyRow title="Ingen endnu" text="Opret en profil til et barn." />}
      {family.map(m => (
        <div key={`p-${m.id}`} className="family-member" style={editingMemberId === m.id ? { border:"1.5px solid var(--green)", background:"var(--green-selected-bg)" } : undefined}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div className="fm-avatar" style={{ background:m.color, color:"var(--ink)" }}>{initials(m.name)}</div>
            <div style={UI.flex1}>
              <div style={{ fontWeight:800, fontSize:15 }}>{m.name}</div>
              <div style={UI.muted11mt2}>
                {[m.birth_year && `${new Date().getFullYear() - m.birth_year} år`, m.gender, "Ingen egen konto"].filter(Boolean).join(" · ")}
              </div>
            </div>
            <button type="button" onClick={() => { setFamilyAddMode(null); startEditMember(m); }} aria-label={`Rediger ${m.name}`}
              style={{ background:"none", border:"none", cursor:"pointer", padding:"0 4px", minHeight:44, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color: editingMemberId === m.id ? "var(--green)" : "var(--ink2)" }}>
              Rediger
            </button>
            <button type="button" onClick={() => setConfirmDeleteProfile(m)} aria-label={`Slet profilen for ${m.name}`}
              style={{ background:"none", border:"none", cursor:"pointer", width:40, height:44, marginLeft:-2, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="trash" size={18} color="var(--ink2)" />
            </button>
          </div>
          {m.birth_year && new Date().getFullYear() - m.birth_year >= 18 && (
            <div role="note" style={{ margin:"0 0 10px", padding:"10px 12px", borderRadius:12, background:"var(--surface2)", border:"1px solid var(--border)" }}>
              <div style={{ fontSize:12.5, color:"var(--ink)", lineHeight:1.5 }}>Denne profil skal nu overgå til en personlig EatSafe-konto.</div>
              <button type="button" className="btn btn-outline btn-sm" style={{ marginTop:8, minHeight:44 }} onClick={() => { cancelEditMember(); setFamilyAddMode("invite"); setTimeout(() => document.getElementById("family-invite-panel")?.scrollIntoView({ behavior:"smooth", block:"start" }), 60); }}>Invitér til egen konto</button>
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
            <TextLink onClick={() => setFamilyAddMode(null)}>Annuller</TextLink>
          </div>
          <button type="button" onClick={() => setFamilyAddMode("invite")}
            style={{ display:"flex", alignItems:"center", gap:12, width:"100%", textAlign:"left", cursor:"pointer", fontFamily:"var(--f)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
            <span style={{ width:38, height:38, borderRadius:"50%", background:"var(--green-selected-bg)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="mail" size={18} color="var(--green)" />
            </span>
            <span>
              <div style={{ fontWeight:800, fontSize:14, color:"var(--ink)" }}>Invitér til familien</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>Sendes som mail til personer på 18 år eller derover med egen EatSafe-konto.</div>
            </span>
          </button>
          <button type="button" onClick={() => setFamilyAddMode("form")}
            style={{ display:"flex", alignItems:"center", gap:12, width:"100%", textAlign:"left", cursor:"pointer", fontFamily:"var(--f)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px", marginBottom:0 }}>
            <span style={{ width:38, height:38, borderRadius:"50%", background:"var(--green-selected-bg)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="family" size={18} color="var(--green)" />
            </span>
            <span>
              <div style={{ fontWeight:800, fontSize:14, color:"var(--ink)" }}>Opret profil til et barn</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>Til børn under 18 år uden egen konto.</div>
            </span>
          </button>
        </div>
      )}

      {!editingMemberId && familyAddMode === "invite" && (
        <div id="family-invite-panel" style={{ marginTop:16 }}>
          <InvitePanel accessToken={accessToken}
            onInviteId={setInviteId} onChanged={loadPendingInvites}
            onClose={() => { setFamilyAddMode(null); setInviteId(null); loadPendingInvites(); }} />
        </div>
      )}

      {(familyAddMode === "form" || editingMemberId) && (
        <div className="card">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div className="card-title">{editingMemberId ? "Rediger profil" : "Opret profil til et barn"}</div>
            <TextLink onClick={() => { cancelEditMember(); setFamilyAddMode(null); }}>Annuller</TextLink>
          </div>
          <MemberForm key={editingMemberId || "new"} editing={!!editingMemberId}
            openPrivacy={() => openLegal(SCREENS.PRIVACY)}
            onInviteAdult={() => { cancelEditMember(); setFamilyAddMode("invite"); }}
            onInviteOwnAccount={() => { cancelEditMember(); setFamilyAddMode("invite"); }}
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
      {showHowItWorks && <HelpModal screen="family" closeLabel="Forstået" onClose={() => setShowHowItWorks(false)} />}
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
          message="I kan ikke længere se hinandens allergier, historik og favoritter, og lister, I har delt med hinanden, stoppes. Personens egen konto påvirkes ikke."
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
