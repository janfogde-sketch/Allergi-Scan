// @ts-nocheck
// Bottom-sheets til indkøbslisten: listevælger (skift/opret/tilslut/slet) og deling. Listenavne er brugerdata og vises kun som tekst
// (ellipsis/ombrydning), aldrig som faste systemtekster. Portal til body, fordi .screen.fade-in fanger position:fixed (CLAUDE.md §3 regel 4).
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./SharedComponents.jsx";
import { isSharedList, listShareStatus } from "./listShare.js";

const LBL = { fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".8px" };
const WRAP = { overflowWrap:"anywhere", wordBreak:"break-word" };

function Sheet({ label, onClose, children }) {
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={label} onClick={e => e.stopPropagation()}
        style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"16px 16px 28px", width:"100%", maxHeight:"85vh", overflowY:"auto", boxShadow:"var(--sh)" }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

function SheetHeader({ title, sub, onClose, right }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:16 }}>
      <div style={{ flex:1, minWidth:0, paddingTop:4 }}>
        <div style={{ fontSize:18, fontWeight:800, color:"var(--ink)", lineHeight:1.25 }}>{title}</div>
        {sub && <div style={{ fontSize:13, fontWeight:600, color:"var(--ink2)", marginTop:4, lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", ...WRAP }}>{sub}</div>}
      </div>
      {right}
      <button type="button" onClick={onClose} aria-label="Luk"
        style={{ width:44, height:44, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"50%", cursor:"pointer" }}>
        <Icon name="x" size={16} color="var(--ink)" />
      </button>
    </div>
  );
}

// Ét fælles ikon (family) og én statuslinje for delte lister.
function ShareStatus({ list, userId, color = "var(--muted)" }) {
  const shared = isSharedList(list, userId);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color, marginTop:2 }}>
      {shared && <Icon name="family" size={12} color={color} />}
      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{listShareStatus(list, userId)}</span>
    </div>
  );
}

export { ShareStatus };

export function ListSwitcherSheet({ lists, activeListId, userId, onSelect, onClose, createList, joinByCode, onRequestDelete }) {
  const [mode, setMode]       = useState(null); // null | "new" | "join"
  const [editLists, setEdit]  = useState(false);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode]       = useState("");
  const [joinError, setJoinError]     = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const canDeleteAny = lists.length > 1 && lists.some(l => l.owner_id === userId);
  useEffect(() => { if (!canDeleteAny) setEdit(false); }, [canDeleteAny]);

  const submitNew = async () => {
    if (!newName.trim()) return;
    await createList(newName);
    setNewName(""); setMode(null); onClose();
  };
  const submitJoin = async () => {
    setJoinLoading(true); setJoinError("");
    // Accepter både et fuldt link (?join-list=KODE) og en rå kode indsat direkte
    let code = joinCode.trim();
    try { code = new URL(code).searchParams.get("join-list") || code; } catch { /* ikke et link — brug som kode */ }
    const res = await joinByCode(code);
    setJoinLoading(false);
    if (res.success) { setJoinCode(""); setMode(null); onClose(); }
    else setJoinError(res.error || "Kunne ikke tilslutte listen");
  };

  return (
    <Sheet label="Dine lister" onClose={onClose}>
      <SheetHeader title="Dine lister" onClose={onClose}
        right={canDeleteAny && (
          <button type="button" onClick={() => setEdit(v => !v)}
            style={{ minHeight:44, padding:"0 8px", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--green)" }}>
            {editLists ? "Færdig" : "Rediger"}
          </button>
        )} />
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
        {lists.map(l => {
          const isActive = l.id === activeListId;
          const deletable = l.owner_id === userId && lists.length > 1;
          return (
            <div key={l.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button type="button" aria-current={isActive ? "true" : undefined} disabled={editLists}
                onClick={() => { onSelect(l.id); onClose(); }}
                style={{ flex:1, minWidth:0, minHeight:56, display:"flex", alignItems:"center", gap:10, padding:"8px 14px", textAlign:"left", fontFamily:"var(--f)", cursor: editLists ? "default" : "pointer",
                  background: isActive ? "var(--green-selected-bg)" : "var(--surface)", border:`1px solid ${isActive ? "var(--green)" : "var(--border)"}`, borderRadius:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight: isActive ? 800 : 600, color: isActive ? "var(--green)" : "var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.name}</div>
                  <ShareStatus list={l} userId={userId} />
                </div>
                {isActive && !editLists && <Icon name="check" size={18} color="var(--green)" />}
              </button>
              {editLists && deletable && (
                <button type="button" aria-label={`Slet listen ${l.name}`} onClick={() => onRequestDelete(l)}
                  style={{ flexShrink:0, minHeight:44, minWidth:64, padding:"0 12px", background:"none", border:"1px solid var(--red-md)", borderRadius:12, cursor:"pointer", fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--red)" }}>
                  Slet
                </button>
              )}
            </div>
          );
        })}
      </div>

      {mode === null && (
        <div style={{ display:"flex", gap:8 }}>
          <button type="button" className="list-picker-action" onClick={() => setMode("new")}>
            <Icon name="plus" size={14} color="var(--ink)" /> Ny liste
          </button>
          <button type="button" className="list-picker-action" onClick={() => setMode("join")}>
            <Icon name="link" size={14} color="var(--ink)" /> Tilslut med link
          </button>
        </div>
      )}
      {mode === "new" && (
        <div>
          <div style={{ ...LBL, marginBottom:8 }}>Ny liste</div>
          <div style={{ display:"flex", gap:8 }}>
            <input className="field" placeholder="Fx. Weekend, Fest…" autoFocus maxLength={60} style={{ flex:1, minWidth:0, marginBottom:0, height:44, padding:"0 12px" }}
              value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && submitNew()} />
            <button type="button" className="btn btn-primary" style={{ minHeight:44, padding:"0 16px" }} disabled={!newName.trim()} onClick={submitNew}>Opret</button>
          </div>
          <button type="button" onClick={() => setMode(null)} style={{ minHeight:44, background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--muted)" }}>Annullér</button>
        </div>
      )}
      {mode === "join" && (
        <div>
          <div style={{ ...LBL, marginBottom:8 }}>Tilslut med link</div>
          <div style={{ display:"flex", gap:8 }}>
            <input className="field" placeholder="Indsæt det delte link" autoFocus style={{ flex:1, minWidth:0, marginBottom:0, height:44, padding:"0 12px" }}
              value={joinCode} onChange={e => { setJoinCode(e.target.value); setJoinError(""); }} onKeyDown={e => e.key === "Enter" && joinCode.trim() && submitJoin()} />
            <button type="button" className="btn btn-primary" style={{ minHeight:44, padding:"0 16px", whiteSpace:"nowrap" }} disabled={joinLoading || !joinCode.trim()} onClick={submitJoin}>
              {joinLoading ? "…" : "Tilslut"}
            </button>
          </div>
          {joinError && <div style={{ fontSize:12, color:"var(--red)", marginTop:6 }}>{joinError}</div>}
          <button type="button" onClick={() => setMode(null)} style={{ minHeight:44, background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--muted)" }}>Annullér</button>
        </div>
      )}
    </Sheet>
  );
}

export function ShareListSheet({ list, familyMembers, loadFamilyMembers, getListAccess, grantAccess, revokeAccess, setListType, onClose }) {
  const [access, setAccess]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    loadFamilyMembers();
    getListAccess(list.id).then(a => { setAccess(a); setLoading(false); });
  }, [list.id]);

  const sharedIds = new Set(access.map(a => a.user_id));
  const shareLink = `https://eatsafe.dk/?join-list=${list.share_link}`;
  const isFamily = list.type === "family";

  const toggleMember = async (memberId) => {
    if (sharedIds.has(memberId)) {
      setAccess(a => a.filter(x => x.user_id !== memberId));
      await revokeAccess(list.id, memberId);
    } else {
      setAccess(a => [...a, { user_id: memberId, permission: "edit" }]);
      await grantAccess(list.id, memberId, "edit");
    }
  };

  const card = { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, boxShadow:"var(--sh2)" };
  return (
    <Sheet label="Del liste" onClose={onClose}>
      <SheetHeader title="Del liste" sub={list.name} onClose={onClose} />
      <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.5, marginBottom:20 }}>Alle med adgang kan redigere listen.</div>

      <div style={{ ...LBL, marginBottom:8 }}>Hele familien</div>
      <button type="button" role="switch" aria-checked={isFamily} onClick={() => setListType(list.id, isFamily ? "personal" : "family")}
        style={{ ...card, width:"100%", minHeight:56, display:"flex", alignItems:"center", gap:12, padding:"10px 14px", textAlign:"left", fontFamily:"var(--f)", cursor:"pointer", marginBottom:20,
          borderColor: isFamily ? "var(--green)" : "var(--border)", background: isFamily ? "var(--green-selected-bg)" : "var(--surface)" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:14, fontWeight:700, color:"var(--ink)" }}><Icon name="family" size={14} color="var(--ink)" /> Del med hele familien</div>
          <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>Alle, du har inviteret til EatSafe</div>
        </div>
        <span style={{ fontSize:12, fontWeight:700, color: isFamily ? "var(--green)" : "var(--muted)", minWidth:20, textAlign:"right" }}>{isFamily ? "Til" : "Fra"}</span>
        <span aria-hidden="true" style={{ width:48, height:28, borderRadius:20, background: isFamily ? "var(--green)" : "var(--border2)", position:"relative", flexShrink:0, transition:"background .2s" }}>
          <span style={{ position:"absolute", top:3, left: isFamily ? 23 : 3, width:22, height:22, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 3px rgba(0,0,0,.25)", transition:"left .2s" }} />
        </span>
      </button>

      <div style={{ ...LBL, marginBottom:4 }}>Udvalgte personer</div>
      <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8, lineHeight:1.4 }}>Kun personer med egen EatSafe-konto kan vælges.</div>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
        {loading ? (
          <div style={{ fontSize:13, color:"var(--muted)" }}>Henter…</div>
        ) : familyMembers.length === 0 ? (
          <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.5 }}>Du har ikke inviteret nogen endnu. Brug "Inviter" under Familie, eller del listen med et link.</div>
        ) : familyMembers.map(m => {
          const on = sharedIds.has(m.id);
          return (
            <button key={m.id} type="button" role="checkbox" aria-checked={on} onClick={() => toggleMember(m.id)}
              style={{ ...card, boxShadow:"none", width:"100%", minHeight:52, display:"flex", alignItems:"center", gap:12, padding:"8px 14px", textAlign:"left", fontFamily:"var(--f)", cursor:"pointer",
                borderColor: on ? "var(--green)" : "var(--border)", background: on ? "var(--green-selected-bg)" : "var(--surface)" }}>
              <span style={{ flex:1, minWidth:0, fontSize:14, fontWeight:600, color:"var(--ink)", ...WRAP }}>{m.name || m.email}</span>
              <span aria-hidden="true" style={{ width:24, height:24, flexShrink:0, borderRadius:7, border:`2px solid ${on ? "var(--green)" : "var(--border2)"}`, background: on ? "var(--green)" : "var(--surface)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {on && <Icon name="check" size={14} color="var(--on-green)" />}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ ...LBL, marginBottom:8 }}>Via link</div>
      <div style={{ ...card, padding:14 }}>
        <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10 }}>Alle med linket kan tilslutte sig.</div>
        <div style={{ display:"flex", gap:8 }}>
          <button type="button" className="btn btn-primary" style={{ flex:1, minHeight:44 }}
            onClick={() => { navigator.clipboard?.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
            <Icon name={copied ? "check" : "link"} size={14} color="var(--on-green)" /> {copied ? "Link kopieret" : "Kopiér link"}
          </button>
          {navigator.share && (
            <button type="button" className="btn btn-outline" style={{ minHeight:44 }}
              onClick={() => navigator.share({ title: `Indkøbsliste: ${list.name}`, url: shareLink })}>
              <Icon name="share" size={14} color="var(--ink)" /> Del
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
