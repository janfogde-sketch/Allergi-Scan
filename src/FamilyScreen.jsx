// @ts-nocheck
import React, { useState, useEffect } from "react";
import { DIETS, SUPABASE_URL } from "./constants.jsx";
import { initials, getAllergenLabels, makeHeaders, apiCall, visibleDiets } from "./helpers.js";
import { Icon, showToast, ConfirmDialog, AllergenGlyph } from "./SharedComponents.jsx";
import { MemberForm } from "./MemberForm.jsx";
import { TextLink } from "./DesignSystem.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useFamilyFormContext } from "./FamilyFormContext.jsx";
import { UI } from "./styleUtils.js";

// SCREENS.FAMILY — udskilt fra ProfileScreen.jsx 30. sept. 2026
// (arkitektur-audit A8, én skærm = én fil). Husstanden (household) ejes
// stadig af ProfileScreen, fordi Profil-siden også viser antallet.
export default function FamilyScreen({ household, setHousehold, loadHousehold }) {
  const { userId, accessToken } = useAuthContext();
  const { family, setFamily } = useProfileContext();
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

  // ── Invite state ────────────────────────────────────────────────────────────
  const [inviteLink, setInviteLink] = useState(null);
  const [inviteId, setInviteId] = useState(null); // gemmes fra oprettelsen, så "Annullér link" kan slette den rigtige række
  const [inviteLoading, setInviteLoading] = useState(false);
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
      <div className="screen-sub">Alle i din familie — både profiler du administrerer, og personer med egen EatSafe-konto.</div>
      {/* "Aktive profiler ved scanning" er fjernet herfra (26. sept.
          2026, Familie-redesign) — hvem der scannes for styres
          allerede af "Scanner for"-vælgeren på Scan-forsiden (samme
          FamilyChips-mønster, se ScannerScreen.jsx/App.jsx). Familie-
          siden skal være en ren husstands-oversigt, ikke endnu et
          sted at vælge scanner-profil. En evt. "Standardprofiler ved
          scanning"-indstilling hører til under Indstillinger, ikke
          her — ikke bygget i denne omgang. */}
      {family.length===0 && household.length===0 && pendingInvites.length===0 && <div className="empty-state"><span className="empty-icon" style={{ width:60, height:60 }}><Icon name="family" size={23} color="var(--muted)" /></span><div className="empty-txt">Ingen i familien endnu</div><div className="empty-sub">Tilføj fx et barn eller en partner for at scanne for dem, eller invitér en med egen konto</div></div>}
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
  );
}
