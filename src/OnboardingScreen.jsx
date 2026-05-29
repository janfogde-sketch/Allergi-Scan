// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, SCREENS, DIETS, AVATAR_COLORS, E_NUMBERS, E_CATEGORIES } from "./constants.jsx";
import { initials } from "./helpers.js";
import { EatSafeLogo, Icon } from "./SharedComponents.jsx";
import { ENumberPicker } from "./AllergenPicker.jsx";
import { MemberForm } from "./MemberForm.jsx";

export default function OnboardingScreen({
  screen, setScreen,
  authTab, setAuthTab,
  authError, setAuthError,
  authLoading,
  loginEmail, setLoginEmail,
  loginPassword, setLoginPassword,
  user, setUser,
  onboardStep, setOnboardStep,
  allergens = [], setAllergens,
  customAllerg = [], setCustomAllerg,
  selectedENumbers = [], setSelectedENumbers,
  activeSubtypeModal, setActiveSubtypeModal,
  allergenSubtypes = {}, setAllergenSubtypes,
  family = [], setFamily,
  activeProfiles = [], setActiveProfiles,
  isOAuth,
  tourIdx, setTourIdx,
  editMode, setEditMode,
  history, setHistory,
  shoppingList, setShoppingList,
  newMemberName, setNewMemberName,
  newMemberBirthYear, setNewMemberBirthYear,
  newMemberGender, setNewMemberGender,
  newMemberAllerg, setNewMemberAllerg,
  newMemberCustomAllerg, setNewMemberCustomAllerg,
  newMemberDiets, setNewMemberDiets,
  newMemberENumbers, setNewMemberENumbers,
  newMemberSubtypes, setNewMemberSubtypes,
  newMemberCustomInput, setNewMemberCustomInput,
  customInput, setCustomInput,
  handleLogin, handleSignup, handleOAuth,
  addMember,
  removeMember,
  saveAllergensStep2,
  saveProfileStep1, finishOnboard,
  StepBar,
  buildLabel,
}) {
  return (
    <>
        {screen === SCREENS.WELCOME && (
          <div className="welcome-screen fade-in">
            {/* Logo + wordmark som splash */}
            <div className="welcome-logo-wrap">
              <EatSafeLogo size={96} variant="light" />
              <div className="welcome-wordmark">
                <span className="welcome-wordmark-text">Eat<span>Safe</span></span>
              </div>
              <div className="welcome-tagline">Scan. Tjek. Spis trygt.</div>
            </div>

            <div className="welcome-divider" />

            {/* Features */}
            <div className="welcome-features">
              {[
                ["camera","Skan på sekunder","Hold kameraet over stregkoden og få svar med det samme"],
                ["family","Hele familien","Administrér allergiprofiler for alle i familien på ét sted"],
                ["cart","Smarte indkøbslister","Delte lister med allergencheck for hele familien"],
              ].map(([icon,title,text]) => (
                <div key={title} className="welcome-feat">
                  <div className="welcome-feat-icon"><Icon name={icon} size={20} color="var(--ink)" /></div>
                  <div className="welcome-feat-text"><strong>{title}</strong>{text}</div>
                </div>
              ))}
            </div>

            <button className="welcome-btn" onClick={() => { setAuthTab("signup"); setScreen(SCREENS.LOGIN); }}>Opret gratis konto →</button>
            <button className="welcome-btn-ghost" onClick={() => { setAuthTab("login"); setScreen(SCREENS.LOGIN); }}>Jeg har allerede en konto</button>

            {/* Privacy policy link */}
            <div style={{ marginTop:24, fontSize:11, color:"var(--muted)", lineHeight:1.6 }}>
              Ved at oprette en konto accepterer du vores{" "}
              <a href="/privacy.html" target="_blank" style={{ color:"var(--green)", fontWeight:600 }}>privatlivspolitik</a>
            </div>

            {/* Build-tidspunkt */}
            <div style={{ marginTop:16, fontSize:10, color:"var(--muted)", opacity:.6, letterSpacing:".3px" }}>
              Sidst opdateret {buildLabel}
            </div>
          </div>
        )}

        {/* ══ LOGIN / REGISTRERING ══ */}
        {screen === SCREENS.LOGIN && (
          <div className="login-wrap fade-in">

            {/* Logo */}
            <div className="login-header">
              <div className="login-shield" style={{background:"none",padding:0,width:56,height:56}}><EatSafeLogo size={56} variant="light" /></div>
              <div className="login-title">Eat<span style={{color:"#22C55E",fontStyle:"italic"}}>Safe</span></div>
            </div>

            {/* Tab vælger */}
            <div className="tab-row">
              <div className={`tab${authTab==="signup"?" active":""}`} onClick={() => { setAuthTab("signup"); setAuthError(""); }}>Ny bruger</div>
              <div className={`tab${authTab==="login"?" active":""}`} onClick={() => { setAuthTab("login"); setAuthError(""); }}>Log ind</div>
            </div>

            {/* SIGNUP flow */}
            {authTab === "signup" && (
              <div className="fade-in">
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"var(--ink)" }}>Opret din gratis konto</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>Du opsætter dine allergier i næste trin</div>
                </div>
                <div className="card">
                  <label className="field-lbl">Email</label>
                  <input className="field" type="email" placeholder="din@email.dk" value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)} style={{ marginBottom:12 }}
                    onKeyDown={e => e.key==="Enter" && handleSignup()} />
                  <label className="field-lbl">Vælg kodeord</label>
                  <input className="field" type="password" placeholder="Minimum 6 tegn" value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleSignup()} />
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:8, lineHeight:1.5 }}>
                    Ved at oprette en konto accepterer du vores vilkår og bekræfter at du er over 13 år.
                  </div>
                </div>
                {authError && (
                  <div className="error-box" style={{ flexDirection:"column", alignItems:"flex-start", gap:4 }}>
                    <span style={{ fontWeight:800 }}>⚠️ Fejl</span>
                    <span style={{ fontWeight:500, fontSize:12, lineHeight:1.5 }}>{authError}</span>
                  </div>
                )}
                <button className="btn btn-primary btn-full" onClick={handleSignup} disabled={authLoading}>
                  {authLoading ? "Opretter konto…" : "Opret konto og fortsæt →"}
                </button>
                <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"var(--muted)" }}>
                  Har du allerede en konto?{" "}
                  <span style={{ color:"var(--green)", fontWeight:700, cursor:"pointer" }} onClick={() => { setAuthTab("login"); setAuthError(""); }}>
                    Log ind her
                  </span>
                </div>
              </div>
            )}

            {/* LOGIN flow */}
            {authTab === "login" && (
              <div className="fade-in">
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"var(--ink)" }}>Velkommen tilbage</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>Log ind med din email og kodeord</div>
                </div>
                <div className="card">
                  <label className="field-lbl">Email</label>
                  <input className="field" type="email" placeholder="din@email.dk" value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)} style={{ marginBottom:12 }}
                    onKeyDown={e => e.key==="Enter" && handleLogin()} />
                  <label className="field-lbl">Kodeord</label>
                  <input className="field" type="password" placeholder="Dit kodeord" value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleLogin()} />
                </div>
                {authError && (
                  <div className="error-box" style={{ flexDirection:"column", alignItems:"flex-start", gap:4 }}>
                    <span style={{ fontWeight:800 }}>⚠️ Fejl</span>
                    <span style={{ fontWeight:500, fontSize:12, lineHeight:1.5 }}>{authError}</span>
                  </div>
                )}
                <button className="btn btn-primary btn-full" onClick={handleLogin} disabled={authLoading}>
                  {authLoading ? "Logger ind…" : "Log ind →"}
                </button>
                <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"var(--muted)" }}>
                  Har du ikke en konto?{" "}
                  <span style={{ color:"var(--green)", fontWeight:700, cursor:"pointer" }} onClick={() => { setAuthTab("signup"); setAuthError(""); }}>
                    Opret en her
                  </span>
                </div>
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"14px 0 10px" }}>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
              <span style={{ fontSize:12, color:"var(--muted)", fontWeight:600 }}>eller log ind med</span>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
            </div>

            {/* Social login knapper */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
              {/* Google */}
              <button onClick={() => handleOAuth("google")} disabled={authLoading}
                style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"13px 16px",
                  background:"var(--surface2)", border:"1.5px solid var(--border2)", borderRadius:12,
                  cursor:"pointer", fontFamily:"var(--f)", fontSize:14, fontWeight:600, color:"var(--ink)",
                  transition:"all .15s" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" style={{flexShrink:0}}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Fortsæt med Google
              </button>

            </div>

            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 8px" }}>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
              <span style={{ fontSize:11, color:"var(--muted)", fontWeight:500 }}>eller</span>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
            </div>
            <button className="btn btn-ghost btn-full" onClick={() => {
              setUser({ name:"Jan", birth_year:"", email:"jan@preview.dk", phone:"" });
              setAllergens(["gluten", "laktose"]);
              setCustomAllerg(["Fructose"]);
              setActiveProfiles(["me", "f1", "f2", "f3", "f4"]);
              setFamily([
                { id:"f1", name:"Frederikke", allergens:["laktose","aeg"], custom:[], diets:["vegetarian"], color:"#74c69d" },
                { id:"f2", name:"Tage", allergens:["jordnoedder","noedder"], custom:[], diets:[], color:"#40916c" },
                { id:"f3", name:"Sofie", allergens:["sesam","soja","fisk"], custom:["Kiwi"], diets:["vegan","gluten-free"], color:"#f4a261" },
                { id:"f4", name:"Mads", allergens:[], custom:["Sukker"], diets:["keto"], color:"#2d6a4f" },
              ]);
              setHistory([
                {code:"3017620422003",name:"Nutella",brand:"Ferrero",status:"danger",result:"danger",headline:"Indeholder nødder!",summary:"Produktet indeholder hasselnødder.",flags:[{type:"bad",text:"Indeholder hasselnødder"}],timestamp:Date.now()-180000,scanned_at:new Date(Date.now()-180000).toISOString()},
                {code:"5449000054227",name:"Coca-Cola",brand:"Coca-Cola",status:"safe",result:"safe",headline:"Sikkert produkt",summary:"Ingen allergener fundet.",flags:[{type:"good",text:"Ingen kendte allergener"}],timestamp:Date.now()-7200000,scanned_at:new Date(Date.now()-7200000).toISOString()},
              ]);
              setShoppingList([{id:"s1",name:"Glutenfri pasta",checked:false},{id:"s2",name:"Havremælk",checked:true}]);
              setScreen(SCREENS.HOME);
            }}>
              Prøv app uden login (preview)
            </button>

            <button className="btn btn-ghost btn-full btn-sm" style={{ marginTop:8, opacity:0.5, fontSize:12 }}
              onClick={() => {
                setOnboardStep(1);
                setAllergens([]);
                setCustomAllerg([]);
                setFamily([]);
                setUser({ name:"", birth_year:"", email:"", phone:"" });
                setScreen(SCREENS.ONBOARD);
              }}>
              🧪 Test onboarding
            </button>
            
            {/* Build-tidspunkt — login */}
            <div style={{ marginTop:20, textAlign:"center", fontSize:10, color:"var(--muted)", opacity:.6, letterSpacing:".3px" }}>
              Sidst opdateret {buildLabel}
            </div>
          </div>
        )}

        {/* ══ ONBOARDING ══ */}
        {(screen === SCREENS.ONBOARD || editMode) && (
          <div className="onboard-wrap fade-in">
            {!editMode && (
              <div style={{ textAlign:"center", padding:"4px 0 20px" }}>
                <div style={{ marginBottom:6 }}><EatSafeLogo size={40} variant="light" /></div>
                <div style={{ fontSize:20, fontWeight:800, color:"var(--text)" }}>Opsæt din profil</div>
                <div style={{ fontSize:13, color:"var(--muted)", marginTop:4 }}>Tager under 2 minutter</div>
              </div>
            )}
            {editMode && <div style={{ height:4 }} />}
            {/* Step header med tilbage og fremgang */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              {onboardStep > 1 && (
                <button onClick={() => setOnboardStep(onboardStep - 1)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:"4px 0", flexShrink:0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2">
                    <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
              )}
              <div style={{ flex:1 }}>
                <StepBar total={10} current={onboardStep === 25 ? 3 : onboardStep < 3 ? onboardStep : onboardStep + 1} />
              </div>
            </div>

            {/* ── TRIN 1: Hvad er EatSafe ── */}
            {onboardStep === 1 && (
              <div className="fade-in">
                <div className="card" style={{ textAlign:"center", padding:"24px 20px 16px" }}>
                  <div style={{ marginBottom:10 }}><Icon name="list" size={48} color="var(--ink2)" /></div>
                  <div style={{ fontSize:19, fontWeight:900, color:"var(--ink)", marginBottom:8 }}>Velkommen til EatSafe</div>
                  <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.6 }}>Din personlige allergiguide — til dig og hele familien.</div>
                </div>

                {/* Feature tour — swipeable kort */}
                {[
                  { emoji:"📷", bg:"#1F2733", color:"#fff", title:"Skan på sekunder", desc:"Hold kameraet over en stregkode. EatSafe fortæller dig øjeblikkeligt om produktet er sikkert for dig." },
                  { emoji:"👨‍👩‍👧", bg:"#22C55E", color:"#fff", title:"Hele familien", desc:"Opret profiler for børn, partner og andre. Se på ét blik hvem der kan spise hvad." },
                  { emoji:"🍝", bg:"#6366F1", color:"#fff", title:"Sikre opskrifter", desc:"Over 600 opskrifter filtreret til netop din families præferencer. Med ingrediensliste og fremgangsmåde." },
                  { emoji:"🌍", bg:"#F59E0B", color:"#fff", title:"Madpas til udlandet", desc:"Vis tjenere dine allergier på 17 sprog. Med udtale og forklaring på det lokale sprog." },
                ].map((f, i) => i === tourIdx ? (
                  <div key={i} style={{ marginBottom:4 }}>
                    <div style={{ background:f.bg, borderRadius:18, padding:"20px", marginBottom:10 }}>
                      <div style={{ fontSize:36, marginBottom:8 }}>{f.emoji}</div>
                      <div style={{ fontSize:18, fontWeight:900, color:f.color, marginBottom:6 }}>{f.title}</div>
                      <div style={{ fontSize:13, color:f.color, opacity:0.8, lineHeight:1.65 }}>{f.desc}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:10 }}>
                      {[0,1,2,3].map(idx => (
                        <div key={idx} onClick={() => setTourIdx(idx)}
                          style={{ width: tourIdx===idx ? 20 : 7, height:7, borderRadius:4, background: tourIdx===idx ? "var(--ink)" : "var(--border2)", cursor:"pointer", transition:"all .25s" }} />
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      {tourIdx > 0 && (
                        <button onClick={() => setTourIdx(v => v-1)}
                          style={{ flex:1, padding:"12px", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--ink2)", cursor:"pointer" }}>
                          ← Forrige
                        </button>
                      )}
                      {tourIdx < 3 ? (
                        <button onClick={() => setTourIdx(v => v+1)}
                          style={{ flex:1, padding:"12px", background:"var(--ink)", border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer" }}>
                          Næste →
                        </button>
                      ) : (
                        <button onClick={() => setOnboardStep(2)}
                          style={{ flex:1, padding:"12px", background:"var(--green)", border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:14, fontWeight:800, color:"#fff", cursor:"pointer" }}>
                          Kom i gang →
                        </button>
                      )}
                    </div>
                    {tourIdx < 3 && (
                      <button onClick={() => setOnboardStep(2)}
                        style={{ width:"100%", background:"none", border:"none", padding:"10px", fontFamily:"var(--f)", fontSize:12, color:"var(--muted)", cursor:"pointer", marginTop:4 }}>
                        Spring over
                      </button>
                    )}
                  </div>
                ) : null)}
              </div>
            )}
            {onboardStep === 2 && (
              <div className="fade-in">
                <div className="card" style={{ textAlign:"center", padding:"20px 20px 14px" }}>
                  <div style={{ marginBottom:8 }}><Icon name="info" size={44} color="var(--ink2)" /></div>
                  <div style={{ fontSize:17, fontWeight:900, color:"var(--ink)", marginBottom:6 }}>Forstå vores data</div>
                  <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>Vi arbejder hårdt for at give dig pålidelig information — men det er vigtigt du forstår kilden.</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    ["check","Verificerede produkter","Gennemgået og godkendt af vores team.","var(--green-lt)","var(--green)"],
                    ["globe","Open Food Facts","Global frivillig database. Ikke garanteret korrekt.","var(--amber-lt)","var(--amber)"],
                    ["warning","Bruger-indsendte","Afventer godkendelse. Brug med forsigtighed.","var(--red-lt)","var(--red)"],
                  ].map(([icon, title, text, bg, color]) => (
                    <div key={title} style={{ background:bg, border:`1px solid ${color}`, borderRadius:12, padding:"10px 14px", display:"flex", gap:10, alignItems:"flex-start" }}>
                      <div style={{ flexShrink:0 }}><Icon name={icon} size={18} color={color} /></div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color, marginBottom:2 }}>{title}</div>
                        <div style={{ fontSize:11, color:"var(--muted2)", lineHeight:1.4 }}>{text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:12, padding:"12px", marginTop:8 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>Vigtigt</div>
                  <div style={{ fontSize:11, color:"var(--muted2)", lineHeight:1.6 }}>EatSafe <strong>erstatter ikke lægehjælp</strong>. Tjek altid den originale emballage ved alvorlige allergier. <strong>Brug på eget ansvar.</strong></div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(1)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setOnboardStep(25)}>Jeg forstår →</button>
                </div>
              </div>
            )}

            {/* ── TRIN 2.5: Hvad kan EatSafe? ── */}
            {onboardStep === 25 && (
              <div className="fade-in">
                <div style={{ textAlign:"center", marginBottom:20 }}>
                  <div style={{ fontSize:48, marginBottom:8 }}>✨</div>
                  <div className="step-title">EatSafe dækker tre områder</div>
                  <div className="step-sub">Fortæl os hvad der gælder for dig — vi holder øje med det hele</div>
                </div>

                {[
                  {
                    emoji:"🚨",
                    color:"var(--red)",
                    bg:"var(--red-lt)",
                    border:"var(--red-md)",
                    title:"Allergier / intolerancer",
                    desc:"Reaktioner på fødevarer — fra livstruende allergier til ubehag ved intolerance. Vi viser tydeligt om et produkt indeholder eller kan indeholde dine allergener.",
                    examples:["Mælkeallergi","Hvedeallergi","Laktoseintolerance","Nøddeallergi","Skaldyrsallergi"],
                  },
                  {
                    emoji:"🔬",
                    color:"var(--amber)",
                    bg:"var(--amber-lt)",
                    border:"var(--amber-md)",
                    title:"E-numre",
                    desc:"Tilsætningsstoffer i forarbejdede fødevarer. Vi markerer dine valgte E-numre direkte i ingredienslisten, så du nemt kan spotte dem.",
                    examples:["E621 (MSG)","E102 (Tartrazin)","E211 (Natriumbenzoat)","E951 (Aspartam)"],
                  },
                  {
                    emoji:"🌱",
                    color:"var(--green)",
                    bg:"var(--green-lt)",
                    border:"var(--green-mid)",
                    title:"Diæter",
                    desc:"Personlige kostvaner og livsstilsvalg. Vi filtrerer opskrifter og produkter så de passer til dig.",
                    examples:["Vegansk","Vegetarisk","Glutenfri","Keto / Lavkulhydrat"],
                  },
                ].map(cat => (
                  <div key={cat.title} style={{ background:cat.bg, border:`1px solid ${cat.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:24 }}>{cat.emoji}</span>
                      <div style={{ fontSize:14, fontWeight:800, color:cat.color }}>{cat.title}</div>
                    </div>
                    <div style={{ fontSize:12, color:"var(--ink2)", lineHeight:1.6, marginBottom:8 }}>{cat.desc}</div>
                  </div>
                ))}

                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(2)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setOnboardStep(3)}>Fortsæt →</button>
                </div>
              </div>
            )}

            {/* ── TRIN 3: Din profil ── */}
            {onboardStep === 3 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">Hvem er du?</div>
                  <div className="step-sub">Disse oplysninger bruges til din personlige allergiprofil. Du kan altid redigere dem senere.</div>
                  {[
                    ["Dit fulde navn *","text","Fx. Anna Hansen","name"],
                    ["Email *","email","din@email.dk","email"],
                    ["Telefon","tel","+45 12 34 56 78","phone"],
                    ["Fødselsår *","number","Fx. 1990","birth_year"],
                  ].map(([lbl,type,ph,key]) => (
                    <div key={key} style={{ marginBottom:10 }}>
                      <label className="field-lbl">{lbl}</label>
                      <input className="field" type={type} placeholder={ph} value={user[key]||""} onChange={e => setUser(u => ({ ...u, [key]: e.target.value }))}
                        style={key==="email" ? { background: user.email ? "var(--paper2)" : "var(--paper2)", opacity: loginEmail ? 0.6 : 1 } : {}} 
                        readOnly={key === "email" && (!!loginEmail || isOAuth)}
                      />
                      {key === "email" && isOAuth && (
                        <div style={{ fontSize:10, color:"var(--green)", marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                          Bekræftet via Google
                        </div>
                      )}
                    </div>
                  ))}
                  <label className="field-lbl">Køn <span style={{ color:"var(--red)" }}>*</span></label>
                  <div style={{ display:"flex", gap:8, marginBottom:4 }}>
                    {["Mand","Kvinde","Andet"].map(g => (
                      <div key={g} onClick={() => setUser(u => ({...u, gender:g}))}
                        style={{ flex:1, padding:"9px 0", textAlign:"center", borderRadius:8,
                          border:`1.5px solid ${user.gender===g?"var(--green)":"var(--border)"}`,
                          background:user.gender===g?"var(--green-lt)":"#fff",
                          fontSize:13, fontWeight:700,
                          color:user.gender===g?"var(--green)":"var(--muted)", cursor:"pointer" }}>
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary btn-full" onClick={saveProfileStep1}
                  disabled={!(user.name||"").trim() || !(user.email||loginEmail||"").trim() || !user.birth_year || !user.gender}>
                  Fortsæt →
                </button>
                {(!(user.name||"").trim() || !(user.email||loginEmail||"").trim() || !user.birth_year || !user.gender) && (
                  <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", marginTop:6 }}>
                    {!(user.name||"").trim() ? "Navn er påkrævet" : !(user.email||loginEmail||"").trim() ? "Email er påkrævet" : !user.birth_year ? "Fødselsår er påkrævet" : "Køn er påkrævet"}
                  </div>
                )}
              </div>
            )}

            {/* ── TRIN 4: Dine allergier / intolerancer ── */}
            {onboardStep === 4 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">Allergier / intolerancer</div>

                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:12, lineHeight:1.4 }}>
                    Tryk for at markere en allergi eller intolerance
                  </div>

                  <div className="chip-grid">
                    {ALLERGENS.map(a => {
                      const on = allergens.includes(a.id);
                      return (
                        <div key={a.id} className="chip" style={{
                          background: on ? "var(--red-lt)" : "var(--paper2)",
                          border: `1.5px solid ${on ? "var(--red)" : "var(--border)"}`,
                          color: on ? "var(--red)" : "var(--ink)",
                        }}
                          onClick={() => setAllergens(p => on ? p.filter(x => x !== a.id) : [...p, a.id])}>
                          <span style={{ flex:1 }}>{a.emoji} {a.label}</span>
                          {on && <div style={{ fontSize:9, fontWeight:800, color:"var(--red)" }}>✓</div>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Skriv selv */}
                  <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid var(--border)" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Kan ikke finde din allergi eller din intolerance?</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.6 }}>
                      Tilføj selv — enten en hel allergikategori (fx. "Fructose") eller en specifik ingrediens du reagerer på (fx. "Kasein", "Sorbitol", "Hvede-kimolie"). Vi fremhæver det i ingredienslister.
                    </div>
                    <div className="input-row" style={{ marginBottom: customAllerg.length ? 8 : 0 }}>
                      <input className="field" placeholder="Fx. Fructose…" value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        onKeyDown={e => { if (e.key==="Enter"&&customInput.trim()) { setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}} />
                      <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}}>+</button>
                    </div>
                    {customAllerg.length > 0 && (
                      <div className="tags">
                        {customAllerg.map((a,i) => (
                          <div key={i} className="tag">{a}<span className="tag-x" onClick={() => setCustomAllerg(c=>c.filter(x=>x!==a))}>×</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button className="btn btn-primary btn-full" onClick={async () => { await saveAllergensStep2(); setOnboardStep(5); }}>Fortsæt →</button>
                <div className="onboard-skip">Kan springes over</div>
              </div>
            )}

            {/* ── TRIN 5: E-numre ── */}
            {onboardStep === 5 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">E-numre</div>
                  <div className="step-sub">Vælg E-numre du ønsker at undgå. Vi markerer dem i ingredienslister.</div>

                  {/* Mest valgte */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Mest valgte</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {[
                        {e:"E621",n:"MSG - Smagsforstærker"},
                        {e:"E211",n:"Natriumbenzoat (konservering)"},
                        {e:"E102",n:"Tartrazin (gul farve)"},
                        {e:"E951",n:"Aspartam (sødemiddel)"},
                        {e:"E250",n:"Natriumnitrit (konservering)"},
                        {e:"E320",n:"BHA (antioxidant)"},
                      ].map(({e,n}) => {
                        const on = selectedENumbers.includes(e);
                        return (
                          <div key={e} onClick={() => setSelectedENumbers(p => on ? p.filter(x=>x!==e) : [...p,e])}
                            style={{ padding:"6px 12px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:700,
                              background: on?"var(--red-lt)":"var(--paper2)",
                              color: on?"var(--red)":"var(--ink2)",
                              border:`1.5px solid ${on?"var(--red)":"var(--border)"}` }}>
                            {e} {on?"✓":""}
                            <div style={{ fontSize:10, fontWeight:400, color: on?"var(--red)":"var(--muted)" }}>{n}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <ENumberPicker selected={selectedENumbers} onChange={setSelectedENumbers} />
                  <div style={{ marginTop:10, fontSize:11, color:"var(--muted)", lineHeight:1.5, paddingTop:10, borderTop:"1px solid var(--border)" }}>
                    Kan du ikke finde det du leder efter? Vi tilføjer løbende flere valgmuligheder med større sikkerhed.
                  </div>
                </div>

                <button className="btn btn-primary btn-full" onClick={() => setOnboardStep(6)}>Fortsæt →</button>
                <div className="onboard-skip">Kan springes over</div>
              </div>
            )}

            {/* ── TRIN 7: Familie ── */}
            {onboardStep === 7 && (
              <div className="fade-in">
                <div className="step-title" style={{ textAlign:"center" }}>Familiemedlemmer</div>
                <div style={{ fontSize:13, color:"var(--muted2)", textAlign:"center", marginBottom:16 }}>Tilføj familiemedlemmer med egne allergier. Valgfrit.</div>

                {/* Allerede tilføjede */}
                {family.length > 0 && (
                  <div className="card" style={{ marginBottom:12 }}>
                    {family.map(m => (
                      <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                        <div className="fm-avatar" style={{ background:m.color, color:"#fff" }}>{initials(m.name)}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:800, fontSize:14 }}>{m.name}</div>
                          <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                            {m.allergens.length ? m.allergens.map(id => ALLERGENS.find(a=>a.id===id)?.label).join(", ") : "Ingen allergier"}
                          </div>
                        </div>
                        <div onClick={() => removeMember(m.id)} style={{ cursor:"pointer", opacity:.4 }}>
                          <Icon name="trash" size={18} color="var(--muted)" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tilføj nyt medlem */}
                <div className="card" style={{ marginBottom:12 }}>
                  <div className="card-lbl" style={{ marginBottom:12 }}>Tilføj nyt familiemedlem</div>
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
                    onAdd={addMember}
                    addLabel={`+ Tilføj ${newMemberName||"familiemedlem"}`}
                  />
                </div>

                <button className="btn btn-primary btn-full" onClick={() => setOnboardStep(8)}>Fortsæt →</button>
                <div className="onboard-skip">Kan springes over</div>
              </div>
            )}

            {/* ── TRIN 6: Diæt ── */}
            {onboardStep === 6 && (
              <div className="step fade-in">
                <div className="step-title">Din diæt</div>
                <div style={{ fontSize:13, color:"var(--muted2)", marginBottom:16, lineHeight:1.5 }}>
                  Vælg din diæt så vi kan filtrere produkter og opskrifter til dig.
                </div>
                <div className="chip-grid" style={{ marginBottom:12 }}>
                  {DIETS.map(d => { const on = (user.diets||[]).includes(d.id); return (
                    <div key={d.id} className={`chip${on?" on":""}`}
                      onClick={() => setUser(u => ({ ...u, diets: on ? (u.diets||[]).filter(x=>x!==d.id) : [...(u.diets||[]), d.id] }))}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700 }}>{d.label}</div>
                        <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{d.desc}</div>
                      </div>
                      {on && <div className="chip-check">✓</div>}
                    </div>
                  );})}
                </div>
                <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5, marginBottom:20 }}>
                  Diæt-tjek er vejledende og baseret på produkttags. Tjek altid ingredienserne selv.
                </div>
                <button className="btn btn-primary btn-full" onClick={() => setOnboardStep(7)}>Fortsæt →</button>
                <button className="btn btn-ghost btn-full btn-sm" style={{ marginTop:8 }} onClick={() => { setUser(u => ({...u, diets:[]})); setOnboardStep(7); }}>Ingen særlig diæt</button>
              </div>
            )}

            {/* ── TRIN 8: Fællesskabet ── */}
            {onboardStep === 8 && (
              <div className="fade-in">
                <div className="card" style={{ textAlign:"center", padding:"20px 20px 14px" }}>
                  <div style={{ marginBottom:8 }}><Icon name="heart" size={44} color="var(--ink2)" /></div>
                  <div style={{ fontSize:17, fontWeight:900, color:"var(--ink)", marginBottom:6 }}>Hjælp fællesskabet</div>
                  <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>Når du scanner et ukendt produkt kan du indsende det og hjælpe andre.</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    ["1️⃣","Skan stregkoden","Hold kameraet over stregkoden på produktet."],
                    ["2️⃣","Fotografér ingredienslisten","Tag et billede af bagsiden af pakken."],
                    ["3️⃣","AI analyserer","Vi finder allergener automatisk — du kan tjekke inden du sender."],
                    ["4️⃣","Admin godkender","En administrator gennemgår produktet."],
                    ["5️⃣","Alle får glæde af det","Produktet er nu tilgængeligt for alle brugere."],
                  ].map(([num, title, text]) => (
                    <div key={title} style={{ display:"flex", gap:10, alignItems:"flex-start", background:"#fff", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontSize:15, fontWeight:800, color:"var(--green)", flexShrink:0, width:20 }}>{num}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:"var(--ink)", marginBottom:2 }}>{title}</div>
                        <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.4 }}>{text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(7)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setOnboardStep(9)}>Fortsæt →</button>
                </div>
              </div>
            )}

            {/* ── TRIN 9: Oversigt & Klar! ── */}
            {onboardStep === 9 && (
              <div className="fade-in">

                {/* Header */}
                <div style={{ textAlign:"center", padding:"8px 0 20px" }}>
                  <div style={{ width:64, height:64, borderRadius:"50%", background:"var(--green-lt)",
                    display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
                    <Icon name="check" size={32} color="var(--green)" />
                  </div>
                  <div style={{ fontSize:24, fontWeight:900, color:"var(--ink)", marginBottom:6 }}>Alt er klar!</div>
                  <div style={{ fontSize:14, color:"var(--muted2)", lineHeight:1.6 }}>
                    Her er et overblik over din profil. Du kan altid redigere senere.
                  </div>
                </div>

                {/* Din profil */}
                <div className="card" style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ fontWeight:800, fontSize:15, color:"var(--ink)" }}>
                      {user.name || "Din profil"}
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize:12, padding:"4px 10px" }}
                      onClick={() => setOnboardStep(3)}>
                      Rediger
                    </button>
                  </div>

                  {/* Allergier */}
                  {allergens.length > 0 ? (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>
                        Allergier / intolerancer
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {allergens.map(id => {
                          const a = ALLERGENS.find(x=>x.id===id);
                          return (
                            <div key={id} style={{ padding:"5px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                              background:"var(--red-lt)", color:"var(--red)",
                              border:"1px solid var(--red-md)" }}>
                              {a?.emoji} {a?.label}
                            </div>
                          );
                        })}
                        {customAllerg.map((c,i) => (
                          <div key={i} style={{ padding:"5px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                            background:"var(--paper2)", color:"var(--muted)", border:"1px solid var(--border)" }}>
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>Ingen allergier registreret</div>
                  )}

                  {/* Diæt */}
                  {user.diets && user.diets.length > 0 && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Diæt</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {user.diets.map(d => (
                          <div key={d} style={{ padding:"5px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                            background:"var(--green-lt)", color:"var(--green)", border:"1px solid var(--green-mid)" }}>
                            {DIETS.find(x=>x.id===d)?.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* E-numre */}
                  {selectedENumbers.length > 0 && (
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>E-numre der undgås</div>
                      <div style={{ fontSize:12, color:"var(--muted2)" }}>{selectedENumbers.length} E-numre valgt</div>
                    </div>
                  )}
                </div>

                {/* Familiemedlemmer */}
                {family.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>Familiemedlemmer</div>
                    {family.map(m => (
                      <div key={m.id} className="card" style={{ marginBottom:8, padding:"12px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div className="fm-avatar" style={{ background:m.color, color:"#fff", flexShrink:0 }}>
                            {initials(m.name)}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:800, fontSize:14, color:"var(--ink)" }}>{m.name}</div>
                            <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                              {m.allergens.length
                                ? m.allergens.map(id=>ALLERGENS.find(a=>a.id===id)?.label).join(", ")
                                : "Ingen allergier"}
                            </div>
                          </div>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize:12, padding:"4px 10px", flexShrink:0 }}
                            onClick={() => { setScreen(SCREENS.FAMILY); }}>
                            Rediger
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {family.length === 0 && (
                  <div className="card" style={{ marginBottom:12, textAlign:"center", padding:"14px" }}>
                    <div style={{ fontSize:13, color:"var(--muted2)", marginBottom:8 }}>Ingen familiemedlemmer tilføjet</div>
                    <button className="btn btn-outline btn-sm" onClick={() => setOnboardStep(7)}>
                      + Tilføj familiemedlem
                    </button>
                  </div>
                )}

                {/* Afslut */}
                <button className="btn btn-primary btn-full" style={{ marginTop:4 }} onClick={finishOnboard}>
                  {editMode ? "Gem ændringer ✓" : "Gå til appen →"}
                </button>
                {editMode && (
                  <button className="btn btn-outline btn-full" style={{ marginTop:8 }}
                    onClick={() => { setEditMode(false); setScreen(SCREENS.PROFILE); }}>
                    Annuller
                  </button>
                )}
              </div>
            )}

                    </div>
        )}

    </>
  );
}
