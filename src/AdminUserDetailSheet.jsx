// @ts-nocheck
import React from "react";
import { ALLERGENS, SUPABASE_URL } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";
import { Icon, showToast } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";

export default function AdminUserDetailSheet({
  openAdminUser, setOpenAdminUser, userId, accessToken,
  updateUserRole, deleteUser, setAdminSection, setSubmissionFilter, loadSubmissions,
}) {
  if (!openAdminUser) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9992, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end" }}
      onClick={e => e.target === e.currentTarget && setOpenAdminUser(null)}>
      <div style={UI.ubgsheet_br20px20px_p20px16px_w100_mxh90vh_ovyauto}
        onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={UI.udflex_aicenter_g12_mb16}>
              <div style={{ width:52, height:52, borderRadius:"50%", background: openAdminUser.role==="admin" ? "var(--surface2)" : "var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"var(--ink)", flexShrink:0 }}>
                {(openAdminUser.name||openAdminUser.email||"?").charAt(0).toUpperCase()}
              </div>
              <div style={UI.flex1}>
                <div style={UI.ufs18_fw900_cink}>{openAdminUser.name || "Ingen navn"}</div>
                <div style={UI.muted12mt2}>{openAdminUser.email}</div>
                <div style={{ display:"flex", gap:6, marginTop:6 }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:100, background: openAdminUser.role==="admin" ? "rgba(14,143,90,.2)" : "var(--surface2)", color: openAdminUser.role==="admin" ? "var(--green)" : "var(--muted)", display:"inline-flex", alignItems:"center", gap:4 }}>
                    <Icon name={openAdminUser.role==="admin" ? "shield" : "profile"} size={10} color={openAdminUser.role==="admin" ? "var(--green)" : "var(--muted)"} /> {openAdminUser.role==="admin" ? "Admin" : "Bruger"}
                  </span>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:100, background: openAdminUser.onboarding_completed ? "var(--green-lt)" : "var(--amber-lt)", color: openAdminUser.onboarding_completed ? "var(--green)" : "var(--amber)", display:"inline-flex", alignItems:"center", gap:4 }}>
                    <Icon name={openAdminUser.onboarding_completed ? "check" : "clock"} size={10} color={openAdminUser.onboarding_completed ? "var(--green)" : "var(--amber)"} /> {openAdminUser.onboarding_completed ? "Onboarding færdig" : "Onboarding mangler"}
                  </span>
                </div>
              </div>
              <button onClick={() => setOpenAdminUser(null)} aria-label="Luk"
                style={UI.ubgsurface2_bdnone_br50_w32_h32_curpointer_fs18_cmuted}>×</button>
            </div>

            {/* Info grid */}
            <div style={UI.sectionLbl8}>Kontoinfo</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 }}>
              {[
                ["calendar", "Oprettet", new Date(openAdminUser.created_at).toLocaleDateString("da-DK", { day:"numeric", month:"short", year:"numeric" })],
                ["key", "Login", openAdminUser.email?.includes("google") || openAdminUser.provider === "google" ? "Google OAuth" : "Email + kode"],
                [null, "Telefon", openAdminUser.phone || "—"],
                [null, "Alder", openAdminUser.birth_year ? (new Date().getFullYear() - openAdminUser.birth_year) + " år" : "—"],
                [null, "Bruger-ID", openAdminUser.id?.slice(0,12) + "…"],
                ["package", "Plan", openAdminUser.plan_id ? "Premium" : "Gratis"],
              ].map(([icon, label, val]) => (
                <div key={label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px" }}>
                  <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, marginBottom:3, display:"flex", alignItems:"center", gap:4 }}>{icon && <Icon name={icon} size={10} color="var(--muted)" />} {label}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Allergener */}
            {openAdminUser.allergens?.length > 0 && (
              <>
                <div style={UI.sectionLbl8}>Allergener & præferencer</div>
                <div style={UI.udflex_flewrap_g5_mb14}>
                  {openAdminUser.allergens.map(id => {
                    const a = ALLERGENS.find(x => x.id === id);
                    return a ? <span key={id} style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:100, background:"var(--red-lt)", color:"var(--red)", border:"1px solid var(--red-md)" }}>{a.emoji} {a.label}</span> : null;
                  })}
                </div>
              </>
            )}

            {/* Preferred stores */}
            {openAdminUser.preferred_stores?.length > 0 && (
              <>
                <div style={UI.sectionLbl8}>Foretrukne butikker</div>
                <div style={UI.udflex_flewrap_g5_mb14}>
                  {openAdminUser.preferred_stores.map((s,i) => (
                    <span key={i} style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:100, background:"var(--surface2)", color:"var(--ink)", border:"1px solid var(--border)", display:"inline-flex", alignItems:"center", gap:4 }}><Icon name="cart" size={10} color="var(--ink)" /> {s}</span>
                  ))}
                </div>
              </>
            )}

            {/* Handlinger */}
            {openAdminUser.id !== userId ? (
              <>
                <div style={UI.sectionLbl8}>Handlinger</div>
                <div style={UI.colGap8}>

                  {/* Rolle */}
                  <button onClick={() => {
                    const newRole = openAdminUser.role==="admin" ? "user" : "admin";
                    updateUserRole(openAdminUser.id, newRole);
                    setOpenAdminUser(u => ({ ...u, role: newRole }));
                  }}
                    style={{ width:"100%", padding:"14px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:12, fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <Icon name={openAdminUser.role==="admin" ? "profile" : "shield"} size={14} color="var(--ink)" /> {openAdminUser.role==="admin" ? "Skift til Bruger" : "Skift til Admin"}
                  </button>

                  {/* Onboarding */}
                  <div style={UI.rowGap8}>
                    <button onClick={async () => {
                      try {
                        await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${openAdminUser.id}`, { method:"PATCH", headers:{ ...makeHeaders(accessToken), "Prefer":"return=minimal" }, body: JSON.stringify({ onboarding_completed: true }) });
                        setOpenAdminUser(u => ({ ...u, onboarding_completed: true }));
                      } catch (e) { showToast(`Fejl: ${e.message}`, "error"); }
                    }}
                      style={{ flex:1, padding:"12px", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:12, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--green)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      <Icon name="check" size={13} color="var(--green)" /> Markér onboarding færdig
                    </button>
                    <button onClick={async () => {
                      try {
                        await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${openAdminUser.id}`, { method:"PATCH", headers:{ ...makeHeaders(accessToken), "Prefer":"return=minimal" }, body: JSON.stringify({ onboarding_completed: false }) });
                        setOpenAdminUser(u => ({ ...u, onboarding_completed: false }));
                      } catch (e) { showToast(`Fejl: ${e.message}`, "error"); }
                    }}
                      style={{ flex:1, padding:"12px", background:"var(--amber-lt)", border:"1px solid var(--amber-md)", borderRadius:12, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--amber)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      <Icon name="refresh" size={13} color="var(--amber)" /> Nulstil onboarding
                    </button>
                  </div>

                  {/* Se brugerens scanninger */}
                  <button onClick={async () => {
                    const data = await apiCall(`${SUPABASE_URL}/rest/v1/scan_history?user_id=eq.${openAdminUser.id}&select=ean,scanned_at,product_name&order=scanned_at.desc&limit=20`, { headers:{ ...makeHeaders(accessToken), "Accept":"application/json" } });
                    alert(`Seneste scanninger (${data.length}):\n\n${data.map(s => `${s.product_name||s.ean} — ${new Date(s.scanned_at).toLocaleDateString("da-DK")}`).join("\n") || "Ingen scanninger"}`);
                  }}
                    style={{ ...UI.uw100_p11px_bgsurface2_bd1pxsolid_br12_fff_fs12_fw700_cink_c, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <Icon name="barcode" size={13} color="var(--ink)" /> Se scanningshistorik
                  </button>

                  {/* Se brugerens indsendelser */}
                  <button onClick={() => {
                    setOpenAdminUser(null);
                    setAdminSection("submissions");
                    setSubmissionFilter("pending");
                    loadSubmissions("pending");
                  }}
                    style={{ ...UI.uw100_p11px_bgsurface2_bd1pxsolid_br12_fff_fs12_fw700_cink_c, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <Icon name="package" size={13} color="var(--ink)" /> Se indsendelser
                  </button>

                  {/* Kopiér bruger-info til Claude */}
                  <button onClick={() => {
                    const txt = `Bruger: ${openAdminUser.name} (${openAdminUser.email})\nRolle: ${openAdminUser.role}\nOprettet: ${new Date(openAdminUser.created_at).toLocaleDateString("da-DK")}\nOnboarding: ${openAdminUser.onboarding_completed ? "Færdig" : "Ikke færdig"}\nAllergener: ${openAdminUser.allergens?.join(", ") || "Ingen"}\nID: ${openAdminUser.id}`;
                    navigator.clipboard?.writeText(txt).then(() => showToast("Kopieret!")).catch(() => alert(txt));
                  }}
                    style={{ width:"100%", padding:"12px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:12, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <Icon name="link" size={13} color="var(--ink)" /> Kopiér info til Claude
                  </button>

                  {/* Slet */}
                  <button onClick={() => { deleteUser(openAdminUser.id); setOpenAdminUser(null); }}
                    style={{ width:"100%", padding:"14px", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:12, fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--red)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <Icon name="trash" size={14} color="var(--red)" /> Slet bruger permanent
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding:"12px", background:"var(--green-lt)", borderRadius:10, fontSize:13, color:"var(--green)", fontWeight:700, textAlign:"center" }}>
                Dette er din egen konto — kan ikke ændres
              </div>
            )}
          </div>
        </div>
  );
}
