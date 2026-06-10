// @ts-nocheck
import React from "react";
import { SCREENS } from "./constants.jsx";
import { compareAllergens } from "./helpers.js";
import { Icon, ProductImage } from "./SharedComponents.jsx";

const S = {
  flexMin: { flex:1, minWidth:0 },
  mb12:    { marginBottom:12 },
  mb10:    { marginBottom:10 },
  h13b:    { fontSize:13, fontWeight:700, color:"var(--ink)" },
  sub11:   { fontSize:11, color:"var(--muted)" },
};

export default function ListScreen({
  shoppingList,
  newItemName, setNewItemName,
  favorites,
  activeIds,
  addToList,
  toggleItem,
  removeItem,
  clearDone,
  lookupProduct,
  setScreen,
}) {
  return (
    <div className="screen fade-in">
      <div className="screen-title">Indkøbsliste</div>

      {/* ── Favoritter ── */}
      {favorites.length > 0 && (
        <div className="card" style={S.mb12}>
          <div className="card-lbl" style={S.mb10}>Dine favoritter</div>
          {favorites.slice(0,10).map(p => {
            const { status } = compareAllergens(p.allergen_flags||{}, activeIds);
            const statusColor = status==="safe" ? "var(--green)" : status==="danger" ? "var(--red)" : "var(--amber)";
            const statusLabel = status==="safe" ? "Sikker" : status==="danger" ? "Farlig" : "Advarsel";
            const tagLabels   = { vegan:"🌱 Vegansk", vegetarian:"🥦 Vegetarisk" };
            return (
              <div key={p.ean||p.id}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border)", cursor:"pointer" }}
                onClick={() => lookupProduct(p.ean||p.code||p.id)}>
                <ProductImage product={p} size={44} />
                <div style={S.flexMin}>
                  <div style={S.h13b}>{p.name}</div>
                  <div style={S.sub11}>{p.brand}</div>
                  {p.tags?.length > 0 && (
                    <div style={{ display:"flex", gap:4, marginTop:3, flexWrap:"wrap" }}>
                      {p.tags.map((t,i) => (
                        <span key={i} style={{ fontSize:10, fontWeight:700, color:"var(--green)", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:100, padding:"1px 7px" }}>
                          {tagLabels[t]||t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:statusColor }}>{statusLabel}</div>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize:11, padding:"3px 8px" }}
                    onClick={e => { e.stopPropagation(); addToList(p.name); }}>
                    + Liste
                  </button>
                </div>
              </div>
            );
          })}
          {favorites.length > 10 && (
            <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", paddingTop:8, cursor:"pointer" }}
              onClick={() => setScreen(SCREENS.FAVORITES)}>
              Se alle {favorites.length} favoritter →
            </div>
          )}
        </div>
      )}

      {/* ── Del-bar ── */}
      <div className="share-bar">
        <span style={{ fontSize:18 }}></span>
        <span className="share-txt">Del listen med familie via link</span>
        <button className="btn btn-ghost btn-sm" style={{ fontSize:12 }}
          onClick={() => { navigator.clipboard?.writeText(window.location.href); alert("Link kopieret! 📋"); }}>
          Kopiér
        </button>
      </div>

      {/* ── Tilføj vare ── */}
      <div className="card" style={{ padding:"13px 14px", marginBottom:14 }}>
        <div className="card-lbl">Tilføj vare</div>
        <div className="input-row">
          <input className="field" placeholder="Fx. Glutenfri pasta…"
            value={newItemName} onChange={e => setNewItemName(e.target.value)}
            onKeyDown={e => e.key==="Enter" && addToList(newItemName)} />
          <button className="btn btn-primary btn-sm" style={{ whiteSpace:"nowrap" }}
            onClick={() => addToList(newItemName)}>
            Tilføj
          </button>
        </div>
      </div>

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
              <div className="list-check" onClick={() => toggleItem(item.id)} />
              <div className="list-name">{item.name}</div>
              <div className="list-del" onClick={() => removeItem(item.id)}>
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
            <span style={{ cursor:"pointer", color:"var(--red)", fontWeight:700, fontSize:12 }} onClick={clearDone}>Ryd</span>
          </div>
          {shoppingList.filter(i => i.checked).map(item => (
            <div key={item.id} className="list-item done">
              <div className="list-check checked" onClick={() => toggleItem(item.id)}>✓</div>
              <div className="list-name done">{item.name}</div>
              <div className="list-del" onClick={() => removeItem(item.id)}>
                <Icon name="trash" size={16} color="var(--muted)" />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
