// @ts-nocheck
// Invitation til familien: to måder at invitere på (3. okt. 2026): en mail til en bestemt adresse, eller et delt link (fx i Messenger),
// hvor afsenderen selv godkender, hvem der bruger det (se useFamilyLinkRequests). "Opret og del link" åbner telefonens delingsmenu direkte
// (Bjørn, 6. okt.). Række for en afventende invitation. Modtagere kommer ind via linket; der er ingen "indsæt link"-funktion længere. Ordforråd: "Familie" = voksne med egen konto.
// "Link til listen" (indkøbsliste) er noget helt andet og hører hjemme i Del liste. Udskilt fra FamilyScreen.jsx (arkitekturregel 3).
import React, { useState } from "react";
import { SUPABASE_URL, DIETS_ENABLED } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";
import { Icon, showToast } from "./SharedComponents.jsx";
import { TextLink } from "./DesignSystem.jsx";
import { UI } from "./styleUtils.js";

// "i dag kl. 14.30" / "i morgen kl. 09.10" / "tirsdag 7. okt." — invitationen udløber efter 24 timer
export function formatExpiry(iso) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
  const day = d.toDateString(), now = new Date(), tomorrow = new Date(now.getTime() + 864e5);
  if (day === now.toDateString()) return `i dag kl. ${time}`;
  if (day === tomorrow.toDateString()) return `i morgen kl. ${time}`;
  return d.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "short" });
}

const BTN = { padding:"12px", borderRadius:10, fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, minHeight:44 };

// Fejlkoder fra edge-funktionen family-invite → tekst til brugeren
export function inviteErrorText(code) {
  switch (code) {
    case "invalid_email": return "Indtast en gyldig e-mailadresse.";
    case "own_email": return "Det er din egen e-mailadresse. Indtast adressen på den, du vil invitere.";
    case "already_connected": return "I er allerede forbundet i familien.";
    case "already_pending": return "Du har allerede sendt en invitation til den adresse. Du kan sende den igen fra oversigten.";
    case "rate_limited": return "Du har sendt mange invitationer i dag. Prøv igen i morgen.";
    case "mail_failed": return "Mailen kunne ikke sendes. Tjek adressen og prøv igen.";
    default: return "Noget gik galt. Tjek din forbindelse og prøv igen.";
  }
}

const callInviteFn = async (accessToken, body) => {
  try {
    const data = await apiCall(`${SUPABASE_URL}/functions/v1/family-invite`, {
      method: "POST", headers: makeHeaders(accessToken), body: JSON.stringify(body),
    });
    return data || {};
  } catch (e) {
    // apiCall lægger funktionens fejlkode i beskeden (parsed.error), ellers "HTTP 500" eller en netværksfejl → standardtekst
    return { error: e?.message || "network" };
  }
};

export const inviteUrl = token => `https://eatsafe.dk/invite/${token}`;

const SHARE_DATA = url => ({ title: "Invitation til EatSafe", text: "Jeg vil gerne invitere dig til min familie i EatSafe.", url });

// Gyldig nok til at slå "Send invitation" til; serveren validerer endeligt (invalid_email).
export const isValidInviteEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());

// Del/kopiér det delte link. `url` er hele adressen.
function LinkActions({ url }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const share = () => navigator.share(SHARE_DATA(url)).catch(() => {});
  return (
    <div style={UI.rowGap8}>
      {navigator.share && (
        <button type="button" onClick={share} style={{ ...BTN, flex:1, background:"var(--green)", color:"var(--on-green)", border:"none" }}>
          <Icon name="share" size={14} color="var(--on-green)" /> Del linket
        </button>
      )}
      <button type="button" onClick={copy}
        style={{ ...BTN, flex:1, background: navigator.share ? "var(--surface)" : "var(--green)", color: navigator.share ? "var(--ink)" : "var(--on-green)", border: navigator.share ? "1px solid var(--border2)" : "none" }}>
        <Icon name={copied ? "check" : "link"} size={14} color={navigator.share ? "var(--ink)" : "var(--on-green)"} /> {copied ? "Kopieret" : "Kopiér link"}
      </button>
    </div>
  );
}

// Række i oversigten: en sendt invitation, der endnu ikke er accepteret. Mail-invitationer har "Send igen" (pause på 30 minutter, serveren
// afgør); delte links kan deles igen, og hver, der bruger linket, skal godkendes af afsenderen.
export function PendingInviteCard({ invite, onCancel, accessToken }) {
  const [sending, setSending] = useState(false);
  const isLink = invite.kind === "link";
  const resend = async () => {
    setSending(true);
    const res = await callInviteFn(accessToken, { resend_id: invite.id });
    setSending(false);
    if (res.success) showToast("Invitationen er sendt igen.");
    else if (res.error === "too_soon") showToast("Invitationen blev sendt for lidt siden. Vent lidt, før du sender den igen.", "error");
    else showToast(inviteErrorText(res.error), "error");
  };
  return (
    <div className="family-member">
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div className="fm-avatar" style={{ background:"var(--surface2)" }}><Icon name={isLink ? "link" : "mail"} size={16} color="var(--muted2)" /></div>
        <div style={UI.flex1}>
          <div style={{ fontWeight:800, fontSize:15 }}>{isLink ? "Delt link" : "Invitation sendt"}</div>
          <div style={{ ...UI.muted11mt2, overflowWrap:"anywhere" }}>
            {isLink ? "Du godkender, hvem der bruger det" : (invite.invitee_email || "Afventer svar")} · virker {formatExpiry(invite.expires_at)}
          </div>
        </div>
      </div>
      {isLink && invite.token && <div style={{ marginTop:10 }}><LinkActions url={inviteUrl(invite.token)} /></div>}
      <div style={{ display:"flex", alignItems:"center", justifyContent: isLink ? "flex-start" : "space-between", marginTop:10 }}>
        <TextLink onClick={onCancel}>Annuller invitation</TextLink>
        {!isLink && <TextLink onClick={sending ? undefined : resend}>{sending ? "Sender…" : "Send igen"}</TextLink>}
      </div>
    </div>
  );
}

const SHARED_POINTS = [
  DIETS_ENABLED ? "Allergier og kostvalg" : "Allergier",
  "Indkøbslister",
  "Historik og favoritter, hvis I ønsker det",
];

// Det, der deles, når to konti er i samme familie. Bruges både før invitationen oprettes og i "Sådan virker familie".
function WhatIsShared() {
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>I familien kan I dele</div>
      {SHARED_POINTS.map(t => (
        <div key={t} style={{ display:"flex", gap:8, fontSize:12.5, color:"var(--ink2)", lineHeight:1.45, marginBottom:6 }}>
          <span style={{ flexShrink:0, marginTop:2 }}><Icon name="check" size={13} color="var(--green)" /></span><span>{t}</span>
        </div>
      ))}
    </div>
  );
}

// Panel: forklaring → vælg mail eller delt link → send/opret. onInviteId bruges af oversigten til ikke at vise samme invitation to gange.
export function InvitePanel({ accessToken, onClose, onInviteId, onChanged }) {
  const [mode, setMode] = useState("mail"); // "mail" | "link"
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState(null);
  const [linkUrl, setLinkUrl] = useState(null);
  const [inviteId, setInviteId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finish = invite => { setInviteId(invite.id); setExpiresAt(invite.expires_at); onInviteId?.(invite.id); onChanged?.(); };

  const send = async e => {
    e?.preventDefault();
    setLoading(true); setError("");
    const res = await callInviteFn(accessToken, { email: email.trim() });
    setLoading(false);
    if (res.success && res.invite) { setSentTo(res.invite.invitee_email); finish(res.invite); }
    else setError(inviteErrorText(res.error));
  };

  // Opret linket og åbn straks telefonens delingsmenu. Afviser browseren delingen (ingen Web Share, fx på computer, eller tiden for
  // brugerens tryk er udløbet under oprettelsen), står linket klar med "Del linket"/"Kopiér link" i stedet.
  const createLink = async () => {
    setLoading(true); setError("");
    const res = await callInviteFn(accessToken, { kind: "link" });
    setLoading(false);
    if (!(res.success && res.invite?.url)) { setError(inviteErrorText(res.error)); return; }
    setLinkUrl(res.invite.url); finish(res.invite);
    if (typeof navigator !== "undefined" && navigator.share) navigator.share(SHARE_DATA(res.invite.url)).catch(() => {});
  };

  const cancel = async () => {
    if (inviteId) {
      try { await apiCall(`${SUPABASE_URL}/rest/v1/family_invites?id=eq.${inviteId}`, { method:"DELETE", headers: makeHeaders(accessToken) }); }
      catch { showToast("Kunne ikke annullere invitationen. Prøv igen.", "error"); return; }
    }
    onInviteId?.(null); onChanged?.(); onClose();
  };
  const done = () => { onInviteId?.(null); onChanged?.(); onClose(); };

  const created = !!(sentTo || linkUrl);
  const emailOk = isValidInviteEmail(email);
  // Metodevalg: den valgte har lys grøn baggrund og grøn kant, den anden er neutral.
  const TAB = on => ({ ...BTN, flex:1, minHeight:44, background: on ? "var(--green-selected-bg)" : "var(--surface)", color:"var(--ink)", border: on ? "1.5px solid var(--green)" : "1px solid var(--border2)" });
  const HINT = { fontSize:12.5, color:"var(--muted)", lineHeight:1.5, marginBottom:12 };

  return (
    <div className="card" style={UI.mb12}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div className="card-title" style={{ marginBottom:0 }}>Invitér til familien</div>
        {!created && <TextLink underline={false} onClick={onClose}>Annuller</TextLink>}
      </div>

      {!created && (
        <div style={{ display:"flex", gap:8, margin:"6px 0 12px" }} role="tablist" aria-label="Sådan inviterer du">
          <button type="button" role="tab" aria-selected={mode === "mail"} style={TAB(mode === "mail")} onClick={() => { setMode("mail"); setError(""); }}>
            <Icon name="mail" size={14} color={mode === "mail" ? "var(--green)" : "var(--ink)"} /> Send på mail
          </button>
          <button type="button" role="tab" aria-selected={mode === "link"} style={TAB(mode === "link")} onClick={() => { setMode("link"); setError(""); }}>
            <Icon name="link" size={14} color={mode === "link" ? "var(--green)" : "var(--ink)"} /> Del et link
          </button>
        </div>
      )}

      {!created && mode === "mail" && (
        <form onSubmit={send} noValidate>
          <div style={HINT}>Indtast e-mailadressen på den person, du vil invitere. Personen skal selv acceptere invitationen i EatSafe.</div>
          <label htmlFor="invite-email" style={{ fontSize:12, fontWeight:700, color:"var(--ink)", display:"block", marginBottom:6 }}>E-mailadresse</label>
          <input id="invite-email" type="email" inputMode="email" autoComplete="off" autoCapitalize="none" spellCheck={false}
            placeholder="navn@eksempel.dk" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
            style={{ width:"100%", boxSizing:"border-box", minHeight:46, padding:"10px 12px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--surface)", color:"var(--ink)", fontFamily:"var(--f)", fontSize:15, marginBottom:12 }} />
          <button type="submit" disabled={loading || !emailOk}
            style={{ ...BTN, width:"100%", background:"var(--green)", color:"var(--on-green)", border:"none", opacity: loading || !emailOk ? .6 : 1, cursor: loading || !emailOk ? "default" : "pointer" }}>
            {loading ? "Sender invitation…" : "Send invitation"}
          </button>
          {error && <div role="alert" style={{ fontSize:12, color:"var(--red)", marginTop:8 }}>{error}</div>}
        </form>
      )}

      {!created && mode === "link" && (
        <div>
          <div style={HINT}>
            Send invitationslinket via fx Messenger, Beskeder eller en anden app. Personen skal selv acceptere invitationen, før I bliver forbundet. Linket gælder én person og udløber efter 24 timer.
          </div>
          <button type="button" onClick={createLink} disabled={loading}
            style={{ ...BTN, width:"100%", background:"var(--green)", color:"var(--on-green)", border:"none", opacity: loading ? .6 : 1 }}>
            <Icon name="share" size={14} color="var(--on-green)" /> {loading ? "Opretter link…" : "Opret og del link"}
          </button>
          {error && <div role="alert" style={{ fontSize:12, color:"var(--red)", marginTop:8 }}>{error}</div>}
        </div>
      )}

      {!created && <div style={{ background:"var(--surface2)", borderRadius:10, padding:"12px 14px", marginTop:14 }}><WhatIsShared /></div>}

      {sentTo && (
        <>
          <div style={{ fontSize:12.5, color:"var(--ink2)", lineHeight:1.5, marginBottom:12, overflowWrap:"anywhere" }}>
            Invitationen er sendt til <strong>{sentTo}</strong>{expiresAt ? ` og virker ${formatExpiry(expiresAt)}` : ""}.
          </div>
          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5 }}>
            Bed personen åbne mailen og følge linket, eller oprette sig eller logge ind med den adresse. Når personen har sagt ja i appen, bliver de tilføjet til din Familie. Kan mailen ikke findes, så tjek spam-mappen.
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10 }}>
            <TextLink onClick={cancel}>Annuller invitation</TextLink>
            <TextLink onClick={done}>Færdig</TextLink>
          </div>
        </>
      )}

      {linkUrl && (
        <>
          <div style={{ fontSize:12.5, color:"var(--ink2)", lineHeight:1.5, marginBottom:12 }}>
            Linket er klar{expiresAt ? ` og virker ${formatExpiry(expiresAt)}` : ""}. Del det med den, du vil invitere.
          </div>
          <LinkActions url={linkUrl} />
          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, marginTop:10 }}>
            Når personen har brugt linket og sagt ja, får du besked i appen og skal godkende, før I bliver forbundet.
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10 }}>
            <TextLink onClick={cancel}>Annuller invitation</TextLink>
            <TextLink onClick={done}>Færdig</TextLink>
          </div>
        </>
      )}
    </div>
  );
}
