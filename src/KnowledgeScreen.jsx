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
// kategori-flise blandt de øvrige.
// Krydsreaktioners farve ændret fra en peach (#E8A87C) til --blue (samme dag,
// opfølgning: "undgå at bruge samme orange farve til både kategori-identitet
// OG advarsler" — peach lå visuelt for tæt på risiko-amberen, så et
// krydsreaktions-ikon kunne fejlagtigt læses som en aktiv advarsel i sig
// selv). "Vidste du at" beholder sin peach — den kategori viser aldrig
// risikoniveauer, så der er intet reelt kollisionsscenarie der.
const CATEGORIES = [
  { id:"allergen",       icon:"shield",   label:"Allergener",      color:"var(--red)",   bg:"rgba(255,82,82,.10)" },
  { id:"ingredient",     icon:"package",  label:"Ingredienser",    color:"var(--blue)",  bg:"rgba(96,165,250,.10)" },
  { id:"e_number",       icon:"hash",     label:"E-numre",         color:"var(--amber)", bg:"rgba(255,186,59,.10)" },
  { id:"diet",           icon:"utensils", label:"Diæter",          color:"var(--green)", bg:"rgba(14,143,90,.10)" },
  { id:"cross_reaction", icon:"refresh",  label:"Krydsreaktioner", color:"var(--blue)",  bg:"var(--blue-lt)" },
  { id:"fun_fact",       icon:"bulb",     label:"Vidste du at",    color:"#E8A87C",      bg:"rgba(232,168,124,.10)" },
];
// "FAQ" → "Ofte stillede spørgsmål" (26. sept. 2026, brugerfeedback) — egen
// hjælpesektion i stedet for en kategori-flise, men stadig en del af
// CAT_MAP så kategori-labelen på en FAQ-detaljeside ("OFTE STILLEDE
// SPØRGSMÅL") kan slås op ét sted, ikke en selvstændig kopi af opslaget.
const FAQ_CATEGORY = { id:"faq", icon:"message", label:"Ofte stillede spørgsmål", color:"var(--neutral)", bg:"rgba(148,163,184,.10)" };
const CAT_MAP = Object.fromEntries([...CATEGORIES, FAQ_CATEGORY].map(c => [c.id, c]));

// Konsekvent risiko-farvesystem (26. sept. 2026, opfølgning) — grøn/orange/
// rød for lav/moderat/høj, samme tre farver appen allerede bruger semantisk
// alle andre steder (Historik/Indkøbsliste/Favoritter-statuslinjer). "low"
// manglede helt tidligere (blev fejlagtigt farvet som "moderat"), selvom
// knowledge_base rent faktisk bruger den flittigt (fx 103 af 247 E-numre har
// risk_level:"low"). "none"/null giver bevidst INGEN badge, se brugsstederne.
const RISK_META = {
  high:   { label:"Høj risiko",  color:"var(--red)",   bg:"var(--red-lt)",   border:"var(--red-md)" },
  medium: { label:"Moderat",     color:"var(--amber)", bg:"var(--amber-lt)", border:"var(--amber-md)" },
  low:    { label:"Lav risiko",  color:"var(--green)", bg:"var(--green-lt)", border:"rgba(14,143,90,.2)" },
};

// Læsevenlige kildenavne i stedet for rå URL'er (26. sept. 2026,
// opfølgning) — fallback til selve domænet for ukendte kilder, så en
// fremtidig, ikke-kortlagt kilde stadig vises pænt frem for at knække.
const KNOWN_SOURCES = {
  "astma-allergi.dk": "Astma-Allergi Danmark",
  "ncbi.nlm.nih.gov": "NCBI / National Library of Medicine",
  "sundhed.dk": "Sundhed.dk",
  "datatilsynet.dk": "Datatilsynet",
};
function sourceLabel(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return KNOWN_SOURCES[host] || host;
  } catch { return url; }
}

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
  // Kompakte resultatkort (26. sept. 2026, opfølgning: "gør resultatkortene
  // mere kompakte") — reduceret padding/gap/ikonstørrelse ift. den første
  // redesign-runde. cardSummary er nu clamped til 2 linjer med ellipsis —
  // fuld forklaring hører kun hjemme på detaljesiden.
  card: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"10px 12px", marginBottom:6, display:"flex", alignItems:"flex-start", gap:9, cursor:"pointer" },
  cardIconBox: (c) => ({ width:32, height:32, borderRadius:8, background:c.bg||"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }),
  cardTitle: { fontSize:13.5, fontWeight:700, color:"var(--ink)", marginBottom:2 },
  cardSummary: { fontSize:11.5, color:"var(--muted2)", lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" },
  // Farvet prik ALDRIG alene (26. sept. 2026, brugerfeedback) — altid parret
  // med tydelig tekst ("Høj risiko"/"Moderat"/"Lav risiko"), samme ikon+
  // tekst+farve-princip som resten af appens statuslinjer.
  riskRow: (level) => ({ display:"flex", alignItems:"center", gap:4, marginTop:4, fontSize:10.5, fontWeight:700, color: RISK_META[level]?.color || "var(--muted)" }),
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

// Tærskel for hvornår "Kort fortalt" bliver clampet til 4 linjer med en
// "Læs mere"-udvidelse i stedet for at vise det fulde afsnit direkte (26.
// sept. 2026, opfølgning: "gør indholdet reelt kort, ca. 2-4 linjer").
// knowledge_base har KUN ét description-felt (ingen separat "kort"/"lang"-
// version) — i stedet for at opfinde en kunstig sætnings-afskæring har
// "Kort fortalt" derfor et ægte, fuldt indhold der bare er visuelt clampet
// som standard, fremfor en fabrikeret "Mere om X"-sektion bygget på en
// gættet midt-i-sætningen-deling af samme tekst.
const DESC_CLAMP_THRESHOLD = 220;

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
  // Relaterede krydsreaktioner for en allergen-detaljeside — knowledge_base
  // har ingen selvstændig "cross_reactions"-kolonne, men cross_reaction-
  // opslagenes EGEN allergen_ids-liste indeholder netop de allergener
  // krydsreaktionen vedrører (fx "Birk → Frugt og grønt" har allergen_ids:
  // ["selleri","noedder"]) — genbruger derfor et ægte, eksisterende DB-felt
  // til at slå relaterede opslag op, i stedet for at opfinde indhold uden
  // datagrundlag.
  const [crossReactions, setCrossReactions] = useState([]);
  // "Relaterede opslag" (26. sept. 2026) — bredere end krydsreaktioner:
  // ethvert andet opslag (allergen/ingrediens/diæt/E-nummer/FAQ) der deler
  // mindst ét allergen_id med det aktuelle opslag. Ekskluderer selv
  // cross_reaction (allerede dækket af Krydsreaktioner-sektionen ovenfor,
  // for at undgå at samme opslag optræder to gange) og fun_fact (trivia,
  // ikke opslagsværks-reference).
  const [relatedEntries, setRelatedEntries] = useState([]);
  const [sourcesOpen, setSourcesOpen]       = useState(false);
  const [descExpanded, setDescExpanded]     = useState(false);

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

  // Relaterede opslag + krydsreaktioner — nulstilles ved hvert entry-skift,
  // så en tidligere entrys resultater ikke "hænger ved" på den næste.
  useEffect(() => {
    setSourcesOpen(false);
    setDescExpanded(false);
    setCrossReactions([]);
    setRelatedEntries([]);
    if (!selectedEntry) return;
    const allergenId = selectedEntry.allergen_ids?.[0];
    if (!allergenId) return;
    if (selectedEntry.category === "allergen") {
      (async () => {
        try {
          const data = await doFetch(`${SUPABASE_URL}/rest/v1/knowledge_base?category=eq.cross_reaction&allergen_ids=cs.${encodeURIComponent(`{${allergenId}}`)}&limit=10`);
          if (Array.isArray(data)) setCrossReactions(data.filter(x => x.id !== selectedEntry.id));
        } catch { /* ikke-kritisk — sektionen skjules bare hvis opslaget fejler */ }
      })();
    }
    (async () => {
      try {
        const data = await doFetch(`${SUPABASE_URL}/rest/v1/knowledge_base?allergen_ids=ov.${encodeURIComponent(`{${allergenId}}`)}&category=not.in.(fun_fact,cross_reaction)&order=category.asc,title.asc&limit=8`);
        if (Array.isArray(data)) setRelatedEntries(data.filter(x => x.id !== selectedEntry.id).slice(0,6));
      } catch { /* ikke-kritisk */ }
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
    const risk = RISK_META[selectedEntry.risk_level];
    const AN = { gluten:"Gluten",laktose:"Laktose/Mælk",aeg:"Æg",noedder:"Nødder",jordnoedder:"Jordnødder",soja:"Soja",fisk:"Fisk",skaldyr:"Skaldyr",selleri:"Selleri",sennep:"Sennep",sesam:"Sesam",svovl:"Svovl/Sulfitter",lupin:"Lupin",bloeddyr:"Bløddyr" };
    const desc = selectedEntry.description || "";
    const descIsLong = desc.length > DESC_CLAMP_THRESHOLD;
    return (
      <div className="screen fade-in">
        {/* Tydelig tilbageknap øverst til venstre + kategori-label OVER
            titlen (fx "ALLERGENER"). */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0 8px" }}>
          <button onClick={() => setSelectedEntry(null)} aria-label="Tilbage" style={S.backBtn}>
            <Icon name="chevronLeft" size={18} color="var(--ink)" />
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontWeight:700, color:cat.color||"var(--muted)", textTransform:"uppercase", letterSpacing:"1.2px" }}>
            {cat.icon && <Icon name={cat.icon} size={12} color={cat.color||"var(--muted)"} />} {cat.label}
          </div>
        </div>
        <div style={{ padding:"14px 0 14px" }}>
          {/* Kategoriikon reduceret ca. 25% (56→42px boks, 26→20px ikon —
              26. sept. 2026, opfølgning: "reducer det ca. 20-30%, så det
              ikke optager unødigt meget plads"). */}
          <div style={{ width:42, height:42, borderRadius:12, background:cat.bg||"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
            <Icon name={cat.icon||"book"} size={20} color={cat.color||"var(--ink2)"} />
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>{selectedEntry.title}</div>
          {selectedEntry.summary && <div style={{ fontSize:14, color:"var(--ink2)", lineHeight:1.55, marginBottom:16 }}>{selectedEntry.summary}</div>}
          {risk && (
            <span style={{ ...S.pill(risk.bg, risk.color, risk.border), display:"inline-flex", alignItems:"center", gap:6 }}>
              <Icon name="warning" size={11} color={risk.color} /> {risk.label}
            </span>
          )}
        </div>

        {/* "Kort fortalt" — clampet til 4 linjer som standard, kun med en
            "Læs mere"-udvidelse hvis teksten reelt er lang (26. sept. 2026,
            opfølgning: "skal kunne læses hurtigt, ca. 2-4 linjer"). */}
        {desc && (
          <div style={S.section}>
            <div style={S.sectionLabel}>Kort fortalt</div>
            <div style={descIsLong && !descExpanded ? { ...S.sectionText, display:"-webkit-box", WebkitLineClamp:4, WebkitBoxOrient:"vertical", overflow:"hidden" } : S.sectionText}>
              {desc}
            </div>
            {descIsLong && (
              <button onClick={() => setDescExpanded(v => !v)}
                style={{ background:"none", border:"none", padding:0, marginTop:6, cursor:"pointer", fontFamily:"var(--f)", fontSize:11.5, fontWeight:700, color:"var(--green)" }}>
                {descExpanded ? "Vis mindre" : "Læs mere"}
              </button>
            )}
          </div>
        )}

        {selectedEntry.health_notes && <div style={S.healthBox}><div style={{ ...S.sectionLabel, color:"var(--warm)", display:"flex", alignItems:"center", gap:6 }}><Icon name="info" size={12} color="var(--warm)" /> Sundhedsnote</div><div style={S.sectionText}>{selectedEntry.health_notes}</div></div>}

        {Array.isArray(selectedEntry.allergen_ids) && selectedEntry.allergen_ids.length > 0 && (
          <div style={S.section}><div style={S.sectionLabel}>Allergener</div><div style={S.pillRow}>{selectedEntry.allergen_ids.map(a => <span key={a} style={{ ...S.pill("var(--red-lt)","var(--red)","var(--red-md)"), display:"inline-flex", alignItems:"center", gap:4 }}><Icon name="warning" size={10} color="var(--red)" /> {AN[a]||a}</span>)}</div></div>
        )}

        {Array.isArray(selectedEntry.found_in) && selectedEntry.found_in.length > 0 && (
          <div style={S.section}><div style={S.sectionLabel}>Findes ofte i</div><div style={S.pillRow}>{selectedEntry.found_in.map((f,i) => <span key={i} style={S.pill("var(--surface)","var(--muted)","var(--border)")}>{f}</span>)}</div></div>
        )}

        {Array.isArray(selectedEntry.alternatives) && selectedEntry.alternatives.length > 0 && (
          <div style={S.section}><div style={S.sectionLabel}>Alternativer</div><div style={S.pillRow}>{selectedEntry.alternatives.map((a,i) => <span key={i} style={{ ...S.pill("var(--green-lt)","var(--green)","rgba(14,143,90,.2)"), display:"inline-flex", alignItems:"center", gap:4 }}><Icon name="check" size={10} color="var(--green)" /> {a}</span>)}</div></div>
        )}

        {Array.isArray(selectedEntry.aliases) && selectedEntry.aliases.length > 0 && (
          <div style={S.section}><div style={S.sectionLabel}>Kendes også som</div><div style={S.pillRow}>{selectedEntry.aliases.map((a,i) => <span key={i} style={S.pill("var(--surface)","var(--muted)","var(--border)")}>{a}</span>)}</div></div>
        )}

        {/* "Krydsreaktioner" — kun for allergen-opslag hvor der reelt findes
            relaterede cross_reaction-opslag (se effect ovenfor). */}
        {crossReactions.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionLabel}>Krydsreaktioner</div>
            {crossReactions.map(x => {
              const xCat = CAT_MAP[x.category] || CAT_MAP.cross_reaction;
              return (
                <div key={x.id} style={{ ...S.card, marginBottom:6 }} onClick={() => setSelectedEntry(x)}>
                  <div style={S.cardIconBox(xCat)}><Icon name={xCat.icon} size={15} color={xCat.color} /></div>
                  <div style={UI.flexMin}>
                    <div style={{ ...S.cardTitle, fontSize:13, marginBottom:1 }}>{x.title}</div>
                    {x.summary && <div style={S.cardSummary}>{x.summary}</div>}
                  </div>
                  <Icon name="chevronRight" size={14} color="var(--muted)" />
                </div>
              );
            })}
          </div>
        )}

        {/* "Relaterede opslag" (26. sept. 2026) — kompakte, klikbare chips
            til beslægtet indhold i ANDRE kategorier, baseret på delte
            allergen_ids (fx "Æg ↔ Fjerkræ" → "Æg", "Æggehvide" m.fl.). */}
        {relatedEntries.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionLabel}>Relaterede opslag</div>
            <div style={S.pillRow}>
              {relatedEntries.map(x => {
                const xCat = CAT_MAP[x.category] || {};
                return (
                  <button key={x.id} onClick={() => setSelectedEntry(x)}
                    style={{ ...S.pill("var(--surface)","var(--ink)","var(--border)"), display:"inline-flex", alignItems:"center", gap:5, cursor:"pointer", fontFamily:"var(--f)" }}>
                    <Icon name={xCat.icon||"book"} size={11} color={xCat.color||"var(--muted)"} /> {x.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* "Kilder og faglig gennemgang" — skjult bag en diskret disclosure
            (lukket som standard), kun vist hvis opslaget rent faktisk har
            kilder registreret (knowledge_base.sources). Viser læsevenlige
            kildenavne (fx "Astma-Allergi Danmark") i stedet for rå URL'er —
            selve linket åbner stadig den ægte adresse. */}
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
              <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:8 }}>
                {selectedEntry.sources.map((src,i) => (
                  <a key={i} href={src} target="_blank" rel="noopener noreferrer"
                    style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:"var(--green)", textDecoration:"none" }}>
                    <Icon name="link" size={12} color="var(--green)" /> {sourceLabel(src)}
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

        {/* Diskret lægelig disclaimer — samme muted, sekundære stil som
            "Sidst opdateret" ovenfor, ikke en fremhævet advarselsboks (det
            er allerede Sundhedsnotens rolle). */}
        <div style={{ fontSize:10.5, color:"var(--muted)", marginTop:6, lineHeight:1.4 }}>
          Indholdet på denne side er vejledende og erstatter ikke professionel lægelig rådgivning.
        </div>

        {/* Safe-area-bevidst bundplads (26. sept. 2026, opfølgning: "sidste
            element skal altid kunne scrolles helt fri af navigationen") —
            lagt OVEN PÅ den delte .screen-klasses faste 110px bundpadding,
            ikke en erstatning for den (den er fælles for alle skærme). */}
        <div style={{ height:"calc(40px + env(safe-area-inset-bottom))" }} />
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

          {/* "FAQ" → egen hjælpesektion i stedet for en kategori-flise —
              samme handleCatSelect-mekanisme som kategorierne ovenfor. */}
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
            <div key={i} className="skeleton-card" style={{ display:"flex", gap:9, marginBottom:6 }}>
              <div className="skeleton-block" style={{ width:32, height:32, borderRadius:8, flexShrink:0 }} />
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
          const risk = RISK_META[entry.risk_level];
          return (
            <div key={entry.id} style={S.card} onClick={() => setSelectedEntry(entry)}>
              <div style={S.cardIconBox(cat)}><Icon name={cat.icon||"book"} size={16} color={cat.color||"var(--ink2)"} /></div>
              <div style={UI.flexMin}>
                <div style={S.cardTitle}>{entry.title}</div>
                {entry.summary && <div style={S.cardSummary}>{entry.summary}</div>}
                {/* Farvet prik ALDRIG alene — altid parret med tydelig tekst. */}
                {risk && (
                  <div style={S.riskRow(entry.risk_level)}>
                    <Icon name="warning" size={10} color="currentColor" /> {risk.label}
                  </div>
                )}
              </div>
              <Icon name="chevronRight" size={14} color="var(--muted)" />
            </div>
          );
        })}</div>
      ))}

      {/* Fun facts på forsiden — kompakte teaser-cards, maks. 3 stk. (26.
          sept. 2026, opfølgning: "skal fylde mindre visuelt, maks. 2-3
          kort, gør kortene en smule mere kompakte"), med en diskret "Se
          alle →" nederst der åbner hele fun_fact-kategorien. Leksikonet
          skal først og fremmest opleves som et opslagsværk, ikke et
          artikel-feed. */}
      {!showList && funFacts.length > 0 && (
        <div style={UI.mt8}>
          <div style={{ ...S.label, display:"flex", alignItems:"center", gap:6 }}><Icon name="bulb" size={12} color="var(--muted)" /> Vidste du at...</div>
          {funFacts.slice(0,3).map(f => {
            const fCat = CAT_MAP[f.category] || CAT_MAP.fun_fact;
            return (
              <div key={f.id} onClick={() => setSelectedEntry(f)}
                style={{ background:"rgba(232,168,124,.10)", border:"1px solid rgba(232,168,124,.18)", borderRadius:12, padding:"10px 12px", cursor:"pointer", display:"flex", gap:9, alignItems:"flex-start", marginBottom:6 }}>
                <div style={S.cardIconBox(fCat)}><Icon name={fCat.icon} size={15} color={fCat.color} /></div>
                <div style={UI.flexMin}>
                  <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>{f.title}</div>
                  <div style={S.cardSummary}>{f.summary}</div>
                </div>
              </div>
            );
          })}
          <button onClick={() => handleCatSelect("fun_fact")}
            style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"none", padding:"4px 2px", marginTop:2, cursor:"pointer", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink2)" }}>
            Se alle →
          </button>
        </div>
      )}

      {/* Safe-area-bevidst bundplads, se samme note på detaljesiden. */}
      <div style={{ height:"calc(20px + env(safe-area-inset-bottom))" }} />
      {showList && <ScrollToTop />}
    </div>
  );
}
