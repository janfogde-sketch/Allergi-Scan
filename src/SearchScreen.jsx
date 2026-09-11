// @ts-nocheck
import React from "react";
import { createPortal } from "react-dom";
import { compareAllergens, productDisplayName, logSearchSelection } from "./helpers.js";
import { Loader, SearchResultRow } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useShoppingContext } from "./ShoppingContext.jsx";
import { UI } from "./styleUtils.js";

export default function SearchScreen({
  activeIds,
  searchQuery, setSearchQuery,
  searchResults,
  searchLoading,
  lookupProduct,
}) {
  const { accessToken } = useAuthContext();
  const { family, activeProfiles, setActiveProfiles } = useProfileContext();
  const { lists, activeListId, addToList } = useShoppingContext();

  // ── Vælg liste ved tilføjelse — kun nødvendigt når man har mere end én
  // indkøbsliste, ellers går det bare direkte på den ene liste man har.
  // Ventende { product, resolve } indtil brugeren har valgt (eller lukket)
  // listevælgeren, så "+"-knappen ved siden af kan vente på svaret og først
  // blive grøn når varen faktisk er lagt på en liste. ─────────────────────
  const [pendingAdd, setPendingAdd] = React.useState(null);

  const handleAddToList = (p) => new Promise(resolve => {
    if (lists.length > 1) {
      setPendingAdd({ product: p, resolve });
      return;
    }
    logSearchSelection(searchQuery, p, accessToken);
    resolve(addToList({ name: productDisplayName(p), ean: p.ean || p.code, id: p.id, image_url: p.image_url }, activeListId));
  });

  const chooseList = async (listId) => {
    const { product: p, resolve } = pendingAdd;
    setPendingAdd(null);
    logSearchSelection(searchQuery, p, accessToken);
    resolve(await addToList({ name: productDisplayName(p), ean: p.ean || p.code, id: p.id, image_url: p.image_url }, listId));
  };

  const cancelAddToList = () => {
    pendingAdd?.resolve(false);
    setPendingAdd(null);
  };

  // ── Sikker søgning: skjul produkter der er farlige for den valgte profil-
  // gruppe, og vis spor-produkter i stedet for at gemme dem — samme regel
  // som i indkøbslistens "Tilføj vare" ── ──────────────────────────────────
  const resultsWithSafety = searchResults
    .map(p => ({ product: p, status: compareAllergens(p.allergen_flags||{}, activeIds).status }))
    .filter(r => r.status !== "danger");
  const hiddenUnsafeCount = searchResults.length - resultsWithSafety.length;

  const activeFamily = family.filter(m => activeProfiles.includes(m.id));
  const meActive = activeProfiles.includes("me");
  const allProfileIds = ["me", ...family.map(m => m.id)];
  const isAllActive = allProfileIds.every(id => activeProfiles.includes(id));
  const searchScopeLabel = isAllActive && family.length > 0
    ? "hele familien"
    : ([meActive && "dig", ...activeFamily.map(m => m.name.split(" ")[0])].filter(Boolean).join(", ") || "dig");

  // Samme "Aktive profiler"-valg som bruges til scanning, favoritter og
  // indkøbslistens søgning — justér her, og det gælder alle steder.
  const toggleAllProfiles = () => setActiveProfiles(isAllActive ? ["me"] : allProfileIds);
  const toggleOneProfile = (id) => {
    if (isAllActive) { setActiveProfiles([id]); return; }
    const next = activeProfiles.includes(id) ? activeProfiles.filter(x => x !== id) : [...activeProfiles, id];
    setActiveProfiles(next.length === 0 ? [id] : next);
  };

  return (
    <div className="screen fade-in" style={UI.pb120}>
      <div className="screen-title">Søg varer</div>

      {/* ── Søgefelt ── */}
      <div className="input-row" style={{ marginBottom:10 }}>
        <input className="field" placeholder="Søg eller skriv en vare…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }} />
      </div>

      {/* ── Sikker søgning: hvem filtreres der for ── */}
      {searchResults.length > 0 && (
        <div style={{ padding:"8px 10px", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:10, marginBottom:10 }}>
          <div style={{ fontSize:9, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:".4px", marginBottom:4 }}>
            🛡️ Sikker søgning for {searchScopeLabel}
          </div>
          {family.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              <span onClick={toggleAllProfiles}
                style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", background: isAllActive ? "var(--green)" : "var(--surface)", color: isAllActive ? "var(--on-green)" : "var(--muted)", border:`1px solid ${isAllActive ? "var(--green)" : "var(--border2)"}` }}>
                Alle
              </span>
              <span onClick={() => toggleOneProfile("me")}
                style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", background: !isAllActive && meActive ? "var(--green)" : "var(--surface)", color: !isAllActive && meActive ? "var(--on-green)" : "var(--muted)", border:`1px solid ${!isAllActive && meActive ? "var(--green)" : "var(--border2)"}` }}>
                Mig
              </span>
              {family.map(m => {
                const on = !isAllActive && activeProfiles.includes(m.id);
                return (
                  <span key={m.id} onClick={() => toggleOneProfile(m.id)}
                    style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", background: on ? "var(--green)" : "var(--surface)", color: on ? "var(--on-green)" : "var(--muted)", border:`1px solid ${on ? "var(--green)" : "var(--border2)"}` }}>
                    {m.name.split(" ")[0]}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Resultater ── */}
      {searchLoading && (
        <Loader text="Søger…" />
      )}
      {!searchLoading && searchQuery && resultsWithSafety.length === 0 && (
        <div className="empty-state">
          <div className="empty-txt">Ingen resultater</div>
          <div className="empty-sub">
            {hiddenUnsafeCount > 0
              ? `${hiddenUnsafeCount} produkt${hiddenUnsafeCount!==1?"er":""} skjult — indeholder allergener for ${searchScopeLabel}`
              : "Prøv et andet søgeord"}
          </div>
        </div>
      )}
      {!searchQuery && (
        <div className="empty-state">
          <div className="empty-txt">Søg efter et produkt</div>
          <div className="empty-sub">Skriv et produktnavn eller mærke</div>
        </div>
      )}

      {resultsWithSafety.map(({ product: p }) => (
        <SearchResultRow key={p.id} product={p} effectiveIds={activeIds}
          onOpen={() => { logSearchSelection(searchQuery, p, accessToken); lookupProduct(p.ean||p.id); }}
          onAddToList={() => handleAddToList(p)}
        />
      ))}
      {resultsWithSafety.length > 0 && hiddenUnsafeCount > 0 && (
        <div style={{ padding:"8px 12px", fontSize:11, color:"var(--muted)", textAlign:"center" }}>
          🚫 {hiddenUnsafeCount} produkt{hiddenUnsafeCount!==1?"er":""} mere skjult — indeholder allergener for {searchScopeLabel}
        </div>
      )}

      {/* ── Vælg liste — vises kun når man har mere end én indkøbsliste.
           Portalet direkte til <body>: "Skærmen" herover har en fade-in-
           animation på transform, som (selv efter animationen er slut, pga.
           fill-mode "both") gør den til et "containing block" for position:
           fixed-børn — så et almindeligt fixed-ark her ville rulle med
           søgeresultaterne i stedet for at blive stående over bundmenuen. ── */}
      {pendingAdd && createPortal(
        <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end" }}
          onClick={cancelAddToList}>
          <div style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"70vh", overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={UI.rowBetweenMb16}>
              <div style={UI.ufs18_fw900_cink}>Tilføj til hvilken liste?</div>
              <button onClick={cancelAddToList} aria-label="Luk"
                style={{ background:"var(--surface)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--ink)" }}>×</button>
            </div>
            {lists.map(l => (
              <div key={l.id} onClick={() => chooseList(l.id)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, marginBottom:8, cursor:"pointer" }}>
                <span style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>{l.name}</span>
                {l.type === "family" && <span style={{ fontSize:11 }}>👨‍👩‍👧</span>}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
