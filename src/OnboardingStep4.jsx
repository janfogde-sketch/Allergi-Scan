// @ts-nocheck
import React from "react";
import { ALLERGENS, SCREENS } from "./constants.jsx";
import { initials } from "./helpers.js";
import { Icon, ConfirmDialog } from "./SharedComponents.jsx";
import { MemberForm } from "./MemberForm.jsx";
import { PrimaryButton, SecondaryButton, TextLink } from "./DesignSystem.jsx";
import { UI } from "./styleUtils.js";
import { memberTraceNote } from "./OnboardingParts.jsx";

export function renderStep4(c) {
  const { addMember, cancelEditMember, confirmRemoveMember, editingMemberId, family, newMemberAllerg, newMemberBirthYear, newMemberCustomAllerg, newMemberCustomInput, newMemberDiets, newMemberENumbers, newMemberGender, newMemberLevels, newMemberName, newMemberSubtypes, openLegal, removeMember, setConfirmRemoveMember, setNewMemberAllerg, setNewMemberBirthYear, setNewMemberCustomAllerg, setNewMemberCustomInput, setNewMemberDiets, setNewMemberENumbers, setNewMemberGender, setNewMemberLevels, setNewMemberName, setNewMemberSubtypes, setOnboardStep, setShowAddMemberForm, showAddMemberForm, startEditMember, updateMember } = c;
  return (
              <div className="fade-in">
                {confirmRemoveMember && (
                  <ConfirmDialog title={`Fjern ${confirmRemoveMember.name} fra familien?`}
                    message="Profilen og alle tilknyttede allergivalg fjernes permanent."
                    confirmLabel="Ja, fjern"
                    onCancel={() => setConfirmRemoveMember(null)}
                    onConfirm={() => { removeMember(confirmRemoveMember.id); setConfirmRemoveMember(null); }} />
                )}
                <div className="step-title">Børneprofiler</div>
                <div style={{ fontSize:13, color:"var(--ink2)", marginBottom:16 }}>Opret en profil til et barn under 18 år uden egen konto. Voksne kan du invitere under Familie, så de selv styrer deres oplysninger. Valgfrit.</div>

                {/* Allerede tilføjede — viser navn + alder som primær linje
                    (25. sept. 2026, brugerfeedback: "Mia, 24 år"), ikke kun
                    allergiliste, så det er umiddelbart tydeligt at
                    familiemedlemmet reelt blev gemt. Allergioversigten er
                    begrænset til 3 værdier + "+N" (samme dag, opfølgning) —
                    en lang allergiliste skubbede ellers Rediger/slet ud af
                    synsfeltet på smalle skærme. "Rediger" (25. sept. 2026,
                    opfølgning) genbruger samme MemberForm nedenfor i stedet
                    for en separat redigerings-dialog — se startEditMember/
                    updateMember i useFamily.js. Det medlem der redigeres,
                    får en tydelig grøn kant, så det er utvetydigt hvilken
                    række formularen nedenfor gælder. Sletteikonet er
                    neutralt/gråt i normal state — rød/destruktiv styling
                    vises kun i den native bekræftelsesdialog, ikke på selve
                    ikonet, så listen ikke ser "farlig" ud i hvile. */}
                {family.length > 0 && (
                  <div className="card" style={UI.mb12}>
                    <div style={UI.sectionLbl6}>Tilføjet</div>
                    {family.map(m => {
                      const allergenLabels = [...m.allergens.map(id => { const a = ALLERGENS.find(x=>x.id===id); return a ? (a.pickerLabel || a.label) : null; }).filter(Boolean), ...(m.custom || [])];
                      const shownAllergens = allergenLabels.slice(0, 3);
                      const extraCount = allergenLabels.length - shownAllergens.length;
                      return (
                      <div key={m.id} style={{
                          display:"flex", alignItems:"center", gap:10, padding:"10px 6px",
                          margin:"0 -6px", borderRadius:10, borderBottom:"1px solid var(--border)",
                          ...(editingMemberId === m.id ? { background:"var(--green-selected-bg)", border:"1.5px solid var(--green)" } : {}),
                        }}>
                        <div className="fm-avatar" style={{ background:m.color, color:"var(--ink)" }}>{initials(m.name)}</div>
                        <div style={UI.flex1}>
                          <div style={{ fontWeight:800, fontSize:14 }}>
                            {m.name}{m.birth_year ? ` · ${new Date().getFullYear() - m.birth_year} år` : ""}
                          </div>
                          <div style={UI.muted11mt2}>
                            {allergenLabels.length ? shownAllergens.join(", ") + (extraCount > 0 ? ` +${extraCount}` : "") + memberTraceNote(m) : "Ingen allergier"}
                          </div>
                        </div>
                        <button type="button" onClick={() => { startEditMember(m); setShowAddMemberForm(true); }} aria-label={`Rediger ${m.name}`}
                          style={{ background:"none", border:"none", cursor:"pointer", padding:"10px 6px", minHeight:44, fontFamily:"var(--f)", fontSize:12.5, fontWeight:700, color:"var(--green)" }}>
                          Rediger
                        </button>
                        <button type="button" onClick={() => setConfirmRemoveMember(m)} aria-label={`Fjern ${m.name}`}
                          style={{ background:"none", border:"none", cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <Icon name="trash" size={18} color="var(--ink2)" />
                        </button>
                      </div>
                      );
                    })}
                  </div>
                )}

                {/* Tilføj nyt medlem / rediger et eksisterende — foldet
                    sammen som standard så snart mindst ét medlem er gemt
                    (25. sept. 2026, brugerfeedback: den tomme formular
                    dominerede trin 4 unødigt efter det første medlem var
                    tilføjet). Kun ved 0 medlemmer, en aktiv redigering, eller
                    et eksplicit tryk på "+ Tilføj endnu et familiemedlem"
                    nedenfor er formularen foldet ud. */}
                {showAddMemberForm ? (
                  <div className="card" style={UI.mb12}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                      <div className="card-lbl">{editingMemberId ? "Rediger profil" : "Opret profil til et barn"}</div>
                      <TextLink onClick={() => { cancelEditMember(); setShowAddMemberForm(false); }}>Annuller</TextLink>
                    </div>
                    <MemberForm key={editingMemberId || "new"} editing={!!editingMemberId}
                      openPrivacy={() => openLegal(SCREENS.PRIVACY)}
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
                      onAdd={() => { (editingMemberId ? updateMember : addMember)(); setShowAddMemberForm(false); }}
                      addLabel={editingMemberId ? "Gem ændringer" : "+ Tilføj børneprofil"}
                    />
                  </div>
                ) : (
                  <>
                    {family.length === 0 ? (
                      <PrimaryButton style={UI.mb8} onClick={() => setShowAddMemberForm(true)}>+ Tilføj børneprofil</PrimaryButton>
                    ) : (
                      <SecondaryButton style={UI.mb12} onClick={() => setShowAddMemberForm(true)}>+ Tilføj endnu en børneprofil</SecondaryButton>
                    )}
                    {/* Trinnet er valgfrit: uden medlemmer er "spring over" den eneste vej videre (sekundær), med medlemmer er
                        "Fortsæt →" den primære handling. Skjules, mens formularen er åben, så der kun er én ting at gøre ad gangen. */}
                    {family.length > 0 ? (
                      <PrimaryButton onClick={() => setOnboardStep(5)}>Fortsæt →</PrimaryButton>
                    ) : (
                      <SecondaryButton onClick={() => setOnboardStep(5)}>Jeg vil ikke tilføje børneprofiler nu</SecondaryButton>
                    )}
                  </>
                )}
              </div>
  );
}
