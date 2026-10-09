// @ts-nocheck
import React from "react";
import { ALLERGENS } from "./constants.jsx";
import { initials, compareAllergens, productDisplayName, computeProfileResults, extractENumbers, profileConflictLabel, profileWarnLabel, profileMatchLabel } from "./helpers.js";
import { UI } from "./styleUtils.js";
import { Icon } from "./Icons.jsx";

export function ProfileBadges({ allergenFlags, allergens, customAllerg, family, activeProfiles, size = 22 }) {
  if (!allergenFlags) return null;
  const profiles = [
    ...((!activeProfiles || activeProfiles.includes("me")) ? [{ id:"me", name:"Mig", allergens: allergens || [] }] : []),
    ...(family || []).filter(m => !activeProfiles || activeProfiles.includes(m.id)),
  ];
  return (
    <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
      {profiles.map(p => {
        const hasDanger = p.allergens.some(a => allergenFlags[a] === "yes");
        const hasWarning = p.allergens.some(a => allergenFlags[a] === "traces");
        const color = hasDanger ? "var(--red)" : hasWarning ? "var(--amber)" : "var(--green)";
        const bg = hasDanger ? "var(--red-lt)" : hasWarning ? "var(--amber-lt)" : "var(--green-lt)";
        return (
          <div key={p.id} title={p.id==="me"?"Din profil":p.name} style={{
            width:size, height:size, borderRadius:"50%",
            background:bg, border:`1.5px solid ${color}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:size*0.38, fontWeight:800, color, flexShrink:0,
            letterSpacing:"-.5px",
          }}>
            {initials(p.id==="me"?"Mig":p.name).slice(0,2)}
          </div>
        );
      })}
    </div>
  );
}

// ── Fælles "tom liste"-tilstand ───────────────────────────────────────────────
// Bruger de fælles .empty-state/.empty-icon/.empty-txt/.empty-sub CSS-klasser,
// så en fuldbredde tom-tilstand ser ens ud uanset hvilken skærm den vises på.
export function EmptyState({ icon, text, sub, children, style }) {
  return (
    <div className="empty-state" style={style}>
      {icon && <span className="empty-icon">{icon}</span>}
      <div className="empty-txt">{text}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {children}
    </div>
  );
}

// ── Fælles loading-indikator ──────────────────────────────────────────────────
// size="sm" (standard): lille inline-kort med spinner + tekst (bruges når data
// indlæses inde i en liste/skærm, fx søgeresultater).
// size="lg": stor centreret spinner med overskrift + valgfri undertekst/hint
// (bruges til fuldskærms trin, fx "Analyserer billede…", "Sender…").
export function Loader({ text, sub, hint, size = "sm" }) {
  if (size === "lg") {
    return (
      <div className="fade-in" style={{ textAlign:"center", padding:"60px 20px" }}>
        <div style={{ width:64, height:64, border:"4px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" }} />
        {text && <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom: (sub || hint) ? 8 : 0 }}>{text}</div>}
        {sub && <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6, marginBottom: hint ? 20 : 0 }}>{sub}</div>}
        {hint && <div style={{ fontSize:11, color:"var(--muted)", opacity:0.7 }}>{hint}</div>}
      </div>
    );
  }
  return (
    <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">{text}</div></div>
  );
}

// Fallback-skærm mens en lazy-loaded skærm-komponent hentes (kodesplitting) —
// samme lille spinner alle steder appen venter på at en JS-chunk downloades.
export const LazyFallback = (
  <div style={{ padding:"40px 16px", textAlign:"center" }}>
    <div style={{ width:28, height:28, border:"3px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto" }} />
  </div>
);

// ── Fælles farve/ikon for sikkerheds-status ──────────────────────────────────
// status: "safe" | "warn" | "danger" — samme tre-trins skala bruges alle
// steder appen viser om noget er sikkert for en profil (produkter, opskrifter).
export function safetyStyle(status) {
  if (status === "danger") return { color:"var(--red)",   bg:"var(--red-lt)",   border:"var(--red-md)",   icon:"×" };
  if (status === "warn")   return { color:"var(--amber)", bg:"var(--amber-lt)", border:"var(--amber-md)", icon:"!" };
  return                          { color:"var(--green)", bg:"var(--green-lt)", border:"var(--green-mid)", icon:"✓" };
}

// Sikkerheds-række: profilnavn til venstre, status med ikon til højre.
// Bruges i 2-kolonne sikkerhedsgrids (produktresultat, opskrift-detaljer).
export function SafetyRow({ name, status, statusText, onClick }) {
  const s = safetyStyle(status);
  return (
    // Farvetonen lægges oven på en fast --surface-baggrund — alene var den
    // gennemsigtig (8 %), så appens baggrundsfoto skinnede igennem og
    // rækken næsten ikke kunne ses (live-test 30. sept. 2026). Samme
    // princip som --green-selected-bg i designreglerne.
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"10px 12px", background:`linear-gradient(${s.bg}, ${s.bg}), var(--surface)`, border:`1px solid ${s.border}`, borderRadius:10, gap:12 }}>
      <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", flexShrink:0, maxWidth:"40%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {name}
      </div>
      {/* statusText kan blive lang, når den samler flere årsager (fx flere
          allergener + en diæt-konflikt + et overvåget E-nummer, se
          ResultScreen.jsx's per-profil-opsummering) — ombryder nu i stedet
          for at skubbe teksten uden for kortet vandret (fundet ved en
          Playwright-gennemgang: en samlet årsagstekst løb bogstaveligt talt
          ud over skærmkanten med den tidligere ensrettede nowrap-linje). */}
      <div style={{ fontSize:11, fontWeight:700, color:s.color, textAlign:"right", lineHeight:1.4, flex:1, minWidth:0, cursor: onClick ? "pointer" : "default" }}
        onClick={onClick}>
        {s.icon} {statusText}{onClick ? " ›" : ""}
      </div>
    </div>
  );
}

// Sikkerheds-pille: kompakt chip med ikon + navn. Bruges i kort-gitre
// (fx opskriftskort), hvor der ikke er plads til den fulde række-variant.
export function SafetyPill({ name, status }) {
  const s = safetyStyle(status);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:100, border:`1px solid ${s.color}`, background:s.bg, fontSize:10, fontWeight:700, color:s.color }}>
      <span>{s.icon}</span>
      <span>{name}</span>
    </div>
  );
}

// Kategori-ikoner når produktbillede mangler

export function getProductIcon(product) {
  if (!product) return "🛒";
  const name = (product.name || "").toLowerCase();
  const cat = (product.category || "").toLowerCase();
  const combined = name + " " + cat;
  if (/mælk|fløde|smør|ost|yoghurt|skyr/.test(combined)) return "🥛";
  if (/brød|bolle|rugbrød|toast/.test(combined)) return "🍞";
  if (/chokolade|nutella|kakao/.test(combined)) return "🍫";
  if (/juice|saft|vand|cola|øl|vin/.test(combined)) return "🥤";
  if (/kylling|oksekød|svinekød|kød/.test(combined)) return "🥩";
  if (/laks|fisk|tun|rejer/.test(combined)) return "🐟";
  if (/pasta|spaghetti|makaroni/.test(combined)) return "🍝";
  if (/ris|grød|havre/.test(combined)) return "🍚";
  if (/chips|snack|popcorn/.test(combined)) return "🍿";
  if (/is|flødeis/.test(combined)) return "🍦";
  if (/æble|banan|appelsin|frugt/.test(combined)) return "🍎";
  if (/tomat|gulerod|grøntsag/.test(combined)) return "🥦";
  if (/olie|margarine/.test(combined)) return "🫒";
  if (/nødder|mandler|cashew/.test(combined)) return "🥜";
  if (/morgenmad|cornflakes|müsli/.test(combined)) return "🥣";
  return "🛒";
}

export function ProductImage({ product, size = 64 }) {
  if (product?.image_url) {
    // Ingen "OFF"-mærke på miniaturer (Bjørn, 9. okt. 2026); kreditering står på produktsiden og samlet i Indstillinger.
    return (
      <span style={{ position:"relative", display:"inline-flex", flexShrink:0, width:size, height:size }}>
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          style={{ width:size, height:size, objectFit:"contain", borderRadius:8 }}
          onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; if (e.target.nextSibling.nextSibling) e.target.nextSibling.nextSibling.style.display="none"; }}
        />
        <div style={{ width:size, height:size, background:"var(--paper2)", borderRadius:8, display:"none", alignItems:"center", justifyContent:"center", fontSize:size*0.5 }}>
          {getProductIcon(product)}
        </div>
      </span>
    );
  }
  return (
    <div style={{ width:size, height:size, background:"var(--paper2)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.5 }}>
      {getProductIcon(product)}
    </div>
  );
}

// ── Fælles søgeresultat-kort ────────────────────────────────────────────────
// Bruges både på forsidens Søg-skærm og i "Tilføj vare" i indkøbslisten, så
// et søgeresultat ser ens ud uanset hvor man søger fra.
export const SearchResultRow = React.memo(function SearchResultRow({ product: p, effectiveIds, effectiveLevels, profiles, onOpen, onAddToList }) {
  // To udregningsveje (25. sept. 2026, brugerfeedback: "hvilken profil
  // konflikten gælder" + "skriv årsagen eksplicit"):
  // - `profiles` (fra ListScreen.jsx, med den fulde aktive profil-liste) →
  //   samme per-profil-beregning som resten af appen (computeProfileResults,
  //   helpers.js), så status kan navngive PRÆCIS hvem en konflikt gælder.
  //   computeProfileResults' egne "reasons" er kun DELVIST eksplicitte i
  //   forvejen ("Spor af X"/"Muligvis 'X'"/diæt-/E-nummer-tekst er allerede
  //   fint, men et rent allergi-match returneres som et BART allergen-navn,
  //   fx "Nødder" — samme mønster ResultScreen selv bruger uændret) — derfor
  //   `explicitReason` nedenfor, som tilføjer "Indeholder " foran præcis de
  //   bare navne, uden at røre selve computeProfileResults (delt med
  //   ResultScreen, uden for denne opgaves scope).
  // - Ingen `profiles` (SearchScreen.jsx sender endnu kun `effectiveIds`,
  //   det sammenlagte allergen-id-sæt) → uændret, enklere fald-tilbage, men
  //   med samme eksplicitte "Indeholder/Spor af"-formulering på chipsene i
  //   stedet for et bart allergen-navn, så de aldrig kan misforstås som en
  //   påstand om at produktet "er" det allergen.
  const explicitReason = (r) => (/^(Spor af |Muligvis |Overvåget |[^:]+: )/.test(r) ? r : `Indeholder ${r}`);
  let status, statusLabel, reasonChips;
  if (profiles && profiles.length > 0) {
    const ingredientsText = p.ingredients || p.ingredients_text || "";
    const results = computeProfileResults(profiles, {
      allergen_flags: p.allergen_flags, ingredients: ingredientsText, nutrition: p.nutrition,
      productENumbers: extractENumbers(ingredientsText),
    });
    const conflict = profileConflictLabel(results);
    status = conflict ? "danger" : results.some(r => r.status === "warn") ? "warn" : "safe";
    statusLabel = conflict || (status === "warn" ? profileWarnLabel(results) : profileMatchLabel(profiles));
    reasonChips = [...new Set(results.flatMap(r => r.reasons).map(explicitReason))];
  } else {
    const cmp = compareAllergens(p.allergen_flags||{}, effectiveIds, effectiveLevels);
    status = cmp.status;
    statusLabel = status==="safe" ? profileMatchLabel([]) : status==="danger" ? "Allergi-advarsel" : cmp.matchedWarning.length ? "Kan indeholde spor" : "Kan ikke vurderes";
    reasonChips = [
      ...cmp.matchedDanger.map(id => `Indeholder ${ALLERGENS.find(a=>a.id===id)?.label || id}`),
      ...cmp.matchedWarning.map(id => `Spor af ${ALLERGENS.find(a=>a.id===id)?.label || id}`),
    ];
  }
  const statusColor = safetyStyle(status).color;
  const statusText = `${safetyStyle(status).icon} ${statusLabel}`;
  const tagLabels = { vegan:"🌱 Vegansk", vegetarian:"🥦 Vegetarisk" };
  // Grøn "+"-knap når produktet er lagt på (mindst) en liste — nulstilles
  // naturligt næste gang der søges, da komponentet så får et nyt produkt/key.
  const [added, setAdded] = React.useState(false);
  const handleAddToList = async (e) => {
    e.stopPropagation();
    const ok = await onAddToList();
    if (ok !== false) setAdded(true);
  };
  return (
    <div onClick={onOpen}
      // Bevidst INGEN onMouseDown/preventDefault på selve rækken (fjernet 24.
      // sept. 2026) — at forhindre blur her holder søgefeltets tastatur åbent,
      // hvilket på mobil kan sluge det FØRSTE tryk på en resultat-række til at
      // lukke tastaturet i stedet for at åbne produktet ("søgeresultat åbner
      // ikke før andet tryk"). Både onOpen og onAddToList-callerne (SearchScreen
      // OG ListScreens "Tilføj vare") lukker allerede selv eksplicit deres
      // resultatliste i egen handler-kode — ingen af dem er afhængige af at
      // blur bliver forhindret for at fungere korrekt. "+"-knappen nedenfor
      // beholder sin egen beskyttelse, se dens kommentar.
      style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", marginBottom:8, background:"var(--surface)", border:`1px solid ${status==="danger" ? "var(--red-md)" : status==="warn" ? "var(--amber-md)" : "var(--border)"}`, borderRadius:12, cursor:"pointer" }}>
      <ProductImage product={p} size={44} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{productDisplayName(p)}</div>
        <div style={{ fontSize:11, color:"var(--muted)" }}>{p.brand}{p.category ? ` · ${p.category}` : ""}</div>
        {/* Årsags-chips (25. sept. 2026, brugerfeedback: "kan aldrig
            misforstås som at produktet nødvendigvis indeholder disse
            ingredienser") — reasonChips er allerede formuleret eksplicit
            ("Indeholder X"/"Spor af Y"/"Muligvis 'Z'"/diæt-/E-nummer-tekst,
            se computeProfileResults i helpers.js), ikke et bart allergen-
            navn der kunne læses som en påstand om produktets indhold. */}
        {reasonChips.length > 0 && (
          <div style={{ display:"flex", gap:3, marginTop:4, flexWrap:"wrap" }}>
            {reasonChips.map((reason, i) => (
              <span key={i} style={{ fontSize:10, fontWeight:700, color: statusColor, background: status==="danger" ? "var(--red-lt)" : "var(--amber-lt)", border:`1px solid ${status==="danger" ? "var(--red-md)" : "var(--amber-md)"}`, borderRadius:100, padding:"1px 6px" }}>
                {reason}
              </span>
            ))}
          </div>
        )}
        {p.tags?.length > 0 && (
          <div style={{ display:"flex", gap:3, marginTop:3, flexWrap:"wrap" }}>
            {p.tags.map((t,i) => (
              <span key={i} style={UI.ufs10_fw700_cgreen_bggreenlt_bd1pxsolid_br100_p1px7px}>
                {tagLabels[t]||t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
        <div style={{ fontSize:11, fontWeight:700, color:statusColor, textAlign:"right" }}>{statusText}</div>
        <button type="button" className="btn btn-sm" aria-label={added ? `"${productDisplayName(p)}" er tilføjet` : `Tilføj "${productDisplayName(p)}" til indkøbsliste`}
          // Forhindrer specifikt HER at et tap flytter fokus væk fra et søgefelt
          // ovenover (fx ListScreens "Tilføj vare") — ellers kan søgefeltets
          // onBlur nå at lukke resultatlisten, før klikket på selve knappen når
          // at blive registreret. Harmløst på skærme uden den slags blur-drevet
          // skjul (SearchScreen) — der er intet at forhindre.
          onMouseDown={e => e.preventDefault()}
          style={{ width:44, height:44, minHeight:44, padding:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, lineHeight:1,
            background: added ? "var(--green)" : "var(--surface2)", color: added ? "var(--on-green)" : "var(--ink2)",
            border: `1px solid ${added ? "var(--green)" : "var(--border)"}`, borderRadius:10, transition:"all .15s" }}
          onClick={handleAddToList}><Icon name="plus" size={18} color={added ? "var(--on-green)" : "var(--ink2)"} /></button>
      </div>
    </div>
  );
});

// ── Luk-knap (klump 6b, F3-6/F4-9): ikon i stedet for "×", 44 px trykflade ─────
