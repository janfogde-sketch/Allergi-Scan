// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCREENS, ALLERGENS } from "./constants.jsx";
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
// Faglig struktur (30. sept. 2026): "Ingredienser" indeholder kun det, der kan
// stå i en ingrediensliste (råvarer, forarbejdede ingredienser, krydderier,
// saucer brugt som ingrediens). Færdige retter, bagværk, slik, drikkevarer og
// færdigprodukter ligger i "dish" — ikke en flise i griddet, men de kan stadig
// findes via søgning og relaterede opslag.
const DISH_CATEGORY = { id:"dish", icon:"tag", label:"Retter og produkter", color:"var(--neutral)", bg:"rgba(148,163,184,.10)" };
const CAT_MAP = Object.fromEntries([...CATEGORIES, FAQ_CATEGORY, DISH_CATEGORY].map(c => [c.id, c]));

// Risikoniveauer ("Høj risiko"/"Moderat"/"Lav risiko") er fjernet 30. sept.
// 2026: de kunne læses som en universel medicinsk vurdering, men hvor alvorlig
// en reaktion er, afhænger af personen. I stedet viser et opslag en neutral
// "faglig status" (knowledge_base.status_label), fx "Fødevareallergi",
// "Cøliaki og hvedeallergi" eller "Intolerance – ikke allergi", så allergi,
// intolerance og andre reaktionstyper ikke blandes sammen.
const ALLERGEN_LABEL = Object.fromEntries(ALLERGENS.map(a => [a.id, a.label]));

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
  // Finpudset 30. sept. 2026: kompaktere fliser/søgefelt og ens 16px
  // mellem alle sektioner (søg → kategorier → hjælp → udvalgte fakta).
  grid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 },
  catBtn: { display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", fontFamily:"var(--f)", textAlign:"left" },
  catBtnActive: (c) => ({ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:c.bg, border:`1px solid ${c.color}33`, borderRadius:12, cursor:"pointer", fontFamily:"var(--f)", textAlign:"left" }),
  catIconBox: (c) => ({ width:32, height:32, borderRadius:10, background:c.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }),
  catLabel: { fontSize:12, fontWeight:700, color:"var(--ink)" },
  catLabelActive: (c) => ({ fontSize:12, fontWeight:700, color:c.color }),
  catCount: { fontSize:10, color:"var(--muted)", marginTop:1 },
  searchWrap: { position:"relative", marginBottom:16 },
  searchInput: { width:"100%", padding:"10px 14px 10px 40px", border:"1px solid var(--border2)", borderRadius:12, background:"var(--surface)", fontFamily:"var(--f)", fontSize:14, color:"var(--ink)", outline:"none", boxSizing:"border-box" },
  searchIcon: { position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" },
  // Kompakte resultatkort (26. sept. 2026, opfølgning: "gør resultatkortene
  // mere kompakte") — reduceret padding/gap/ikonstørrelse ift. den første
  // redesign-runde. cardSummary er nu clamped til 2 linjer med ellipsis —
  // fuld forklaring hører kun hjemme på detaljesiden.
  // Ét fælles kort for alle opslag (30. sept. 2026): ikon · titel · kort
  // forklaring · evt. faglig status · chevron — samme padding, radius og
  // teksthierarki i alle kategorier, søgeresultater og relaterede opslag.
  card: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px", marginBottom:8, display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" },
  cardIconBox: (c) => ({ width:32, height:32, borderRadius:10, background:c.bg||"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }),
  cardTitle: { fontSize:14, fontWeight:700, color:"var(--ink)", lineHeight:1.3, marginBottom:2 },
  cardSummary: { fontSize:12, color:"var(--muted2)", lineHeight:1.45, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" },
  cardStatus: { display:"inline-block", marginTop:6, fontSize:11, fontWeight:600, color:"var(--ink2)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:100, padding:"2px 8px" },
  cardChevron: { alignSelf:"center", flexShrink:0, display:"flex" },
  // "Udvalgte fakta" på forsiden: lavere kort, lettere orange tone og
  // mørkere preview-tekst end de almindelige opslagskort.
  factCard: { padding:"10px 12px", alignItems:"center", background:"rgba(232,168,124,.07)", border:"1px solid rgba(232,168,124,.16)" },
  factSummary: { color:"var(--ink2)", lineHeight:1.4 },
  label: { fontSize:10.5, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".9px", marginBottom:8 },
  backBtn: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 10px", cursor:"pointer", display:"flex", alignItems:"center", lineHeight:0, flexShrink:0 },
  section: { marginBottom:16 },
  sectionLabel: { fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.4px", color:"var(--neutral)", marginBottom:8 },
  // pre-line: beskrivelser kan bestå af flere afsnit adskilt af tomme linjer
  // (fx Glutenholdige kornsorter: cøliaki / hvedeallergi / glutenfølsomhed).
  sectionText: { fontSize:13, color:"var(--ink2)", lineHeight:1.6, whiteSpace:"pre-line" },
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

// Fælles opslagskort — bruges af kategorilister, søgeresultater, krydsreaktioner
// på en detaljeside og "Vidste du at"-teaserne, så alle følger samme struktur.
function EntryCard({ entry, cat, onOpen, style, summaryStyle }) {
  return (
    <div role="button" tabIndex={0} className="kb-card" style={style ? { ...S.card, ...style } : S.card} onClick={onOpen}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}>
      <div style={S.cardIconBox(cat)}><Icon name={cat.icon||"book"} size={16} color={cat.color||"var(--ink2)"} /></div>
      <div style={UI.flexMin}>
        <div style={S.cardTitle}>{entry.title}</div>
        {entry.summary && <div style={summaryStyle ? { ...S.cardSummary, ...summaryStyle } : S.cardSummary}>{entry.summary}</div>}
        {entry.status_label && <div style={S.cardStatus}>{entry.status_label}</div>}
      </div>
      <div style={S.cardChevron}><Icon name="chevronRight" size={14} color="var(--muted)" /></div>
    </div>
  );
}

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
        const data = await doFetch(`${SUPABASE_URL}/rest/v1/knowledge_base?allergen_ids=ov.${encodeURIComponent(`{${allergenId}}`)}&category=not.in.(fun_fact,cross_reaction)&order=title.asc&limit=40`);
        // Forklarende opslag først, konkrete retter/produkter sidst.
        const rank = { allergen:0, faq:1, diet:2, ingredient:3, e_number:4, dish:5 };
        if (Array.isArray(data)) setRelatedEntries(data.filter(x => x.id !== selectedEntry.id)
          .sort((a,b) => (rank[a.category] ?? 9) - (rank[b.category] ?? 9)).slice(0,6));
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
      // Er en kategori valgt, søges der kun i den — ellers passer filterchippen
      // og resultatantallet ikke til listen.
      const catFilter = selectedCategory ? `&category=eq.${selectedCategory}` : "";
      const data = await doFetch(`${SUPABASE_URL}/rest/v1/knowledge_base?or=(title.ilike.${enc},summary.ilike.${enc})${catFilter}&order=category.asc,sort_order.asc&limit=50`);
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
    const desc = selectedEntry.description || "";
    const descIsLong = desc.length > DESC_CLAMP_THRESHOLD;
    return (
      <div className="screen fade-in knowledge-screen">
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
          {selectedEntry.status_label && (
            <span style={{ ...S.pill("var(--surface2)","var(--ink2)","var(--border)"), display:"inline-flex", alignItems:"center", gap:6 }}>
              <Icon name="info" size={11} color="var(--ink2)" /> {selectedEntry.status_label}
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
          <div style={S.section}><div style={S.sectionLabel}>Relevant ved</div><div style={S.pillRow}>{selectedEntry.allergen_ids.map(a => <span key={a} style={S.pill("var(--surface)","var(--ink2)","var(--border)")}>{ALLERGEN_LABEL[a]||a}</span>)}</div></div>
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
                <EntryCard key={x.id} entry={x} cat={xCat} onOpen={() => setSelectedEntry(x)} />
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

      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  const showList = searchQuery.length >= 2 || selectedCategory;
  const total = Object.values(counts).reduce((a,b) => a+b, 0);
  const selectedCat = selectedCategory ? CAT_MAP[selectedCategory] : null;

  return (
    <div className="screen fade-in knowledge-screen">
      <div className="screen-title" style={{ textAlign:"left", width:"auto" }}>Allergileksikon</div>
      <div className="screen-sub">{total} opslag</div>

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
          <div style={S.label}>Hjælp</div>
          <button style={{ ...S.catBtn, width:"100%", marginBottom:16 }}
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
        <div style={{ display:"flex", alignItems:"center", gap:10, minHeight:32, marginBottom:12 }}>
          {selectedCategory && (
            <button onClick={() => handleCatSelect(null)} aria-label={`Ryd kategori-filter: ${selectedCat?.label}`} style={{ display:"inline-flex", alignItems:"center", gap:6, height:32, padding:"0 12px", background:selectedCat?.bg, border:`1px solid ${selectedCat?.color}33`, borderRadius:100, cursor:"pointer", fontSize:12, fontWeight:700, color:selectedCat?.color, fontFamily:"var(--f)", lineHeight:1 }}>
              <Icon name={selectedCat?.icon} size={12} color={selectedCat?.color} /> {selectedCat?.label} <span aria-hidden="true" style={{ fontSize:14, marginLeft:2 }}>×</span>
            </button>
          )}
          {!loading && <div style={UI.ufs12_cmuted}>{entries.length} {entries.length === 1 ? "resultat" : "resultater"}</div>}
        </div>
      )}

      {/* Entry-liste */}
      {showList && (loading ? (
        <div className="fade-in">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton-card" style={{ display:"flex", gap:10, marginBottom:8 }}>
              <div className="skeleton-block" style={{ width:32, height:32, borderRadius:8, flexShrink:0 }} />
              <div style={UI.flex1}>
                <div className="skeleton-block skeleton-title" />
                <div className="skeleton-block skeleton-sub" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={<Icon name="search" size={26} color="var(--muted)" />} text="Ingen resultater" sub={searchQuery ? "Prøv et andet søgeord" : "Ingen opslag i denne kategori endnu"} />
      ) : (
        <div>{entries.map(entry => (
          <EntryCard key={entry.id} entry={entry} cat={CAT_MAP[entry.category] || {}} onOpen={() => setSelectedEntry(entry)} />
        ))}</div>
      ))}

      {/* Fun facts på forsiden — kompakte teaser-cards, maks. 3 stk. (26.
          sept. 2026, opfølgning: "skal fylde mindre visuelt, maks. 2-3
          kort, gør kortene en smule mere kompakte"), med en diskret "Se
          alle →" nederst der åbner hele fun_fact-kategorien. Leksikonet
          skal først og fremmest opleves som et opslagsværk, ikke et
          artikel-feed. */}
      {!showList && funFacts.length > 0 && (
        <div>
          <div style={{ ...S.label, display:"flex", alignItems:"center", gap:6 }}><Icon name="bulb" size={12} color="var(--muted)" /> Udvalgte fakta</div>
          {funFacts.slice(0,3).map(f => {
            const fCat = CAT_MAP[f.category] || CAT_MAP.fun_fact;
            return (
              <EntryCard key={f.id} entry={f} cat={fCat} onOpen={() => setSelectedEntry(f)}
                style={S.factCard} summaryStyle={S.factSummary} />
            );
          })}
          <button onClick={() => handleCatSelect("fun_fact")}
            style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"none", padding:"4px 2px", marginTop:2, cursor:"pointer", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink2)" }}>
            Se alle →
          </button>
        </div>
      )}

      {showList && <ScrollToTop />}
    </div>
  );
}
