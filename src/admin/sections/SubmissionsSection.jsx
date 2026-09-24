// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, SUPABASE_URL } from "../../constants.jsx";
import { apiCall, makeHeaders, extractENumbers } from "../../helpers.js";
import { showToast } from "../../SharedComponents.jsx";

const FILTERS = [
  { val: "pending", label: "Afventer" },
  { val: "approved", label: "Godkendt" },
  { val: "rejected", label: "Afvist" },
];

export default function SubmissionsSection({
  submissions, submissionsLoading, submissionFilter, setSubmissionFilter, loadSubmissions,
  openSubmission, setOpenSubmission, editingSubmission, setEditingSubmission,
  cleanedOcrText, cleaningOcr, cleanOcrWithAI,
  updateSubmissionAndApprove, rejectSubmission, accessToken,
}) {
  const [submitterInfo, setSubmitterInfo] = useState(null);
  const [submitterLoading, setSubmitterLoading] = useState(false);

  const openForReview = async (s) => {
    setOpenSubmission(s);
    setSubmitterInfo(null);
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
        allergen_flags: s.ai_parsed_data || {},
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
    if (s.ocr_raw_text) cleanOcrWithAI(s.ocr_raw_text);
  };

  const close = () => { setOpenSubmission(null); setEditingSubmission(null); setSubmitterInfo(null); };

  return (
    <>
      <div className="admin-tabs">
        {FILTERS.map(f => (
          <button key={f.val} className={`admin-tab-btn${submissionFilter === f.val ? " active" : ""}`}
            onClick={() => { setSubmissionFilter(f.val); loadSubmissions(f.val); }}>{f.label}</button>
        ))}
      </div>

      <div className="admin-table-wrap">
        {submissionsLoading ? (
          <div className="admin-loading-row"><div className="admin-spinner" /> Henter indsendelser…</div>
        ) : submissions.length === 0 ? (
          <div className="admin-table-empty">Ingen indsendelser her</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>ID</th><th>Produkt</th><th>EAN</th><th>Type</th><th>Allergener</th><th>Indsendt</th><th></th></tr></thead>
            <tbody>
              {submissions.map(s => {
                const flags = s.ai_parsed_data || {};
                const danger = ALLERGENS.filter(a => flags[a.id] === "yes" || flags[a.id] === true);
                const isEdit = s.type === "edit";
                return (
                  <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => openForReview(s)}>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }} title={s.id}>{s.id.slice(0, 8)}</td>
                    <td>{s.ai_parsed_data?.name || s.product_name || "Ukendt produkt"}</td>
                    <td style={{ fontFamily: "var(--mono)" }}>{s.ean}</td>
                    <td>{isEdit ? <span className="admin-pill admin-pill-amber">Rettelse</span> : <span className="admin-pill admin-pill-neutral">Nyt produkt</span>}</td>
                    <td>{danger.length === 0 ? <span style={{ color: "var(--muted)" }}>Ingen</span> : danger.slice(0, 3).map(a => a.label).join(", ")}</td>
                    <td>{new Date(s.created_at).toLocaleDateString("da-DK")}</td>
                    <td><button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={(e) => { e.stopPropagation(); openForReview(s); }}>Gennemgå</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {openSubmission && editingSubmission && (
        <div className="admin-modal-overlay" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{openSubmission.type === "edit" ? "Gennemse rettelsesforslag" : "Gennemse indsendelse"}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>EAN {openSubmission.ean} · {new Date(openSubmission.created_at).toLocaleDateString("da-DK")}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontFamily: "var(--mono)" }} title={openSubmission.id}>
                  ID: {openSubmission.id}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                  Indsendt af: {submitterLoading ? "henter…" : submitterInfo?.error ? `ukendt (${submitterInfo.error})` : (submitterInfo?.name || submitterInfo?.email) ? `${submitterInfo.name || "—"}${submitterInfo.email ? ` (${submitterInfo.email})` : ""}` : openSubmission.submitted_by ? "ukendt bruger" : "anonym"}
                </div>
              </div>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={close}>Luk</button>
            </div>

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
                  if (found.length === 0) return null;
                  return (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {found.map(e => (
                        <span key={e} style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "var(--blue-lt)", color: "var(--blue)", border: "1px solid var(--blue-md)" }}>{e}</span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="admin-field">
              <label className="admin-label">Allergener (klik for at skifte: Nej → Ja → Spor)</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                {ALLERGENS.map(a => {
                  const val = editingSubmission.allergen_flags[a.id] || "no";
                  const next = val === "no" ? "yes" : val === "yes" ? "traces" : "no";
                  const isYes = val === "yes", isTrace = val === "traces";
                  return (
                    <button key={a.id}
                      onClick={() => setEditingSubmission(s => ({ ...s, allergen_flags: { ...s.allergen_flags, [a.id]: next } }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                        border: `1px solid ${isYes ? "var(--red-md)" : isTrace ? "var(--amber-md)" : "var(--border)"}`,
                        background: isYes ? "var(--red-lt)" : isTrace ? "var(--amber-lt)" : "var(--surface3)",
                        fontFamily: "var(--f)", fontSize: 12,
                      }}>
                      <span style={{ flex: 1, textAlign: "left", fontWeight: 600, color: isYes ? "var(--red)" : isTrace ? "var(--amber)" : "var(--muted2)" }}>{a.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: isYes ? "var(--red)" : isTrace ? "var(--amber)" : "var(--muted)" }}>
                        {isYes ? "JA" : isTrace ? "SPOR" : "NEJ"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="admin-btn admin-btn-primary" onClick={() => updateSubmissionAndApprove(openSubmission, editingSubmission)}>
                {openSubmission.type === "edit" ? "Godkend og opdater produkt" : "Godkend og opret produkt"}
              </button>
              <button className="admin-btn admin-btn-danger" onClick={() => rejectSubmission(openSubmission.id)}>Afvis</button>
              <button className="admin-btn admin-btn-ghost" onClick={close} style={{ marginLeft: "auto" }}>Annullér</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
