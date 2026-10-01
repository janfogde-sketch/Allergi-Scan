// @ts-nocheck
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { buildActiveProfileList, computeProfileResults, profileConflictLabel, profileMatchLabel, extractENumbers, normalizeProductFlagsFor } from "./helpers.js";
import { Icon, ProductImage } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";
import { STATUS_COLOR, STATUS_ICON } from "./historyStatus.js";

// ── Favoritter: kategoriser-bottom sheet ─────────────────────────────────────
// Erstatter det tidligere inline "Flyt til kategori"-panel, der udvidede
// selve produktkortet (26. sept. 2026, brugerfeedback: "lad ikke produkt-
// kortet udvide sig inline"). Samme underliggende data-model som før — ÉN
// kategori pr. favorit, ikke en liste (setFavoriteCategory(ean, category)) —
// så "tilføj til/fjern fra en kategori" her betyder vælge/fravælge kategorien,
// ikke et multi-select. Gemmer DIREKTE ved tryk (samme øjeblikkelige
// gem-mønster som det tidligere inline-panel allerede brugte). Sheetet
// lukker IKKE længere sig selv efter hvert valg (26. sept. 2026, opfølgning:
// "trykker man på den valgte kategori igen, skal varen fjernes, og
// checkmarken skal forsvinde STRAKS") — `favorite` sendes nu ind som det
// FRISKE, live objekt fra `favorites`-arrayet (se kaldsstedet), ikke et
// frosset øjebliksbillede taget da sheetet blev åbnet, så checkmarken altid
// afspejler den nyeste tilstand med det samme, uden at sheetet behøver
// genåbnes. Brugeren lukker selv via ×/baggrundstryk når de er færdige.
// Samme portal-/bottom-sheet-mønster som ShareSheet (ListScreen.jsx) og
// ConfirmDialog (SharedComponents.jsx) — MEN via createPortal til
// document.body (26. sept. 2026, opfølgning: "bundnavigationen lå ovenpå/
// foran sheetet, Ny kategori/Opret var ikke fuldt synlige"). Roden er det
// kendte .screen.fade-in-mønster (se CLAUDE.md afsnit 3): fade-in-
// animationens efterladte transform gør .screen til et CSS "containing
// block" for position:fixed-børn, så en fixed sheet renderet INDE i skærmen
// (som denne var) positioneres relativt til SKÆRMENS boks i stedet for det
// virkelige viewport — det forklarer både hvorfor bundnav'en (som ER fixed
// til det rigtige viewport) kunne ligge foran, og hvorfor sheetets bund
// kunne klippes af. Samme løsning som ListPickerSheet/ProfileMenu.jsx
// allerede bruger: portal til document.body.
function FavoriteCategorySheet({ favorite, existingCategories, onSetCategory, onClose }) {
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const createCategory = () => {
    const name = newCategoryInput.trim();
    if (!name) return;
    onSetCategory(name);
    setNewCategoryInput("");
  };
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.5)" }} onClick={onClose}>
      {/* Bund-padding inkluderer env(safe-area-inset-bottom) (26. sept.
          2026, opfølgning: "Ny kategori/Opret skal altid have korrekt
          safe-area padding nederst") — samme additive mønster som
          .bottom-nav allerede bruger (calc(24px + env(...))), så "Opret"-
          knappen aldrig ender under enhedens home-indikator/safe-area. */}
      <div style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"20px 16px calc(28px + env(safe-area-inset-bottom))", position:"absolute", left:0, right:0, bottom:0, maxHeight:"75vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={UI.rowBetweenMb16}>
          {/* "Kategorisér favorit" → "Kategorier" (26. sept. 2026,
              brugerfeedback: "renere — brugeren kan allerede se produkt-
              navnet nedenunder og forstår handlingen"). Produktnavnet
              herunder er UÆNDRET. */}
          <div style={UI.ufs18_fw900_cink}>Kategorier</div>
          <button onClick={onClose} aria-label="Luk"
            style={{ background:"var(--surface)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--ink)" }}>×</button>
        </div>
        <div style={{ fontSize:12.5, color:"var(--muted)", marginBottom:16 }}>{favorite.name || "Ukendt produkt"}</div>

        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
          {existingCategories.length === 0 && (
            <div style={{ fontSize:12, color:"var(--muted)" }}>Ingen kategorier oprettet endnu — opret den første nedenfor.</div>
          )}
          {existingCategories.map(cat => {
            const selected = favorite.category === cat;
            return (
              <div key={cat} onClick={() => onSetCategory(selected ? null : cat)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", borderRadius:10, cursor:"pointer",
                  background: selected ? "var(--green-selected-bg)" : "var(--surface)", border:`1px solid ${selected ? "var(--green)" : "var(--border)"}` }}>
                <span style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:700, color: selected ? "var(--green)" : "var(--ink)" }}>
                  <Icon name="tag" size={13} color={selected ? "var(--green)" : "var(--muted)"} /> {cat}
                </span>
                {selected && <Icon name="check" size={14} color="var(--green)" />}
              </div>
            );
          })}
        </div>

        <div className="input-row">
          <input className="field" placeholder="Ny kategori…" value={newCategoryInput}
            onChange={e => setNewCategoryInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createCategory(); }} />
          {/* Disabled indtil der reelt står noget i feltet (26. sept. 2026,
              brugerfeedback) — .btn:disabled (theme.jsx) giver allerede
              den dæmpede, ikke-klikbare stil resten af appen bruger. */}
          <button className="btn btn-primary btn-sm" style={UI.uwsnowrap} disabled={!newCategoryInput.trim()} onClick={createCategory}>Opret</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// SCREENS.FAVORITES — udskilt fra ProfileScreen.jsx 30. sept. 2026
// (arkitektur-audit A8, én skærm = én fil).
export default function FavoritesScreen({ household, lookupProduct }) {
  const { user } = useAuthContext();
  const { allergens, customAllerg, family, activeProfiles } = useProfileContext();
  const { favorites, favoritesScope, loadFavorites, toggleFavorite, setFavoriteCategory } = useHistoryContext();
  const { selectedENumbers } = useAllergenPrefsContext();

  // ── Favoritter: kategori-filter + kategoriser-sheet ─────────────────────────
  // `categorizingEan` holder EAN'et for favoritten sheeten er åben for (null
  // = lukket) — kun selve identifikatoren, IKKE favorit-objektet selv (26.
  // sept. 2026, opfølgning: sheetet skal vise checkmarken forsvinde STRAKS
  // når man fravælger en kategori, uden at skulle lukkes/genåbnes — det
  // kræver at sheetet altid får det FRISKESTE favorit-objekt fra
  // `favorites`-arrayet på hvert render, se categorizingFavorite nedenfor,
  // ikke et frosset øjebliksbillede taget da sheetet blev åbnet).
  const [favoriteCategoryFilter, setFavoriteCategoryFilter] = useState("all");
  const [categorizingEan, setCategorizingEan] = useState(null);
  const categorizingFavorite = categorizingEan ? favorites.find(f => f.ean === categorizingEan) : null;

  // ── Favoritter: samme statuslogik som Indkøbslisten/Historik, ud fra de
  // NUVÆRENDE aktive profiler (26. sept. 2026, brugerfeedback) — en favorit
  // er et løbende gemt produkt, ikke et fastfrosset øjebliksbillede som en
  // historik-scanning, så "relevant EatSafe-status" betyder her "er det
  // sikkert for hvem jeg har valgt LIGE NU", ikke hvem der var valgt dengang
  // produktet blev gemt. `product_snapshot` (gemt af toggleFavorite ud fra
  // det fulde scanResult, se ResultScreen.jsx) indeholder allerede
  // allergen_flags/ingredienser/E-numre — ingen ekstra opslag nødvendigt.
  const activeProfileList = buildActiveProfileList({ user, family, allergens, customAllerg, selectedENumbers, activeProfiles });
  const favoriteStatus = (f) => {
    if (activeProfileList.length === 0 || !f.allergen_flags) return null;
    const ingredientsText = f.ingredients || f.ingredients_text || "";
    const results = computeProfileResults(activeProfileList, {
      allergen_flags: normalizeProductFlagsFor(f), ingredients: ingredientsText, nutrition: f.nutrition,
      productENumbers: f.productENumbers?.length ? f.productENumbers : extractENumbers(ingredientsText),
    });
    const conflict = profileConflictLabel(results, { maxNames: 2 });
    if (conflict) return { status:"danger", text: conflict };
    if (results.some(r => r.status === "warn")) return { status:"warn", text:"Kan ikke afgøres sikkert" };
    return { status:"safe", text: profileMatchLabel(activeProfileList) };
  };

  // Tidligere en IIFE i JSX'en — beregnet her i stedet (arkitektur-regel 3).
  const existingCategories = [...new Set(favorites.map(f => f.category).filter(Boolean))].sort();
  // Flad liste + filterchips i stedet for grupperede, kollapsbare
  // sektioner (26. sept. 2026, brugerfeedback: "lad ikke produkt-
  // kortet udvide sig inline" + "eksisterende kategorier som
  // filterchips øverst") — kun vist hvis brugeren faktisk har
  // oprettet mindst én kategori.
  const visibleFavorites = favoriteCategoryFilter === "all"
    ? favorites
    : favorites.filter(f => f.category === favoriteCategoryFilter);

  return (
    <div className="screen fade-in">
      {/* Venstrestillet som Historik/Indkøbslisten (26. sept. 2026,
          opfølgning) — samme scopede inline-override af den delte,
          ellers centrerede .screen-title-klasse, ikke en ændring af
          selve klassen. Fjernet et lille, ægte tastefejl (et
          foranstillet mellemrum før "Favoritter"). */}
      <div className="screen-title" style={{ textAlign:"left", width:"auto" }}>Favoritter</div>

      {household.length > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <div onClick={() => loadFavorites("own")}
            style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700,
              background: favoritesScope==="own" ? "var(--green)" : "var(--surface)", color: favoritesScope==="own" ? "var(--on-green)" : "var(--muted)",
              border:`1px solid ${favoritesScope==="own" ? "var(--green)" : "var(--border)"}` }}>
            Mine
          </div>
          <div onClick={() => loadFavorites("family")}
            style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              background: favoritesScope==="family" ? "var(--green)" : "var(--surface)", color: favoritesScope==="family" ? "var(--on-green)" : "var(--muted)",
              border:`1px solid ${favoritesScope==="family" ? "var(--green)" : "var(--border)"}` }}>
            <Icon name="family" size={12} color={favoritesScope==="family" ? "var(--on-green)" : "var(--muted)"} /> Husstanden
          </div>
        </div>
      )}

      {/* "Senest scannet" er FJERNET (26. sept. 2026, brugerfeedback:
          "seneste scanninger hører kun hjemme under Historik") —
          Favoritter viser nu udelukkende gemte favoritter. */}

      {favorites.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon" style={{ width:60, height:60 }}><Icon name="heart" size={23} color="var(--muted)" /></span>
          <div className="empty-txt">Ingen favoritter endnu</div>
          <div className="empty-sub">Tryk på hjertet ved et produkt for at gemme det her.</div>
        </div>
      )}

      {favorites.length > 0 && (
      <>
        {existingCategories.length > 0 && (
          <div style={{ ...UI.wrapGap7, marginBottom:12 }}>
            <div className={`filter-chip${favoriteCategoryFilter==="all"?" active":""}`} onClick={() => setFavoriteCategoryFilter("all")}>Alle</div>
            {existingCategories.map(cat => (
              <div key={cat} className={`filter-chip${favoriteCategoryFilter===cat?" active":""}`} onClick={() => setFavoriteCategoryFilter(cat)}>{cat}</div>
            ))}
          </div>
        )}
        {visibleFavorites.map((f,i) => {
          const st = favoriteStatus(f);
          const metaLine = [f.brand, favoritesScope==="family" && !f.savedByMe && f.savedBy ? `Gemt af ${f.savedBy.split(" ")[0]}` : null].filter(Boolean).join(" · ");
          // 14px lodret padding (op fra .hist-rows 12px, næste trin
          // på spacing-skalaen) — Favoritter-rækker er 3 linjer høje
          // (navn/mærke/status) mod Historiks typisk 2, så lidt
          // mere luft holder listen let at scanne med mange gemte
          // varer (26. sept. 2026, opfølgning). .hist-row er siden
          // 27. sept. 2026 et bordered kort (samme stil som
          // .list-item, se theme.jsx) i stedet for en flad divider-
          // række — vandret padding overrides derfor ikke længere.
          return (
            <div key={f.ean || f.id || i} className="hist-row" style={{ padding:"14px 14px", cursor:"pointer" }}
              onClick={() => lookupProduct(f.ean || f.code || f.id)}>
              <ProductImage product={f} size={44} />
              <div className="hist-info" style={{ marginLeft:8 }}>
                <div className="hist-name">{f.name || "Ukendt produkt"}</div>
                {metaLine && <div className="hist-time">{metaLine}</div>}
                {/* Altid ikon + tekst + farve, aldrig farve alene — samme
                    statussprog som Indkøbslisten/Historik, ALDRIG
                    "Farlig" (26. sept. 2026, brugerfeedback). */}
                {st && (
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3, fontSize:11, fontWeight:700, color: STATUS_COLOR[st.status] }}>
                    <Icon name={STATUS_ICON[st.status]} size={11} color="currentColor" />
                    {st.text}
                  </div>
                )}
              </div>
              {f.savedByMe !== false && (
                <div style={{ display:"flex", gap:2, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-sm" style={{ padding:"6px" }} aria-label={`Kategorisér "${f.name || "produkt"}"`}
                    onClick={() => setCategorizingEan(f.ean)}>
                    <Icon name="tag" size={14} color="var(--ink2)" />
                  </button>
                  {/* Samme skraldespand-ikon som resten af EatSafe bruger
                      til at fjerne noget (fx Familie/Indkøbsliste) — det
                      tidligere × var en selvstændig, anden ikonografi for
                      samme handling (26. sept. 2026, brugerfeedback:
                      "samme handling skal altid have samme ikonografi"). */}
                  <button className="btn btn-ghost btn-sm" style={{ padding:"6px" }} aria-label={`Fjern "${f.name || "produkt"}" fra favoritter`}
                    onClick={() => toggleFavorite(f)}>
                    <Icon name="trash" size={14} color="var(--muted)" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </>
      )}

      {categorizingFavorite && (
        <FavoriteCategorySheet
          favorite={categorizingFavorite}
          existingCategories={existingCategories}
          onSetCategory={(cat) => setFavoriteCategory(categorizingFavorite.ean, cat)}
          onClose={() => setCategorizingEan(null)}
        />
      )}
    </div>
  );
}
