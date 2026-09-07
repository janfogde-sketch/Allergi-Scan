// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// demoSlides.jsx
// Fælles indhold til appens "feature-demo"-karrusel — brugt begge steder den
// vises: velkomst-skærmen for nye brugere (OnboardingScreen) og app-guiden
// loggede brugere selv kan åbne igen (ScannerScreen). Var tidligere kopieret
// ind i begge filer hver for sig med små, uensartede tekstforskelle.
//
// Farverne følger app'ens lyse designsystem (theme.jsx) i stedet for egne
// mørke baggrunde — grøn er den ene accentfarve, rød/amber er forbeholdt
// reelle fare/advarsel-tilstande, ligesom resten af appen.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_SLIDES = [
  {
    title: "Skan — og spis trygt",
    sub: "Ét kamera-tryk, og du ved det med det samme.",
    bg: "var(--surface2)", accent: "var(--green)",
    mockup: (
      <div style={{ background:"var(--surface)", borderRadius:14, padding:"12px 14px", marginTop:12, border:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ width:40, height:40, background:"var(--surface2)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🥛</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>Arla Letmælk 1L</div>
            <div style={{ fontSize:10, color:"var(--muted2)" }}>EAN 5710085008001 · Arla Foods</div>
          </div>
          <div style={{ padding:"5px 11px", borderRadius:20, background:"var(--red-md)", border:"1px solid var(--red-md)", fontSize:11, fontWeight:800, color:"var(--red)" }}>⚠ FARE</div>
        </div>
        <div style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:8, padding:"8px 10px", fontSize:11, color:"var(--red)", lineHeight:1.6 }}>
          <strong>Laktose</strong> — reagerer på dette: Anna, Sofie
        </div>
        <div style={{ marginTop:8, display:"flex", gap:6 }}>
          <div style={{ padding:"3px 9px", borderRadius:20, background:"var(--green-lt)", border:"1px solid var(--green-mid)", fontSize:10, color:"var(--green)", fontWeight:700 }}>✓ Mads ok</div>
          <div style={{ padding:"3px 9px", borderRadius:20, background:"var(--green-lt)", border:"1px solid var(--green-mid)", fontSize:10, color:"var(--green)", fontWeight:700 }}>✓ Tage ok</div>
        </div>
      </div>
    ),
  },
  {
    title: "Hele familien, én oversigt",
    sub: "Se med det samme hvem der kan spise hvad.",
    bg: "var(--surface2)", accent: "var(--green)",
    mockup: (
      <div style={{ marginTop:12 }}>
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:10 }}>
          {[["Jan","var(--green)","Laktose · Gluten"],["Anna","#2E8F53","Laktose"],["Sofie","#f59e0b","Nødder · Sesam"],["Mads","#178A50","Ingen"]].map(([n,c,a]) => (
            <div key={n} style={{ background:"var(--surface)", borderRadius:10, padding:"9px 10px", textAlign:"center", border:"1px solid var(--border)", flex:1 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:c, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, margin:"0 auto 5px" }}>{n[0]}</div>
              <div style={{ fontSize:9, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>{n}</div>
              <div style={{ fontSize:8, color:"var(--muted2)", lineHeight:1.3 }}>{a}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:8, padding:"8px 10px", fontSize:11, color:"var(--green-text)", lineHeight:1.5 }}>
          💡 Alle profiler tjekkes samtidig ved hver scanning
        </div>
      </div>
    ),
  },
  {
    title: "Aldrig i tvivl om alternativer",
    sub: "Vi finder noget lige så godt, som er sikkert for dig.",
    bg: "var(--surface2)", accent: "var(--red)",
    mockup: (
      <div style={{ marginTop:12 }}>
        <div style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10, padding:"9px 12px", marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>🥛</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--red)" }}>Arla Letmælk — FARE</div>
            <div style={{ fontSize:10, color:"var(--muted)" }}>Indeholder laktose</div>
          </div>
        </div>
        <div style={{ fontSize:10, fontWeight:700, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>✓ Sikre alternativer</div>
        {[["Oatly Havregrød","Havredrik · Laktosefri"],["Alpro Soya","Soyadrik · Laktosefri"]].map(([name,tag]) => (
          <div key={name} style={{ background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:8, padding:"8px 10px", marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>✅</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)" }}>{name}</div>
              <div style={{ fontSize:10, color:"var(--muted)" }}>{tag}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Handl sammen, uden at ringe rundt",
    sub: "Hele familien ser indkøbslisten opdatere sig selv.",
    bg: "var(--surface2)", accent: "var(--green)",
    mockup: (
      <div style={{ marginTop:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ fontSize:12, fontWeight:800, color:"var(--ink)" }}>Familiens indkøbsliste</div>
          <div style={{ fontSize:10, color:"var(--green)", fontWeight:700 }}>● Live</div>
        </div>
        {[
          ["Oatly Havregrød 1L", false, "Jan tilføjede"],
          ["Glutenfri pasta", false, "Anna tilføjede"],
          ["Alpro Soya", true, "Købt"],
          ["Havregryns-cookies", false, "Sofie tilføjede"],
        ].map(([name, done, sub]) => (
          <div key={name} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, marginBottom:5, background:"var(--surface)", border:"1px solid var(--border)", opacity: done ? 0.5 : 1 }}>
            <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${done?"var(--green)":"var(--border2)"}`, background: done?"var(--green)":"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {done && <span style={{ fontSize:11, color:"#fff", fontWeight:800 }}>✓</span>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", textDecoration: done?"line-through":"none" }}>{name}</div>
              <div style={{ fontSize:9, color:"var(--muted2)" }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Opskrifter I faktisk kan spise",
    sub: "Kun dem der passer til hele familiens allergier.",
    bg: "var(--surface2)", accent: "var(--green)",
    mockup: (
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:12 }}>
        {[
          ["🍝","Spaghetti Bolognese","Glutenfri · Mælkefri · Nøddefri","✅ Sikker for alle"],
          ["🥗","Nikkei Ceviche","Glutenfri · Laktosefri","✅ Sikker for alle"],
          ["🍛","Chicken Tikka Masala","Nøddefri · Sesamfri","⚠ Tjek: mælk i sauce"],
        ].map(([e,name,tags,status]) => (
          <div key={name} style={{ display:"flex", alignItems:"center", gap:10, background:"var(--surface)", borderRadius:10, padding:"9px 12px", border:"1px solid var(--border)" }}>
            <div style={{ fontSize:22 }}>{e}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)" }}>{name}</div>
              <div style={{ fontSize:9, color:"var(--muted2)" }}>{tags}</div>
            </div>
            <div style={{ fontSize:10, fontWeight:700, color: status.startsWith("✅") ? "var(--green)" : "var(--amber)", textAlign:"right", maxWidth:70 }}>{status}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Forstå hvad der står på varen",
    sub: "Tap en ingrediens, og få svaret med det samme.",
    bg: "var(--surface2)", accent: "var(--green)",
    mockup: (
      <div style={{ marginTop:12 }}>
        <div style={{ background:"var(--amber-lt)", border:"1px solid var(--amber-md)", borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <div style={{ padding:"3px 9px", borderRadius:20, background:"var(--amber-md)", border:"1px solid var(--amber)", fontSize:11, fontWeight:800, color:"var(--amber)" }}>E621</div>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)" }}>MSG · Smagsforstærker</div>
          </div>
          <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.6 }}>Kan give hovedpine hos følsomme personer.</div>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["E211 Natriumbenzoat","E102 Tartrazin","E951 Aspartam"].map(e => (
            <div key={e} style={{ padding:"4px 10px", borderRadius:20, background:"var(--amber-lt)", border:"1px solid var(--amber-md)", fontSize:10, fontWeight:700, color:"var(--amber)" }}>{e}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Tryg mad, uanset hvor du er",
    sub: "Vis dine allergier på stedets sprog — også offline.",
    bg: "var(--surface2)", accent: "var(--green)",
    mockup: (
      <div style={{ background:"var(--surface)", borderRadius:14, padding:"12px 14px", marginTop:12, border:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <span style={{ fontSize:20 }}>🇮🇹</span>
          <div style={{ fontSize:11, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:"1px" }}>Italiensk</div>
        </div>
        <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:3 }}>Sono allergico al latte e al glutine.</div>
        <div style={{ fontSize:11, color:"var(--muted)", fontStyle:"italic", marginBottom:10 }}>"so-no al-ler-JI-ko al LAT-te e al glu-TI-ne"</div>
        <div style={{ fontSize:10, color:"var(--muted2)", marginBottom:6 }}>Tilgængeligt på:</div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {["🇩🇰","🇬🇧","🇩🇪","🇫🇷","🇪🇸","🇵🇹","🇳🇱","🇸🇪"].map(f => <span key={f} style={{ fontSize:18 }}>{f}</span>)}
          <span style={{ fontSize:11, color:"var(--muted2)", alignSelf:"center" }}>+9 mere</span>
        </div>
      </div>
    ),
  },
  {
    title: "Klar til at spise roligt?",
    sub: "Gratis at oprette. Kom i gang på under 2 minutter.",
    bg: "var(--sheet)", accent: "var(--green)",
    cta: true, mockup: null,
  },
];
