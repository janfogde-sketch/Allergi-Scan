// @ts-nocheck
import { useIsMobile } from "../useIsMobile.js";
import React, { useState, useEffect } from "react";
import { PRODUCT_ALLERGENS, SUPABASE_URL } from "../../constants.jsx";
import { apiCall, makeHeaders, extractENumbers, normalizeENumber, addENumberToText } from "../../helpers.js";
import { showToast } from "../../SharedComponents.jsx";
import { statusPill } from "../statusTone.js";
import {
  submissionAllergenFlags, allergenSummary, allergenLine, nameAllergenMismatch,
  SUBMISSION_STATUS_LABELS, SUBMISSION_ACTION_LABELS, submissionTypeLabel,
} from "../submissionLogic.js";
import { privateImagePath, SUBMISSION_IMAGES_BUCKET } from "../../../supabase/functions/_shared/productImages.js";

const fmtDate = (d) => new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
const productName = (s) => s.ai_parsed_data?.name || s.product_name || "Ukendt produkt";

// Antal indsendelser pr. status (tom side med Content-Range), så fanerne viser rigtige tal uanset hvilken fane der er åben.
function useStatusCounts(accessToken, refreshKey) {
  const [counts, setCounts] = useState({});
  useEffect(() => {
    if (!accessToken) return undefined;
    let alive = true;
    (async () => {
      const next = {};
      await Promise.all(["pending", "approved", "rejected"].map(async (st) => {
        try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/submissions?status=eq.${st}&select=id`, { headers: { ...makeHeaders(accessToken), Prefer: "count=exact", Range: "0-0" } });
          const total = parseInt((res.headers.get("content-range") || "").split("/")[1], 10);
          if (Number.isFinite(total)) next[st] = total;
        } catch { /* tallet er en bekvemmelighed */ }
      }));
      if (alive) setCounts(next);
    })();
    return () => { alive = false; };
  }, [accessToken, refreshKey]);
  return counts;
}

// Indsendte fotos ligger i den private bøtte submission-images; admin får et link, der udløber efter en time.
// Ældre indsendelser har en almindelig offentlig URL, som vises direkte. Bruges med key={url}, så et nyt billede starter forfra.
function SubmissionImage({ label, url, accessToken }) {
  const path = privateImagePath(url);
  const [src, setSrc] = useState(path ? null : url);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!path) return undefined;
    let alive = true;
    apiCall(`${SUPABASE_URL}/storage/v1/object/sign/${SUBMISSION_IMAGES_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST", headers: makeHeaders(accessToken), body: JSON.stringify({ expiresIn: 3600 }),
    }).then((data) => {
      const signed = data?.signedURL || data?.signedUrl;
      if (!signed) throw new Error("Intet link");
      if (alive) setSrc(signed.startsWith("http") ? signed : `${SUPABASE_URL}/storage/v1${signed}`);
    }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [path, accessToken]);
  return (
    <div className="admin-field">
      <label className="admin-label">{label}</label>
      {failed ? <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Billedet kunne ikke hentes.</div>
        : src ? (
          <a href={src} target="_blank" rel="noreferrer">
            <img src={src} alt={label} style={{ width: "100%", maxHeight: 280, objectFit: "contain", borderRadius: 8, background: "var(--surface2)" }} />
          </a>
        ) : <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Henter billede…</div>}
    </div>
  );
}

function AllergenText({ s }) {
  const sum = allergenSummary(s);
  const warn = sum.state === "missing" || sum.state === "partial" || sum.state === "unverified";
  const mismatch = nameAllergenMismatch(s);
  return (
    <>
      <span style={{ color: warn ? "var(--amber)" : sum.state === "found" || sum.state === "traces" ? "var(--ink)" : "var(--muted)", fontWeight: warn ? 700 : 500 }}>{allergenLine(sum)}</span>
      {mismatch.length > 0 && (
        <div style={{ fontSize: 11.5, color: "var(--amber)", marginTop: 2 }}>
          Navnet nævner {mismatch.map((m) => m.label.toLowerCase()).join(", ")}, men det er ikke angivet. Tjek ingredienslisten.
        </div>
      )}
    </>
  );
}

function SubmissionCard({ s, selectable, selected, onToggle, onOpen }) {
  return (
    <div className="admin-item-card" role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpen(); } }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {selectable && (
          <input type="checkbox" checked={selected} aria-label={`Vælg ${productName(s)}`} style={{ width: 22, height: 22, marginTop: 1, flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()} onChange={onToggle} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="admin-item-title" style={{ textAlign: "left" }}>{productName(s)}</div>
          <div className="todo-meta-line" style={{ fontFamily: "var(--mono)" }}>EAN: {s.ean}</div>
          <div className="todo-meta-line">{submissionTypeLabel(s)} · Indsendt {fmtDate(s.created_at)}</div>
          <div className="todo-meta-line"><AllergenText s={s} /></div>
          <div className="todo-meta" style={{ justifyContent: "space-between" }}>
            <span className={`admin-pill ${statusPill(s.status)}`}>{SUBMISSION_STATUS_LABELS[s.status] || s.status}</span>
            <button type="button" className={`admin-btn admin-btn-sm admin-touch ${s.status === "pending" ? "admin-btn-primary" : "admin-btn-ghost"}`}
              onClick={(e) => { e.stopPropagation(); onOpen(); }}>{SUBMISSION_ACTION_LABELS[s.status] || "Se detaljer"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const FILTERS = [
  { val: "pending", label: "Afventer" },
  { val: "approved", label: "Godkendt" },
  { val: "rejected", label: "Afvist" },
];

// Felterne brugeren udfylder i indsendelsen (trin 3); serveren omsætter dem til resultatsidens format ved godkendelse.
const NUTRITION_FIELDS = [
  ["energy", "Energi (kJ/kcal)"], ["fat", "Fedt (g)"], ["saturated", "- heraf mættet (g)"], ["carbs", "Kulhydrat (g)"],
  ["sugars", "- heraf sukker (g)"], ["protein", "Protein (g)"], ["salt", "Salt (g)"],
];

export default function SubmissionsSection({
  submissions, submissionsHasMore, submissionsLoading, submissionFilter, setSubmissionFilter, loadSubmissions,
  openSubmission, setOpenSubmission, editingSubmission, setEditingSubmission,
  cleanedOcrText, setCleanedOcrText, cleaningOcr, cleanOcrWithAI,
  updateSubmissionAndApprove, rejectSubmission, accessToken,
  selectedSubmissionIds, toggleSubmissionSelection, selectAllSubmissions, clearSubmissionSelection,
  bulkActionLoading, bulkApproveSubmissions, bulkRejectSubmissions,
}) {
  const [submitterInfo, setSubmitterInfo] = useState(null);
  const [submitterLoading, setSubmitterLoading] = useState(false);
  const [newENumber, setNewENumber] = useState("");
  const counts = useStatusCounts(accessToken, `${submissionFilter}:${submissions.length}`);

  const addENumber = () => {
    const normalized = normalizeENumber(newENumber);
    if (!normalized) { showToast("Ugyldigt E-nummer — skriv fx \"220\" eller \"E220\"", "error"); return; }
    setEditingSubmission(s => ({
      ...s,
      ingredients_text: addENumberToText(s.ingredients_text, normalized),
      excluded_enumbers: (s.excluded_enumbers || []).filter(e => e.toUpperCase() !== normalized.toUpperCase()),
    }));
    setNewENumber("");
  };

  const openForReview = async (s) => {
    setOpenSubmission(s);
    setSubmitterInfo(null);
    if (setCleanedOcrText) setCleanedOcrText(null);
    if (s.type === "edit" && s.product_id) {
      try {
        const rows = await apiCall(
          `${SUPABASE_URL}/rest/v1/products?id=eq.${s.product_id}&select=name,brand,allergen_flags`,
          { headers: makeHeaders(accessToken) }
        );
        const product = Array.isArray(rows) ? rows[0] : null;
        setEditingSubmission({
          name: product?.name || "", brand: product?.brand || "",
          allergen_flags: product?.allergen_flags || {},
          ingredients_text: s.ai_parsed_data?.edit_type === "ingredients" ? (s.ocr_raw_text || "") : "",
        });
      } catch (e) {
        // Uden en synlig fejl her ville admin se tomme navn/brand/allergen-felter
        // uden at vide at det er fordi opslaget på det EKSISTERENDE produkt
        // fejlede — en godkendelse ovenpå det ville blanke rigtige allergendata.
        showToast("Kunne ikke hente produktets nuværende data: " + e.message + " — udfyld felterne manuelt før du godkender", "error");
        setEditingSubmission({ name: "", brand: "", allergen_flags: {} });
      }
    } else {
      setEditingSubmission({
        name: s.ai_parsed_data?.name || s.product_name || "",
        brand: s.ai_parsed_data?.brand || s.brand || "",
        allergen_flags: submissionAllergenFlags(s),
        // OCR-teksten vises som den er; rens og AI-tjek kun på knappen "Renskriv med AI" (G12)
        ingredients_text: s.ocr_raw_text || "",
        nutrition: Object.fromEntries(NUTRITION_FIELDS.map(([k]) => [k, String(s.ai_parsed_data?.nutrition?.[k] ?? "")])),
      });
    }
    if (s.submitted_by) {
      setSubmitterLoading(true);
      try {
        const rows = await apiCall(
          `${SUPABASE_URL}/rest/v1/users?id=eq.${s.submitted_by}&select=name,email`,
          { headers: makeHeaders(accessToken) }
        );
        setSubmitterInfo(Array.isArray(rows) && rows[0] ? rows[0] : { name: null, email: null });
      } catch (e) {
        setSubmitterInfo({ name: null, email: null, error: e.message });
      }
      setSubmitterLoading(false);
    }
  };

  const close = () => { setOpenSubmission(null); setEditingSubmission(null); setSubmitterInfo(null); };

  const isMobile = useIsMobile();
  const readOnly = !!openSubmission && openSubmission.status !== "pending"; // godkendte og afviste indsendelser kan kun ses, aldrig behandles igen herfra
  const isPendingView = submissionFilter === "pending";
  const allSelected = isPendingView && submissions.length > 0 && submissions.every(s => selectedSubmissionIds.includes(s.id));

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <div className="admin-tabs" style={{ marginBottom: 0, maxWidth: "100%" }}>
          {FILTERS.map(f => (
            <button key={f.val} className={`admin-tab-btn${submissionFilter === f.val ? " active" : ""}`}
              aria-pressed={submissionFilter === f.val}
              onClick={() => { setSubmissionFilter(f.val); loadSubmissions(f.val); clearSubmissionSelection(); }}>{f.label}{counts[f.val] !== undefined ? ` (${counts[f.val]})` : ""}</button>
          ))}
        </div>
        {isPendingView && selectedSubmissionIds.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{selectedSubmissionIds.length} valgt</span>
            <button className="admin-btn admin-btn-primary admin-btn-sm" disabled={bulkActionLoading} onClick={bulkApproveSubmissions}>Godkend valgte</button>
            <button className="admin-btn admin-btn-danger admin-btn-sm" disabled={bulkActionLoading} onClick={bulkRejectSubmissions}>Afvis valgte</button>
            <button className="admin-btn admin-btn-ghost admin-btn-sm" disabled={bulkActionLoading} onClick={clearSubmissionSelection}>Ryd valg</button>
          </div>
        )}
      </div>

      {/* Mobil: tabeloverskriften (med "vælg alle") er skjult, når rækkerne vises som kort, så valget ligger her */}
      {isMobile && isPendingView && submissions.length > 0 && (
        <label className="admin-info-note" style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, cursor: "pointer" }}>
          <input type="checkbox" style={{ width: 20, height: 20 }} checked={allSelected} onChange={e => selectAllSubmissions(e.target.checked ? submissions.map(s => s.id) : [])} />
          Vælg alle ({submissions.length})
        </label>
      )}
      {submissionsHasMore && !submissionsLoading && (
        <div className="admin-info-note">Der er flere indsendelser end de {submissions.length}, der vises. Behandl dem her, og opdatér listen for at se resten.</div>
      )}
      {submissionsLoading ? (
        <div className="admin-loading-row"><div className="admin-spinner" /> Henter indsendelser…</div>
      ) : submissions.length === 0 ? (
        <div className="admin-table-empty">Ingen {SUBMISSION_STATUS_LABELS[submissionFilter]?.toLowerCase() || ""} indsendelser</div>
      ) : isMobile ? (
        <div className="admin-card-list">
          {submissions.map(s => (
            <SubmissionCard key={s.id} s={s} selectable={isPendingView} selected={selectedSubmissionIds.includes(s.id)}
              onToggle={() => toggleSubmissionSelection(s.id)} onOpen={() => openForReview(s)} />
          ))}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr>
              {isPendingView && <th style={{ width: 28 }}><input type="checkbox" aria-label="Vælg alle" checked={allSelected} onChange={e => selectAllSubmissions(e.target.checked ? submissions.map(s => s.id) : [])} /></th>}
              <th>Produkt</th><th>EAN</th><th>Type</th><th>Allergener</th><th>Indsendt</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {submissions.map(s => (
                <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => openForReview(s)}>
                  {isPendingView && (
                    <td onClick={e => e.stopPropagation()}>
                      <input type="checkbox" aria-label={`Vælg ${productName(s)}`} checked={selectedSubmissionIds.includes(s.id)} onChange={() => toggleSubmissionSelection(s.id)} />
                    </td>
                  )}
                  <td style={{ overflowWrap: "anywhere", fontWeight: 700 }}>{productName(s)}</td>
                  <td style={{ fontFamily: "var(--mono)" }}>{s.ean}</td>
                  <td>{s.type === "edit" ? <span className="admin-pill admin-pill-amber">Rettelse</span> : <span className="admin-pill admin-pill-neutral">Nyt produkt</span>}</td>
                  <td><AllergenText s={s} /></td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtDate(s.created_at)}</td>
                  <td><span className={`admin-pill ${statusPill(s.status)}`}>{SUBMISSION_STATUS_LABELS[s.status] || s.status}</span></td>
                  <td><button className={`admin-btn admin-btn-sm ${s.status === "pending" ? "admin-btn-primary" : "admin-btn-ghost"}`} onClick={(e) => { e.stopPropagation(); openForReview(s); }}>{SUBMISSION_ACTION_LABELS[s.status] || "Se detaljer"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openSubmission && editingSubmission && (
        <div className="admin-modal-overlay" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{readOnly ? "Detaljer" : openSubmission.type === "edit" ? "Gennemse rettelsesforslag" : "Gennemse indsendelse"}</div>
                <div style={{ marginTop: 4 }}><span className={`admin-pill ${statusPill(openSubmission.status)}`}>{SUBMISSION_STATUS_LABELS[openSubmission.status] || openSubmission.status}</span></div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>EAN {openSubmission.ean} · {fmtDate(openSubmission.created_at)}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontFamily: "var(--mono)", overflowWrap: "anywhere" }} title={openSubmission.id}>
                  ID: {openSubmission.id}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                  Indsendt af: {submitterLoading ? "henter…" : submitterInfo?.error ? `ukendt (${submitterInfo.error})` : (submitterInfo?.name || submitterInfo?.email) ? `${submitterInfo.name || "—"}${submitterInfo.email ? ` (${submitterInfo.email})` : ""}` : openSubmission.submitted_by ? "ukendt bruger" : "anonym"}
                  {openSubmission.submitted_by && (
                    <span style={{ fontFamily: "var(--mono)", marginLeft: 4 }} title={openSubmission.submitted_by}>
                      (bruger-id: {openSubmission.submitted_by})
                    </span>
                  )}
                </div>
              </div>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={close}>Luk</button>
            </div>

            <fieldset disabled={readOnly} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <div className="admin-field">
              <label className="admin-label">Produktnavn</label>
              <input value={editingSubmission.name} onChange={e => setEditingSubmission(s => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label className="admin-label">Brand</label>
              <input value={editingSubmission.brand} onChange={e => setEditingSubmission(s => ({ ...s, brand: e.target.value }))} />
            </div>

            {openSubmission.notes && (
              <div style={{ background: "var(--amber-lt)", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 12.5 }}>
                <strong>Brugerens bemærkning:</strong> {openSubmission.notes}
              </div>
            )}

            {[
              openSubmission.raw_label_image && { label: "Foto af ingredienslisten", url: openSubmission.raw_label_image },
              ...(openSubmission.ai_parsed_data?.images || []).map(img => ({ label: img.kind === "nutrition" ? "Foto af næringstabellen" : "Foto indsendt af brugeren", url: img.url })),
              openSubmission.ai_parsed_data?.product_image_url && { label: "Foto af produktet", url: openSubmission.ai_parsed_data.product_image_url },
            ].filter(Boolean).map((img, i) => (
              <SubmissionImage key={`${i}-${img.url}`} label={img.label} url={img.url} accessToken={accessToken} />
            ))}

            {editingSubmission.nutrition && openSubmission.type !== "edit" && (
              <div className="admin-field">
                <label className="admin-label">Næringsindhold pr. 100 g/ml (sammenlign med fotoet af næringstabellen; redigérbart)</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px 12px" }}>
                  {NUTRITION_FIELDS.map(([key, label]) => (
                    <div key={key}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>{label}</div>
                      <input value={editingSubmission.nutrition[key] || ""}
                        onChange={e => setEditingSubmission(s => ({ ...s, nutrition: { ...s.nutrition, [key]: e.target.value } }))} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {openSubmission.ocr_raw_text && (
              <div className="admin-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="admin-label" style={{ marginBottom: 0 }}>Ingredienser fra OCR</label>
                  <button className="admin-btn admin-btn-ghost admin-btn-sm" disabled={cleaningOcr} onClick={() => cleanOcrWithAI(openSubmission.ocr_raw_text)}>
                    {cleaningOcr ? "Renskriver…" : "Renskriv med AI"}
                  </button>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink2)", background: "var(--surface2)", borderRadius: 8, padding: 10, maxHeight: 120, overflowY: "auto" }}>
                  {openSubmission.ocr_raw_text}
                </div>
                {cleanedOcrText && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", marginBottom: 4 }}>AI-renskrevet — tjek at intet er fjernet:</div>
                    <div style={{ fontSize: 12.5, background: "var(--green-lt)", borderRadius: 8, padding: 10 }}>{cleanedOcrText}</div>
                  </div>
                )}
              </div>
            )}

            {editingSubmission.ingredients_text !== undefined && (
              <div className="admin-field">
                <label className="admin-label">Ingredienstekst der bliver godkendt (redigérbar)</label>
                <textarea className="admin-textarea" rows={3} value={editingSubmission.ingredients_text || ""}
                  onChange={e => setEditingSubmission(s => ({ ...s, ingredients_text: e.target.value }))}
                  placeholder="Ingrediensliste…" />
                {(() => {
                  const found = extractENumbers(editingSubmission.ingredients_text || "");
                  const excluded = editingSubmission.excluded_enumbers || [];
                  const toggle = (e) => setEditingSubmission(s => {
                    const cur = s.excluded_enumbers || [];
                    return { ...s, excluded_enumbers: cur.includes(e) ? cur.filter(x => x !== e) : [...cur, e] };
                  });
                  return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
                        {found.length === 0 ? "Ingen E-numre fundet i teksten" : "E-numre fundet — klik for at fravælge en fejlaflæsning"}
                      </div>
                      {found.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                          {found.map(e => {
                            const isExcluded = excluded.includes(e);
                            return (
                              <button key={e} type="button" onClick={() => toggle(e)}
                                style={{
                                  fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, cursor: "pointer", fontFamily: "var(--f)",
                                  background: isExcluded ? "var(--surface3)" : "var(--blue-lt)",
                                  color: isExcluded ? "var(--muted)" : "var(--blue)",
                                  border: `1px solid ${isExcluded ? "var(--border)" : "var(--blue-md)"}`,
                                  textDecoration: isExcluded ? "line-through" : "none",
                                }}>
                                {e}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 6 }}>
                        <input value={newENumber} onChange={e => setNewENumber(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addENumber())}
                          placeholder="Tilføj E-nummer OCR har misset, fx 220"
                          style={{ flex: 1, fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border2)", fontFamily: "var(--f)" }} />
                        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={addENumber}>Tilføj</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="admin-field">
              <label className="admin-label">{readOnly ? "Allergener" : "Allergener (klik for at skifte: Ikke angivet → Nej → Ja → Spor)"}</label>
              {(() => {
                const sum = allergenSummary(openSubmission);
                const mismatch = nameAllergenMismatch({ ...openSubmission, ai_parsed_data: { ...(openSubmission.ai_parsed_data || {}), ...editingSubmission.allergen_flags, name: editingSubmission.name } });
                return (
                  <>
                    {(sum.state === "missing" || sum.state === "partial") && (
                      <div className="admin-info-note" role="note">{sum.text}. "Ikke angivet" betyder, at allergenet ikke er vurderet, ikke at det er fraværende.</div>
                    )}
                    {mismatch.length > 0 && (
                      <div className="admin-info-note" role="note" style={{ color: "var(--amber)" }}>
                        Produktnavnet nævner {mismatch.map((m) => m.label.toLowerCase()).join(", ")}, men det er ikke angivet. Navnet er ikke dokumentation: tjek ingredienslisten.
                      </div>
                    )}
                  </>
                );
              })()}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                {PRODUCT_ALLERGENS.map(a => {
                  const val = editingSubmission.allergen_flags[a.id];
                  const unset = val === undefined || val === "unknown";
                  const next = unset ? "no" : val === "no" ? "yes" : val === "yes" ? "traces" : "no";
                  const isYes = val === "yes", isTrace = val === "traces";
                  return (
                    <button key={a.id} type="button" disabled={readOnly}
                      onClick={() => setEditingSubmission(s => ({ ...s, allergen_flags: { ...s.allergen_flags, [a.id]: next } }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, cursor: readOnly ? "default" : "pointer", minHeight: 44,
                        border: `1px ${unset ? "dashed" : "solid"} ${isYes ? "var(--red-md)" : isTrace ? "var(--amber-md)" : "var(--border)"}`,
                        background: isYes ? "var(--red-lt)" : isTrace ? "var(--amber-lt)" : "var(--surface3)",
                        fontFamily: "var(--f)", fontSize: 12,
                      }}>
                      <span style={{ flex: 1, textAlign: "left", fontWeight: 600, color: isYes ? "var(--red)" : isTrace ? "var(--amber)" : "var(--ink2)", overflowWrap: "anywhere" }}>{a.label}{a.type === "intolerance" ? " (intolerance)" : ""}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: isYes ? "var(--red)" : isTrace ? "var(--amber)" : "var(--muted)" }}>
                        {unset ? "IKKE ANGIVET" : isYes ? "JA" : isTrace ? "SPOR" : "NEJ"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            </fieldset>

            <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
              {!readOnly && (
                <>
                  <button className="admin-btn admin-btn-primary admin-touch" onClick={() => updateSubmissionAndApprove(openSubmission, editingSubmission)}>
                    {openSubmission.type === "edit" ? "Godkend og opdater produkt" : "Godkend og opret produkt"}
                  </button>
                  <button className="admin-btn admin-btn-danger admin-touch" onClick={() => rejectSubmission(openSubmission.id)}>Afvis</button>
                </>
              )}
              {!readOnly && <button className="admin-btn admin-btn-ghost admin-touch" onClick={close} style={{ marginLeft: "auto" }}>Annullér</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
