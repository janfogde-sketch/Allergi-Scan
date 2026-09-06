// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// demoSlides.jsx
// Fælles indhold til appens "feature-demo"-karrusel — brugt begge steder den
// vises: velkomst-skærmen for nye brugere (OnboardingScreen) og app-guiden
// loggede brugere selv kan åbne igen (ScannerScreen). Var tidligere kopieret
// ind i begge filer hver for sig med små, uensartede tekstforskelle.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_SLIDES = [
  {
    title: "Skan — og få svar på 2 sekunder",
    sub: "Hold kameraet over stregkoden. EatSafe slår op i 20.000+ produkter og fortæller dig præcist om varen er sikker for dig og din familie — med farvekodet resultat og forklaring.",
    bg: "#111d13", accent: "var(--green)",
    mockup: (
      <div style={{ background:"#0d160e", borderRadius:14, padding:"12px 14px", marginTop:12, border:"1px solid rgba(74,222,128,.15)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ width:40, height:40, background:"rgba(74,222,128,.1)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🥛</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#F1F2EE" }}>Arla Letmælk 1L</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.35)" }}>EAN 5710085008001 · Arla Foods</div>
          </div>
          <div style={{ padding:"5px 11px", borderRadius:20, background:"var(--red-md)", border:"1px solid rgba(255,82,82,.5)", fontSize:11, fontWeight:800, color:"var(--red)" }}>⚠ FARE</div>
        </div>
        <div style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:8, padding:"8px 10px", fontSize:11, color:"var(--red)", lineHeight:1.6 }}>
          <strong>Laktose</strong> — reagerer på dette: Anna, Sofie
        </div>
        <div style={{ marginTop:8, display:"flex", gap:6 }}>
          <div style={{ padding:"3px 9px", borderRadius:20, background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.2)", fontSize:10, color:"var(--green)", fontWeight:700 }}>✓ Mads ok</div>
          <div style={{ padding:"3px 9px", borderRadius:20, background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.2)", fontSize:10, color:"var(--green)", fontWeight:700 }}>✓ Tage ok</div>
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
          {[["Jan","var(--green)","Laktose · Gluten"],["Anna","#818cf8","Laktose"],["Sofie","#f59e0b","Nødder · Sesam"],["Mads","#34d399","Ingen"]].map(([n,c,a]) => (
            <div key={n} style={{ background:"rgba(255,255,255,.05)", borderRadius:10, padding:"9px 10px", textAlign:"center", border:"1px solid rgba(255,255,255,.08)", flex:1 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:c, color:"var(--on-green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, margin:"0 auto 5px" }}>{n[0]}</div>
              <div style={{ fontSize:9, fontWeight:700, color:"#F1F2EE", marginBottom:2 }}>{n}</div>
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
    bg: "#1a0d0d", accent: "var(--red)",
    mockup: (
      <div style={{ marginTop:12 }}>
        <div style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10, padding:"9px 12px", marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>🥛</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--red)" }}>Arla Letmælk — FARE</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.35)" }}>Indeholder laktose</div>
          </div>
        </div>
        <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>✓ Sikre alternativer</div>
        {[["Oatly Havregrød","Havredrik · Laktosefri"],["Alpro Soya","Soyadrik · Laktosefri"]].map(([name,tag]) => (
          <div key={name} style={{ background:"rgba(74,222,128,.06)", border:"1px solid rgba(74,222,128,.15)", borderRadius:8, padding:"8px 10px", marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>✅</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#F1F2EE" }}>{name}</div>
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
          <div style={{ fontSize:12, fontWeight:800, color:"#F1F2EE" }}>Familiens indkøbsliste</div>
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
              {done && <span style={{ fontSize:11, color:"var(--on-green)", fontWeight:800 }}>✓</span>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#F1F2EE", textDecoration: done?"line-through":"none" }}>{name}</div>
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
              <div style={{ fontSize:12, fontWeight:700, color:"#F1F2EE" }}>{name}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.35)" }}>{tags}</div>
            </div>
            <div style={{ fontSize:10, fontWeight:700, color: status.startsWith("✅") ? "var(--green)" : "#fbbf24", textAlign:"right", maxWidth:70 }}>{status}</div>
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
            <div style={{ fontSize:12, fontWeight:700, color:"#F1F2EE" }}>MSG · Smagsforstærker</div>
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
        <div style={{ fontSize:13, fontWeight:800, color:"#F1F2EE", marginBottom:3 }}>Sono allergico al latte e al glutine.</div>
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
    bg: "var(--sheet)", accent: "var(--green)",
    cta: true, mockup: null,
  },
];
