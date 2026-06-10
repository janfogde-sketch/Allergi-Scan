// @ts-nocheck
import React from "react";
import { ALLERGENS, SCREENS, E_NUMBERS, DIETS } from "./constants.jsx";
import { compareENumbers, checkDietCompatibility, verifiedBadge } from "./helpers.js";
import { Icon, IngredientsList } from "./SharedComponents.jsx";

const S = {
  flex1:    { flex:1 },
  mb10:     { marginBottom:10 },
  h13b:     { fontSize:13, fontWeight:700, color:"var(--ink)" },
  sub11:    { fontSize:11, color:"var(--muted)" },
  opacity6: { opacity:.6 },
};

export default function ResultScreen({
  scanResult,
  user,
  family,
  allergens,
  activeProfiles,
  activeENumbers,
  selectedENumbers,
  isFavorite,
  toggleFavorite,
  addToList,
  setScreen,
  setKnowledgeSlug,
  setEditStep,
  setEditIngText,
  setEditNote,
  setEditType,
}) {
  if (!scanResult) return null;

  return (
    <div className="screen fade-in">

      {/* ── 1. PRODUKT ── */}
      {(() => {
        const vb = verifiedBadge(scanResult.verified_status, scanResult.source);
        return (
          <div className="product-hero">
            {scanResult.image_url
              ? <img loading="lazy" src={scanResult.image_url} alt={scanResult.name} className="product-hero-img"
                  onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
              : null}
            <div className="product-hero-img-placeholder"
              style={{ display: scanResult.image_url ? "none" : "flex", flexDirection:"column", gap:8, background:"var(--paper2)", borderRadius:12, padding:20, margin:"0 0 10px" }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--border2)" strokeWidth="1.5">
                <rect x="4" y="10" width="40" height="30" rx="3"/>
                <circle cx="16" cy="20" r="4"/>
                <path strokeLinecap="round" d="M4 34l10-8 8 6 6-4 16 12"/>
              </svg>
              <div style={{ fontSize:11, color:"var(--muted)", fontWeight:500 }}>Ingen produktbillede</div>
            </div>
            <div className="product-hero-body">
              <div className="product-hero-name">{scanResult.name}</div>
              {scanResult.brand && <div className="product-hero-brand">{scanResult.brand}</div>}
              <div className="product-hero-meta">
                <span style={{ fontSize:10, color:"var(--muted)", fontWeight:500 }}>EAN: {scanResult.code}</span>
                <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, padding:"2px 9px", borderRadius:20, background:vb.bg, color:vb.color, border:`1px solid ${vb.dot}22` }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:vb.dot, flexShrink:0, display:"inline-block" }} />
                  {vb.label}
                </span>
                {scanResult.verified_status === "pending" && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 9px", borderRadius:20, background:"var(--amber-lt)", border:"1px solid rgba(251,191,36,.3)", fontSize:10, fontWeight:700, color:"var(--amber)" }}>
                    ⏳ Afventer godkendelse
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 2. SIKKERHED + DIÆT ── */}
      {(() => {
        const flags = scanResult.allergen_flags || {};
        const profiles = [
          { id:"me", name: user.name||"Dig", allergens, diets: user.diets || [], eNumbers: selectedENumbers || [] },
          ...family.filter(m => activeProfiles.includes(m.id)).map(m => ({
            ...m, allergens: m.allergens || [], diets: m.diets || [], eNumbers: m.eNumbers || [],
          })),
        ];
        const tagLabels = { vegan:"Vegansk", vegetarian:"Vegetarisk", "palm-oil-free":"Uden palmeolie", "gluten-free":"Glutenfri", organic:"Økologisk" };
        const hasTags = scanResult.tags && scanResult.tags.length > 0;

        return (
          <div style={S.mb10}>
            {/* Profil-sikkerhed: 2 kolonner */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom: hasTags ? 8 : 0 }}>
              {profiles.map((p) => {
                const danger  = p.allergens.filter(a => flags[a] === "yes");
                const warning = p.allergens.filter(a => flags[a] === "traces");
                const dietResults = (p.diets || []).map(d => ({
                  id: d,
                  ...checkDietCompatibility(d, flags, scanResult.ingredients, scanResult.nutrition),
                }));
                const dietFails = dietResults.filter(r => r.ok === false);
                const dietMatch = p.diets && p.diets.length > 0 ? dietFails.length === 0 : null;
                const statusText = danger.length > 0
                  ? danger.map(id => ALLERGENS.find(a=>a.id===id)?.label).filter(Boolean).join(", ")
                  : warning.length > 0
                  ? "Spor: " + warning.map(id => ALLERGENS.find(a=>a.id===id)?.label).filter(Boolean).join(", ")
                  : dietMatch === false ? dietFails[0]?.reasons?.[0] || "Passer ikke til diæt"
                  : "Sikkert";
                const finalColor  = danger.length > 0 ? "var(--red)"   : warning.length > 0 ? "var(--amber)"   : dietMatch === false ? "var(--amber)"   : "var(--green)";
                const finalBg     = danger.length > 0 ? "var(--red-lt)": warning.length > 0 ? "var(--amber-lt)": dietMatch === false ? "var(--amber-lt)": "var(--green-lt)";
                const finalBorder = danger.length > 0 ? "var(--red-md)": warning.length > 0 ? "var(--amber-md)": dietMatch === false ? "var(--amber-md)": "var(--green-mid)";
                const finalIcon   = danger.length > 0 ? "×"            : warning.length > 0 ? "!"              : dietMatch === false ? "!"              : "✓";
                return (
                  <div key={p.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", background:finalBg, border:`1px solid ${finalBorder}`, borderRadius:8, gap:6 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
                      {p.id==="me" ? "Dig" : p.name}
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color:finalColor, flexShrink:0, cursor: danger.length > 0 || warning.length > 0 ? "pointer" : "default" }}
                      onClick={() => {
                        const first = [...danger, ...warning][0];
                        if (first) { setKnowledgeSlug(first); setScreen(SCREENS.KNOWLEDGE); }
                      }}>
                      {finalIcon} {statusText}{(danger.length > 0 || warning.length > 0) ? " ›" : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* E-nummer advarsler */}
            {scanResult.productENumbers?.length > 0 && activeENumbers?.length > 0 && (() => {
              const { matched } = compareENumbers(scanResult.productENumbers, activeENumbers);
              if (!matched.length) return null;
              return (
                <div style={{ padding:"8px 12px", marginBottom:6, background:"var(--amber-lt)", border:"1px solid var(--amber-md)", borderRadius:10 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"var(--amber)", marginBottom:4 }}>⚠️ E-numre fundet som du overvåger</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {matched.map(e => (
                      <span key={e}
                        onClick={() => { const slug = "e-" + e.toLowerCase().replace("e",""); setKnowledgeSlug(slug); setScreen(SCREENS.KNOWLEDGE); }}
                        style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:6, background:"rgba(255,180,0,.15)", color:"var(--amber)", border:"1px solid var(--amber-md)", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4 }}>
                        {e} {E_NUMBERS[e] ? "— " + E_NUMBERS[e].split("—")[0].trim() : ""} <span style={{ fontSize:9, opacity:.6 }}>›</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Diæt-detaljer */}
            {(() => {
              const allDiets = new Set();
              profiles.forEach(p => (p.diets || []).forEach(d => allDiets.add(d)));
              if (allDiets.size === 0) return null;
              const results = [...allDiets].map(d => ({
                id: d,
                label: DIETS.find(x => x.id === d)?.label || d,
                ...checkDietCompatibility(d, scanResult.allergen_flags, scanResult.ingredients, scanResult.nutrition),
              }));
              const fails    = results.filter(r => r.ok === false);
              const unknowns = results.filter(r => r.ok === null);
              const passes   = results.filter(r => r.ok === true);
              if (!fails.length && !unknowns.length && !passes.length) return null;
              return (
                <div style={{ padding:"10px 12px", marginBottom:6, background: fails.length > 0 ? "var(--amber-lt)" : "var(--green-lt)", border:`1px solid ${fails.length > 0 ? "var(--amber-md)" : "var(--green-mid)"}`, borderRadius:10 }}>
                  <div style={{ fontSize:11, fontWeight:800, color: fails.length > 0 ? "var(--amber)" : "var(--green)", marginBottom:6 }}>
                    {fails.length > 0 ? "⚠️ Diæt-advarsler" : "✅ Kompatibel med dine diæter"}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {fails.map(r => (
                      <div key={r.id} style={{ fontSize:11, color:"var(--amber)" }}>
                        <strong>{r.label}:</strong> {r.reasons[0]}
                        {r.confidence === "low" && <span style={S.opacity6}> (usikker)</span>}
                      </div>
                    ))}
                    {passes.map(r => (
                      <div key={r.id} style={{ fontSize:11, color:"var(--green)" }}>
                        ✓ {r.label}{r.confidence === "low" && <span style={S.opacity6}> (usikker)</span>}
                      </div>
                    ))}
                    {unknowns.map(r => (
                      <div key={r.id} style={S.sub11}>? {r.label}: {r.reasons[0]}</div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Diæt-tags */}
            {hasTags && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", padding:"8px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderTop:"none", borderRadius:"0 0 12px 12px" }}>
                {scanResult.tags.map((tag, i) => (
                  <span key={i} style={{ fontSize:11, fontWeight:700, color:"var(--green)", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:100, padding:"2px 9px" }}>
                    {tagLabels[tag] || tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── 3. ALLERGENER ── */}
      {scanResult.allergen_flags && (() => {
        const flags = scanResult.allergen_flags;
        const present = Object.entries(flags).filter(([k,v]) => v==="yes"    && ALLERGENS.find(a=>a.id===k));
        const traces  = Object.entries(flags).filter(([k,v]) => v==="traces" && ALLERGENS.find(a=>a.id===k));
        const myAllergens  = new Set([...scanResult.matchedDanger||[], ...scanResult.matchedWarning||[]]);
        const otherPresent = present.filter(([k]) => !myAllergens.has(k));
        const otherTraces  = traces.filter(([k])  => !myAllergens.has(k));
        if (!otherPresent.length && !otherTraces.length) return null;
        return (
          <div className="card">
            <div className="card-lbl">Andre allergener i produktet</div>
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8 }}>Ikke registreret på dine profiler</div>
            {otherPresent.length > 0 && (
              <div className="tags" style={{ marginBottom:6 }}>
                {otherPresent.map(([k]) => {
                  const a = ALLERGENS.find(x=>x.id===k);
                  return a ? (
                    <div key={k} className="tag"
                      onClick={() => { setScreen(SCREENS.KNOWLEDGE); setKnowledgeSlug(k); }}
                      style={{ background:"var(--surface2)", color:"var(--ink)", borderColor:"var(--border2)", cursor:"pointer" }}>
                      {a.emoji} {a.label} <span style={{ fontSize:9, opacity:.6 }}>›</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
            {otherTraces.length > 0 && (
              <div className="tags">
                {otherTraces.map(([k]) => {
                  const a = ALLERGENS.find(x=>x.id===k);
                  return a ? (
                    <div key={k} className="tag"
                      onClick={() => { setScreen(SCREENS.KNOWLEDGE); setKnowledgeSlug(k); }}
                      style={{ background:"var(--surface)", color:"var(--muted)", borderColor:"var(--border2)", cursor:"pointer" }}>
                      spor: {a.emoji} {a.label} <span style={{ fontSize:9, opacity:.6 }}>›</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── 4. INGREDIENSLISTE ── */}
      <div className="card">
        <div className="card-lbl">Ingrediensliste</div>
        {scanResult.ingredients ? (
          <div>
            <div style={{ padding:"10px", background:"var(--paper2)", borderRadius:8, marginBottom:8 }}>
              <IngredientsList text={scanResult.ingredients} allergenFlags={scanResult.allergen_flags||{}} />
            </div>
            <div style={{ fontSize:10, color:"var(--muted)", padding:"6px 8px", background:"var(--paper2)", borderRadius:6, lineHeight:1.4 }}>
              Fremhævet = allergen · Listen kan være på originalsprog — tjek altid selv
            </div>
          </div>
        ) : (
          <div style={{ paddingTop:4 }}>
            <div style={{ fontSize:13, color:"var(--muted2)", marginBottom:8 }}>Vi mangler ingredienslisten for dette produkt.</div>
            <button className="btn btn-outline btn-sm"
              onClick={() => { setEditStep("start"); setEditIngText(scanResult?.ingredients||""); setEditNote(""); setEditType(null); setScreen(SCREENS.SUGGEST_EDIT); }}>
              Hjælp os — indsend ingrediensliste
            </button>
          </div>
        )}
      </div>

      {/* ── 5. HANDLINGER ── */}
      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
        <button className="btn btn-sm"
          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, background: isFavorite(scanResult.code) ? "var(--amber-lt)" : "var(--paper2)", color: isFavorite(scanResult.code) ? "var(--amber)" : "var(--ink2)", border:"1px solid var(--border)" }}
          onClick={() => toggleFavorite(scanResult)}>
          <Icon name="heart" size={15} color={isFavorite(scanResult.code) ? "var(--amber)" : "var(--muted)"} />
          {isFavorite(scanResult.code) ? "Fjern favorit" : "Favorit"}
        </button>
        <button className="btn btn-ghost btn-sm" style={S.flex1}
          onClick={() => { if(navigator.share) navigator.share({ title:scanResult.name, text:scanResult.headline }); }}>
          <Icon name="share" size={15} color="var(--muted)" /> Del
        </button>
        <button className="btn btn-outline btn-sm" style={S.flex1}
          onClick={() => { setEditStep("start"); setEditIngText(scanResult?.ingredients||""); setEditNote(""); setEditType(null); setScreen(SCREENS.SUGGEST_EDIT); }}>
          Ret data
        </button>
      </div>

      {/* ── 6. NÆRINGSINDHOLD ── */}
      {!scanResult.nutrition && (
        <div className="card">
          <div className="ing-toggle" style={{ cursor:"default" }}>
            <span>Næringsindhold pr. 100g</span>
          </div>
          <div style={{ padding:"12px 0", display:"flex", alignItems:"center", gap:10 }}>
            <div style={S.flex1}>
              <div style={{ fontSize:13, color:"var(--muted2)", marginBottom:6 }}>Vi mangler næringsdata for dette produkt.</div>
              <button className="btn btn-outline btn-sm"
                onClick={() => { setEditStep("start"); setEditIngText(scanResult?.ingredients||""); setEditNote(""); setEditType(null); setScreen(SCREENS.SUGGEST_EDIT); }}>
                Hjælp os — indsend næringsdata
              </button>
            </div>
          </div>
        </div>
      )}
      {scanResult.nutrition && (() => {
        const n = scanResult.nutrition;
        const rows = [
          ["Energi",          n.energy_kcal    ? `${n.energy_kcal} kcal`    : null],
          ["Fedt",            n.fat     != null ? `${n.fat} g`               : null],
          ["— heraf mættet",  n.saturated_fat != null ? `${n.saturated_fat} g` : null],
          ["Kulhydrat",       n.carbohydrates != null ? `${n.carbohydrates} g` : null],
          ["— heraf sukker",  n.sugars  != null ? `${n.sugars} g`            : null],
          ["Kostfibre",       n.fiber   != null ? `${n.fiber} g`             : null],
          ["Protein",         n.protein != null ? `${n.protein} g`           : null],
          ["Salt",            n.salt    != null ? `${n.salt} g`              : null],
        ].filter(([,v]) => v !== null);
        if (!rows.length) return null;
        return (
          <div className="card">
            <div className="card-lbl">Næringsindhold pr. 100g</div>
            <div style={{ display:"flex", flexDirection:"column" }}>
              {rows.map(([label, value], i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom: i < rows.length-1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ fontSize:13, color: label.startsWith("—") ? "var(--muted)" : "var(--ink2)", paddingLeft: label.startsWith("—") ? 12 : 0 }}>{label}</span>
                  <span style={S.h13b}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
