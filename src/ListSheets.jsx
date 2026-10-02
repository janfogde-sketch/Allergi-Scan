// @ts-nocheck
// Bottom-sheets til indkøbslisten: listevælger (skift/opret/tilslut/slet) og deling. Listenavne er brugerdata og vises kun som tekst
// (ellipsis/ombrydning), aldrig som faste systemtekster. Portal til body, fordi .screen.fade-in fanger position:fixed (CLAUDE.md §3 regel 4).
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon, ConfirmDialog, showToast } from "./SharedComponents.jsx";
import { isSharedList, listShareStatus, joinNames } from "./listShare.js";

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
    else setJoinError(res.error || "Kunne ikke tilslutte listen. Tjek, at linket er helt.");
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
            <Icon name="link" size={14} color="var(--ink)" /> Tilslut delt liste
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
          <div style={{ ...LBL, marginBottom:4 }}>Tilslut delt liste</div>
          <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8, lineHeight:1.4 }}>Har nogen sendt dig et link til deres liste? Indsæt linket her, så kan du se og redigere den.</div>
          <div style={{ display:"flex", gap:8 }}>
            <input className="field" placeholder="Indsæt linket" autoFocus style={{ flex:1, minWidth:0, marginBottom:0, height:44, padding:"0 12px" }}
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

// ── Del liste ────────────────────────────────────────────────────────────────
// Tre valg i stedet for tre overlappende mekanismer: Kun mig / Hele familien / Bestemte personer. "Har adgang nu" viser ALLE med
// adgang (også dem, der er kommet ind via link) med en Fjern-knap. Link til en uden for familien er en separat, tydelig handling.
const CARD = { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12 };
const BTN_TEXT = { minHeight:44, padding:"0 4px", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", fontSize:13, fontWeight:700 };

function ModeOption({ selected, disabled, title, sub, onSelect }) {
  return (
    <button type="button" role="radio" aria-checked={selected} disabled={disabled} onClick={onSelect}
      style={{ ...CARD, width:"100%", minHeight:56, display:"flex", alignItems:"center", gap:12, padding:"10px 14px", textAlign:"left", fontFamily:"var(--f)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .55 : 1,
        borderColor: selected ? "var(--green)" : "var(--border)", background: selected ? "var(--green-selected-bg)" : "var(--surface)" }}>
      <span aria-hidden="true" style={{ width:22, height:22, flexShrink:0, borderRadius:"50%", border:`2px solid ${selected ? "var(--green)" : "var(--border2)"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {selected && <span style={{ width:10, height:10, borderRadius:"50%", background:"var(--green)" }} />}
      </span>
      <span style={{ flex:1, minWidth:0 }}>
        <span style={{ display:"block", fontSize:14, fontWeight:700, color:"var(--ink)" }}>{title}</span>
        <span style={{ display:"block", fontSize:12, color:"var(--muted)", marginTop:2, lineHeight:1.4, ...WRAP }}>{sub}</span>
      </span>
    </button>
  );
}

function PersonRow({ name, tag, actionLabel, onAction, actionAria, primary }) {
  return (
    <div style={{ ...CARD, display:"flex", alignItems:"center", gap:10, minHeight:52, padding:"6px 6px 6px 14px" }}>
      <span style={{ flex:1, minWidth:0 }}>
        <span style={{ display:"block", fontSize:14, fontWeight:600, color:"var(--ink)", ...WRAP }}>{name}</span>
        {tag && <span style={{ display:"block", fontSize:11.5, color:"var(--muted)", marginTop:1 }}>{tag}</span>}
      </span>
      {onAction && (
        <button type="button" onClick={onAction} aria-label={actionAria} style={{ ...BTN_TEXT, minWidth:64, color: primary ? "var(--green)" : "var(--red)" }}>{actionLabel}</button>
      )}
    </div>
  );
}

export function ShareListSheet({ list, userId, familyMembers, loadFamilyMembers, getListAccess, grantAccess, revokeAccess, setListType, rotateListCode, leaveList, onChanged, onGoToFamily, onClose }) {
  const [access, setAccess]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const [confirm, setConfirm] = useState(null); // "private" | "newlink" | "leave"
  const isOwner = list.owner_id === userId;
  const [mode, setMode] = useState(list.type === "family" ? "family" : (list.shared_with?.length > 0 ? "people" : "private"));

  useEffect(() => {
    loadFamilyMembers();
    if (!isOwner) { setLoading(false); return; }
    getListAccess(list.id).then(a => { setAccess(a); setLoading(false); });
  }, [list.id]);

  const nameOf = m => m.name || m.email || "Ukendt";
  const famIds = new Set(familyMembers.map(m => m.id));
  const accessIds = new Set(access.map(a => a.user_id));
  const linkRows = access.filter(a => !famIds.has(a.user_id));          // tilsluttet via link
  const pickedMembers = familyMembers.filter(m => accessIds.has(m.id)); // valgt af ejeren
  const otherMembers = familyMembers.filter(m => !accessIds.has(m.id));
  const shareLink = `https://eatsafe.dk/?join-list=${list.share_link}`;
  const ownerName = list.owner_name || "ejeren";

  const grant = async (m) => {
    setAccess(a => [...a, { user_id: m.id, permission: "edit", users: { name: m.name, email: m.email } }]);
    if (await grantAccess(list.id, m.id, "edit")) onChanged?.();
    else { setAccess(a => a.filter(x => x.user_id !== m.id)); showToast("Kunne ikke give adgang. Prøv igen.", "error"); }
  };
  const revoke = async (userIdToRevoke, row) => {
    setAccess(a => a.filter(x => x.user_id !== userIdToRevoke));
    if (await revokeAccess(list.id, userIdToRevoke)) onChanged?.();
    else { setAccess(a => [...a, row]); showToast("Kunne ikke fjerne adgangen. Prøv igen.", "error"); }
  };
  const chooseMode = async (m) => {
    if (m === mode) return;
    if (m === "private" && access.length > 0) { setConfirm("private"); return; }
    if (m === "family") await setListType(list.id, "family");
    else if (list.type === "family") await setListType(list.id, "personal");
    setMode(m);
    onChanged?.();
  };
  const stopSharing = async () => {
    setConfirm(null);
    if (list.type === "family") await setListType(list.id, "personal");
    const rows = access;
    setAccess([]);
    const results = await Promise.all(rows.map(r => revokeAccess(list.id, r.user_id)));
    if (results.some(ok => !ok)) { showToast("Ikke alle kunne fjernes. Åbn Del liste og prøv igen.", "error"); getListAccess(list.id).then(setAccess); }
    setMode("private");
    onChanged?.();
  };

  const familySub = familyMembers.length > 0 ? `${joinNames(familyMembers.map(m => (nameOf(m)).split(" ")[0]))} kan se og redigere listen.` : "Du har ingen i din familie endnu. Invitér en voksen først.";

  if (!isOwner) {
    return (
      <Sheet label="Del liste" onClose={onClose}>
        <SheetHeader title="Del liste" sub={list.name} onClose={onClose} />
        <div style={{ ...CARD, padding:14, marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:14, fontWeight:700, color:"var(--ink)" }}><Icon name="family" size={14} color="var(--ink)" /> Delt af {ownerName}</div>
          <div style={{ fontSize:13, color:"var(--muted2)", marginTop:6, lineHeight:1.5 }}>
            Alle med adgang kan tilføje, afkrydse og fjerne varer. Det er {ownerName}, der bestemmer, hvem listen er delt med.
          </div>
          <div style={{ fontSize:12, color:"var(--muted)", marginTop:8, lineHeight:1.5 }}>
            {list.via_access ? "Du har fået adgang, fordi du er valgt eller tilsluttet via et link." : `Du kan se listen, fordi ${ownerName} deler den med hele familien.`}
          </div>
        </div>
        {list.via_access && (
          <button type="button" className="btn btn-outline" style={{ width:"100%", minHeight:44, color:"var(--red)", borderColor:"var(--red-md)" }} onClick={() => setConfirm("leave")}>Forlad listen</button>
        )}
        {confirm === "leave" && (
          <ConfirmDialog title={`Forlad listen "${list.name}"?`} message={`Du kan ikke længere se eller redigere den. ${ownerName} kan give dig adgang igen.`} confirmLabel="Forlad listen"
            onConfirm={async () => { setConfirm(null); if (await leaveList(list.id)) onClose(); }} onCancel={() => setConfirm(null)} />
        )}
      </Sheet>
    );
  }

  return (
    <Sheet label="Del liste" onClose={onClose}>
      <SheetHeader title="Del liste" sub={list.name} onClose={onClose} />
      <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.5, marginBottom:16 }}>Vælg, hvem der kan se og redigere listen. Alle med adgang kan tilføje, afkrydse og fjerne varer.</div>

      <div style={{ ...LBL, marginBottom:8 }}>Hvem skal have adgang?</div>
      <div role="radiogroup" aria-label="Hvem skal have adgang?" style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
        <ModeOption selected={mode === "private"} title="Kun mig" sub="Ingen andre kan se eller ændre listen." onSelect={() => chooseMode("private")} />
        <ModeOption selected={mode === "family"} disabled={familyMembers.length === 0} title="Hele familien" sub={familySub} onSelect={() => chooseMode("family")} />
        <ModeOption selected={mode === "people"} disabled={familyMembers.length === 0 && mode !== "people"} title="Bestemte personer" sub="Vælg, hvem i din familie der kan redigere listen." onSelect={() => chooseMode("people")} />
      </div>
      {familyMembers.length === 0 && (
        <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, marginTop:-8, marginBottom:20 }}>
          Familie er de voksne, du har inviteret med egen konto.{" "}
          {onGoToFamily && <button type="button" onClick={onGoToFamily} style={{ ...BTN_TEXT, minHeight:0, padding:0, color:"var(--green)", fontSize:12 }}>Gå til Familie og invitér</button>}
        </div>
      )}

      {(mode !== "private" || linkRows.length > 0) && (
        <>
          <div style={{ ...LBL, marginBottom:8 }}>Har adgang nu</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom: mode === "people" && otherMembers.length > 0 ? 16 : 20 }}>
            <PersonRow name="Dig" tag="Ejer af listen" />
            {loading && <div style={{ fontSize:13, color:"var(--muted)" }}>Henter…</div>}
            {mode === "family" && familyMembers.map(m => <PersonRow key={m.id} name={nameOf(m)} tag="Via hele familien" />)}
            {mode === "people" && pickedMembers.map(m => {
              const row = access.find(a => a.user_id === m.id);
              return <PersonRow key={m.id} name={nameOf(m)} tag="Valgt af dig" actionLabel="Fjern" actionAria={`Fjern ${nameOf(m)} fra listen`} onAction={() => revoke(m.id, row)} />;
            })}
            {linkRows.map(r => (
              <PersonRow key={r.user_id} name={r.users?.name || r.users?.email || "Ukendt"} tag="Tilsluttet via link"
                actionLabel="Fjern" actionAria={`Fjern ${r.users?.name || "personen"} fra listen`} onAction={() => revoke(r.user_id, r)} />
            ))}
            {!loading && mode === "people" && pickedMembers.length === 0 && linkRows.length === 0 && (
              <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5 }}>Ingen valgt endnu. Vælg nedenfor.</div>
            )}
          </div>
        </>
      )}

      {mode === "people" && otherMembers.length > 0 && (
        <>
          <div style={{ ...LBL, marginBottom:8 }}>Giv adgang til</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
            {otherMembers.map(m => (
              <PersonRow key={m.id} name={nameOf(m)} tag="I din familie" primary actionLabel="Tilføj" actionAria={`Giv ${nameOf(m)} adgang til listen`} onAction={() => grant(m)} />
            ))}
          </div>
        </>
      )}

      <div style={{ ...LBL, marginBottom:4 }}>Send til en uden for familien</div>
      <div style={{ ...CARD, padding:14 }}>
        <div style={{ fontSize:12.5, color:"var(--ink2)", lineHeight:1.5, marginBottom:4 }}>Fx en ven eller nabo. Personen får adgang til denne ene liste og ser ikke dine allergier.</div>
        <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, marginBottom:12 }}>Alle, der får linket, kan redigere listen, så send det kun til folk, du stoler på.</div>
        <div style={{ display:"flex", gap:8 }}>
          {navigator.share ? (
            <>
              <button type="button" className="btn btn-primary" style={{ flex:1, minHeight:44 }} onClick={() => navigator.share({ title: `Indkøbsliste: ${list.name}`, url: shareLink }).catch(() => {})}>
                <Icon name="share" size={14} color="var(--on-green)" /> Send link
              </button>
              <button type="button" className="btn btn-outline" style={{ minHeight:44 }}
                onClick={() => { navigator.clipboard?.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                <Icon name={copied ? "check" : "link"} size={14} color="var(--ink)" /> {copied ? "Kopieret" : "Kopiér"}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary" style={{ flex:1, minHeight:44 }}
              onClick={() => { navigator.clipboard?.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              <Icon name={copied ? "check" : "link"} size={14} color="var(--on-green)" /> {copied ? "Link kopieret" : "Kopiér link"}
            </button>
          )}
        </div>
        <button type="button" onClick={() => setConfirm("newlink")} style={{ ...BTN_TEXT, marginTop:4, color:"var(--muted2)" }}>Lav nyt link</button>
      </div>

      {confirm === "private" && (
        <ConfirmDialog title="Stop deling af listen?" message="Alle mister adgangen til listen, også dem der er tilsluttet via link. Listen og varerne beholder du selv." confirmLabel="Stop deling"
          onConfirm={stopSharing} onCancel={() => setConfirm(null)} />
      )}
      {confirm === "newlink" && (
        <ConfirmDialog title="Lav et nyt link?" message="Det gamle link virker ikke længere. De, der allerede er tilsluttet, beholder adgangen, indtil du fjerner dem." confirmLabel="Lav nyt link" danger={false}
          onConfirm={async () => { setConfirm(null); await rotateListCode(list.id); }} onCancel={() => setConfirm(null)} />
      )}
    </Sheet>
  );
}
