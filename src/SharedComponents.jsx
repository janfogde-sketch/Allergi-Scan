// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS } from "./constants.js";

export function EatSafeLogo({ size = 32, variant = "light" }) {
  const isDark = variant === "dark";
  const bg = isDark ? "#1F2733" : "#FAFAF7";
  const barColor = isDark ? "#3A4452" : "#1F2733";
  const uid = "es-" + size + "-" + variant + "-" + Math.random().toString(36).slice(2,6);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="EatSafe">
      <defs>
        <clipPath id={"sq-"+uid}>
          <path d="M 50 0 C 85 0, 100 15, 100 50 C 100 85, 85 100, 50 100 C 15 100, 0 85, 0 50 C 0 15, 15 0, 50 0 Z" />
        </clipPath>
        <filter id={"glow-"+uid} x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur stdDeviation={isDark ? 2.4 : 1.6} result="blur" />
          <feMerge>
            {isDark && <feMergeNode in="blur" />}
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={"gline-"+uid} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <g clipPath={"url(#sq-"+uid+")"}>
        <rect width="100" height="100" fill={bg} />
        <g fill={barColor}>
          <rect x="18.00" y="16" width="8.31" height="68" rx="1.49" />
          <rect x="29.05" y="22" width="4.15" height="56" rx="0.75" />
          <rect x="35.94" y="16" width="5.54" height="68" rx="1.00" />
          <rect x="44.21" y="22" width="2.77" height="56" rx="0.50" />
          <rect x="49.71" y="16" width="3.32" height="68" rx="0.60" />
          <rect x="55.76" y="22" width="6.92" height="56" rx="1.25" />
          <rect x="65.41" y="16" width="4.43" height="68" rx="0.80" />
          <rect x="72.57" y="22" width="5.54" height="56" rx="1.00" />
          <rect x="80.84" y="16" width="3.88" height="68" rx="0.70" />
        </g>
        <g filter={"url(#glow-"+uid+")"}>
          <path
            d="M 20 58 L 70 58 L 76 64 L 86 50"
            fill="none"
            stroke={isDark ? "#4ADE80" : "url(#gline-"+uid+")"}
            strokeWidth="4.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}



// ─── E-NUMMER VÆLGER KOMPONENT ───────────────────────────────────────────────
// ─── SIMPLE IKONER ────────────────────────────────────────────────────────────

export const Icon = ({ name, size=18, color="currentColor" }) => {
  const icons = {
    home: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>,
    scan: <><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h1M4 10h1M4 14h1M7 6h1M7 14h1M10 6h4M10 10h4M10 14h4M16 6h1M16 10h1M16 14h1"/><rect x="2" y="2" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1" strokeWidth="1.5"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></>,
    list: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>,
    profile: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>,
    recipes: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>,
    star: <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>,
    globe: <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>,
    check: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>,
    x: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>,
    warning: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>,
    info: <><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 16v-4M12 8h.01"/></>,
    chevronRight: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>,
    chevronDown: <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>,
    chevronUp: <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>,
    heart: <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>,
    trash: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>,
    share: <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>,
    cart: <><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></>,
    camera: <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>,
    bulb: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 00-4.899 11.947c.492.54.899 1.197.899 1.553v.5h8v-.5c0-.356.407-1.013.9-1.553A7 7 0 0012 2z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v1a3 3 0 006 0v-1"/><path strokeLinecap="round" strokeLinejoin="round" d="M9.5 17h5"/></>,
    speaker: <><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12l-4-3H5a1 1 0 01-1-1V9a1 1 0 011-1h3l4-3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728"/></>,
    speakerOff: <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>,
    plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>,
    edit: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>,
    family: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>,
    madpas: <><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M3 8c0-2.5 4-2.5 4 0v4H3M17 3v5a4 4 0 01-8 0V3"/><path strokeLinecap="round" strokeLinejoin="round" d="M13 3v18"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" style={{ flexShrink:0, display:"block" }}>
      {icons[name]}
    </svg>
  );
};

// ─── KONSTANTER ──────────────────────────────────────────────────────────────


export function IngredientsList({ text, allergenFlags = {} }) {
  if (!text) return null;

  // Rens teksten — fjern linjeskift og ekstra mellemrum
  const cleaned = text
    .replace(/[\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Split på komma men bevar indhold i parenteser
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of cleaned) {
    if (ch === "(" || ch === "[") { depth++; current += ch; }
    else if (ch === ")" || ch === "]") { depth--; current += ch; }
    else if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());

  // Find allergener der skal fremhæves
  // Udvidet med synonymer, skjulte ingredienser og videnskabelige navne
  const allergenLabels = {
    gluten: [
      // Direkte
      "gluten","hvede","rug","byg","havre","spelt","kamut","einkorn","emmer","khorasanhvede",
      // Engelsk
      "wheat","rye","barley","oats","oat","spelt","semolina","bulgur","couscous","farro","freekeh",
      // Skjulte/forarbejdede
      "hvedemel","hvedestivelse","hvedeklid","hvedekerne","hvedeprotein","hvedegluten","seitan",
      "maltekstrakt","malteddike","maltsirup","øleddike","bryggersgær","dinkelhvede",
      "breadcrumbs","rasp","panko","croutons","mel","stivelse af hvede",
    ],
    laktose: [
      // Direkte
      "mælk","laktose","fløde","smør","ost","valle","kasein","laktalbumin","laktoglobulin",
      // Engelsk
      "milk","cream","butter","cheese","whey","casein","dairy","lactose","lactalbumin",
      // Skjulte
      "mælkepulver","skummetmælkspulver","mælkefedt","mælkeprotein","mælkesucker",
      "creme fraiche","yoghurt","kefir","kvark","mascarpone","ricotta","skyr","ghee",
      "kondenseret mælk","kokosmælk erstatter","lactoferrin","lactoperoxidase",
      // Forkortet på etiketter
      "milk solids","milk powder","non-fat dry milk","buttermilk","milk fat",
    ],
    aeg: [
      "æg","æggehvide","æggeblomme","egg","eggs","albumin","ovalbumin","ovomucin",
      "lysozym","globulin","mayonnaise","majonæse","meringue","marengs",
      "egg white","egg yolk","dried egg","whole egg","egg powder","æggepulver",
    ],
    noedder: [
      // Alle nøddetyper
      "nødder","mandler","hasselnødder","valnødder","cashew","pekannødder","pistacienødder","macadamia",
      "paranødder","kokosnød","pinjenødder","chestnuts","kastanjer",
      "almond","hazelnut","walnut","cashew","pecan","pistachio","macadamia","brazil nut","pine nut",
      // Afledte
      "marcipan","marzipan","nougat","pesto","praline","gianduja","mandelmel","nøddemel",
      "mandelsmør","nøddeolie","mandelekstrakt","hasselnøddepasta",
    ],
    jordnoedder: [
      "jordnødder","peanut","peanuts","groundnut","arachis","arachide",
      "jordnøddeolie","jordnøddesmør","peanut butter","peanut oil","arachis oil",
      // Skjult i asiatiske retter
      "satay","kacang","nut sauce",
    ],
    soja: [
      "soja","sojabønner","soy","soybeans","tofu","tempeh","miso","edamame","natto",
      "sojamel","sojaprotein","sojalecithin","sojamælk","sojasauce","tamari","shoyu",
      "textured vegetable protein","tvp","hydrolyseret sojaprotein","isoleret sojaprotein",
      "lecithin","lecitin","e322", // sojalecithin skjult som e-nummer
    ],
    fisk: [
      "fisk","ansjos","sardiner","laks","tun","makrel","sild","torsk","rødspætte","helleflynder",
      "fish","salmon","tuna","anchovy","sardine","mackerel","herring","cod","halibut","tilapia",
      // Skjulte fiskekilder
      "worcestershire sauce","worcestershiresauce","fiskesauce","fish sauce","nam pla",
      "caesar dressing","bouillabaisse","surimi","fiskeboller","fiskemel","omega-3",
      "anchovies","anchois","nuoc mam",
    ],
    skaldyr: [
      "skaldyr","rejer","krabbe","hummer","muslinger","østers","blæksprutte","kammusling",
      "shrimp","prawn","crab","lobster","mussel","oyster","squid","scallop","langoustine",
      "krebs","languster","tigerrejer","pilgrimsmusling","snegle","escargot",
    ],
    selleri: [
      "selleri","celeriac","knoldselleri","sellerisalt","sellerifnug","selleripulver",
      "celery","celeriac","celery salt","celery seed","celery extract",
    ],
    sennep: [
      "sennep","sennepsfrø","sennepspulver","sennepsolie","sennepsmel",
      "mustard","mustard seed","mustard oil","mustard flour","mustard powder",
      "dijonsennep","dijonsennep","engelsk sennep","grovkornet sennep",
    ],
    sesam: [
      "sesam","sesamfrø","sesamolie","tahini","sesampasta","sesammel",
      "sesame","sesame seed","sesame oil","tahini","til","gingelly",
    ],
    svovl: [
      "sulfitter","svovldioxid","svovl","sulphite","sulfite","sulphur dioxide","so2",
      "e220","e221","e222","e223","e224","e225","e226","e227","e228",
    ],
    lupin: [
      "lupin","lupinmel","lupinfrø","lupinprotein","lupinfiber",
      "lupin","lupin flour","lupin seed","lupin bean",
    ],
    bloeddyr: [
      "blæksprutte","østers","muslinger","snegle","kammusling",
      "squid","oyster","mussel","snail","scallop","clam","abalone",
    ],
  };


  const isAllergenWord = (word) => {
    const w = word.toLowerCase().replace(/[^a-zæøå0-9]/g, "");
    if (w.length < 2) return false;
    return Object.entries(allergenLabels).some(([key, terms]) => {
      if (allergenFlags[key] === "no" || allergenFlags[key] === false) return false;
      return terms.some(t => {
        const tc = t.toLowerCase().replace(/[^a-zæøå0-9]/g, "");
        return w === tc || w.includes(tc) || (tc.length > 4 && tc.includes(w));
      });
    });
  };

  const isHighlighted = (part) => {
    // STORE BOGSTAVER = allergen markeret af producent
    const hasUppercase = part !== part.toLowerCase() && part === part.toUpperCase() && part.length > 2;
    // Eller indeholder et allergen-ord
    const words = part.toLowerCase().replace(/[()[\]]/g, "").split(/\s+/);
    const hasAllergenWord = words.some(w => isAllergenWord(w));
    return hasUppercase || hasAllergenWord;
  };

  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 2px", lineHeight:1.6 }}>
      {parts.map((part, i) => {
        const highlighted = isHighlighted(part);
        return (
          <span key={i} style={{ display:"inline-flex", alignItems:"baseline" }}>
            <span style={{
              fontSize: 12,
              fontWeight: highlighted ? 700 : 400,
              color: highlighted ? "var(--red)" : "var(--muted2)",
              background: highlighted ? "var(--red-lt)" : "transparent",
              borderRadius: highlighted ? 4 : 0,
              padding: highlighted ? "1px 4px" : "0",
            }}>
              {part}
            </span>
            {i < parts.length - 1 && (
              <span style={{ color:"var(--border2)", fontSize:12, marginRight:2 }}>,</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// Viser profilbadges (bruger + familie) baseret på allergen flags
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
        const color = hasDanger ? "#E63946" : hasWarning ? "#D97706" : "#22C55E";
        const bg = hasDanger ? "rgba(230,57,70,.12)" : hasWarning ? "rgba(217,119,6,.1)" : "rgba(34,197,94,.12)";
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

function PageID({ screen }) {

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
    return (
      <>
        <img
          src={product.image_url}
          alt={product.name}
          style={{ width:size, height:size, objectFit:"contain", borderRadius:8 }}
          onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
        />
        <div style={{ width:size, height:size, background:"var(--paper2)", borderRadius:8, display:"none", alignItems:"center", justifyContent:"center", fontSize:size*0.5 }}>
          {getProductIcon(product)}
        </div>
      </>
    );
  }
  return (
    <div style={{ width:size, height:size, background:"var(--paper2)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.5 }}>
      {getProductIcon(product)}
    </div>
  );
}
const initials = n => (n||"").split(" ").filter(Boolean).map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";