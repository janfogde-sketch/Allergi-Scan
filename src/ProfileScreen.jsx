// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, SCREENS, DIETS, ALLERGEN_SUBTYPES, INCOMPATIBLE_SUBTYPES,
         E_NUMBERS, E_CATEGORIES } from "./constants.jsx";
import { initials, getAllergenLabels } from "./helpers.js";
import { EatSafeLogo, Icon } from "./SharedComponents.jsx";
import { ENumberPicker, SubtypeModal, AllergyForm } from "./AllergenPicker.jsx";

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
  newMemberAllerg, setNewMemberAllerg,
  newMemberCustomAllerg, setNewMemberCustomAllerg,
  newMemberDiets, setNewMemberDiets,
  newMemberENumbers, setNewMemberENumbers,
  newMemberSubtypes, setNewMemberSubtypes,
  newMemberCustomInput, setNewMemberCustomInput,
  addMember, removeMember,
}) {
  return (
    <>
        {screen === SCREENS.HISTORY && (
          <div className="screen fade-in">
            <div className="screen-title">Scanningshistorik</div>
            <div className="screen-sub">Alle dine tidligere scanninger.</div>
            <button className="btn btn-ghost btn-sm" style={{ marginBottom:14 }} onClick={() => { loadHistory(); }}>Opdater</button>
            {historyLoading && <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Henter historik…</div></div>}
            {!historyLoading && history.length===0 && (
              <div className="empty-state"><div className="empty-txt">Ingen scanninger endnu</div><div className="empty-sub">Skan dit første produkt</div></div>
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
            <div style={{ background:"var(--ink)", borderRadius:20, padding:"22px 20px", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"#fff", flexShrink:0 }}>
                  {initials(user.name||"?")}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:19, fontWeight:900, color:"#fff", letterSpacing:"-.3px" }}>{user.name||"Din profil"}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", marginTop:3 }}>{user.email||loginEmail||""}</div>
                </div>
                <button onClick={() => setScreen(SCREENS.EDITPROFILE)}
                  style={{ background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"7px 14px", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }}>
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
                  <div key={lbl} style={{ background:"rgba(255,255,255,.08)", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:20, fontWeight:900, color:"#fff" }}>{n}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,.45)", fontWeight:600, marginTop:2 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mine præferencer */}
            <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:10, boxShadow:"var(--sh)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>Mine præferencer</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>Allergier · Intoleranser · Diæter · E-numre</div>
                </div>
                <button onClick={() => setScreen(SCREENS.EDITPROFILE)}
                  style={{ background:"var(--green-lt)", border:"none", borderRadius:8, padding:"4px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--green)", cursor:"pointer" }}>
                  Rediger
                </button>
              </div>
              {allergens.length + customAllerg.length === 0
                ? <div style={{ fontSize:13, color:"var(--muted)", padding:"8px 0" }}>Ingen præferencer registreret endnu</div>
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
                        <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 }}>Intoleranser & diæter</div>
                        <div className="tags">{customAllerg.map((c,i) => <div key={i} className="tag" style={{ background:"var(--amber-lt)", color:"var(--amber)", borderColor:"var(--amber-md)" }}>✏️ {c}</div>)}</div>
                      </div>
                    )}
                  </div>
                )
              }
            </div>

            {/* Menu */}
            <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", marginBottom:10, boxShadow:"var(--sh)" }}>
              {[
                { icon:"⭐", label:"Favoritter", sub:"Gemte produkter og opskrifter", fn:() => setScreen(SCREENS.FAVORITES) },
                { icon:"👨‍👩‍👧", label:"Familie", sub:`${family.length} ${family.length===1?"profil":"profiler"} oprettet`, fn:() => setScreen(SCREENS.FAMILY) },
                { icon:"📋", label:"Scanningshistorik", sub:`${history.length} produkter scannet`, fn:() => setScreen(SCREENS.HISTORY) },
                ...(user.role==="admin" ? [{ icon:"🛡️", label:"Admin panel", sub:"Godkend og administrér produkter", fn:() => { loadSubmissions(); loadAdminStats(); setScreen(SCREENS.ADMIN); } }] : []),
              ].map((item, i, arr) => (
                <div key={item.label} onClick={item.fn}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none", cursor:"pointer" }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:"var(--paper2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
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
            <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", boxShadow:"var(--sh)" }}>
              <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:12 }}>Konto</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={clearAuth}
                  style={{ flex:1, padding:"11px", background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:10, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--ink2)", cursor:"pointer" }}>
                  Log ud
                </button>
                <button onClick={() => { setShowDeleteAccount(true); setDeleteConfirmText(""); }}
                  style={{ flex:1, padding:"11px", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--red)", cursor:"pointer" }}>
                  Slet konto
                </button>
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
              <div className="empty-state">
                <div className="empty-txt">Ingen favoritter endnu</div>
                <div className="empty-sub">Tryk ❤️ på et produkt for at gemme det her</div>
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
              {[["Dit navn","text","Fx. Anna Hansen","name"],["Telefon","tel","+45 12 34 56 78","phone"],["Alder","number","Fx. 32","age"]].map(([lbl,type,ph,key]) => (
                <div key={key} style={{ marginBottom:10 }}>
                  <label className="field-lbl">{lbl}</label>
                  <input className="field" type={type} placeholder={ph} value={user[key]||""} onChange={e => setUser(u => ({ ...u, [key]: e.target.value }))} />
                </div>
              ))}
              <label className="field-lbl">Køn</label>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                {["Mand","Kvinde","Andet"].map(g => (
                  <div key={g} onClick={() => setUser(u => ({...u, gender:g}))}
                    style={{ flex:1, padding:"8px 0", textAlign:"center", borderRadius:8, border:`1.5px solid ${user.gender===g?"var(--green)":"var(--border)"}`, background:user.gender===g?"var(--green-lt)":"#fff", fontSize:13, fontWeight:700, color:user.gender===g?"var(--green)":"var(--muted)", cursor:"pointer" }}>
                    {g}
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-full" onClick={async () => {
                try {
                  await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
                    method:"PATCH",
                    headers:{ ...makeHeaders(accessToken), "Prefer":"return=representation" },
                    body:JSON.stringify({ name:user.name, phone:user.phone||null, age:user.age?parseInt(user.age):null, gender:user.gender||null }),
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
              <div className="chip-grid" style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color:"var(--muted)", marginBottom:10, padding:"6px 10px", background:"var(--paper2)", borderRadius:8, lineHeight:1.5 }}>
                  Tryk 1x = Intolerance (spor kan være problem) · 2x = Allergi (farlig) · 3x = Fjern
                </div>
                {ALLERGENS.map(a => {
                  const state = allergens.includes(a.id) ? (customAllerg.includes(a.id+"_intolerance") ? "intolerance" : "allergen") : "none";
                  const bg = state==="allergen" ? "var(--red-lt)" : state==="intolerance" ? "var(--amber-lt)" : "var(--paper2)";
                  const border = state==="allergen" ? "var(--red)" : state==="intolerance" ? "var(--amber)" : "var(--border)";
                  const color = state==="allergen" ? "var(--red)" : state==="intolerance" ? "var(--amber)" : "var(--ink)";
                  const label = state==="allergen" ? "Allergi" : state==="intolerance" ? "Intolerance" : "";
                  return (
                    <div key={a.id} className="chip" style={{ background:bg, border:`1.5px solid ${border}`, color }}
                      onClick={() => {
                        if (state==="none") {
                          setAllergens(p => [...p, a.id]);
                          setCustomAllerg(p => [...p, a.id+"_intolerance"]);
                        } else if (state==="intolerance") {
                          setCustomAllerg(p => p.filter(x => x !== a.id+"_intolerance"));
                        } else {
                          setAllergens(p => p.filter(x => x !== a.id));
                        }
                      }}>
                      <span style={{ flex:1 }}>{a.label}</span>
                      {label && <div style={{ fontSize:9, fontWeight:800, color }}>{label}</div>}
                    </div>
                  );
                })}
              </div>
              <div className="card-lbl">Andre intoleranser</div>
              <div className="input-row" style={{ marginBottom: customAllerg.length ? 8 : 0 }}>
                <input className="field" placeholder="Fx. Fructose…" value={customInput} onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if(e.key==="Enter"&&customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}} />
                <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}}>+</button>
              </div>
              {customAllerg.length > 0 && <div className="tags">{customAllerg.map((a,i) => <div key={i} className="tag">✏️ {a}<span className="tag-x" onClick={() => setCustomAllerg(c=>c.filter((_,j)=>j!==i))}>×</span></div>)}</div>}
              {/* Præciser allergier */}
              {allergens.some(id => ALLERGEN_SUBTYPES[id]) && (
                <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>Tilpas din allergi præcist til dig selv</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>For størst mulig tryghed kan du præcisere hvad du reagerer på.</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {allergens.filter(id => ALLERGEN_SUBTYPES[id]).map(id => {
                      const data = ALLERGEN_SUBTYPES[id];
                      const subtype = allergenSubtypes[id];
                      const subtypeLabel = subtype && subtype.length > 0 ? subtype.map(id => data.options.find(o=>o.id===id)?.label).filter(Boolean).join(", ") : null;
                      return (
                        <div key={id} onClick={() => setActiveSubtypeModal(id)}
                          style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                            border:"1.5px solid var(--green)", background:"var(--green-lt)",
                            borderRadius:10, cursor:"pointer" }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:"var(--green)" }}>{data.label}</div>
                            <div style={{ fontSize:11, color:"var(--muted2)", marginTop:2 }}>{subtypeLabel || "Tryk for at præcisere →"}</div>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                            <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button className="btn btn-primary btn-full" style={{ marginTop:12 }} onClick={async () => {
                try {
                  await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, { method:"DELETE", headers:makeHeaders(accessToken) });
                  for(const a of allergens) await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, { method:"POST", headers:makeHeaders(accessToken), body:JSON.stringify({user_id:userId,allergen:a,type:"allergen"}) });
                  const realCustom = customAllerg.filter(c => !c.endsWith("_intolerance"));
                  for(const c of realCustom) await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, { method:"POST", headers:makeHeaders(accessToken), body:JSON.stringify({user_id:userId,allergen:c,type:"custom"}) });
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
                        background:on?"var(--red-lt)":"#fff", cursor:"pointer" }}>
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
    </>
  );
}
