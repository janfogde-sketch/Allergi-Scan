// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// FeedbackButton.jsx — desktop admin-panelets modvarighed til den mobile
// FeedbackModal.jsx. Samme mål (fri-tekst + type + automatisk diagnostik til
// feedback_tickets), men med admin-relevant kontekst (hvilken admin-sektion,
// ikke hvilken mobil-skærm) i stedet for at forsøge at genbruge mobil-appens
// screen/onboarding/scanResult-kontekst, som ikke findes her.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import ReactDOM from "react-dom";
import { submitFeedback } from "../submitFeedback.js";
import { compressImageToBase64 } from "../helpers.js";
import { showToast, Icon } from "../SharedComponents.jsx";
import CloseX from "./CloseX.jsx";

const TYPES = [
  { id: "bug", label: "Fejl / bug" },
  { id: "ui", label: "Design / UI" },
  { id: "missing", label: "Mangler noget" },
  { id: "content", label: "Forkert indhold" },
  { id: "suggestion", label: "Forslag" },
];

// open/onOpenChange: styres udefra (fx fra kontomenuen), og så vises ingen egen knap. Uden dem ligger knappen her som før.
export default function FeedbackButton({ accessToken, userId, userEmail, section, open: openProp, onOpenChange }) {
  const controlled = typeof openProp === "boolean";
  const [openLocal, setOpenLocal] = useState(false);
  const open = controlled ? openProp : openLocal;
  const setOpen = (v) => { if (controlled) onOpenChange?.(v); else setOpenLocal(v); };
  const [type, setType] = useState("bug");
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [ask, setAsk] = useState(false);

  const reset = () => {
    if (image) URL.revokeObjectURL(image);
    setType("bug"); setText(""); setImage(null); setImageB64(null); setSending(false); setDone(false);
  };
  const close = () => { setOpen(false); setAsk(false); reset(); };
  // Skrevet tekst eller billede er ikke-gemte ændringer: kassering kræver bekræftelse
  const requestClose = () => { if (!done && !sending && (text.trim() || image)) setAsk(true); else close(); };

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
      await submitFeedback({ type, description: text, context: ctx, imageBase64: imageB64, accessToken });
      setDone(true);
      setTimeout(close, 1800);
    } catch (e) {
      showToast("Kunne ikke sende feedback: " + e.message, "error");
    }
    setSending(false);
  };

  return (
    <>
      {!controlled && (
        <button className="admin-btn admin-btn-ghost admin-btn-full admin-btn-sm" onClick={() => setOpen(true)}>
          <Icon name="message" size={14} color="var(--ink2)" />Send feedback
        </button>
      )}
      {open && ReactDOM.createPortal(
        <div className="admin-modal-overlay" onClick={requestClose}>
          <div className="admin-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            {ask && (
              <div className="todo-confirm" role="alertdialog" aria-label="Ikke-gemte ændringer" style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Din feedback er ikke sendt endnu.</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setAsk(false)}>Bliv og skriv</button>
                  <button type="button" className="admin-btn admin-btn-danger admin-btn-sm admin-touch" onClick={close}>Kassér</button>
                </div>
              </div>
            )}
            {done ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>Tak for din feedback!</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>Den lander i Tickets-fanen.</div>
              </div>
            ) : (
              <>
                <div className="admin-modal-header">
                  <div style={{ fontSize: 16, fontWeight: 800 }}>Send feedback</div>
                  <CloseX onClick={requestClose} />
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
                        try { setImageB64(await compressImageToBase64(f)); } catch (err) {
                          setImage(null); setImageB64(null);
                          showToast("Kunne ikke læse billedet — prøv et andet, eller send feedback uden skærmbillede.", "error");
                        }
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
        </div>,
        document.body
      )}
    </>
  );
}
