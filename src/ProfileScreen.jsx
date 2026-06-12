// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, SCREENS, DIETS, E_NUMBERS, E_CATEGORIES, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { initials, timeAgo, getAllergenLabels, makeHeaders, apiCall } from "./helpers.js";
import { EatSafeLogo, Icon, ProductImage } from "./SharedComponents.jsx";
import { MemberForm, CategorySelect } from "./MemberForm.jsx";
import { ENumberPicker } from "./AllergenPicker.jsx";
import { usePush } from "./usePush.js";

// ── Gamification helpers ──────────────────────────────────────────────────────
function computeStreak(history) {
  if (!history?.length) return 0;
  const days = new Set(
    history.map(h => {
      const d = new Date(h.scanned_at || h.timestamp);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (days.has(key)) streak++;
    else if (i > 0) break; // tillad at i dag mangler (streak brækker kun ved gap > 1)
  }
  return streak;
}

function GamificationCard({ history, family, activeProfiles, setScreen, SCREENS }) {
  const streak        = computeStreak(history);
  const total         = history.length;
  const dangers       = history.filter(h => (h.result || h.status) === "danger").length;
  const safes         = history.filter(h => (h.result || h.status) === "safe").length;
  const familyActive  = activeProfiles.filter(id => id !== "me" && id !== "user").length;

  const metrics = [
    { icon:"🔥", value: streak,       label:"Dages streak",       color:"#f97316", bg:"rgba(249,115,22,.12)", border:"rgba(249,115,22,.25)" },
    { icon:"🔍", value: total,        label:"Scanninger i alt",   color:"var(--green)", bg:"var(--green-lt)", border:"var(--green-mid)" },
    { icon:"⚠️",  value: dangers,     label:"Advarsler fanget",   color:"var(--red)", bg:"var(--red-lt)", border:"var(--red-md)" },
    { icon:"✅", value: safes,        label:"Sikre opdagelser",   color:"var(--green)", bg:"var(--green-lt)", border:"var(--green-mid)" },
    { icon:"👨‍👩‍👧", value: familyActive, label:"Familie aktive",    color:"#818cf8", bg:"rgba(129,140,248,.12)", border:"rgba(129,140,248,.25)" },
  ];

  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>Din aktivitet</div>
          <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>Streak · Scanninger · Opdagelser</div>
        </div>
        {streak >= 3 && (
          <div style={{ fontSize:11, fontWeight:800, color:"#f97316", background:"rgba(249,115,22,.12)", border:"1px solid rgba(249,115,22,.25)", borderRadius:20, padding:"3px 10px" }}>
            🔥 {streak} dage!
          </div>
        )}
      </div>

      {/* Streak progress-bar */}
      {streak > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--muted)", marginBottom:4, fontWeight:600 }}>
            <span>Ugentlig streak</span>
            <span>{Math.min(streak, 7)}/7 dage</span>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {Array.from({ length: 7 }).map((_, i) => {
              const active = i < Math.min(streak, 7);
              return (
                <div key={i} style={{
                  flex:1, height:6, borderRadius:3,
                  background: active ? "#f97316" : "var(--border2)",
                  transition:"background .3s",
                  boxShadow: active ? "0 0 4px rgba(249,115,22,.5)" : "none",
                }} />
              );
            })}
          </div>
        </div>
      )}

      {/* Metrics grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {metrics.map(m => (
          <div key={m.label} style={{
            background: m.bg,
            border:`1px solid ${m.border}`,
            borderRadius:10,
            padding:"10px 12px",
            display:"flex",
            alignItems:"center",
            gap:10,
          }}>
            <div style={{ fontSize:22, lineHeight:1, flexShrink:0 }}>{m.icon}</div>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color: m.color, lineHeight:1 }}>{m.value}</div>
              <div style={{ fontSize:10, color:"var(--muted)", fontWeight:600, marginTop:2, lineHeight:1.2 }}>{m.label}</div>
            </div>
          </div>
        ))}
        {/* Fuld bredde: Se historik */}
        <div onClick={() => setScreen(SCREENS.HISTORY)}
          style={{
            gridColumn:"1 / -1",
            background:"rgba(255,255,255,.04)",
            border:"1px solid var(--border2)",
            borderRadius:10,
            padding:"10px 14px",
            display:"flex",
            alignItems:"center",
            justifyContent:"space-between",
            cursor:"pointer",
          }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)" }}>Se fuld scanningshistorik</div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
    </div>
  );
}

export default function ProfileScreen({
  screen, setScreen,
  user, setUser,
  allergens, setAllergens,
  customAllerg, setCustomAllerg,
  family, setFamily,
  activeProfiles, setActiveProfiles,
  history, favorites,
  userId, accessToken,
  showDeleteAccount, setShowDeleteAccount,
  deleteConfirmText, setDeleteConfirmText,
  deletingAccount, deleteOwnAccount,
  clearAuth,
  customInput, setCustomInput,
  eSearch, setESearch,
  eCategory, setECategory,
  allergenSubtypes, setAllergenSubtypes,
  loadHistory,
  selectedENumbers, setSelectedENumbers,
  activeSubtypeModal, setActiveSubtypeModal,
  loadAdminStats, loadSubmissions, loadTickets,
  setAdminSection, setSubmissionFilter,
  newMemberName, setNewMemberName,
  newMemberBirthYear, setNewMemberBirthYear,
  newMemberGender, setNewMemberGender,
  newMemberAllerg, setNewMemberAllerg,
  newMemberCustomAllerg, setNewMemberCustomAllerg,
  newMemberDiets, setNewMemberDiets,
  newMemberENumbers, setNewMemberENumbers,
  newMemberSubtypes, setNewMemberSubtypes,
  newMemberCustomInput, setNewMemberCustomInput,
  loginEmail,
  addMember, removeMember,
  historyLoading,
  setScanResult,
  ticketsLoading,
}) {
  // ── Invite state ────────────────────────────────────────────────────────────
  const [inviteLink, setInviteLink] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  // ── Push-notifikationer (hooks skal være på komponent-niveau) ────────────────
  const { supported: pushSupported, permission: pushPermission, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePush();
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState(pushPermission);

  const handlePushToggle = async () => {
    setPushLoading(true);
    if (pushStatus === "granted") {
      await pushUnsubscribe(accessToken);
      setPushStatus("default");
    } else {
      const result = await pushSubscribe(accessToken);
      setPushStatus(result.ok ? "granted" : "denied");
    }
    setPushLoading(false);
  };
  const FamilyChips = () => {
    const allIds = ["me", ...family.map(m => m.id)];
    const isAll = allIds.every(id => activeProfiles.includes(id));
    const toggleAll = () => setActiveProfiles(isAll ? ["me"] : allIds);
    const toggleOne = (id) => {
      if (isAll) { setActiveProfiles([id]); return; }
      const next = activeProfiles.includes(id) ? activeProfiles.filter(x => x !== id) : [...activeProfiles, id];
      setActiveProfiles(next.length === 0 ? [id] : next);
    };
    return (
      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
        <div className={`ap-chip${isAll?" on":""}`} onClick={toggleAll}>Hele familien</div>
        <div className={`ap-chip${!isAll&&activeProfiles.includes("me")?" on":""}`} onClick={() => toggleOne("me")}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"var(--green)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(user.name||"Mig")}</div>
          {(user.name||"Mig").split(" ")[0]}
        </div>
        {family.map(m => (
          <div key={m.id} className={`ap-chip${!isAll&&activeProfiles.includes(m.id)?" on":""}`} onClick={() => toggleOne(m.id)}>
            <div style={{width:20,height:20,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(m.name)}</div>
            {m.name.split(" ")[0]}
          </div>
        ))}
      </div>
    );
  };
  return (
    <>
        {screen === SCREENS.HISTORY && (
          <div className="screen fade-in">
            <div className="screen-title">Scanningshistorik</div>
            <div className="screen-sub">Alle dine tidligere scanninger.</div>
            <button className="btn btn-ghost btn-sm" style={{ marginBottom:14 }} onClick={() => { loadHistory(); }}>Opdater</button>
            {historyLoading && (
              <div className="fade-in">
                {[1,2,3,4].map(i => (
                  <div key={i} className="skeleton-row">
                    <div className="skeleton-block skeleton-avatar" />
                    <div style={{ flex:1 }}>
                      <div className="skeleton-block skeleton-title" />
                      <div className="skeleton-block skeleton-sub" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!historyLoading && history.length===0 && (
              <div className="empty-state"><span className="empty-icon">🔍</span><div className="empty-txt">Ingen scanninger endnu</div><div className="empty-sub">Skan dit første produkt for at se din historik her</div><button className="btn btn-outline btn-sm" style={{ marginTop:12 }} onClick={() => setScreen("SCANNER")}>Skan nu</button></div>
            )}
            {history.map((h,i) => {
              const s = h.result||h.status;
              const name = h.products?.name||h.name||h.ean_scanned||"Ukendt";
              return (
                <div key={i} className="hist-row" style={{ padding:"12px 0" }} onClick={() => {
                  setScanResult({ code:h.ean_scanned||h.code, name, brand:h.products?.brand||h.brand||"", status:s, headline:s==="safe"?"Sikkert produkt":s==="danger"?"Indeholder allergen!":"Mulige spor", flags:[], summary:"", timestamp:new Date(h.scanned_at||h.timestamp).getTime() });
                  setScreen(SCREENS.RESULT);
                }}>
                  <div className={`hist-dot ${s}`} />
                  <div className="hist-info"><div className="hist-name">{name}</div><div className="hist-time">{timeAgo(h.scanned_at||h.timestamp)}</div></div>
                  <div className={`badge ${s==="safe"?"safe":s==="danger"?"danger":s==="not_found"?"":"warn"}`}>{s==="safe"?"Sikker":s==="danger"?"Farlig":s==="not_found"?"Ikke fundet":"Advarsel"}</div>
                </div>
              );
            })}
          </div>
        )}

        {screen === SCREENS.PROFILE && (
          <div className="screen fade-in">

            {/* Hero */}
            <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"22px 20px", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"#fff", flexShrink:0 }}>
                  {initials(user.name||"?")}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:19, fontWeight:900, color:"var(--ink)", letterSpacing:"-.3px" }}>{user.name||"Din profil"}</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:3 }}>{user.email||loginEmail||""}</div>
                </div>
                <button onClick={() => setScreen(SCREENS.EDITPROFILE)}
                  style={{ background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:10, padding:"7px 14px", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer" }}>
                  Rediger
                </button>
              </div>
              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[
                  [allergens.length + customAllerg.length, "Allergener"],
                  [family.length, "Familie"],
                  [history.length, "Scanninger"],
                ].map(([n, lbl]) => (
                  <div key={lbl} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:20, fontWeight:700, color:"var(--ink)" }}>{n}</div>
                    <div style={{ fontSize:10, color:"var(--muted)", fontWeight:600, marginTop:2 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gamification */}
            <GamificationCard
              history={history}
              family={family}
              activeProfiles={activeProfiles}
              setScreen={setScreen}
              SCREENS={SCREENS}
            />

            {/* Mine præferencer */}
            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>Mine præferencer</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>Allergier · Intolerancer · Diæter · E-numre</div>
                </div>
                <button onClick={() => setScreen(SCREENS.EDITPROFILE)}
                  style={{ background:"var(--green-lt)", border:"none", borderRadius:8, padding:"4px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--green)", cursor:"pointer" }}>
                  Rediger
                </button>
              </div>
              {allergens.length + customAllerg.length + (selectedENumbers?.length || 0) + (user?.diets?.length || 0) === 0
                ? <div style={{ textAlign:"center", padding:"16px 0" }}><div style={{ fontSize:36, marginBottom:8 }}>⚙️</div><div style={{ fontSize:13, color:"var(--muted)", marginBottom:10 }}>Ingen præferencer registreret endnu</div><button className="btn btn-outline btn-sm" onClick={() => setScreen("PREFERENCES")}>Tilføj allergener</button></div>
                : (
                  <div>
                    {/* Gruppér: allergener, intoleranser, diæter */}
                    {allergens.filter(id => ["gluten","laktose","aeg","noedder","jordnoedder","soja","fisk","skaldyr","selleri","sennep","sesam","svovl","lupin","bloeddyr"].includes(id)).length > 0 && (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 }}>Allergier</div>
                        <div className="tags">{allergens.filter(id => ["gluten","laktose","aeg","noedder","jordnoedder","soja","fisk","skaldyr","selleri","sennep","sesam","svovl","lupin","bloeddyr"].includes(id)).map(id => { const a = ALLERGENS.find(x=>x.id===id); return a ? <div key={id} className="tag" style={{ background:"var(--red-lt)", color:"var(--red)", borderColor:"var(--red-md)" }}>{a.emoji} {a.label}</div> : null; })}</div>
                      </div>
                    )}
                    {customAllerg.length > 0 && (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 }}>Intolerancer</div>
                        <div className="tags">{customAllerg.map((c,i) => <div key={i} className="tag" style={{ background:"var(--amber-lt)", color:"var(--amber)", borderColor:"var(--amber-md)" }}>✏️ {c}</div>)}</div>
                      </div>
                    )}
                    {(user?.diets?.length > 0) && (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 }}>Diæter</div>
                        <div className="tags">{user.diets.map(d => { const diet = DIETS.find(x=>x.id===d); return diet ? <div key={d} className="tag" style={{ background:"var(--green-lt)", color:"var(--green)", borderColor:"var(--green-mid)" }}>{diet.emoji || "🥗"} {diet.label}</div> : null; })}</div>
                      </div>
                    )}
                    {selectedENumbers && selectedENumbers.length > 0 && (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 }}>E-numre</div>
                        <div className="tags">{selectedENumbers.map((e,i) => <div key={i} className="tag" style={{ background:"rgba(99,102,241,.1)", color:"#818cf8", borderColor:"rgba(99,102,241,.3)" }}>⚗️ {e}</div>)}</div>
                      </div>
                    )}
                  </div>
                )
              }
            </div>

            {/* Menu */}
            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", marginBottom:10 }}>
              {[
                { icon:"⭐", label:"Favoritter", sub:"Gemte produkter og opskrifter", fn:() => setScreen(SCREENS.FAVORITES) },
                { icon:"👨‍👩‍👧", label:"Familie", sub:`${family.length} ${family.length===1?"profil":"profiler"} oprettet`, fn:() => setScreen(SCREENS.FAMILY) },
                { icon:"📋", label:"Scanningshistorik", sub:`${history.length} produkter scannet`, fn:() => setScreen(SCREENS.HISTORY) },
                { icon:"🌍", label:"Madpas", sub:"Vis allergier til restaurantpersonale", fn:() => setScreen(SCREENS.MADPAS) },
                { icon:"🍽️", label:"Restaurantguide", sub:"Spis trygt ude — tips & rettigheder", fn:() => setScreen(SCREENS.RESTAURANTGUIDE) },
                ...(user.role==="admin" ? [{ icon:"🛡️", label:"Admin panel", sub:"Godkend og administrér produkter", fn:() => { loadSubmissions(); loadAdminStats(); setScreen(SCREENS.ADMIN); } }] : []),
              ].map((item, i, arr) => (
                <div key={item.label} onClick={item.fn}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none", cursor:"pointer" }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                    {item.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>{item.label}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{item.sub}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
                </div>
              ))}
            </div>

            {/* Konto */}
            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px" }}>
              <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:12 }}>Konto</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={clearAuth}
                  style={{ flex:1, padding:"11px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:10, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--ink)", cursor:"pointer" }}>
                  Log ud
                </button>
                <button onClick={() => { setShowDeleteAccount(true); setDeleteConfirmText(""); }}
                  style={{ flex:1, padding:"11px", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--red)", cursor:"pointer" }}>
                  Slet konto
                </button>
              </div>
            </div>

            {/* ── Push-notifikationer ── */}
            {pushSupported && (
                <div className="card" style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)", marginBottom:2 }}>🔔 Push-notifikationer</div>
                      <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5 }}>
                        {pushStatus === "granted"
                          ? "Du får besked når dine indsendelser godkendes"
                          : pushStatus === "denied"
                          ? "Blokeret i browserindstillinger"
                          : "Få besked når dine produkter godkendes"}
                      </div>
                    </div>
                    {pushStatus !== "denied" && (
                      <button onClick={handlePushToggle} disabled={pushLoading}
                        style={{
                          width:48, height:28, borderRadius:14, border:"none", cursor:"pointer",
                          background: pushStatus === "granted" ? "var(--green)" : "var(--border2)",
                          position:"relative", transition:"background .2s", flexShrink:0,
                          opacity: pushLoading ? 0.6 : 1,
                        }}>
                        <div style={{
                          width:22, height:22, borderRadius:"50%", background:"#fff",
                          position:"absolute", top:3,
                          left: pushStatus === "granted" ? 23 : 3,
                          transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.3)"
                        }} />
                      </button>
                    )}
                  </div>
                  {pushStatus === "denied" && (
                    <div style={{ marginTop:8, fontSize:11, color:"var(--amber)", background:"var(--amber-lt)", borderRadius:8, padding:"6px 10px" }}>
                      Tilladelse er blokeret. Aktivér push i din browsers indstillinger.
                    </div>
                  )}
                </div>
            )}

            {/* ── Footer: kontakt + privatlivspolitik ── */}
            <div style={{ marginTop:24, paddingBottom:8, textAlign:"center" }}>
              <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8 }}>
                Spørgsmål eller feedback?
              </div>
              <a href="mailto:hej@eatsafe.dk"
                style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:"var(--green)", textDecoration:"none", marginBottom:14 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,12 2,6"/>
                </svg>
                hej@eatsafe.dk
              </a>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, fontSize:11, color:"var(--muted)" }}>
                <a href="https://eatsafe.dk/privacy" target="_blank" rel="noopener noreferrer"
                  style={{ color:"var(--muted)", textDecoration:"underline", textUnderlineOffset:3 }}>
                  Privatlivspolitik
                </a>
                <span>·</span>
                <span>EatSafe Beta</span>
              </div>
            </div>

          </div>
        )}

        {screen === SCREENS.FAVORITES && (
          <div className="screen fade-in">
            <div className="screen-title"> Favoritter</div>

            {/* Seneste scanninger */}
            {history.filter(h => h.result !== "not_found" && (h.products?.name || h.name)).length > 0 && (
              <div className="card" style={{ marginBottom:10 }}>
                <div className="card-lbl" style={{ display:"flex", justifyContent:"space-between" }}>
                  <span>Senest scannet</span>
                  <span style={{ cursor:"pointer", color:"var(--green)", fontWeight:700, fontSize:11 }} onClick={() => { loadHistory(); setScreen(SCREENS.HISTORY); }}>Se alle</span>
                </div>
                {history.filter(h => h.result !== "not_found").slice(0,3).map((h,i) => {
                  const s = h.result || h.status;
                  const name = h.products?.name || h.name || h.ean_scanned || "Ukendt";
                  const prod = { name, brand: h.products?.brand||h.brand||"", image_url: h.products?.image_url||null };
                  const color = s==="safe" ? "var(--green)" : s==="danger" ? "var(--red)" : "var(--amber)";
                  const bg = s==="safe" ? "var(--green-lt)" : s==="danger" ? "var(--red-lt)" : "var(--amber-lt)";
                  return (
                    <div key={i} className="hist-row" style={{ cursor:"pointer" }}
                      onClick={() => lookupProduct(h.ean_scanned || h.code)}>
                      <ProductImage product={prod} size={36} />
                      <div className="hist-info" style={{ marginLeft:8 }}>
                        <div className="hist-name">{name}</div>
                        <div className="hist-time">{timeAgo(h.scanned_at||h.timestamp)}</div>
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, color, background:bg, border:`1px solid ${color}`, borderRadius:20, padding:"3px 10px", flexShrink:0 }}>
                        {s==="safe"?"Sikker":s==="danger"?"Farlig":"Advarsel"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Gemte favoritter */}
            {favorites.length > 0 && <div className="card-lbl" style={{ marginBottom:6 }}>Gemte produkter</div>}
            {favorites.length === 0 && (
              <div className="empty-state"><span className="empty-icon">🤍</span><div className="empty-txt">Ingen favoritter endnu</div><div className="empty-sub">Tryk ❤️ på et produkt under scanning for at gemme det her</div>
              </div>
            )}
            {favorites.map((f,i) => (
              <div key={i} className="card" style={{ padding:"12px 14px", cursor:"pointer", marginBottom:8 }}
                onClick={() => lookupProduct(f.ean || f.code || f.id)}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <ProductImage product={f} size={48} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{f.name || "Ukendt"}</div>
                    {f.brand && <div style={{ fontSize:12, color:"var(--muted)", marginTop:1 }}>{f.brand}</div>}
                    <div style={{ marginTop:6 }}>
                      <ProfileBadges allergenFlags={f.allergen_flags||{}} allergens={allergens} customAllerg={customAllerg} family={family} activeProfiles={activeProfiles} size={22} />
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize:12, flexShrink:0 }}
                    onClick={e => { e.stopPropagation(); toggleFavorite(f); }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {screen === SCREENS.EDITPROFILE && (
          <div className="screen fade-in">
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 0 20px" }}>
              
              <div style={{ fontSize:18, fontWeight:800, color:"var(--ink)" }}>Rediger profil</div>
            </div>

            {/* Navn og kontakt */}
            <div className="card" style={{ marginBottom:10 }}>
              <div className="card-lbl">Personlige oplysninger</div>
              {[["Dit navn","text","Fx. Anna Hansen","name"],["Telefon","tel","+45 12 34 56 78","phone"],["Fødselsår","number","Fx. 1990","birth_year"]].map(([lbl,type,ph,key]) => (
                <div key={key} style={{ marginBottom:10 }}>
                  <label className="field-lbl">
                    {lbl} {(key==="name"||key==="birth_year") && <span style={{ color:"var(--red)" }}>*</span>}
                  </label>
                  <input className="field" type={type} placeholder={ph} value={user[key]||""} onChange={e => setUser(u => ({ ...u, [key]: e.target.value }))} />
                </div>
              ))}
              <label className="field-lbl">Køn <span style={{ color:"var(--red)" }}>*</span></label>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                {["Mand","Kvinde","Andet"].map(g => (
                  <div key={g} onClick={() => setUser(u => ({...u, gender:g}))}
                    style={{ flex:1, padding:"8px 0", textAlign:"center", borderRadius:8, border:`1px solid ${user.gender===g?"var(--green)":"var(--border)"}`, background:user.gender===g?"var(--green-lt)":"var(--surface)", fontSize:13, fontWeight:700, color:user.gender===g?"var(--green)":"var(--muted)", cursor:"pointer" }}>
                    {g}
                  </div>
                ))}
              </div>
              {(!user.name?.trim() || !user.birth_year || !user.gender) && (
                <div style={{ fontSize:11, color:"var(--muted)", marginBottom:10 }}>
                  <span style={{ color:"var(--red)" }}>*</span> Navn, fødselsår og køn er obligatoriske
                </div>
              )}
              <button className="btn btn-primary btn-full"
                disabled={!user.name?.trim() || !user.birth_year || !user.gender}
                onClick={async () => {
                try {
                  await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
                    method:"PATCH",
                    headers:{ ...makeHeaders(accessToken), "Prefer":"return=representation" },
                    body:JSON.stringify({ name:user.name, phone:user.phone||null, birth_year:user.birth_year?parseInt(user.birth_year):null, gender:user.gender||null }),
                  });
                } catch {}
              }}>Gem</button>
            </div>

            {/* Allergier */}
            {/* Diæt */}
            <div className="card" style={{ marginBottom:10 }}>
              <div className="card-lbl">Diæt</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10, lineHeight:1.5 }}>Vælg din diæt — bruges til filtrering af produkter og opskrifter.</div>
              <div className="chip-grid" style={{ marginBottom:8 }}>
                {DIETS.map(d => {
                  const on = (user.diets||[]).includes(d.id);
                  return (
                    <div key={d.id} className={`chip${on?" on":""}`}
                      onClick={() => setUser(u => ({ ...u, diets: on ? (u.diets||[]).filter(x=>x!==d.id) : [...(u.diets||[]), d.id] }))}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700 }}>{d.label}</div>
                        <div style={{ fontSize:10, color:"var(--muted)", marginTop:1 }}>{d.desc}</div>
                      </div>
                      {on && <div className="chip-check">✓</div>}
                    </div>
                  );
                })}
              </div>
              {(user.diets||[]).length > 0 && (
                <button className="btn btn-ghost btn-sm" style={{ marginBottom:8 }} onClick={() => setUser(u => ({...u, diets:[]}))}>Nulstil diæt</button>
              )}
              <button className="btn btn-primary btn-full" onClick={async () => {
                try {
                  await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
                    method:"PATCH",
                    headers:{ ...makeHeaders(accessToken), "Prefer":"return=minimal" },
                    body:JSON.stringify({ diets: user.diets||[] }),
                  });
                } catch {}
              }}>Gem diæt</button>
            </div>

            <div className="card" style={{ marginBottom:10 }}>
              <div className="card-lbl">Mine allergier / intolerancer</div>
              <div style={{ fontSize:11, color:"var(--muted)", marginBottom:10, lineHeight:1.4 }}>
                Tryk for at markere en allergi eller intolerance
              </div>
              <div className="chip-grid" style={{ marginBottom:10 }}>
                {ALLERGENS.map(a => {
                  const on = allergens.includes(a.id);
                  return (
                    <div key={a.id} className="chip" style={{
                      background: on ? "var(--red-lt)" : "var(--surface)",
                      border: `1px solid ${on ? "var(--red)" : "var(--border)"}`,
                      color: on ? "var(--red)" : "var(--ink)",
                    }}
                      onClick={() => setAllergens(p => on ? p.filter(x => x !== a.id) : [...p, a.id])}>
                      <span style={{ flex:1 }}>{a.emoji} {a.label}</span>
                      {on && <div style={{ fontSize:9, fontWeight:800, color:"var(--red)" }}>✓</div>}
                    </div>
                  );
                })}
              </div>
              <div className="card-lbl">Andre allergier</div>
              <div className="input-row" style={{ marginBottom: customAllerg.length ? 8 : 0 }}>
                <input className="field" placeholder="Fx. Fructose…" value={customInput} onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if(e.key==="Enter"&&customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}} />
                <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}}>+</button>
              </div>
              {customAllerg.length > 0 && <div className="tags">{customAllerg.map((a,i) => <div key={i} className="tag">✏️ {a}<span className="tag-x" onClick={() => setCustomAllerg(c=>c.filter((_,j)=>j!==i))}>×</span></div>)}</div>}

              <button className="btn btn-primary btn-full" style={{ marginTop:12 }} onClick={async () => {
                try {
                  await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, { method:"DELETE", headers:makeHeaders(accessToken) });
                  for(const a of allergens) await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, { method:"POST", headers:makeHeaders(accessToken), body:JSON.stringify({user_id:userId,allergen:a,type:"allergen"}) });
                  for(const c of customAllerg) await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, { method:"POST", headers:makeHeaders(accessToken), body:JSON.stringify({user_id:userId,allergen:c,type:"custom"}) });
                  setScreen(SCREENS.PROFILE);
                } catch (e) { alert("Fejl: " + e.message); }
              }}>Gem</button>
            </div>

            {/* E-numre i rediger profil */}
            <div className="card" style={{ marginBottom:10 }}>
              <div className="card-lbl">E-numre der undgås</div>
              <input className="field" placeholder="Søg E-nummer..." value={eSearch}
                onChange={e => setESearch(e.target.value)} style={{ marginBottom:8 }} />
              <select className="field" value={eCategory} onChange={e => setECategory(e.target.value)} style={{ marginBottom:8 }}>
                <option value="alle">Alle kategorier</option>
                {E_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label} ({c.range})</option>)}
              </select>
              <div style={{ maxHeight:320, overflowY:"auto", border:"1px solid var(--border)", borderRadius:8 }}>
                {Object.entries(E_NUMBERS).filter(([e,name]) => {
                  const matchSearch = !eSearch || e.toLowerCase().includes(eSearch.toLowerCase()) || name.toLowerCase().includes(eSearch.toLowerCase());
                  if (!matchSearch) return false;
                  if (eCategory==="alle") return true;
                  const cat = E_CATEGORIES.find(c=>c.id===eCategory);
                  const num = parseInt(e.replace(/[^0-9]/g,""));
                  return cat ? num>=cat.min && num<=cat.max : true;
                }).map(([e,name],i,arr) => {
                  const on = selectedENumbers.includes(e);
                  return (
                    <div key={e} onClick={() => setSelectedENumbers(p => on?p.filter(x=>x!==e):[...p,e])}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
                        borderBottom:i<arr.length-1?"1px solid var(--border)":"none",
                        background:on?"var(--red-lt)":"var(--surface)", cursor:"pointer" }}>
                      <div style={{ fontSize:12, fontWeight:800, color:on?"var(--red)":"var(--ink)", width:44 }}>{e}</div>
                      <div style={{ fontSize:11, color:on?"var(--red)":"var(--muted2)", flex:1, lineHeight:1.3 }}>{name}</div>
                      {on && <Icon name="check" size={13} color="var(--red)" />}
                    </div>
                  );
                })}
              </div>
              {selectedENumbers.length > 0 && (
                <div style={{ marginTop:8, fontSize:11, fontWeight:700, color:"var(--red)" }}>
                  {selectedENumbers.length} E-numre valgt
                </div>
              )}
            </div>

            <button className="btn btn-ghost btn-full" style={{ marginBottom:16 }} onClick={() => setScreen(SCREENS.PROFILE)}>Færdig</button>
          </div>
        )}

        {screen === SCREENS.FAMILY && (
          <div className="screen fade-in">
            <div className="screen-title">Familie</div>
            <div className="screen-sub">Administrér familiemedlemmers allergiprofiler.</div>
            <div className="card" style={{ padding:"12px 14px" }}>
              <div className="card-lbl">Aktive profiler ved scanning</div>
              <FamilyChips />
            </div>
            {family.length===0 && <div className="empty-state"><span className="empty-icon">👨‍👩‍👧</span><div className="empty-txt">Ingen familiemedlemmer endnu</div><div className="empty-sub">Tilføj familiemedlemmer for at scanne for dem</div></div>}
            {family.map(m => (
              <div key={m.id} className="family-member">
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:m.allergens.length?10:0 }}>
                  <div className="fm-avatar" style={{ background:m.color, color:"#fff" }}>{initials(m.name)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:15 }}>{m.name}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                      {[m.birth_year && `f. ${m.birth_year}`, m.gender, m.allergens.length && `${m.allergens.length} allergi${m.allergens.length!==1?"er":""}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span style={{ cursor:"pointer", opacity:.35, fontSize:18, padding:4 }} onClick={() => removeMember(m.id)}><Icon name="trash" size={18} color="var(--muted)" /></span>
                </div>
                {m.allergens.length>0 && <div className="tags">{getAllergenLabels(m.allergens,m.custom||[]).map((a,j) => <div key={j} className="tag" style={{ fontSize:11 }}>{a}</div>)}</div>}
              </div>
            ))}
            {/* ── Invitér familiemedlem via link ── */}
            <div className="card" style={{ marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:4 }}>
                🔗 Invitér via link
              </div>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:12, lineHeight:1.5 }}>
                Send et link til et familiemedlem. Når de opretter en konto via linket, deles jeres familieprofiler automatisk.
              </div>

              {!inviteLink && (
                <button
                  onClick={async () => {
                    setInviteLoading(true);
                    setInviteError("");
                    try {
                      const data = await apiCall(
                        `${SUPABASE_URL}/rest/v1/family_invites`,
                        {
                          method: "POST",
                          headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
                          body: JSON.stringify({ invited_by: userId }),
                        }
                      );
                      if (Array.isArray(data) && data[0]?.token) {
                        setInviteLink(`https://eatsafe.dk/invite/${data[0].token}`);
                      } else {
                        setInviteError("Kunne ikke oprette invitation. Prøv igen.");
                      }
                    } catch {
                      setInviteError("Noget gik galt. Tjek din forbindelse.");
                    }
                    setInviteLoading(false);
                  }}
                  disabled={inviteLoading}
                  style={{ width:"100%", padding:"12px", background:"var(--green)", color:"#071510", border:"none", borderRadius:10, fontFamily:"var(--f)", fontSize:13, fontWeight:800, cursor:"pointer", opacity: inviteLoading ? .6 : 1 }}>
                  {inviteLoading ? "Opretter link…" : "Opret invitationslink"}
                </button>
              )}

              {inviteError && (
                <div style={{ fontSize:12, color:"var(--red)", marginTop:8 }}>{inviteError}</div>
              )}

              {inviteLink && (
                <div>
                  <div style={{ padding:"10px 12px", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:8, fontFamily:"monospace", fontSize:11, color:"var(--ink)", wordBreak:"break-all", marginBottom:8 }}>
                    {inviteLink}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(inviteLink);
                        setInviteCopied(true);
                        setTimeout(() => setInviteCopied(false), 2000);
                      }}
                      style={{ flex:1, padding:"10px", background: inviteCopied ? "var(--green-lt)" : "var(--surface)", border:`1px solid ${inviteCopied ? "var(--green)" : "var(--border2)"}`, borderRadius:8, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color: inviteCopied ? "var(--green)" : "var(--ink)", cursor:"pointer" }}>
                      {inviteCopied ? "✓ Kopieret!" : "📋 Kopiér link"}
                    </button>
                    <button
                      onClick={() => navigator.share?.({ title:"EatSafe invitation", url: inviteLink })}
                      style={{ flex:1, padding:"10px", background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:8, fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer" }}>
                      ↗ Del
                    </button>
                    <button
                      onClick={() => { setInviteLink(null); setInviteCopied(false); }}
                      style={{ padding:"10px 12px", background:"none", border:"1px solid var(--border)", borderRadius:8, fontFamily:"var(--f)", fontSize:12, color:"var(--muted)", cursor:"pointer" }}>
                      ×
                    </button>
                  </div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:8 }}>
                    ⏱ Linket udløber om 24 timer
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">+ Tilføj familiemedlem</div>
              <MemberForm
                name={newMemberName} setName={setNewMemberName}
                birthYear={newMemberBirthYear} setBirthYear={setNewMemberBirthYear}
                gender={newMemberGender} setGender={setNewMemberGender}
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
    </>
  );
}
