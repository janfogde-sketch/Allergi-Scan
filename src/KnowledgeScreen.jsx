// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCREENS } from "./constants.jsx";
import { Icon } from "./SharedComponents.jsx";

const CATEGORIES = [
  { id:"allergen",       emoji:"🌾", label:"Allergener",      color:"#FF5252",  bg:"rgba(255,82,82,.10)" },
  { id:"ingredient",     emoji:"🫙", label:"Ingredienser",    color:"#60A5FA",  bg:"rgba(96,165,250,.10)" },
  { id:"e_number",       emoji:"🔢", label:"E-numre",         color:"#FFBA3B",  bg:"rgba(255,186,59,.10)" },
  { id:"diet",           emoji:"🥗", label:"Diæter",          color:"#4ADE80",  bg:"rgba(74,222,128,.10)" },
  { id:"cross_reaction", emoji:"🔄", label:"Krydsreaktioner", color:"#E8A87C",  bg:"rgba(232,168,124,.10)" },
  { id:"faq",            emoji:"❓", label:"FAQ",             color:"#94A3B8",  bg:"rgba(148,163,184,.10)" },
  { id:"fun_fact",       emoji:"💡", label:"Vidste du at",    color:"#E8A87C",  bg:"rgba(232,168,124,.10)" },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// ── Inline styles (så de ALDRIG kan mangle) ──────────────────────────────────
const S = {
  grid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:18 },
  catBtn: { display:"flex", alignItems:"center", gap:8, padding:"12px 13px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", fontFamily:"var(--f)", textAlign:"left" },
  catBtnActive: (c) => ({ display:"flex", alignItems:"center", gap:8, padding:"12px 13px", background:c.bg, border:`1px solid ${c.color}33`, borderRadius:12, cursor:"pointer", fontFamily:"var(--f)", textAlign:"left" }),
  catEmoji: { fontSize:18, flexShrink:0 },
  catLabel: { fontSize:12, fontWeight:700, color:"var(--ink)" },
  catLabelActive: (c) => ({ fontSize:12, fontWeight:700, color:c.color }),
  catCount: { fontSize:10, color:"var(--muted)", marginTop:1 },
  searchWrap: { position:"relative", marginBottom:14 },
  searchInput: { width:"100%", padding:"12px 14px 12px 42px", border:"1px solid var(--border2)", borderRadius:12, background:"var(--surface)", fontFamily:"var(--f)", fontSize:14, color:"var(--ink)", outline:"none", boxSizing:"border-box" },
  searchIcon: { position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" },
  card: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" },
  cardEmoji: { fontSize:22, flexShrink:0, width:36, textAlign:"center" },
  cardTitle: { fontSize:14, fontWeight:700, color:"var(--ink)", marginBottom:3 },
  cardSummary: { fontSize:12, color:"var(--muted2)", lineHeight:1.45 },
  riskDot: (level) => ({ width:7, height:7, borderRadius:"50%", flexShrink:0, marginTop:5, background: level==="high"?"var(--red)":level==="medium"?"var(--amber)":"var(--green)" }),
  label: { fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:10 },
  backBtn: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 10px", cursor:"pointer", display:"flex", alignItems:"center", lineHeight:0, flexShrink:0 },
  section: { marginBottom:16 },
  sectionLabel: { fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.4px", color:"var(--neutral)", marginBottom:7 },
  sectionText: { fontSize:13, color:"var(--ink2)", lineHeight:1.6 },
  pillRow: { display:"flex", flexWrap:"wrap", gap:5 },
  pill: (bg, color, border) => ({ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:100, background:bg, color, border:`1px solid ${border}` }),
  healthBox: { background:"rgba(232,168,124,.10)", border:"1px solid rgba(232,168,124,.18)", borderRadius:12, padding:"12px 14px", marginBottom:16 },
  error: { background:"rgba(255,82,82,.12)", border:"1px solid rgba(255,82,82,.25)", borderRadius:12, padding:"14px", marginBottom:12, color:"#FF5252", fontSize:13 },
};

export default function KnowledgeScreen({ screen, setScreen, accessToken, openSlug, onSlugHandled }) {
  const [searchQuery, setSearchQuery]       = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [entries, setEntries]               = useState([]);
  const [selectedEntry, setSelectedEntry]   = useState(null);
  const [loading, setLoading]               = useState(false);
  const [counts, setCounts]                 = useState({});
  const [error, setError]                   = useState(null);
  const [funFacts, setFunFacts]             = useState([]);

  const doFetch = useCallback(async (url) => {
    const headers = { "apikey": SUPABASE_ANON_KEY, "Accept": "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0,120)}`);
    return res.json();
  }, [accessToken]);

  // Load counts + fun facts on mount
  useEffect(() => {
    if (!accessToken) return;
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
    if (!openSlug || !accessToken) return;
    (async () => {
      try {
        const data = await doFetch(`${SUPABASE_URL}/rest/v1/knowledge_base?slug=eq.${openSlug}&limit=1`);
        if (Array.isArray(data) && data[0]) setSelectedEntry(data[0]);
      } catch {}
      onSlugHandled?.();
    })();
  }, [openSlug, accessToken, doFetch]);

  const loadCategory = useCallback(async (cat) => {
    if (!cat || !accessToken) { setEntries([]); return; }
    setLoading(true); setError(null);
    try {
      const data = await doFetch(`${SUPABASE_URL}/rest/v1/knowledge_base?category=eq.${cat}&order=sort_order.asc,title.asc&limit=200`);
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) { setError(`Load: ${e.message}`); setEntries([]); }
    setLoading(false);
  }, [accessToken, doFetch]);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2 || !accessToken) { if(!selectedCategory) setEntries([]); return; }
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
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0 8px" }}>
          <button onClick={() => setSelectedEntry(null)} style={S.backBtn}>
            <Icon name="arrow-left" size={18} color="var(--ink)" />
          </button>
          <div style={{ fontSize:11, fontWeight:700, color:cat.color||"var(--muted)", textTransform:"uppercase", letterSpacing:"1.2px" }}>
            {cat.emoji} {cat.label}
          </div>
        </div>
        <div style={{ padding:"20px 0 14px" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>{selectedEntry.emoji||cat.emoji}</div>
          <div style={{ fontSize:22, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>{selectedEntry.title}</div>
          {selectedEntry.summary && <div style={{ fontSize:14, color:"var(--ink2)", lineHeight:1.55, marginBottom:16 }}>{selectedEntry.summary}</div>}
          {selectedEntry.risk_level && selectedEntry.risk_level !== "none" && (
            <span style={{ ...S.pill(selectedEntry.risk_level==="high"?"var(--red-lt)":"var(--amber-lt)", selectedEntry.risk_level==="high"?"var(--red)":"var(--amber)", selectedEntry.risk_level==="high"?"var(--red-md)":"var(--amber-md)"), display:"inline-flex", alignItems:"center", gap:5 }}>
              {selectedEntry.risk_level==="high"?"⚠️":"⚡"} {selectedEntry.risk_level==="high"?"Høj risiko":"Moderat"}
            </span>
          )}
        </div>
        {selectedEntry.description && <div style={S.section}><div style={S.sectionLabel}>Beskrivelse</div><div style={S.sectionText}>{selectedEntry.description}</div></div>}
        {selectedEntry.health_notes && <div style={S.healthBox}><div style={{ ...S.sectionLabel, color:"var(--warm)" }}>⚕️ Sundhedsnote</div><div style={S.sectionText}>{selectedEntry.health_notes}</div></div>}
        {Array.isArray(selectedEntry.allergen_ids) && selectedEntry.allergen_ids.length > 0 && (
          <div style={S.section}><div style={S.sectionLabel}>Allergener</div><div style={S.pillRow}>{selectedEntry.allergen_ids.map(a => <span key={a} style={S.pill("var(--red-lt)","var(--red)","var(--red-md)")}>🌾 {AN[a]||a}</span>)}</div></div>
        )}
        {Array.isArray(selectedEntry.found_in) && selectedEntry.found_in.length > 0 && (
          <div style={S.section}><div style={S.sectionLabel}>Findes i</div><div style={S.pillRow}>{selectedEntry.found_in.map((f,i) => <span key={i} style={S.pill("var(--surface)","var(--muted)","var(--border)")}>{f}</span>)}</div></div>
        )}
        {Array.isArray(selectedEntry.alternatives) && selectedEntry.alternatives.length > 0 && (
          <div style={S.section}><div style={S.sectionLabel}>Alternativer</div><div style={S.pillRow}>{selectedEntry.alternatives.map((a,i) => <span key={i} style={S.pill("var(--green-lt)","var(--green)","rgba(74,222,128,.2)")}>✓ {a}</span>)}</div></div>
        )}
        {Array.isArray(selectedEntry.aliases) && selectedEntry.aliases.length > 0 && (
          <div style={S.section}><div style={S.sectionLabel}>Kendes også som</div><div style={S.pillRow}>{selectedEntry.aliases.map((a,i) => <span key={i} style={S.pill("var(--surface)","var(--muted)","var(--border)")}>{a}</span>)}</div></div>
        )}
        <div style={{ height:40 }} />
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  const showList = searchQuery.length >= 2 || selectedCategory;
  const total = Object.values(counts).reduce((a,b) => a+b, 0);

  return (
    <div className="screen fade-in">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:4, marginBottom:16 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:"var(--ink)" }}>📚 Leksikon</div>
          <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{total} entries</div>
        </div>
      </div>

      {/* Fejlbesked — synlig under udvikling */}
      {error && <div style={S.error}>⚠️ {error}</div>}

      {/* Søg */}
      <div style={S.searchWrap}>
        <svg style={S.searchIcon} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input style={S.searchInput} placeholder="Søg ingredienser, E-numre, allergener..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)} />
        {searchQuery && <button onClick={() => { setSearchQuery(""); if(!selectedCategory) setEntries([]); }} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:4, color:"var(--muted)" }}>✕</button>}
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
                  <span style={S.catEmoji}>{cat.emoji}</span>
                  <div>
                    <div style={active ? S.catLabelActive(cat) : S.catLabel}>{cat.label}</div>
                    {counts[cat.id] !== undefined && <div style={S.catCount}>{counts[cat.id]}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Filter-header */}
      {showList && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          {selectedCategory && (() => { const c = CAT_MAP[selectedCategory]; return (
            <button onClick={() => handleCatSelect(null)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:c?.bg, border:`1px solid ${c?.color}33`, borderRadius:100, cursor:"pointer", fontSize:12, fontWeight:700, color:c?.color, fontFamily:"var(--f)" }}>
              {c?.emoji} {c?.label} ✕
            </button>
          );})()}
          <div style={{ fontSize:12, color:"var(--muted)" }}>{entries.length} resultater</div>
        </div>
      )}

      {/* Entry-liste */}
      {showList && (loading ? (
        <div style={{ textAlign:"center", padding:"40px 0" }}>
          <div style={{ width:32, height:32, border:"3px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 12px" }} />
          <div style={{ fontSize:13, color:"var(--muted)" }}>Henter...</div>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>Ingen resultater</div>
          <div style={{ fontSize:13, color:"var(--muted)" }}>{searchQuery ? "Prøv et andet søgeord" : "Ingen entries i denne kategori endnu"}</div>
        </div>
      ) : (
        <div>{entries.map(entry => {
          const cat = CAT_MAP[entry.category] || {};
          return (
            <div key={entry.id} style={S.card} onClick={() => setSelectedEntry(entry)}>
              <div style={S.cardEmoji}>{entry.emoji||cat.emoji||"📄"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={S.cardTitle}>{entry.title}</div>
                {entry.summary && <div style={S.cardSummary}>{entry.summary}</div>}
              </div>
              {entry.risk_level && entry.risk_level !== "none" && <div style={S.riskDot(entry.risk_level)} />}
            </div>
          );
        })}</div>
      ))}

      {/* Fun facts på forsiden */}
      {!showList && funFacts.length > 0 && (
        <div style={{ marginTop:8 }}>
          <div style={S.label}>💡 Vidste du at...</div>
          {funFacts.map(f => (
            <div key={f.id} onClick={() => setSelectedEntry(f)}
              style={{ background:"rgba(232,168,124,.10)", border:"1px solid rgba(232,168,124,.18)", borderRadius:12, padding:"12px 14px", cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ fontSize:22, flexShrink:0 }}>{f.emoji||"💡"}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:3 }}>{f.title}</div>
                <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.45 }}>{f.summary}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height:20 }} />
    </div>
  );
}
