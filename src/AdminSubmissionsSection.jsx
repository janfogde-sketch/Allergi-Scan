// @ts-nocheck
import React from "react";
import { ALLERGENS } from "./constants.jsx";
import { Loader, Icon, showToast } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";
import { ALL_ALLERGEN_WORDS } from "./allergenKeywords.js";

// Fremhæv allergener og E-numre i ingredienstekst
const E_NUMBER_RE = /\b(E\d{3,4}[a-z]?)\b/gi;
const isWordChar = c => /[a-zæøå0-9]/i.test(c);

// Ordgrænse-sikret indexOf for korte nøgleord (<=4 tegn) — ellers ville fx
// "til" (sesam på hindi) eller "ost" (mælk) matche inde i helt almindelige
// danske ord/sætninger. Længere ord matches som understreng, som hidtil.
function findWordSafe(haystack, needle) {
  if (needle.length > 4) return haystack.indexOf(needle);
  let from = 0;
  while (true) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) return -1;
    const before = idx > 0 ? haystack[idx - 1] : " ";
    const after = idx + needle.length < haystack.length ? haystack[idx + needle.length] : " ";
    if (!isWordChar(before) && !isWordChar(after)) return idx;
    from = idx + 1;
  }
}

function HighlightText({ text }) {
  if (!text) return null;
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Find earliest match: allergen word or E-number
    let earliestIdx = remaining.length;
    let matchLen = 0;
    let matchType = null; // "allergen" or "enumber"

    // Check E-numbers
    const eMatch = E_NUMBER_RE.exec(remaining);
    E_NUMBER_RE.lastIndex = 0;
    if (eMatch && eMatch.index < earliestIdx) {
      earliestIdx = eMatch.index;
      matchLen = eMatch[0].length;
      matchType = "enumber";
    }

    // Check allergen keywords (case-insensitive)
    const lower = remaining.toLowerCase();
    for (const word of ALL_ALLERGEN_WORDS) {
      const idx = findWordSafe(lower, word.toLowerCase());
      if (idx !== -1 && idx < earliestIdx) {
        earliestIdx = idx;
        matchLen = word.length;
        matchType = "allergen";
      }
    }

    if (matchType) {
      if (earliestIdx > 0) parts.push(<span key={key++}>{remaining.slice(0, earliestIdx)}</span>);
      const matched = remaining.slice(earliestIdx, earliestIdx + matchLen);
      const color = matchType === "allergen" ? "var(--red)" : "var(--amber)";
      const bg = matchType === "allergen" ? "var(--red-lt)" : "var(--amber-lt)";
      parts.push(<span key={key++} style={{ color, background:bg, fontWeight:700, borderRadius:3, padding:"0 3px" }}>{matched}</span>);
      remaining = remaining.slice(earliestIdx + matchLen);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }
  return <>{parts}</>;
}

// ── Indsendelses-liste (adminSection === "submissions") ──────────────────────
export default function AdminSubmissionsSection({
  submissions, submissionsLoading, submissionFilter, setSubmissionFilter, loadSubmissions,
  openSubmissionForReview,
}) {
  return (
    <div className="fade-in">
      <div style={{ display:"flex", gap:6, marginBottom:12 }}>
        {[
          { val:"pending",  label:"Afventer", icon:"clock", color:"var(--amber)" },
          { val:"approved", label:"Godkendt", icon:"check", color:"var(--green)" },
          { val:"rejected", label:"Afvist",   icon:"x",     color:"var(--red)" },
        ].map(({ val, label, icon, color }) => (
          <button key={val} onClick={() => { setSubmissionFilter(val); loadSubmissions(val); }}
            style={{ flex:1, padding:"10px 4px", borderRadius:10, border:`1px solid ${submissionFilter===val ? color : "var(--border)"}`,
              background: submissionFilter===val ? (val==="pending"?"var(--amber-lt)":val==="approved"?"var(--green-lt)":"var(--red-lt)") : "var(--surface)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              fontFamily:"var(--f)", fontSize:11, fontWeight:700,
              color: submissionFilter===val ? color : "var(--muted)", cursor:"pointer" }}>
            <Icon name={icon} size={12} color={submissionFilter===val ? color : "var(--muted)"} /> {label}
          </button>
        ))}
      </div>
      {submissionsLoading && <Loader text="Indlæser…" />}
      {!submissionsLoading && submissions.length === 0 && (
        <div style={UI.utacenter_p48px0}>
          <div style={{ ...UI.emoji48mb12, display:"flex", justifyContent:"center" }}>{submissionFilter==="pending" ? "🎉" : <Icon name="package" size={40} color="var(--muted)" />}</div>
          <div style={UI.ufs16_fw800_cink}>{submissionFilter==="pending" ? "Ingen afventer" : "Ingen indsendelser"}</div>
        </div>
      )}
      <div style={UI.colGap8}>
        {submissions.map(s => {
          const flags = s.ai_parsed_data || {};
          const dangerAllergens = ALLERGENS.filter(a => flags[a.id]==="yes" || flags[a.id]===true);
          const daysSince = Math.floor((Date.now() - new Date(s.created_at).getTime()) / 86400000);
          const isEdit = s.type === "edit";
          return (
            <div key={s.id} onClick={() => openSubmissionForReview(s)} className="admin-list-row"
              style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", boxShadow:"var(--sh)" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <div style={{ width:48, height:48, borderRadius:10, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon name={isEdit ? "edit" : "package"} size={22} color="var(--ink2)" /></div>
                <div style={UI.flexMin}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.ai_parsed_data?.name || s.product_name || "Ukendt produkt"}</div>
                    {isEdit && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:100, background:"var(--amber-lt)", color:"var(--amber)", fontWeight:800, flexShrink:0 }}>RETTELSE</span>}
                  </div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:6, fontFamily:"monospace" }}>EAN: {s.ean} · {daysSince === 0 ? "i dag" : `${daysSince}d siden`} · #{s.id.slice(0, 8)}</div>
                  <div style={UI.wrapGap4}>
                    {dangerAllergens.slice(0,3).map(a => <span key={a.id} style={{ fontSize:10, padding:"2px 8px", borderRadius:100, background:"var(--red-lt)", color:"var(--red)", fontWeight:700 }}>{a.emoji} {a.label}</span>)}
                    {dangerAllergens.length === 0 && <span style={UI.muted10}>Ingen allergener</span>}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Fuldskærms-gennemsyn af en indsendelse (screen === ADMIN && openSubmission) ──
export function AdminSubmissionReview({
  openSubmission, setOpenSubmission, editingSubmission, setEditingSubmission,
  cleanedOcrText, cleaningOcr, cleanOcrWithAI,
  updateSubmissionAndApprove, rejectSubmission,
  submitterInfo, submitterLoading,
}) {
  if (!openSubmission || !editingSubmission) return null;
  return (
    <div className="screen fade-in" style={UI.pb120}>

      {/* Header */}
      <div style={UI.avatarRow}>
        <button onClick={() => { setOpenSubmission(null); setEditingSubmission(null); }}
          style={UI.iconBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2"><path strokeLinecap="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div style={UI.flex1}>
          <div style={{ ...UI.ufs17_fw800_cink, display:"flex", alignItems:"center", gap:6 }}>{openSubmission.type === "edit" && <Icon name="edit" size={15} color="var(--ink)" />} {openSubmission.type === "edit" ? "Gennemse rettelsesforslag" : "Gennemse indsendelse"}</div>
          <div style={UI.muted11mt1}>{new Date(openSubmission.created_at).toLocaleDateString("da-DK", { day:"numeric", month:"long", year:"numeric" })}</div>
          <div style={{ fontSize:10.5, color:"var(--muted)", marginTop:3, fontFamily:"monospace" }}>ID: {openSubmission.id}</div>
          <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
            Indsendt af: {submitterLoading ? "henter…" : submitterInfo?.error ? `ukendt (${submitterInfo.error})` : (submitterInfo?.name || submitterInfo?.email) ? `${submitterInfo.name || "—"}${submitterInfo.email ? ` (${submitterInfo.email})` : ""}` : openSubmission.submitted_by ? "ukendt bruger" : "anonym"}
            {openSubmission.submitted_by && <span style={{ fontFamily:"monospace" }}> (bruger-id: {openSubmission.submitted_by})</span>}
          </div>
        </div>
        {/* Hurtig-godkend/afvis */}
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => updateSubmissionAndApprove(openSubmission, editingSubmission)}
            style={{ background:"var(--green)", border:"none", borderRadius:10, padding:"8px 14px", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--on-green)", cursor:"pointer", boxShadow:"var(--sh)", display:"flex", alignItems:"center", gap:6 }}>
            <Icon name="check" size={13} color="var(--on-green)" /> Godkend
          </button>
          <button onClick={() => { rejectSubmission(openSubmission.id); setOpenSubmission(null); setEditingSubmission(null); }}
            style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10, padding:"8px 14px", fontFamily:"var(--f)", fontSize:12, fontWeight:800, color:"var(--red)", cursor:"pointer", display:"flex" }}>
            <Icon name="x" size={13} color="var(--red)" />
          </button>
        </div>
      </div>

      {/* Produktkort */}
      <div style={UI.card}>
        <div style={UI.udflex_aicenter_g12_mb12}>
          {openSubmission.ai_parsed_data?.product_image_url
            ? <img src={openSubmission.ai_parsed_data.product_image_url}
                style={{ width:64, height:64, borderRadius:10, objectFit:"contain", border:"1px solid var(--border)", flexShrink:0 }} alt="Indsendt produktbillede" />
            : <div style={{ width:64, height:64, borderRadius:10, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon name="package" size={26} color="var(--ink2)" /></div>
          }
          <div style={UI.flex1}>
            <div style={UI.ufs11_cmuted_fw600_mb4}>Produktnavn</div>
            <input value={editingSubmission.name} onChange={e => setEditingSubmission(s => ({ ...s, name: e.target.value }))}
              placeholder="Produktnavn…"
              style={{ width:"100%", border:"none", outline:"none", fontFamily:"var(--f)", fontSize:15, fontWeight:800, color:"var(--ink)", background:"transparent", padding:0 }} />
          </div>
        </div>
        <div style={UI.grid2gap8}>
          <div>
            <div style={UI.ufs10_cmuted_fw600_mb4}>BRAND</div>
            <input value={editingSubmission.brand} onChange={e => setEditingSubmission(s => ({ ...s, brand: e.target.value }))}
              placeholder="Brand / Mærke…" className="field" style={{ padding:"8px 10px", fontSize:13 }} />
          </div>
          <div>
            <div style={UI.ufs10_cmuted_fw600_mb4}>EAN</div>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", padding:"8px 10px", background:"var(--surface2)", borderRadius:8, fontFamily:"monospace" }}>{openSubmission.ean}</div>
          </div>
        </div>
        {openSubmission.notes && (
          <div style={{ marginTop:10, padding:"8px 10px", background:"var(--amber-lt)", borderRadius:8 }}>
            <div style={{ fontSize:10, color:"var(--amber)", fontWeight:700, marginBottom:2 }}>BRUGER-BEMÆRKNING</div>
            <div style={UI.ufs12_cink}>{openSubmission.notes}</div>
          </div>
        )}
      </div>

      {/* Foto af ingredienslisten */}
      {openSubmission.raw_label_image && (
        <div style={UI.card}>
          <div style={{ ...UI.ufs13_fw800_cink_mb10, display:"flex", alignItems:"center", gap:6 }}><Icon name="camera" size={13} color="var(--ink)" /> Foto af ingredienslisten</div>
          <img src={openSubmission.raw_label_image} alt="Ingrediensliste"
            style={{ width:"100%", borderRadius:10, objectFit:"contain", maxHeight:240 }} />
        </div>
      )}

      {/* OCR tekst */}
      {openSubmission.ocr_raw_text && (
        <div style={UI.card}>
          <div style={UI.rowBetweenMb10}>
            <div style={{ ...UI.boldInk13, display:"flex", alignItems:"center", gap:6 }}><Icon name="file" size={13} color="var(--ink)" /> Ingredienser fra OCR</div>
            <button onClick={() => cleanOcrWithAI(openSubmission.ocr_raw_text)} disabled={cleaningOcr}
              style={{ background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:8, padding:"6px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--green)", cursor:"pointer" }}>
              {cleaningOcr ? "🤖 Renskriver…" : "🤖 Renskiv med AI"}
            </button>
          </div>
          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.7, background:"var(--surface2)", borderRadius:8, padding:"10px", maxHeight:120, overflowY:"auto" }}>
            <HighlightText text={openSubmission.ocr_raw_text} />
          </div>
          {cleanedOcrText && (
            <div style={{ marginTop:10, borderTop:"1px solid var(--border)", paddingTop:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--green)", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}><Icon name="check" size={11} color="var(--green)" /> AI renskrevet — tjek at intet er fjernet</div>
              <div style={{ background:"var(--green-lt)", borderRadius:8, padding:"10px", marginBottom:8, fontSize:12, color:"var(--ink)", lineHeight:1.7 }}>
                <HighlightText text={cleanedOcrText} />
              </div>
              <button onClick={() => { setEditingSubmission(s => ({ ...s, ingredients_text: cleanedOcrText })); showToast("Renskrevet tekst brugt"); }}
                style={{ ...UI.uw100_bggreen_bdnone_br10_p10px_fff_fs13_fw700_congreen_curp, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <Icon name="check" size={13} color="var(--on-green)" /> Brug denne version
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ingredienstekst der rent faktisk bliver godkendt — redigérbar, så
          admin kan rette/tilføje direkte (fx manglende E-numre eller
          allergener OCR'en er gået glip af) i stedet for kun at kunne
          acceptere AI-renskrivningen som den er. */}
      {editingSubmission.ingredients_text !== undefined && (
        <div style={UI.card}>
          <div style={{ ...UI.boldInk13, marginBottom:8 }}>Ingredienstekst der bliver godkendt</div>
          <textarea value={editingSubmission.ingredients_text || ""}
            onChange={e => setEditingSubmission(s => ({ ...s, ingredients_text: e.target.value }))}
            rows={3} placeholder="Ingrediensliste…" className="field"
            style={{ resize:"vertical", fontFamily:"var(--f)", fontSize:13, lineHeight:1.6, width:"100%" }} />
        </div>
      )}

      {/* E-numre fundet i ingredienslisten der rent faktisk bliver godkendt —
          klikbare for at fravælge en fejlaflæsning (fjernes fra teksten ved
          godkendelse, se stripExcludedENumbers i useAdmin.js) */}
      {(() => {
        const src = editingSubmission.ingredients_text || cleanedOcrText || openSubmission.ocr_raw_text || "";
        const found = [...new Set((src.match(E_NUMBER_RE) || []).map(e => e.toUpperCase()))];
        if (found.length === 0) return null;
        const excluded = editingSubmission.excluded_enumbers || [];
        const toggle = (e) => setEditingSubmission(s => {
          const cur = s.excluded_enumbers || [];
          return { ...s, excluded_enumbers: cur.includes(e) ? cur.filter(x => x !== e) : [...cur, e] };
        });
        return (
          <div style={UI.card}>
            <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:4 }}>🧪 E-numre fundet</div>
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:10 }}>Tryk for at fravælge en fejlaflæsning</div>
            <div style={UI.wrapGap7}>
              {found.map(e => {
                const isExcluded = excluded.includes(e);
                return (
                  <button key={e} type="button" onClick={() => toggle(e)}
                    style={{
                      padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--f)",
                      background: isExcluded ? "var(--surface2)" : "rgba(99,102,241,.1)",
                      border: `1px solid ${isExcluded ? "var(--border)" : "rgba(99,102,241,.3)"}`,
                      color: isExcluded ? "var(--muted)" : "#818cf8",
                      textDecoration: isExcluded ? "line-through" : "none",
                    }}>
                    {e}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Næringsindhold — kun til stede for nye produkter (Nyt produkt-flowet) */}
      {openSubmission.ai_parsed_data?.nutrition && Object.values(openSubmission.ai_parsed_data.nutrition).some(v => v) && (
        <div style={UI.card}>
          <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}><Icon name="package" size={13} color="var(--ink)" /> Næringsindhold <span style={UI.muted10}>per 100g/ml</span></div>
          <div style={UI.grid2gap8}>
            {[
              { key:"energy", label:"Energi" }, { key:"fat", label:"Fedt" },
              { key:"saturated", label:"Mættet fedt" }, { key:"carbs", label:"Kulhydrat" },
              { key:"sugars", label:"Sukker" }, { key:"protein", label:"Protein" },
              { key:"salt", label:"Salt" },
            ].filter(({ key }) => openSubmission.ai_parsed_data.nutrition[key]).map(({ key, label }) => (
              <div key={key} style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                <span style={UI.muted}>{label}</span>
                <span style={{ color:"var(--ink)", fontWeight:700 }}>{openSubmission.ai_parsed_data.nutrition[key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allergener — toggle grid */}
      <div style={UI.card}>
        <div style={UI.rowBetweenMb10}>
          <div style={UI.boldInk13}>Allergener</div>
          <div style={UI.muted10}>Ja → Spor → Nej</div>
        </div>
        <div style={UI.grid2gap6}>
          {ALLERGENS.map(a => {
            const val = editingSubmission.allergen_flags[a.id] || "no";
            const next = val==="no" ? "yes" : val==="yes" ? "traces" : "no";
            const isYes = val === "yes";
            const isTrace = val === "traces";
            return (
              <button key={a.id} onClick={() => setEditingSubmission(s => ({ ...s, allergen_flags: { ...s.allergen_flags, [a.id]: next } }))}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, cursor:"pointer", minWidth:0, width:"100%", boxSizing:"border-box",
                  border:`1px solid ${isYes?"var(--red-md)":isTrace?"var(--amber-md)":"var(--border)"}`,
                  background: isYes?"var(--red-lt)":isTrace?"var(--amber-lt)":"var(--paper2)",
                  fontFamily:"var(--f)" }}>
                <span style={UI.fs16}>{a.emoji}</span>
                <span style={{ flex:1, minWidth:0, fontSize:12, fontWeight:700, color:isYes?"var(--red)":isTrace?"var(--amber)":"var(--muted2)", textAlign:"left", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.label}</span>
                <span style={{ fontSize:10, fontWeight:800, color:isYes?"var(--red)":isTrace?"var(--amber)":"var(--muted)", flexShrink:0 }}>
                  {isYes?"JA":isTrace?"SPOR":"NEJ"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Handlings-knapper */}
      <div style={{ display:"flex", flexDirection:"column", gap:8, paddingBottom:120 }}>
        <button onClick={() => updateSubmissionAndApprove(openSubmission, editingSubmission)}
          style={{ width:"100%", background:"var(--green)", border:"none", borderRadius:12, padding:"16px", fontFamily:"var(--f)", fontSize:15, fontWeight:700, color:"var(--on-green)", cursor:"pointer", boxShadow:"var(--sh2)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <Icon name="check" size={15} color="var(--on-green)" /> {openSubmission.type === "edit" ? "Godkend og opdater produkt" : "Godkend og opret produkt"}
        </button>
        <button onClick={() => { rejectSubmission(openSubmission.id); setOpenSubmission(null); setEditingSubmission(null); }}
          style={{ width:"100%", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:12, padding:"14px", fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--red)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <Icon name="x" size={14} color="var(--red)" /> Afvis indsendelse
        </button>
        <button onClick={() => { setOpenSubmission(null); setEditingSubmission(null); }}
          style={{ width:"100%", background:"none", border:"none", padding:"10px", fontFamily:"var(--f)", fontSize:13, color:"var(--muted)", cursor:"pointer" }}>
          Annullér
        </button>
      </div>

    </div>
  );
}
