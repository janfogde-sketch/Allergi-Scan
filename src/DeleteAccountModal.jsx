// @ts-nocheck
import React from "react";
import { Icon } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";

// ── Slet konto-modal — vist fra ProfileScreen via showDeleteAccount ──────────
export default function DeleteAccountModal({
  setShowDeleteAccount, deleteConfirmText, setDeleteConfirmText, deletingAccount, deleteOwnAccount,
}) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9997, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"flex-end" }}
      onClick={e => e.target === e.currentTarget && setShowDeleteAccount(false)}>
      <div style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0", padding:"24px 16px 40px", width:"100%" }}
        onClick={e => e.stopPropagation()}>

        <div style={UI.utacenter_mb20}>
          <div style={{ ...UI.ufs48_mb10, display:"flex", justifyContent:"center" }}><Icon name="warning" size={40} color="var(--red)" /></div>
          <div style={{ fontSize:19, fontWeight:900, color:"var(--red)", marginBottom:8 }}>Slet din konto</div>
          <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.7 }}>
            Dette sletter permanent alle dine data — allergier, familie, historik og præferencer. Handlingen kan ikke fortrydes.
          </div>
        </div>

        {/* Hvad slettes */}
        <div style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--red)", marginBottom:8 }}>FØLGENDE DATA SLETTES:</div>
          {["Din profil og login","Allergier og præferencer","Familiemedlemmer","Scanningshistorik","Indkøbslister","Feedback og tickets"].map(item => (
            <div key={item} style={{ fontSize:12, color:"var(--red)", padding:"3px 0", display:"flex", alignItems:"center", gap:8 }}>
              <Icon name="x" size={11} color="var(--red)" /><span>{item}</span>
            </div>
          ))}
        </div>

        {/* Bekræftelse */}
        <div style={UI.mb14}>
          <div style={UI.ufs13_fw700_cink_mb8}>
            Skriv <strong>"slet"</strong> for at bekræfte:
          </div>
          <input
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            placeholder="slet"
            autoCapitalize="none"
            style={{ width:"100%", padding:"14px 14px", border:`1.5px solid ${deleteConfirmText.toLowerCase()==="slet" ? "var(--red)" : "var(--border2)"}`, borderRadius:12, fontFamily:"var(--f)", fontSize:16, outline:"none", boxSizing:"border-box", background:"var(--surface2)", color:"var(--ink)" }}
          />
        </div>

        <button onClick={deleteOwnAccount} className="destructive-confirm-btn"
          disabled={deleteConfirmText.toLowerCase() !== "slet" || deletingAccount}
          style={{ width:"100%", padding:"16px", background: deleteConfirmText.toLowerCase()==="slet" ? "var(--red)" : "var(--border2)", border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:15, fontWeight:800, color:"var(--on-green)", cursor: deleteConfirmText.toLowerCase()==="slet" ? "pointer" : "not-allowed", boxShadow: deleteConfirmText.toLowerCase()==="slet" ? "var(--sh)" : "none", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {deletingAccount ? "Sletter…" : <><Icon name="trash" size={14} color="var(--on-green)" /> Slet min konto permanent</>}
        </button>

        <button onClick={() => setShowDeleteAccount(false)} className="plain-cancel-btn"
          style={{ width:"100%", padding:"14px", background:"none", border:"none", fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--muted)", cursor:"pointer" }}>
          Annullér — behold min konto
        </button>

      </div>
    </div>
  );
}
