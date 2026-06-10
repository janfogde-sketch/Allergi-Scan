// @ts-nocheck
import React, { useState, useMemo } from "react";
import { ALLERGENS, SCREENS } from "./constants.jsx";
import { compareAllergens, initials } from "./helpers.js";
import { ProductImage } from "./SharedComponents.jsx";
import { CategorySelect } from "./MemberForm.jsx";

const S = {
  flexMin: { flex:1, minWidth:0 },
  h13b:    { fontSize:13, fontWeight:700, color:"var(--ink)" },
  sub11:   { fontSize:11, color:"var(--muted)" },
};

const CATEGORIES = [
  {id:"alle",           label:"Alle kategorier"},
  {id:"Drikkevarer",    label:"Drikkevarer"},
  {id:"Kolonial",       label:"Kolonial"},
  {id:"Snacks & slik",  label:"Snacks & slik"},
  {id:"Mejeri & æg",    label:"Mejeri & æg"},
  {id:"Frugt & grønt",  label:"Frugt & grønt"},
  {id:"Frost",          label:"Frost"},
  {id:"Brød & bagværk", label:"Brød & bagværk"},
  {id:"Kød & fisk",     label:"Kød & fisk"},
  {id:"Færdigretter",   label:"Færdigretter"},
];

export default function SearchScreen({
  user,
  family,
  allergens,
  activeProfiles, setActiveProfiles,
  activeIds,
  searchQuery, setSearchQuery,
  searchResults, setSearchResults,
  searchCategory, setSearchCategory,
  searchLoading,
  showSafeOnly, setShowSafeOnly,
  addToList,
  lookupProduct,
}) {
  const [allergenFilterOpen, setAllergenFilterOpen] = useState(false);
  const [manualAllergens, setManualAllergens]       = useState([]);

  // Profiler med allergen-info
  const profiles = useMemo(() => [
    { id:"user", name: user.name||"Mig", allergens },
    ...family.map(m => ({
      id: m.id, name: m.name,
      allergens: Array.isArray(m.allergens)
        ? m.allergens
        : Object.keys(m.allergens||{}).filter(k=>m.allergens[k]),
    })),
  ], [user, family, allergens]);

  const activeProfileObjs = profiles.filter(p => activeProfiles.includes(p.id));

  // Alle aktive allergen-IDs: fra aktive profiler + manuelle
  const effectiveIds = useMemo(() => [...new Set([...activeIds, ...manualAllergens])], [activeIds, manualAllergens]);

  // Filtrerede søgeresultater
  const visibleResults = useMemo(() => searchResults.filter(p => {
    if (searchCategory !== "alle" && p.category !== searchCategory) return false;
    if (effectiveIds.length > 0) {
      const { status } = compareAllergens(p.allergen_flags||{}, effectiveIds);
      if (status !== "safe") return false;
    } else if (showSafeOnly) {
      const { status } = compareAllergens(p.allergen_flags||{}, effectiveIds);
      if (status !== "safe") return false;
    }
    return true;
  }), [searchResults, searchCategory, effectiveIds, showSafeOnly]);

  return (
    <div className="screen fade-in" style={{ paddingBottom:120 }}>
      <div className="screen-title">Søg varer</div>

      {/* ── Søgefelt ── */}
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <input
          className="field"
          placeholder="Søg på produkt eller mærke…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") setSearchResults([]); }}
          style={{ flex:1, marginBottom:0 }}
          autoFocus
        />
        <button className="btn btn-primary btn-sm"
          style={{ whiteSpace:"nowrap", padding:"0 16px" }}
          onClick={() => setSearchResults([])}
          disabled={!searchQuery.trim()}>
          Søg
        </button>
      </div>

      {/* ── Profil-filter ── */}
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"12px 14px", marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>
          Filtrér efter profil
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {profiles.map(p => {
            const isActive = activeProfiles.includes(p.id);
            const allergenLabels = p.allergens.map(id => ALLERGENS.find(a=>a.id===id)).filter(Boolean);
            return (
              <div key={p.id} style={{ cursor:"pointer" }}
                onClick={() => setActiveProfiles(prev =>
                  prev.includes(p.id) ? prev.filter(x=>x!==p.id) : [...prev, p.id]
                )}>
                <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px 6px 6px", borderRadius:100, border:`1.5px solid ${isActive ? "var(--green)" : "var(--border)"}`, background: isActive ? "var(--green-lt)" : "var(--paper2)", transition:"all .15s" }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", background: isActive ? "var(--green)" : "var(--muted)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:"#fff", flexShrink:0 }}>
                    {initials(p.name)}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color: isActive ? "var(--green)" : "var(--ink)" }}>
                      {p.name?.split(" ")[0] || "Mig"}
                    </div>
                    {p.allergens.length > 0 ? (
                      <div style={{ fontSize:10, color: isActive ? "var(--green)" : "var(--muted)", marginTop:1 }}>
                        {allergenLabels.slice(0,3).map(a=>a.emoji).join("")}
                        {allergenLabels.length > 3 ? ` +${allergenLabels.length-3}` : ""}
                        {" "}{p.allergens.length} allergen{p.allergens.length!==1?"er":""}
                      </div>
                    ) : (
                      <div style={{ fontSize:10, color:"var(--muted)" }}>Ingen allergener</div>
                    )}
                  </div>
                  {isActive && (
                    <div style={{ width:14, height:14, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Aktive allergener forklaret */}
        {activeProfileObjs.length > 0 && effectiveIds.length > 0 && (
          <div style={{ marginTop:10, padding:"8px 10px", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--red)", marginBottom:4 }}>
              Filtrerer på {effectiveIds.length} allergen{effectiveIds.length!==1?"er":""}
              {" · "}{activeProfileObjs.map(p=>p.name?.split(" ")[0]).join(", ")}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {effectiveIds.map(id => {
                const a = ALLERGENS.find(x=>x.id===id);
                const fromManual = manualAllergens.includes(id);
                return a ? (
                  <span key={id} style={{ fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:100, background: fromManual ? "var(--amber-lt)" : "var(--red-lt)", color: fromManual ? "var(--amber)" : "var(--red)", border:`1px solid ${fromManual ? "var(--amber-md)" : "var(--red-md)"}` }}>
                    {a.emoji} {a.label}{fromManual ? " ✎" : ""}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
        {activeProfiles.length === 0 && (
          <div style={{ marginTop:8, fontSize:11, color:"var(--muted)" }}>
            Ingen profil valgt — viser alle produkter
          </div>
        )}
      </div>

      {/* ── Manuel allergen-filter ── */}
      <div style={{ marginBottom:10 }}>
        <div onClick={() => setAllergenFilterOpen(v=>!v)}
          style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius: allergenFilterOpen ? "12px 12px 0 0" : 12, cursor:"pointer" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>Tilføj allergener manuelt</span>
            {manualAllergens.length > 0 && (
              <div style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:100, background:"var(--amber-lt)", color:"var(--amber)", border:"1px solid var(--amber-md)" }}>
                {manualAllergens.length} valgt
              </div>
            )}
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"
            style={{ transform: allergenFilterOpen ? "rotate(180deg)" : "none", transition:"transform .2s" }}>
            <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
        {allergenFilterOpen && (
          <div style={{ border:"1px solid var(--border)", borderTop:"none", borderRadius:"0 0 12px 12px", background:"var(--surface)", padding:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              {ALLERGENS.map(a => {
                const on      = manualAllergens.includes(a.id);
                const inActive = activeIds.includes(a.id);
                return (
                  <div key={a.id}
                    onClick={() => !inActive && setManualAllergens(prev =>
                      prev.includes(a.id) ? prev.filter(x=>x!==a.id) : [...prev, a.id]
                    )}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:10, cursor: inActive ? "default" : "pointer", border:`1.5px solid ${on||inActive ? "var(--red)" : "var(--border)"}`, background: inActive ? "var(--red-lt)" : on ? "var(--red-lt)" : "var(--paper2)", opacity: inActive ? .6 : 1 }}>
                    <span style={{ fontSize:16 }}>{a.emoji}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color: on||inActive ? "var(--red)" : "var(--ink)" }}>
                        {a.label}
                      </div>
                      {inActive && <div style={{ fontSize:9, color:"var(--muted)" }}>Fra profil</div>}
                    </div>
                    {(on || inActive) && (
                      <div style={{ width:14, height:14, borderRadius:"50%", background:"var(--red)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {manualAllergens.length > 0 && (
              <button onClick={() => setManualAllergens([])}
                style={{ marginTop:10, fontSize:11, fontWeight:600, color:"var(--muted)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)" }}>
                Ryd manuelle filter ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Kategori + kun-sikre ── */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <CategorySelect value={searchCategory} onChange={setSearchCategory} options={CATEGORIES} />
        {effectiveIds.length === 0 && (
          <div className={`filter-chip${showSafeOnly?" active":""}`}
            onClick={() => setShowSafeOnly(v => !v)}
            style={{ whiteSpace:"nowrap" }}>
            {showSafeOnly ? "✓ Kun sikre" : "Kun sikre"}
          </div>
        )}
        <div style={{ fontSize:12, color:"var(--muted)", marginLeft:"auto" }}>
          {visibleResults.length} resultat{visibleResults.length!==1?"er":""}
        </div>
      </div>

      {/* ── Resultater ── */}
      {searchLoading && (
        <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Søger…</div></div>
      )}
      {!searchLoading && searchQuery && visibleResults.length === 0 && (
        <div className="empty-state">
          <div className="empty-txt">Ingen resultater</div>
          <div className="empty-sub">
            {showSafeOnly || effectiveIds.length > 0
              ? "Prøv at fjerne filtre eller søg efter noget andet"
              : "Prøv et andet søgeord"}
          </div>
        </div>
      )}
      {!searchQuery && (
        <div className="empty-state">
          <div className="empty-txt">Søg efter et produkt</div>
          <div className="empty-sub">Skriv et produktnavn eller mærke</div>
        </div>
      )}

      {visibleResults.map(p => {
        const { status, matchedDanger, matchedWarning } = compareAllergens(p.allergen_flags||{}, effectiveIds);
        const statusColor = status==="safe" ? "var(--green)" : status==="danger" ? "var(--red)" : "var(--amber)";
        const statusLabel = status==="safe" ? "✓ Sikker" : status==="danger" ? "✕ Farlig" : "⚠ Advarsel";
        const matchedLabels = [...matchedDanger, ...matchedWarning].map(id => ALLERGENS.find(a=>a.id===id)).filter(Boolean);
        const tagLabels = { vegan:"🌱 Vegansk", vegetarian:"🥦 Vegetarisk" };
        return (
          <div key={p.id}
            onClick={() => lookupProduct(p.ean||p.id)}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", marginBottom:8, background:"var(--surface)", border:`1px solid ${status==="danger" ? "var(--red-md)" : status==="warn" ? "var(--amber-md)" : "var(--border)"}`, borderRadius:12, cursor:"pointer" }}>
            <ProductImage product={p} size={44} />
            <div style={S.flexMin}>
              <div style={S.h13b}>{p.name}</div>
              <div style={S.sub11}>{p.brand}{p.category ? ` · ${p.category}` : ""}</div>
              {matchedLabels.length > 0 && (
                <div style={{ display:"flex", gap:3, marginTop:4, flexWrap:"wrap" }}>
                  {matchedLabels.map(a => (
                    <span key={a.id} style={{ fontSize:10, fontWeight:700, color: matchedDanger.includes(a.id) ? "var(--red)" : "var(--amber)", background: matchedDanger.includes(a.id) ? "var(--red-lt)" : "var(--amber-lt)", border:`1px solid ${matchedDanger.includes(a.id) ? "var(--red-md)" : "var(--amber-md)"}`, borderRadius:100, padding:"1px 6px" }}>
                      {a.emoji} {a.label}
                    </span>
                  ))}
                </div>
              )}
              {p.tags?.length > 0 && (
                <div style={{ display:"flex", gap:3, marginTop:3, flexWrap:"wrap" }}>
                  {p.tags.map((t,i) => (
                    <span key={i} style={{ fontSize:10, fontWeight:700, color:"var(--green)", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:100, padding:"1px 7px" }}>
                      {tagLabels[t]||t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
              <div style={{ fontSize:11, fontWeight:700, color:statusColor }}>{statusLabel}</div>
              <button className="btn btn-ghost btn-sm" style={{ fontSize:11, padding:"3px 8px" }}
                onClick={e => { e.stopPropagation(); addToList(p.name); }}>+ Liste</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
