// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, SCREENS, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { getAllergenLabels, initials } from "./helpers.js";
import { MemberForm } from "./MemberForm.jsx";

export default function AdminScreen({
  // State
  screen, setScreen,
  adminSection, setAdminSection,
  adminStats,
  adminUsers, adminUsersLoading,
  adminTickets, adminTicketFilter, setAdminTicketFilter,
  submissions, submissionsLoading, submissionFilter, setSubmissionFilter,
  openSubmission, setOpenSubmission,
  editingSubmission, setEditingSubmission,
  openAdminUser, setOpenAdminUser,
  openTicket, setOpenTicket,
  cleanedOcrText, cleaningOcr,
  userId, accessToken, user,
  setAllergens,
  setCustomAllerg,
  setCustomInput,
  setNewMemberAllerg,
  setNewMemberCustomAllerg,
  setNewMemberCustomInput,
  setNewMemberDiets,
  setNewMemberENumbers,
  setNewMemberName,
  setNewMemberSubtypes,
  allergens,
  customAllerg,
  customInput,
  family,
  newMemberAllerg,
  newMemberCustomAllerg,
  newMemberCustomInput,
  newMemberDiets,
  newMemberENumbers,
  newMemberName,
  newMemberSubtypes,
  addMember,
  removeMember,
  ticketsLoading,
  userSearch, setUserSearch,
  userSearchParam, setUserSearchParam,
  // Functions
  loadAdminStats, loadAdminUsers, loadSubmissions, loadTickets,
  updateUserRole, deleteUser,
  updateSubmissionAndApprove, rejectSubmission,
  updateTicketStatus, cleanOcrWithAI,
}) {
  return (
    <>
        {openTicket && (
          <div style={{ position:"fixed", inset:0, zIndex:9990, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end" }}
            onClick={e => e.target === e.currentTarget && setOpenTicket(null)}>
            <div style={{ background:"#1a3012", borderRadius:"20px 20px 0 0", padding:"20px 16px 140px", width:"100%", maxHeight:"90vh", overflowY:"auto" }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                <button onClick={() => setOpenTicket(null)}
                  style={{ background:"var(--surface2)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--muted)" }}>×</button>
                <div style={{ flex:1, fontSize:16, fontWeight:800, color:"var(--ink)" }}>🐛 Ticket #{openTicket.id?.slice(0,8)}</div>
              </div>

              {/* Status knapper */}
              <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                {[
                  { val:"open",        label:"🔴 Åben" },
                  { val:"in_progress", label:"🟡 I gang" },
                  { val:"resolved",    label:"🟢 Løst" },
                ].map(s => (
                  <button key={s.val} onClick={() => updateTicketStatus(openTicket.id, s.val)}
                    style={{ flex:1, padding:"8px 4px", borderRadius:10, border:`1.5px solid ${openTicket.status===s.val?"var(--green)":"var(--border)"}`,
                      background: openTicket.status===s.val ? "var(--green-lt)" : "var(--surface)",
                      fontFamily:"var(--f)", fontSize:10, fontWeight:700,
                      color: openTicket.status===s.val ? "var(--green)" : "var(--muted)", cursor:"pointer" }}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Beskrivelse */}
              <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:10 }}>
                <div style={{ fontSize:11, color:"var(--muted)", fontWeight:700, marginBottom:6 }}>BESKRIVELSE</div>
                <div style={{ fontSize:14, color:"var(--ink)", lineHeight:1.7 }}>{openTicket.description}</div>
              </div>

              {/* Skærmbillede */}
              {openTicket.image_base64 && (
                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:10 }}>
                  <div style={{ fontSize:11, color:"var(--muted)", fontWeight:700, marginBottom:8 }}>SKÆRMBILLEDE</div>
                  <img src={`data:image/jpeg;base64,${openTicket.image_base64}`} alt="Screenshot"
                    style={{ width:"100%", borderRadius:8, objectFit:"contain" }} />
                </div>
              )}

              {/* Diagnostisk info */}
              {openTicket.context && (
                <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:10 }}>
                  <div style={{ fontSize:11, color:"var(--muted)", fontWeight:700, marginBottom:8 }}>📊 DIAGNOSTISK INFO</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {[
                      ["Bruger",      openTicket.context.user_name || "Anonym"],
                      ["Email",       openTicket.context.user_email || "—"],
                      ["Skærm",       openTicket.context.screen_label || openTicket.context.screen || "—"],
                      ["Side-ID",     openTicket.context.page_id || "—"],
                      ["Enhed",       /iPhone|iPad/.test(openTicket.context.user_agent||"")?"iOS":/Android/.test(openTicket.context.user_agent||"")?"Android":"Desktop"],
                      ["Viewport",    openTicket.context.viewport || "—"],
                      ["Skærmstørrelse", openTicket.context.screen_size || "—"],
                      ["Rolle",       openTicket.context.user_role || "—"],
                      ["Version",     openTicket.context.app_version || "—"],
                      ["Build",       openTicket.context.build_time
                        ? new Date(openTicket.context.build_time).toLocaleString("da-DK", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
                        : "—"],
                      ["Commit",      openTicket.context.commit_sha || "—"],
                      ["Allergener",  openTicket.context.allergens_count ?? "—"],
                      ["Familie",     openTicket.context.family_count ?? "—"],
                      ["Scanninger",  openTicket.context.history_count ?? "—"],
                      ["Online",      openTicket.context.online ? "Ja" : "Nej"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background:"var(--surface)", borderRadius:8, padding:"8px 10px" }}>
                        <div style={{ fontSize:9, color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:".4px" }}>{k}</div>
                        <div style={{ fontSize:12, fontWeight:600, color:"var(--ink)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v ?? "—"}</div>
                      </div>
                    ))}
                  </div>

                  {/* Aktive allergener — bred celle */}
                  {openTicket.context.allergens?.length > 0 && (
                    <div style={{ background:"var(--surface)", borderRadius:8, padding:"8px 10px", marginTop:6 }}>
                      <div style={{ fontSize:9, color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:".4px", marginBottom:4 }}>ALLERGENER</div>
                      <div style={{ fontSize:11, color:"var(--ink)", fontWeight:600 }}>{openTicket.context.allergens.join(", ")}</div>
                    </div>
                  )}

                  {/* Produkt-kontekst hvis tilgængelig */}
                  {(openTicket.context.scan_result_name || openTicket.context.scan_result_ean) && (
                    <div style={{ background:"var(--surface)", borderRadius:8, padding:"8px 10px", marginTop:6 }}>
                      <div style={{ fontSize:9, color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:".4px", marginBottom:4 }}>PRODUKT VED FEEDBACK</div>
                      <div style={{ fontSize:11, color:"var(--ink)", fontWeight:600 }}>
                        {openTicket.context.scan_result_name || "—"} {openTicket.context.scan_result_ean ? `[EAN: ${openTicket.context.scan_result_ean}]` : ""}
                      </div>
                    </div>
                  )}

                  {/* Madpas-sprog hvis relevant */}
                  {openTicket.context.madpas_lang && (
                    <div style={{ background:"var(--surface)", borderRadius:8, padding:"8px 10px", marginTop:6 }}>
                      <div style={{ fontSize:9, color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:".4px", marginBottom:4 }}>MADPAS SPROG</div>
                      <div style={{ fontSize:11, color:"var(--ink)", fontWeight:600 }}>{openTicket.context.madpas_lang}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Kopi til Claude */}
              <div style={{ background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:12, padding:"14px", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>📋 Send til Claude til fejlretning</div>
                <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.6, marginBottom:10 }}>
                  Kopiér nedenstående og indsæt direkte i Claude-chatten:
                </div>
                <button onClick={() => {
                  const ctx = openTicket.context || {};
                  const buildStr = ctx.build_time
                    ? new Date(ctx.build_time).toLocaleString("da-DK", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
                    : "—";
                  const txt = `EatSafe Beta — Bug Report #${openTicket.id?.slice(0,8)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: ${openTicket.type}
Tidspunkt: ${new Date(openTicket.created_at).toLocaleString("da-DK")}

SKÆRM
  Beskrivelse: ${ctx.screen_label || ctx.screen || "—"}
  Side-ID:     ${ctx.page_id || "—"}
  URL:         ${ctx.url || "—"}

BRUGER
  Navn:        ${ctx.user_name || "Anonym"}
  Email:       ${ctx.user_email || "—"}
  Rolle:       ${ctx.user_role || "—"}
  Allergener:  ${ctx.allergens?.join(", ") || `${ctx.allergens_count ?? "—"} stk`}
  Familie:     ${ctx.family_count ?? "—"} profiler
  Scanninger:  ${ctx.history_count ?? "—"}

ENHED
  Platform:    ${ctx.platform || "—"}
  Viewport:    ${ctx.viewport || "—"}
  Skærm:       ${ctx.screen_size || "—"}
  Enhed:       ${/iPhone|iPad/.test(ctx.user_agent||"")?"iOS":/Android/.test(ctx.user_agent||"")?"Android":"Desktop"}
  Online:      ${ctx.online ? "Ja" : "Nej"}
  Sprog:       ${ctx.language || "—"}

BUILD
  Version:     ${ctx.app_version || "—"}
  Build:       ${buildStr}
  Commit:      ${ctx.commit_sha || "—"}
${ctx.scan_result_name ? `
PRODUKT VED FEEDBACK
  Navn:        ${ctx.scan_result_name}
  EAN:         ${ctx.scan_result_ean || "—"}` : ""}${ctx.madpas_lang ? `
MADPAS
  Sprog:       ${ctx.madpas_lang}` : ""}${ctx.selected_recipe ? `
OPSKRIFT
  Navn:        ${ctx.selected_recipe}` : ""}

BESKRIVELSE
${openTicket.description}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
                  navigator.clipboard?.writeText(txt).then(() => alert("Kopieret til udklipsholder!")).catch(() => alert(txt));
                }}
                  style={{ width:"100%", background:"var(--green)", border:"none", borderRadius:10, padding:"10px", fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"#071510", cursor:"pointer" }}>
                  📋 Kopiér til Claude
                </button>
              </div>

              <button onClick={() => setOpenTicket(null)}
                style={{ width:"100%", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"10px", fontFamily:"var(--f)", fontSize:13, fontWeight:600, color:"var(--ink)", cursor:"pointer" }}>
                Luk
              </button>
            </div>
          </div>
        )}

        {/* ══ FAMILIE ══ */}
        {screen === SCREENS.FAMILY && (
          <div className="screen fade-in" style={{ paddingBottom:120 }}>
            <div className="screen-title">Familie</div>
            <div className="screen-sub">Administrér familiemedlemmers allergiprofiler.</div>
            <div className="card" style={{ padding:"12px 14px" }}>
              <div className="card-lbl">Aktive profiler ved scanning</div>
              <FamilyChips />
            </div>
            {family.length===0 && <div className="empty-state"><div className="empty-txt">Ingen familiemedlemmer endnu</div><div className="empty-sub">Tilføj nedenfor</div></div>}
            {family.map(m => (
              <div key={m.id} className="family-member">
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:m.allergens.length?10:0 }}>
                  <div className="fm-avatar" style={{ background:m.color, color:"#fff" }}>{initials(m.name)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:15 }}>{m.name}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{m.allergens.length} allergi{m.allergens.length!==1?"er":""}</div>
                  </div>
                  <span style={{ cursor:"pointer", opacity:.35, fontSize:18, padding:4 }} onClick={() => removeMember(m.id)}><Icon name="trash" size={18} color="var(--muted)" /></span>
                </div>
                {m.allergens.length>0 && <div className="tags">{getAllergenLabels(m.allergens,m.custom||[]).map((a,j) => <div key={j} className="tag" style={{ fontSize:11 }}>{a}</div>)}</div>}
              </div>
            ))}
            <div className="card">
              <div className="card-title">+ Tilføj familiemedlem</div>
              <label className="field-lbl" style={{ marginTop:8 }}>Navn</label>
              <input className="field" placeholder="Fx. Peter (12 år)" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} style={{ marginBottom:12 }} />
              <MemberForm
                name={newMemberName} setName={setNewMemberName}
                allergens={newMemberAllerg} setAllergens={setNewMemberAllerg}
                customAllerg={newMemberCustomAllerg} setCustomAllerg={setNewMemberCustomAllerg}
                subtypes={newMemberSubtypes} setSubtypes={setNewMemberSubtypes}
                diets={newMemberDiets} setDiets={setNewMemberDiets}
                eNumbers={newMemberENumbers} setENumbers={setNewMemberENumbers}
                customInput={newMemberCustomInput} setCustomInput={setNewMemberCustomInput}
                onAdd={addMember}
                addLabel={`+ Tilføj ${newMemberName||"familiemedlem"}`}
              />
            </div>
          </div>
        )}

        {/* ══ ADMIN ══ */}
        {screen === SCREENS.ADMIN && !openSubmission && !openTicket && (
          <div className="screen fade-in" style={{ paddingBottom:120 }}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 0 14px" }}>
              <button onClick={() => setScreen(SCREENS.PROFILE)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2"><path strokeLinecap="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div style={{ flex:1, fontSize:18, fontWeight:900, color:"var(--ink)" }}>🛡️ Admin</div>
              <button onClick={() => { loadAdminStats(); if (adminSection==="submissions") loadSubmissions(submissionFilter); if (adminSection==="tickets") loadTickets(); }}
                style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:"6px 12px", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer" }}>
                🔄
              </button>
            </div>

            {/* Sektion tabs — store knapper */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
              {[
                { id:"dashboard",   emoji:"📊", label:"Dashboard" },
                { id:"users",       emoji:"👥", label:"Brugere" },
                { id:"submissions", emoji:"📦", label:"Indsendelser" },
                { id:"tickets",     emoji:"🐛", label:"Tickets" },
              ].map(s => (
                <button key={s.id}
                  onClick={() => {
                    setAdminSection(s.id);
                    if (s.id === "submissions") loadSubmissions(submissionFilter);
                    if (s.id === "tickets") loadTickets();
                    if (s.id === "dashboard") loadAdminStats();
                    if (s.id === "users") loadAdminUsers();
                  }}
                  style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:4, padding:"14px 16px",
                    background: adminSection===s.id ? "var(--green-lt)" : "var(--surface)",
                    border: `1.5px solid ${adminSection===s.id ? "var(--green)" : "var(--border)"}`,
                    borderRadius:14, cursor:"pointer", boxShadow:"var(--sh)", fontFamily:"var(--f)", textAlign:"left" }}>
                  <span style={{ fontSize:22 }}>{s.emoji}</span>
                  <span style={{ fontSize:13, fontWeight:800, color: adminSection===s.id ? "var(--green)" : "var(--ink)" }}>{s.label}</span>
                </button>
              ))}
            </div>

            {/* ── DASHBOARD ── */}
            {adminSection === "dashboard" && (
              <div className="fade-in">
                <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Brugere</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                  {[
                    { n:adminStats?.total_users,     emoji:"👤", label:"Brugere i alt",   color:"var(--ink)" },
                    { n:adminStats?.new_users_today,  emoji:"🆕", label:"Nye i dag",        color:"var(--green)" },
                    { n:adminStats?.total_scans,      emoji:"📱", label:"Scanninger i alt", color:"var(--ink)" },
                    { n:adminStats?.scans_today,      emoji:"⚡", label:"Scanninger i dag", color:"var(--amber)" },
                  ].map(({ n, emoji, label, color }) => (
                    <div key={label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"16px 14px", boxShadow:"var(--sh)" }}>
                      <div style={{ fontSize:24, marginBottom:4 }}>{emoji}</div>
                      <div style={{ fontSize:28, fontWeight:900, color, lineHeight:1 }}>{n ?? "—"}</div>
                      <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600, marginTop:4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Database & opgaver</div>
                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", marginBottom:14, boxShadow:"var(--sh)" }}>
                  {[
                    { emoji:"📦", label:"Produkter i databasen",   n:adminStats?.total_products,        color:"var(--ink)" },
                    { emoji:"👨‍👩‍👧", label:"Familiemedlemmer oprettet", n:adminStats?.total_families,         color:"var(--ink)" },
                    { emoji:"⏳", label:"Indsendelser afventer",   n:adminStats?.pending_submissions,    color:"var(--amber)", action:() => { setAdminSection("submissions"); setSubmissionFilter("pending"); loadSubmissions("pending"); } },
                    { emoji:"🐛", label:"Åbne tickets",             n:adminStats?.open_tickets,           color:"var(--red)",   action:() => { setAdminSection("tickets"); loadTickets(); } },
                  ].map(({ emoji, label, n, color, action }, i, arr) => (
                    <div key={label} onClick={action}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none", cursor: action ? "pointer" : "default" }}>
                      <span style={{ fontSize:20 }}>{emoji}</span>
                      <span style={{ flex:1, fontSize:13, color:"var(--ink)", fontWeight:500 }}>{label}</span>
                      <span style={{ fontSize:18, fontWeight:900, color }}>{n ?? "—"}</span>
                      {action && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>}
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Hurtige handlinger</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { emoji:"📦", label:"Godkend indsendelser", color:"var(--amber)", fn:() => { setAdminSection("submissions"); setSubmissionFilter("pending"); loadSubmissions("pending"); } },
                    { emoji:"🐛", label:"Gennemse tickets",     color:"var(--red)",   fn:() => { setAdminSection("tickets"); loadTickets(); } },
                    { emoji:"✅", label:"Godkendte produkter",  color:"var(--green)", fn:() => { setAdminSection("submissions"); setSubmissionFilter("approved"); loadSubmissions("approved"); } },
                    { emoji:"👥", label:"Administrér brugere",  color:"var(--ink)",   fn:() => { setAdminSection("users"); loadAdminUsers(); } },
                  ].map(({ emoji, label, color, fn }) => (
                    <button key={label} onClick={fn}
                      style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:6, padding:"14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", boxShadow:"var(--sh)", fontFamily:"var(--f)", textAlign:"left" }}>
                      <span style={{ fontSize:24 }}>{emoji}</span>
                      <span style={{ fontSize:12, fontWeight:700, color }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── BRUGERE ── */}
            {adminSection === "users" && (
              <div className="fade-in">

                {/* Søgebar */}
                <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                  <input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Søg bruger…"
                    style={{ flex:1, padding:"10px 14px", border:"1.5px solid var(--border2)", borderRadius:10, fontFamily:"var(--f)", fontSize:14, background:"var(--surface)", outline:"none", color:"var(--ink)" }}
                  />
                  {userSearch && (
                    <button onClick={() => setUserSearch("")}
                      style={{ padding:"0 12px", border:"1px solid var(--border)", borderRadius:10, background:"var(--surface2)", fontFamily:"var(--f)", fontSize:12, color:"var(--muted)", cursor:"pointer" }}>
                      ✕
                    </button>
                  )}
                </div>

                {/* Søge-parameter — dropdown */}
                <div style={{ marginBottom:12 }}>
                  <select value={userSearchParam} onChange={e => setUserSearchParam(e.target.value)}
                    style={{ width:"100%", padding:"10px 14px", border:"1.5px solid var(--border2)", borderRadius:10, fontFamily:"var(--f)", fontSize:14, background:"var(--surface)", color:"var(--ink)", outline:"none", cursor:"pointer" }}>
                    <option value="all">🔍 Alle felter</option>
                    <option value="name">👤 Søg på navn</option>
                    <option value="email">📧 Søg på email</option>
                    <option value="role">🛡️ Søg på rolle</option>
                    <option value="admin">🛡️ Kun admins</option>
                    <option value="incomplete">⏳ Ufærdig onboarding</option>
                  </select>
                </div>

                {/* Tæller */}
                {(() => {
                  const filtered = adminUsers.filter(u => {
                    if (userSearchParam === "admin") return u.role === "admin";
                    if (userSearchParam === "incomplete") return u.onboarding_completed === false;
                    if (!userSearch.trim()) return true;
                    const q = userSearch.toLowerCase();
                    if (userSearchParam === "name") return (u.name||"").toLowerCase().includes(q);
                    if (userSearchParam === "email") return (u.email||"").toLowerCase().includes(q);
                    if (userSearchParam === "role") return (u.role||"").toLowerCase().includes(q);
                    if (userSearchParam === "onboarding") return String(u.onboarding_completed).includes(q);
                    return (u.name||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q);
                  });
                  return (
                    <>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>
                        {filtered.length} af {adminUsers.length} brugere
                      </div>
                      {adminUsersLoading && <div style={{ textAlign:"center", padding:"32px 0" }}><div style={{ width:36, height:36, border:"3px solid var(--border2)", borderTopColor:"var(--ink)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto" }} /></div>}
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {filtered.map(u => (
                          <div key={u.id} onClick={() => setOpenAdminUser(u)}
                            style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", boxShadow:"var(--sh)", cursor:"pointer" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ width:38, height:38, borderRadius:"50%", background: u.role==="admin" ? "var(--surface2)" : "var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", flexShrink:0 }}>
                                {(u.name||u.email||"?").charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name || "Ingen navn"}</div>
                                <div style={{ fontSize:11, color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                              </div>
                              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:100, background: u.role==="admin" ? "rgba(74,222,128,.2)" : "var(--surface2)", color: u.role==="admin" ? "var(--green)" : "var(--muted)", border: `1px solid ${u.role==="admin" ? "var(--green-mid)" : "var(--border)"}` }}>
                                  {u.role==="admin" ? "Admin" : "Bruger"}
                                </span>
                                {u.onboarding_completed === false && <span style={{ fontSize:9, color:"var(--amber)", fontWeight:700 }}>Onboarding ufærdig</span>}
                                {u.id === userId && <span style={{ fontSize:9, color:"var(--green)", fontWeight:700 }}>← Dig</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── SUBMISSIONS ── */}

            {/* ── SUBMISSIONS ── */}
            {adminSection === "submissions" && (
              <div className="fade-in">
                <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                  {[
                    { val:"pending",  label:"⏳ Afventer", color:"var(--amber)" },
                    { val:"approved", label:"✅ Godkendt",  color:"var(--green)" },
                    { val:"rejected", label:"❌ Afvist",    color:"var(--red)" },
                  ].map(({ val, label, color }) => (
                    <button key={val} onClick={() => { setSubmissionFilter(val); loadSubmissions(val); }}
                      style={{ flex:1, padding:"9px 4px", borderRadius:10, border:`1.5px solid ${submissionFilter===val ? color : "var(--border)"}`,
                        background: submissionFilter===val ? (val==="pending"?"var(--amber-lt)":val==="approved"?"var(--green-lt)":"var(--red-lt)") : "var(--surface)",
                        fontFamily:"var(--f)", fontSize:11, fontWeight:700,
                        color: submissionFilter===val ? color : "var(--muted)", cursor:"pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>
                {submissionsLoading && <div style={{ textAlign:"center", padding:"32px 0" }}><div style={{ width:36, height:36, border:"3px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto" }} /></div>}
                {!submissionsLoading && submissions.length === 0 && (
                  <div style={{ textAlign:"center", padding:"48px 0" }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>{submissionFilter==="pending"?"🎉":"📭"}</div>
                    <div style={{ fontSize:16, fontWeight:800, color:"var(--ink)" }}>{submissionFilter==="pending" ? "Ingen afventer" : "Ingen indsendelser"}</div>
                  </div>
                )}
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {submissions.map(s => {
                    const flags = s.ai_parsed_data || {};
                    const dangerAllergens = ALLERGENS.filter(a => flags[a.id]==="yes" || flags[a.id]===true);
                    const daysSince = Math.floor((Date.now() - new Date(s.created_at).getTime()) / 86400000);
                    return (
                      <div key={s.id} onClick={() => { setOpenSubmission(s); setEditingSubmission({ name: s.ai_parsed_data?.name || s.product_name || "", brand: s.ai_parsed_data?.brand || s.brand || "", allergen_flags: s.ai_parsed_data || {} }); }}
                        style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", cursor:"pointer", boxShadow:"var(--sh)" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                          <div style={{ width:48, height:48, borderRadius:10, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>📦</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.ai_parsed_data?.name || s.product_name || "Ukendt produkt"}</div>
                            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:6, fontFamily:"monospace" }}>EAN: {s.ean} · {daysSince === 0 ? "i dag" : `${daysSince}d siden`}</div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                              {dangerAllergens.slice(0,3).map(a => <span key={a.id} style={{ fontSize:10, padding:"2px 7px", borderRadius:100, background:"var(--red-lt)", color:"var(--red)", fontWeight:700 }}>{a.emoji} {a.label}</span>)}
                              {dangerAllergens.length === 0 && <span style={{ fontSize:10, color:"var(--muted)" }}>Ingen allergener</span>}
                            </div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TICKETS ── */}
            {adminSection === "tickets" && (
              <div className="fade-in">
                {/* Status tæller grid — klikbar filter */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:12 }}>
                  {[
                    { status:"all",         label:"Alle",   color:"var(--ink3)" },
                    { status:"open",        label:"Åbne",   color:"var(--red)" },
                    { status:"in_progress", label:"I gang", color:"var(--amber)" },
                    { status:"resolved",    label:"Løst",   color:"var(--green)" },
                  ].map(s => {
                    const count = s.status === "all" ? adminTickets.length : adminTickets.filter(t => t.status === s.status).length;
                    const isActive = adminTicketFilter === s.status;
                    return (
                      <div key={s.status} onClick={() => setAdminTicketFilter(s.status)}
                        style={{ background: isActive ? s.color : "var(--surface)", border:`1.5px solid ${isActive ? s.color : "var(--border)"}`, borderRadius:10, padding:"10px 6px", textAlign:"center", cursor:"pointer", transition:"all .15s",
                          gridColumn: s.status === "all" ? "1 / -1" : "auto" }}>
                        <div style={{ fontSize:18, fontWeight:900, color: isActive ? "#071510" : s.color }}>{count}</div>
                        <div style={{ fontSize:9, color: isActive ? "rgba(255,255,255,.8)" : "var(--muted)", fontWeight:700, textTransform:"uppercase" }}>{s.label}</div>
                      </div>
                    );
                  })}
                </div>
                {/* Download åbne tickets */}
                {!ticketsLoading && adminTickets.filter(t => t.status === "open").length > 0 && (
                  <button onClick={() => {
                    const filtered = adminTickets.filter(t => t.status === "open");
                    const typeLabels = { bug:"Fejl", ui:"Design", missing:"Mangler", content:"Indhold", crash:"Crash", suggestion:"Forslag" };
                    const statusLabels = { open:"Åben", in_progress:"I gang", resolved:"Løst" };
                    const lines = filtered.map((t, i) => {
                      const dato = new Date(t.created_at).toLocaleString("da-DK", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
                      return [
                        `── Ticket ${i + 1} ──────────────────────────────`,
                        `Type:    ${typeLabels[t.type] || t.type}`,
                        `Status:  ${statusLabels[t.status] || t.status}`,
                        `Bruger:  ${t.context?.user_name || "Anonym"} (${t.context?.user_email || "—"})`,
                        `Skærm:   ${t.context?.screen_label || t.context?.screen || "—"}`,
                        `Enhed:   ${/iPhone|iPad/.test(t.context?.user_agent||"")?"iOS":/Android/.test(t.context?.user_agent||"")?"Android":"Desktop"}`,
                        `Dato:    ${dato}`,
                        ``,
                        t.description || "(ingen beskrivelse)",
                        ``,
                      ].join("\n");
                    });
                    const text = `EatSafe Tickets — Åbne (${filtered.length} stk)\nEksporteret: ${new Date().toLocaleString("da-DK")}\n\n` + lines.join("\n");
                    const blob = new Blob([text], { type:"text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `eatsafe-tickets-open-${new Date().toISOString().slice(0,10)}.txt`;
                    a.click(); URL.revokeObjectURL(url);
                  }} style={{
                    width:"100%", padding:"10px", marginBottom:12, borderRadius:10,
                    background:"var(--surface2)", border:"1px solid var(--border)",
                    fontFamily:"var(--f)", fontSize:12, fontWeight:700,
                    color:"var(--ink2)", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  }}>
                    📥 Download åbne tickets ({adminTickets.filter(t => t.status === "open").length})
                  </button>
                )}

                {ticketsLoading && <div style={{ textAlign:"center", padding:"32px 0" }}><div style={{ width:36, height:36, border:"3px solid var(--border2)", borderTopColor:"var(--ink)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto" }} /></div>}
                {!ticketsLoading && adminTickets.length === 0 && <div style={{ textAlign:"center", padding:"48px 0" }}><div style={{ fontSize:48, marginBottom:12 }}>🎉</div><div style={{ fontSize:16, fontWeight:800, color:"var(--ink)" }}>Ingen tickets</div></div>}
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {adminTickets.filter(t => adminTicketFilter === "all" || t.status === adminTicketFilter).map(t => {
                    const typeConfig = { bug:{emoji:"🐛",color:"var(--red)",bg:"var(--red-lt)",label:"Fejl"}, ui:{emoji:"🎨",color:"var(--amber)",bg:"var(--amber-lt)",label:"Design"}, missing:{emoji:"💡",color:"var(--amber)",bg:"var(--amber-lt)",label:"Mangler"}, content:{emoji:"📦",color:"var(--ink3)",bg:"var(--surface2)",label:"Indhold"}, crash:{emoji:"💥",color:"var(--red)",bg:"var(--red-lt)",label:"Crash"}, suggestion:{emoji:"✨",color:"var(--green)",bg:"var(--green-lt)",label:"Forslag"} };
                    const cfg = typeConfig[t.type] || typeConfig.bug;
                    const statusColor = t.status==="open"?"var(--red)":t.status==="in_progress"?"var(--amber)":t.status==="resolved"?"var(--green)":"var(--muted)";
                    const statusLabel = t.status==="open"?"Åben":t.status==="in_progress"?"I gang":t.status==="resolved"?"Løst":"Lukket";
                    return (
                      <div key={t.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", boxShadow:"var(--sh)" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }} onClick={() => setOpenTicket(t)}>
                          <div style={{ width:38, height:38, borderRadius:10, background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{cfg.emoji}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:cfg.color, background:cfg.bg, padding:"2px 8px", borderRadius:100 }}>{cfg.label}</span>
                            </div>
                            <div style={{ fontSize:13, color:"var(--ink)", lineHeight:1.4, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.description}</div>
                            <div style={{ fontSize:10, color:"var(--muted)" }}>{t.context?.user_name || "Anonym"} · {t.context?.screen_label || t.context?.screen || "—"} · {new Date(t.created_at).toLocaleDateString("da-DK", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0, marginTop:4 }}><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
                        </div>
                        {/* Status toggle direkte på kortet */}
                        <div style={{ display:"flex", gap:5, marginTop:10, paddingTop:10, borderTop:"1px solid var(--border)" }}>
                          {[
                            { val:"open",        label:"Åben",   color:"var(--red)" },
                            { val:"in_progress", label:"I gang", color:"var(--amber)" },
                            { val:"resolved",    label:"Løst",   color:"var(--green)" },
                          ].map(s => (
                            <button key={s.val} onClick={() => updateTicketStatus(t.id, s.val)}
                              style={{ flex:1, padding:"5px 2px", borderRadius:8, border:`1px solid ${t.status===s.val ? s.color : "var(--border)"}`,
                                background: t.status===s.val ? s.color : "var(--surface2)",
                                fontFamily:"var(--f)", fontSize:9, fontWeight:700,
                                color: t.status===s.val ? "#071510" : "var(--muted)", cursor:"pointer" }}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}


        {screen === SCREENS.ADMIN && openAdminUser && (
          <div style={{ position:"fixed", inset:0, zIndex:9992, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end" }}
            onClick={e => e.target === e.currentTarget && setOpenAdminUser(null)}>
            <div style={{ background:"#1a3012", borderRadius:"20px 20px 0 0", padding:"20px 16px 140px", width:"100%", maxHeight:"90vh", overflowY:"auto" }}
              onClick={e => e.stopPropagation()}>

                  {/* Header */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                    <div style={{ width:52, height:52, borderRadius:"50%", background: openAdminUser.role==="admin" ? "var(--surface2)" : "var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"#fff", flexShrink:0 }}>
                      {(openAdminUser.name||openAdminUser.email||"?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:18, fontWeight:900, color:"var(--ink)" }}>{openAdminUser.name || "Ingen navn"}</div>
                      <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{openAdminUser.email}</div>
                      <div style={{ display:"flex", gap:6, marginTop:5 }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:100, background: openAdminUser.role==="admin" ? "rgba(74,222,128,.2)" : "var(--surface2)", color: openAdminUser.role==="admin" ? "var(--green)" : "var(--muted)" }}>
                          {openAdminUser.role==="admin" ? "🛡️ Admin" : "👤 Bruger"}
                        </span>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:100, background: openAdminUser.onboarding_completed ? "var(--green-lt)" : "var(--amber-lt)", color: openAdminUser.onboarding_completed ? "var(--green)" : "var(--amber)" }}>
                          {openAdminUser.onboarding_completed ? "✓ Onboarding færdig" : "⏳ Onboarding mangler"}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setOpenAdminUser(null)}
                      style={{ background:"var(--surface2)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--muted)" }}>×</button>
                  </div>

                  {/* Info grid */}
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Kontoinfo</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 }}>
                    {[
                      ["📅 Oprettet", new Date(openAdminUser.created_at).toLocaleDateString("da-DK", { day:"numeric", month:"short", year:"numeric" })],
                      ["🔑 Login", openAdminUser.email?.includes("google") || openAdminUser.provider === "google" ? "Google OAuth" : "Email + kode"],
                      ["📱 Telefon", openAdminUser.phone || "—"],
                      ["🎂 Alder", openAdminUser.age ? openAdminUser.age + " år" : "—"],
                      ["🆔 Bruger-ID", openAdminUser.id?.slice(0,12) + "…"],
                      ["📋 Plan", openAdminUser.plan_id ? "Premium" : "Gratis"],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px" }}>
                        <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, marginBottom:3 }}>{label}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Allergener */}
                  {openAdminUser.allergens?.length > 0 && (
                    <>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Allergener & præferencer</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
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
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Foretrukne butikker</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
                        {openAdminUser.preferred_stores.map((s,i) => (
                          <span key={i} style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:100, background:"var(--surface2)", color:"var(--ink)", border:"1px solid var(--border)" }}>🛒 {s}</span>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Handlinger */}
                  {openAdminUser.id !== userId ? (
                    <>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Handlinger</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

                        {/* Rolle */}
                        <button onClick={() => {
                          const newRole = openAdminUser.role==="admin" ? "user" : "admin";
                          updateUserRole(openAdminUser.id, newRole);
                          setOpenAdminUser(u => ({ ...u, role: newRole }));
                        }}
                          style={{ width:"100%", padding:"13px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:12, fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                          {openAdminUser.role==="admin" ? "👤 Skift til Bruger" : "🛡️ Skift til Admin"}
                        </button>

                        {/* Onboarding */}
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={async () => {
                            await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${openAdminUser.id}`, { method:"PATCH", headers:{ "Content-Type":"application/json", "apikey":SUPABASE_ANON_KEY, "Authorization":`Bearer ${accessToken}`, "Prefer":"return=minimal" }, body: JSON.stringify({ onboarding_completed: true }) });
                            setOpenAdminUser(u => ({ ...u, onboarding_completed: true }));
                          }}
                            style={{ flex:1, padding:"11px", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:12, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--green)", cursor:"pointer" }}>
                            ✅ Markér onboarding færdig
                          </button>
                          <button onClick={async () => {
                            await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${openAdminUser.id}`, { method:"PATCH", headers:{ "Content-Type":"application/json", "apikey":SUPABASE_ANON_KEY, "Authorization":`Bearer ${accessToken}`, "Prefer":"return=minimal" }, body: JSON.stringify({ onboarding_completed: false }) });
                            setOpenAdminUser(u => ({ ...u, onboarding_completed: false }));
                          }}
                            style={{ flex:1, padding:"11px", background:"var(--amber-lt)", border:"1px solid var(--amber-md)", borderRadius:12, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--amber)", cursor:"pointer" }}>
                            🔄 Nulstil onboarding
                          </button>
                        </div>

                        {/* Se brugerens scanninger */}
                        <button onClick={async () => {
                          const res = await fetch(`${SUPABASE_URL}/rest/v1/scan_history?user_id=eq.${openAdminUser.id}&select=ean,scanned_at,product_name&order=scanned_at.desc&limit=20`, { headers:{ "apikey":SUPABASE_ANON_KEY, "Authorization":`Bearer ${accessToken}`, "Accept":"application/json" } });
                          const data = await res.json();
                          alert(`Seneste scanninger (${data.length}):\n\n${data.map(s => `${s.product_name||s.ean} — ${new Date(s.scanned_at).toLocaleDateString("da-DK")}`).join("\n") || "Ingen scanninger"}`);
                        }}
                          style={{ width:"100%", padding:"11px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer" }}>
                          📱 Se scanningshistorik
                        </button>

                        {/* Se brugerens indsendelser */}
                        <button onClick={() => {
                          setOpenAdminUser(null);
                          setAdminSection("submissions");
                          setSubmissionFilter("pending");
                          loadSubmissions("pending");
                        }}
                          style={{ width:"100%", padding:"11px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer" }}>
                          📦 Se indsendelser
                        </button>

                        {/* Kopiér bruger-info til Claude */}
                        <button onClick={() => {
                          const txt = `Bruger: ${openAdminUser.name} (${openAdminUser.email})\nRolle: ${openAdminUser.role}\nOprettet: ${new Date(openAdminUser.created_at).toLocaleDateString("da-DK")}\nOnboarding: ${openAdminUser.onboarding_completed ? "Færdig" : "Ikke færdig"}\nAllergener: ${openAdminUser.allergens?.join(", ") || "Ingen"}\nID: ${openAdminUser.id}`;
                          navigator.clipboard?.writeText(txt).then(() => alert("Kopieret!")).catch(() => alert(txt));
                        }}
                          style={{ width:"100%", padding:"11px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:12, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer" }}>
                          📋 Kopiér info til Claude
                        </button>

                        {/* Slet */}
                        <button onClick={() => { deleteUser(openAdminUser.id); setOpenAdminUser(null); }}
                          style={{ width:"100%", padding:"13px", background:"var(--red-lt)", border:"1.5px solid var(--red-md)", borderRadius:12, fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--red)", cursor:"pointer" }}>
                          🗑️ Slet bruger permanent
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
            )}

        {/* ══ ADMIN — ÅBEN SUBMISSION ══ */}
        {screen === SCREENS.ADMIN && openSubmission && editingSubmission && (
          <div className="screen fade-in" style={{ paddingBottom:120 }}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 0 14px" }}>
              <button onClick={() => { setOpenSubmission(null); setEditingSubmission(null); }}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2"><path strokeLinecap="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Gennemse indsendelse</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{new Date(openSubmission.created_at).toLocaleDateString("da-DK", { day:"numeric", month:"long", year:"numeric" })}</div>
              </div>
              {/* Hurtig-godkend/afvis */}
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => updateSubmissionAndApprove(openSubmission, editingSubmission)}
                  style={{ background:"var(--green)", border:"none", borderRadius:10, padding:"8px 14px", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"#071510", cursor:"pointer" }}>
                  ✓ Godkend
                </button>
                <button onClick={() => { rejectSubmission(openSubmission.id); setOpenSubmission(null); setEditingSubmission(null); }}
                  style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10, padding:"8px 14px", fontFamily:"var(--f)", fontSize:12, fontWeight:800, color:"var(--red)", cursor:"pointer" }}>
                  ✗
                </button>
              </div>
            </div>

            {/* Produktkort */}
            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"var(--sh)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                {openSubmission.ai_parsed_data?.product_image_base64
                  ? <img src={`data:image/jpeg;base64,${openSubmission.ai_parsed_data.product_image_base64}`}
                      style={{ width:64, height:64, borderRadius:10, objectFit:"contain", border:"1px solid var(--border)", flexShrink:0 }} alt="" />
                  : <div style={{ width:64, height:64, borderRadius:10, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>📦</div>
                }
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600, marginBottom:4 }}>Produktnavn</div>
                  <input value={editingSubmission.name} onChange={e => setEditingSubmission(s => ({ ...s, name: e.target.value }))}
                    placeholder="Produktnavn…"
                    style={{ width:"100%", border:"none", outline:"none", fontFamily:"var(--f)", fontSize:15, fontWeight:800, color:"var(--ink)", background:"transparent", padding:0 }} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div>
                  <div style={{ fontSize:10, color:"var(--muted)", fontWeight:600, marginBottom:4 }}>BRAND</div>
                  <input value={editingSubmission.brand} onChange={e => setEditingSubmission(s => ({ ...s, brand: e.target.value }))}
                    placeholder="Brand / Mærke…" className="field" style={{ padding:"8px 10px", fontSize:13 }} />
                </div>
                <div>
                  <div style={{ fontSize:10, color:"var(--muted)", fontWeight:600, marginBottom:4 }}>EAN</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", padding:"8px 10px", background:"var(--surface2)", borderRadius:8, fontFamily:"monospace" }}>{openSubmission.ean}</div>
                </div>
              </div>
              {openSubmission.notes && (
                <div style={{ marginTop:10, padding:"8px 10px", background:"var(--amber-lt)", borderRadius:8 }}>
                  <div style={{ fontSize:10, color:"var(--amber)", fontWeight:700, marginBottom:2 }}>BRUGER-BEMÆRKNING</div>
                  <div style={{ fontSize:12, color:"var(--ink)" }}>{openSubmission.notes}</div>
                </div>
              )}
            </div>

            {/* Foto af ingredienslisten */}
            {openSubmission.raw_label_image && (
              <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"var(--sh)" }}>
                <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:10 }}>📸 Foto af ingredienslisten</div>
                <img src={`data:image/jpeg;base64,${openSubmission.raw_label_image}`} alt="Ingrediensliste"
                  style={{ width:"100%", borderRadius:10, objectFit:"contain", maxHeight:240 }} />
              </div>
            )}

            {/* OCR tekst */}
            {openSubmission.ocr_raw_text && (
              <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"var(--sh)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>📄 Ingredienser fra OCR</div>
                  <button onClick={() => cleanOcrWithAI(openSubmission.ocr_raw_text)} disabled={cleaningOcr}
                    style={{ background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:8, padding:"5px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--green)", cursor:"pointer" }}>
                    {cleaningOcr ? "🤖 Renskriver…" : "🤖 Renskiv med AI"}
                  </button>
                </div>
                <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.7, background:"var(--surface2)", borderRadius:8, padding:"10px", maxHeight:120, overflowY:"auto" }}>
                  {openSubmission.ocr_raw_text}
                </div>
                {cleanedOcrText && (
                  <div style={{ marginTop:10, borderTop:"1px solid var(--border)", paddingTop:10 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--green)", marginBottom:6 }}>✓ AI renskrivet — tjek at intet er fjernet</div>
                    <div style={{ background:"var(--green-lt)", borderRadius:8, padding:"10px", marginBottom:8, fontSize:12, color:"var(--ink)", lineHeight:1.7 }}>
                      {cleanedOcrText}
                    </div>
                    <button onClick={() => setEditingSubmission(s => ({ ...s, ingredients_text: cleanedOcrText }))}
                      style={{ width:"100%", background:"var(--green)", border:"none", borderRadius:10, padding:"10px", fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"#071510", cursor:"pointer" }}>
                      ✓ Brug denne version
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Allergener — toggle grid */}
            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"var(--sh)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>Allergener</div>
                <div style={{ fontSize:10, color:"var(--muted)" }}>Ja → Spor → Nej</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {ALLERGENS.map(a => {
                  const val = editingSubmission.allergen_flags[a.id] || "no";
                  const next = val==="no" ? "yes" : val==="yes" ? "traces" : "no";
                  const isYes = val === "yes";
                  const isTrace = val === "traces";
                  return (
                    <button key={a.id} onClick={() => setEditingSubmission(s => ({ ...s, allergen_flags: { ...s.allergen_flags, [a.id]: next } }))}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, cursor:"pointer",
                        border:`1.5px solid ${isYes?"var(--red-md)":isTrace?"var(--amber-md)":"var(--border)"}`,
                        background: isYes?"var(--red-lt)":isTrace?"var(--amber-lt)":"var(--paper2)",
                        fontFamily:"var(--f)" }}>
                      <span style={{ fontSize:16 }}>{a.emoji}</span>
                      <span style={{ flex:1, fontSize:12, fontWeight:700, color:isYes?"var(--red)":isTrace?"var(--amber)":"var(--muted2)", textAlign:"left" }}>{a.label}</span>
                      <span style={{ fontSize:10, fontWeight:800, color:isYes?"var(--red)":isTrace?"var(--amber)":"var(--muted)" }}>
                        {isYes?"JA":isTrace?"SPOR":"NEJ"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Handlings-knapper */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, paddingBottom:120 }}>
              <button onClick={() => updateSubmissionAndApprove(openSubmission, editingSubmission)}
                style={{ width:"100%", background:"var(--green)", border:"none", borderRadius:12, padding:"15px", fontFamily:"var(--f)", fontSize:15, fontWeight:700, color:"#071510", cursor:"pointer", boxShadow:"0 4px 16px rgba(34,197,94,.3)" }}>
                ✅ Godkend og opret produkt
              </button>
              <button onClick={() => { rejectSubmission(openSubmission.id); setOpenSubmission(null); setEditingSubmission(null); }}
                style={{ width:"100%", background:"var(--red-lt)", border:"1.5px solid var(--red-md)", borderRadius:12, padding:"13px", fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--red)", cursor:"pointer" }}>
                ❌ Afvis indsendelse
              </button>
              <button onClick={() => { setOpenSubmission(null); setEditingSubmission(null); }}
                style={{ width:"100%", background:"none", border:"none", padding:"10px", fontFamily:"var(--f)", fontSize:13, color:"var(--muted)", cursor:"pointer" }}>
                Annullér
              </button>
            </div>

          </div>
        )}

    </>
  );
}
