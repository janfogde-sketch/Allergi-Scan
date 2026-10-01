// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { showToast } from "../../SharedComponents.jsx";
import {
  listNotifications, defaultPush, previewPush, overrideIsActive, validatePushOverride, pushVariablesFor,
  VARIABLE_LABELS, PUSH_TITLE_MAX, PUSH_BODY_MAX,
} from "../notificationAdminLogic.js";

const RESEND_TEMPLATES_URL = "https://resend.com/templates";

function PushPreview({ title, body }) {
  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px", maxWidth: 360 }}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 700, letterSpacing: ".03em" }}>EATSAFE · NU</div>
      <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>{title || "—"}</div>
      <div style={{ fontSize: 13.5, color: "var(--ink2)", overflowWrap: "anywhere", lineHeight: 1.4 }}>{body || "—"}</div>
    </div>
  );
}

function TestResult({ res }) {
  if (!res) return null;
  const lines = [];
  if (res.push) {
    const p = res.push;
    lines.push(p.devices === 0
      ? "Push: modtageren har ingen enhed med push slået til (åbn appen på telefonen og tillad notifikationer)."
      : `Push: sendt til ${p.sent} af ${p.devices} enheder${p.failed ? ` (${p.errors.join("; ")})` : ""}.`);
  }
  if (res.mail) lines.push(res.mail.sent ? "Mail: sendt." : `Mail: ikke sendt (${res.mail.error}).`);
  return <div className="info-box" role="status" style={{ marginTop: 12, fontSize: 13 }}>{lines.map((l) => <div key={l}>{l}</div>)}</div>;
}

export default function NotificationsSection({ admins, overrides, loading, load, savePush, sendTest, userId }) {
  const groups = useMemo(() => listNotifications(), []);
  const [selectedKey, setSelectedKey] = useState(groups[0]?.items[0]?.key);
  const selected = groups.flatMap((g) => g.items).find((i) => i.key === selectedKey);

  const saved = overrides[selectedKey];
  const [draft, setDraft] = useState({ title: "", body: "" });
  const [recipient, setRecipient] = useState("");
  const [channels, setChannels] = useState({ push: true, mail: true });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  // Ved skift af notifikation: vis den gemte tekst, ellers standardteksten
  useEffect(() => {
    const d = defaultPush(selectedKey);
    setDraft({ title: saved?.title ?? d.title, body: saved?.body ?? d.body });
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, saved?.updated_at]);

  useEffect(() => { if (!recipient && admins.length) setRecipient(admins.find((a) => a.id === userId)?.id ?? admins[0].id); }, [admins, userId, recipient]);

  if (!selected) return null;
  const def = defaultPush(selectedKey);
  const isDefault = draft.title.trim() === def.title && draft.body.trim() === def.body;
  // Står teksten på standard, gemmes ingen række (tom = standard)
  const toSave = isDefault ? { title: "", body: "" } : draft;
  const check = validatePushOverride(selectedKey, toSave);
  const dirty = isDefault ? overrideIsActive(saved) : (draft.title !== (saved?.title ?? def.title) || draft.body !== (saved?.body ?? def.body));
  const vars = pushVariablesFor(selectedKey);
  const preview = check.ok ? previewPush(selectedKey, toSave) : null;
  const hasMail = !!selected.def.mail;

  const insertVar = (name) => setDraft((d) => ({ ...d, body: `${d.body}{{${name}}}` }));

  const save = async () => {
    setSaving(true);
    await savePush(selectedKey, toSave);
    setSaving(false);
  };

  const send = async () => {
    const chosen = Object.keys(channels).filter((c) => channels[c]);
    if (!recipient || chosen.length === 0) { showToast("Vælg modtager og mindst én kanal", "error"); return; }
    setSending(true);
    // Testen bruger den GEMTE tekst — gem først, så testen viser det, du ser
    if (dirty && check.ok) await savePush(selectedKey, toSave);
    setResult(await sendTest(selectedKey, recipient, chosen));
    setSending(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 280px) 1fr", gap: 20, alignItems: "start" }}>
      <div className="admin-card" style={{ padding: 8 }}>
        {loading && <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>}
        {groups.map((g) => (
          <div key={g.label} style={{ marginBottom: 8 }}>
            <div className="admin-label" style={{ padding: "8px 10px 2px" }}>{g.label}</div>
            {g.items.map((i) => (
              <button key={i.key} className={`admin-nav-item${i.key === selectedKey ? " active" : ""}`} style={{ width: "100%" }} onClick={() => setSelectedKey(i.key)}>
                <span style={{ flex: 1, textAlign: "left" }}>{i.name}</span>
                {overrideIsActive(overrides[i.key]) && <span className="admin-pill" style={{ background: "var(--green-lt)", color: "var(--green)" }}>Rettet</span>}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div>
        <div className="admin-card">
          <h2 style={{ margin: "0 0 4px", fontSize: 17 }}>{selected.name}</h2>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 16 }}>Notifikation {selectedKey}</div>

          <div className="admin-label">Push-besked</div>
          <div className="admin-field">
            <label htmlFor="np-title">Titel ({draft.title.length}/{PUSH_TITLE_MAX})</label>
            <input id="np-title" value={draft.title} maxLength={PUSH_TITLE_MAX + 20} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label htmlFor="np-body">Tekst ({draft.body.length}/{PUSH_BODY_MAX})</label>
            <textarea id="np-body" className="admin-textarea" style={{ minHeight: 70 }} value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} />
          </div>
          {vars.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Indsæt i teksten:</span>
              {vars.map((v) => (
                <button key={v} type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => insertVar(v)} title={`{{${v}}}`}>{VARIABLE_LABELS[v] ?? v}</button>
              ))}
            </div>
          )}
          {!check.ok && <div className="error-box" role="alert" style={{ marginBottom: 12, fontSize: 13 }}>{check.error}</div>}

          <div className="admin-label" style={{ marginTop: 4 }}>Sådan ser pushen ud (med eksempeldata)</div>
          {preview && <PushPreview title={preview.title} body={preview.body} />}

          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving || !dirty || !check.ok}>{saving ? "Gemmer…" : "Gem push-tekst"}</button>
            <button className="admin-btn admin-btn-ghost" onClick={() => setDraft({ title: def.title, body: def.body })} disabled={isDefault}>Gendan standard</button>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
            Push er en kort version, der fører til beskeden i appen. Beskeden i appen og mailen ændres ikke her.
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-label">Mail</div>
          {hasMail && <div style={{ fontSize: 13.5, marginBottom: 4 }}>Emne: <strong>{selected.def.mail.subject}</strong></div>}
          <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.5 }}>
            Mailens design og tekst rettes i Resend. <a href={RESEND_TEMPLATES_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontWeight: 600 }}>Åbn Resend-skabeloner</a>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-label">Send test</div>
          <div style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 12, lineHeight: 1.5 }}>
            Sender en testversion med opdigtede eksempeldata (mærket [TEST]) til den valgte admin. Der oprettes ingen besked i appen.
          </div>
          <div className="admin-field" style={{ maxWidth: 360 }}>
            <label htmlFor="np-recipient">Modtager (admin)</label>
            <select id="np-recipient" className="admin-select" value={recipient} onChange={(e) => setRecipient(e.target.value)}>
              {admins.map((a) => <option key={a.id} value={a.id}>{a.name ? `${a.name} (${a.email})` : a.email}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13.5 }}>
              <input type="checkbox" id="np-ch-push" checked={channels.push} onChange={(e) => setChannels((c) => ({ ...c, push: e.target.checked }))} /> Push
            </label>
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13.5 }}>
              <input type="checkbox" id="np-ch-mail" checked={channels.mail} onChange={(e) => setChannels((c) => ({ ...c, mail: e.target.checked }))} /> Mail
            </label>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={send} disabled={sending || !recipient || !check.ok}>{sending ? "Sender…" : "Send test"}</button>
          <button className="admin-btn admin-btn-ghost" style={{ marginLeft: 8 }} onClick={() => load()}>Opdater</button>
          <TestResult res={result} />
        </div>
      </div>
    </div>
  );
}
