// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCREENS } from "./constants.jsx";
import { Icon } from "./SharedComponents.jsx";

// ── Kategori-config ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "allergen",       emoji: "🌾", label: "Allergener",      color: "var(--red)",    bg: "var(--red-lt)",    border: "var(--red-md)" },
  { id: "ingredient",     emoji: "🫙", label: "Ingredienser",    color: "var(--blue)",   bg: "var(--blue-lt)",   border: "rgba(96,165,250,.2)" },
  { id: "e_number",       emoji: "🔢", label: "E-numre",         color: "var(--amber)",  bg: "var(--amber-lt)",  border: "var(--amber-md)" },
  { id: "diet",           emoji: "🥗", label: "Diæter",          color: "var(--green)",  bg: "var(--green-lt)",  border: "rgba(74,222,128,.2)" },
  { id: "cross_reaction", emoji: "🔄", label: "Krydsreaktioner", color: "var(--warm)",   bg: "var(--warm-lt)",   border: "var(--warm-md)" },
  { id: "faq",            emoji: "❓", label: "FAQ",             color: "var(--neutral)", bg: "var(--surface2)", border: "var(--border)" },
  { id: "fun_fact",       emoji: "💡", label: "Vidste du at",    color: "var(--warm)",   bg: "var(--warm-lt)",   border: "var(--warm-md)" },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const RISK_LABEL = { high: "Høj risiko", medium: "Moderat", low: "Lav", none: "Ingen" };
const RISK_CLASS = { high: "high", medium: "medium", low: "low", none: "none" };

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildUrl(params) {
  const base = `${SUPABASE_URL}/rest/v1/knowledge_base`;
  const q = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  return `${base}?${q}`;
}

async function fetchKB(url, accessToken) {
  const res = await fetch(url, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Accept": "application/json",
      ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`KB fetch fejl: ${res.status}`);
  return res.json();
}

// ── Sub-komponenter ──────────────────────────────────────────────────────────
function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="kb-search-wrap">
      <svg className="kb-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input
        className="kb-search-input"
        placeholder="Søg ingredienser, E-numre, allergener..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button onClick={onClear} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:4, color:"var(--muted)", lineHeight:0 }}>
          <Icon name="x" size={14} color="var(--muted)" />
        </button>
      )}
    </div>
  );
}

function CategoryGrid({ selected, onSelect, counts }) {
  return (
    <div className="kb-cat-grid">
      {CATEGORIES.map(cat => {
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            className={`kb-cat-btn${isActive ? " active" : ""}`}
            onClick={() => onSelect(isActive ? null : cat.id)}
            style={isActive ? { background: cat.bg, borderColor: cat.border } : {}}
          >
            <span className="kb-cat-emoji">{cat.emoji}</span>
            <div>
              <div className="kb-cat-label" style={isActive ? { color: cat.color } : {}}>{cat.label}</div>
              {counts[cat.id] !== undefined && (
                <div className="kb-cat-count">{counts[cat.id]} entries</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function EntryCard({ entry, onClick }) {
  const cat = CAT_MAP[entry.category] || {};
  return (
    <div className="kb-entry-card" onClick={() => onClick(entry)}>
      <div className="kb-entry-emoji">{entry.emoji || cat.emoji || "📄"}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div className="kb-entry-title">{entry.title}</div>
        {entry.summary && <div className="kb-entry-summary">{entry.summary}</div>}
      </div>
      {entry.risk_level && entry.risk_level !== "none" && (
        <div className={`kb-risk-dot ${RISK_CLASS[entry.risk_level] || "none"}`} />
      )}
    </div>
  );
}

function DetailView({ entry, onBack }) {
  const cat = CAT_MAP[entry.category] || {};
  const allergenNames = {
    gluten:"Gluten", laktose:"Laktose/Mælk", aeg:"Æg", noedder:"Nødder",
    jordnoedder:"Jordnødder", soja:"Soja", fisk:"Fisk", skaldyr:"Skaldyr",
    selleri:"Selleri", sennep:"Sennep", sesam:"Sesam", svovl:"Svovl/Sulfitter",
    lupin:"Lupin", bloeddyr:"Bløddyr",
  };

  return (
    <div className="screen fade-in">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0 8px" }}>
        <button onClick={onBack} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 10px", cursor:"pointer", display:"flex", alignItems:"center", lineHeight:0, flexShrink:0 }}>
          <Icon name="arrow-left" size={18} color="var(--ink)" />
        </button>
        <div style={{ fontSize:11, fontWeight:700, color: cat.color || "var(--muted)", textTransform:"uppercase", letterSpacing:"1.2px" }}>
          {cat.emoji} {cat.label}
        </div>
      </div>

      {/* Titel og emoji */}
      <div className="kb-detail-header">
        <div style={{ fontSize:36, marginBottom:10 }}>{entry.emoji || cat.emoji}</div>
        <div className="kb-detail-title">{entry.title}</div>
        {entry.summary && <div className="kb-detail-summary">{entry.summary}</div>}

        {/* Risk badge */}
        {entry.risk_level && entry.risk_level !== "none" && (
          <span className={`kb-risk-badge ${RISK_CLASS[entry.risk_level]}`}>
            {entry.risk_level === "high" ? "⚠️" : entry.risk_level === "medium" ? "⚡" : "✓"} {RISK_LABEL[entry.risk_level]}
          </span>
        )}
      </div>

      {/* Beskrivelse */}
      {entry.description && (
        <div className="kb-detail-section">
          <div className="kb-detail-label">Beskrivelse</div>
          <div className="kb-detail-text">{entry.description}</div>
        </div>
      )}

      {/* Sundhedsnote */}
      {entry.health_notes && (
        <div className="kb-detail-section" style={{ background:"var(--warm-lt)", border:"1px solid var(--warm-md)", borderRadius:12, padding:"12px 14px" }}>
          <div className="kb-detail-label" style={{ color:"var(--warm)" }}>⚕️ Sundhedsnote</div>
          <div className="kb-detail-text">{entry.health_notes}</div>
        </div>
      )}

      {/* Allergener */}
      {Array.isArray(entry.allergen_ids) && entry.allergen_ids.length > 0 && (
        <div className="kb-detail-section">
          <div className="kb-detail-label">Allergener</div>
          <div className="kb-pill-row">
            {entry.allergen_ids.map(a => (
              <span key={a} className="kb-pill allergen">🌾 {allergenNames[a] || a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Findes i */}
      {Array.isArray(entry.found_in) && entry.found_in.length > 0 && (
        <div className="kb-detail-section">
          <div className="kb-detail-label">Findes i</div>
          <div className="kb-pill-row">
            {entry.found_in.map((f, i) => (
              <span key={i} className="kb-pill found">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Alternativer */}
      {Array.isArray(entry.alternatives) && entry.alternatives.length > 0 && (
        <div className="kb-detail-section">
          <div className="kb-detail-label">Alternativer</div>
          <div className="kb-pill-row">
            {entry.alternatives.map((a, i) => (
              <span key={i} className="kb-pill alt">✓ {a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Aliasser */}
      {Array.isArray(entry.aliases) && entry.aliases.length > 0 && (
        <div className="kb-detail-section">
          <div className="kb-detail-label">Kendes også som</div>
          <div className="kb-pill-row">
            {entry.aliases.map((a, i) => (
              <span key={i} className="kb-pill found">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Diæt-tags */}
      {Array.isArray(entry.diet_tags) && entry.diet_tags.length > 0 && (
        <div className="kb-detail-section">
          <div className="kb-detail-label">Diæt</div>
          <div className="kb-pill-row">
            {entry.diet_tags.map((d, i) => (
              <span key={i} className="kb-pill alt">{d}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ height:40 }} />
    </div>
  );
}

// ── Hoved-komponent ───────────────────────────────────────────────────────────
export default function KnowledgeScreen({ screen, setScreen, accessToken, openSlug, onSlugHandled }) {
  const [searchQuery, setSearchQuery]       = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [entries, setEntries]               = useState([]);
  const [selectedEntry, setSelectedEntry]   = useState(null);
  const [loading, setLoading]               = useState(false);
  const [counts, setCounts]                 = useState({});
  const [searchTimeout, setSearchTimeout]   = useState(null);

  // Hent kategoritælling ved mount
  useEffect(() => {
    async function loadCounts() {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/knowledge_base?select=category&limit=1000`,
          { headers: { "apikey": SUPABASE_ANON_KEY, "Accept": "application/json",
              ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}) } }
        );
        const data = await res.json();
        const c = {};
        if (Array.isArray(data)) {
          data.forEach(r => { if (r.category) c[r.category] = (c[r.category] || 0) + 1; });
          setCounts(c);
        } else {
          console.error("KB counts fejl:", data);
        }
      } catch (e) { console.error("KB counts fejl:", e); }
    }
    loadCounts();
  }, [accessToken]);

  // Håndter openSlug (fra scan-links)
  useEffect(() => {
    if (!openSlug) return;
    async function fetchBySlug() {
      try {
        const data = await fetchKB(
          `${SUPABASE_URL}/rest/v1/knowledge_base?slug=eq.${openSlug}&limit=1`,
          accessToken
        );
        if (Array.isArray(data) && data[0]) {
          setSelectedEntry(data[0]);
        }
      } catch {}
      onSlugHandled?.();
    }
    fetchBySlug();
  }, [openSlug]);

  // Indlæs entries baseret på kategori
  const loadCategory = useCallback(async (cat) => {
    if (!cat) { setEntries([]); return; }
    setLoading(true);
    try {
      const data = await fetchKB(
        `${SUPABASE_URL}/rest/v1/knowledge_base?category=eq.${cat}&order=sort_order.asc,title.asc&limit=200`,
        accessToken
      );
      setEntries(Array.isArray(data) ? data : []);
    } catch { setEntries([]); }
    setLoading(false);
  }, [accessToken]);

  // Søgning med debounce
  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { if (!selectedCategory) setEntries([]); else loadCategory(selectedCategory); return; }
    setLoading(true);
    try {
      const encoded = encodeURIComponent(`%${q}%`);
      const url = `${SUPABASE_URL}/rest/v1/knowledge_base?or=(title.ilike.${encoded},summary.ilike.${encoded})&order=category.asc,sort_order.asc&limit=50`;
      const data = await fetchKB(url, accessToken);
      setEntries(Array.isArray(data) ? data : []);
    } catch { setEntries([]); }
    setLoading(false);
  }, [accessToken, selectedCategory, loadCategory]);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    if (!searchQuery) {
      if (selectedCategory) loadCategory(selectedCategory);
      else setEntries([]);
      return;
    }
    const t = setTimeout(() => doSearch(searchQuery), 300);
    setSearchTimeout(t);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setSearchQuery("");
    if (cat) loadCategory(cat);
    else setEntries([]);
  };

  // Detaljevisning
  if (selectedEntry) {
    return <DetailView entry={selectedEntry} onBack={() => setSelectedEntry(null)} />;
  }

  const showList = searchQuery.length >= 2 || selectedCategory;

  return (
    <div className="screen fade-in">
      {/* Topbar-titel */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:4, marginBottom:16 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:"var(--ink)", letterSpacing:"-.4px" }}>📚 Leksikon</div>
          <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{Object.values(counts).reduce((a,b)=>a+b,0)} entries</div>
        </div>
      </div>

      {/* Søgebar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => { setSearchQuery(""); if (!selectedCategory) setEntries([]); else loadCategory(selectedCategory); }}
      />

      {/* Kategori-grid — altid synlig */}
      {!showList && (
        <>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:10 }}>Kategorier</div>
          <CategoryGrid selected={selectedCategory} onSelect={handleCategorySelect} counts={counts} />
        </>
      )}

      {/* Søg/kategori-header */}
      {showList && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          {selectedCategory && (
            <button
              onClick={() => handleCategorySelect(null)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background: CAT_MAP[selectedCategory]?.bg || "var(--surface)", border:`1px solid ${CAT_MAP[selectedCategory]?.border || "var(--border)"}`, borderRadius:100, cursor:"pointer", fontSize:12, fontWeight:700, color: CAT_MAP[selectedCategory]?.color || "var(--ink)", fontFamily:"var(--f)" }}>
              {CAT_MAP[selectedCategory]?.emoji} {CAT_MAP[selectedCategory]?.label}
              <Icon name="x" size={12} color={CAT_MAP[selectedCategory]?.color || "var(--ink)"} />
            </button>
          )}
          {!selectedCategory && searchQuery && (
            <div style={{ fontSize:12, color:"var(--muted)" }}>{entries.length} resultater for "{searchQuery}"</div>
          )}
          {selectedCategory && !searchQuery && (
            <div style={{ fontSize:12, color:"var(--muted)" }}>{entries.length} entries</div>
          )}
        </div>
      )}

      {/* Entry-liste */}
      {showList && (
        loading ? (
          <div style={{ textAlign:"center", padding:"40px 0" }}>
            <div style={{ width:32, height:32, border:"3px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 12px" }} />
            <div style={{ fontSize:13, color:"var(--muted)" }}>Henter...</div>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>Ingen resultater</div>
            <div style={{ fontSize:13, color:"var(--muted)" }}>
              {searchQuery ? `Prøv et andet søgeord` : "Ingen entries i denne kategori endnu"}
            </div>
          </div>
        ) : (
          <div>
            {entries.map(entry => (
              <EntryCard key={entry.id} entry={entry} onClick={setSelectedEntry} />
            ))}
          </div>
        )
      )}

      {/* Forsiden — ingen kategori valgt, ingen søgning */}
      {!showList && (
        <div style={{ marginTop:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:10 }}>💡 Vidste du at...</div>
          <RandomFacts accessToken={accessToken} onSelect={setSelectedEntry} />
        </div>
      )}

      <div style={{ height:20 }} />
    </div>
  );
}

// ── Random fun facts på forsiden ─────────────────────────────────────────────
function RandomFacts({ accessToken, onSelect }) {
  const [facts, setFacts] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchKB(
          `${SUPABASE_URL}/rest/v1/knowledge_base?category=eq.fun_fact&limit=3`,
          accessToken
        );
        setFacts(Array.isArray(data) ? data : []);
      } catch {}
    }
    load();
  }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {facts.map(f => (
        <div key={f.id} onClick={() => onSelect(f)}
          style={{ background:"var(--warm-lt)", border:"1px solid var(--warm-md)", borderRadius:12, padding:"12px 14px", cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start" }}>
          <div style={{ fontSize:22, flexShrink:0 }}>{f.emoji || "💡"}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:3 }}>{f.title}</div>
            <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.45 }}>{f.summary}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
