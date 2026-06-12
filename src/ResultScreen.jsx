// @ts-nocheck
import React from "react";
import { ALLERGENS, SCREENS, E_NUMBERS, DIETS, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { compareENumbers, checkDietCompatibility, verifiedBadge, makeHeaders } from "./helpers.js";
import { Icon, IngredientsList, ProductImage } from "./SharedComponents.jsx";

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
  alternatives,
  altLoading,
  lookupProduct,
}) {
  if (!scanResult) return null;

  // ── Småbørn-advarsler (under 3 år) ──────────────────────────────────────────
  const currentYear = new Date().getFullYear();

  const INFANT_WARNINGS = [
    {
      id: "honey",
      label: "Honning",
      keywords: ["honning", "honey", "miel", "mel"],
      reason: "Honning frarådes til børn under 1 år pga. risiko for botulisme. Vær forsigtig under 3 år.",
    },
    {
      id: "salt",
      label: "Højt saltindhold",
      check: (n) => n?.salt != null && parseFloat(n.salt) > 1.5,
      reason: "Produktet indeholder over 1,5g salt per 100g. Høj saltindhold er ikke anbefalet til småbørn.",
    },
    {
      id: "additives",
      label: "E-numre der frarådes til småbørn",
      eNumbers: ["E102","E104","E110","E122","E123","E124","E129","E131","E132","E133","E142","E151","E154","E155","E211","E621"],
      reason: "Produktet indeholder farvestoffer eller tilsætningsstoffer der frarådes til børn under 3 år.",
    },
  ];

  const getInfantWarnings = (product) => {
    const warnings = [];
    const ingredients = (product.ingredients_text || product.ingredients || "").toLowerCase();
    const nutrition = product.nutrition;
    const eNums = product.productENumbers || [];

    for (const w of INFANT_WARNINGS) {
      if (w.keywords && w.keywords.some(k => ingredients.includes(k))) {
        warnings.push(w);
      } else if (w.check && w.check(nutrition)) {
        warnings.push(w);
      } else if (w.eNumbers && w.eNumbers.some(e => eNums.includes(e))) {
        warnings.push(w);
      }
    }
    return warnings;
  };

  // Find aktive profiler der er børn under 3
  const infantProfiles = [
    ...(family || []).filter(m =>
      activeProfiles.includes(m.id) &&
      m.birth_year &&
      (currentYear - m.birth_year) < 3
    )
  ];
  const infantWarnings = infantProfiles.length > 0 ? getInfantWarnings(scanResult) : [];

  // Tryk på ingrediens → søg i knowledge_base → åbn leksikon
  const handleIngredientTap = async (ingredientText) => {
    if (!ingredientText?.trim()) return;
    const q = ingredientText.trim().toLowerCase().slice(0, 50);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/knowledge_base?or=(title.ilike.*${encodeURIComponent(q)}*,aliases.cs.{${encodeURIComponent(q)}})`
        + `&select=slug&limit=1`,
        { headers: { apikey: SUPABASE_ANON_KEY } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.slug) {
        setKnowledgeSlug(data[0].slug);
        setScreen(SCREENS.KNOWLEDGE);
        return;
      }
    } catch {}
    // Ingen direkte match — åbn leksikon med søgeterm
    setKnowledgeSlug(q);
    setScreen(SCREENS.KNOWLEDGE);
  };

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

      {/* ── 1b. SIKRE ALTERNATIVER ── */}
      {(scanResult.status === "danger" || scanResult.status === "warn") && (
        <div style={{ marginBottom:10 }}>
          {altLoading && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12 }}>
              <div style={{ width:16, height:16, border:"2px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .7s linear infinite", flexShrink:0 }} />
              <div style={{ fontSize:13, color:"var(--muted)" }}>Finder sikre alternativer…</div>
            </div>
          )}
          {!altLoading && alternatives.length > 0 && (
            <div style={{ background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:14, padding:"14px 16px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <div style={{ fontSize:18 }}>✅</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:"var(--green)" }}>Prøv disse i stedet</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>Sikre for din profil · samme kategori</div>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {alternatives.map(p => (
                  <div key={p.ean} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, cursor:"pointer" }}
                    onClick={() => lookupProduct?.(p.ean)}>
                    <ProductImage product={p} size={40} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                      <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{p.brand}</div>
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--green)", flexShrink:0 }}>✓ Sikkert</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!altLoading && alternatives.length === 0 && (scanResult.status === "danger" || scanResult.status === "warn") && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12 }}>
              <div style={{ fontSize:16 }}>🔍</div>
              <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5 }}>
                Ingen kendte alternativer i samme kategori endnu.{" "}
                <span style={{ color:"var(--green)", fontWeight:700, cursor:"pointer" }}
                  onClick={() => {}}>
                  Hjælp os ved at scanne alternativer.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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

            {/* ── Småbørn-advarsler ── */}
            {infantWarnings.length > 0 && (
              <div style={{ padding:"10px 12px", marginBottom:6, background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:10 }}>
                <div style={{ fontSize:11, fontWeight:800, color:"#c2410c", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
                  <span>🍼</span>
                  Advarsel for småbørn — {infantProfiles.map(m => m.name?.split(" ")[0]).join(", ")} (under 3 år)
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {infantWarnings.map(w => (
                    <div key={w.id} style={{ fontSize:11, color:"#7c2d12", lineHeight:1.5 }}>
                      <strong>{w.label}:</strong> {w.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              <IngredientsList text={scanResult.ingredients} allergenFlags={scanResult.allergen_flags||{}} onIngredientTap={handleIngredientTap} />
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

      {/* ── 4b. E-NUMRE ── */}
      {scanResult.productENumbers?.length > 0 && (() => {
        const eNums = scanResult.productENumbers;
        return (
          <div className="card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div className="card-lbl" style={{ marginBottom:0 }}>E-numre i produktet</div>
              <div style={{ fontSize:10, color:"var(--muted)" }}>{eNums.length} fundet</div>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {eNums.map(e => {
                const info = E_NUMBERS[e];
                const name = info ? info.split("—")[0].trim() : null;
                const isWatched = activeENumbers?.includes(e);
                return (
                  <span key={e}
                    onClick={() => {
                      const slug = "e-" + e.toLowerCase().replace(/^e/, "");
                      setKnowledgeSlug(slug);
                      setScreen(SCREENS.KNOWLEDGE);
                    }}
                    style={{
                      display:"inline-flex", alignItems:"center", gap:4,
                      fontSize:11, fontWeight:700, padding:"4px 9px", borderRadius:8,
                      cursor:"pointer", transition:"all .1s",
                      background: isWatched ? "var(--amber-lt)" : "var(--paper2)",
                      color: isWatched ? "var(--amber)" : "var(--ink2)",
                      border: `1px solid ${isWatched ? "var(--amber-md)" : "var(--border2)"}`,
                    }}>
                    <span style={{ fontFamily:"monospace" }}>{e}</span>
                    {name && <span style={{ fontWeight:400, color: isWatched ? "var(--amber)" : "var(--muted)" }}>— {name.slice(0,20)}{name.length>20?"…":""}</span>}
                    {isWatched && <span style={{ fontSize:9 }}>⚠️</span>}
                    <span style={{ fontSize:9, opacity:.5 }}>›</span>
                  </span>
                );
              })}
            </div>
            <div style={{ fontSize:10, color:"var(--muted)", marginTop:8 }}>
              Tryk på et E-nummer for at læse mere i leksikonet
            </div>
          </div>
        );
      })()}

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
