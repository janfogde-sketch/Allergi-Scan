// @ts-nocheck
import React, { useState, useEffect } from "react";
import { SCREENS, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { compareAllergens, productDisplayName } from "./helpers.js";
import { Icon, ProductImage, SearchResultRow } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";
import { useShoppingContext } from "./ShoppingContext.jsx";
import { UI } from "./styleUtils.js";

const S = {
  flexMin: { flex:1, minWidth:0 },
  mb12:    { marginBottom:12 },
  mb10:    { marginBottom:10 },
  h13b:    { fontSize:13, fontWeight:700, color:"var(--ink)" },
  sub11:   { fontSize:11, color:"var(--muted)" },
};

function ShareSheet({ list, familyMembers, loadFamilyMembers, getListAccess, grantAccess, revokeAccess, setListType, onClose }) {
  const [access, setAccess]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);

  React.useEffect(() => {
    loadFamilyMembers();
    getListAccess(list.id).then(a => { setAccess(a); setLoading(false); });
  }, [list.id]);

  const sharedIds = new Set(access.map(a => a.user_id));
  const shareLink = `https://eatsafe.dk/?join-list=${list.share_link}`;

  const toggleMember = async (memberId) => {
    if (sharedIds.has(memberId)) {
      setAccess(a => a.filter(x => x.user_id !== memberId));
      await revokeAccess(list.id, memberId);
    } else {
      setAccess(a => [...a, { user_id: memberId, permission: "edit" }]);
      await grantAccess(list.id, memberId, "edit");
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end" }}
      onClick={onClose}>
      <div style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"85vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={UI.rowBetweenMb16}>
          <div style={UI.ufs18_fw900_cink}>Del "{list.name}"</div>
          <button onClick={onClose} aria-label="Luk"
            style={{ background:"var(--surface)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--ink)" }}>×</button>
        </div>

        {/* Hele familien */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, marginBottom:10 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>👨‍👩‍👧 Del med hele familien</div>
            <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>Alle du har inviteret til EatSafe ser og redigerer listen</div>
          </div>
          <div role="switch" aria-checked={list.type === "family"} tabIndex={0}
            onClick={() => setListType(list.id, list.type === "family" ? "personal" : "family")}
            onKeyDown={e => e.key === "Enter" && setListType(list.id, list.type === "family" ? "personal" : "family")}
            style={{ width:42, height:24, borderRadius:20, background: list.type === "family" ? "var(--green)" : "var(--border2)", position:"relative", cursor:"pointer", flexShrink:0, transition:"background .2s" }}>
            <div style={{ position:"absolute", top:2, left: list.type === "family" ? 20 : 2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left .2s" }} />
          </div>
        </div>

        {/* Vælg personer */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>
            Eller vælg udvalgte personer
          </div>
          {loading ? (
            <div style={{ fontSize:12, color:"var(--muted)" }}>Henter…</div>
          ) : familyMembers.length === 0 ? (
            <div style={{ fontSize:12, color:"var(--muted)" }}>Du har ikke inviteret nogen endnu — brug "Inviter" under Profil, eller del listen med koden nedenfor.</div>
          ) : familyMembers.map(m => (
            <div key={m.id} onClick={() => toggleMember(m.id)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, marginBottom:6, cursor:"pointer" }}>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--ink)" }}>{m.name || m.email}</div>
              <div style={{ width:20, height:20, borderRadius:6, border:`1.5px solid ${sharedIds.has(m.id) ? "var(--green)" : "var(--border2)"}`, background: sharedIds.has(m.id) ? "var(--green)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {sharedIds.has(m.id) && <span style={{ color:"#fff", fontSize:12, fontWeight:800 }}>✓</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Del med link */}
        <div style={{ padding:"14px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>
            Eller del med et link
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-primary btn-sm" style={{ flex:1 }}
              onClick={() => { navigator.clipboard?.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? "✓ Link kopieret" : "🔗 Kopiér link"}
            </button>
            {navigator.share && (
              <button className="btn btn-outline btn-sm"
                onClick={() => navigator.share({ title: `Indkøbsliste: ${list.name}`, url: shareLink })}>
                ↗ Del
              </button>
            )}
          </div>
          <div style={{ fontSize:11, color:"var(--muted)", marginTop:8 }}>Alle med linket kan tilslutte sig og redigere listen.</div>
        </div>
      </div>
    </div>
  );
}

export default function ListScreen({
  activeIds,
  lookupProduct,
}) {
  const { userId, accessToken } = useAuthContext();
  const { family, activeProfiles, setActiveProfiles } = useProfileContext();
  const { setScreen } = useNavigationContext();
  const { favorites } = useHistoryContext();
  const {
    lists, activeList, activeListId, setActiveListId,
    shoppingList, newItemName, setNewItemName, addToList, toggleItem, removeItem, clearDone,
    familyMembers, loadFamilyMembers, createList, deleteList, joinByCode,
    getListAccess, grantAccess, revokeAccess, setListType,
  } = useShoppingContext();

  const [showListPicker, setShowListPicker] = useState(false);
  const [showNewList, setShowNewList]       = useState(false);
  const [newListName, setNewListName]       = useState("");
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showJoin, setShowJoin]             = useState(false);
  const [joinCode, setJoinCode]             = useState("");
  const [joinError, setJoinError]           = useState("");
  const [joinLoading, setJoinLoading]       = useState(false);
  const [favoritesOpen, setFavoritesOpen]   = useState(false);

  // ── Søg blandt produkter mens der tilføjes en vare ──────────────────────────
  const [itemResults, setItemResults]   = useState([]);
  const [itemSearching, setItemSearching] = useState(false);
  const [itemFocused, setItemFocused]   = useState(false);
  useEffect(() => {
    if (!newItemName.trim()) { setItemResults([]); setItemSearching(false); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setItemSearching(true);
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/search?q=${encodeURIComponent(newItemName.trim())}`,
          { headers: { "apikey": SUPABASE_ANON_KEY, ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}) }, signal: controller.signal });
        const data = await res.json();
        if (data.success) setItemResults((data.products || []).slice(0, 12));
      } catch (e) { if (e.name !== "AbortError") setItemResults([]); }
      finally { if (!controller.signal.aborted) setItemSearching(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [newItemName, accessToken]);

  const pickItemProduct = (p) => {
    addToList({ name: productDisplayName(p), ean: p.ean || p.code, id: p.id, image_url: p.image_url });
    setItemResults([]);
    setItemFocused(false);
  };

  // ── Sikker søgning: skjul produkter der er farlige for den valgte profil-
  // gruppe, og vis den anden slags (spor) med en tydelig advarsel i stedet
  // for helt at gemme dem ── ─────────────────────────────────────────────────
  const itemResultsWithSafety = itemResults
    .map(p => ({ product: p, status: compareAllergens(p.allergen_flags||{}, activeIds).status }))
    .filter(r => r.status !== "danger");
  const visibleItemResults = itemResultsWithSafety.slice(0, 6);
  const hiddenUnsafeCount = itemResults.length - itemResultsWithSafety.length;

  const activeFamily = family.filter(m => activeProfiles.includes(m.id));
  const meActive = activeProfiles.includes("me");
  const allProfileIds = ["me", ...family.map(m => m.id)];
  const isAllActive = allProfileIds.every(id => activeProfiles.includes(id));
  const searchScopeLabel = isAllActive && family.length > 0
    ? "hele familien"
    : ([meActive && "dig", ...activeFamily.map(m => m.name.split(" ")[0])].filter(Boolean).join(", ") || "dig");

  // Samme "Aktive profiler"-valg som bruges til scanning og favoritter —
  // så man her kan justere hvem søgningen skal være sikker for uden at
  // skulle navigere væk fra indkøbslisten.
  const toggleAllProfiles = () => setActiveProfiles(isAllActive ? ["me"] : allProfileIds);
  const toggleOneProfile = (id) => {
    if (isAllActive) { setActiveProfiles([id]); return; }
    const next = activeProfiles.includes(id) ? activeProfiles.filter(x => x !== id) : [...activeProfiles, id];
    setActiveProfiles(next.length === 0 ? [id] : next);
  };

  const handleJoin = async () => {
    setJoinLoading(true);
    setJoinError("");
    // Accepter både et fuldt link (?join-list=KODE) og en rå kode indsat direkte
    let code = joinCode.trim();
    try { code = new URL(code).searchParams.get("join-list") || code; } catch { /* ikke et link — brug som kode */ }
    const res = await joinByCode(code);
    setJoinLoading(false);
    if (res.success) { setShowJoin(false); setJoinCode(""); }
    else setJoinError(res.error || "Kunne ikke tilslutte listen");
  };

  return (
    <div className="screen fade-in">
      <div className="screen-title">Indkøbsliste</div>

      {/* ── Tilføj vare (øverst, så søgeresultater aldrig kan havne bag andet indhold) ── */}
      <div style={{ marginBottom:10, position:"relative", zIndex:5 }}>
        <div className="input-row" style={{ marginBottom:0 }}>
          <input className="field" placeholder="Søg eller skriv en vare…"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            onFocus={() => setItemFocused(true)}
            onBlur={() => setTimeout(() => setItemFocused(false), 150)}
            onKeyDown={e => e.key==="Enter" && addToList(newItemName)} />
          <button className="btn btn-primary btn-sm" style={UI.uwsnowrap}
            onClick={() => addToList(newItemName)}>
            Tilføj
          </button>
        </div>
        {itemFocused && newItemName.trim() && (itemSearching || itemResults.length > 0) && (
          <div style={{ position:"absolute", left:0, right:0, top:"100%", marginTop:6, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, boxShadow:"var(--sh)", zIndex:10, maxHeight:"min(60vh, 480px)", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
            {itemResults.length > 0 && (
              <div style={{ position:"sticky", top:0, padding:"6px 10px", background:"var(--green-lt)", borderBottom:"1px solid var(--border)", zIndex:1 }}>
                <div style={{ fontSize:9, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:".4px", marginBottom:4 }}>
                  🛡️ Sikker søgning for {searchScopeLabel}
                </div>
                {family.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    <span onMouseDown={e => { e.preventDefault(); toggleAllProfiles(); }}
                      style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", background: isAllActive ? "var(--green)" : "var(--surface)", color: isAllActive ? "var(--on-green)" : "var(--muted)", border:`1px solid ${isAllActive ? "var(--green)" : "var(--border2)"}` }}>
                      Alle
                    </span>
                    <span onMouseDown={e => { e.preventDefault(); toggleOneProfile("me"); }}
                      style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", background: !isAllActive && meActive ? "var(--green)" : "var(--surface)", color: !isAllActive && meActive ? "var(--on-green)" : "var(--muted)", border:`1px solid ${!isAllActive && meActive ? "var(--green)" : "var(--border2)"}` }}>
                      Mig
                    </span>
                    {family.map(m => {
                      const on = !isAllActive && activeProfiles.includes(m.id);
                      return (
                        <span key={m.id} onMouseDown={e => { e.preventDefault(); toggleOneProfile(m.id); }}
                          style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", background: on ? "var(--green)" : "var(--surface)", color: on ? "var(--on-green)" : "var(--muted)", border:`1px solid ${on ? "var(--green)" : "var(--border2)"}` }}>
                          {m.name.split(" ")[0]}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {itemSearching && itemResults.length === 0 && (
              <div style={{ padding:"10px 12px", fontSize:12, color:"var(--muted)" }}>Søger…</div>
            )}
            {visibleItemResults.length > 0 && (
              <div style={{ padding:"10px 12px 2px" }}>
                {visibleItemResults.map(({ product: p }) => (
                  <SearchResultRow key={p.ean||p.id} product={p} effectiveIds={activeIds}
                    onOpen={() => { lookupProduct(p.ean||p.code||p.id); setItemFocused(false); setNewItemName(""); }}
                    onAddToList={() => pickItemProduct(p)}
                  />
                ))}
              </div>
            )}
            {hiddenUnsafeCount > 0 && (
              <div style={{ padding:"6px 12px", fontSize:10, color:"var(--muted)", background:"var(--paper2)" }}>
                🚫 {hiddenUnsafeCount} produkt{hiddenUnsafeCount!==1?"er":""} skjult — indeholder allergener for {searchScopeLabel}
              </div>
            )}
            {!itemSearching && (
              <div onMouseDown={() => addToList(newItemName)}
                style={{ padding:"8px 12px", fontSize:12, color:"var(--muted)", cursor:"pointer" }}>
                Tilføj "{newItemName.trim()}" som fritekst-vare
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Listevælger (komprimeret) ── */}
      <div style={{ display:"flex", gap:6, marginBottom:12 }}>
        <div onClick={() => setShowListPicker(v => !v)}
          style={{ flex:1, minWidth:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, cursor:"pointer" }}>
          <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            <span style={{ fontSize:12, fontWeight:700, color:"var(--ink)" }}>{activeList?.name || "Vælg liste"}</span>
            {activeList?.type === "family" && <span style={{ marginLeft:5, fontSize:9, fontWeight:700, color:"var(--green)" }}>👨‍👩‍👧</span>}
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0, transform: showListPicker ? "rotate(180deg)" : "none", transition:"transform .2s" }}>
            <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
        {favorites.length > 0 && (
          <button aria-label="Dine favoritter" onClick={() => setFavoritesOpen(v => !v)}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", width:34, height:"auto", padding:0, background: favoritesOpen ? "var(--green-lt)" : "var(--surface)", border:`1px solid ${favoritesOpen ? "var(--green)" : "var(--border)"}`, borderRadius:10, cursor:"pointer", flexShrink:0, fontSize:15 }}>
            ❤️
          </button>
        )}
        <button aria-label="Del liste" onClick={() => setShowShareSheet(true)} disabled={!activeList}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", width:34, height:"auto", padding:0, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, cursor: activeList ? "pointer" : "not-allowed", opacity: activeList ? 1 : .5, flexShrink:0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <path strokeLinecap="round" d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>
          </svg>
        </button>
      </div>

      {showListPicker && (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:10, marginBottom:14 }}>
          {lists.map(l => (
            <div key={l.id} onClick={() => { setActiveListId(l.id); setShowListPicker(false); }}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 8px", borderRadius:8, cursor:"pointer", background: l.id === activeListId ? "var(--green-lt)" : "transparent" }}>
              <div>
                <span style={{ fontSize:13, fontWeight:700, color: l.id === activeListId ? "var(--green)" : "var(--ink)" }}>{l.name}</span>
                {l.type === "family" && <span style={{ marginLeft:6, fontSize:10 }}>👨‍👩‍👧</span>}
                {l.owner_id !== userId && <span style={{ marginLeft:6, fontSize:10, color:"var(--muted)" }}>(delt)</span>}
              </div>
              {l.owner_id === userId && lists.length > 1 && (
                <span role="button" aria-label={`Slet "${l.name}"`} tabIndex={0}
                  onClick={e => { e.stopPropagation(); if (confirm(`Slet listen "${l.name}"?`)) deleteList(l.id); }}
                  onKeyDown={e => e.key === "Enter" && deleteList(l.id)}
                  style={{ padding:6, opacity:.5 }}>
                  <Icon name="trash" size={14} color="var(--muted)" />
                </span>
              )}
            </div>
          ))}
          {!showNewList ? (
            <div style={{ display:"flex", gap:8, marginTop:6 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => setShowNewList(true)}>+ Ny liste</button>
              <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => { setShowListPicker(false); setShowJoin(true); }}>Tilslut med link</button>
            </div>
          ) : (
            <div style={{ display:"flex", gap:8, marginTop:8, padding:"0 4px" }}>
              <input className="field" placeholder="Fx. Weekend, Fest…" autoFocus style={{ flex:1, marginBottom:0 }}
                value={newListName} onChange={e => setNewListName(e.target.value)}
                onKeyDown={async e => { if (e.key === "Enter" && newListName.trim()) { await createList(newListName); setNewListName(""); setShowNewList(false); setShowListPicker(false); } }} />
              <button className="btn btn-primary btn-sm" onClick={async () => { if (newListName.trim()) { await createList(newListName); setNewListName(""); setShowNewList(false); setShowListPicker(false); } }}>
                Opret
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tilslut med link ── */}
      {showJoin && (
        <div className="card" style={{ marginBottom:14 }}>
          <div className="card-lbl" style={S.mb10}>Tilslut liste med link</div>
          <div className="input-row">
            <input className="field" placeholder="Indsæt det delte link"
              value={joinCode} onChange={e => { setJoinCode(e.target.value); setJoinError(""); }}
              onKeyDown={e => e.key === "Enter" && handleJoin()} />
            <button className="btn btn-primary btn-sm" style={UI.uwsnowrap} disabled={joinLoading || !joinCode.trim()} onClick={handleJoin}>
              {joinLoading ? "…" : "Tilslut"}
            </button>
          </div>
          {joinError && <div style={{ fontSize:11, color:"var(--red)", marginTop:6 }}>{joinError}</div>}
        </div>
      )}

      {showShareSheet && activeList && (
        <ShareSheet list={activeList} familyMembers={familyMembers} loadFamilyMembers={loadFamilyMembers}
          getListAccess={getListAccess} grantAccess={grantAccess} revokeAccess={revokeAccess} setListType={setListType}
          onClose={() => setShowShareSheet(false)} />
      )}

      {/* ── Favoritter (åbnes via ❤️-ikonet i listevælger-rækken — hjertet er
           appens faste favorit-ikon, se fx RecipesScreen/ProfileScreen) ── */}
      {favorites.length > 0 && favoritesOpen && (
        <div className="card" style={S.mb12}>
          <div className="card-lbl">Dine favoritter ({favorites.length})</div>
          <>
              {favorites.slice(0,10).map(p => {
                const { status } = compareAllergens(p.allergen_flags||{}, activeIds);
                const statusColor = status==="safe" ? "var(--green)" : status==="danger" ? "var(--red)" : "var(--amber)";
                return (
                  <div key={p.ean||p.id}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom:"1px solid var(--border)", cursor:"pointer" }}
                    onClick={() => lookupProduct(p.ean||p.code||p.id)}>
                    <ProductImage product={p} size={28} />
                    <div style={{ ...S.flexMin, display:"flex", alignItems:"baseline", gap:6 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{productDisplayName(p)}</span>
                      {p.brand && <span style={{ fontSize:10, color:"var(--muted)", flexShrink:0 }}>{p.brand}</span>}
                    </div>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:statusColor, flexShrink:0 }} />
                    <button type="button" className="btn btn-ghost btn-sm" aria-label={`Tilføj "${productDisplayName(p)}" til indkøbsliste`}
                      style={{ flexShrink:0, width:34, padding:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, lineHeight:1 }}
                      onClick={e => { e.stopPropagation(); addToList({ name: productDisplayName(p), ean: p.ean || p.code, id: p.id, image_url: p.image_url }); }}>
                      +
                    </button>
                  </div>
                );
              })}
              {favorites.length > 10 && (
                <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", paddingTop:8, cursor:"pointer" }}
                  onClick={() => setScreen(SCREENS.FAVORITES)}>
                  Se alle {favorites.length} favoritter →
                </div>
              )}
          </>
        </div>
      )}

      {/* ── Tom tilstand ── */}
      {shoppingList.length === 0 && (
        <div className="empty-state">
          <div className="empty-txt">Listen er tom</div>
          <div className="empty-sub">Tilføj din første vare</div>
        </div>
      )}

      {/* ── Mangler ── */}
      {shoppingList.filter(i => !i.checked).length > 0 && (
        <>
          <div className="list-section">
            Mangler ({shoppingList.filter(i=>!i.checked).length})
          </div>
          {shoppingList.filter(i => !i.checked).map(item => (
            <div key={item.id} className="list-item">
              <div className="list-check" role="checkbox" aria-checked="false" aria-label={`Markér "${item.name}" som købt`} tabIndex={0}
                onClick={() => toggleItem(item.id)} onKeyDown={e => e.key === "Enter" && toggleItem(item.id)} />
              {item.ean && <ProductImage product={item} size={22} />}
              {item.ean
                ? <div className="list-name" role="link" tabIndex={0} style={{ cursor:"pointer", textDecoration:"underline", textDecorationColor:"var(--border2)", textUnderlineOffset:3 }}
                    onClick={() => lookupProduct(item.ean)} onKeyDown={e => e.key === "Enter" && lookupProduct(item.ean)}>{item.name}</div>
                : <div className="list-name">{item.name}</div>}
              <div className="list-del" role="button" aria-label={`Slet "${item.name}"`} tabIndex={0}
                onClick={() => removeItem(item.id)} onKeyDown={e => e.key === "Enter" && removeItem(item.id)}>
                <Icon name="trash" size={16} color="var(--muted)" />
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── Købt ── */}
      {shoppingList.filter(i => i.checked).length > 0 && (
        <>
          <div className="list-section" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span>Købt ({shoppingList.filter(i=>i.checked).length})</span>
            <span style={{ cursor:"pointer", color:"var(--red)", fontWeight:700, fontSize:12, padding:"4px 2px" }} role="button" aria-label="Ryd alle købte varer" tabIndex={0}
              onClick={clearDone} onKeyDown={e => e.key === "Enter" && clearDone()}>Ryd</span>
          </div>
          {shoppingList.filter(i => i.checked).map(item => (
            <div key={item.id} className="list-item done">
              <div className="list-check checked" role="checkbox" aria-checked="true" aria-label={`Fjern "${item.name}" fra købt`} tabIndex={0}
                onClick={() => toggleItem(item.id)} onKeyDown={e => e.key === "Enter" && toggleItem(item.id)}>✓</div>
              {item.ean && <ProductImage product={item} size={22} />}
              {item.ean
                ? <div className="list-name done" role="link" tabIndex={0} style={{ cursor:"pointer" }}
                    onClick={() => lookupProduct(item.ean)} onKeyDown={e => e.key === "Enter" && lookupProduct(item.ean)}>{item.name}</div>
                : <div className="list-name done">{item.name}</div>}
              <div className="list-del" role="button" aria-label={`Slet "${item.name}"`} tabIndex={0}
                onClick={() => removeItem(item.id)} onKeyDown={e => e.key === "Enter" && removeItem(item.id)}>
                <Icon name="trash" size={16} color="var(--muted)" />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
