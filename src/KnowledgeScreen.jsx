// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCREENS } from "./constants.jsx";
import { Icon, EmptyState, ScrollToTop } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { UI } from "./styleUtils.js";

// Redesignet 26. sept. 2026 (brugerfeedback: "match resten af appens rene
// funktionelle design") — emoji-glyffer erstattet med Icon-bibliotekets
// eksisterende stroke-ikoner ("én konsekvent EatSafe-ikonfamilie"), ikke nye
// ikoner. FAQ er bevidst UDENFOR denne liste — den vises nu som en separat
// hjælpe-række på forsiden (se HjælpRow i hovedvisningen), ikke som en
// kategori-flise blandt de øvrige. Farverne er UÆNDREDE fra før.
const CATEGORIES = [
  { id:"allergen",       icon:"shield",   label:"Allergener",      color:"var(--red)",   bg:"rgba(255,82,82,.10)" },
  { id:"ingredient",     icon:"package",  label:"Ingredienser",    color:"var(--blue)",  bg:"rgba(96,165,250,.10)" },
  { id:"e_number",       icon:"hash",     label:"E-numre",         color:"var(--amber)", bg:"rgba(255,186,59,.10)" },
  { id:"diet",           icon:"utensils", label:"Diæter",          color:"var(--green)", bg:"rgba(14,143,90,.10)" },
  { id:"cross_reaction", icon:"refresh",  label:"Krydsreaktioner", color:"#E8A87C",      bg:"rgba(232,168,124,.10)" },
  { id:"fun_fact",       icon:"bulb",     label:"Vidste du at",    color:"#E8A87C",      bg:"rgba(232,168,124,.10)" },
];
// "FAQ" → "Ofte stillede spørgsmål" (26. sept. 2026, brugerfeedback) — egen
// hjælpesektion i stedet for en kategori-flise, men stadig en del af
// CAT_MAP så kategori-labelen på en FAQ-detaljeside ("OFTE STILLEDE
// SPØRGSMÅL") kan slås op ét sted, ikke en selvstændig kopi af opslaget.
const FAQ_CATEGORY = { id:"faq", icon:"message", label:"Ofte stillede spørgsmål", color:"var(--neutral)", bg:"rgba(148,163,184,.10)" };
const CAT_MAP = Object.fromEntries([...CATEGORIES, FAQ_CATEGORY].map(c => [c.id, c]));

const RISK_LABEL = { high:"Høj risiko", medium:"Moderat" };

// ── Inline styles (så de ALDRIG kan mangle) ──────────────────────────────────
const S = {
  grid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:18 },
  catBtn: { display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", fontFamily:"var(--f)", textAlign:"left" },
  catBtnActive: (c) => ({ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:c.bg, border:`1px solid ${c.color}33`, borderRadius:12, cursor:"pointer", fontFamily:"var(--f)", textAlign:"left" }),
  catIconBox: (c) => ({ width:32, height:32, borderRadius:9, background:c.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }),
  catLabel: { fontSize:12, fontWeight:700, color:"var(--ink)" },
  catLabelActive: (c) => ({ fontSize:12, fontWeight:700, color:c.color }),
  catCount: { fontSize:10, color:"var(--muted)", marginTop:1 },
  searchWrap: { position:"relative", marginBottom:14 },
  searchInput: { width:"100%", padding:"12px 14px 12px 42px", border:"1px solid var(--border2)", borderRadius:12, background:"var(--surface)", fontFamily:"var(--f)", fontSize:14, color:"var(--ink)", outline:"none", boxSizing:"border-box" },
  searchIcon: { position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" },
  card: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" },
  cardIconBox: (c) => ({ width:36, height:36, borderRadius:9, background:c.bg||"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }),
  cardTitle: { fontSize:14, fontWeight:700, color:"var(--ink)", marginBottom:3 },
  cardSummary: { fontSize:12, color:"var(--muted2)", lineHeight:1.45 },
  // Farvet prik ALDRIG alene (26. sept. 2026, brugerfeedback) — altid parret
  // med tydelig tekst ("Høj risiko"/"Moderat"), samme ikon+tekst+farve-
  // princip som resten af appens statuslinjer (Historik/Favoritter m.fl.).
  riskRow: (level) => ({ display:"flex", alignItems:"center", gap:4, marginTop:4, fontSize:10.5, fontWeight:700, color: level==="high"?"var(--red)":"var(--amber)" }),
  label: { fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:10 },
  backBtn: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 10px", cursor:"pointer", display:"flex", alignItems:"center", lineHeight:0, flexShrink:0 },
  section: { marginBottom:16 },
  sectionLabel: { fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.4px", color:"var(--neutral)", marginBottom:8 },
  sectionText: { fontSize:13, color:"var(--ink2)", lineHeight:1.6 },
  pillRow: { display:"flex", flexWrap:"wrap", gap:6 },
  pill: (bg, color, border) => ({ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:100, background:bg, color, border:`1px solid ${border}` }),
  healthBox: { background:"rgba(232,168,124,.10)", border:"1px solid rgba(232,168,124,.18)", borderRadius:12, padding:"12px 14px", marginBottom:16 },
  error: { background:"rgba(255,82,82,.12)", border:"1px solid rgba(255,82,82,.25)", borderRadius:12, padding:"14px", marginBottom:12, color:"var(--red)", fontSize:13 },
};

export default function KnowledgeScreen({ openSlug, onSlugHandled }) {
  const { accessToken } = useAuthContext();
  const { screen, setScreen } = useNavigationContext();
  const [searchQuery, setSearchQuery]       = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [entries, setEntries]               = useState([]);
  const [selectedEntry, setSelectedEntry]   = useState(null);
  const [loading, setLoading]               = useState(false);
  const [counts, setCounts]                 = useState({});
  const [error, setError]                   = useState(null);
  const [funFacts, setFunFacts]             = useState([]);
  // Relaterede krydsreaktioner for en allergen-detaljeside (26. sept. 2026) —
  // knowledge_base har ingen selvstændig "cross_reactions"-kolonne, men
  // cross_reaction-opslagenes EGEN allergen_ids-liste indeholder netop de
  // allergener krydsreaktionen vedrører (fx "Birk → Frugt og grønt" har
  // allergen_ids:["selleri","noedder"]) — genbruger derfor et ægte,
  // eksisterende DB-felt til at slå relaterede opslag op, i stedet for at
  // opfinde indhold uden datagrundlag.
  const [crossReactions, setCrossReactions] = useState([]);
  const [sourcesOpen, setSourcesOpen]       = useState(false);

  const doFetch = useCallback(async (url) => {
    // knowledge_base er public (USING true) — brug kun anon key, aldrig JWT
    const res = await fetch(url, {
      headers: { "apikey": SUPABASE_ANON_KEY, "Accept": "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0,120)}`);
    return res.json();
  }, []);

  // Load counts + fun facts on mount
  useEffect(() => {
    setError(null);
    (async () => {
      try {
        const data = await doFetch(`${SUPABASE_URL}/rest/v1/knowledge_base?select=category&limit=1000`);
        if (Array.isArray(data)) {
          const c = {};
          data.forEach(r => { if(r.category) c[r.category] = (c[r.category]||0)+1; });
          setCounts(c);
        }
      } catch (e) { setError(`Counts: ${e.message}`); }
      try {
        const facts = await doFetch(`${SUPABASE_URL}/rest/v1/knowledge_base?category=eq.fun_fact&limit=3`);
        if (Array.isArray(facts)) setFunFacts(facts);
      } catch {}
    })();
  }, [accessToken, doFetch]);

  // Handle openSlug
  useEffect(() => {
    if (!openSlug) return;
    (async () => {
      try {
        const data = await doFetch(`${SUPABASE_URL}/rest/v1/knowledge_base?slug=eq.${openSlug}&limit=1`);
        if (Array.isArray(data) && data[0]) setSelectedEntry(data[0]);
      } catch {}
      onSlugHandled?.();
    })();
  }, [openSlug, accessToken, doFetch]);

  // Relaterede krydsreaktioner — kun relevant for allergen-opslag med et
  // allergen_id at slå op imod. Nulstilles ved hvert entry-skift, så en
  // tidligere entrys resultater ikke "hænger ved" på den næste.
  useEffect(() => {
    setSourcesOpen(false);
    setCrossReactions([]);
    if (!selectedEntry || selectedEntry.category !== "allergen") return;
    const allergenId = selectedEntry.allergen_ids?.[0];
    if (!allergenId) return;
    (async () => {
      try {
        const data = await doFetch(`${SUPABASE_URL}/rest/v1/knowledge_base?category=eq.cross_reaction&allergen_ids=cs.${encodeURIComponent(`{${allergenId}}`)}&limit=10`);
        if (Array.isArray(data)) setCrossReactions(data.filter(x => x.id !== selectedEntry.id));
      } catch { /* ikke-kritisk — sektionen skjules bare hvis opslaget fejler */ }
    })();
  }, [selectedEntry, doFetch]);

  const loadCategory = useCallback(async (cat) => {
    if (!cat) { setEntries([]); return; }
    setLoading(true); setError(null);
    try {
      const data = await doFetch(`${SUPABASE_URL}/rest/v1/knowledge_base?category=eq.${cat}&order=sort_order.asc,title.asc&limit=200`);
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) { setError(`Load: ${e.message}`); setEntries([]); }
    setLoading(false);
  }, [accessToken, doFetch]);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { if(!selectedCategory) setEntries([]); return; }
    setLoading(true); setError(null);
    try {
      const enc = encodeURIComponent(`%${q}%`);
      const data = await doFetch(`${SUPABASE_URL}/rest/v1/knowledge_base?or=(title.ilike.${enc},summary.ilike.${enc})&order=category.asc,sort_order.asc&limit=50`);
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) { setError(`Søg: ${e.message}`); setEntries([]); }
    setLoading(false);
  }, [accessToken, selectedCategory, doFetch]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.length >= 2) doSearch(searchQuery);
      else if (selectedCategory) loadCategory(selectedCategory);
      else setEntries([]);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, selectedCategory, doSearch, loadCategory]);

  const handleCatSelect = (cat) => {
    setSelectedCategory(cat === selectedCategory ? null : cat);
    setSearchQuery("");
    if (cat && cat !== selectedCategory) loadCategory(cat);
    else setEntries([]);
  };

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedEntry) {
    const cat = CAT_MAP[selectedEntry.category] || {};
    const AN = { gluten:"Gluten",laktose:"Laktose/Mælk",aeg:"Æg",noedder:"Nødder",jordnoedder:"Jordnødder",soja:"Soja",fisk:"Fisk",skaldyr:"Skaldyr",selleri:"Selleri",sennep:"Sennep",sesam:"Sesam",svovl:"Svovl/Sulfitter",lupin:"Lupin",bloeddyr:"Bløddyr" };
    return (
      <div className="screen fade-in">
        {/* Tydelig tilbageknap øverst til venstre + kategori-label OVER
            titlen (fx "ALLERGENER") — begge dele var allerede her, kun
            emoji'et er erstattet med samme Icon-bibliotek som resten af
            appen (26. sept. 2026, brugerfeedback). */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0 8px" }}>
          <button onClick={() => setSelectedEntry(null)} aria-label="Tilbage" style={S.backBtn}>
            <Icon name="chevronLeft" size={18} color="var(--ink)" />
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontWeight:700, color:cat.color||"var(--muted)", textTransform:"uppercase", letterSpacing:"1.2px" }}>
            {cat.icon && <Icon name={cat.icon} size={12} color={cat.color||"var(--muted)"} />} {cat.label}
          </div>
        </div>
        <div style={{ padding:"16px 0 14px" }}>
          <div style={{ width:56, height:56, borderRadius:14, background:cat.bg||"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
            <Icon name={cat.icon||"book"} size={26} color={cat.color||"var(--ink2)"} />
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>{selectedEntry.title}</div>
          {selectedEntry.summary && <div style={{ fontSize:14, color:"var(--ink2)", lineHeight:1.55, marginBottom:16 }}>{selectedEntry.summary}</div>}
          {selectedEntry.risk_level && selectedEntry.risk_level !== "none" && (
            <span style={{ ...S.pill(selectedEntry.risk_level==="high"?"var(--red-lt)":"var(--amber-lt)", selectedEntry.risk_level==="high"?"var(--red)":"var(--amber)", selectedEntry.risk_level==="high"?"var(--red-md)":"var(--amber-md)"), display:"inline-flex", alignItems:"center", gap:6 }}>
              <Icon name="warning" size={11} color={selectedEntry.risk_level==="high"?"var(--red)":"var(--amber)"} /> {RISK_LABEL[selectedEntry.risk_level]||selectedEntry.risk_level}
            </span>
          )}
        </div>

        {/* "Kort fortalt" (26. sept. 2026, brugerfeedback — erstatter
            "Beskrivelse") */}
        {selectedEntry.description && <div style={S.section}><div style={S.sectionLabel}>Kort fortalt</div><div style={S.sectionText}>{selectedEntry.description}</div></div>}

        {selectedEntry.health_notes && <div style={S.healthBox}><div style={{ ...S.sectionLabel, color:"var(--warm)", display:"flex", alignItems:"center", gap:6 }}><Icon name="info" size={12} color="var(--warm)" /> Sundhedsnote</div><div style={S.sectionText}>{selectedEntry.health_notes}</div></div>}

        {Array.isArray(selectedEntry.allergen_ids) && selectedEntry.allergen_ids.length > 0 && (
          <div style={S.section}><div style={S.sectionLabel}>Allergener</div><div style={S.pillRow}>{selectedEntry.allergen_ids.map(a => <span key={a} style={{ ...S.pill("var(--red-lt)","var(--red)","var(--red-md)"), display:"inline-flex", alignItems:"center", gap:4 }}><Icon name="warning" size={10} color="var(--red)" /> {AN[a]||a}</span>)}</div></div>
        )}

        {/* "Findes ofte i" (26. sept. 2026, brugerfeedback — erstatter
            "Findes i") */}
        {Array.isArray(selectedEntry.found_in) && selectedEntry.found_in.length > 0 && (
          <div style={S.section}><div style={S.sectionLabel}>Findes ofte i</div><div style={S.pillRow}>{selectedEntry.found_in.map((f,i) => <span key={i} style={S.pill("var(--surface)","var(--muted)","var(--border)")}>{f}</span>)}</div></div>
        )}

        {Array.isArray(selectedEntry.alternatives) && selectedEntry.alternatives.length > 0 && (
          <div style={S.section}><div style={S.sectionLabel}>Alternativer</div><div style={S.pillRow}>{selectedEntry.alternatives.map((a,i) => <span key={i} style={{ ...S.pill("var(--green-lt)","var(--green)","rgba(14,143,90,.2)"), display:"inline-flex", alignItems:"center", gap:4 }}><Icon name="check" size={10} color="var(--green)" /> {a}</span>)}</div></div>
        )}

        {Array.isArray(selectedEntry.aliases) && selectedEntry.aliases.length > 0 && (
          <div style={S.section}><div style={S.sectionLabel}>Kendes også som</div><div style={S.pillRow}>{selectedEntry.aliases.map((a,i) => <span key={i} style={S.pill("var(--surface)","var(--muted)","var(--border)")}>{a}</span>)}</div></div>
        )}

        {/* "Krydsreaktioner" (26. sept. 2026) — kun for allergen-opslag hvor
            der reelt findes relaterede cross_reaction-opslag (se effect
            ovenfor). Hvert link åbner det pågældende krydsreaktions-opslag
            direkte, samme mønster som resten af leksikonets kort/rækker. */}
        {crossReactions.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionLabel}>Krydsreaktioner</div>
            {crossReactions.map(x => (
              <div key={x.id} style={{ ...S.card, marginBottom:6, padding:"10px 12px" }} onClick={() => setSelectedEntry(x)}>
                <div style={S.cardIconBox(FAQ_CATEGORY.id===x.category?FAQ_CATEGORY:CAT_MAP.cross_reaction)}><Icon name="refresh" size={16} color="#E8A87C" /></div>
                <div style={UI.flexMin}>
                  <div style={{ ...S.cardTitle, fontSize:13, marginBottom:1 }}>{x.title}</div>
                  {x.summary && <div style={{ ...S.cardSummary, fontSize:11.5 }}>{x.summary}</div>}
                </div>
                <Icon name="chevronRight" size={14} color="var(--muted)" />
              </div>
            ))}
          </div>
        )}

        {/* "Kilder og faglig gennemgang" (26. sept. 2026) — skjult bag en
            diskret disclosure, kun vist hvis opslaget rent faktisk har
            kilder registreret (knowledge_base.sources). */}
        {Array.isArray(selectedEntry.sources) && selectedEntry.sources.length > 0 && (
          <div style={{ ...S.section, borderTop:"1px solid var(--border)", paddingTop:14 }}>
            <button onClick={() => setSourcesOpen(v => !v)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"var(--f)" }}>
              <span style={{ fontSize:12, fontWeight:700, color:"var(--ink2)", display:"flex", alignItems:"center", gap:6 }}>
                <Icon name="link" size={12} color="var(--ink2)" /> Kilder og faglig gennemgang
              </span>
              <Icon name={sourcesOpen ? "chevronUp" : "chevronDown"} size={14} color="var(--muted)" />
            </button>
            {sourcesOpen && (
              <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:6 }}>
                {selectedEntry.sources.map((src,i) => (
                  <a key={i} href={src} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11.5, color:"var(--green)", wordBreak:"break-all", textDecoration:"underline", textUnderlineOffset:2 }}>
                    {src}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vises kun hvis knowledge_base-tabellen rent faktisk har et updated_at-felt —
            ingen antagelse om DB-skemaet, bare et defensivt tjek på det hentede data. */}
        {selectedEntry.updated_at && (
          <div style={{ fontSize:10.5, color:"var(--muted)", marginTop:14 }}>
            Sidst opdateret: {new Date(selectedEntry.updated_at).toLocaleDateString("da-DK", { day:"numeric", month:"long", year:"numeric" })}
          </div>
        )}

        {/* Diskret lægelig disclaimer (26. sept. 2026, brugerfeedback) —
            samme muted, sekundære stil som "Sidst opdateret" ovenfor, ikke
            en fremhævet advarselsboks (det er allerede Sundhedsnotens rolle). */}
        <div style={{ fontSize:10.5, color:"var(--muted)", marginTop:6, lineHeight:1.4 }}>
          Indholdet på denne side er vejledende og erstatter ikke professionel lægelig rådgivning.
        </div>

        <div style={{ height:40 }} />
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  const showList = searchQuery.length >= 2 || selectedCategory;
  const total = Object.values(counts).reduce((a,b) => a+b, 0);
  const selectedCat = selectedCategory ? CAT_MAP[selectedCategory] : null;

  return (
    <div className="screen fade-in">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:4, marginBottom:16 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:22, fontWeight:800, color:"var(--ink)" }}><Icon name="book" size={20} color="var(--ink)" /> Allergileksikon</div>
          <div style={UI.muted12mt2}>{total} opslag</div>
        </div>
      </div>

      {/* Fejlbesked — synlig under udvikling */}
      {error && <div style={{ ...S.error, display:"flex", alignItems:"center", gap:6 }}><Icon name="warning" size={13} color="var(--red)" /> {error}</div>}

      {/* Søg */}
      <div style={S.searchWrap}>
        <svg style={S.searchIcon} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input style={S.searchInput} placeholder="Søg ingredienser, E-numre, allergener..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)} />
        {searchQuery && <button onClick={() => { setSearchQuery(""); if(!selectedCategory) setEntries([]); }} aria-label="Ryd søgning" style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:10, color:"var(--muted)" }}>×</button>}
      </div>

      {/* Kategorier — altid synlig når ingen liste vises */}
      {!showList && (
        <>
          <div style={S.label}>Kategorier</div>
          <div style={S.grid}>
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <button key={cat.id} style={active ? S.catBtnActive(cat) : S.catBtn} onClick={() => handleCatSelect(cat.id)}>
                  <div style={S.catIconBox(cat)}><Icon name={cat.icon} size={16} color={cat.color} /></div>
                  <div>
                    <div style={active ? S.catLabelActive(cat) : S.catLabel}>{cat.label}</div>
                    {counts[cat.id] !== undefined && <div style={S.catCount}>{counts[cat.id]} opslag</div>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* "FAQ" → egen hjælpesektion i stedet for en kategori-flise (26.
              sept. 2026, brugerfeedback) — samme handleCatSelect-mekanisme
              som kategorierne ovenfor, bare layoutet som én tydelig,
              fuldbredde række i stedet for et grid-kort. */}
          <div style={{ ...S.label, marginTop:4 }}>Hjælp</div>
          <button style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", fontFamily:"var(--f)", textAlign:"left", marginBottom:8 }}
            onClick={() => handleCatSelect("faq")}>
            <div style={S.catIconBox(FAQ_CATEGORY)}><Icon name={FAQ_CATEGORY.icon} size={16} color={FAQ_CATEGORY.color} /></div>
            <div style={UI.flex1}>
              <div style={S.catLabel}>{FAQ_CATEGORY.label}</div>
              {counts.faq !== undefined && <div style={S.catCount}>{counts.faq} opslag</div>}
            </div>
            <Icon name="chevronRight" size={14} color="var(--muted)" />
          </button>
        </>
      )}

      {/* Filter-header */}
      {showList && (
        <div style={UI.udflex_aicenter_g8_mb12}>
          {selectedCategory && (
            <button onClick={() => handleCatSelect(null)} aria-label={`Ryd kategori-filter: ${selectedCat?.label}`} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:selectedCat?.bg, border:`1px solid ${selectedCat?.color}33`, borderRadius:100, cursor:"pointer", fontSize:12, fontWeight:700, color:selectedCat?.color, fontFamily:"var(--f)" }}>
              <Icon name={selectedCat?.icon} size={12} color={selectedCat?.color} /> {selectedCat?.label} ×
            </button>
          )}
          <div style={UI.ufs12_cmuted}>{entries.length} resultater</div>
        </div>
      )}

      {/* Entry-liste */}
      {showList && (loading ? (
        <div className="fade-in">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton-card" style={{ display:"flex", gap:10, marginBottom:8 }}>
              <div className="skeleton-block" style={{ width:36, height:36, borderRadius:8, flexShrink:0 }} />
              <div style={UI.flex1}>
                <div className="skeleton-block skeleton-title" />
                <div className="skeleton-block skeleton-sub" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={<Icon name="search" size={26} color="var(--muted)" />} text="Ingen resultater" sub={searchQuery ? "Prøv et andet søgeord" : "Ingen entries i denne kategori endnu"} />
      ) : (
        <div>{entries.map(entry => {
          const cat = CAT_MAP[entry.category] || {};
          return (
            <div key={entry.id} style={S.card} onClick={() => setSelectedEntry(entry)}>
              <div style={S.cardIconBox(cat)}><Icon name={cat.icon||"book"} size={17} color={cat.color||"var(--ink2)"} /></div>
              <div style={UI.flexMin}>
                <div style={S.cardTitle}>{entry.title}</div>
                {entry.summary && <div style={S.cardSummary}>{entry.summary}</div>}
                {/* Farvet prik ALDRIG alene — altid parret med tydelig tekst
                    (26. sept. 2026, brugerfeedback). */}
                {entry.risk_level && entry.risk_level !== "none" && (
                  <div style={S.riskRow(entry.risk_level)}>
                    <Icon name="warning" size={10} color="currentColor" /> {RISK_LABEL[entry.risk_level]||entry.risk_level}
                  </div>
                )}
              </div>
              <Icon name="chevronRight" size={14} color="var(--muted)" />
            </div>
          );
        })}</div>
      ))}

      {/* Fun facts på forsiden — kompakte teaser-cards, ikke lange
          tekstafsnit (26. sept. 2026, brugerfeedback). Emoji-ikonet i
          sektionsoverskriften er erstattet med Icon-biblioteket, og hvert
          kort har nu en tydelig "Læs mere →"-affordance i stedet for at
          fremstå som et rent tekstafsnit man tilfældigvis kan trykke på. */}
      {!showList && funFacts.length > 0 && (
        <div style={UI.mt8}>
          <div style={{ ...S.label, display:"flex", alignItems:"center", gap:6 }}><Icon name="bulb" size={12} color="var(--muted)" /> Vidste du at...</div>
          {funFacts.map(f => (
            <div key={f.id} onClick={() => setSelectedEntry(f)}
              style={{ background:"rgba(232,168,124,.10)", border:"1px solid rgba(232,168,124,.18)", borderRadius:12, padding:"12px 14px", cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
              <div style={S.catIconBox(FAQ_CATEGORY.id===f.category?FAQ_CATEGORY:CAT_MAP.fun_fact)}><Icon name="bulb" size={16} color="#E8A87C" /></div>
              <div style={UI.flexMin}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:3 }}>{f.title}</div>
                <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.45, marginBottom:4 }}>{f.summary}</div>
                <div style={{ fontSize:11, fontWeight:700, color:"#E8A87C" }}>Læs mere →</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height:20 }} />
      {showList && <ScrollToTop />}
    </div>
  );
}
