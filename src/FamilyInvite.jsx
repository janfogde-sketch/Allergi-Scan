// @ts-nocheck
// Invitation til familien: forklaring af, hvad der deles, afsendelse af invitationen til en e-mailadresse, og række for en afventende
// invitation. Invitationen sendes som mail og gælder kun for den adresse (3. okt. 2026; før var det et link, der kunne deles videre og
// gik tabt, når det blev åbnet i en anden browser end den, modtageren loggede ind i). Ordforråd: "Familie" = voksne med egen konto.
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

// Række i oversigten: en sendt invitation, der endnu ikke er accepteret. "Send igen" har en pause på 30 minutter (serveren afgør).
export function PendingInviteCard({ invite, onCancel, accessToken }) {
  const [sending, setSending] = useState(false);
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
        <div className="fm-avatar" style={{ background:"var(--surface2)" }}><Icon name="mail" size={16} color="var(--muted2)" /></div>
        <div style={UI.flex1}>
          <div style={{ fontWeight:800, fontSize:15 }}>Invitation sendt</div>
          <div style={{ ...UI.muted11mt2, overflowWrap:"anywhere" }}>{invite.invitee_email || "Afventer svar"} · virker {formatExpiry(invite.expires_at)}</div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10 }}>
        <TextLink onClick={onCancel}>Annuller invitation</TextLink>
        <TextLink onClick={sending ? undefined : resend}>{sending ? "Sender…" : "Send igen"}</TextLink>
      </div>
    </div>
  );
}

const SHARED_POINTS = [
  DIETS_ENABLED ? "Allergier og kostvalg" : "Allergier",
  "Historik og favoritter, hvis I vælger det",
  "Indkøbslister, som I deler",
];

// Det, der deles, når to konti er i samme familie. Bruges både før invitationen oprettes og i "Sådan virker familie".
export function WhatIsShared() {
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>I kan dele</div>
      {SHARED_POINTS.map(t => (
        <div key={t} style={{ display:"flex", gap:8, fontSize:12.5, color:"var(--ink2)", lineHeight:1.45, marginBottom:6 }}>
          <span style={{ flexShrink:0, marginTop:2 }}><Icon name="check" size={13} color="var(--green)" /></span><span>{t}</span>
        </div>
      ))}
    </div>
  );
}

// Panel: forklaring → skriv e-mail → send. onInviteId bruges af oversigten til ikke at vise samme invitation to gange.
export function InvitePanel({ accessToken, onClose, onInviteId, onChanged }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState(null);
  const [inviteId, setInviteId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async e => {
    e?.preventDefault();
    setLoading(true); setError("");
    const res = await callInviteFn(accessToken, { email: email.trim() });
    setLoading(false);
    if (res.success && res.invite) {
      setSentTo(res.invite.invitee_email); setInviteId(res.invite.id); setExpiresAt(res.invite.expires_at);
      onInviteId?.(res.invite.id); onChanged?.();
    } else setError(inviteErrorText(res.error));
  };

  const cancel = async () => {
    if (inviteId) {
      try { await apiCall(`${SUPABASE_URL}/rest/v1/family_invites?id=eq.${inviteId}`, { method:"DELETE", headers: makeHeaders(accessToken) }); }
      catch { showToast("Kunne ikke annullere invitationen. Prøv igen.", "error"); return; }
    }
    onInviteId?.(null); onChanged?.(); onClose();
  };
  const done = () => { onInviteId?.(null); onChanged?.(); onClose(); };

  return (
    <div className="card" style={UI.mb12}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div className="card-title" style={{ marginBottom:0 }}>Invitér en voksen</div>
        {!sentTo && <TextLink onClick={onClose}>Annuller</TextLink>}
      </div>

      {!sentTo ? (
        <form onSubmit={send}>
          <div style={{ fontSize:12.5, color:"var(--muted2)", lineHeight:1.5, marginBottom:12 }}>
            Skriv e-mailadressen på den, du vil invitere. Vi sender en invitation dertil. Har personen allerede en EatSafe-konto, logger de bare ind og bekræfter i appen; ellers opretter de en egen konto. Personen styrer selv sin profil.
          </div>
          <div style={{ background:"var(--surface2)", borderRadius:10, padding:"12px 14px", marginBottom:12 }}><WhatIsShared /></div>
          <label htmlFor="invite-email" style={{ fontSize:12, fontWeight:700, color:"var(--ink)", display:"block", marginBottom:6 }}>E-mailadresse</label>
          <input id="invite-email" type="email" inputMode="email" autoComplete="off" autoCapitalize="none" spellCheck={false}
            placeholder="navn@eksempel.dk" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
            style={{ width:"100%", boxSizing:"border-box", minHeight:46, padding:"10px 12px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--surface)", color:"var(--ink)", fontFamily:"var(--f)", fontSize:15 }} />
          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, margin:"8px 0 12px" }}>
            Personen skal oprette sig eller logge ind med præcis denne e-mailadresse. Ingen bliver forbundet, før de selv har sagt ja i appen. Invitationen virker i 24 timer og kun for den adresse. Forbindelsen kan fjernes igen senere.
          </div>
          <button type="submit" disabled={loading || !email.trim()}
            style={{ ...BTN, width:"100%", background:"var(--green)", color:"var(--on-green)", border:"none", opacity: loading || !email.trim() ? .6 : 1 }}>
            {loading ? "Sender invitation…" : "Send invitation"}
          </button>
          {error && <div role="alert" style={{ fontSize:12, color:"var(--red)", marginTop:8 }}>{error}</div>}
        </form>
      ) : (
        <>
          <div style={{ fontSize:12.5, color:"var(--ink2)", lineHeight:1.5, marginBottom:12, overflowWrap:"anywhere" }}>
            Invitationen er sendt til <strong>{sentTo}</strong>{expiresAt ? ` og virker ${formatExpiry(expiresAt)}` : ""}.
          </div>
          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5 }}>
            Bed personen oprette sig eller logge ind med den adresse. Når personen har sagt ja i appen, bliver de tilføjet til din Familie. Kan mailen ikke findes, så tjek spam-mappen.
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
