// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, SCREENS, DIETS, AVATAR_COLORS, E_NUMBERS, E_CATEGORIES } from "./constants.jsx";
import { initials } from "./helpers.js";
import { EatSafeLogo, Icon } from "./SharedComponents.jsx";
import { ENumberPicker } from "./AllergenPicker.jsx";
import { MemberForm } from "./MemberForm.jsx";

// ── Welcome demo-slider ────────────────────────────────────────────────────
const WELCOME_SLIDES = [
  {
    title: "Skan — og få svar på 2 sekunder",
    sub: "Hold kameraet over stregkoden. EatSafe slår op i 20.000+ produkter og fortæller dig præcist om varen er sikker for dig og din familie — med farvekodet resultat og forklaring.",
    bg: "#111d13", accent: "#4ADE80",
    mockup: (
      <div style={{ background:"#0d160e", borderRadius:14, padding:"12px 14px", marginTop:12, border:"1px solid rgba(74,222,128,.15)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ width:40, height:40, background:"rgba(74,222,128,.1)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🥛</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#fff" }}>Arla Letmælk 1L</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.35)" }}>EAN 5710085008001 · Arla Foods</div>
          </div>
          <div style={{ padding:"5px 11px", borderRadius:20, background:"rgba(239,68,68,.2)", border:"1px solid rgba(239,68,68,.5)", fontSize:11, fontWeight:800, color:"#f87171" }}>⚠ FARE</div>
        </div>
        <div style={{ background:"rgba(239,68,68,.07)", border:"1px solid rgba(239,68,68,.18)", borderRadius:8, padding:"8px 10px", fontSize:11, color:"#fca5a5", lineHeight:1.6 }}>
          <strong>Laktose</strong> — reagerer på dette: Anna, Sofie
        </div>
        <div style={{ marginTop:8, display:"flex", gap:6 }}>
          <div style={{ padding:"3px 9px", borderRadius:20, background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.2)", fontSize:10, color:"#4ADE80", fontWeight:700 }}>✓ Mads ok</div>
          <div style={{ padding:"3px 9px", borderRadius:20, background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.2)", fontSize:10, color:"#4ADE80", fontWeight:700 }}>✓ Tage ok</div>
        </div>
      </div>
    ),
  },
  {
    title: "Én app — hele familiens allergier",
    sub: "Opret en profil for hvert familiemedlem med deres egne allergier, intolerancer og diæter. Når du scanner, ser du med det samme hvem der kan spise varen — og hvem der ikke kan.",
    bg: "#0f0d1f", accent: "#818cf8",
    mockup: (
      <div style={{ marginTop:12 }}>
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:10 }}>
          {[["Jan","#4ADE80","Laktose · Gluten"],["Anna","#818cf8","Laktose"],["Sofie","#f59e0b","Nødder · Sesam"],["Mads","#34d399","Ingen"]].map(([n,c,a]) => (
            <div key={n} style={{ background:"rgba(255,255,255,.05)", borderRadius:10, padding:"9px 10px", textAlign:"center", border:"1px solid rgba(255,255,255,.08)", flex:1 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:c, color:"#000", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, margin:"0 auto 5px" }}>{n[0]}</div>
              <div style={{ fontSize:9, fontWeight:700, color:"#fff", marginBottom:2 }}>{n}</div>
              <div style={{ fontSize:8, color:"rgba(255,255,255,.35)", lineHeight:1.3 }}>{a}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"rgba(99,102,241,.08)", border:"1px solid rgba(99,102,241,.2)", borderRadius:8, padding:"8px 10px", fontSize:11, color:"rgba(255,255,255,.6)", lineHeight:1.5 }}>
          💡 Alle profiler tjekkes samtidig ved hver scanning
        </div>
      </div>
    ),
  },
  {
    title: "Find sikre alternativer automatisk",
    sub: "Hvis et produkt indeholder noget du reagerer på, finder EatSafe automatisk lignende produkter fra samme kategori — som er sikre for dig. Ingen manuel søgning.",
    bg: "#1a0d0d", accent: "#f87171",
    mockup: (
      <div style={{ marginTop:12 }}>
        <div style={{ background:"rgba(239,68,68,.07)", border:"1px solid rgba(239,68,68,.18)", borderRadius:10, padding:"9px 12px", marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>🥛</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#f87171" }}>Arla Letmælk — FARE</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.35)" }}>Indeholder laktose</div>
          </div>
        </div>
        <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>✓ Sikre alternativer</div>
        {[["Oatly Havregrød","Havredrik · Laktosefri","#4ADE80"],["Alpro Soya","Soyadrik · Laktosefri","#4ADE80"]].map(([name,tag,c]) => (
          <div key={name} style={{ background:"rgba(74,222,128,.06)", border:"1px solid rgba(74,222,128,.15)", borderRadius:8, padding:"8px 10px", marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>✅</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{name}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.35)" }}>{tag}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Delt indkøbsliste i realtid",
    sub: "Opret en fælles indkøbsliste med familien. Alle ser ændringer live — uanset om mor er i Netto og far er hjemme. Produkter tilføjes direkte fra et scan-resultat.",
    bg: "#0d1520", accent: "#38bdf8",
    mockup: (
      <div style={{ marginTop:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ fontSize:12, fontWeight:800, color:"#fff" }}>Familiens indkøbsliste</div>
          <div style={{ fontSize:10, color:"#38bdf8", fontWeight:700 }}>● Live</div>
        </div>
        {[
          ["Oatly Havregrød 1L", false, "Jan tilføjede"],
          ["Glutenfri pasta", false, "Anna tilføjede"],
          ["Alpro Soya", true, "Købt"],
          ["Havregryns-cookies", false, "Sofie tilføjede"],
        ].map(([name, done, sub]) => (
          <div key={name} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, marginBottom:5, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", opacity: done ? 0.45 : 1 }}>
            <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${done?"#38bdf8":"rgba(255,255,255,.2)"}`, background: done?"#38bdf8":"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {done && <span style={{ fontSize:11, color:"#000", fontWeight:800 }}>✓</span>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#fff", textDecoration: done?"line-through":"none" }}>{name}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.3)" }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "600+ opskrifter — filtreret til jer",
    sub: "Alle opskrifter er automatisk filtreret ud fra familiens samlede allergiprofil. Du ser kun opskrifter der er sikre for alle. Kan skaleres til det antal portioner du skal lave.",
    bg: "#120d20", accent: "#a78bfa",
    mockup: (
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:12 }}>
        {[
          ["🍝","Spaghetti Bolognese","Glutenfri · Mælkefri · Nøddefri","✅ Sikker for alle"],
          ["🥗","Nikkei Ceviche","Glutenfri · Laktosefri","✅ Sikker for alle"],
          ["🍛","Chicken Tikka Masala","Nøddefri · Sesamfri","⚠ Tjek: mælk i sauce"],
        ].map(([e,name,tags,status]) => (
          <div key={name} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.05)", borderRadius:10, padding:"9px 12px", border:"1px solid rgba(255,255,255,.07)" }}>
            <div style={{ fontSize:22 }}>{e}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{name}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.35)" }}>{tags}</div>
            </div>
            <div style={{ fontSize:10, fontWeight:700, color: status.startsWith("✅") ? "#4ADE80" : "#fbbf24", textAlign:"right", maxWidth:70 }}>{status}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Leksikon & E-numre",
    sub: "Tap på en ingrediens i et scan-resultat og få øjeblikkelig forklaring — hvad er det, og hvem reagerer typisk på det? Overvåg specifikke E-numre og få advarsel hver gang de dukker op.",
    bg: "#131a10", accent: "#86efac",
    mockup: (
      <div style={{ marginTop:12 }}>
        <div style={{ background:"rgba(134,239,172,.07)", border:"1px solid rgba(134,239,172,.18)", borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <div style={{ padding:"3px 9px", borderRadius:20, background:"rgba(251,191,36,.15)", border:"1px solid rgba(251,191,36,.3)", fontSize:11, fontWeight:800, color:"#fbbf24" }}>E621</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>MSG · Smagsforstærker</div>
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", lineHeight:1.6 }}>Glutamat-baseret smagsforstærker. Kan give hovedpine og hjertebanken hos følsomme personer. Hyppig i chips, nudler og færdigretter.</div>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["E211 Natriumbenzoat","E102 Tartrazin","E951 Aspartam"].map(e => (
            <div key={e} style={{ padding:"4px 10px", borderRadius:20, background:"rgba(251,191,36,.08)", border:"1px solid rgba(251,191,36,.2)", fontSize:10, fontWeight:700, color:"#fbbf24" }}>{e}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Madpas til udlandet",
    sub: "Rejser du? Vis tjenere og butiksansatte dine allergier på 17 sprog — med lokal udtale og forklaring. Virker offline, så det altid er tilgængeligt.",
    bg: "#1a1208", accent: "#fbbf24",
    mockup: (
      <div style={{ background:"rgba(251,191,36,.07)", borderRadius:14, padding:"12px 14px", marginTop:12, border:"1px solid rgba(251,191,36,.18)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <span style={{ fontSize:20 }}>🇮🇹</span>
          <div style={{ fontSize:11, fontWeight:800, color:"rgba(251,191,36,.8)", textTransform:"uppercase", letterSpacing:"1px" }}>Italiensk</div>
        </div>
        <div style={{ fontSize:13, fontWeight:800, color:"#fff", marginBottom:3 }}>Sono allergico al latte e al glutine.</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontStyle:"italic", marginBottom:10 }}>"so-no al-ler-JI-ko al LAT-te e al glu-TI-ne"</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginBottom:6 }}>Tilgængeligt på:</div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {["🇩🇰","🇬🇧","🇩🇪","🇫🇷","🇪🇸","🇵🇹","🇳🇱","🇸🇪"].map(f => <span key={f} style={{ fontSize:18 }}>{f}</span>)}
          <span style={{ fontSize:11, color:"rgba(255,255,255,.25)", alignSelf:"center" }}>+9 mere</span>
        </div>
      </div>
    ),
  },
  {
    title: "Klar til at prøve?",
    sub: "Gratis at oprette. Ingen kreditkort. Kom i gang på under 2 minutter.",
    bg: "#0d1f12", accent: "#4ADE80",
    cta: true, mockup: null,
  },
];

function WelcomeDemoSlider({ setScreen, setAuthTab }) {
  const [idx, setIdx] = useState(0);
  const slide = WELCOME_SLIDES[idx];
  const goSignup = () => { setAuthTab("signup"); setScreen(SCREENS.LOGIN); };
  const goLogin  = () => { setAuthTab("login");  setScreen(SCREENS.LOGIN); };

  return (
    <div style={{ borderRadius:20, overflow:"hidden", border:"1px solid rgba(255,255,255,.08)", marginBottom:8 }}>

      {/* Overskrift */}
      <div style={{ background:"rgba(255,255,255,.04)", borderBottom:"1px solid rgba(255,255,255,.07)", padding:"12px 18px", textAlign:"center" }}>
        <div style={{ fontSize:13, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:"1.5px" }}>Det kan EatSafe</div>
      </div>

      {/* Slide-indhold */}
      <div style={{ background:slide.bg, padding:"18px 18px 16px", transition:"background .35s" }}>
        {/* Dots */}
        <div style={{ display:"flex", gap:4, justifyContent:"center", marginBottom:14, flexWrap:"wrap" }}>
          {WELCOME_SLIDES.map((_,i) => (
            <div key={i} onClick={() => setIdx(i)}
              style={{ width: i===idx ? 20 : 6, height:6, borderRadius:3,
                background: i===idx ? slide.accent : "rgba(255,255,255,.18)",
                cursor:"pointer", transition:"all .25s" }} />
          ))}
        </div>
        <div style={{ fontSize:17, fontWeight:900, color:"#fff", marginBottom:6, letterSpacing:"-.3px", lineHeight:1.3 }}>{slide.title}</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,.55)", lineHeight:1.65 }}>{slide.sub}</div>
        {slide.mockup}
        {slide.cta && (
          <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:10 }}>
            <button className="welcome-btn" onClick={goSignup}>Opret gratis konto →</button>
            <button className="welcome-btn-ghost" onClick={goLogin}>Jeg har allerede en konto</button>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ display:"flex", gap:8, padding:"10px 14px", background:"rgba(255,255,255,.03)", borderTop:"1px solid rgba(255,255,255,.07)" }}>
        <button disabled={idx===0} onClick={() => setIdx(i => i-1)}
          style={{ flex:1, padding:"9px", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:10,
            fontFamily:"var(--f)", fontSize:13, fontWeight:700, color: idx===0 ? "var(--muted)" : "var(--ink2)",
            cursor: idx===0 ? "default" : "pointer", opacity: idx===0 ? 0.4 : 1 }}>
          ← Forrige
        </button>
        {idx < WELCOME_SLIDES.length - 1 ? (
          <button onClick={() => setIdx(i => i+1)}
            style={{ flex:1, padding:"9px", background:"var(--green)", border:"none", borderRadius:10,
              fontFamily:"var(--f)", fontSize:13, fontWeight:800, color:"#071510", cursor:"pointer" }}>
            Næste →
          </button>
        ) : (
          <button onClick={goSignup}
            style={{ flex:1, padding:"9px", background:"var(--green)", border:"none", borderRadius:10,
              fontFamily:"var(--f)", fontSize:13, fontWeight:800, color:"#071510", cursor:"pointer" }}>
            Opret konto →
          </button>
        )}
      </div>

      {/* Faste CTA-knapper — altid synlige */}
      <div style={{ padding:"12px 14px 14px", background:"rgba(0,0,0,.2)", borderTop:"1px solid rgba(255,255,255,.05)", display:"flex", gap:8 }}>
        <button onClick={goSignup}
          style={{ flex:2, padding:"11px", background:"var(--green)", border:"none", borderRadius:12,
            fontFamily:"var(--f)", fontSize:13, fontWeight:800, color:"#071510", cursor:"pointer" }}>
          Opret gratis konto →
        </button>
        <button onClick={goLogin}
          style={{ flex:1, padding:"11px", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12,
            fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"rgba(255,255,255,.7)", cursor:"pointer" }}>
          Log ind
        </button>
      </div>
    </div>
  );
}

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
}) {
  return (
    <>
        {screen === SCREENS.WELCOME && (
          <div className="welcome-screen fade-in">
            {/* Logo + tagline */}
            <div className="welcome-logo-wrap" style={{ marginBottom:16 }}>
              <EatSafeLogo size={72} variant="light" />
              <div className="welcome-wordmark">
                <span className="welcome-wordmark-text">Eat<span>Safe</span></span>
              </div>
              <div className="welcome-tagline">Scan. Tjek. Spis trygt.</div>
            </div>

            {/* Demo-slider — kombineret feature-visning + CTA */}
            <WelcomeDemoSlider setScreen={setScreen} setAuthTab={setAuthTab} />

            {/* Privacy */}
            <div style={{ marginTop:16, fontSize:11, color:"var(--muted)", lineHeight:1.6, textAlign:"center" }}>
              Ved at oprette en konto accepterer du vores{" "}
              <a href="/privacy.html" target="_blank" style={{ color:"var(--green)", fontWeight:600 }}>privatlivspolitik</a>
            </div>
          </div>
        )}

        {/* ══ LOGIN / REGISTRERING ══ */}
        {screen === SCREENS.LOGIN && (
          <div className="login-wrap fade-in">

            {/* Logo */}
            <div className="login-header">
              <div className="login-shield" style={{background:"none",padding:0,width:56,height:56}}><EatSafeLogo size={56} variant="light" /></div>
              <div className="login-title">Eat<span style={{color:"var(--green)",fontStyle:"italic"}}>Safe</span></div>
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
                  background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:12,
                  cursor:"pointer", fontFamily:"var(--f)", fontSize:14, fontWeight:600, color:"var(--ink)",
                  transition:"all .15s" }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Fortsæt med Google
              </button>

              {/* Facebook */}
              <button onClick={() => handleOAuth("facebook")} disabled={authLoading}
                style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"13px 16px",
                  background:"#1877F2", border:"1px solid #1877F2", borderRadius:12,
                  cursor:"pointer", fontFamily:"var(--f)", fontSize:14, fontWeight:600, color:"#fff",
                  boxShadow:"var(--sh)", transition:"all .15s" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Fortsæt med Facebook
              </button>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 8px" }}>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
              <span style={{ fontSize:11, color:"var(--muted)", fontWeight:500 }}>eller</span>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
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
                {onboardStep > 0 && <StepBar total={5} current={onboardStep} />}
              </div>
            </div>

            {/* ── TRIN 0: Beta-information ── */}
            {onboardStep === 0 && (
              <div className="fade-in">
                <div className="card" style={{ textAlign:"center", padding:"28px 20px 20px" }}>
                  <div style={{ fontSize:52, marginBottom:16 }}>🧪</div>
                  <div style={{ fontSize:20, fontWeight:900, color:"var(--ink)", marginBottom:10, letterSpacing:"-.3px" }}>
                    Velkommen til EatSafe Beta
                  </div>
                  <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.7, marginBottom:20, textAlign:"left" }}>
                    Du er en af de første til at prøve EatSafe. Appen er stadig under udvikling, og vi har brug for din hjælp.
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:12, textAlign:"left", marginBottom:20 }}>
                    <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>💬</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>Giv os feedback</div>
                        <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5 }}>Tryk på Feedback-knappen når du støder på fejl eller har idéer. Vi læser alt.</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>❓</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>Brug hjælp-knappen</div>
                        <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5 }}>Tryk på ? øverst for en guide til den skærm du står på.</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>⚠️</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>Tjek altid emballagen</div>
                        <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5 }}>Allergendata kan mangle eller være ukorrekte. Appen er et hjælpeværktøj, ikke en garanti.</div>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary btn-full" style={{ marginTop:14 }}
                  onClick={() => setOnboardStep(1)}>
                  Forstået — kom i gang →
                </button>
              </div>
            )}

            {/* ── TRIN 1: Din profil (obligatorisk) ── */}
            {onboardStep === 1 && (() => {
              const nameOk = (user.name||"").trim().length > 0;
              const emailOk = (user.email||loginEmail||"").trim().length > 0;
              const ageOk = (user.age||"").toString().trim().length > 0 && Number(user.age) > 0;
              const genderOk = !!(user.gender);
              const phoneOk = (user.phone||"").trim().length > 0;
              const allOk = nameOk && emailOk && ageOk && genderOk && phoneOk;
              const missingFields = [
                !nameOk && "navn",
                !emailOk && "email",
                !ageOk && "alder",
                !genderOk && "køn",
                !phoneOk && "telefon",
              ].filter(Boolean);
              return (
                <div className="fade-in">
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:19, fontWeight:900, color:"var(--ink)", marginBottom:4 }}>Hvem er du?</div>
                    <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.5 }}>Oplysningerne bruges til din personlige allergiprofil og kan redigeres senere.</div>
                  </div>

                  <div className="card" style={{ marginBottom:12 }}>
                    {/* Navn */}
                    <div style={{ marginBottom:12 }}>
                      <label className="field-lbl">Fulde navn <span style={{ color:"var(--red)" }}>*</span></label>
                      <input className="field" type="text" placeholder="Fx. Anna Hansen"
                        value={user.name||""} onChange={e => setUser(u => ({...u, name:e.target.value}))}
                        style={{ borderColor: !nameOk && (user.name !== undefined) ? "var(--red-md)" : undefined }} />
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom:12 }}>
                      <label className="field-lbl">Email <span style={{ color:"var(--red)" }}>*</span></label>
                      <input className="field" type="email" placeholder="din@email.dk"
                        value={user.email||loginEmail||""}
                        onChange={e => setUser(u => ({...u, email:e.target.value}))}
                        readOnly={!!(loginEmail || isOAuth)}
                        style={{ opacity: (loginEmail || isOAuth) ? 0.6 : 1 }} />
                      {isOAuth && (
                        <div style={{ fontSize:10, color:"var(--green)", marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                          Bekræftet via Google
                        </div>
                      )}
                    </div>

                    {/* Telefon */}
                    <div style={{ marginBottom:12 }}>
                      <label className="field-lbl">Telefonnummer <span style={{ color:"var(--red)" }}>*</span></label>
                      <input className="field" type="tel" placeholder="+45 12 34 56 78"
                        value={user.phone||""} onChange={e => setUser(u => ({...u, phone:e.target.value}))} />
                    </div>

                    {/* Alder */}
                    <div style={{ marginBottom:14 }}>
                      <label className="field-lbl">Alder <span style={{ color:"var(--red)" }}>*</span></label>
                      <input className="field" type="number" inputMode="numeric" placeholder="Fx. 32" min="1" max="120"
                        value={user.age||""} onChange={e => setUser(u => ({...u, age:e.target.value}))}
                        style={{ maxWidth:120 }} />
                    </div>

                    {/* Køn */}
                    <div>
                      <label className="field-lbl">Køn <span style={{ color:"var(--red)" }}>*</span></label>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {["Mand","Kvinde","Andet","Vil ikke oplyse"].map(g => (
                          <div key={g} onClick={() => setUser(u => ({...u, gender:g}))}
                            style={{
                              padding:"9px 14px", borderRadius:8, cursor:"pointer",
                              border:`1px solid ${user.gender===g ? "var(--green)" : "var(--border)"}`,
                              background: user.gender===g ? "var(--green-lt)" : "var(--surface)",
                              fontSize:13, fontWeight:700,
                              color: user.gender===g ? "var(--green)" : "var(--muted)",
                              transition:"all .15s",
                            }}>
                            {g}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Validering */}
                  {!allOk && missingFields.length > 0 && (
                    <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", marginBottom:10 }}>
                      Mangler: {missingFields.join(", ")}
                    </div>
                  )}

                  <button className="btn btn-primary btn-full"
                    disabled={!allOk}
                    style={{ opacity: allOk ? 1 : 0.45 }}
                    onClick={() => allOk && saveProfileStep1().then(() => setOnboardStep(2))}>
                    Fortsæt →
                  </button>
                </div>
              );
            })()}
            {onboardStep === 97 && (
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
            {onboardStep === 96 && (
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
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setOnboardStep(1)}>Fortsæt →</button>
                </div>
              </div>
            )}



            {/* ── TRIN 2: Dine allergier / intolerancer ── */}
            {onboardStep === 2 && (
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
                          border: `1px solid ${on ? "var(--red)" : "var(--border)"}`,
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

                {/* ── E-numre: kollapsibel ── */}
                <div style={{ marginTop:12, borderTop:"1px solid var(--border)", paddingTop:12 }}>
                  <button
                    onClick={() => setShowENumbersInOnboard(s => !s)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:"4px 0", fontFamily:"var(--f)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:16 }}>🔢</span>
                      <div style={{ textAlign:"left" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>
                          Overvåg specifikke E-numre
                          {selectedENumbers.length > 0 && <span style={{ fontSize:11, color:"var(--amber)", marginLeft:6 }}>{selectedENumbers.length} valgt</span>}
                        </div>
                        <div style={{ fontSize:11, color:"var(--muted)" }}>Valgfrit — kan altid tilføjes senere</div>
                      </div>
                    </div>
                    <span style={{ fontSize:18, color:"var(--muted)", transform: showENumbersInOnboard ? "rotate(180deg)" : "none", transition:".2s" }}>⌄</span>
                  </button>
                  {showENumbersInOnboard && (
                    <div style={{ marginTop:12 }}>
                      <ENumberPicker selected={selectedENumbers} onChange={setSelectedENumbers} />
                    </div>
                  )}
                </div>

                <button className="btn btn-primary btn-full" style={{ marginTop:12 }} onClick={async () => { await saveAllergensStep2(); setOnboardStep(3); }}>Fortsæt →</button>
                {allergens.length === 0 && customAllerg.length === 0 ? (
                  <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", fontSize:12, color:"var(--muted)", padding:"10px 0", marginTop:2 }}
                    onClick={() => {
                      if (window.confirm("Er du sikker på, at du ingen allergier eller intolerancer har? Du kan altid tilføje dem senere under Profil.")) {
                        saveAllergensStep2().then(() => setOnboardStep(3));
                      }
                    }}>
                    Spring over — jeg har ingen allergier
                  </button>
                ) : (
                  <div style={{ textAlign:"center", fontSize:12, color:"var(--muted)", marginTop:6 }}>
                    {allergens.length + customAllerg.length} allergi{allergens.length + customAllerg.length !== 1 ? "er" : ""} valgt
                  </div>
                )}
              </div>
            )}

            {/* ── TRIN 5 (gammel): E-numre — udgået, integreret i trin 2 ── */}
            {onboardStep === 94 && (
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
                              border:`1px solid ${on?"var(--red)":"var(--border)"}` }}>
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
            {onboardStep === 4 && (
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

                <button className="btn btn-primary btn-full" onClick={() => setOnboardStep(5)}>Fortsæt →</button>
                <div className="onboard-skip">Kan springes over</div>
              </div>
            )}

            {/* ── TRIN 6: Diæt ── */}
            {onboardStep === 3 && (
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
                <button className="btn btn-primary btn-full" onClick={() => setOnboardStep(4)}>Fortsæt →</button>
                <button className="btn btn-ghost btn-full btn-sm" style={{ marginTop:8 }} onClick={() => { setUser(u => ({...u, diets:[]})); setOnboardStep(4); }}>Ingen særlig diæt</button>
              </div>
            )}

            {/* ── TRIN 8: Fællesskabet ── */}
            {onboardStep === 95 && (
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
                    <div key={title} style={{ display:"flex", gap:10, alignItems:"flex-start", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontSize:15, fontWeight:800, color:"var(--green)", flexShrink:0, width:20 }}>{num}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:"var(--ink)", marginBottom:2 }}>{title}</div>
                        <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.4 }}>{text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(4)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setOnboardStep(9)}>Fortsæt →</button>
                </div>
              </div>
            )}

            {/* ── TRIN 9: Oversigt & Klar! ── */}
            {onboardStep === 5 && (
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
                      onClick={() => setOnboardStep(1)}>
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
                    <button className="btn btn-outline btn-sm" onClick={() => setOnboardStep(4)}>
                      + Tilføj familiemedlem
                    </button>
                  </div>
                )}

                {/* Fællesskab-card */}
                <div style={{ background:"var(--warm-lt)", border:"1px solid var(--warm-md)", borderRadius:14, padding:"16px 18px", marginBottom:12, display:"flex", gap:12, alignItems:"flex-start" }}>
                  <div style={{ fontSize:28, flexShrink:0 }}>🤝</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)", marginBottom:4 }}>Du er nu en del af fællesskabet</div>
                    <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5 }}>Når du scanner ukendte produkter og indsender data, hjælper du alle andre med de samme allergier. Tak!</div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5, marginBottom:16, textAlign:"center", padding:"0 8px" }}>
                  ⚕️ EatSafe er vejledende og erstatter ikke medicinsk rådgivning. Tjek altid produktets emballage.
                </div>

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
