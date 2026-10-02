// @ts-nocheck
// Invitation til familien: forklaring af, hvad der deles, oprettelse af linket, og række for en afventende invitation.
// Udskilt fra FamilyScreen.jsx (arkitekturregel 3). Ordforråd: "Familie" = voksne med egen konto, der er forbundet via en
// invitation. "Link til listen" (indkøbsliste) er noget helt andet og hører hjemme i Del liste.
import React, { useState } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";
import { Icon, showToast } from "./SharedComponents.jsx";
import { TextLink } from "./DesignSystem.jsx";
import { UI } from "./styleUtils.js";

export const inviteUrl = token => `https://eatsafe.dk/invite/${token}`;

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

export function InviteLinkActions({ token }) {
  const [copied, setCopied] = useState(false);
  const url = inviteUrl(token);
  const copy = () => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const send = () => navigator.share({ title: "Invitation til EatSafe", text: "Jeg vil gerne invitere dig til min familie i EatSafe.", url }).catch(() => {});
  return (
    <div style={UI.rowGap8}>
      {navigator.share && (
        <button type="button" onClick={send} style={{ ...BTN, flex:1, background:"var(--green)", color:"var(--on-green)", border:"none" }}>
          <Icon name="share" size={14} color="var(--on-green)" /> Send invitation
        </button>
      )}
      <button type="button" onClick={copy}
        style={{ ...BTN, flex:1, background: navigator.share ? "var(--surface)" : "var(--green)", color: navigator.share ? "var(--ink)" : "var(--on-green)", border: navigator.share ? "1px solid var(--border2)" : "none" }}>
        <Icon name={copied ? "check" : "link"} size={14} color={navigator.share ? "var(--ink)" : "var(--on-green)"} /> {copied ? "Kopieret" : navigator.share ? "Kopiér link" : "Kopiér invitationslink"}
      </button>
    </div>
  );
}

// Række i oversigten: en sendt invitation, der endnu ikke er accepteret
export function PendingInviteCard({ invite, onCancel }) {
  return (
    <div className="family-member">
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div className="fm-avatar" style={{ background:"var(--surface2)" }}><Icon name="link" size={16} color="var(--muted2)" /></div>
        <div style={UI.flex1}>
          <div style={{ fontWeight:800, fontSize:15 }}>Invitation sendt</div>
          <div style={UI.muted11mt2}>Afventer svar · linket virker {formatExpiry(invite.expires_at)}</div>
        </div>
      </div>
      <div style={{ marginTop:10 }}><InviteLinkActions token={invite.token} /></div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
        <TextLink onClick={onCancel}>Annullér invitation</TextLink>
      </div>
    </div>
  );
}

const SHARED_POINTS = [
  "Allergier og kostvalg, så I kan tjekke varer for hinanden ved scanning",
  "Scanningshistorik og favoritter (I vælger selv at se dem under Historik og Favoritter)",
  "Indkøbslister, som I vælger at dele",
];

// Det, der deles, når to konti er i samme familie. Bruges både før invitationen oprettes og i "Sådan virker familie".
export function WhatIsShared() {
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>Det deler I med hinanden</div>
      {SHARED_POINTS.map(t => (
        <div key={t} style={{ display:"flex", gap:8, fontSize:12.5, color:"var(--ink2)", lineHeight:1.45, marginBottom:6 }}>
          <span style={{ flexShrink:0, marginTop:2 }}><Icon name="check" size={13} color="var(--green)" /></span><span>{t}</span>
        </div>
      ))}
    </div>
  );
}

// Panel: forklaring → opret → send. onInviteId bruges af oversigten til ikke at vise samme invitation to gange.
export function InvitePanel({ accessToken, userId, onClose, onInviteId, onChanged }) {
  const [token, setToken] = useState(null);
  const [inviteId, setInviteId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    setLoading(true); setError("");
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/family_invites`, {
        method: "POST",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
        body: JSON.stringify({ invited_by: userId }),
      });
      if (Array.isArray(data) && data[0]?.token) {
        setToken(data[0].token); setInviteId(data[0].id ?? null); setExpiresAt(data[0].expires_at ?? null);
        onInviteId?.(data[0].id ?? null); onChanged?.();
      } else setError("Kunne ikke oprette invitationen. Prøv igen.");
    } catch { setError("Noget gik galt. Tjek din forbindelse."); }
    setLoading(false);
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
        {!token && <TextLink onClick={onClose}>Annuller</TextLink>}
      </div>

      {!token ? (
        <>
          <div style={{ fontSize:12.5, color:"var(--muted2)", lineHeight:1.5, marginBottom:12 }}>
            Personen får et link og opretter sin egen EatSafe-konto og styrer selv sine allergier. Når personen siger ja, er I i samme familie.
          </div>
          <div style={{ background:"var(--surface2)", borderRadius:10, padding:"12px 14px", marginBottom:12 }}><WhatIsShared /></div>
          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, marginBottom:12 }}>
            Linket virker i 24 timer og kun til én person. Du kan til enhver tid fjerne forbindelsen igen.
          </div>
          <button type="button" onClick={create} disabled={loading}
            style={{ ...BTN, width:"100%", background:"var(--green)", color:"var(--on-green)", border:"none", opacity: loading ? .6 : 1 }}>
            {loading ? "Opretter invitation…" : "Opret invitation"}
          </button>
          {error && <div style={{ fontSize:12, color:"var(--red)", marginTop:8 }}>{error}</div>}
        </>
      ) : (
        <>
          <div style={{ fontSize:12.5, color:"var(--ink2)", lineHeight:1.5, marginBottom:12 }}>
            Invitationen er klar. Send den til den, du vil invitere{expiresAt ? ` (linket virker ${formatExpiry(expiresAt)})` : ""}.
          </div>
          <InviteLinkActions token={token} />
          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, marginTop:10 }}>
            Når personen har oprettet sin konto, dukker vedkommende op her på siden.
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
            <TextLink onClick={cancel}>Annullér invitation</TextLink>
            <TextLink onClick={done}>Færdig</TextLink>
          </div>
        </>
      )}
    </div>
  );
}
