// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// FeedbackButton.jsx — desktop admin-panelets modvarighed til den mobile
// FeedbackModal.jsx. Samme mål (fri-tekst + type + automatisk diagnostik til
// feedback_tickets), men med admin-relevant kontekst (hvilken admin-sektion,
// ikke hvilken mobil-skærm) i stedet for at forsøge at genbruge mobil-appens
// screen/onboarding/scanResult-kontekst, som ikke findes her.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../constants.jsx";
import { compressImageToBase64 } from "../helpers.js";

const TYPES = [
  { id: "bug", label: "Fejl / bug" },
  { id: "ui", label: "Design / UI" },
  { id: "missing", label: "Mangler noget" },
  { id: "content", label: "Forkert indhold" },
  { id: "suggestion", label: "Forslag" },
];

export default function FeedbackButton({ accessToken, userId, userEmail, section }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("bug");
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    if (image) URL.revokeObjectURL(image);
    setType("bug"); setText(""); setImage(null); setImageB64(null); setSending(false); setDone(false);
  };
  const close = () => { setOpen(false); reset(); };

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const ctx = {
        source: "desktop-admin",
        admin_section: section,
        url: window.location.href,
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen_size: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine,
        timestamp: new Date().toISOString(),
        user_id: userId || null,
        user_email: userEmail || null,
      };
      const headers = {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };
      const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({
          type, description: text, context: ctx,
          image_base64: imageB64 || null, status: "open", submitted_by: userId || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDone(true);
      setTimeout(close, 1800);
    } catch (e) {
      alert("Fejl: " + e.message);
    }
    setSending(false);
  };

  return (
    <>
      <button className="admin-btn admin-btn-ghost admin-btn-full admin-btn-sm" onClick={() => setOpen(true)} style={{ marginBottom: 6 }}>
        Send feedback
      </button>
      {open && (
        <div className="admin-modal-overlay" onClick={close}>
          <div className="admin-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            {done ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>Tak for din feedback!</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>Den lander i Tickets-fanen.</div>
              </div>
            ) : (
              <>
                <div className="admin-modal-header">
                  <div style={{ fontSize: 16, fontWeight: 800 }}>Send feedback</div>
                  <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={close}>Luk</button>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Type</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {TYPES.map(t => (
                      <button key={t.id} className="admin-pill"
                        style={{ cursor: "pointer", border: `1px solid ${type === t.id ? "var(--green)" : "var(--border)"}`, background: type === t.id ? "var(--green-lt)" : "var(--surface3)", color: type === t.id ? "var(--green)" : "var(--ink2)" }}
                        onClick={() => setType(t.id)}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Beskriv problemet</label>
                  <textarea className="admin-textarea" rows={4} value={text} onChange={e => setText(e.target.value)}
                    placeholder="Fx. 'Når jeg trykker på X sker der Y…' — jo mere detalje, jo bedre" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Skærmbillede (valgfrit)</label>
                  {image ? (
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <img src={image} alt="Screenshot" style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 8, border: "1px solid var(--border)" }} />
                      <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ position: "absolute", top: 4, right: 4 }}
                        onClick={() => { URL.revokeObjectURL(image); setImage(null); setImageB64(null); }}>Fjern</button>
                    </div>
                  ) : (
                    <label className="admin-btn admin-btn-ghost admin-btn-sm" style={{ cursor: "pointer", display: "inline-flex" }}>
                      Vælg billede
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                        const f = e.target.files?.[0]; if (!f) return;
                        if (image) URL.revokeObjectURL(image);
                        setImage(URL.createObjectURL(f));
                        try { setImageB64(await compressImageToBase64(f)); } catch { setImage(null); setImageB64(null); }
                      }} />
                    </label>
                  )}
                </div>

                <button className="admin-btn admin-btn-primary admin-btn-full" disabled={sending || !text.trim()} onClick={submit}>
                  {sending ? "Sender…" : "Send feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
