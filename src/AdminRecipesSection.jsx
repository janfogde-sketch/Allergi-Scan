// @ts-nocheck
import React from "react";
import { ALLERGENS } from "./constants.jsx";
import { Loader, Icon } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";

export default function AdminRecipesSection({
  adminRecipes, adminRecipesLoading, adminRecipeFilter, setAdminRecipeFilter, loadAdminRecipes,
  editingRecipe, setEditingRecipe, recipeActionLoading, saveRecipeEdit, updateRecipeStatus,
}) {
  return (
    <div style={UI.pb120}>
      {/* Filter tabs */}
      <div style={UI.udflex_g6_mb14}>
        {[{val:"pending",label:"Afventer",icon:"clock"},{val:"approved",label:"Godkendte",icon:"check"},{val:"rejected",label:"Afviste",icon:"x"}].map(f => (
          <button key={f.val} onClick={() => { setAdminRecipeFilter(f.val); loadAdminRecipes(f.val); }}
            style={{ padding:"8px 14px", borderRadius:100, border:`1px solid ${adminRecipeFilter===f.val?"var(--green)":"var(--border)"}`,
              background:adminRecipeFilter===f.val?"var(--green-lt)":"var(--surface)", color:adminRecipeFilter===f.val?"var(--green)":"var(--muted)",
              display:"flex", alignItems:"center", gap:6,
              fontFamily:"var(--f)", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            <Icon name={f.icon} size={11} color={adminRecipeFilter===f.val?"var(--green)":"var(--muted)"} /> {f.label}
          </button>
        ))}
        <button onClick={() => loadAdminRecipes()} style={{ marginLeft:"auto", padding:"8px 12px", borderRadius:100, border:"1px solid var(--border)", background:"var(--surface)", color:"var(--muted)", fontFamily:"var(--f)", cursor:"pointer", display:"flex" }}><Icon name="refresh" size={12} color="var(--muted)" /></button>
      </div>

      {/* Detail-visning */}
      {editingRecipe && (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:16, marginBottom:16, boxShadow:"var(--sh)" }}>
          <div style={UI.udflex_jcspacebet_aicenter_mb12}>
            <div style={UI.ufs15_fw800_cink}>Redigér opskrift</div>
            <button onClick={() => setEditingRecipe(null)} aria-label="Luk"
              style={UI.ubgsurface2_bdnone_br50_w32_h32_curpointer_fs18_cmuted}>×</button>
          </div>
          <input value={editingRecipe.title||""} onChange={e => setEditingRecipe(r=>({...r,title:e.target.value}))} placeholder="Titel"
            style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--paper)", color:"var(--ink)", fontFamily:"var(--f)", fontSize:14, boxSizing:"border-box", marginBottom:8, outline:"none" }} />
          <textarea value={editingRecipe.description||""} onChange={e => setEditingRecipe(r=>({...r,description:e.target.value}))} placeholder="Beskrivelse" rows={3}
            style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--paper)", color:"var(--ink)", fontFamily:"var(--f)", fontSize:13, boxSizing:"border-box", resize:"none", marginBottom:8, outline:"none" }} />
          <div style={UI.udgrid_gri1fr1fr_g8_mb8}>
            <select value={editingRecipe.category||"aftensmad"} onChange={e => setEditingRecipe(r=>({...r,category:e.target.value}))}
              style={UI.up8px10px_br10_bd1pxsolid_bgpaper_cink_fff_fs13_outnone}>
              {["aftensmad","morgenmad","frokost","dessert","tilbehør","snack"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" value={editingRecipe.servings||4} onChange={e => setEditingRecipe(r=>({...r,servings:+e.target.value}))} placeholder="Portioner"
              style={UI.up8px10px_br10_bd1pxsolid_bgpaper_cink_fff_fs13_outnone} />
          </div>
          {/* Allergen flags */}
          <div style={UI.sectionLbl6}>Allergener</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
            {ALLERGENS.map(a => {
              let flags = {};
              try { flags = typeof editingRecipe.allergen_flags==="string" ? JSON.parse(editingRecipe.allergen_flags) : (editingRecipe.allergen_flags||{}); } catch {}
              const isOn = flags[a.id] === true || flags[a.id] === "yes";
              return (
                <div key={a.id} onClick={() => {
                  let f = {};
                  try { f = typeof editingRecipe.allergen_flags==="string" ? JSON.parse(editingRecipe.allergen_flags) : (editingRecipe.allergen_flags||{}); } catch {}
                  const next = {...f, [a.id]: !isOn};
                  setEditingRecipe(r => ({...r, allergen_flags: JSON.stringify(next)}));
                }}
                style={{ padding:"3px 10px", borderRadius:100, cursor:"pointer", fontSize:11, fontWeight:700,
                  background: isOn?"var(--red-lt)":"var(--surface2)", color:isOn?"var(--red)":"var(--muted2)",
                  border:`1px solid ${isOn?"var(--red-md)":"var(--border)"}` }}>
                  {a.emoji} {a.label}
                </div>
              );
            })}
          </div>
          {/* Handlinger */}
          <div style={UI.rowGap8}>
            <button onClick={saveRecipeEdit} disabled={recipeActionLoading}
              style={{ flex:1, padding:"10px", borderRadius:10, background:"var(--blue-lt)", border:"1px solid var(--blue)", color:"var(--blue)", fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Icon name="save" size={13} color="var(--blue)" /> Gem ændringer
            </button>
            <button onClick={() => updateRecipeStatus(editingRecipe.id, "approved")} disabled={recipeActionLoading}
              style={{ flex:1, padding:"10px", borderRadius:10, background:"var(--green-lt)", border:"1px solid var(--green)", color:"var(--green)", fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Icon name="check" size={13} color="var(--green)" /> Godkend & publicér
            </button>
            <button onClick={() => updateRecipeStatus(editingRecipe.id, "rejected")} disabled={recipeActionLoading}
              style={{ flex:1, padding:"10px", borderRadius:10, background:"var(--red-lt)", border:"1px solid var(--red)", color:"var(--red)", fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Icon name="x" size={13} color="var(--red)" /> Afvis
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {adminRecipesLoading ? (
        <Loader text="Indlæser…" />
      ) : adminRecipes.length === 0 ? (
        <div style={UI.utacenter_p48px20px}>
          <div style={{ ...UI.ufs48_mb10, display:"flex", justifyContent:"center" }}><Icon name="package" size={40} color="var(--muted)" /></div>
          <div style={{ fontSize:15, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>Ingen {adminRecipeFilter === "pending" ? "afventende" : adminRecipeFilter === "approved" ? "godkendte" : "afviste"} opskrifter</div>
        </div>
      ) : adminRecipes.map(r => {
        let flags = {};
        try { flags = typeof r.allergen_flags==="string" ? JSON.parse(r.allergen_flags) : (r.allergen_flags||{}); } catch {}
        const flaggedAllergens = ALLERGENS.filter(a => flags[a.id]===true||flags[a.id]==="yes");
        return (
          <div key={r.id} className="admin-list-row" style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:8, boxShadow:"var(--sh)" }}
            onClick={() => setEditingRecipe(r)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
              <div style={UI.ufs14_fw800_cink}>{r.title}</div>
              <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:100,
                background:r.status==="pending"?"var(--amber-lt)":r.status==="approved"?"var(--green-lt)":"var(--red-lt)",
                color:r.status==="pending"?"var(--amber)":r.status==="approved"?"var(--green)":"var(--red)",
                border:`1px solid ${r.status==="pending"?"var(--amber-md)":r.status==="approved"?"rgba(74,222,128,.3)":"var(--red-md)"}`,
                flexShrink:0, marginLeft:8, display:"inline-flex", alignItems:"center", gap:4 }}>
                <Icon name={r.status==="pending"?"clock":r.status==="approved"?"check":"x"} size={10} color={r.status==="pending"?"var(--amber)":r.status==="approved"?"var(--green)":"var(--red)"} /> {r.status==="pending"?"Afventer":r.status==="approved"?"Godkendt":"Afvist"}
              </span>
            </div>
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:6 }}>
              {r.category} · {r.servings||"?"} pers. · {new Date(r.created_at).toLocaleDateString("da-DK")}
            </div>
            {flaggedAllergens.length > 0 && (
              <div style={UI.wrapGap4}>
                {flaggedAllergens.map(a => (
                  <span key={a.id} style={{ fontSize:10, padding:"2px 8px", borderRadius:100, background:"var(--red-lt)", color:"var(--red)", border:"1px solid var(--red-md)", fontWeight:700 }}>{a.emoji} {a.label}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
