// @ts-nocheck
import React from "react";

import { SCREENS } from "./constants.jsx";

import { Icon } from "./SharedComponents.jsx";
import ManualBarcodeSheet from "./ManualBarcodeSheet.jsx";












import { getGreeting } from "./utils.jsx";
import { S, ScanProfilePickerSheet, GuideSheet, CameraPrimer, CamCtrlBtn } from "./ScannerParts.jsx";

export function renderScannerHome(c) {
  const { activeProfiles, cameraActive, cameraPermissionDenied, closeManualEan, dailyTip, dismissCameraPrimer, family, galleryInputRef, handleCloseCamera, handleScanButtonClick, manualSubmitting, manualTried, openManualEan, photoFallbackRef, scanError, scanFromGallery, scanPhotoForEan, scanProfilePickerAvailable, scanReady, scanTarget, scanZoom, setActiveProfiles, setKnowledgeSlug, setScreen, setShowGuide, setShowScanProfilePicker, showCameraPrimer, showGuide, showManualEan, showPhotoHint, showScanProfilePicker, startCamera, submitManualEan, toggleTorch, toggleZoom, torchOn, user, userId, zoomSupported } = c;
  return (
          <div className="screen fade-in" id="main-content" style={{ display:"flex", flexDirection:"column", minHeight:"calc(100vh - 130px)", paddingBottom:0 }}>

            {/* Guide modal — vises ved klik på "App-guide" */}
            {showGuide && <GuideSheet onClose={() => setShowGuide(false)} />}

            {/* Kamera-permission-primer — vises KUN første gang, lige før
                browserens egen kamera-tilladelses-dialog (28. sept. 2026,
                FINAL POLISH – SCANNER, krav 10). Kort, ét sætning — ingen
                lang privacy-forklaring. */}
            {showCameraPrimer && <CameraPrimer onDismiss={dismissCameraPrimer} />}

            {/* Scan-boks — kun til loggede. Forsiden viser en hilsen + stor
                scan-CTA oven på appens fælles baggrundsbillede — se CLAUDE.md
                afsnit 5 for baggrunden. Hero-boksens egen højde styres af
                .home-hero-frame (calc(100dvh - Npx), se theme.jsx)
                — IKKE flex:1/height:100% her, som viste sig upålideligt i
                produktion (afhænger af at hele forældrekæden har en
                definitiv, ikke bare minimum-, højde — se theme.jsx's
                kommentar + HISTORY.md for fejlfindingen). */}
            {!!userId && <div style={{
              background: cameraActive ? "var(--surface)" : "transparent",
              borderRadius: cameraActive ? 20 : 0, marginBottom: cameraActive ? 10 : 0,
              overflow: cameraActive ? "hidden" : "visible", position:"relative", border: cameraActive ? "1px solid var(--border2)" : "none",
              boxShadow: cameraActive ? "var(--sh2)" : "none",
            }}>
              {/* Kamera container — altid i DOM men skjult når ikke aktiv */}
              <div style={{ position:"relative", display: cameraActive ? "block" : "none" }}>
                <div id="qr-reader-home" style={{ width:"100%", background:"#000" }} />
                {/* Scanner overlay (Bjørn, 8. okt. 2026): fast layout, der ikke
                    flytter sig under scanningen. Luk øverst til venstre, lygte
                    øverst til højre, rammen i midten med tynde hjørner og en rolig
                    linje i EatSafe-grøn, instruktion under rammen og 2×-zoom lige
                    over rammen. "Vælg billede"/"Indtast kode" står under
                    kamerabilledet, og hjælpeteksten efter 5 s har en fast plads. */}
                <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
                  <div style={{
                    position:"absolute", top:72, bottom:72, left:"6%", right:"6%",
                    boxShadow:"0 0 0 9999px rgba(0,0,0,.32)", borderRadius:12,
                  }}>
                    {["tl","tr","bl","br"].map(key => (
                      <div key={key} style={{
                        position:"absolute",
                        top: key.startsWith("t") ? 0 : "auto",
                        bottom: key.startsWith("b") ? 0 : "auto",
                        left: key.endsWith("l") ? 0 : "auto",
                        right: key.endsWith("r") ? 0 : "auto",
                        width:26, height:26,
                        borderColor:"var(--green)", borderStyle:"solid", borderWidth:0,
                        borderTopWidth: key.startsWith("t") ? 2 : 0,
                        borderBottomWidth: key.startsWith("b") ? 2 : 0,
                        borderLeftWidth: key.endsWith("l") ? 2 : 0,
                        borderRightWidth: key.endsWith("r") ? 2 : 0,
                        borderTopLeftRadius: key==="tl" ? 12 : 0,
                        borderTopRightRadius: key==="tr" ? 12 : 0,
                        borderBottomLeftRadius: key==="bl" ? 12 : 0,
                        borderBottomRightRadius: key==="br" ? 12 : 0,
                      }} />
                    ))}
                    {/* Linjen vises først, når kameraet reelt afkoder (scanReady).
                        Den flyttes med transform (ikke top), så den ikke belaster
                        kameraet eller afkodningen. */}
                    {scanReady && (
                      <div className="scan-sweep">
                        <div className="scan-sweep-line" />
                      </div>
                    )}
                  </div>
                  <div style={{ position:"absolute", bottom:48, left:16, right:16, textAlign:"center", fontSize:13, fontWeight:600, color:"#fff", textShadow:"0 1px 3px rgba(0,0,0,.7)" }}>
                    Placér stregkoden inden for rammen
                  </div>
                  {/* Hjælpeteksten har en fast plads under instruktionen og toner
                      kun ind (opacity), så intet flytter sig. */}
                  <div aria-live="polite" className={"scan-hint" + (showPhotoHint ? " on" : "")}>
                    Kan stregkoden ikke scannes? Prøv at justere afstanden.
                  </div>
                </div>

                <div style={{ position:"absolute", top:10, left:10, right:10, display:"flex", alignItems:"flex-start", justifyContent:"space-between", zIndex:2 }}>
                  <CamCtrlBtn icon="x" label="Luk" ariaLabel="Luk kamera" onClick={handleCloseCamera} />
                  <CamCtrlBtn icon="flashlight" label={torchOn ? "Lygte til" : "Lygte"} ariaLabel={torchOn ? "Sluk lygte" : "Tænd lygte"} ariaPressed={torchOn} onClick={toggleTorch} active={torchOn} />
                </div>
                {zoomSupported && (
                  <button onClick={toggleZoom} aria-label={scanZoom >= 2 ? "Zoom 2×, slå fra" : "Zoom 1×, zoom 2 gange ind"} aria-pressed={scanZoom >= 2}
                    style={{
                      position:"absolute", top:38, left:"50%", transform:"translateX(-50%)", zIndex:2,
                      width:44, height:28, padding:0, borderRadius:999,
                      fontFamily:"var(--f)", fontSize:12, fontWeight:700, cursor:"pointer",
                      background: scanZoom >= 2 ? "#fff" : "rgba(0,0,0,.45)",
                      color: scanZoom >= 2 ? "var(--ink)" : "#fff",
                      border:"1px solid rgba(255,255,255,.3)",
                    }}>
                    {scanZoom >= 2 ? "2×" : "1×"}
                  </button>
                )}
              </div>
              {cameraActive && (
                <div className="scan-actions">
                  <button className="btn btn-outline scan-action" onClick={() => galleryInputRef.current?.click()}>
                    <Icon name="image" size={18} /> Vælg billede
                  </button>
                  <button className="btn btn-outline scan-action" onClick={() => openManualEan()}>
                    <Icon name="edit" size={18} /> Indtast kode
                  </button>
                </div>
              )}
              <div id="qr-reader-gallery" style={S.none} />
              <input ref={galleryInputRef} type="file" accept="image/*" style={S.none}
                onChange={e => { if (e.target.files[0]) scanFromGallery(e.target.files[0]); e.target.value=""; }} />
              {/* Foto-fallback: åbner kamera direkte */}
              <input ref={photoFallbackRef} type="file" accept="image/*" capture="environment" style={S.none}
                onChange={e => { if (e.target.files[0]) scanPhotoForEan(e.target.files[0]); e.target.value=""; }} />

              {/* Forside-hero når kamera ikke er aktivt: hilsen + stor scan-
                  knap + Beta-info-fod, siddende oven på det app-brede
                  baggrundsbillede (.app-bg, theme.jsx — 25. sept. 2026:
                  Scan-forsidens eget foto blev gjort til det universelle
                  billede for hele appen, ikke længere Scan-specifikt),
                  ikke en <img> herinde. Det var oprindeligt en <img> direkte
                  i .home-hero-frame, men den udgave var begrænset til rummet
                  MELLEM topbar og bundnav (kunne aldrig dække kant-til-kant
                  uden en risikabel tilbagevenden til flex-fill-højde, se
                  HISTORY.md) — flyttet til app-bg-laget, som allerede dækker
                  hele skærmen pålideligt. .home-hero-frame giver stadig
                  boksen en
                  DEFINITIV calc(100dvh - Npx)-højde, så hilsen/knap altid er
                  synlige uden scroll — ren layout-container nu, intet visuelt
                  eget indhold. Alle mål er clamp(min, Ncqh, max) i stedet for
                  faste px, så indholdet skalerer NED sammen med boksen på
                  korte telefoner (og OP på store — hævet 24. sept. 2026 efter
                  feedback om at hele hero'en virkede for lille). "Prøv en
                  demo"-knappen er fjernet efter brugerens tidligere ønske —
                  bemærk at det var DENNE knaps eneste kald til setShowGuide
                  der åbnede DemoSlider-guiden ("App-guide"-knappen der
                  gjorde det samme var allerede fjernet som redundant) —
                  showGuide/DemoSlider herunder er nu urørt, men uden nogen
                  synlig indgang i UI'et. */}
              {!cameraActive && (
              <div className="home-hero-frame">
                {/* Forankret i BUNDEN (4. okt. 2026, Bjørn): sidste tekstlinje står altid
                    præcis 28 px over den grønne cirkel på alle telefoner (cirklen starter calc(44% - 45px) + insettet
                    clamp(5px,1.1cqh,7px), se scan-knappen nedenfor), og en forklaring på tre
                    linjer vokser OPAD i stedet for ned mod knappen. Tidligere top:calc(27% - 62px)
                    gav kun 3-5 px luft, når teksten fik tre linjer. Knappen er ikke flyttet. */}
                <div style={{ position:"absolute", bottom:"calc(56% + 45px - clamp(5px, 1.1cqh, 7px) + 28px)", left:0, right:0, zIndex:1, textAlign:"center", padding:"0 12px" }}>
                  {/* Tykkere/større tekst + en blød hvid text-shadow-glød "løfter"
                      teksten af det app-brede baggrundsbillede bagved (.app-bg,
                      theme.jsx — samme billede på tværs af hele appen, se dens
                      kommentar), samme mønster som appens øvrige skærme bruger.
                      Flyttet 25px op (25. sept. 2026, opfølgning), igen 25px op
                      (29. sept. 2026, "en mere balanceret og rolig forside"),
                      og igen 12px op (29. sept. 2026, opfølgning — samlet 62px
                      op fra den oprindelige %-position) sammen med
                      scan-knappen herunder — ren fast pixel-forskydning (calc)
                      oven på den eksisterende %-position, ikke en ny %-værdi —
                      brugeren bad specifikt om px, ikke en proportional
                      flytning. Selve blokkens interne spacing (hilsen→navn→
                      hjælpetekst) er urørt, kun den fælles ydre position. */}
                  <div style={{ fontSize:"clamp(14px, 2.9cqh, 19px)", fontWeight:600, color:"var(--ink)", letterSpacing:"-.2px", textShadow:"0 1px 2px rgba(255,255,255,.85), 0 2px 14px rgba(255,255,255,.65)" }}>{getGreeting()},</div>
                  {/* Ingen fallback-tekst her (var tidligere "der", fejlrapporteret
                      25. sept. 2026: "der" blev vist kortvarigt, før navnet nåede
                      at blive hentet) — user.name er tomt indtil App.jsx's loadAll-
                      fetch resolver, og et gættet ord er værre end intet, mens vi
                      venter. Linjen popper ind med navnet, i stedet for at skifte
                      fra et forkert ord til det rigtige. Et hårdt mellemrum holder
                      linjens højde, så layoutet ikke hopper, når navnet kommer. */}
                  <div style={{ fontSize:"clamp(22px, 4.7cqh, 32px)", fontWeight:800, color:"var(--ink)", letterSpacing:"-.5px", marginTop:"clamp(2px, .4cqh, 4px)", textShadow:"0 1px 2px rgba(255,255,255,.85), 0 2px 14px rgba(255,255,255,.65)" }}>{(user.name || "").trim().split(/\s+/)[0] || "\u00A0"}</div>
                  {/* fontWeight 600→500 (29. sept. 2026, "en mere balanceret
                      og rolig forside") — lettere visuelt, så den ikke
                      konkurrerer med navnet (800) eller scan-knappen;
                      størrelse/placering urørt. */}
                  <div style={{ fontSize:"clamp(11.5px, 2.1cqh, 15px)", fontWeight:500, color:"var(--ink2)", marginTop:"clamp(5px, 1.1cqh, 9px)", lineHeight:1.5, maxWidth:250, marginLeft:"auto", marginRight:"auto", textShadow:"0 1px 2px rgba(255,255,255,.85), 0 2px 12px rgba(255,255,255,.6)" }}>
                    {cameraPermissionDenied
                      ? "Kameraadgang er slået fra. Vælg et billede eller indtast koden i stedet."
                      : scanTarget.intro}
                  </div>
                </div>

                {/* Stor cirkulær scan-knap — grøn fyld (var(--green) → var(--green-dark)). Knappen
                    selv står nu STILLE (scanCtaBreathe-åndedrættet er fjernet
                    herfra 25. sept. 2026 — brugeren bad specifikt om puls "kun i"
                    halo-gløden, ikke selve knappen); al levende bevægelse ligger
                    nu udelukkende i .scan-cta-wave (bølgeringe, 7. okt. 2026; før halo, skala+
                    opacity-puls, se theme.jsx). Størrelsen er reduceret ~10%
                    denne runde (29. sept. 2026, "en mere balanceret og rolig
                    forside" — knappen må stadig være hovedfokus, men ikke
                    dominere hele skærmen; ned fra clamp(132px, 34cqh, 219px)
                    til clamp(119px, 30cqh, 197px)), efter tidligere runders
                    forøgelser (senest ~12,5% op til 132/34/219). Ikonet er
                    "scanframe" (fire scanner-hjørner om stregkode-barer,
                    samme visuelle sprog som kameraets eget scan-overlay) —
                    bevaret uændret i størrelse. Positionen er flyttet
                    yderligere 25px op sammen med hilsen-blokken ovenfor
                    (29. sept. 2026, "en mere balanceret og rolig forside"),
                    og igen 2px op (29. sept. 2026, opfølgning — hilsen-
                    blokken flyttede 12px, men knappen kun 2px af dem, så de
                    resterende 10px i stedet blev til MERE luft mellem
                    hjælpeteksten og knappen, som bedt om). Samlet
                    calc(44% - 45px), 17px mindre end hilsen-blokkens egen
                    forskydning (62px) — den luft-justering mellem
                    hjælpeteksten og knappen som allerede fandtes (7px), plus
                    de nye 10px. Selve
                    knappen er en rigtig <button> (ikke en div med role=
                    "button") for native tastatur-aktivering + pålidelig
                    :active-tryk-feedback på touch-enheder
                    (.scan-cta-btn:active, theme.jsx). En parallel session
                    forsøgte samme dag et hvidt ghost/outline-design med en
                    roterende ring-lys (mockup "C") — bevidst ikke genindført
                    ved sammenlægningen med main, se theme.jsx's kommentar
                    ved .scan-cta-wave for begrundelsen. */}
                {showScanProfilePicker && scanProfilePickerAvailable && (
                  <ScanProfilePickerSheet
                    activeProfiles={activeProfiles} setActiveProfiles={setActiveProfiles}
                    family={family} user={user}
                    onClose={() => setShowScanProfilePicker(false)}
                  />
                )}

                {/* Kameraadgang nægtet: erstat den store scan-knap med en
                    tydelig, dedikeret besked + de to reelle alternativer
                    (28. sept. 2026, FINAL POLISH – SCANNER, krav 9) — IKKE
                    bare et lille rødt banner under en fortsat klikbar
                    scan-knap, der ellers ville slå fejl igen og igen. Ingen
                    "Åbn Indstillinger"-knap: der findes ingen cross-
                    browser/cross-platform JS-API til at åbne kamera-
                    tilladelser fra en PWA (samme genundersøgte konklusion
                    som Indstillinger → Notifikationer, se SettingsScreen.jsx).
                    "Scanner for: ..."-chippen (25. sept. 2026, brugerfeedback
                    — diskret profilvælger) er 29. sept. 2026 flyttet fra sin
                    egen position øverst i .home-hero-frame til HERINDE, som
                    normal flow-barn (marginTop, ikke egen absolut position)
                    lige under knappen/kortet, i samme fælles absolut
                    positionerede flex-kolonne — brugerens eksplicitte ønske
                    om at knap + chip "næsten opleves som én funktionel
                    gruppe", 16-20px mellemrum, i stedet for langt fra
                    hinanden øverst/midt på skærmen. Størrelsen er UÆNDRET
                    (samme kompakte mål som forrige runde). Vises kun når
                    husstanden har mere end én profil, se
                    scanProfilePickerAvailable ovenfor. */}
                <div style={{ position:"absolute", top:"calc(44% - 45px)", left:0, right:0, zIndex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>
                  {cameraPermissionDenied ? (
                    <div style={{ display:"flex", justifyContent:"center", padding:"0 20px", width:"100%" }}>
                      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:20, padding:"20px 18px", maxWidth:300, width:"100%", textAlign:"center", boxShadow:"var(--sh2)" }}>
                        <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
                          <div style={{ width:44, height:44, borderRadius:"50%", background:"var(--red-lt)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Icon name="block" size={20} color="var(--red)" />
                          </div>
                        </div>
                        <div style={{ fontSize:15, fontWeight:800, color:"var(--ink)", marginBottom:4 }}>Kameraadgang er slået fra</div>
                        <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, marginBottom:16 }}>
                          Giv adgang til kameraet i telefonens indstillinger (iPhone: Indstillinger › Safari › Kamera; Android: browserens webstedsindstillinger), og tryk Prøv igen. Du kan også bruge mulighederne nedenfor.
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={() => galleryInputRef.current?.click()}
                            style={{ flex:1, minHeight:44, padding:"10px", borderRadius:10, background:"var(--surface2)", border:"1px solid var(--border2)", fontFamily:"var(--f)", fontSize:12.5, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                            <Icon name="image" size={13} color="var(--ink)" /> Vælg billede
                          </button>
                          <button onClick={() => openManualEan()}
                            style={{ flex:1, minHeight:44, padding:"10px", borderRadius:10, background:"var(--green)", border:"none", fontFamily:"var(--f)", fontSize:12.5, fontWeight:800, color:"var(--on-green)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                            <Icon name="edit" size={13} color="var(--on-green)" /> Indtast kode
                          </button>
                        </div>
                        <button type="button" className="link-green" style={{ marginTop:14 }} onClick={() => startCamera()}>
                          Prøv igen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ position:"relative", width:"clamp(119px, 30cqh, 197px)", height:"clamp(119px, 30cqh, 197px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {/* Bølgeringe (Bjørn, 7. okt. 2026, forslag A i roligt tempo): tre tynde grønne ringe glider
                          ud fra knappen og forsvinder, forskudt i tid. Erstatter den tidligere halo-glød. Slås fra ved "Reducer bevægelse" (theme.jsx). */}
                      <div className="scan-cta-wave" aria-hidden="true" />
                      <div className="scan-cta-wave w2" aria-hidden="true" />
                      <div className="scan-cta-wave w3" aria-hidden="true" />
                      <button
                        className="scan-cta-btn"
                        onClick={handleScanButtonClick}
                        aria-label="Start kamera for at scanne stregkode"
                        style={{ position:"absolute", inset:"clamp(5px, 1.1cqh, 7px)", borderRadius:"50%", cursor:"pointer",
                          border:"none", fontFamily:"var(--f)",
                          // Gradient og lyst skær bevidst bevaret (Bjørn, 7. okt. 2026): knappen skal ligne den gamle;
                          // en bevidst undtagelse fra "ingen gradienter" i BRAND.md. Kun bølgeringene er nye.
                          background:"linear-gradient(160deg,var(--green) 0%,var(--green-dark) 100%)",
                          boxShadow:"0 14px 28px -12px rgba(8,115,74,.4), inset 0 2px 3px rgba(255,255,255,.3)",
                          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"clamp(5px, 1.4cqh, 9px)" }}>
                        {/* Ikon/tekst/gap skaleret ~10% ned sammen med selve
                            knappen (samme runde) — bevarer de oprindelige
                            proportioner mellem indhold og knap, i stedet for
                            at ikon/tekst pludselig fylder relativt mere i en
                            mindre cirkel. */}
                        <Icon name="scanframe" size="clamp(26px, 5.7cqh, 39px)" color="#fff" />
                        <div style={{ fontSize:"clamp(12px, 2.2cqh, 14px)", fontWeight:800, color:"#fff", letterSpacing:"-.2px" }}>Scan produkt</div>
                      </button>
                    </div>
                  )}
                  {scanProfilePickerAvailable && (
                    // marginTop:11, ikke 16-20 direkte — knappen selv sidder
                    // inset:clamp(5px,1.1cqh,7px) inde i sin egen kant-til-
                    // kant container ovenfor, så det FAKTISKE mellemrum
                    // mellem den synlige grønne cirkel og chippen (målt med
                    // Playwright) bliver marginTop + det inset, samlet
                    // ~16-20px som bedt om.
                    <div style={{ marginTop:11 }}>
                      {/* maxWidth ændret fra "78%" til en fast 260px — chippen
                          sidder nu i en shrink-to-fit flex-kolonne (ikke
                          længere en fuld-bredde række), hvor en %-bredde ikke
                          har noget defineret grundlag at regne ud fra og
                          trak teksten forkert sammen ("Scanner ..." i stedet
                          for "Scanner for: Alle"). En fast px-værdi løser det
                          og er rigeligt inden for appens 480px-loft. */}
                      {/* Hele pillen er én knap (4. okt. 2026): lidt højere
                          kontrast, kraftigere kant og chevron, hover/tryk/åben-
                          tilstand i .scan-profile-chip (theme.jsx). Stadig
                          hvid og lille, så den aldrig konkurrerer med Scan. */}
                      <button type="button" className="scan-profile-chip" onClick={() => setShowScanProfilePicker(true)}
                        aria-haspopup="dialog" aria-expanded={showScanProfilePicker}
                        aria-label={`Tjekker for: ${scanTarget.chip}. Skift hvem der tjekkes for`}>
                        <Icon name="family" size={12} color="var(--green)" />
                        <span style={{ fontSize:"clamp(10.5px, 1.8cqh, 12px)", fontWeight:600, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          Tjekker for: <span style={{ color:"var(--green)", fontWeight:800 }}>{scanTarget.chip}</span>
                        </span>
                        <Icon name="chevronDown" size={12} color="var(--ink2)" />
                      </button>
                    </div>
                  )}
                </div>

                {/* "Vidste du, at …" (4. okt. 2026, Bjørn): lille, rolig info-kort nederst over bundnavigationen,
                    under profilvælgeren. Kun godkendte tips fra Allergileksikonet (knowledge_base.tips), ét pr. dag,
                    ingen animation. Skjules på meget lave skærme (.scan-tip, container-query i theme.jsx), og når
                    kameraadgang er nægtet (det kort fylder selv). Linket åbner den præcise artikel. */}
                {dailyTip && !cameraPermissionDenied && (
                  // Kompakt (4. okt. 2026, Bjørn): hele kortet er én knap til artiklen. En diskret chevron til højre i
                  // første linje viser, at man kan trykke; "Læs mere i Allergileksikonet" står kun i aria-label.
                  <button type="button" className="scan-tip"
                    aria-label={`Vidste du, at … ${dailyTip.text} Læs mere i Allergileksikonet`}
                    onClick={() => { setKnowledgeSlug(dailyTip.slug); setScreen(SCREENS.KNOWLEDGE); }}>
                    <span className="scan-tip-head">
                      <Icon name="bulb" size={12} color="var(--green)" />
                      <span className="scan-tip-title">Vidste du, at …</span>
                      <span aria-hidden="true" style={{ display:"flex", flexShrink:0 }}><Icon name="chevronRight" size={14} color="var(--muted)" /></span>
                    </span>
                    <span className="scan-tip-text">{dailyTip.text}</span>
                  </button>
                )}

                {/* Sikkerhedsinformationen kan genåbnes fra menuen/Indstillinger (SafetyInfoModal), ikke fra en fast knap her. */}
              </div>
              )}
            </div>}

            {/* Fejlbesked og manuel EAN-input — sjældne/betingede tilstande,
                kun vist ved behov. Pakket i en bund-sikret wrapper (padding
                matchende den gennemsigtige bundnav) så de ikke kan havne
                skjult/utrykbare bag den, nu hvor HOME-skærmens normale 110px
                bund-reserve er fjernet til fordel for hero-boksens
                kant-til-kant-udfyldning ovenfor. */}
            <div style={{ paddingBottom: scanError ? "calc(77px + env(safe-area-inset-bottom) + 12px)" : 0 }}>
            {/* Fejlbesked + Manuel EAN — kun til loggede */}
            {!!userId && <>
            {/* Fejlbesked fra kamera */}
            {scanError && (
              <div style={{ fontSize:12, color:"var(--red)", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:8, padding:"8px 12px", marginBottom:8 }}>
                {scanError} — <span style={{ textDecoration:"underline", cursor:"pointer" }} onClick={() => openManualEan()}>Indtast manuelt</span>
              </div>
            )}

            {showManualEan && (
              <ManualBarcodeSheet onClose={closeManualEan} onSubmit={submitManualEan}
                submitting={manualSubmitting} submitError={manualTried ? scanError : ""} />
            )}
            </>}
            </div>

          </div>
  );
}
