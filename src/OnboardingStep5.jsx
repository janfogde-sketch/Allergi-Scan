// @ts-nocheck
import React from "react";
import { Icon, PushUnavailableNote } from "./SharedComponents.jsx";
import { PrimaryButton, TextLink, FormCard, InfoRow } from "./DesignSystem.jsx";
import { UI } from "./styleUtils.js";

export function renderStep5(c) {
  const { finishOnboard, handleEnablePush, pushDenied, pushDone, pushLoading, pushSupported } = c;
  return (
                <div className="fade-in">
                  <div style={{ textAlign:"center", padding:"16px 0 20px" }}>
                    <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><Icon name="bell" size={42} color="var(--green)" /></div>
                    <div style={{ fontSize:20, fontWeight:900, color:"var(--ink)", marginBottom:8 }}>Bliv opdateret</div>
                    <div style={{ fontSize:13, color:"var(--ink2)", lineHeight:1.65 }}>
                      Få besked om relevante ændringer i EatSafe. Valgfrit.
                    </div>
                  </div>

                  <FormCard style={UI.mb16}>
                    {[
                      ["warning","Tilbagekaldelser og ændringer","Når et produkt, du har scannet, bliver kaldt tilbage eller får nye allergenoplysninger"],
                      ["check","Produktet er godkendt","Når et produkt, du har indsendt, bliver godkendt"],
                      ["family","Familiemedlem tilslutter sig","Når nogen accepterer din invitation"],
                      ["search","Produkt tilgængeligt","Når et produkt, du har ledt efter, kommer i databasen"],
                    ].map(([icon, title, sub], i, arr) => (
                      <InfoRow key={title} icon={icon} color="var(--green)" title={title} sub={sub} border={i < arr.length - 1} />
                    ))}
                  </FormCard>

                  {!pushSupported ? (
                    <>
                      <PushUnavailableNote style={UI.mb16} />
                      <PrimaryButton onClick={finishOnboard}>
                        Fortsæt →
                      </PrimaryButton>
                    </>
                  ) : pushDone ? (
                    pushDenied ? (
                      <div role="status" style={{ fontSize:13, color:"var(--ink2)", textAlign:"center", padding:"12px 0" }}>
                        Notifikationer er ikke slået til. Du kan slå dem til senere under Indstillinger.
                      </div>
                    ) : (
                      <PrimaryButton disabled style={{ opacity:.7, background:"var(--green)", color:"var(--on-green)" }}>
                        <Icon name="check" size={14} color="var(--on-green)" /> Notifikationer aktiveret
                      </PrimaryButton>
                    )
                  ) : (
                    <>
                      <PrimaryButton onClick={handleEnablePush} disabled={pushLoading}
                        style={{ opacity: pushLoading ? .6 : 1, background:"var(--green)", color:"var(--on-green)" }}>
                        {pushLoading ? "Aktiverer…" : <><Icon name="bell" size={14} color="var(--on-green)" /> Slå notifikationer til</>}
                      </PrimaryButton>
                      {/* Ikke nu — var en fuld-bredde .btn-ghost der næsten
                          matchede hovedknappens vægt (25. sept. 2026,
                          brugerfeedback: "lidt for fremtrædende"). Nu en
                          simpel tekstknap under CTA'en i stedet for endnu en
                          knap, så hierarkiet er utvetydigt: notifikationer
                          er den anbefalede handling, "Ikke nu" er der bare
                          uden at presse. Afslutter onboarding direkte, ingen
                          ekstra "Du er færdig"-skærm. */}
                      <TextLink variant="muted" block style={{ minHeight:44, fontSize:14, fontWeight:700, color:"var(--ink2)" }} onClick={finishOnboard}>
                        Ikke nu
                      </TextLink>
                    </>
                  )}
                </div>
  );
}
