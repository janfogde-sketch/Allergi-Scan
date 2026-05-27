// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── EATSAFE LOGO KOMPONENT ──────────────────────────────────────────────────



// ─── E-NUMMER VÆLGER KOMPONENT ───────────────────────────────────────────────

// ─── SIMPLE IKONER ────────────────────────────────────────────────────────────

// ─── KONFIGURATION ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://jegrpcflyguadyxialkm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZ3JwY2ZseWd1YWR5eGlhbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjY5NjQsImV4cCI6MjA5NDc0Mjk2NH0.QErfbw2xmsdYjTZCS1WUOUwQHv6G2PKQRldyj8rdGq8";

// ─── KONSTANTER ──────────────────────────────────────────────────────────────



// ─── EATSAFE LOGO KOMPONENT ──────────────────────────────────────────────────
function EatSafeLogo({ size = 32, variant = "light" }) {
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
const Icon = ({ name, size=18, color="currentColor" }) => {
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

const E_CATEGORIES = [
  { id:"farve",    label:"Farvestoffer",          range:"E100–E199", min:100,  max:199,  popular:["E102","E110","E122","E129","E150d","E171","E120","E127"] },
  { id:"konserv",  label:"Konserveringsmidler",   range:"E200–E299", min:200,  max:299,  popular:["E202","E211","E220","E250","E251","E252","E282","E290"] },
  { id:"antioxid", label:"Antioxidanter",         range:"E300–E399", min:300,  max:399,  popular:["E300","E306","E320","E321","E322","E330"] },
  { id:"emulg",    label:"Emulgatorer",           range:"E400–E499", min:400,  max:499,  popular:["E407","E412","E415","E440","E471","E476","E433"] },
  { id:"smags",    label:"Smagsforstærkere",      range:"E600–E699", min:600,  max:699,  popular:["E621","E627","E631","E635","E620"] },
  { id:"diverse",  label:"Diverse (E700–E949)",   range:"E700–E949", min:700,  max:949,  popular:["E901","E904","E920","E942"] },
  { id:"sode",     label:"Sødestoffer",            range:"E950–E999", min:950,  max:999,  popular:["E950","E951","E954","E955","E960","E965","E967","E968"] },
  { id:"stivelse", label:"Stivelse & overflader",  range:"E1000+",    min:1000, max:9999, popular:["E1200","E1400","E1404","E1412","E1422","E1440"] },
];

const E_NUMBERS = {
  "E100": "Curcumin — naturlig gul farve fra gurkemeje",
  "E101": "Riboflavin (B2) — gul-orange farve, findes naturligt i mælk",
  "E102": "Tartrazin — syntetisk gul azo-farve, kan give hyperaktivitet hos børn",
  "E103": "Alkannin — rød-brun farve (ikke godkendt i EU)",
  "E104": "Quinolingul — syntetisk gul-grøn farve",
  "E105": "Fast Yellow AB — syntetisk gul farve (ikke godkendt i EU)",
  "E107": "Yellow 2G — syntetisk gul farve",
  "E110": "Solsikkegul FCF — syntetisk orange-gul azo-farve",
  "E111": "Orange GGN — syntetisk orange farve (ikke godkendt i EU)",
  "E120": "Cochenille/Karminsyre — rød farve fra skjoldlus",
  "E121": "Orcein — rød-lilla farve (ikke godkendt i EU)",
  "E122": "Azorubine/Karmoisin — syntetisk rød azo-farve",
  "E123": "Amaranth — syntetisk rød azo-farve (ikke godkendt i EU)",
  "E124": "Ponceau 4R — syntetisk rød azo-farve",
  "E125": "Scarlet GN — syntetisk rød farve (ikke godkendt i EU)",
  "E126": "Ponceau 6R — syntetisk rød azo-farve (ikke godkendt i EU)",
  "E127": "Erythrosin — syntetisk lyserød/rød farve",
  "E128": "Red 2G — syntetisk rød azo-farve",
  "E129": "Allura Rød AC — syntetisk rød azo-farve",
  "E131": "Patent Blå V — syntetisk blå farve",
  "E132": "Indigokarmin — syntetisk blå farve",
  "E133": "Brilliant Blå FCF — syntetisk blå farve",
  "E140": "Klorofyller — naturlig grøn farve fra planter",
  "E141": "Klorofylkomplekser med kobber — grøn farve",
  "E142": "Grøn S — syntetisk grøn farve",
  "E150a": "Karamelfarve, alm. — brun farve lavet ved opvarmning af sukker",
  "E150b": "Karamelfarve, sulfit — brun farve fremstillet med sulfit",
  "E150c": "Karamelfarve, ammoniak — brun farve fremstillet med ammoniak",
  "E150d": "Karamelfarve, ammoniumsulfit — brun farve i cola og øl",
  "E151": "Brilliant Sort BN — syntetisk sort azo-farve",
  "E152": "Carbon Black — sort farve (ikke godkendt i EU)",
  "E153": "Vegetabilsk kul — sort farve fra forkullet plantemateriale",
  "E154": "Brown FK — syntetisk brun azo-farve",
  "E155": "Brown HT — syntetisk brun azo-farve",
  "E160a": "Alfa-, beta-, gamma-karoten — orange farve, forstadium til A-vitamin",
  "E160b": "Annatto/Bixin/Norbixin — orange-rød farve fra annattobusk",
  "E160c": "Paprikaekstrakt/Capsanthin — rød-orange farve fra paprika",
  "E160d": "Lykopen — rød farve fra tomat",
  "E160e": "Beta-apo-8-carotenal — orange farve",
  "E160f": "Beta-apo-8-carotensyreethylester — orange farve",
  "E161a": "Flavoxanthin — gul farve (ikke godkendt i EU)",
  "E161b": "Lutein — gul farve fra blomster og æg",
  "E161c": "Kryptoxanthin — gul-orange farve (ikke godkendt i EU)",
  "E161d": "Rubixanthin — gul-orange farve (ikke godkendt i EU)",
  "E161e": "Violaxanthin — gul farve (ikke godkendt i EU)",
  "E161f": "Rhodoxanthin — rød farve (ikke godkendt i EU)",
  "E162": "Rødbetarød/Betanin — rød farve fra rødbede",
  "E163": "Anthocyaniner — rød-lilla farve fra bær og druer",
  "E170": "Calciumkarbonat — hvid farve/fyldsoftf, også kalk",
  "E171": "Titandioxid — hvid farve, bruges i slik og tandpasta",
  "E172": "Jernoxider og jernhydroxider — gul, rød og sort farve",
  "E173": "Aluminium — sølvfarve til konfekture",
  "E174": "Sølv — sølvfarve til konfekture",
  "E175": "Guld — guldfarve til konfekture",
  "E180": "Litholrubine BK — rød farve til osteskorper",
  "E200": "Sorbinsyre — konserverer mod skimmelsvamp i ost og bagværk",
  "E201": "Natriumsorbat — konservering mod skimmel",
  "E202": "Kaliumsorbat — meget udbredt konservering mod skimmel og gær",
  "E203": "Calciumsorbat — konservering mod skimmel",
  "E210": "Benzoesyre — konservering i saft, marmelade og drikkevarer",
  "E211": "Natriumbenzoat — udbredt konservering i sodavand og saucer",
  "E212": "Kaliumbenzoat — konservering mod gær og bakterier",
  "E213": "Calciumbenzoat — konservering mod mikrober",
  "E214": "Ethylparahydroxybenzoat — konservering (parabener)",
  "E215": "Natriumethylparahydroxybenzoat — konservering (parabener)",
  "E218": "Methylparahydroxybenzoat — konservering (parabener)",
  "E219": "Natriummethylparahydroxybenzoat — konservering (parabener)",
  "E220": "Svovldioxid — konservering i vin, frugt og tørrede frugter",
  "E221": "Natriumsulfit — konservering, forhindrer brunfarvning",
  "E222": "Natriumhydrogensulfit — konservering i vin og frugtprodukter",
  "E223": "Natriumdisulfit — konservering og blegemiddel",
  "E224": "Kaliumdisulfit — konservering i vin",
  "E225": "Kaliumsulfit — konservering",
  "E226": "Calciumsulfit — konservering og fasthedsmiddel",
  "E227": "Calciumhydrogensulfit — konservering i øl",
  "E228": "Kaliumhydrogensulfit — konservering i vin",
  "E230": "Biphenyl/Diphenyl — konservering på citrusskaller",
  "E231": "Orthophenylphenol — konservering på citrusskaller",
  "E232": "Natriumorthophenylphenol — konservering på citrusskaller",
  "E234": "Nisin — naturlig antibiotisk konservering i ost",
  "E235": "Natamycin — naturlig antibiotisk konservering mod skimmel",
  "E239": "Hexamethylentetramin — konservering i syltet fisk",
  "E242": "Dimethyldicarbonat — konservering i drikkevarer",
  "E249": "Kaliumnitrit — konservering og rødfarvning af kødprodukter",
  "E250": "Natriumnitrit — konservering i pålæg og bacon, kan danne nitrosaminer",
  "E251": "Natriumnitrat — konservering i kødprodukter og ost",
  "E252": "Kaliumnitrat — konservering i kødprodukter og ost",
  "E260": "Eddikesyre — konservering og smagsgiver, naturlig i eddike",
  "E261": "Kaliumacetat — konservering og surheds regulering",
  "E262": "Natriumacetat — konservering og smagsgiver",
  "E263": "Calciumacetat — konservering og fasthedsmiddel",
  "E270": "Mælkesyre — konservering, naturlig i fermenterede produkter",
  "E280": "Propionsyre — konservering mod skimmel i brød",
  "E281": "Natriumpropionat — konservering i brød og bagværk",
  "E282": "Calciumpropionat — konservering i brød og bagværk",
  "E283": "Kaliumpropionat — konservering i brød",
  "E284": "Borsyre — konservering i kaviar",
  "E285": "Natriumtetraborat — konservering i kaviar",
  "E290": "Kuldioxid — kulsyre i drikkevarer og emballage",
  "E296": "Æblesyre — konservering og smagsgiver",
  "E297": "Fumarsyre — konservering og syrningsagent",
  "E300": "Ascorbinsyre (C-vitamin) — antioxidant, forhindrer brunfarvning",
  "E301": "Natriumascorbat — antioxidant, C-vitaminsalt",
  "E302": "Calciumascorbat — antioxidant, C-vitaminsalt",
  "E304": "Fedtsyreestere af ascorbinsyre — fedtopløselig antioxidant",
  "E306": "Tokoferoler (E-vitamin) — naturlig antioxidant fra vegetabilske olier",
  "E307": "Alfa-tokoferol — syntetisk E-vitamin, antioxidant",
  "E308": "Gamma-tokoferol — syntetisk E-vitamin",
  "E309": "Delta-tokoferol — syntetisk E-vitamin",
  "E310": "Propylgallat — antioxidant i fedtstoffer og olier",
  "E311": "Octylgallat — antioxidant i fedtstoffer",
  "E312": "Dodecylgallat — antioxidant i fedtstoffer",
  "E315": "Erythorbinsyre — antioxidant i kødprodukter",
  "E316": "Natriumerythorbat — antioxidant i kødprodukter",
  "E319": "TBHQ — antioxidant i vegetabilske olier og chips",
  "E320": "BHA (Butylhydroxyanisol) — kontroversiel antioxidant i fedtstoffer",
  "E321": "BHT (Butylhydroxytoluen) — kontroversiel antioxidant i fedtstoffer",
  "E322": "Lecitiner — emulgator og antioxidant, ofte fra soja eller solsikke",
  "E325": "Natriumlactat — antioxidantsynergist og fugtighedsbeholder",
  "E326": "Kaliumlactat — antioxidantsynergist",
  "E327": "Calciumlactat — antioxidantsynergist og fasthedsmiddel",
  "E328": "Ammoniumlactat — antioxidantsynergist",
  "E329": "Magnesiumlactat — antioxidantsynergist",
  "E330": "Citronsyre — antioxidant og syrningsagent, naturlig i citrusfrugter",
  "E331": "Natriumcitrat — antioxidantsynergist og emulgator",
  "E332": "Kaliumcitrat — antioxidantsynergist og regulering af surhedsgrad",
  "E333": "Calciumcitrat — antioxidantsynergist og fasthedsmiddel",
  "E334": "Vinsyre (L-tartrat) — antioxidant og syrningsagent i vin",
  "E335": "Natriumtartrat — antioxidantsynergist",
  "E336": "Kaliumtartrat — antioxidantsynergist og bagepulver",
  "E337": "Natriumkaliumtartrat — antioxidantsynergist",
  "E338": "Fosforsyre — antioxidantsynergist og surhedsregulering i cola",
  "E339": "Natriumfosfater — antioxidantsynergist og emulgator",
  "E340": "Kaliumfosfater — antioxidantsynergist og hævemiddel",
  "E341": "Calciumfosfater — antioxidantsynergist og hævemiddel",
  "E343": "Magnesiumfosfater — antioxidantsynergist",
  "E350": "Natriummalat — antioxidantsynergist",
  "E351": "Kaliummalat — antioxidantsynergist",
  "E352": "Calciummalat — antioxidantsynergist",
  "E353": "Metavinsyre — antioxidantsynergist i vin",
  "E354": "Calciumtartrat — antioxidantsynergist",
  "E355": "Adipinsyre — antioxidantsynergist og syrningsagent",
  "E356": "Natriumadipinat — antioxidantsynergist",
  "E357": "Kaliumadipinat — antioxidantsynergist",
  "E363": "Ravsyre — antioxidantsynergist",
  "E380": "Triammoniumcitrat — antioxidantsynergist",
  "E385": "Calciumdinatrium-EDTA — antioxidantsynergist og sekvestringsmiddel",
  "E392": "Ekstrakter af rosmarin — naturlig antioxidant",
  "E393": "Ekstrakter af rig-ekstrakt (Quillaja) — naturlig antioxidant",
  "E400": "Alginsyre — fortykningsmiddel fra brunalger",
  "E401": "Natriumalginat — fortykningsmiddel fra brunalger",
  "E402": "Kaliumalginat — fortykningsmiddel fra brunalger",
  "E403": "Ammoniumalginat — fortykningsmiddel fra brunalger",
  "E404": "Calciumalginat — fortykningsmiddel, gelerende middel",
  "E405": "Propylenglycolalginat — emulgator og stabilisator",
  "E406": "Agar — gelerende middel fra rødalger, vegansk gelatine",
  "E407": "Carrageenan — fortykningsmiddel fra rødalger, bruges i mælkeprodukter",
  "E407a": "Bearbejdet Eucheuma-alger — fortykningsmiddel",
  "E408": "Karayagummi — fortykningsmiddel",
  "E410": "Johannesbrødkernmel — fortykningsmiddel fra johannesbrødtræ",
  "E411": "Havrekernmel — fortykningsmiddel",
  "E412": "Guargummi — fortykningsmiddel fra guarbønne",
  "E413": "Tragant — fortykningsmiddel fra tornebusk",
  "E414": "Arabiagummi — fortykningsmiddel, naturlig harpiks",
  "E415": "Xanthangummi — fortykningsmiddel fra fermentering",
  "E416": "Karayagummi — fortykningsmiddel fra karayabusk",
  "E417": "Tarakernmel — fortykningsmiddel fra tarafrø",
  "E418": "Gellangummi — fortykningsmiddel fra fermentering",
  "E419": "Ghatti gummi — fortykningsmiddel",
  "E420": "Sorbitol/Sorbitolsirup — sødemiddel og fugtighedsbeholder",
  "E421": "Mannitol — sødemiddel og anti-klumpningsmiddel",
  "E422": "Glycerol — fugtighedsbeholder og opløsningsmiddel",
  "E423": "Octylgallat — antioxidant",
  "E425": "Konjac — fortykningsmiddel og gelerende middel",
  "E426": "Sojabønne-hemicellulose — emulgator",
  "E427": "Cassie gummi — fortykningsmiddel",
  "E430": "Polyoxyethylen(8)stearat — emulgator",
  "E431": "Polyoxyethylen(40)stearat — emulgator",
  "E432": "Polyoxyethylensobitanmonolaurat (Polysorbat 20) — emulgator",
  "E433": "Polyoxyethylensorbitanmonooleat (Polysorbat 80) — emulgator",
  "E434": "Polyoxyethylensorbitanmonopalmitat (Polysorbat 40) — emulgator",
  "E435": "Polyoxyethylensorbitanmonostearat (Polysorbat 60) — emulgator",
  "E436": "Polyoxyethylensorbitantristearat (Polysorbat 65) — emulgator",
  "E440": "Pektiner — gelerende middel fra citrusskaller og æbler",
  "E442": "Ammoniumfosfatider — emulgator i chokolade",
  "E444": "Saccharoseacetoisobutyrat — emulgator i drikkevarer",
  "E445": "Glycerolestere af træharpiks — emulgator i drikkevarer",
  "E450": "Diphosphater — hæve- og bindemiddel i bagværk",
  "E451": "Triphosphater — bindemiddel i kødprodukter",
  "E452": "Polyphosphater — bindemiddel, vandholdenhed i kød",
  "E459": "Beta-cyclodextrin — indkapslingsmiddel",
  "E460": "Cellulose — fyldsotf og anti-klumpningsmiddel",
  "E461": "Methylcellulose — fortykningsmiddel og emulgator",
  "E462": "Ethylcellulose — bindemiddel",
  "E463": "Hydroxypropylcellulose — fortykningsmiddel",
  "E464": "Hydroxypropylmethylcellulose — fortykningsmiddel og emulgator",
  "E465": "Ethylmethylcellulose — fortykningsmiddel",
  "E466": "Carboxymethylcellulose — fortykningsmiddel og stabilisator",
  "E468": "Crosslinket natriumcarboxymethylcellulose — stabilisator",
  "E469": "Enzymatisk hydrolyseret carboxymethylcellulose — stabilisator",
  "E470a": "Natriumsalte af fedtsyrer — emulgator",
  "E470b": "Magnesiumsalte af fedtsyrer — emulgator og anti-klumpningsmiddel",
  "E471": "Mono- og diglycerider af fedtsyrer — emulgator i brød og margarine",
  "E472a": "Eddikesyreestere af mono- og diglycerider — emulgator",
  "E472b": "Mælkesyreestere af mono- og diglycerider — emulgator",
  "E472c": "Citronsyreestere af mono- og diglycerider — emulgator",
  "E472d": "Vinsyreestere af mono- og diglycerider — emulgator",
  "E472e": "Diacetyltartrat- og eddikesyreestere af mono- og diglycerider — emulgator",
  "E472f": "Blandede eddike- og vinsyreestere af mono- og diglycerider — emulgator",
  "E473": "Saccharosefedtsyreestere — emulgator",
  "E474": "Saccharoglycerider — emulgator",
  "E475": "Polyglycerolestere af fedtsyrer — emulgator",
  "E476": "Polyglycerolpolyricinoleat — emulgator i chokolade",
  "E477": "Propylenglycolestere af fedtsyrer — emulgator",
  "E479b": "Varmebehandlet sojaolieinteraktion med mono- og diglycerider — emulgator",
  "E481": "Natriumstearoyl-2-lactylat — emulgator i brød",
  "E482": "Calciumstearoyl-2-lactylat — emulgator i brød",
  "E483": "Stearoyltartrat — emulgator",
  "E484": "Stearylcitrat — emulgator",
  "E491": "Sorbitanmonostearat — emulgator",
  "E492": "Sorbitantristearat — emulgator",
  "E493": "Sorbitanmonolauarat — emulgator",
  "E494": "Sorbitanmonooleat — emulgator",
  "E495": "Sorbitanmonopalmitat — emulgator",
  "E620": "L-Glutaminsyre — naturlig smagsforstærker, findes i tomat og ost",
  "E621": "Mononatriumglutamat (MSG) — syntetisk smagsforstærker, omdiskuteret",
  "E622": "Monokaliumglutamat — smagsforstærker",
  "E623": "Calciumdiglutamat — smagsforstærker",
  "E624": "Monoammoniumglutamat — smagsforstærker",
  "E625": "Magnesiumdiglutamat — smagsforstærker",
  "E626": "Guanylsyre — smagsforstærker",
  "E627": "Dinatriumguanylat — smagsforstærker, forstærker MSG-effekt",
  "E628": "Dikaliumguanylat — smagsforstærker",
  "E629": "Calciumguanylat — smagsforstærker",
  "E630": "Inosinsyre — smagsforstærker",
  "E631": "Dinatriuminosinat — smagsforstærker, forstærker MSG-effekt",
  "E632": "Dikaliuminosinat — smagsforstærker",
  "E633": "Calciuminosinat — smagsforstærker",
  "E634": "Calcium-5-ribonukleotider — smagsforstærker",
  "E635": "Dinatrium-5-ribonukleotider — smagsforstærker, kombination af E627+E631",
  "E636": "Maltol — smagsforstærker og aromasoftf",
  "E637": "Ethylmaltol — smagsforstærker, forstærker sød smag",
  "E640": "Glycin og natriumsalt — smagsforstærker",
  "E650": "Zinkacetat — smagsforstærker i tyggegummi",
  "E900": "Dimethylpolysiloxan — anti-skummiddel i fedtstoffer og juice",
  "E901": "Bivoks — glaseringsmiddel på frugt og slik",
  "E902": "Candelillavoks — glaseringsmiddel, vegansk alternativ til bivoks",
  "E903": "Carnaubavoks — glaseringsmiddel fra palmeblade",
  "E904": "Shellac — glaseringsmiddel fra skjoldlus",
  "E905": "Mikrokrystallinsk voks — glaseringsmiddel",
  "E907": "Raffineret mikrokrystallinsk voks — glaseringsmiddel",
  "E912": "Montan-syreestere — glaseringsmiddel",
  "E914": "Oxideret polyethylenvoks — glaseringsmiddel",
  "E920": "L-Cystein — mel-forbedrer i bagværk",
  "E927b": "Carbamid (urinstof) — mel-forbedrer",
  "E938": "Argon — emballeringsgas",
  "E939": "Helium — emballeringsgas",
  "E941": "Kvælstof — emballeringsgas, forlænger holdbarheden",
  "E942": "Lattergas — drivgas i flødeskum",
  "E943a": "Butan — drivgas",
  "E943b": "Isobutan — drivgas",
  "E944": "Propan — drivgas",
  "E948": "Oxygen — emballeringsgas",
  "E949": "Hydrogen — emballeringsgas",
  "E950": "Acesulfam K — sødemiddel, ca. 200x sødere end sukker",
  "E951": "Aspartam — sødemiddel, 200x sødere end sukker, indeholder phenylalanin",
  "E952": "Cyclaminsyre/Cyclamat — sødemiddel, forbudt i USA",
  "E953": "Isomalt — sødemiddel og fyldsoftf fra sukker",
  "E954": "Saccharin og salte — ældste kunstige sødemiddel, 300-500x sødere",
  "E955": "Sucralose — sødemiddel, 600x sødere end sukker",
  "E957": "Thaumatin — naturlig proteinsødemiddel fra afrikansk frugt",
  "E958": "Glycyrrhizin — naturlig sødemiddel fra lakrids",
  "E959": "Neohesperidindihydrochalcon — sødemiddel fra citrus",
  "E960": "Steviolglykosider (Stevia) — naturlig sødemiddel fra steviaplante",
  "E961": "Neotam — sødemiddel, 7000-13000x sødere end sukker",
  "E962": "Aspartam-acesulfamsalt — sødemiddel",
  "E965": "Maltitol/Maltitolsirup — sødemiddel og fugtighedsbeholder",
  "E966": "Lactitol — sødemiddel, afledt af laktose",
  "E967": "Xylitol — sødemiddel fra birkebark, godt for tænder",
  "E968": "Erythritol — sødemiddel, naturligt i frugt og fermenterede fødevarer",
  "E969": "Advantam — sødemiddel, 20000x sødere end sukker",
  "E999": "Quillajaekstrakt — skumdannende middel i drikkevarer",
  "E161g": "Canthaxanthin — orange farve, bruges i lakseopdræt",
};

const ENumberPicker = ({ selected, onChange }) => {
  const [search, setSearch] = React.useState("");
  const [cat, setCat] = React.useState("alle");

  const filtered = Object.entries(E_NUMBERS).filter(([e, name]) => {
    const matchSearch = !search || e.toLowerCase().includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (cat === "alle") return true;
    const num = parseInt(e.slice(1).replace(/[^0-9]/g,''));
    const ranges = { farve:[100,199], konserv:[200,299], antioxid:[300,399], emulg:[400,499], smags:[600,699], sode:[900,999] };
    const r = ranges[cat];
    return r ? (num >= r[0] && num <= r[1]) : true;
  });

  const popular = ["E621","E211","E102","E951","E250","E320","E150d","E110","E129","E951"];

  return (
    <div>
      {/* Populære */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
        {popular.filter(e => E_NUMBERS[e]).map(e => {
          const on = selected.includes(e);
          return (
            <div key={e} onClick={() => onChange(on ? selected.filter(x=>x!==e) : [...selected,e])}
              style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, cursor:"pointer",
                background: on?"var(--red-lt)":"var(--paper2)",
                color: on?"var(--red)":"var(--ink2)",
                border:`1.5px solid ${on?"var(--red)":"var(--border)"}` }}>
              {e}{on?" ✓":""}
            </div>
          );
        })}
      </div>

      {/* Søg */}
      <input style={{ width:"100%", padding:"8px 12px", border:"1.5px solid var(--border2)", borderRadius:8, fontSize:13, fontFamily:"var(--f)", marginBottom:8, boxSizing:"border-box" }}
        placeholder="Søg E-nummer eller navn..." value={search} onChange={e => setSearch(e.target.value)} />

      {/* Kategori */}
      <select style={{ width:"100%", padding:"8px 12px", border:"1.5px solid var(--border2)", borderRadius:8, fontSize:13, fontFamily:"var(--f)", marginBottom:8, background:"#fff", boxSizing:"border-box" }}
        value={cat} onChange={e => setCat(e.target.value)}>
        <option value="alle">Alle kategorier</option>
        <option value="farve">Farvestoffer (E100–E199)</option>
        <option value="konserv">Konserveringsmidler (E200–E299)</option>
        <option value="antioxid">Antioxidanter (E300–E399)</option>
        <option value="emulg">Emulgatorer / Stabilisatorer (E400–E499)</option>
        <option value="smags">Smagsforstærkere (E600–E699)</option>
        <option value="sode">Sødestoffer (E900–E999)</option>
      </select>

      {/* Farveforklaring */}
      <div style={{ display:"flex", gap:6, marginBottom:8 }}>
        {[["var(--border)","var(--ink)","Ingen"],["var(--amber)","var(--amber)","Intolerance"],["var(--red)","var(--red)","Allergi"]].map(([border,color,label]) => (
          <div key={label} style={{ flex:1, display:"flex", alignItems:"center", gap:5, padding:"4px 8px", border:`1.5px solid ${border}`, borderRadius:8, background:color==="var(--ink)"?"var(--paper2)":color==="var(--amber)"?"var(--amber-lt)":"var(--red-lt)" }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0 }}/>
            <span style={{ fontSize:10, fontWeight:700, color }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:10, color:"var(--muted)", marginBottom:8 }}>Tryk 1x = Intolerance · 2x = Allergi · 3x = Fjern</div>

      {/* Liste */}
      <div style={{ maxHeight:320, overflowY:"auto", border:"1px solid var(--border)", borderRadius:8 }}>
        {filtered.map(([e, name], i, arr) => {
          const state = selected.includes(e+"_intolerance") ? "intolerance" : selected.includes(e) ? "allergen" : "none";
          const bg = state==="allergen"?"var(--red-lt)":state==="intolerance"?"var(--amber-lt)":"#fff";
          const col = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--ink)";
          const colMuted = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--muted2)";
          return (
            <div key={e} onClick={() => {
              if (state==="none") onChange([...selected, e+"_intolerance"]);
              else if (state==="intolerance") onChange([...selected.filter(x=>x!==e+"_intolerance"), e]);
              else onChange(selected.filter(x=>x!==e));
            }} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 12px",
              borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none",
              background: bg, cursor:"pointer" }}>
              <div style={{ fontSize:12, fontWeight:800, color:col, width:48, flexShrink:0, paddingTop:1 }}>{e}</div>
              <div style={{ fontSize:12, color:colMuted, flex:1, lineHeight:1.4 }}>{name}</div>
              {state!=="none" && <div style={{ fontSize:9, fontWeight:800, color:col, flexShrink:0, paddingTop:2 }}>{state==="allergen"?"Allergi":"Intolerance"}</div>}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding:"16px", fontSize:13, color:"var(--muted)", textAlign:"center" }}>Ingen resultater</div>}
      </div>

      {/* Valgte */}
      {selected.length > 0 && (
        <div style={{ marginTop:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Valgte ({selected.length})</div>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {selected.map(e => {
              const isIntolerance = e.endsWith("_intolerance");
              const eId = isIntolerance ? e.replace("_intolerance","") : e;
              const col = isIntolerance ? "var(--amber)" : "var(--red)";
              const bg = isIntolerance ? "var(--amber-lt)" : "var(--red-lt)";
              const border = isIntolerance ? "var(--amber-md)" : "var(--red-md)";
              return (
                <div key={e} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 10px", background:bg, border:`1px solid ${border}`, borderRadius:6 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:col, width:44, flexShrink:0 }}>{eId}</div>
                  <div style={{ fontSize:11, color:col, flex:1, lineHeight:1.3 }}>{(E_NUMBERS[eId]||"").split(" — ")[0]}</div>
                  <div style={{ fontSize:9, fontWeight:700, color:col }}>{isIntolerance?"Intolerance":"Allergi"}</div>
                  <div onClick={() => onChange(selected.filter(x=>x!==e))} style={{ cursor:"pointer", flexShrink:0 }}>
                    <Icon name="x" size={12} color={col} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};




// Selvmodsigende subtype-kombinationer — disse kan ikke vælges samtidig
const INCOMPATIBLE_SUBTYPES = {
  // Gluten: "alle" udelukker de mere specifikke (cøliaki+sensitivitet er ok, men "alle" + specifik er redundant)
  gluten_alle:     ["gluten_coeliaki", "gluten_allergi", "gluten_sensitiv"],
  gluten_coeliaki: ["gluten_alle"],
  gluten_allergi:  ["gluten_alle"],
  gluten_sensitiv: ["gluten_alle"],
  // Mælk: "alle" udelukker de specifikke
  laktose_alle:    ["laktose_protein", "laktose_sukker", "laktose_valle"],
  laktose_protein: ["laktose_alle"],
  laktose_sukker:  ["laktose_alle"],
  laktose_valle:   ["laktose_alle"],
  // Nødder: "alle" udelukker specifikke
  noedder_alle:    ["noedder_hassel","noedder_mandel","noedder_valnoed","noedder_cashew","noedder_kokos"],
  noedder_hassel:  ["noedder_alle"],
  noedder_mandel:  ["noedder_alle"],
  noedder_valnoed: ["noedder_alle"],
  noedder_cashew:  ["noedder_alle"],
  noedder_kokos:   ["noedder_alle"],
  // Æg: "alle" udelukker specifikke
  aeg_alle:        ["aeg_hvid", "aeg_bagt"],
  aeg_hvid:        ["aeg_alle"],
  aeg_bagt:        ["aeg_alle"],
  // Fisk: "alle" udelukker specifikke
  fisk_alle:       ["fisk_hvid", "fisk_fed", "fisk_skjult"],
  fisk_hvid:       ["fisk_alle"],
  fisk_fed:        ["fisk_alle"],
  fisk_skjult:     ["fisk_alle"],
  // Soja: "alle" udelukker specifikke
  soja_alle:       ["soja_protein", "soja_lecitin"],
  soja_protein:    ["soja_alle"],
  soja_lecitin:    ["soja_alle"],
  // Skaldyr: "alle" udelukker specifikke
  skaldyr_alle:    ["skaldyr_krebs", "skaldyr_bloeddyr"],
  skaldyr_krebs:   ["skaldyr_alle"],
  skaldyr_bloeddyr:["skaldyr_alle"],
  // Sesam: "alle" udelukker specifikke
  sesam_alle:      ["sesam_froe", "sesam_olie"],
  sesam_froe:      ["sesam_alle"],
  sesam_olie:      ["sesam_alle"],
};

// ─── ALLERGEN SUBTYPE MODAL ───────────────────────────────────────────────────
const SubtypeModal = ({ allergenId, selectedSubtypes = [], onToggle, onClose }) => {
  const data = ALLERGEN_SUBTYPES[allergenId];
  if (!data) return null;

  const isDisabled = (optId) => {
    const incompatible = INCOMPATIBLE_SUBTYPES[optId] || [];
    return selectedSubtypes.some(s => incompatible.includes(s));
  };

  const isSelected = (optId) => selectedSubtypes.includes(optId);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end" }}>
      <div style={{ background:"var(--paper)", width:"100%", borderRadius:"20px 20px 0 0", padding:"24px 20px 40px", maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Præciser din {data.label}-reaktion</div>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:4, lineHeight:1.5 }}>{data.intro}</div>
          </div>
          <div onClick={onClose} style={{ cursor:"pointer", padding:4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
        </div>

        <div style={{ fontSize:11, color:"var(--green)", fontWeight:600, marginBottom:14 }}>
          Du kan vælge flere — kombinationer der modsiger hinanden er låst.
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {data.options.map(opt => {
            const selected = isSelected(opt.id);
            const disabled = !selected && isDisabled(opt.id);
            return (
              <div key={opt.id}
                onClick={() => !disabled && onToggle(opt.id)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                  border:`1.5px solid ${selected?"var(--green)":disabled?"var(--border)":"var(--border)"}`,
                  background:selected?"var(--green-lt)":disabled?"var(--paper2)":"#fff",
                  borderRadius:12, cursor:disabled?"not-allowed":"pointer",
                  opacity:disabled?0.45:1, transition:"all .15s" }}>
                <div style={{ fontSize:22, flexShrink:0 }}>{opt.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:selected?"var(--green)":"var(--ink)", marginBottom:2 }}>{opt.label}</div>
                  <div style={{ fontSize:11, color:"var(--muted2)", lineHeight:1.4 }}>{opt.desc}</div>
                  {disabled && (
                    <div style={{ fontSize:10, color:"var(--muted)", marginTop:3 }}>Modstrider valgt kombination</div>
                  )}
                </div>
                {selected && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5">
                    <path strokeLinecap="round" d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </div>
            );
          })}
          <div onClick={() => { data.options.forEach(o => isSelected(o.id) && onToggle(o.id)); onClose(); }}
            style={{ padding:"10px 14px", border:"1px solid var(--border)", borderRadius:12,
              cursor:"pointer", textAlign:"center", fontSize:12, color:"var(--muted)" }}>
            Nulstil — behold bred kategori ({data.label})
          </div>
        </div>

        <button className="btn btn-primary btn-full" style={{ marginTop:16 }} onClick={onClose}>
          Gem valg
        </button>
      </div>
    </div>
  );
};


// ─── FÆLLES ALLERGI/PROFIL FORMULAR ──────────────────────────────────────────
// Bruges identisk i: onboarding trin 4, rediger profil, familie (onboarding + rediger)
const AllergyForm = ({ allergens, setAllergens, customAllerg, setCustomAllerg,
  selectedENumbers, setSelectedENumbers, allergenSubtypes, setAllergenSubtypes,
  activeSubtypeModal, setActiveSubtypeModal, showENumbers = true }) => {

  const [customInput, setCustomInput] = React.useState("");
  const [eSearch, setESearch] = React.useState("");
  const [eCategory, setECategory] = React.useState("alle");

  return (
    <div>
      {/* Farveforklaring */}
      <div style={{ display:"flex", gap:6, marginBottom:10 }}>
        {[["var(--border)","var(--ink)","Ingen"],["var(--amber)","var(--amber)","Intolerance"],["var(--red)","var(--red)","Allergi"]].map(([border,color,label]) => (
          <div key={label} style={{ flex:1, display:"flex", alignItems:"center", gap:5, padding:"5px 8px",
            border:`1.5px solid ${border}`, borderRadius:8,
            background:color==="var(--ink)"?"var(--paper2)":color==="var(--amber)"?"var(--amber-lt)":"var(--red-lt)" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }}/>
            <span style={{ fontSize:10, fontWeight:700, color }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:11, color:"var(--muted)", marginBottom:12, lineHeight:1.4 }}>
        Tryk 1x = Intolerance · 2x = Allergi · 3x = Fjern
      </div>

      {/* Allergen chips — 3-state */}
      <div className="chip-grid">
        {ALLERGENS.map(a => {
          const isAllergen = allergens.includes(a.id) && !customAllerg.includes(a.id+"_intolerance");
          const isIntolerance = allergens.includes(a.id) && customAllerg.includes(a.id+"_intolerance");
          const state = isAllergen ? "allergen" : isIntolerance ? "intolerance" : "none";
          const bg = state==="allergen"?"var(--red-lt)":state==="intolerance"?"var(--amber-lt)":"var(--paper2)";
          const border = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--border)";
          const color = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--ink)";
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
              {state!=="none" && allergenSubtypes[a.id] && <div style={{ fontSize:8, fontWeight:800, color }}>✓</div>}
              {state!=="none" && !allergenSubtypes[a.id] && <div style={{ fontSize:9, fontWeight:800, color }}>{state==="allergen"?"Allergi":"Intolerance"}</div>}
            </div>
          );
        })}
      </div>

      {/* Præciser valgte allergier */}
      {allergens.some(id => ALLERGEN_SUBTYPES[id]) && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>Tilpas din allergi præcist til dig selv</div>
          <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>
            For størst mulig tryghed kan du præcisere hvad du reagerer på inden for hver kategori.
          </div>
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

      {/* Skriv selv */}
      <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Kan ikke finde din allergi?</div>
        <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>Skriv det selv herunder. Vi tilføjer løbende flere valgmuligheder med større sikkerhed.</div>
        <div className="input-row" style={{ marginBottom: customAllerg.filter(c=>!c.endsWith("_intolerance")).length ? 8 : 0 }}>
          <input className="field" placeholder="Fx. Fructose…" value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter"&&customInput.trim()){ setCustomAllerg(p=>[...p,customInput.trim()]); setCustomInput(""); }}} />
          <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(p=>[...p,customInput.trim()]); setCustomInput(""); }}}>+</button>
        </div>
        {customAllerg.filter(c=>!c.endsWith("_intolerance")).length > 0 && (
          <div className="tags">
            {customAllerg.filter(c=>!c.endsWith("_intolerance")).map((a,i) => (
              <div key={i} className="tag">{a}<span className="tag-x" onClick={() => setCustomAllerg(p=>p.filter(x=>x!==a))}>×</span></div>
            ))}
          </div>
        )}
      </div>

      {/* E-numre */}
      {showENumbers && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>E-numre der undgås</div>
          <ENumberPicker selected={selectedENumbers} onChange={setSelectedENumbers} />
        </div>
      )}
    </div>
  );
};


// ─── FÆLLES FAMILIE FORMULAR ─────────────────────────────────────────────────
// Bruges 1-1 identisk i onboarding trin 6, familie-skærm og redigering af familiemedlem
const MemberForm = ({
  name, setName,
  allergens, setAllergens,
  customAllerg, setCustomAllerg,
  subtypes, setSubtypes,
  diets, setDiets,
  eNumbers, setENumbers,
  customInput, setCustomInput,
  onAdd, addLabel,
}) => {
  const [activeSubModal, setActiveSubModal] = React.useState(null);
  const [eSearch, setESearch] = React.useState("");
  const [eCat, setECat] = React.useState("alle");

  return (
    <div>
      {activeSubModal && (
        <SubtypeModal
          allergenId={activeSubModal}
          selectedSubtypes={subtypes[activeSubModal] || []}
          onToggle={(id) => setSubtypes(s => {
            const cur = s[activeSubModal] || [];
            return { ...s, [activeSubModal]: cur.includes(id) ? cur.filter(x=>x!==id) : [...cur, id] };
          })}
          onClose={() => setActiveSubModal(null)}
        />
      )}

      {/* Navn */}
      <label className="field-lbl">Navn</label>
      <input className="field" placeholder="Fx. Mia (8 år)" value={name}
        onChange={e => setName(e.target.value)} style={{ marginBottom:14 }} />

      {/* Allergier / intolerancer — 3-state identisk med egen profil */}
      <div className="card-lbl" style={{ marginBottom:6 }}>Allergier / intolerancer</div>

      {/* Farveforklaring */}
      <div style={{ display:"flex", gap:6, marginBottom:10 }}>
        {[["var(--border)","var(--ink)","Ingen"],["var(--amber)","var(--amber)","Intolerance"],["var(--red)","var(--red)","Allergi"]].map(([border,color,label]) => (
          <div key={label} style={{ flex:1, display:"flex", alignItems:"center", gap:5, padding:"4px 8px",
            border:`1.5px solid ${border}`, borderRadius:8,
            background:color==="var(--ink)"?"var(--paper2)":color==="var(--amber)"?"var(--amber-lt)":"var(--red-lt)" }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0 }}/>
            <span style={{ fontSize:10, fontWeight:700, color }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:10, color:"var(--muted)", marginBottom:10 }}>Tryk 1x = Intolerance · 2x = Allergi · 3x = Fjern</div>

      <div className="chip-grid" style={{ marginBottom:10 }}>
        {ALLERGENS.map(a => {
          const isAllergen = allergens.includes(a.id) && !customAllerg.includes(a.id+"_intolerance");
          const isIntolerance = allergens.includes(a.id) && customAllerg.includes(a.id+"_intolerance");
          const state = isAllergen ? "allergen" : isIntolerance ? "intolerance" : "none";
          const bg = state==="allergen"?"var(--red-lt)":state==="intolerance"?"var(--amber-lt)":"var(--paper2)";
          const border = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--border)";
          const color = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--ink)";
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
              {state!=="none" && (
                <div style={{ fontSize:9, fontWeight:800, color }}>
                  {subtypes[a.id] ? "✓" : state==="allergen"?"Allergi":"Intolerance"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Præciser allergi */}
      {allergens.some(id => ALLERGEN_SUBTYPES[id]) && (
        <div style={{ marginBottom:12, paddingBottom:12, borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>Tilpas allergi præcist til dig selv</div>
          <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>For størst mulig tryghed — præciser hvad du reagerer på.</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {allergens.filter(id => ALLERGEN_SUBTYPES[id]).map(id => {
              const data = ALLERGEN_SUBTYPES[id];
              const subtype = subtypes[id];
              const subtypeLabel = subtype && subtype.length > 0 ? subtype.map(id => data.options.find(o=>o.id===id)?.label).filter(Boolean).join(", ") : null;
              return (
                <div key={id} onClick={() => setActiveSubModal(id)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                    border:"1.5px solid var(--green)", background:"var(--green-lt)", borderRadius:10, cursor:"pointer" }}>
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

      {/* Custom allergier */}
      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Kan ikke finde allergi?</div>
      <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>Vi tilføjer løbende flere valgmuligheder med større sikkerhed.</div>
      <div className="input-row" style={{ marginBottom:customAllerg.filter(c=>!c.endsWith("_intolerance")).length ? 8 : 12 }}>
        <input className="field" placeholder="Fx. Fructose…" value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if(e.key==="Enter"&&customInput.trim()){ setCustomAllerg(p=>[...p,customInput.trim()]); setCustomInput(""); }}} />
        <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(p=>[...p,customInput.trim()]); setCustomInput(""); }}}>+</button>
      </div>
      {customAllerg.filter(c=>!c.endsWith("_intolerance")).length > 0 && (
        <div className="tags" style={{ marginBottom:12 }}>
          {customAllerg.filter(c=>!c.endsWith("_intolerance")).map((a,i) => (
            <div key={i} className="tag">{a}<span className="tag-x" onClick={() => setCustomAllerg(p=>p.filter(x=>x!==a))}>×</span></div>
          ))}
        </div>
      )}

      {/* Diæt */}
      <div className="card-lbl" style={{ marginBottom:8 }}>Diæt</div>
      <div className="chip-grid" style={{ marginBottom:12 }}>
        {DIETS.map(d => {
          const on = diets.includes(d.id);
          return (
            <div key={d.id} className={`chip${on?" on":""}`}
              onClick={() => setDiets(p => on ? p.filter(x=>x!==d.id) : [...p,d.id])}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700 }}>{d.label}</div>
                <div style={{ fontSize:10, color:"var(--muted)", marginTop:1 }}>{d.desc}</div>
              </div>
              {on && <div className="chip-check">✓</div>}
            </div>
          );
        })}
      </div>

      {/* E-numre */}
      <div className="card-lbl" style={{ marginBottom:6 }}>E-numre der undgås</div>
      <input className="field" placeholder="Søg E-nummer..." value={eSearch}
        onChange={e => setESearch(e.target.value)} style={{ marginBottom:6 }} />
      <select className="field" value={eCat} onChange={e => setECat(e.target.value)} style={{ marginBottom:8 }}>
        <option value="alle">Alle kategorier</option>
        {E_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label} ({c.range})</option>)}
      </select>

      {/* E-numre farveforklaring */}
      <div style={{ display:"flex", gap:6, marginBottom:6 }}>
        {[["var(--border)","var(--ink)","Ingen"],["var(--amber)","var(--amber)","Intolerance"],["var(--red)","var(--red)","Allergi"]].map(([border,color,label]) => (
          <div key={label} style={{ flex:1, display:"flex", alignItems:"center", gap:4, padding:"3px 6px", border:`1.5px solid ${border}`, borderRadius:6,
            background:color==="var(--ink)"?"var(--paper2)":color==="var(--amber)"?"var(--amber-lt)":"var(--red-lt)" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }}/>
            <span style={{ fontSize:9, fontWeight:700, color }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:9, color:"var(--muted)", marginBottom:6 }}>Tryk 1x = Intolerance · 2x = Allergi · 3x = Fjern</div>

      <div style={{ maxHeight:200, overflowY:"auto", border:"1px solid var(--border)", borderRadius:8, marginBottom:eNumbers.length ? 8 : 12 }}>
        {Object.entries(E_NUMBERS).filter(([e,name]) => {
          const ms = !eSearch || e.toLowerCase().includes(eSearch.toLowerCase()) || name.toLowerCase().includes(eSearch.toLowerCase());
          if (!ms) return false;
          if (eCat==="alle") return true;
          const cat = E_CATEGORIES.find(c=>c.id===eCat);
          const num = parseInt(e.replace(/[^0-9]/g,""));
          return cat ? num>=cat.min && num<=cat.max : true;
        }).map(([e,name],i,arr) => {
          const state = eNumbers.includes(e+"_intolerance") ? "intolerance" : eNumbers.includes(e) ? "allergen" : "none";
          const bg = state==="allergen"?"var(--red-lt)":state==="intolerance"?"var(--amber-lt)":"#fff";
          const col = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--ink)";
          return (
            <div key={e} onClick={() => {
              if (state==="none") setENumbers(p=>[...p,e+"_intolerance"]);
              else if (state==="intolerance") setENumbers(p=>[...p.filter(x=>x!==e+"_intolerance"),e]);
              else setENumbers(p=>p.filter(x=>x!==e));
            }} style={{ display:"flex", gap:8, padding:"7px 12px",
              borderBottom:i<arr.length-1?"1px solid var(--border)":"none",
              background:bg, cursor:"pointer" }}>
              <div style={{ fontSize:11, fontWeight:800, color:col, width:44, flexShrink:0 }}>{e}</div>
              <div style={{ fontSize:11, color:col==="var(--ink)"?"var(--muted2)":col, flex:1, lineHeight:1.3 }}>{name}</div>
              {state!=="none" && <div style={{ fontSize:9, fontWeight:800, color:col }}>{state==="allergen"?"Allergi":"Intol."}</div>}
            </div>
          );
        })}
      </div>

      {eNumbers.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", marginBottom:4 }}>Valgte ({eNumbers.length})</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {eNumbers.map(e => {
              const isInt = e.endsWith("_intolerance");
              const eId = isInt ? e.replace("_intolerance","") : e;
              const col = isInt ? "var(--amber)" : "var(--red)";
              return (
                <div key={e} style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20,
                  background:isInt?"var(--amber-lt)":"var(--red-lt)", color:col,
                  border:`1px solid ${col}`, cursor:"pointer" }}
                  onClick={() => setENumbers(p=>p.filter(x=>x!==e))}>
                  {eId} ×
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gem knap */}
      <button className="btn btn-primary btn-full" onClick={onAdd}
        disabled={!name.trim()}>
        {addLabel || "+ Tilføj familiemedlem"}
      </button>
    </div>
  );
};


// ─── KATEGORI VÆLGER ─────────────────────────────────────────────────────────
const CategorySelect = ({ value, onChange, options, placeholder="Alle kategorier" }) => {
  const selected = options.find(o => o.id === value);
  return (
    <div style={{ position:"relative", display:"inline-block", minWidth:160 }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance:"none", WebkitAppearance:"none",
          padding:"8px 36px 8px 14px",
          borderRadius:24, border:"1.5px solid var(--border)",
          background:"var(--paper2)", fontSize:13, fontWeight:600,
          color: value === "alle" ? "var(--muted2)" : "var(--ink)",
          cursor:"pointer", fontFamily:"var(--f)",
          outline:"none", width:"100%",
          boxShadow: value !== "alle" ? "0 0 0 2px var(--green)" : "none",
          borderColor: value !== "alle" ? "var(--green)" : "var(--border)",
        }}>
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      {/* Pile-ikon */}
      <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--muted2)", fontSize:11 }}>▾</div>
    </div>
  );
};

// ─── ALLERGEN UNDERKATEGORIER ────────────────────────────────────────────────
const ALLERGEN_SUBTYPES = {
  laktose: {
    label: "Mælk / Laktose",
    intro: "Mælkereaktioner kan variere meget. Præciser din reaktion for størst mulig tryghed.",
    options: [
      { id: "laktose_alle",    label: "Alle mælkeprodukter",        desc: "Undgår alt fra mælk — strengest", icon: "🥛" },
      { id: "laktose_protein", label: "Mælkeprotein (kasein/valle)", desc: "Allergi mod mælkeprotein — også i smør og hård ost", icon: "🧀" },
      { id: "laktose_sukker",  label: "Laktose (mælkesukker)",      desc: "Tåler ofte smør og hård ost med lavt laktoseindhold", icon: "🫙" },
      { id: "laktose_valle",   label: "Valle-protein",               desc: "Relevant i sportsprodukter og proteinbarer", icon: "💪" },
    ]
  },
  gluten: {
    label: "Gluten / Hvede",
    intro: "Glutenreaktioner varierer fra mild sensitivitet til svær cøliaki. Din præcisering hjælper os med at filtrere korrekt.",
    options: [
      { id: "gluten_coeliaki",   label: "Cøliaki",                    desc: "Autoimmun reaktion — ingen spor tolereres", icon: "🚫" },
      { id: "gluten_allergi",    label: "Hvedeallergi",                desc: "Allergi specifikt mod hvede — rug og byg muligvis ok", icon: "🌾" },
      { id: "gluten_sensitiv",   label: "Glutensensitivitet",          desc: "Ikke-cøliaki — spormængder kan tolereres", icon: "⚠️" },
      { id: "gluten_alle",       label: "Alt med gluten",              desc: "Undgår alt gluten inkl. spor — strengest", icon: "❌" },
    ]
  },
  noedder: {
    label: "Nødder",
    intro: "Mange er kun allergiske over for specifikke nødder. Præciser hvilke for bedre filtrering.",
    options: [
      { id: "noedder_alle",      label: "Alle nødder",                desc: "Undgår samtlige nøddetyper — strengest", icon: "🥜" },
      { id: "noedder_hassel",    label: "Hasselnødder",               desc: "Specifikt hasselnød (pollenallergi)", icon: "🌰" },
      { id: "noedder_mandel",    label: "Mandler",                    desc: "Specifikt mandel", icon: "🫘" },
      { id: "noedder_valnoed",   label: "Valnødder",                  desc: "Specifikt valnød", icon: "🌰" },
      { id: "noedder_cashew",    label: "Cashew & Pistacie",          desc: "Anacardiaceae-familien", icon: "🫘" },
      { id: "noedder_kokos",     label: "Kokos",                      desc: "Botanisk frugt — ikke altid inkluderet i nødder", icon: "🥥" },
    ]
  },
  aeg: {
    label: "Æg",
    intro: "Ægallergi kan være mod hvide, blomme eller begge. Mange tåler velbagt æg.",
    options: [
      { id: "aeg_alle",          label: "Alle æggeprodukter",         desc: "Undgår alt — inkl. spor i bagværk", icon: "🥚" },
      { id: "aeg_hvid",          label: "Kun æggehvide",              desc: "Tåler æggeblomme", icon: "⚪" },
      { id: "aeg_bagt",          label: "Rå/let tilberedt",           desc: "Tåler velbagt æg (f.eks. i kager)", icon: "🎂" },
    ]
  },
  fisk: {
    label: "Fisk",
    intro: "Fiskeallergier er ofte artspecifikke. Præciser hvilken type.",
    options: [
      { id: "fisk_alle",         label: "Alle fisk",                  desc: "Undgår alle fiskearter — strengest", icon: "🐟" },
      { id: "fisk_hvid",         label: "Hvidfisk",                   desc: "Torsk, sej, kuller, pighvar", icon: "🐠" },
      { id: "fisk_fed",          label: "Fed fisk",                   desc: "Laks, makrel, sild, ørred", icon: "🍣" },
      { id: "fisk_skjult",       label: "Skjulte kilder",             desc: "Worcestershiresauce, ansjoser, fiskeextrakt", icon: "⚠️" },
    ]
  },
  soja: {
    label: "Soja",
    intro: "Sojaprotein og sojalecithin reagerer forskelligt. Mange tåler sojalecithin.",
    options: [
      { id: "soja_alle",         label: "Al soja",                    desc: "Undgår alt fra soja inkl. lecithin", icon: "🫘" },
      { id: "soja_protein",      label: "Sojaprotein",                desc: "Tåler sojalecithin (E322) — brugt i chokolade", icon: "🍫" },
      { id: "soja_lecitin",      label: "Sojalecithin (E322)",        desc: "Specifikt sojalecithin som tilsætningsstof", icon: "⚗️" },
    ]
  },
  skaldyr: {
    label: "Skaldyr",
    intro: "Krebsdyr og bløddyr er forskellige allergener. Mange reagerer kun på det ene.",
    options: [
      { id: "skaldyr_alle",      label: "Alle skaldyr",               desc: "Undgår krebsdyr, muslinger og bløddyr", icon: "🦐" },
      { id: "skaldyr_krebs",     label: "Krebsdyr",                   desc: "Rejer, krabbe, hummer, languster", icon: "🦞" },
      { id: "skaldyr_bloeddyr",  label: "Bløddyr / Muslinger",        desc: "Muslinger, østers, blæksprutte", icon: "🦑" },
    ]
  },
  sesam: {
    label: "Sesam",
    intro: "Sesam kan skjule sig under mange navne på etiketter.",
    options: [
      { id: "sesam_alle",        label: "Al sesam",                   desc: "Inkl. tahini, sesamolie og sesammel", icon: "🌱" },
      { id: "sesam_froe",        label: "Sesamfrø",                   desc: "Primært hele eller knuste frø", icon: "·" },
      { id: "sesam_olie",        label: "Sesamolie",                  desc: "Koldpresset — mest allergen. Raffineret muligvis ok", icon: "🫗" },
    ]
  },
};

const ALLERGENS = [
  { id:"gluten",      label:"Gluten",         emoji:"🌾" },
  { id:"laktose",     label:"Laktose / Mælk", emoji:"🥛" },
  { id:"aeg",         label:"Æg",             emoji:"🥚" },
  { id:"noedder",     label:"Nødder",         emoji:"🌰" },
  { id:"jordnoedder", label:"Jordnødder",     emoji:"🥜" },
  { id:"soja",        label:"Soja",           emoji:"🫘" },
  { id:"fisk",        label:"Fisk",           emoji:"🐟" },
  { id:"skaldyr",     label:"Skaldyr",        emoji:"🦐" },
  { id:"selleri",     label:"Selleri",        emoji:"🥬" },
  { id:"sennep",      label:"Sennep",         emoji:"🌶️" },
  { id:"sesam",       label:"Sesam",          emoji:"🌿" },
  { id:"svovl",       label:"Sulfitter",      emoji:"🍷" },
  { id:"lupin",       label:"Lupin",          emoji:"🌸" },
  { id:"bloeddyr",    label:"Bløddyr",        emoji:"🦑" },
];

const DEMO_CODES = [
  { code:"3017620422003", label:"Nutella" },
  { code:"5449000054227", label:"Coca-Cola" },
  { code:"7394376616566", label:"Oatly" },
  { code:"5701029015306", label:"Lurpak" },
];

const SCREENS = {
  WELCOME:"welcome", LOGIN:"login", ONBOARD:"onboard",
  HOME:"home", SEARCH:"search",
  LIST:"list", PROFILE:"profile", FAMILY:"family",
  RESULT:"result", HISTORY:"history",
  NOTFOUND:"notfound", SUBMITTED:"submitted",
  ADMIN:"admin", FAVORITES:"favorites",
  MADPAS:"madpas", RECIPES:"recipes", EDITPROFILE:"editprofile", SUGGEST_EDIT:"suggest_edit",
};

const PAGE_IDS = {
  welcome:"SCR-01", login:"SCR-02", onboard:"SCR-03",
  home:"SCR-04", search:"SCR-06",
  list:"SCR-07", profile:"SCR-08", family:"SCR-09",
  result:"SCR-10", history:"SCR-11", notfound:"SCR-12",
  submitted:"SCR-13", admin:"SCR-14", favorites:"SCR-15",
  madpas:"SCR-16", recipes:"SCR-17", editprofile:"SCR-18",
};

const DUMMY_PRODUCT = {
  code: "3017620422003",
  ean: "3017620422003",
  name: "Nutella",
  brand: "Ferrero",
  image_url: "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.820.400.jpg",
  category: "Chokolade",
  status: "danger",
  headline: "Indeholder allergen",
  summary: "Produktet indeholder Laktose, Nødder.",
  source: "open_food_facts",
  verified_status: "unverified",
  hasUnknown: false,
  matchedDanger: ["laktose", "noedder"],
  matchedWarning: ["soja"],
  familyImpact: [],
  allergen_flags: {
    gluten: "no", laktose: "yes", aeg: "no",
    noedder: "yes", jordnoedder: "no", soja: "traces",
    fisk: "no", skaldyr: "no", selleri: "no",
    sennep: "no", sesam: "no", svovl: "no",
    lupin: "no", bloeddyr: "no",
  },
  ingredients: "Sucre, huile de palme, NOISETTES 13%, cacao maigre 7,4%, LAIT écrémé en poudre 6,6%, LACTOSERUM en poudre, émulsifiants: lécithines (SOJA), vanilline.",
  tags: ["vegetarian"],
  nutrition: {
    energy_kcal: 539,
    fat: 30.9,
    saturated_fat: 10.6,
    carbohydrates: 57.5,
    sugars: 56.3,
    fiber: 3.4,
    protein: 6.3,
    salt: 0.11,
  },
  flags: [
    { type:"bad", text:"Indeholder Laktose" },
    { type:"bad", text:"Indeholder Nødder" },
    { type:"maybe", text:"Kan indeholde spor af Soja" },
  ],
  timestamp: Date.now(),
};

// Mock produkter med fuld data til test
const MOCK_PRODUCTS = [
  {
    id: "mock-1", ean: "5701029015306", name: "Lurpak Smør", brand: "Lurpak",
    category: "Mejeri", verified_status: "verified", source: "verified",
    image_url: null,
    allergen_flags: { gluten:"no", laktose:"yes", aeg:"no", noedder:"no", jordnoedder:"no", soja:"no", fisk:"no", skaldyr:"no", selleri:"no", sennep:"no", sesam:"no", svovl:"no", lupin:"no", bloeddyr:"no" },
    ingredients: "Pasteuriseret fløde (mælk), salt.",
    nutrition: { energy_kcal:717, fat:80, saturated_fat:52, carbohydrates:0.6, sugars:0.6, fiber:0, protein:0.6, salt:1.5 },
    tags: ["vegetarian"],
  },
  {
    id: "mock-2", ean: "5000112546415", name: "Coca-Cola Original", brand: "Coca-Cola",
    category: "Drikkevarer", verified_status: "verified", source: "verified",
    image_url: null,
    allergen_flags: { gluten:"no", laktose:"no", aeg:"no", noedder:"no", jordnoedder:"no", soja:"no", fisk:"no", skaldyr:"no", selleri:"no", sennep:"no", sesam:"no", svovl:"no", lupin:"no", bloeddyr:"no" },
    ingredients: "Vand, sukker, kuldioxid, farve (E150d), surheds regulerende middel (E338), naturlige aromaer inkl. koffein.",
    nutrition: { energy_kcal:42, fat:0, saturated_fat:0, carbohydrates:10.6, sugars:10.6, fiber:0, protein:0, salt:0 },
    tags: ["vegan", "vegetarian"],
  },
  {
    id: "mock-3", ean: "7394376616566", name: "Oatly Havredrik", brand: "Oatly",
    category: "Plantebaseret", verified_status: "verified", source: "verified",
    image_url: null,
    allergen_flags: { gluten:"traces", laktose:"no", aeg:"no", noedder:"no", jordnoedder:"no", soja:"no", fisk:"no", skaldyr:"no", selleri:"no", sennep:"no", sesam:"no", svovl:"no", lupin:"no", bloeddyr:"no" },
    ingredients: "Vand, havre 10%, rapsolie, calcium, vitaminer (D2, riboflavin, B12), salt.",
    nutrition: { energy_kcal:46, fat:1.5, saturated_fat:0.2, carbohydrates:6.7, sugars:4, fiber:0.8, protein:1, salt:0.07 },
    tags: ["vegan", "vegetarian"],
  },
];


const ALLERGEN_EXAMPLES = {
  gluten: {
    products: { da:["Brød","Pasta","Øl","Sojasauce"], en:["Bread","Pasta","Beer","Soy sauce"], de:["Brot","Pasta","Bier","Sojasoße"], fr:["Pain","Pâtes","Bière","Sauce soja"], es:["Pan","Pasta","Cerveza","Salsa de soja"], it:["Pane","Pasta","Birra","Salsa di soia"], nl:["Brood","Pasta","Bier","Sojasaus"], pt:["Pão","Massa","Cerveja","Molho de soja"], pl:["Chleb","Makaron","Piwo","Sos sojowy"], sv:["Bröd","Pasta","Öl","Sojasås"], no:["Brød","Pasta","Øl","Soyasaus"], ja:["パン","パスタ","ビール","醤油"], zh:["面包","面食","啤酒","酱油"], ar:["خبز","معكرونة","بيرة","صلصة الصويا"], tr:["Ekmek","Makarna","Bira","Soya sosu"], th:["ขนมปัง","พาสต้า","เบียร์","ซีอิ้ว"], el:["Ψωμί","Ζυμαρικά","Μπύρα","Σάλτσα σόγιας"] },
    ingredients: { da:["Hvede","Rug","Byg","Havre","Spelt"], en:["Wheat","Rye","Barley","Oats","Spelt"], de:["Weizen","Roggen","Gerste","Hafer","Dinkel"], fr:["Blé","Seigle","Orge","Avoine","Épeautre"], es:["Trigo","Centeno","Cebada","Avena","Espelta"], it:["Frumento","Segale","Orzo","Avena","Farro"], nl:["Tarwe","Rogge","Gerst","Haver","Spelt"], pt:["Trigo","Centeio","Cevada","Aveia","Espelta"], pl:["Pszenica","Żyto","Jęczmień","Owies","Orkisz"], sv:["Vete","Råg","Korn","Havre","Dinkel"], no:["Hvete","Rug","Bygg","Havre","Spelt"], ja:["小麦","ライ麦","大麦","燕麦","スペルト"], zh:["小麦","黑麦","大麦","燕麦","斯佩尔特"], ar:["قمح","جاودار","شعير","شوفان","كاموت"], tr:["Buğday","Çavdar","Arpa","Yulaf","Kavılca"], th:["ข้าวสาลี","ข้าวไรย์","ข้าวบาร์เลย์","ข้าวโอ๊ต"], el:["Σιτάρι","Σίκαλη","Κριθάρι","Βρώμη","Ζέα"] },
  },
  laktose: {
    products: { da:["Mælk","Ost","Smør","Is","Yoghurt"], en:["Milk","Cheese","Butter","Ice cream","Yoghurt"], de:["Milch","Käse","Butter","Eis","Joghurt"], fr:["Lait","Fromage","Beurre","Glace","Yaourt"], es:["Leche","Queso","Mantequilla","Helado","Yogur"], it:["Latte","Formaggio","Burro","Gelato","Yogurt"], nl:["Melk","Kaas","Boter","Ijs","Yoghurt"], pt:["Leite","Queijo","Manteiga","Gelado","Iogurte"], pl:["Mleko","Ser","Masło","Lody","Jogurt"], sv:["Mjölk","Ost","Smör","Glass","Yoghurt"], no:["Melk","Ost","Smør","Is","Yoghurt"], ja:["牛乳","チーズ","バター","アイスクリーム","ヨーグルト"], zh:["牛奶","奶酪","黄油","冰淇淋","酸奶"], ar:["حليب","جبن","زبدة","آيس كريم","زبادي"], tr:["Süt","Peynir","Tereyağı","Dondurma","Yoğurt"], th:["นม","ชีส","เนย","ไอศกรีม","โยเกิร์ต"], el:["Γάλα","Τυρί","Βούτυρο","Παγωτό","Γιαούρτι"] },
    ingredients: { da:["Laktose","Valle","Kasein","Fløde","Skummetmælk"], en:["Lactose","Whey","Casein","Cream","Skimmed milk"], de:["Laktose","Molke","Kasein","Sahne","Magermilch"], fr:["Lactose","Lactosérum","Caséine","Crème","Lait écrémé"], es:["Lactosa","Suero","Caseína","Nata","Leche desnatada"], it:["Lattosio","Siero","Caseina","Panna","Latte scremato"], nl:["Lactose","Wei","Caseïne","Room","Magere melk"], pt:["Lactose","Soro","Caseína","Natas","Leite desnatado"], pl:["Laktoza","Serwatka","Kazeina","Śmietana","Mleko odtłuszczone"], sv:["Laktos","Vassle","Kasein","Grädde","Skummjölk"], no:["Laktose","Myse","Kasein","Fløte","Skummet melk"], ja:["乳糖","乳清","カゼイン","クリーム","脱脂乳"], zh:["乳糖","乳清","酪蛋白","奶油","脱脂奶"], ar:["لاكتوز","مصل اللبن","كازين","كريمة","حليب خالي الدسم"], tr:["Laktoz","Peynir altı suyu","Kazein","Krema","Yağsız süt"], th:["แลคโตส","เวย์","เคซีน","ครีม","นมพร่องมันเนย"], el:["Λακτόζη","Ορός γάλακτος","Καζεΐνη","Κρέμα","Αποβουτυρωμένο γάλα"] },
  },
  aeg: {
    products: { da:["Mayonnaise","Pasta","Kage","Aioli","Vafler"], en:["Mayonnaise","Pasta","Cake","Aioli","Waffles"], de:["Mayonnaise","Pasta","Kuchen","Aioli","Waffeln"], fr:["Mayonnaise","Pâtes","Gâteau","Aïoli","Gaufres"], es:["Mayonesa","Pasta","Tarta","Alioli","Gofres"], it:["Maionese","Pasta","Torta","Aioli","Cialde"], nl:["Mayonaise","Pasta","Cake","Aioli","Wafels"], pt:["Maionese","Massa","Bolo","Aioli","Waffles"], pl:["Majonez","Makaron","Ciasto","Aioli","Gofry"], sv:["Majonnäs","Pasta","Kaka","Aioli","Våfflor"], no:["Majones","Pasta","Kake","Aioli","Vafler"], ja:["マヨネーズ","パスタ","ケーキ","アイオリ","ワッフル"], zh:["蛋黄酱","面食","蛋糕","蒜泥蛋黄酱","华夫饼"], ar:["مايونيز","معكرونة","كعكة","أيولي","وافل"], tr:["Mayonez","Makarna","Kek","Aioli","Waffle"], th:["มายองเนส","พาสต้า","เค้ก","ไอโอลี่","วาฟเฟิล"], el:["Μαγιονέζα","Ζυμαρικά","Κέικ","Αϊολί","Βάφλες"] },
    ingredients: { da:["Æg","Æggehvide","Æggeblomme","Tørret æg"], en:["Egg","Egg white","Egg yolk","Dried egg"], de:["Ei","Eiweiß","Eigelb","Trockenei"], fr:["Œuf","Blanc d'œuf","Jaune d'œuf","Œuf en poudre"], es:["Huevo","Clara de huevo","Yema","Huevo en polvo"], it:["Uovo","Albume","Tuorlo","Uovo essiccato"], nl:["Ei","Eiwit","Eigeel","Gedroogd ei"], pt:["Ovo","Clara","Gema","Ovo em pó"], pl:["Jajo","Białko jaja","Żółtko","Jajo suszone"], sv:["Ägg","Äggvita","Äggula","Torkat ägg"], no:["Egg","Eggehvite","Eggeplomme","Tørket egg"], ja:["卵","卵白","卵黄","乾燥卵"], zh:["鸡蛋","蛋清","蛋黄","干燥蛋"], ar:["بيض","بياض البيض","صفار البيض","بيض مجفف"], tr:["Yumurta","Yumurta beyazı","Yumurta sarısı","Kurutulmuş yumurta"], th:["ไข่","ไข่ขาว","ไข่แดง","ไข่แห้ง"], el:["Αυγό","Ασπράδι","Κρόκος","Αποξηραμένο αυγό"] },
  },
  noedder: {
    products: { da:["Pesto","Chokolade","Muesli","Nougat","Marcipan"], en:["Pesto","Chocolate","Muesli","Nougat","Marzipan"], de:["Pesto","Schokolade","Müsli","Nougat","Marzipan"], fr:["Pesto","Chocolat","Muesli","Nougat","Massepain"], es:["Pesto","Chocolate","Muesli","Turrón","Mazapán"], it:["Pesto","Cioccolato","Muesli","Torrone","Marzapane"], nl:["Pesto","Chocolade","Muesli","Nougat","Marsepein"], pt:["Pesto","Chocolate","Muesli","Nougat","Maçapão"], pl:["Pesto","Czekolada","Muesli","Nugat","Marcepan"], sv:["Pesto","Choklad","Müsli","Nougat","Marsipan"], no:["Pesto","Sjokolade","Müsli","Nougat","Marsipan"], ja:["ペスト","チョコレート","ミューズリー","ヌガー","マジパン"], zh:["香蒜酱","巧克力","麦片","牛轧糖","杏仁膏"], ar:["بيستو","شوكولاتة","موسلي","نوغا","لوز الحلوى"], tr:["Pesto","Çikolata","Müsli","Nuga","Badem ezmesi"], th:["เพสโต้","ช็อกโกแลต","มูสลี่","นูกัต","มาร์ซิปัน"], el:["Πέστο","Σοκολάτα","Μούσλι","Νουγκά","Μαρτσιπάνι"] },
    ingredients: { da:["Mandler","Hasselnødder","Valnødder","Cashew","Pistacienødder"], en:["Almonds","Hazelnuts","Walnuts","Cashews","Pistachios"], de:["Mandeln","Haselnüsse","Walnüsse","Cashews","Pistazien"], fr:["Amandes","Noisettes","Noix","Noix de cajou","Pistaches"], es:["Almendras","Avellanas","Nueces","Anacardos","Pistachos"], it:["Mandorle","Nocciole","Noci","Anacardi","Pistacchi"], nl:["Amandelen","Hazelnoten","Walnoten","Cashewnoten","Pistachenoten"], pt:["Amêndoas","Avelãs","Nozes","Cajus","Pistáchios"], pl:["Migdały","Orzechy laskowe","Orzechy włoskie","Nerkowce","Pistacje"], sv:["Mandlar","Hasselnötter","Valnötter","Cashewnötter","Pistaschnötter"], no:["Mandler","Hasselnøtter","Valnøtter","Cashewnøtter","Pistasjnøtter"], ja:["アーモンド","ヘーゼルナッツ","クルミ","カシューナッツ","ピスタチオ"], zh:["杏仁","榛子","核桃","腰果","开心果"], ar:["لوز","بندق","جوز","كاجو","فستق"], tr:["Badem","Fındık","Ceviz","Kaju","Antep fıstığı"], th:["อัลมอนด์","เฮเซลนัท","วอลนัท","มะม่วงหิมพานต์","พิสตาชิโอ"], el:["Αμύγδαλα","Φουντούκια","Καρύδια","Κάσιους","Φιστίκια"] },
  },
  jordnoedder: {
    products: { da:["Jordnøddesmør","Satay sauce","Snacks","Cookies"], en:["Peanut butter","Satay sauce","Snacks","Cookies"], de:["Erdnussbutter","Satay-Sauce","Snacks","Kekse"], fr:["Beurre de cacahuète","Sauce satay","Snacks","Cookies"], es:["Mantequilla de cacahuete","Salsa satay","Snacks","Galletas"], it:["Burro di arachidi","Salsa satay","Snack","Biscotti"], nl:["Pindakaas","Satésaus","Snacks","Koekjes"], pt:["Manteiga de amendoim","Molho satay","Snacks","Bolachas"], pl:["Masło orzechowe","Sos satay","Przekąski","Ciastka"], sv:["Jordnötssmör","Sataysås","Snacks","Kakor"], no:["Peanøttsmør","Sataysaus","Snacks","Kjeks"], ja:["ピーナッツバター","サテソース","スナック","クッキー"], zh:["花生酱","沙爹酱","零食","饼干"], ar:["زبدة الفول السوداني","صلصة الساتيه","وجبات خفيفة","بسكويت"], tr:["Fıstık ezmesi","Satay sosu","Atıştırmalık","Kurabiye"], th:["เนยถั่ว","ซอสสะเต๊ะ","ขนมขบเคี้ยว","คุกกี้"], el:["Βούτυρο φιστικιών","Σάλτσα σατέ","Σνακ","Μπισκότα"] },
    ingredients: { da:["Jordnødder","Peanuts","Arachis hypogaea"], en:["Peanuts","Groundnuts","Arachis hypogaea"], de:["Erdnüsse","Erdnuss","Arachis hypogaea"], fr:["Arachides","Cacahuètes","Arachis hypogaea"], es:["Cacahuetes","Maníes","Arachis hypogaea"], it:["Arachidi","Noccioline","Arachis hypogaea"], nl:["Pinda's","Grondnoten","Arachis hypogaea"], pt:["Amendoins","Arachis hypogaea"], pl:["Orzeszki ziemne","Orzeszki arachidowe"], sv:["Jordnötter","Arachis hypogaea"], no:["Peanøtter","Jordnøtter","Arachis hypogaea"], ja:["ピーナッツ","落花生","アラキス"], zh:["花生","落花生"], ar:["الفول السوداني","فول سوداني"], tr:["Yerfıstığı","Fıstık"], th:["ถั่วลิสง"], el:["Φιστίκια Αμερικής","Αραχίδες"] },
  },
  soja: {
    products: { da:["Tofu","Soja sauce","Miso","Edamame","Tempeh"], en:["Tofu","Soy sauce","Miso","Edamame","Tempeh"], de:["Tofu","Sojasoße","Miso","Edamame","Tempeh"], fr:["Tofu","Sauce soja","Miso","Edamame","Tempeh"], es:["Tofu","Salsa de soja","Miso","Edamame","Tempeh"], it:["Tofu","Salsa di soia","Miso","Edamame","Tempeh"], nl:["Tofu","Sojasaus","Miso","Edamame","Tempeh"], pt:["Tofu","Molho de soja","Miso","Edamame","Tempeh"], pl:["Tofu","Sos sojowy","Miso","Edamame","Tempeh"], sv:["Tofu","Sojasås","Miso","Edamame","Tempeh"], no:["Tofu","Soyasaus","Miso","Edamame","Tempeh"], ja:["豆腐","醤油","味噌","枝豆","テンペ"], zh:["豆腐","酱油","味噌","毛豆","天贝"], ar:["توفو","صلصة الصويا","ميسو","إيدامامي","تيمبيه"], tr:["Tofu","Soya sosu","Miso","Edamame","Tempeh"], th:["เต้าหู้","ซีอิ้ว","มิโซะ","เอดาแมม","เทมเป้"], el:["Τόφου","Σάλτσα σόγιας","Μίσο","Εντάμαμε","Τέμπε"] },
    ingredients: { da:["Soja","Sojabønner","Sojalecitin","Sojaprotein","E322"], en:["Soy","Soybeans","Soy lecithin","Soy protein","E322"], de:["Soja","Sojabohnen","Sojalecithin","Sojaprotein","E322"], fr:["Soja","Haricots de soja","Lécithine de soja","Protéine de soja","E322"], es:["Soja","Habas de soja","Lecitina de soja","Proteína de soja","E322"], it:["Soia","Semi di soia","Lecitina di soia","Proteina di soia","E322"], nl:["Soja","Sojabone","Sojalecithine","Sojaprotein","E322"], pt:["Soja","Feijão de soja","Lecitina de soja","Proteína de soja","E322"], pl:["Soja","Sojowe","Lecytyna sojowa","Białko sojowe","E322"], sv:["Soja","Sojabönor","Sojalecithin","Sojaprotein","E322"], no:["Soya","Soyabønner","Sojalesitin","Sojaprotein","E322"], ja:["大豆","大豆レシチン","大豆タンパク","E322"], zh:["大豆","大豆卵磷脂","大豆蛋白","E322"], ar:["الصويا","فول الصويا","ليسيثين الصويا","E322"], tr:["Soya","Soya fasulyesi","Soya lesitini","E322"], th:["ถั่วเหลือง","เลซิตินถั่วเหลือง","E322"], el:["Σόγια","Σογιόλεκιθίνη","E322"] },
  },
  fisk: {
    products: { da:["Fiskesauce","Worcestershire","Caesar dressing","Ansjosdip"], en:["Fish sauce","Worcestershire sauce","Caesar dressing","Anchovy paste"], de:["Fischsauce","Worcestershiresauce","Caesar-Dressing","Sardellenpaste"], fr:["Sauce de poisson","Sauce Worcestershire","Vinaigrette César","Pâte d'anchois"], es:["Salsa de pescado","Salsa Worcestershire","Aderezo César","Pasta de anchoa"], it:["Salsa di pesce","Salsa Worcestershire","Condimento Caesar","Pasta di acciughe"], nl:["Vissaus","Worcestershiresaus","Caesar dressing","Ansjovispasta"], pt:["Molho de peixe","Molho Worcestershire","Molho César","Pasta de anchova"], pl:["Sos rybny","Sos worcestershire","Sos cezar","Pasta z anchois"], sv:["Fisksås","Worcestershiresås","Caesardressing","Ansjovisröra"], no:["Fiskesaus","Worcestershiresaus","Caesardressing","Ansjosvispasta"], ja:["ナンプラー","ウスターソース","シーザードレッシング","アンチョビ"], zh:["鱼露","伍斯特酱","凯撒沙拉酱","凤尾鱼酱"], ar:["صلصة السمك","صلصة وورشيسترشير","تتبيلة سيزر","معجون الأنشوجة"], tr:["Balık sosu","Worcestershire sosu","Sezar sosu","Hamsi ezmesi"], th:["น้ำปลา","ซอสวูสเตอร์","ซีซาร์เดรสซิ่ง","แอนโชวี่เพสต์"], el:["Σάλτσα ψαριού","Σάλτσα Worcestershire","Σάλτσα Καίσαρα","Πάστα αντζούγιας"] },
    ingredients: { da:["Ansjos","Laks","Tun","Makrel","Sardiner"], en:["Anchovy","Salmon","Tuna","Mackerel","Sardines"], de:["Sardellen","Lachs","Thunfisch","Makrele","Sardinen"], fr:["Anchois","Saumon","Thon","Maquereau","Sardines"], es:["Anchoas","Salmón","Atún","Caballa","Sardinas"], it:["Acciughe","Salmone","Tonno","Sgombro","Sardine"], nl:["Ansjovis","Zalm","Tonijn","Makreel","Sardines"], pt:["Anchova","Salmão","Atum","Cavala","Sardinha"], pl:["Anchois","Łosoś","Tuńczyk","Makrela","Sardynki"], sv:["Ansjovis","Lax","Tonfisk","Makrill","Sardiner"], no:["Ansjos","Laks","Tunfisk","Makrell","Sardiner"], ja:["アンチョビ","鮭","マグロ","サバ","イワシ"], zh:["凤尾鱼","三文鱼","金枪鱼","鲭鱼","沙丁鱼"], ar:["أنشوجة","سلمون","تونة","ماكريل","سردين"], tr:["Hamsi","Somon","Ton balığı","Uskumru","Sardalya"], th:["แอนโชวี่","แซลมอน","ทูน่า","ปลาแมคเคอเรล","ปลาซาร์ดีน"], el:["Αντζούγιες","Σολομός","Τόνος","Σκουμπρί","Σαρδέλες"] },
  },
  skaldyr: {
    products: { da:["Paella","Bisque","Sushi","Fiskesuppe","Bouillabaisse"], en:["Paella","Bisque","Sushi","Fish soup","Bouillabaisse"], de:["Paella","Bisque","Sushi","Fischsuppe","Bouillabaisse"], fr:["Paella","Bisque","Sushi","Soupe de poisson","Bouillabaisse"], es:["Paella","Bisque","Sushi","Sopa de pescado","Bouillabaisse"], it:["Paella","Bisque","Sushi","Zuppa di pesce","Bouillabaisse"], nl:["Paella","Bisque","Sushi","Vissoep","Bouillabaisse"], pt:["Paella","Bisque","Sushi","Sopa de peixe","Bouillabaisse"], pl:["Paella","Bisque","Sushi","Zupa rybna","Bouillabaisse"], sv:["Paella","Bisque","Sushi","Fisksoppa","Bouillabaisse"], no:["Paella","Bisque","Sushi","Fiskesuppe","Bouillabaisse"], ja:["パエリア","ビスク","寿司","魚スープ","ブイヤベース"], zh:["海鲜饭","浓汤","寿司","鱼汤","马赛鱼汤"], ar:["باييلا","شوربة كريمة","سوشي","شوربة سمك","بويابيس"], tr:["Paella","Bisque","Sushi","Balık çorbası","Bouillabaisse"], th:["ปาเอย่า","บิสก์","ซูชิ","ซุปปลา","บูยาแบส"], el:["Παέλα","Μπισκ","Σούσι","Ψαρόσουπα","Μπουγιαμπέσα"] },
    ingredients: { da:["Rejer","Krabbe","Hummer","Muslinger","Østers"], en:["Shrimp","Crab","Lobster","Mussels","Oysters"], de:["Garnelen","Krabbe","Hummer","Muscheln","Austern"], fr:["Crevettes","Crabe","Homard","Moules","Huîtres"], es:["Gambas","Cangrejo","Langosta","Mejillones","Ostras"], it:["Gamberi","Granchio","Aragosta","Cozze","Ostriche"], nl:["Garnalen","Krab","Kreeft","Mosselen","Oesters"], pt:["Camarão","Caranguejo","Lagosta","Mexilhões","Ostras"], pl:["Krewetki","Krab","Homar","Małże","Ostrygi"], sv:["Räkor","Krabba","Hummer","Musslor","Ostron"], no:["Reker","Krabbe","Hummer","Muslinger","Østers"], ja:["エビ","カニ","ロブスター","ムール貝","カキ"], zh:["虾","蟹","龙虾","贻贝","牡蛎"], ar:["روبيان","سرطان البحر","جراد البحر","بلح البحر","محار"], tr:["Karides","Yengeç","Istakoz","Midye","İstiridye"], th:["กุ้ง","ปู","กุ้งมังกร","หอยแมลงภู่","หอยนางรม"], el:["Γαρίδες","Καβούρι","Αστακός","Μύδια","Στρείδια"] },
  },
  selleri: {
    products: { da:["Bouillon","Suppe","Krydderisalt","Salat","Remoulade"], en:["Stock","Soup","Seasoning salt","Salad","Remoulade"], de:["Brühe","Suppe","Würzsalz","Salat","Remoulade"], fr:["Bouillon","Soupe","Sel aromatisé","Salade","Rémoulade"], es:["Caldo","Sopa","Sal condimentada","Ensalada","Rémoulade"], it:["Brodo","Zuppa","Sale aromatizzato","Insalata","Remoulade"], nl:["Bouillon","Soep","Kruidenzout","Salade","Remoulade"], pt:["Caldo","Sopa","Sal temperado","Salada","Remoulade"], pl:["Bulion","Zupa","Sól przyprawowa","Sałatka","Remoulada"], sv:["Buljong","Soppa","Kryddsalt","Sallad","Remoulade"], no:["Buljong","Suppe","Kryddersalt","Salat","Remoulade"], ja:["ブイヨン","スープ","シーズニングソルト","サラダ","レムラード"], zh:["高汤","汤","调味盐","沙拉","雷穆拉达酱"], ar:["مرق","شوربة","ملح متبل","سلطة","ريمولاد"], tr:["Et suyu","Çorba","Baharlı tuz","Salata","Remulad"], th:["น้ำซุป","ซุป","เกลือปรุงรส","สลัด","เรมูลาด"], el:["Ζωμός","Σούπα","Αλάτι με μπαχαρικά","Σαλάτα","Ρεμουλάντ"] },
    ingredients: { da:["Selleri","Sellerisalt","Sellerifnug","Sellerifrø"], en:["Celery","Celery salt","Celery flakes","Celery seeds"], de:["Sellerie","Selleriesalz","Selerieflocken","Selleriesamen"], fr:["Céleri","Sel de céleri","Flocons de céleri","Graines de céleri"], es:["Apio","Sal de apio","Copos de apio","Semillas de apio"], it:["Sedano","Sale di sedano","Fiocchi di sedano","Semi di sedano"], nl:["Selderij","Selderijzout","Selderijvlokken","Selderijzaad"], pt:["Aipo","Sal de aipo","Flocos de aipo","Sementes de aipo"], pl:["Seler","Sól selerowa","Płatki selera","Nasiona selera"], sv:["Selleri","Sellerisalt","Selleriflingor","Selleriefrön"], no:["Selleri","Sellerisalt","Sellerifnugg","Sellerifrø"], ja:["セロリ","セロリソルト","セロリフレーク","セロリシード"], zh:["芹菜","芹菜盐","芹菜片","芹菜籽"], ar:["كرفس","ملح الكرفس","رقائق الكرفس","بذور الكرفس"], tr:["Kereviz","Kereviz tuzu","Kereviz pul","Kereviz tohumu"], th:["คื่นฉ่าย","เกลือคื่นฉ่าย","คื่นฉ่ายแห้ง","เมล็ดคื่นฉ่าย"], el:["Σέλινο","Αλάτι σέλινου","Νιφάδες σέλινου","Σπόροι σέλινου"] },
  },
  sennep: {
    products: { da:["Sennep","Dressing","Marinade","Curry","Pickles"], en:["Mustard","Dressing","Marinade","Curry","Pickles"], de:["Senf","Dressing","Marinade","Curry","Gewürzgurken"], fr:["Moutarde","Vinaigrette","Marinade","Curry","Cornichons"], es:["Mostaza","Aderezo","Marinada","Curry","Pepinillos"], it:["Senape","Condimento","Marinata","Curry","Sottaceti"], nl:["Mosterd","Dressing","Marinade","Curry","Augurken"], pt:["Mostarda","Molho","Marinada","Caril","Pickles"], pl:["Musztarda","Dressing","Marynata","Curry","Ogórki konserwowe"], sv:["Senap","Dressing","Marinad","Curry","Pickles"], no:["Sennep","Dressing","Marinade","Karri","Pickles"], ja:["マスタード","ドレッシング","マリネ","カレー","ピクルス"], zh:["芥末","沙拉酱","腌料","咖喱","泡菜"], ar:["خردل","صلصة السلطة","تتبيلة","كاري","مخللات"], tr:["Hardal","Sos","Turşu sosu","Köri","Turşu"], th:["มัสตาร์ด","น้ำสลัด","น้ำหมัก","แกงกะหรี่","ดองผัก"], el:["Μουστάρδα","Σαλτσάκι","Μαρινάδα","Κάρυ","Πίκλες"] },
    ingredients: { da:["Sennepsfrø","Sennepsmel","Sennepsolie","Sennepspulver"], en:["Mustard seeds","Mustard flour","Mustard oil","Mustard powder"], de:["Senfkörner","Senfmehl","Senföl","Senfpulver"], fr:["Graines de moutarde","Farine de moutarde","Huile de moutarde","Poudre de moutarde"], es:["Semillas de mostaza","Harina de mostaza","Aceite de mostaza","Polvo de mostaza"], it:["Semi di senape","Farina di senape","Olio di senape","Polvere di senape"], nl:["Mosterdzaad","Mosterdmeel","Mosterdie","Mosterdpoeder"], pt:["Sementes de mostarda","Farinha de mostarda","Óleo de mostarda","Pó de mostarda"], pl:["Nasiona gorczycy","Mąka gorczycowa","Olej gorczycowy","Proszek gorczycowy"], sv:["Senapsfrön","Senapsmjöl","Senapsolja","Senapspulver"], no:["Sennepsfrø","Sennepsmel","Sennepsolje","Sennepspulver"], ja:["マスタードシード","マスタードフラワー","マスタードオイル","マスタードパウダー"], zh:["芥末籽","芥末粉","芥末油","芥末粉末"], ar:["بذور الخردل","دقيق الخردل","زيت الخردل","مسحوق الخردل"], tr:["Hardal tohumu","Hardal unu","Hardal yağı","Hardal tozu"], th:["เมล็ดมัสตาร์ด","แป้งมัสตาร์ด","น้ำมันมัสตาร์ด","ผงมัสตาร์ด"], el:["Σπόροι μουστάρδας","Αλεύρι μουστάρδας","Λάδι μουστάρδας","Σκόνη μουστάρδας"] },
  },
  sesam: {
    products: { da:["Hummus","Tahini","Bagels","Sushi","Halvah"], en:["Hummus","Tahini","Bagels","Sushi","Halvah"], de:["Hummus","Tahini","Bagels","Sushi","Halva"], fr:["Houmous","Tahiné","Bagels","Sushi","Halva"], es:["Hummus","Tahini","Bagels","Sushi","Halva"], it:["Hummus","Tahini","Bagel","Sushi","Halva"], nl:["Hummus","Tahini","Bagels","Sushi","Halva"], pt:["Hummus","Tahini","Bagels","Sushi","Halva"], pl:["Hummus","Tahini","Bagele","Sushi","Chałwa"], sv:["Hummus","Tahini","Bagels","Sushi","Halva"], no:["Hummus","Tahini","Bagels","Sushi","Halva"], ja:["フムス","タヒニ","ベーグル","寿司","ハルヴァ"], zh:["鹰嘴豆泥","芝麻酱","百吉饼","寿司","哈尔瓦"], ar:["حمص","طحينة","بيغل","سوشي","حلاوة طحينية"], tr:["Humus","Tahin","Bagel","Sushi","Helva"], th:["ฮัมมัส","ทาฮีนี","เบเกิล","ซูชิ","ฮาลวา"], el:["Χούμους","Ταχίνι","Μπέιγκελ","Σούσι","Χαλβάς"] },
    ingredients: { da:["Sesam","Sesamfrø","Tahini","Sesamolie","Sesammel"], en:["Sesame","Sesame seeds","Tahini","Sesame oil","Sesame flour"], de:["Sesam","Sesamsamen","Tahini","Sesamöl","Sesammehl"], fr:["Sésame","Graines de sésame","Tahiné","Huile de sésame","Farine de sésame"], es:["Sésamo","Semillas de sésamo","Tahini","Aceite de sésamo","Harina de sésamo"], it:["Sesamo","Semi di sesamo","Tahini","Olio di sesamo","Farina di sesamo"], nl:["Sesam","Sesamzaad","Tahini","Sesamolie","Sesambloem"], pt:["Sésamo","Sementes de sésamo","Tahini","Óleo de sésamo","Farinha de sésamo"], pl:["Sezam","Ziarna sezamu","Tahini","Olej sezamowy","Mąka sezamowa"], sv:["Sesam","Sesamfrön","Tahini","Sesamolja","Sesammjöl"], no:["Sesam","Sesamfrø","Tahini","Sesamolje","Sesammel"], ja:["ゴマ","ゴマの種","タヒニ","ゴマ油","ゴマ粉"], zh:["芝麻","芝麻籽","芝麻酱","芝麻油","芝麻粉"], ar:["سمسم","بذور السمسم","طحينة","زيت السمسم","دقيق السمسم"], tr:["Susam","Susam tohumu","Tahin","Susam yağı","Susam unu"], th:["งา","เมล็ดงา","ทาฮีนี","น้ำมันงา","แป้งงา"], el:["Σουσάμι","Σπόροι σουσαμιού","Ταχίνι","Λάδι σουσαμιού","Αλεύρι σουσαμιού"] },
  },
  svovl: {
    products: { da:["Vin","Tørrede frugter","Konserves","Eddike","Syltetøj"], en:["Wine","Dried fruits","Preserves","Vinegar","Jam"], de:["Wein","Trockenfrüchte","Konserven","Essig","Marmelade"], fr:["Vin","Fruits secs","Conserves","Vinaigre","Confiture"], es:["Vino","Frutas secas","Conservas","Vinagre","Mermelada"], it:["Vino","Frutta secca","Conserve","Aceto","Marmellata"], nl:["Wijn","Gedroogd fruit","Conserven","Azijn","Jam"], pt:["Vinho","Frutas secas","Conservas","Vinagre","Compota"], pl:["Wino","Suszone owoce","Przetwory","Ocet","Dżem"], sv:["Vin","Torkad frukt","Konserver","Vinäger","Sylt"], no:["Vin","Tørket frukt","Hermetikk","Eddik","Syltetøy"], ja:["ワイン","ドライフルーツ","保存食","酢","ジャム"], zh:["葡萄酒","干果","罐头","醋","果酱"], ar:["نبيذ","فاكهة مجففة","معلبات","خل","مربى"], tr:["Şarap","Kurutulmuş meyve","Konserveler","Sirke","Reçel"], th:["ไวน์","ผลไม้แห้ง","อาหารกระป๋อง","น้ำส้มสายชู","แยม"], el:["Κρασί","Αποξηραμένα φρούτα","Κονσέρβες","Ξύδι","Μαρμελάδα"] },
    ingredients: { da:["E220","E221","E222","Sulfitter","SO₂","Svovldioxid"], en:["E220","E221","E222","Sulphites","SO₂","Sulphur dioxide"], de:["E220","E221","E222","Sulfite","SO₂","Schwefeldioxid"], fr:["E220","E221","E222","Sulfites","SO₂","Dioxyde de soufre"], es:["E220","E221","E222","Sulfitos","SO₂","Dióxido de azufre"], it:["E220","E221","E222","Solfiti","SO₂","Anidride solforosa"], nl:["E220","E221","E222","Sulfieten","SO₂","Zwaveldioxide"], pt:["E220","E221","E222","Sulfitos","SO₂","Dióxido de enxofre"], pl:["E220","E221","E222","Siarczyny","SO₂","Dwutlenek siarki"], sv:["E220","E221","E222","Sulfiter","SO₂","Svaveldioxid"], no:["E220","E221","E222","Sulfitter","SO₂","Svoveldioksid"], ja:["E220","E221","E222","亜硫酸塩","SO₂","二酸化硫黄"], zh:["E220","E221","E222","亚硫酸盐","SO₂","二氧化硫"], ar:["E220","E221","E222","كبريتيت","SO₂","ثاني أكسيد الكبريت"], tr:["E220","E221","E222","Sülfit","SO₂","Kükürt dioksit"], th:["E220","E221","E222","ซัลไฟต์","SO₂","ซัลเฟอร์ไดออกไซด์"], el:["E220","E221","E222","Θειώδη","SO₂","Διοξείδιο του θείου"] },
  },
  lupin: {
    products: { da:["Glutenfri mel","Pasta","Brød","Snacks","Panering"], en:["Gluten-free flour","Pasta","Bread","Snacks","Breading"], de:["Glutenfreies Mehl","Pasta","Brot","Snacks","Panade"], fr:["Farine sans gluten","Pâtes","Pain","Snacks","Chapelure"], es:["Harina sin gluten","Pasta","Pan","Snacks","Rebozado"], it:["Farina senza glutine","Pasta","Pane","Snack","Panatura"], nl:["Glutenvrij meel","Pasta","Brood","Snacks","Paneermeel"], pt:["Farinha sem glúten","Massa","Pão","Snacks","Panado"], pl:["Mąka bezglutenowa","Makaron","Chleb","Przekąski","Panierka"], sv:["Glutenfritt mjöl","Pasta","Bröd","Snacks","Panering"], no:["Glutenfritt mel","Pasta","Brød","Snacks","Panering"], ja:["グルテンフリー小麦粉","パスタ","パン","スナック","パン粉"], zh:["无麸质面粉","面食","面包","零食","面包屑"], ar:["دقيق خالي من الغلوتين","معكرونة","خبز","وجبات خفيفة","فتات الخبز"], tr:["Glutensiz un","Makarna","Ekmek","Atıştırmalık","Ekmek kırıntısı"], th:["แป้งไม่มีกลูเตน","พาสต้า","ขนมปัง","ขนมขบเคี้ยว","เกล็ดขนมปัง"], el:["Αλεύρι χωρίς γλουτένη","Ζυμαρικά","Ψωμί","Σνακ","Πανάδα"] },
    ingredients: { da:["Lupinmel","Lupinfrø","Lupinprotein","Lupinfiber"], en:["Lupin flour","Lupin seeds","Lupin protein","Lupin fibre"], de:["Lupinenmehl","Lupinensamen","Lupinenprotein","Lupinenfaser"], fr:["Farine de lupin","Graines de lupin","Protéine de lupin","Fibre de lupin"], es:["Harina de altramuz","Semillas de altramuz","Proteína de altramuz","Fibra de altramuz"], it:["Farina di lupino","Semi di lupino","Proteina di lupino","Fibra di lupino"], nl:["Lupinebloem","Lupinezaad","Lupineprotein","Lupinevezel"], pt:["Farinha de tremoço","Sementes de tremoço","Proteína de tremoço","Fibra de tremoço"], pl:["Mąka łubinowa","Nasiona łubinu","Białko łubinu","Błonnik łubinu"], sv:["Lupinmjöl","Lupinfrön","Lupinprotein","Lupinfibrer"], no:["Lupinmel","Lupinfrø","Lupinprotein","Lupinfiber"], ja:["ルピナス粉","ルピナス種子","ルピナスタンパク","ルピナス繊維"], zh:["羽扇豆粉","羽扇豆种子","羽扇豆蛋白","羽扇豆纤维"], ar:["دقيق الترمس","بذور الترمس","بروتين الترمس","ألياف الترمس"], tr:["Lupin unu","Lupin tohumu","Lupin proteini","Lupin lifi"], th:["แป้งลูพิน","เมล็ดลูพิน","โปรตีนลูพิน","ไฟเบอร์ลูพิน"], el:["Αλεύρι λούπινων","Σπόροι λούπινων","Πρωτεΐνη λούπινων","Ίνες λούπινων"] },
  },
  bloeddyr: {
    products: { da:["Paella","Pasta frutti di mare","Sushi","Risotto"], en:["Paella","Seafood pasta","Sushi","Risotto"], de:["Paella","Meeresfrüchtepasta","Sushi","Risotto"], fr:["Paella","Pâtes aux fruits de mer","Sushi","Risotto"], es:["Paella","Pasta con mariscos","Sushi","Risotto"], it:["Paella","Pasta ai frutti di mare","Sushi","Risotto"], nl:["Paella","Zeevruchtenpasta","Sushi","Risotto"], pt:["Paella","Massa com mariscos","Sushi","Risoto"], pl:["Paella","Makaron z owocami morza","Sushi","Risotto"], sv:["Paella","Skaldjurspasta","Sushi","Risotto"], no:["Paella","Sjømatpasta","Sushi","Risotto"], ja:["パエリア","シーフードパスタ","寿司","リゾット"], zh:["海鲜饭","海鲜面食","寿司","意大利烩饭"], ar:["باييلا","معكرونة بحرية","سوشي","ريزوتو"], tr:["Paella","Deniz ürünleri makarnası","Sushi","Risotto"], th:["ปาเอย่า","พาสต้าซีฟู้ด","ซูชิ","ริซอตโต้"], el:["Παέλα","Ζυμαρικά θαλασσινών","Σούσι","Ριζότο"] },
    ingredients: { da:["Blæksprutte","Østers","Muslinger","Snegle","Kammusling"], en:["Squid","Oysters","Mussels","Snails","Scallops"], de:["Tintenfisch","Austern","Muscheln","Schnecken","Jakobsmuscheln"], fr:["Calamar","Huîtres","Moules","Escargots","Coquilles Saint-Jacques"], es:["Calamar","Ostras","Mejillones","Caracoles","Vieiras"], it:["Calamaro","Ostriche","Cozze","Lumache","Capesante"], nl:["Inktvis","Oesters","Mosselen","Slakken","Sint-jakobsschelpen"], pt:["Lula","Ostras","Mexilhões","Caracóis","Vieiras"], pl:["Kałamarnica","Ostrygi","Małże","Ślimaki","Przegrzebki"], sv:["Bläckfisk","Ostron","Musslor","Sniglar","Pilgrimsmusslor"], no:["Blekksprut","Østers","Muslinger","Snegler","Kamskjell"], ja:["イカ","カキ","ムール貝","カタツムリ","ホタテ"], zh:["鱿鱼","牡蛎","贻贝","蜗牛","扇贝"], ar:["حبار","محار","بلح البحر","حلزون","إسقلوب"], tr:["Kalamar","İstiridye","Midye","Salyangoz","Deniz tarağı"], th:["ปลาหมึก","หอยนางรม","หอยแมลงภู่","หอยทาก","หอยเชลล์"], el:["Καλαμάρι","Στρείδια","Μύδια","Σαλιγκάρια","Χτένια"] },
  },
};

const DIETS = [
  { id:"vegan",       label:"Vegansk",       desc:"Ingen animalske produkter" },
  { id:"vegetarian",  label:"Vegetarisk",    desc:"Ingen kød eller fisk" },
  { id:"pescetarian", label:"Pescetarisk",   desc:"Ingen kød, men fisk ok" },
  { id:"gluten-free", label:"Glutenfri",     desc:"Ingen gluten" },
  { id:"keto",        label:"Keto",          desc:"Lavt kulhydratindhold" },
  { id:"paleo",       label:"Paleo",         desc:"Ingen forarbejdede fødevarer" },
];

const AVATAR_COLORS = ["#52b788","#74c69d","#40916c","#b7e4c7","#2d6a4f","#95d5b2","#f4a261","#e76f51"];

const HOME_TIPS = [
  { icon:"warning", title:"Gluten er overalt", text:"Gluten findes ikke kun i brød — det gemmer sig i saucer, supper og krydderier. Scan altid." },
  { icon:"info", title:"Læs altid etiketten", text:"Opskrifter ændres uden varsel. Et produkt du har spist trygt før, kan have nye ingredienser." },
  { icon:"family", title:"Tilføj din familie", text:"Opret profiler for hele familien — så ser du på én gang hvem der kan spise hvad." },
  { icon:"heart", title:"Hjælp fællesskabet", text:"Scan du et ukendt produkt? Indsend det! Databasen vokser med hjælp fra brugere som dig." },
  { icon:"warning", title:"Spor af allergener", text:"'Kan indeholde spor af' er ikke uskadeligt. For stærkt allergiske kan selv spormængder være farlige." },
  { icon:"cart", title:"Planlæg din indkøbsliste", text:"Brug indkøbslisten til at tjekke produkter inden du handler — spar tid i butikken." },
  { icon:"search", title:"Søg inden du handler", text:"Søg på produkter inden du tager i butikken — så ved du hvad du kan købe trygt." },
  { icon:"bulb", title:"Tilføj til hjemskærm", text:"Tilføj EatSafe til din telefons hjemskærm for hurtig adgang — det føles som en rigtig app." },
];

// ─── HJÆLPEFUNKTIONER ────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,9);

// Pæn ingrediensliste — fremhæver allergener med STORE BOGSTAVER
function IngredientsList({ text, allergenFlags = {} }) {
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
function ProfileBadges({ allergenFlags, allergens, customAllerg, family, activeProfiles, size = 22 }) {
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
  const id = PAGE_IDS[screen] || "SCR-??";
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div
      onClick={copy}
      title="Klik for at kopiere side-ID"
      style={{
        position:"fixed", top:8, left:"50%", transform:"translateX(-50%)",
        zIndex:9999,
        fontSize:10, fontWeight:800,
        color: copied ? "#fff" : "#1F2733",
        background: copied ? "#22C55E" : "rgba(255,255,255,0.95)",
        border: copied ? "1.5px solid #22C55E" : "1.5px solid #D0D0C8",
        borderRadius:20, padding:"3px 12px", cursor:"pointer",
        letterSpacing:"1px", fontFamily:"monospace",
        boxShadow:"0 2px 10px rgba(0,0,0,0.15)",
        transition:"all .15s",
        userSelect:"none",
        whiteSpace:"nowrap",
      }}
    >
      {copied ? "✓ kopieret" : id}
    </div>
  );
}

// Kategori-ikoner når produktbillede mangler
function getProductIcon(product) {
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

function ProductImage({ product, size = 64 }) {
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
const timeAgo = ts => { const d=Date.now()-new Date(ts).getTime(); if(d<60000)return"Lige nu"; if(d<3600000)return`${Math.floor(d/60000)} min siden`; if(d<86400000)return`${Math.floor(d/3600000)} t siden`; return`${Math.floor(d/86400000)} d siden`; };
const getAllergenLabels = (ids,custom=[]) => [...ids.map(id=>ALLERGENS.find(a=>a.id===id)).filter(Boolean).map(a=>`${a.emoji} ${a.label}`),...custom.map(c=>`✏️ ${c}`)];
const verifiedBadge = (v, source) => {
  if (v==="verified"||v===true) return {label:"✓ Verificeret",bg:"rgba(34,197,94,.1)",color:"#16a34a"};
  if (v==="partial") return {label:"⚡ Delvist verificeret",bg:"rgba(217,119,6,.08)",color:"#d97706"};
  return {label:"Open Food Facts",bg:"rgba(37,99,235,.06)",color:"#2563eb"};
};

// ─── SUPABASE API-HJÆLPER ────────────────────────────────────────────────────
function makeHeaders(token) {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

async function apiCall(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// ─── ALLERGEN SAMMENLIGNING ──────────────────────────────────────────────────
function compareAllergens(flags, activeAllergenIds) {
  if (!flags || activeAllergenIds.length === 0) return { status:"safe", matchedDanger:[], matchedWarning:[], hasUnknown:false, confidence:"high", explanation:[] };
  const matchedDanger = [];
  const matchedWarning = [];
  let hasUnknown = false;
  const explanation = []; // Forklaring på HVORFOR et produkt er usikkert

  for (const id of activeAllergenIds) {
    const val = flags[id];
    // Håndter boolean (recipes) og string (produkter)
    if (val === true || val === "yes") {
      matchedDanger.push(id);
      explanation.push({ allergen: id, reason: "direkte", severity: "high" });
    } else if (val === "traces") {
      matchedWarning.push(id);
      explanation.push({ allergen: id, reason: "spor", severity: "medium" });
    } else if (val === "unknown" || val === null || val === undefined) {
      hasUnknown = true;
    }
  }

  let status = "safe";
  if (matchedDanger.length > 0) status = "danger";
  else if (matchedWarning.length > 0) status = "warn";

  // Confidence score baseret på datakvalitet
  let confidence = "high";
  if (hasUnknown) confidence = "medium";
  if (Object.keys(flags).length === 0) confidence = "low";
  if (Object.values(flags).every(v => v === null || v === undefined)) confidence = "low";

  return { status, matchedDanger, matchedWarning, hasUnknown, confidence, explanation };
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

// ─── MADPAS — BUNDLED OVERSÆTTELSER ─────────────────────────────────────────
const MADPAS_LANGUAGES = [
  { code:"da", flag:"🇩🇰", name:"Dansk",      bcp:"da-DK" },
  { code:"en", flag:"🇬🇧", name:"English",    bcp:"en-GB" },
  { code:"de", flag:"🇩🇪", name:"Deutsch",    bcp:"de-DE" },
  { code:"fr", flag:"🇫🇷", name:"Français",   bcp:"fr-FR" },
  { code:"es", flag:"🇪🇸", name:"Español",    bcp:"es-ES" },
  { code:"it", flag:"🇮🇹", name:"Italiano",   bcp:"it-IT" },
  { code:"nl", flag:"🇳🇱", name:"Nederlands", bcp:"nl-NL" },
  { code:"pt", flag:"🇵🇹", name:"Português",  bcp:"pt-PT" },
  { code:"pl", flag:"🇵🇱", name:"Polski",     bcp:"pl-PL" },
  { code:"sv", flag:"🇸🇪", name:"Svenska",    bcp:"sv-SE" },
  { code:"no", flag:"🇳🇴", name:"Norsk",      bcp:"nb-NO" },
  { code:"ja", flag:"🇯🇵", name:"日本語",      bcp:"ja-JP" },
  { code:"zh", flag:"🇨🇳", name:"中文",        bcp:"zh-CN" },
  { code:"ar", flag:"🇸🇦", name:"العربية",    bcp:"ar-SA", rtl:true },
  { code:"tr", flag:"🇹🇷", name:"Türkçe",     bcp:"tr-TR" },
  { code:"th", flag:"🇹🇭", name:"ภาษาไทย",    bcp:"th-TH" },
  { code:"el", flag:"🇬🇷", name:"Ελληνικά",   bcp:"el-GR" },
];

const ALLERGEN_T = {
  gluten:      { en:{n:"Gluten",d:"Contains gluten (wheat, rye, barley, oats, spelt)"},de:{n:"Gluten",d:"Enthält Gluten (Weizen, Roggen, Gerste, Hafer, Dinkel)"},fr:{n:"Gluten",d:"Contient du gluten (blé, seigle, orge, avoine, épeautre)"},es:{n:"Gluten",d:"Contiene gluten (trigo, centeno, cebada, avena, espelta)"},it:{n:"Glutine",d:"Contiene glutine (frumento, segale, orzo, avena, farro)"},nl:{n:"Gluten",d:"Bevat gluten (tarwe, rogge, gerst, haver, spelt)"},pt:{n:"Glúten",d:"Contém glúten (trigo, centeio, cevada, aveia, espelta)"},pl:{n:"Gluten",d:"Zawiera gluten (pszenica, żyto, jęczmień, owies, orkisz)"},sv:{n:"Gluten",d:"Innehåller gluten (vete, råg, korn, havre, dinkel)"},no:{n:"Gluten",d:"Inneholder gluten (hvete, rug, bygg, havre, spelt)"},ja:{n:"グルテン",d:"グルテン含有（小麦・ライ麦・大麦・燕麦・スペルト小麦）"},zh:{n:"麸质",d:"含麸质（小麦、黑麦、大麦、燕麦、斯佩尔特小麦）"},ar:{n:"الغلوتين",d:"يحتوي على الغلوتين (قمح، جاودار، شعير، شوفان)"},tr:{n:"Gluten",d:"Gluten içerir (buğday, çavdar, arpa, yulaf, kavılca)"},th:{n:"กลูเตน",d:"มีกลูเตน (ข้าวสาลี, ข้าวไรย์, ข้าวบาร์เลย์, ข้าวโอ๊ต)"},el:{n:"Γλουτένη",d:"Περιέχει γλουτένη (σιτάρι, σίκαλη, κριθάρι, βρώμη, ζέα)"} },
  laktose:     { en:{n:"Lactose / Dairy",d:"Contains milk and dairy products (lactose)"},de:{n:"Laktose / Milch",d:"Enthält Milch und Milchprodukte (Laktose)"},fr:{n:"Lactose / Lait",d:"Contient du lait et des produits laitiers (lactose)"},es:{n:"Lactosa / Lácteos",d:"Contiene leche y productos lácteos (lactosa)"},it:{n:"Lattosio / Latte",d:"Contiene latte e latticini (lattosio)"},nl:{n:"Lactose / Melk",d:"Bevat melk en zuivelproducten (lactose)"},pt:{n:"Lactose / Leite",d:"Contém leite e produtos lácteos (lactose)"},pl:{n:"Laktoza / Mleko",d:"Zawiera mleko i produkty mleczne (laktoza)"},sv:{n:"Laktos / Mjölk",d:"Innehåller mjölk och mjölkprodukter (laktos)"},no:{n:"Laktose / Melk",d:"Inneholder melk og meieriprodukter (laktose)"},ja:{n:"乳糖 / 乳製品",d:"牛乳および乳製品を含む（ラクトース）"},zh:{n:"乳糖 / 乳制品",d:"含有牛奶和乳制品（乳糖）"},ar:{n:"اللاكتوز / الألبان",d:"يحتوي على الحليب ومنتجات الألبان"},tr:{n:"Laktoz / Süt",d:"Süt ve süt ürünleri içerir (laktoz)"},th:{n:"แลคโตส / นม",d:"มีนมและผลิตภัณฑ์จากนม (แลคโตส)"},el:{n:"Λακτόζη / Γάλα",d:"Περιέχει γάλα και γαλακτοκομικά (λακτόζη)"} },
  aeg:         { en:{n:"Eggs",d:"Contains eggs and egg products"},de:{n:"Ei",d:"Enthält Eier und Eiprodukte"},fr:{n:"Œufs",d:"Contient des œufs et ovoproduits"},es:{n:"Huevos",d:"Contiene huevos y ovoproductos"},it:{n:"Uova",d:"Contiene uova e ovoprodotti"},nl:{n:"Eieren",d:"Bevat eieren en eiproducten"},pt:{n:"Ovos",d:"Contém ovos e produtos à base de ovos"},pl:{n:"Jaja",d:"Zawiera jaja i produkty na bazie jaj"},sv:{n:"Ägg",d:"Innehåller ägg och äggprodukter"},no:{n:"Egg",d:"Inneholder egg og eggprodukter"},ja:{n:"卵",d:"卵および卵製品を含む"},zh:{n:"鸡蛋",d:"含有鸡蛋和蛋制品"},ar:{n:"البيض",d:"يحتوي على البيض ومنتجاته"},tr:{n:"Yumurta",d:"Yumurta ve yumurta ürünleri içerir"},th:{n:"ไข่",d:"มีไข่และผลิตภัณฑ์จากไข่"},el:{n:"Αυγά",d:"Περιέχει αυγά και προϊόντα αυγών"} },
  noedder:     { en:{n:"Tree Nuts",d:"Contains nuts (almonds, hazelnuts, walnuts, cashews, pistachios etc.)"},de:{n:"Schalenfrüchte",d:"Enthält Nüsse (Mandeln, Haselnüsse, Walnüsse, Cashews, Pistazien usw.)"},fr:{n:"Fruits à coque",d:"Contient des fruits à coque (amandes, noisettes, noix, cajou, pistaches, etc.)"},es:{n:"Frutos secos",d:"Contiene frutos secos (almendras, avellanas, nueces, anacardos, pistachos, etc.)"},it:{n:"Frutta a guscio",d:"Contiene frutta a guscio (mandorle, nocciole, noci, anacardi, pistacchi ecc.)"},nl:{n:"Noten",d:"Bevat noten (amandelen, hazelnoten, walnoten, cashewnoten, pistachenoten, etc.)"},pt:{n:"Frutos de casca rija",d:"Contém frutos de casca rija (amêndoas, avelãs, nozes, cajus, pistáchios, etc.)"},pl:{n:"Orzechy",d:"Zawiera orzechy (migdały, orzechy laskowe, włoskie, nerkowce, pistacje itp.)"},sv:{n:"Nötter",d:"Innehåller nötter (mandlar, hasselnötter, valnötter, cashewnötter, pistaschnötter m.fl.)"},no:{n:"Nøtter",d:"Inneholder nøtter (mandler, hasselnøtter, valnøtter, cashewnøtter, pistasjnøtter m.fl.)"},ja:{n:"ナッツ類",d:"ナッツ類含有（アーモンド・ヘーゼルナッツ・クルミ・カシューナッツ・ピスタチオ等）"},zh:{n:"坚果",d:"含有坚果（杏仁、榛子、核桃、腰果、开心果等）"},ar:{n:"المكسرات",d:"يحتوي على المكسرات (اللوز، البندق، الجوز، الكاجو، الفستق)"},tr:{n:"Kabuklu Yemişler",d:"Kabuklu yemiş içerir (badem, fındık, ceviz, kaju, antep fıstığı vb.)"},th:{n:"ถั่วต้นไม้",d:"มีถั่ว (อัลมอนด์, เฮเซลนัท, วอลนัท, มะม่วงหิมพานต์, พิสตาชิโอ)"},el:{n:"Ξηροί καρποί",d:"Περιέχει ξηρούς καρπούς (αμύγδαλα, φουντούκια, καρύδια, κάσιους, φιστίκια)"} },
  jordnoedder: { en:{n:"Peanuts",d:"Contains peanuts and peanut products"},de:{n:"Erdnüsse",d:"Enthält Erdnüsse und Erdnussprodukte"},fr:{n:"Arachides",d:"Contient des arachides (cacahuètes) et produits"},es:{n:"Cacahuetes",d:"Contiene cacahuetes y productos a base de cacahuetes"},it:{n:"Arachidi",d:"Contiene arachidi e prodotti a base di arachidi"},nl:{n:"Pinda's",d:"Bevat pinda's en pindaproducten"},pt:{n:"Amendoins",d:"Contém amendoins e produtos à base de amendoins"},pl:{n:"Orzeszki ziemne",d:"Zawiera orzeszki ziemne i produkty z orzeszków ziemnych"},sv:{n:"Jordnötter",d:"Innehåller jordnötter och jordnötsprodukter"},no:{n:"Peanøtter",d:"Inneholder peanøtter og peanøttprodukter"},ja:{n:"ピーナッツ",d:"ピーナッツおよびピーナッツ製品を含む"},zh:{n:"花生",d:"含有花生和花生制品"},ar:{n:"الفول السوداني",d:"يحتوي على الفول السوداني ومنتجاته"},tr:{n:"Yerfıstığı",d:"Yerfıstığı ve yerfıstığı ürünleri içerir"},th:{n:"ถั่วลิสง",d:"มีถั่วลิสงและผลิตภัณฑ์จากถั่วลิสง"},el:{n:"Φιστίκια",d:"Περιέχει φιστίκια και προϊόντα φιστικιών"} },
  soja:        { en:{n:"Soy / Soya",d:"Contains soy and soy-based products"},de:{n:"Soja",d:"Enthält Soja und sojahaltige Produkte"},fr:{n:"Soja",d:"Contient du soja et des produits à base de soja"},es:{n:"Soja",d:"Contiene soja y productos a base de soja"},it:{n:"Soia",d:"Contiene soia e prodotti a base di soia"},nl:{n:"Soja",d:"Bevat soja en sojaproducten"},pt:{n:"Soja",d:"Contém soja e produtos à base de soja"},pl:{n:"Soja",d:"Zawiera soję i produkty sojowe"},sv:{n:"Soja",d:"Innehåller soja och sojabaserade produkter"},no:{n:"Soya",d:"Inneholder soya og soyabaserte produkter"},ja:{n:"大豆",d:"大豆および大豆製品を含む"},zh:{n:"大豆",d:"含有大豆和大豆制品"},ar:{n:"الصويا",d:"يحتوي على الصويا ومنتجاتها"},tr:{n:"Soya",d:"Soya ve soya ürünleri içerir"},th:{n:"ถั่วเหลือง",d:"มีถั่วเหลืองและผลิตภัณฑ์จากถั่วเหลือง"},el:{n:"Σόγια",d:"Περιέχει σόγια και προϊόντα σόγιας"} },
  fisk:        { en:{n:"Fish",d:"Contains fish and fish products"},de:{n:"Fisch",d:"Enthält Fisch und Fischprodukte"},fr:{n:"Poisson",d:"Contient du poisson et des produits à base de poisson"},es:{n:"Pescado",d:"Contiene pescado y productos a base de pescado"},it:{n:"Pesce",d:"Contiene pesce e prodotti ittici"},nl:{n:"Vis",d:"Bevat vis en visproducten"},pt:{n:"Peixe",d:"Contém peixe e produtos à base de peixe"},pl:{n:"Ryby",d:"Zawiera ryby i produkty rybne"},sv:{n:"Fisk",d:"Innehåller fisk och fiskprodukter"},no:{n:"Fisk",d:"Inneholder fisk og fiskeprodukter"},ja:{n:"魚",d:"魚および魚製品を含む"},zh:{n:"鱼类",d:"含有鱼和鱼制品"},ar:{n:"السمك",d:"يحتوي على السمك ومنتجاته"},tr:{n:"Balık",d:"Balık ve balık ürünleri içerir"},th:{n:"ปลา",d:"มีปลาและผลิตภัณฑ์จากปลา"},el:{n:"Ψάρι",d:"Περιέχει ψάρι και προϊόντα ψαριού"} },
  skaldyr:     { en:{n:"Shellfish / Crustaceans",d:"Contains crustaceans and shellfish (shrimp, crab, lobster, mussels etc.)"},de:{n:"Krebstiere / Schalentiere",d:"Enthält Krebstiere und Schalentiere (Garnelen, Krabben, Hummer, Muscheln)"},fr:{n:"Crustacés / Mollusques",d:"Contient des crustacés et mollusques (crevettes, crabe, homard, moules)"},es:{n:"Crustáceos / Mariscos",d:"Contiene crustáceos y mariscos (gambas, cangrejo, langosta, mejillones)"},it:{n:"Crostacei / Molluschi",d:"Contiene crostacei e molluschi (gamberi, granchio, aragosta, cozze)"},nl:{n:"Schaaldieren",d:"Bevat schaaldieren (garnalen, krab, kreeft, mosselen)"},pt:{n:"Crustáceos / Moluscos",d:"Contém crustáceos e moluscos (camarão, caranguejo, lagosta, mexilhões)"},pl:{n:"Skorupiaki",d:"Zawiera skorupiaki (krewetki, kraby, homary, małże)"},sv:{n:"Skaldjur",d:"Innehåller skaldjur (räkor, krabba, hummer, musslor)"},no:{n:"Skalldyr",d:"Inneholder skalldyr (reker, krabbe, hummer, muslinger)"},ja:{n:"甲殻類・貝類",d:"甲殻類・貝類含有（エビ・カニ・ロブスター・ムール貝等）"},zh:{n:"甲壳类 / 贝类",d:"含有甲壳类和贝类（虾、蟹、龙虾、贻贝等）"},ar:{n:"القشريات والمحار",d:"يحتوي على القشريات والمحار"},tr:{n:"Kabuklu Deniz Ürünleri",d:"Kabuklu deniz ürünleri içerir (karides, yengeç, ıstakoz, midye)"},th:{n:"สัตว์มีเปลือก",d:"มีสัตว์มีเปลือก (กุ้ง, ปู, กุ้งมังกร, หอย)"},el:{n:"Οστρακοειδή",d:"Περιέχει οστρακοειδή (γαρίδες, καβούρι, αστακός, μύδια)"} },
  selleri:     { en:{n:"Celery",d:"Contains celery and celery products"},de:{n:"Sellerie",d:"Enthält Sellerie und Sellerieprodukte"},fr:{n:"Céleri",d:"Contient du céleri et produits à base de céleri"},es:{n:"Apio",d:"Contiene apio y productos a base de apio"},it:{n:"Sedano",d:"Contiene sedano e prodotti a base di sedano"},nl:{n:"Selderij",d:"Bevat selderij en selderijproducten"},pt:{n:"Aipo",d:"Contém aipo e produtos à base de aipo"},pl:{n:"Seler",d:"Zawiera seler i produkty na bazie selera"},sv:{n:"Selleri",d:"Innehåller selleri och selleriprodukter"},no:{n:"Selleri",d:"Inneholder selleri og selleriprodukter"},ja:{n:"セロリ",d:"セロリおよびセロリ製品を含む"},zh:{n:"芹菜",d:"含有芹菜和芹菜制品"},ar:{n:"الكرفس",d:"يحتوي على الكرفس ومنتجاته"},tr:{n:"Kereviz",d:"Kereviz ve kereviz ürünleri içerir"},th:{n:"คื่นฉ่าย",d:"มีคื่นฉ่ายและผลิตภัณฑ์จากคื่นฉ่าย"},el:{n:"Σέλινο",d:"Περιέχει σέλινο και προϊόντα σέλινου"} },
  sennep:      { en:{n:"Mustard",d:"Contains mustard and mustard products"},de:{n:"Senf",d:"Enthält Senf und Senfprodukte"},fr:{n:"Moutarde",d:"Contient de la moutarde et produits à base de moutarde"},es:{n:"Mostaza",d:"Contiene mostaza y productos a base de mostaza"},it:{n:"Senape",d:"Contiene senape e prodotti a base di senape"},nl:{n:"Mosterd",d:"Bevat mosterd en mosterdbevattende producten"},pt:{n:"Mostarda",d:"Contém mostarda e produtos à base de mostarda"},pl:{n:"Gorczyca",d:"Zawiera gorczycę i produkty na bazie gorczycy"},sv:{n:"Senap",d:"Innehåller senap och senapsprodukter"},no:{n:"Sennep",d:"Inneholder sennep og sennepsprodukter"},ja:{n:"マスタード",d:"マスタードおよびマスタード製品を含む"},zh:{n:"芥末",d:"含有芥末和芥末制品"},ar:{n:"الخردل",d:"يحتوي على الخردل ومنتجاته"},tr:{n:"Hardal",d:"Hardal ve hardal ürünleri içerir"},th:{n:"มัสตาร์ด",d:"มีมัสตาร์ดและผลิตภัณฑ์จากมัสตาร์ด"},el:{n:"Μουστάρδα",d:"Περιέχει μουστάρδα και προϊόντα μουστάρδας"} },
  sesam:       { en:{n:"Sesame",d:"Contains sesame seeds and sesame products"},de:{n:"Sesam",d:"Enthält Sesamsamen und Sesamprodukte"},fr:{n:"Sésame",d:"Contient des graines de sésame et produits à base de sésame"},es:{n:"Sésamo",d:"Contiene semillas de sésamo y productos a base de sésamo"},it:{n:"Sesamo",d:"Contiene semi di sesamo e prodotti a base di sesamo"},nl:{n:"Sesam",d:"Bevat sesamzaad en sesamproducten"},pt:{n:"Sésamo",d:"Contém sementes de sésamo e produtos à base de sésamo"},pl:{n:"Sezam",d:"Zawiera ziarna sezamu i produkty sezamowe"},sv:{n:"Sesam",d:"Innehåller sesamfrön och sesamprodukter"},no:{n:"Sesam",d:"Inneholder sesamfrø og sesamprodukter"},ja:{n:"ゴマ",d:"ゴマおよびゴマ製品を含む"},zh:{n:"芝麻",d:"含有芝麻和芝麻制品"},ar:{n:"السمسم",d:"يحتوي على بذور السمسم ومنتجاته"},tr:{n:"Susam",d:"Susam tohumu ve susam ürünleri içerir"},th:{n:"งา",d:"มีเมล็ดงาและผลิตภัณฑ์จากงา"},el:{n:"Σουσάμι",d:"Περιέχει σουσάμι και προϊόντα σουσαμιού"} },
  svovl:       { en:{n:"Sulphites / Sulfites",d:"Contains sulphites/sulphur dioxide (preservative)"},de:{n:"Sulfite / SO₂",d:"Enthält Sulfite/Schwefeldioxid (Konservierungsmittel)"},fr:{n:"Sulfites / SO₂",d:"Contient des sulfites/dioxyde de soufre (conservateur)"},es:{n:"Sulfitos / SO₂",d:"Contiene sulfitos/dióxido de azufre (conservante)"},it:{n:"Solfiti / SO₂",d:"Contiene solfiti/anidride solforosa (conservante)"},nl:{n:"Sulfieten / SO₂",d:"Bevat sulfieten/zwaveldioxide (conserveermiddel)"},pt:{n:"Sulfitos / SO₂",d:"Contém sulfitos/dióxido de enxofre (conservante)"},pl:{n:"Siarczyny / SO₂",d:"Zawiera siarczyny/dwutlenek siarki (konserwant)"},sv:{n:"Sulfiter / SO₂",d:"Innehåller sulfiter/svaveldioxid (konserveringsmedel)"},no:{n:"Sulfitter / SO₂",d:"Inneholder sulfitter/svoveldioksid (konserveringsmiddel)"},ja:{n:"亜硫酸塩 / SO₂",d:"亜硫酸塩/二酸化硫黄を含む（保存料）"},zh:{n:"亚硫酸盐 / SO₂",d:"含有亚硫酸盐/二氧化硫（防腐剂）"},ar:{n:"الكبريتيت / SO₂",d:"يحتوي على الكبريتيت (مادة حافظة)"},tr:{n:"Sülfit / SO₂",d:"Sülfit/kükürt dioksit içerir (koruyucu)"},th:{n:"ซัลไฟต์ / SO₂",d:"มีซัลไฟต์/ซัลเฟอร์ไดออกไซด์ (สารกันบูด)"},el:{n:"Θειώδη / SO₂",d:"Περιέχει θειώδη/διοξείδιο του θείου (συντηρητικό)"} },
  lupin:       { en:{n:"Lupin",d:"Contains lupin and lupin-based products"},de:{n:"Lupinen",d:"Enthält Lupinen und Lupinenprodukte"},fr:{n:"Lupin",d:"Contient du lupin et des produits à base de lupin"},es:{n:"Altramuz",d:"Contiene altramuz y productos a base de altramuz"},it:{n:"Lupini",d:"Contiene lupini e prodotti a base di lupini"},nl:{n:"Lupine",d:"Bevat lupine en lupineproducten"},pt:{n:"Tremoço",d:"Contém tremoço e produtos à base de tremoço"},pl:{n:"Łubin",d:"Zawiera łubin i produkty z łubinu"},sv:{n:"Lupin",d:"Innehåller lupin och lupinbaserade produkter"},no:{n:"Lupin",d:"Inneholder lupin og lupinbaserte produkter"},ja:{n:"ルピナス",d:"ルピナスおよびルピナス製品を含む"},zh:{n:"羽扇豆",d:"含有羽扇豆和羽扇豆制品"},ar:{n:"الترمس",d:"يحتوي على الترمس ومنتجاته"},tr:{n:"Lupin",d:"Lupin ve lupin ürünleri içerir"},th:{n:"ลูพิน",d:"มีลูพินและผลิตภัณฑ์จากลูพิน"},el:{n:"Λούπινα",d:"Περιέχει λούπινα και προϊόντα λούπινων"} },
  bloeddyr:    { en:{n:"Molluscs",d:"Contains molluscs (squid, oysters, mussels, snails etc.)"},de:{n:"Weichtiere",d:"Enthält Weichtiere (Tintenfisch, Austern, Muscheln, Schnecken)"},fr:{n:"Mollusques",d:"Contient des mollusques (calamar, huîtres, moules, escargots)"},es:{n:"Moluscos",d:"Contiene moluscos (calamar, ostras, mejillones, caracoles)"},it:{n:"Molluschi",d:"Contiene molluschi (calamari, ostriche, cozze, lumache)"},nl:{n:"Weekdieren",d:"Bevat weekdieren (inktvis, oesters, mosselen, slakken)"},pt:{n:"Moluscos",d:"Contém moluscos (lulas, ostras, mexilhões, caracóis)"},pl:{n:"Mięczaki",d:"Zawiera mięczaki (kałamarnica, ostrygi, małże, ślimaki)"},sv:{n:"Blötdjur",d:"Innehåller blötdjur (bläckfisk, ostron, musslor, sniglar)"},no:{n:"Bløtdyr",d:"Inneholder bløtdyr (blekksprut, østers, muslinger, snegler)"},ja:{n:"軟体動物",d:"軟体動物含有（イカ・カキ・ムール貝・カタツムリ等）"},zh:{n:"软体动物",d:"含有软体动物（鱿鱼、牡蛎、贻贝、蜗牛等）"},ar:{n:"الرخويات",d:"يحتوي على الرخويات (الحبار، المحار، بلح البحر)"},tr:{n:"Yumuşakçalar",d:"Yumuşakça içerir (kalamar, istiridye, midye, salyangoz)"},th:{n:"หอย / ปลาหมึก",d:"มีสัตว์จำพวกหอย (ปลาหมึก, หอยนางรม, หอยแมลงภู่)"},el:{n:"Μαλάκια",d:"Περιέχει μαλάκια (καλαμάρι, στρείδια, μύδια, σαλιγκάρια)"} },
};

const MADPAS_INTRO = {
  da:"Jeg har følgende fødevareallergier og intoleranser. Vær venlig at sikre, at min mad ikke indeholder nogen af disse.",
  en:"I have the following food allergies and intolerances. Please ensure my meal does not contain any of these.",
  de:"Ich habe folgende Lebensmittelallergien und Unverträglichkeiten. Bitte stellen Sie sicher, dass mein Essen keines davon enthält.",
  fr:"J'ai les allergies alimentaires et intolérances suivantes. Veuillez vous assurer que mon repas n'en contient aucune.",
  es:"Tengo las siguientes alergias alimentarias e intolerancias. Por favor, asegúrese de que mi comida no contenga ninguno de estos.",
  it:"Ho le seguenti allergie alimentari e intolleranze. Si prega di assicurarsi che il mio pasto non contenga nessuno di questi.",
  nl:"Ik heb de volgende voedselallergieën en intoleranties. Zorg er alstublieft voor dat mijn maaltijd geen van deze bevat.",
  pt:"Tenho as seguintes alergias alimentares e intolerâncias. Por favor, certifique-se de que a minha refeição não contém nenhum destes.",
  pl:"Mam następujące alergie pokarmowe i nietolerancje. Proszę upewnić się, że moje jedzenie nie zawiera żadnego z tych składników.",
  sv:"Jag har följande matallergier och intoleranser. Vänligen se till att min måltid inte innehåller något av dessa.",
  no:"Jeg har følgende matallergier og intoleranser. Vennligst sørg for at mitt måltid ikke inneholder noen av disse.",
  ja:"私は以下の食物アレルギーと不耐症があります。私の食事にこれらが含まれないようにしてください。",
  zh:"我有以下食物过敏和不耐受。请确保我的餐食不含以下任何成分。",
  ar:"لدي الحساسية الغذائية والتعصبات التالية. يرجى التأكد من أن وجبتي لا تحتوي على أي من هذه العناصر.",
  tr:"Aşağıdaki gıda alerjilerim ve intoleranslarım var. Lütfen yemeğimin bunlardan hiçbirini içermediğinden emin olun.",
  th:"ฉันมีการแพ้อาหารและการแพ้ต่อไปนี้ กรุณาตรวจสอบให้แน่ใจว่าอาหารของฉันไม่มีสิ่งเหล่านี้",
  el:"Έχω τις ακόλουθες αλλεργίες και δυσανεξίες. Παρακαλώ βεβαιωθείτε ότι το γεύμα μου δεν περιέχει κανένα από αυτά.",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  /* Logo-afledte farver */
  --ink:#1F2733;        /* logoets stregkode-farve */
  --ink2:#2d3a48;       /* lidt lysere ink */
  --ink3:#3d4e5e;       /* endnu lysere */
  --paper:#FAFAF7;      /* logoets baggrund */
  --paper2:#F2F2EE;     /* lidt mørkere paper */
  --green:#22C55E;      /* signalgrøn fra logoet */
  --green-glow:#4ADE80; /* glow-grøn fra logoet */
  --green-lt:rgba(34,197,94,.1);
  --green-mid:rgba(34,197,94,.18);
  --border:#E4E4DF;     /* diskret paper-farvet border */
  --border2:#D0D0C8;    /* lidt tydeligere */
  --red:#E63946;--red-lt:rgba(230,57,70,.08);--red-md:rgba(230,57,70,.15);
  --amber:#D97706;--amber-lt:rgba(217,119,6,.08);--amber-md:rgba(217,119,6,.14);
  --blue:#2563EB;--blue-lt:rgba(37,99,235,.08);
  --muted:#8A9099;      /* grå-blå neutral */
  --muted2:#6B7280;
  --r:12px;
  --f:'Inter',system-ui,sans-serif;
  --sh:0 1px 3px rgba(31,39,51,.06),0 2px 8px rgba(31,39,51,.05);
  --sh2:0 4px 16px rgba(31,39,51,.12);
  --sh3:0 8px 32px rgba(31,39,51,.16);
}
body{background:var(--paper);color:var(--ink);font-family:var(--f);-webkit-font-smoothing:antialiased;}
.app{max-width:390px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--paper);width:100%;position:relative;overflow-x:hidden;}

/* ── TOPBAR ── */
.topbar{background:var(--paper);border-bottom:1px solid var(--border);padding:12px 18px 10px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:60;backdrop-filter:blur(8px);}
.topbar-logo{display:flex;align-items:center;gap:8px;}
.topbar-shield{width:32px;height:32px;background:none;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}
.topbar-name{font-size:17px;font-weight:800;color:var(--ink);letter-spacing:-.5px;font-family:var(--f);}
.topbar-name span{color:var(--green);font-style:italic;font-weight:800;}
.topbar-avatar{width:32px;height:32px;background:var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--paper);cursor:pointer;transition:all .15s;letter-spacing:.5px;}
.topbar-avatar:hover{background:var(--ink2);}

/* ── LAYOUT ── */
.screen{flex:1;padding:0 16px 110px;}
.bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:390px;background:var(--paper);border-top:1px solid var(--border);display:flex;padding:6px 4px 16px;z-index:100;box-shadow:0 -1px 0 var(--border),0 -4px 16px rgba(31,39,51,.06);}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;opacity:.3;transition:all .15s;}
.nav-item.active{opacity:1;}
.nav-icon{width:42px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:background .15s;}
.nav-item.active .nav-icon{background:var(--green-lt);}
.nav-lbl{font-size:9.5px;font-weight:700;color:var(--ink);letter-spacing:.2px;}
.nav-item.active .nav-lbl{color:var(--green);}

/* ── CARDS & COMPONENTS ── */
.card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:10px;box-shadow:var(--sh);}
.card-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin-bottom:10px;}
.card-title{font-size:15px;font-weight:800;color:var(--ink);margin-bottom:4px;letter-spacing:-.2px;}
.field{width:100%;background:var(--paper2);border:1.5px solid var(--border2);border-radius:10px;padding:11px 14px;color:var(--ink);font-family:var(--f);font-size:16px;outline:none;transition:border-color .15s,background .15s;}
.field:focus{border-color:var(--green);background:#fff;box-shadow:0 0 0 3px var(--green-lt);}
.field-lbl{font-size:11.5px;font-weight:700;color:var(--ink2);margin-bottom:5px;display:block;letter-spacing:.1px;}
.input-row{display:flex;gap:8px;}

/* ── BUTTONS ── */
.btn{padding:12px 20px;border-radius:10px;border:none;font-family:var(--f);font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;gap:6px;letter-spacing:-.1px;}
.btn-full{width:100%;}
.btn-primary{background:var(--ink);color:var(--paper);box-shadow:0 2px 8px rgba(31,39,51,.2);}
.btn-primary:hover{background:var(--ink2);transform:translateY(-1px);box-shadow:var(--sh2);}
.btn-green{background:var(--green);color:#fff;box-shadow:0 2px 8px rgba(34,197,94,.25);}
.btn-green:hover{background:var(--green-glow);transform:translateY(-1px);}
.btn-outline{background:transparent;color:var(--ink);border:1.5px solid var(--border2);}
.btn-outline:hover{border-color:var(--ink);background:var(--paper2);}
.btn-danger{background:transparent;color:var(--red);border:1.5px solid rgba(230,57,70,.3);}
.btn-danger:hover{background:var(--red-lt);}
.btn-sm{padding:7px 13px;font-size:12.5px;border-radius:8px;}
.btn-ghost{background:var(--paper2);color:var(--ink2);border:1px solid var(--border);}
.btn-ghost:hover{background:var(--border);color:var(--ink);}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important;}

/* ── CHIPS & TAGS ── */
.chip-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.chip{display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:10px;border:1.5px solid var(--border2);background:#fff;cursor:pointer;transition:all .15s;font-size:12.5px;font-weight:600;color:var(--muted2);user-select:none;}
.chip:hover{border-color:var(--ink3);color:var(--ink);}
.chip.on{border-color:var(--green);background:var(--green-lt);color:var(--ink);font-weight:700;}
.chip-check{margin-left:auto;width:16px;height:16px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;flex-shrink:0;}
.tags{display:flex;flex-wrap:wrap;gap:5px;}
.tag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--green-lt);border:1px solid var(--green-mid);border-radius:100px;font-size:12px;color:var(--ink);font-weight:600;}
.tag-x{cursor:pointer;opacity:.4;font-size:13px;margin-left:1px;}.tag-x:hover{opacity:.8;}

/* ── BADGES ── */
.badge{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;letter-spacing:.2px;}
.badge.safe{background:var(--green-lt);color:var(--green);border:1px solid var(--green-mid);}
.badge.danger{background:var(--red-lt);color:var(--red);border:1px solid var(--red-md);}
.badge.warn{background:var(--amber-lt);color:var(--amber);border:1px solid var(--amber-md);}

.divider{display:flex;align-items:center;gap:10px;margin:12px 0;color:var(--muted);font-size:11.5px;font-weight:600;letter-spacing:.3px;}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border);}

/* ── WELCOME ── */
.welcome-screen{min-height:100vh;background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 28px;text-align:center;}
.welcome-logo-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:40px;}
.welcome-wordmark{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px;}
.welcome-wordmark-text{font-family:var(--f);font-size:32px;font-weight:800;color:var(--ink);letter-spacing:-.8px;line-height:1;}
.welcome-wordmark-text span{color:var(--green);font-style:italic;font-weight:800;}
.welcome-tagline{font-size:15px;color:var(--muted);margin-top:10px;letter-spacing:.2px;font-weight:400;}
.welcome-divider{width:40px;height:2px;background:var(--border2);border-radius:2px;margin:32px auto;}
.welcome-features{display:flex;flex-direction:column;gap:14px;margin-bottom:44px;width:100%;}
.welcome-feat{display:flex;align-items:center;gap:14px;text-align:left;padding:12px 14px;background:#fff;border:1px solid var(--border);border-radius:12px;}
.welcome-feat-icon{width:38px;height:38px;background:var(--green-lt);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.welcome-feat-text{font-size:13px;color:var(--muted2);font-weight:500;line-height:1.45;}
.welcome-feat-text strong{color:var(--ink);font-weight:700;display:block;margin-bottom:2px;}
.welcome-btn{background:var(--ink);color:var(--paper);border:none;border-radius:12px;padding:15px 32px;font-family:var(--f);font-size:15px;font-weight:700;cursor:pointer;width:100%;transition:all .18s;margin-bottom:10px;letter-spacing:-.1px;box-shadow:0 2px 10px rgba(31,39,51,.15);}
.welcome-btn:hover{background:var(--ink2);transform:translateY(-1px);}
.welcome-btn-ghost{background:transparent;color:var(--ink2);border:1.5px solid var(--border2);border-radius:12px;padding:13px 32px;font-family:var(--f);font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:all .18s;}
.welcome-btn-ghost:hover{background:var(--paper2);}

/* ── LOGIN ── */
.login-wrap{min-height:100vh;background:var(--paper);display:flex;flex-direction:column;padding:48px 20px 32px;}
.login-header{text-align:center;margin-bottom:28px;}
.login-shield{width:64px;height:64px;background:none;border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;overflow:hidden;}
.login-title{font-size:24px;font-weight:800;color:var(--ink);letter-spacing:-.5px;}
.login-sub{font-size:13px;color:var(--muted);margin-top:4px;}

/* ── ONBOARDING ── */
.onboard-wrap{padding:20px 16px 100px;}
.step-seg{height:3px;flex:1;border-radius:2px;background:var(--border2);transition:background .3s;}
.step-seg.done{background:var(--green);}
.step-num{font-size:11px;font-weight:700;color:var(--muted);white-space:nowrap;}
.step-title{font-size:17px;font-weight:800;margin-bottom:5px;color:var(--ink);letter-spacing:-.3px;}
.step-sub{font-size:13px;color:var(--muted2);margin-bottom:16px;line-height:1.55;}
.onboard-skip{font-size:12px;color:var(--muted);text-align:center;margin-top:8px;}

/* ── HOME ── */
.greeting{padding:20px 0 14px;}
.greeting-main{font-size:21px;font-weight:800;color:var(--ink);letter-spacing:-.4px;}
.greeting-sub{font-size:13px;color:var(--muted2);margin-top:3px;font-weight:500;}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.stat-card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px;box-shadow:var(--sh);}
.stat-num{font-size:26px;font-weight:800;color:var(--ink);line-height:1;letter-spacing:-.5px;}
.stat-lbl{font-size:11px;color:var(--muted);margin-top:4px;font-weight:600;letter-spacing:.2px;}
.scan-hero{background:var(--ink);border-radius:16px;padding:20px 18px;margin-bottom:10px;display:flex;align-items:center;gap:16px;cursor:pointer;transition:all .18s;box-shadow:var(--sh2);position:relative;overflow:hidden;}
.scan-hero::after{content:'';position:absolute;right:-10px;bottom:-10px;width:80px;height:80px;background:radial-gradient(circle,rgba(34,197,94,.15) 0%,transparent 70%);pointer-events:none;}
.scan-hero:hover{transform:translateY(-2px);box-shadow:var(--sh3);}
.scan-hero-icon{font-size:36px;flex-shrink:0;filter:grayscale(1) brightness(3);}
.scan-hero-title{font-size:18px;font-weight:800;color:var(--paper);letter-spacing:-.4px;}
.scan-hero-sub{font-size:12px;color:rgba(250,250,247,.45);margin-top:3px;font-weight:500;}
.scan-hero-arrow{font-size:18px;color:var(--green);margin-left:auto;flex-shrink:0;}
.quick-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.quick-btn{background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s;box-shadow:var(--sh);}
.quick-btn:hover{border-color:var(--green-mid);background:var(--green-lt);}
.quick-icon{font-size:20px;flex-shrink:0;}
.quick-label{font-size:13px;font-weight:700;color:var(--ink);letter-spacing:-.1px;}

/* ── SCAN ── */
.scan-box{background:var(--ink);border-radius:16px;overflow:hidden;margin-bottom:12px;position:relative;}
.scan-viewfinder{height:220px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;position:relative;cursor:pointer;}
.scan-corner{position:absolute;width:28px;height:28px;border-color:rgba(250,250,247,.5);border-style:solid;border-width:0;}
.scan-corner.tl{top:18px;left:18px;border-top-width:2.5px;border-left-width:2.5px;border-radius:3px 0 0 0;}
.scan-corner.tr{top:18px;right:18px;border-top-width:2.5px;border-right-width:2.5px;border-radius:0 3px 0 0;}
.scan-corner.bl{bottom:18px;left:18px;border-bottom-width:2.5px;border-left-width:2.5px;border-radius:0 0 0 3px;}
.scan-corner.br{bottom:18px;right:18px;border-bottom-width:2.5px;border-right-width:2.5px;border-radius:0 0 3px 0;}
.scan-laser{position:absolute;left:22px;right:22px;height:2px;background:linear-gradient(90deg,transparent,var(--green),var(--green-glow),var(--green),transparent);animation:laserMove 2s ease-in-out infinite;filter:drop-shadow(0 0 4px var(--green));}
@keyframes laserMove{0%,100%{top:20px;opacity:.4;}50%{top:calc(100% - 20px);opacity:1;}}
.scan-camera-text{color:rgba(250,250,247,.45);font-size:12.5px;font-weight:600;position:relative;z-index:1;letter-spacing:.1px;}
.scan-camera-icon{font-size:40px;position:relative;z-index:1;filter:grayscale(1) brightness(3) opacity(.6);}
.scan-bar{background:rgba(0,0,0,.25);padding:11px 16px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(250,250,247,.06);}
.scan-bar-txt{color:rgba(250,250,247,.5);font-size:11.5px;font-weight:600;}

/* ── RESULT ── */
.result-banner{border-radius:12px;padding:16px 18px;margin-bottom:10px;display:flex;align-items:center;gap:14px;}
.result-banner.safe{background:var(--green-lt);border:1px solid var(--green-mid);}
.result-banner.danger{background:var(--red-lt);border:1px solid var(--red-md);}
.result-banner.warn{background:var(--amber-lt);border:1px solid var(--amber-md);}
.result-banner.unknown{background:var(--paper2);border:1px solid var(--border2);}
.rb-icon{font-size:34px;flex-shrink:0;}
.rb-title{font-size:18px;font-weight:800;letter-spacing:-.3px;}
.rb-title.safe{color:var(--green);}.rb-title.danger{color:var(--red);}.rb-title.warn{color:var(--amber);}.rb-title.unknown{color:var(--muted2);}
.rb-sub{font-size:11.5px;color:var(--muted);margin-top:3px;font-weight:500;}
.flag{display:flex;align-items:center;gap:8px;padding:8px 11px;border-radius:8px;font-size:12.5px;font-weight:600;margin-bottom:6px;}
.flag.bad{background:var(--red-lt);color:var(--red);}
.flag.maybe{background:var(--amber-lt);color:var(--amber);}
.flag.good{background:var(--green-lt);color:var(--green);}
.ing-toggle{display:flex;align-items:center;justify-content:space-between;padding:10px 0;cursor:pointer;font-size:12.5px;font-weight:700;color:var(--muted2);border-top:1px solid var(--border);margin-top:10px;}
.ing-toggle:hover{color:var(--ink);}
.ing-text{font-size:11.5px;color:var(--muted2);line-height:1.75;padding:8px 0;max-height:100px;overflow-y:auto;}

/* ── SEARCH ── */
.filter-chip{padding:5px 12px;border-radius:100px;border:1.5px solid var(--border2);background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted2);}
.filter-chip:hover{border-color:var(--ink3);color:var(--ink);}
.filter-chip.active{border-color:var(--green);background:var(--green-lt);color:var(--ink);}
.product-card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:13px;margin-bottom:8px;box-shadow:var(--sh);display:flex;align-items:center;gap:11px;}
.product-card:hover{border-color:var(--border2);box-shadow:var(--sh2);}
.product-emoji{width:44px;height:44px;background:var(--paper2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;border:1px solid var(--border);}
.product-name{font-size:13.5px;font-weight:700;letter-spacing:-.1px;}
.product-brand{font-size:11.5px;color:var(--muted);margin-top:2px;}
.verified-pill{display:inline-flex;align-items:center;padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;margin-top:4px;letter-spacing:.2px;}

/* ── LIST ── */
.list-item{display:flex;align-items:center;gap:11px;padding:11px 13px;background:#fff;border:1px solid var(--border);border-radius:11px;margin-bottom:7px;box-shadow:var(--sh);}
.list-item.done{opacity:.4;}
.list-check{width:20px;height:20px;border-radius:6px;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .18s;font-size:11px;color:#fff;}
.list-check.checked{background:var(--green);border-color:var(--green);}
.list-name{font-size:14px;font-weight:600;flex:1;letter-spacing:-.1px;}
.list-name.done{text-decoration:line-through;color:var(--muted);}
.list-del{font-size:15px;cursor:pointer;opacity:.2;padding:4px;transition:opacity .15s;}.list-del:hover{opacity:.6;}
.list-section{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin:14px 0 7px;}

/* ── PROFILE ── */
.profile-hero{background:var(--ink);border-radius:16px;padding:20px 18px;margin:16px 0 12px;display:flex;align-items:center;gap:14px;}
.pa-lg{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:var(--ink);background:var(--paper);flex-shrink:0;}
.profile-hero-name{font-size:18px;font-weight:800;color:var(--paper);letter-spacing:-.4px;}
.profile-hero-sub{font-size:11.5px;color:rgba(250,250,247,.45);margin-top:3px;font-weight:500;}
.profile-edit-btn{margin-left:auto;background:rgba(250,250,247,.08);border:1px solid rgba(250,250,247,.12);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;color:var(--paper);cursor:pointer;font-family:var(--f);transition:all .15s;}
.profile-edit-btn:hover{background:rgba(250,250,247,.14);}
.stat3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;text-align:center;}
.stat3-item{background:var(--paper2);border-radius:10px;padding:12px 8px;border:1px solid var(--border);}
.stat3-num{font-size:20px;font-weight:800;letter-spacing:-.3px;}
.stat3-lbl{font-size:10.5px;color:var(--muted);font-weight:600;margin-top:3px;letter-spacing:.2px;}

/* ── FAMILY ── */
.family-member{background:#fff;border:1px solid var(--border);border-radius:12px;padding:13px 15px;margin-bottom:9px;box-shadow:var(--sh);}
.fm-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0;}
.ap-chip{display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:100px;border:1.5px solid var(--border2);background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted2);}
.ap-chip:hover{border-color:var(--ink3);color:var(--ink);}
.ap-chip.on{border-color:var(--green);background:var(--green-lt);color:var(--ink);}

/* ── HISTORY ── */
.hist-row{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:opacity .1s;}
.hist-row:hover{opacity:.75;}
.hist-row:last-child{border-bottom:none;}
.hist-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.hist-dot.safe{background:var(--green);}.hist-dot.danger{background:var(--red);}.hist-dot.warn,.hist-dot.warning{background:var(--amber);}.hist-dot.not_found{background:var(--muted);}
.hist-info{flex:1;min-width:0;}
.hist-name{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.1px;}
.hist-time{font-size:11px;color:var(--muted);margin-top:1px;font-weight:500;}

/* ── UTILS ── */
.loader{display:flex;flex-direction:column;align-items:center;gap:10px;padding:28px;background:#fff;border-radius:12px;box-shadow:var(--sh);margin-bottom:10px;}
.spinner{width:32px;height:32px;border:2.5px solid var(--border2);border-top-color:var(--green);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.loader-txt{font-size:13.5px;font-weight:700;color:var(--ink);letter-spacing:-.1px;}
.loader-sub{font-size:11.5px;color:var(--muted);}
.error-box{background:var(--red-lt);border:1px solid var(--red-md);border-radius:10px;padding:11px 14px;font-size:12.5px;color:var(--red);font-weight:600;margin-bottom:10px;display:flex;align-items:flex-start;gap:8px;}
.info-box{background:var(--blue-lt);border:1px solid rgba(37,99,235,.2);border-radius:10px;padding:11px 14px;font-size:12.5px;color:var(--blue);font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.warn-box{background:var(--amber-lt);border:1px solid var(--amber-md);border-radius:10px;padding:11px 14px;font-size:12.5px;color:var(--amber);font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.share-bar{display:flex;gap:8px;padding:11px 13px;background:var(--blue-lt);border-radius:10px;margin-bottom:10px;align-items:center;border:1px solid rgba(37,99,235,.12);}
.share-txt{flex:1;font-size:12.5px;color:var(--blue);font-weight:600;}
.empty-state{text-align:center;padding:52px 20px;color:var(--muted);}
.empty-icon{font-size:40px;margin-bottom:12px;display:block;filter:grayscale(1);opacity:.4;}
.empty-txt{font-size:15px;font-weight:700;color:var(--ink2);letter-spacing:-.2px;}
.empty-sub{font-size:13px;margin-top:5px;color:var(--muted);font-weight:500;}
.demo-code{padding:4px 10px;background:#fff;border:1px solid var(--border2);border-radius:7px;font-size:12px;font-weight:700;color:var(--ink2);cursor:pointer;transition:all .15s;display:inline-block;margin:3px;font-family:monospace;}
.demo-code:hover{border-color:var(--green);color:var(--green);background:var(--green-lt);}
.screen-title{font-size:21px;font-weight:800;color:var(--ink);margin:20px 0 16px;letter-spacing:-.4px;text-align:center;width:100%;}
.screen-sub{font-size:13px;color:var(--muted2);margin-bottom:16px;line-height:1.5;font-weight:500;}
.tab-row{display:flex;gap:3px;background:var(--paper2);border-radius:10px;padding:3px;margin-bottom:14px;border:1px solid var(--border);}
.tab{flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;color:var(--muted2);transition:all .15s;}
.tab.active{background:#fff;color:var(--ink);box-shadow:var(--sh);}
#qr-reader{width:100%!important;border:none!important;min-height:200px;}
#qr-reader video{width:100%!important;height:auto!important;border-radius:8px!important;display:block!important;}
#qr-reader__dashboard{display:none!important;}
#qr-reader__scan_region{width:100%!important;}
#qr-reader-home{width:100%!important;overflow:hidden;}
#qr-reader-home>div{padding:0!important;border:none!important;background:transparent!important;}
#qr-reader-home img{display:none!important;}
#qr-reader-home video{width:100%!important;height:260px!important;object-fit:cover!important;display:block!important;}
#qr-reader__dashboard{display:none!important;}
#qr-reader__status_span{display:none!important;}
#qr-reader img{display:none!important;}
/* ── PRODUKT HERO ── */
.product-hero{background:#fff;border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:10px;box-shadow:var(--sh);}
.product-hero-img{width:100%;height:180px;object-fit:contain;background:var(--paper2);display:block;}
.product-hero-img-placeholder{width:100%;height:180px;background:var(--paper2);display:flex;align-items:center;justify-content:center;font-size:72px;}
.product-hero-body{padding:14px 16px;}
.product-hero-name{font-size:19px;font-weight:800;color:var(--ink);letter-spacing:-.4px;line-height:1.2;margin-bottom:3px;}
.product-hero-brand{font-size:13px;color:var(--muted);font-weight:500;margin-bottom:10px;}
.product-hero-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.product-hero-source{font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;letterSpacing:.3px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.fade-in{animation:fadeUp .18s ease both;}

/* ── MADPAS ── */
.mp-page{background:var(--paper);display:flex;flex-direction:column;flex:1;}
.mp-scroll{flex:1;overflow-y:auto;padding:0 20px 120px;}
.mp-head{padding:20px 20px 0;}
.mp-title{font-size:26px;font-weight:900;color:var(--ink);letter-spacing:-.5px;margin-bottom:5px;}
.mp-subtitle{font-size:13px;color:var(--muted2);font-weight:500;line-height:1.5;margin-bottom:20px;}
.mp-section-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin:0 0 8px;}
.mp-lang-dropdown{width:100%;background:#fff;border:1.5px solid var(--border2);border-radius:13px;padding:13px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s;margin-bottom:16px;box-sizing:border-box;}
.mp-lang-dropdown:hover{border-color:var(--green);}
.mp-lang-flag{font-size:22px;flex-shrink:0;}
.mp-lang-name{flex:1;font-size:15px;font-weight:700;color:var(--ink);}
.mp-lang-arrow{font-size:14px;color:var(--muted);}
.mp-lang-list{background:#fff;border:1.5px solid var(--border2);border-radius:13px;overflow:hidden;margin-bottom:16px;max-height:320px;overflow-y:auto;}
.mp-lang-opt{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;transition:background .1s;border-bottom:1px solid var(--border);}
.mp-lang-opt:last-child{border-bottom:none;}
.mp-lang-opt:hover{background:var(--paper2);}
.mp-lang-opt.on{background:var(--green-lt);}
.mp-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:14px;box-shadow:var(--sh);}
.mp-allergen-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;background:var(--red-lt);border:1px solid var(--red-md);border-radius:100px;font-weight:800;color:var(--red);margin:3px;}
.mp-allergen-pill.custom{background:var(--paper2);border-color:var(--border2);color:var(--ink2);}
.mp-big-btn{width:100%;background:var(--ink);color:var(--paper);border:none;border-radius:14px;padding:16px;font-family:var(--f);font-size:16px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;box-shadow:0 3px 12px rgba(31,39,51,.18);}
.mp-big-btn:hover{background:var(--ink2);}
.mp-speak-btn{background:var(--green);color:#fff;border:none;border-radius:10px;padding:8px 14px;font-family:var(--f);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;flex:1;}
.mp-speak-btn.speaking{background:var(--amber);}
.mp-aa{background:var(--paper2);color:var(--muted2);border:1.5px solid var(--border2);border-radius:9px;padding:7px 11px;font-family:var(--f);font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;}
.mp-aa.on{background:var(--green-lt);border-color:var(--green);color:var(--green);}
.mp-family-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 0;border-bottom:1px solid var(--border);}
.mp-family-row:last-child{border-bottom:none;}

/* ── OPSKRIFTER ── */
.recipe-grid{display:flex;flex-direction:column;gap:12px;}
.recipe-card{background:#fff;border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--sh);cursor:pointer;transition:transform .15s,box-shadow .15s;position:relative;}
.recipe-card:active{transform:scale(.99);}
.recipe-card-img{width:100%;height:180px;object-fit:cover;display:block;background:var(--paper2);}
.recipe-card-img-placeholder{width:100%;height:140px;background:linear-gradient(135deg,var(--paper2) 0%,var(--border) 100%);display:flex;align-items:center;justify-content:center;font-size:52px;}
.recipe-card-body{padding:14px 16px 16px;}
.recipe-card-title{font-size:16px;font-weight:800;color:var(--ink);line-height:1.25;margin-bottom:6px;letter-spacing:-.2px;}
.recipe-card-desc{font-size:12px;color:var(--muted2);line-height:1.55;margin-bottom:10px;}
.recipe-card-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.recipe-pill{font-size:10px;font-weight:700;border-radius:100px;padding:3px 9px;border:1px solid;white-space:nowrap;}
.recipe-safe-bar{display:flex;gap:5px;flex-wrap:wrap;padding:10px 14px 0;border-top:1px solid var(--border);margin-top:10px;}
.recipe-profile-badge{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;border:1px solid;}
.recipe-fav-btn{position:absolute;top:10px;right:10px;z-index:2;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.35);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:background .15s;}
.recipe-filter-row{display:flex;gap:7px;overflow-x:auto;padding-bottom:4px;margin-bottom:12px;scrollbar-width:none;}
.recipe-filter-row::-webkit-scrollbar{display:none;}
.recipe-filter-chip{flex-shrink:0;padding:7px 14px;border-radius:100px;border:1.5px solid var(--border2);background:#fff;font-size:12px;font-weight:700;cursor:pointer;color:var(--muted2);transition:all .15s;white-space:nowrap;}
.recipe-filter-chip.active{border-color:var(--green);background:var(--green-lt);color:var(--ink);box-shadow:0 0 0 2px var(--green-lt);}
.recipe-search-wrap{position:relative;margin-bottom:12px;}
.recipe-search-input{width:100%;padding:11px 14px 11px 42px;border:1.5px solid var(--border2);border-radius:12px;background:var(--paper2);font-family:var(--f);font-size:14px;color:var(--ink);outline:none;box-sizing:border-box;transition:border-color .15s,background .15s;}
.recipe-search-input:focus{border-color:var(--green);background:#fff;box-shadow:0 0 0 3px var(--green-lt);}
.recipe-search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none;}
.recipe-detail-hero{position:relative;margin:-1px -16px 0;}
.recipe-detail-img{width:100%;height:240px;object-fit:cover;display:block;}
.recipe-detail-img-placeholder{width:100%;height:200px;background:linear-gradient(135deg,var(--paper2),var(--border));display:flex;align-items:center;justify-content:center;font-size:80px;}
.recipe-detail-back{position:absolute;top:14px;left:14px;z-index:3;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.45);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;}
.recipe-detail-fav{position:absolute;top:14px;right:14px;z-index:3;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.45);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;}
.recipe-detail-title{font-size:24px;font-weight:900;color:var(--ink);letter-spacing:-.5px;line-height:1.2;margin-bottom:8px;}
.recipe-meta-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;}
.recipe-meta-pill{display:flex;align-items:center;gap:4px;padding:4px 10px;background:var(--paper2);border:1px solid var(--border);border-radius:100px;font-size:11px;font-weight:700;color:var(--muted2);}
.ingredient-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--border);}
.ingredient-row:last-child{border-bottom:none;}
.ingredient-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:2px;}
.step-row{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:opacity .2s;}
.step-row:last-child{border-bottom:none;}
.step-circle{width:32px;height:32px;border-radius:50%;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.servings-ctrl{display:flex;align-items:center;gap:10px;background:var(--paper2);border:1px solid var(--border);border-radius:10px;padding:5px 12px;}
.servings-btn{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--border2);background:#fff;cursor:pointer;font-size:16px;font-weight:700;color:var(--ink);display:flex;align-items:center;justify-content:center;line-height:1;transition:all .15s;font-family:var(--f);}
.servings-btn:hover{border-color:var(--green);color:var(--green);}
.servings-num{font-size:15px;font-weight:800;color:var(--ink);min-width:22px;text-align:center;}
.recipe-skeleton{background:#fff;border-radius:16px;overflow:hidden;border:1px solid var(--border);margin-bottom:12px;}
.skeleton-img{width:100%;height:140px;background:linear-gradient(90deg,var(--paper2) 25%,var(--border) 50%,var(--paper2) 75%);background-size:400% 100%;animation:shimmer 1.4s ease-in-out infinite;}
.skeleton-line{height:12px;border-radius:6px;background:linear-gradient(90deg,var(--paper2) 25%,var(--border) 50%,var(--paper2) 75%);background-size:400% 100%;animation:shimmer 1.4s ease-in-out infinite;margin-bottom:8px;}
@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
.youtube-btn{display:flex;align-items:center;gap:8px;padding:10px 16px;background:#FF0000;border:none;border-radius:10px;cursor:pointer;font-family:var(--f);font-size:13px;font-weight:700;color:#fff;width:100%;justify-content:center;transition:background .15s;margin-bottom:10px;}
.youtube-btn:hover{background:#CC0000;}

/* ── ACCESSIBILITY ── */
/* Minimum touch target 44x44px */
.btn{min-height:44px;}
.nav-item{min-height:44px;min-width:44px;}
.chip{min-height:44px;}
/* Focus synlig for keyboard-navigation */
*:focus-visible{outline:2.5px solid var(--green);outline-offset:2px;border-radius:4px;}
/* Skip-link for screen readers */
.skip-link{position:absolute;top:-100px;left:16px;background:var(--ink);color:#fff;padding:8px 16px;border-radius:8px;font-size:14px;font-weight:700;z-index:9999;text-decoration:none;}
.skip-link:focus{top:8px;}
/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;}
  .spinner{animation:none;border-color:var(--green);}
}
/* Bedre kontrast for muted tekst */
@media (prefers-contrast: more) {
  :root{--muted:#555;--muted2:#444;--border:#999;--border2:#777;}
}
/* Større tekst support */
@media (min-resolution: 2dppx) {
  .field{font-size:16px;} /* Undgår iOS zoom ved focus */
}
`;


// ─── HOVED KOMPONENT ─────────────────────────────────────────────────────────
export default function EatSafe() {
  // Auth state
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("as_token") || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("as_refresh") || null);
  const [userId, setUserId] = useState(() => localStorage.getItem("as_user_id") || null);

  // UI state
  const [screen, setScreen] = useState(accessToken ? SCREENS.HOME : SCREENS.WELCOME);
  const [onboardStep, setOnboardStep] = useState(1);
  const [editMode, setEditMode] = useState(false);

  // User data
  const [user, setUser] = useState({ name:"", age:"", email:"", phone:"", password:"", role:"" });
  const [allergens, setAllergens] = useState([]);
  const [customAllerg, setCustomAllerg] = useState([]);
  const [family, setFamily] = useState([]);
  const [activeProfiles, setActiveProfiles] = useState(["me"]);

  // Scan state
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [showIng, setShowIng] = useState(true); // Automatisk åben
  const [showNutrition, setShowNutrition] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const productCacheRef = useRef({}); // Cache af seneste 50 scannede produkter
  const [torchOn, setTorchOn] = useState(false);
  const [profilePopup, setProfilePopup] = useState(null); // id af profil der vises popup for
  const galleryInputRef = useRef(null);
  const torchTrackRef = useRef(null);
  const qrRef = useRef(null);
  const html5QrRef = useRef(null);

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Admin
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [adminSection, setAdminSection] = useState("dashboard");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminTicketFilter, setAdminTicketFilter] = useState("all");
  const [openAdminUser, setOpenAdminUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchParam, setUserSearchParam] = useState("all"); // all | name | email | role | onboarding
  const [openSubmission, setOpenSubmission] = useState(null);
  const [submissionFilter, setSubmissionFilter] = useState("pending");
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [cleaningOcr, setCleaningOcr] = useState(false);
  const [cleanedOcrText, setCleanedOcrText] = useState(null);

  // Shopping list
  const [shoppingList, setShoppingList] = useState([]);
  const [shoppingListId, setShoppingListId] = useState(null);
  const [newItemName, setNewItemName] = useState("");

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("alle");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
    const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("as_favorites") || "[]"); } catch { return []; }
  });
  const [madpasLang, setMadpasLang] = useState(() => localStorage.getItem("as_madpas_lang") || "en");
  const madpasActiveProfile = madpasProfileId === "self" ? null : family.find(m => m.id === madpasProfileId);
  const mpAllergens = madpasActiveProfile ? (madpasActiveProfile.allergens || []) : allergens;
  const mpCustom = madpasActiveProfile ? (madpasActiveProfile.customAllerg || []) : customAllerg;
  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [recipeFilter, setRecipeFilter] = useState("alle");
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [showSubmitRecipe, setShowSubmitRecipe] = useState(false);
  const [submitRecipe, setSubmitRecipe] = useState({ title:"", description:"", category:"aftensmad", tags:[] });
  const [submitSteps, setSubmitSteps] = useState([""]);
  const [submitIngredients, setSubmitIngredients] = useState([{ name:"", amount:"", unit:"" }]);
  const [submittingRecipe, setSubmittingRecipe] = useState(false);
  const [recipeTermsOpen, setRecipeTermsOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({});
  const [showManualEan, setShowManualEan] = useState(false);
  const [selectedENumbers, setSelectedENumbers] = useState([]);
  const [allergenSubtypes, setAllergenSubtypes] = useState({}); // { "laktose": "laktose_protein", ... }
  const [activeSubtypeModal, setActiveSubtypeModal] = useState(null); // allergen id der vises modal for
  const [eSearch, setESearch] = useState("");
  const [eCategory, setECategory] = useState("alle");
  const [recipeTermsAccepted, setRecipeTermsAccepted] = useState(false);
  const [madpasSpeaking, setMadpasSpeaking] = useState(false);
  const [madpasBig, setMadpasBig] = useState(false);
  const [madpasWaiterView, setMadpasWaiterView] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [showSafeOnly, setShowSafeOnly] = useState(false);
  const [recipeServings, setRecipeServings] = useState(4);
  const [editStep, setEditStep] = useState("start");
  const [editIngText, setEditIngText] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editType, setEditType] = useState(null);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeSafeOnly, setRecipeSafeOnly] = useState(false);

  // Family form
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAllerg, setNewMemberAllerg] = useState([]);
  const [newMemberCustomAllerg, setNewMemberCustomAllerg] = useState([]);
  const [newMemberDiets, setNewMemberDiets] = useState([]);
  const [newMemberENumbers, setNewMemberENumbers] = useState([]);
  const [newMemberSubtypes, setNewMemberSubtypes] = useState({});
  const [newMemberSubtypeModal, setNewMemberSubtypeModal] = useState(null);
  const [newMemberCustomInput, setNewMemberCustomInput] = useState("");
  const [customInput, setCustomInput] = useState("");

  // Auth form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authTab, setAuthTab] = useState("signup"); // signup | login

  // NOT FOUND flow
  const [notFoundEan, setNotFoundEan] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [editOcrText, setEditOcrText] = useState("");
  const [editOcrLoading, setEditOcrLoading] = useState(false);
  const [editProductImage, setEditProductImage] = useState(null);
  const [editProductImageB64, setEditProductImageB64] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [proposedFlags, setProposedFlags] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notFoundStep, setNotFoundStep] = useState(1); // 1=forside, 2=ingredienser, 3=bekræft
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourIdx, setTourIdx] = useState(0);
  const [isOAuth, setIsOAuth] = useState(false);
  const [feedbackType, setFeedbackType] = useState("bug");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackImage, setFeedbackImage] = useState(null);
  const [feedbackImageB64, setFeedbackImageB64] = useState(null);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [adminTickets, setAdminTickets] = useState([]);
  const [openTicket, setOpenTicket] = useState(null);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [proposedName, setProposedName] = useState("");
  const [productImageBase64, setProductImageBase64] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [ocrImageBase64, setOcrImageBase64] = useState(null);
  const [ocrImagePreview, setOcrImagePreview] = useState(null);

  // ── TOKEN HELPERS ──────────────────────────────────────────────────────────
  const saveTokens = useCallback((access, refresh, uid) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setUserId(uid);
    localStorage.setItem("as_token", access);
    localStorage.setItem("as_refresh", refresh);
    localStorage.setItem("as_user_id", uid);
  }, []);

  // Håndter OAuth callback — fang access_token fra URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.replace("#", "?").replace("#", "&"));
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    if (access && refresh) {
      try {
        const payload = JSON.parse(atob(access.split(".")[1]));
        const uid = payload.sub;
        saveTokens(access, refresh, uid);

        // Tjek om brugeren er ny — hent profil fra Supabase
        fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}&select=name,created_at,onboarding_completed`, {
          headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${access}`, "Accept": "application/json" },
        })
          .then(r => r.json())
          .then(data => {
            const profile = data?.[0];
            const createdAt = profile?.created_at ? new Date(profile.created_at) : null;
            // Ny bruger = onboarding ikke gennemført ELLER oprettet inden for 2 min
            const isNew = !profile || profile.onboarding_completed === false || !createdAt || (Date.now() - createdAt.getTime() < 120000);
            if (isNew) {
              const meta = payload.user_metadata || {};
              setUser(u => ({ ...u, email: payload.email || meta.email || "", name: meta.full_name || meta.name || "" }));
              setOnboardStep(1);
              setIsOAuth(true);
              setScreen(SCREENS.ONBOARD);
            } else {
              setScreen(SCREENS.HOME);
            }
          })
          .catch(() => setScreen(SCREENS.HOME));

        // Ryd URL hash
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("OAuth callback fejl:", e);
        setScreen(SCREENS.HOME);
      }
    }
  }, [saveTokens]);

  const clearAuth = useCallback(() => {
    setAccessToken(null); setRefreshToken(null); setUserId(null);
    localStorage.removeItem("as_token");
    localStorage.removeItem("as_refresh");
    localStorage.removeItem("as_user_id");
    setUser({ name:"", age:"", email:"", phone:"", password:"", role:"" });
    setAllergens([]); setCustomAllerg([]); setFamily([]); setHistory([]); setShoppingList([]);
    setScreen(SCREENS.WELCOME);
  }, []);

  // Auto-refresh token every 45 minutes
  useEffect(() => {
    if (!refreshToken) return;
    const refresh = async () => {
      try {
        const data = await apiCall(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: makeHeaders(null),
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (data.access_token) saveTokens(data.access_token, data.refresh_token, data.user?.id);
      } catch { /* silent */ }
    };
    const interval = setInterval(refresh, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshToken, saveTokens]);

  // ── LOAD USER DATA PÅ LOGIN ────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !userId) return;
    loadUserProfile();
    loadAllergens();
    loadFamily();
    loadHistory();
    loadShoppingList();
  }, [accessToken, userId]);

  const loadUserProfile = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
        headers: { ...makeHeaders(accessToken), "Accept": "application/json" },
      });
      if (data[0]) setUser(u => ({ ...u, ...data[0] }));
    } catch { /* silent */ }
  };

  const loadAllergens = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}&select=*`, {
        headers: { ...makeHeaders(accessToken), "Accept": "application/json" },
      });
      const standard = data.filter(a => a.type === "allergen").map(a => a.allergen);
      const custom = data.filter(a => a.type === "custom").map(a => a.allergen);
      setAllergens(standard);
      setCustomAllerg(custom);
    } catch { /* silent */ }
  };

  const loadFamily = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/family?user_id=${userId}`, {
        headers: makeHeaders(accessToken),
      });
      if (data.success && data.families) {
        const members = data.families.flatMap(f =>
          (f.managed_members || []).map(m => ({
            id: m.id,
            name: m.name,
            color: m.color || AVATAR_COLORS[0],
            allergens: m.allergens || [],
            custom: m.custom_allergens || [],
          }))
        );
        setFamily(members);
      }
    } catch { /* silent */ }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/history?user_id=${userId}&limit=50&offset=0`, {
        headers: makeHeaders(accessToken),
      });
      if (data.success && data.scans) setHistory(data.scans);
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  };

  const loadRecipes = async (filter = "alle") => {
    setRecipesLoading(true);
    try {
      let url = `${SUPABASE_URL}/rest/v1/recipes?select=id,title,category,image_url,tags,allergen_flags,servings,prep_time_minutes,cook_time_minutes,description&limit=50`;
      // Prøv med status filter først
      url += `&status=eq.approved`;
      if (filter !== "alle") {
        url += `&category=eq.${filter}`;
      }
      const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Accept": "application/json",
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      };
      const res = await fetch(url, { headers });
      const text = await res.text();
      if (!res.ok) {
        console.error("loadRecipes fejl:", res.status, text.slice(0, 200));
        // Fallback: prøv uden status filter
        const url2 = `${SUPABASE_URL}/rest/v1/recipes?select=id,title,category,image_url,tags,allergen_flags,servings,description&limit=50${filter !== "alle" ? `&category=eq.${filter}` : ""}`;
        const res2 = await fetch(url2, { headers });
        const data2 = await res2.json();
        setRecipes(Array.isArray(data2) ? data2 : []);
        return;
      }
      const data = JSON.parse(text);
      setRecipes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("loadRecipes fejl:", e.message);
      setRecipes([]);
    }
    setRecipesLoading(false);
  };

  const loadRecipeIngredients = async (recipeId) => {
    try {
      const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Accept": "application/json",
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      };
      // Hent fuld opskrift inkl. ingredients_raw og instructions
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/recipes?id=eq.${recipeId}&select=id,ingredients_raw,instructions`,
        { headers }
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        setSelectedRecipe(prev => prev ? { ...prev, ...data[0] } : prev);
      }
    } catch {}
    setRecipeIngredients([]);
  };

  const submitUserRecipe = async () => {
    if (!submitRecipe.title.trim() || submitIngredients.filter(i => i.name.trim()).length === 0) return;
    setSubmittingRecipe(true);
    try {
      const [recipe] = await apiCall(`${SUPABASE_URL}/rest/v1/recipes`, {
        method: "POST",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
        body: JSON.stringify({
          ...submitRecipe,
          instructions: JSON.stringify(submitSteps.filter(s => s.trim())),
          submitted_by: userId,
          source: "user",
          language: "da",
          status: "pending",
          disclaimer: "Allergener er vejledende. Tjek altid ingrediensernes emballage ved alvorlige allergier.",
        }),
      });
      for (let i = 0; i < submitIngredients.length; i++) {
        const ing = submitIngredients[i];
        if (!ing.name.trim()) continue;
        await apiCall(`${SUPABASE_URL}/rest/v1/recipe_ingredients`, {
          method: "POST",
          headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
          body: JSON.stringify({ recipe_id: recipe.id, name: ing.name, amount: ing.amount, unit: ing.unit, sort_order: i }),
        });
      }
      setShowSubmitRecipe(false);
      setSubmitRecipe({ title:"", description:"", category:"aftensmad", tags:[] });
      setSubmitSteps([""]);
      setSubmitIngredients([{ name:"", amount:"", unit:"" }]);
      alert("Tak! Din opskrift er sendt til godkendelse.");
    } catch (e) { alert("Fejl: " + e.message); }
    setSubmittingRecipe(false);
  };

  const loadShoppingList = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/shopping?user_id=${userId}`, {
        headers: makeHeaders(accessToken),
      });
      if (data.success && data.lists && data.lists.length > 0) {
        const list = data.lists[0];
        setShoppingListId(list.id);
        setShoppingList(list.items || []);
      } else {
        // Opret en standardliste
        const newList = await apiCall(`${SUPABASE_URL}/functions/v1/shopping`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ owner_id: userId, name: "Min indkøbsliste", type: "personal" }),
        });
        if (newList.success) { setShoppingListId(newList.list?.id); setShoppingList([]); }
      }
    } catch { /* silent */ }
  };

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  const loadSubmissions = async (filter) => {
    const f = filter || submissionFilter;
    if (f === "tickets") return;
    setSubmissionsLoading(true);
    try {
      const headers = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" };
      const url = `${SUPABASE_URL}/rest/v1/product_submissions?status=eq.${f}&order=created_at.desc&limit=100`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch { setSubmissions([]); }
    setSubmissionsLoading(false);
  };

  const loadAdminStats = async () => {
    try {
      const h = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json", "Prefer": "count=exact" };
      const hNoCount = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" };
      const today = new Date(); today.setHours(0,0,0,0);
      const todayISO = today.toISOString();

      const [users, products, scans, submissions, families, tickets, scansToday, newUsersToday] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/users?select=id`, { headers: h }).then(async r => { const ct = r.headers.get("content-range"); return ct ? parseInt(ct.split("/")[1]) : (await r.json()).length; }),
        fetch(`${SUPABASE_URL}/rest/v1/products?select=id`, { headers: h }).then(async r => { const ct = r.headers.get("content-range"); return ct ? parseInt(ct.split("/")[1]) : (await r.json()).length; }),
        fetch(`${SUPABASE_URL}/rest/v1/scan_history?select=id`, { headers: h }).then(async r => { const ct = r.headers.get("content-range"); return ct ? parseInt(ct.split("/")[1]) : (await r.json()).length; }),
        fetch(`${SUPABASE_URL}/rest/v1/product_submissions?status=eq.pending&select=id`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/family_members?select=id`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?status=eq.open&select=id`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/scan_history?select=id&scanned_at=gte.${todayISO}`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/users?select=id&created_at=gte.${todayISO}`, { headers: hNoCount }).then(r => r.json()),
      ]);

      setAdminStats({
        total_users:          typeof users === "number" ? users : (Array.isArray(users) ? users.length : 0),
        total_products:       typeof products === "number" ? products : (Array.isArray(products) ? products.length : 0),
        total_scans:          typeof scans === "number" ? scans : (Array.isArray(scans) ? scans.length : 0),
        pending_submissions:  Array.isArray(submissions) ? submissions.length : 0,
        total_families:       Array.isArray(families) ? families.length : 0,
        open_tickets:         Array.isArray(tickets) ? tickets.length : 0,
        scans_today:          Array.isArray(scansToday) ? scansToday.length : 0,
        new_users_today:      Array.isArray(newUsersToday) ? newUsersToday.length : 0,
      });
    } catch (e) { console.error("loadAdminStats fejl:", e.message); }
  };

  const cleanOcrWithAI = async (rawText) => {
    if (!rawText) return;
    setCleaningOcr(true);
    setCleanedOcrText(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Du er en assistent der renskriver ingredienslister fra OCR-scanning.

REGLER (MEGET VIGTIGT):
- Du må ALDRIG tilføje ingredienser der ikke er i originalteksten
- Du må ALDRIG fjerne ingredienser fra originalteksten
- Du må ALDRIG ændre mængdeangivelser (%, g, mg etc.)
- Du må kun rette åbenlyse OCR-fejl (fx "Hvedek|ad" → "Hvedeklid")
- Du må fjerne tekst der åbenlyst IKKE er ingredienser (fx "Opbevares køligt", "Bedst før", adresser, telefonnumre)
- Behold parenteser og underingredienser
- Formater som en kommasepareret liste

Renskiv denne ingrediensliste:
${rawText}

Svar KUN med den renskrevne ingrediensliste — ingen forklaring, ingen kommentar.`
          }]
        })
      });
      const data = await res.json();
      const cleaned = data.content?.[0]?.text?.trim();
      if (cleaned) setCleanedOcrText(cleaned);
    } catch (e) {
      alert("AI fejl: " + e.message);
    }
    setCleaningOcr(false);
  };

  const updateSubmissionAndApprove = async (submission, edits) => {
    try {
      const headers = { "Content-Type":"application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Prefer":"return=minimal" };
      // Opdater status i product_submissions tabellen
      const res = await fetch(`${SUPABASE_URL}/rest/v1/product_submissions?id=eq.${submission.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "approved",
          reviewed_by: userId,
          product_name: edits.name || submission.ai_parsed_data?.name || "Ukendt produkt",
          brand: edits.brand || submission.ai_parsed_data?.brand || null,
          ingredients: edits.ingredients_text || submission.ocr_raw_text || null,
          notes: `Godkendt af admin. Allergener: ${JSON.stringify(edits.allergen_flags || {})}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOpenSubmission(null);
      setEditingSubmission(null);
      // Reload med samme filter (pending) — submission forsvinder herfra
      await loadSubmissions("pending");
      loadAdminStats();
    } catch (e) {
      alert("Fejl ved godkendelse: " + e.message);
    }
  };

  const approveSubmission = async (submission) => {
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions/${submission.id}`, {
        method: "PATCH",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          status: "approved",
          reviewed_by: userId,
          name: submission.ai_parsed_data?.name || "Ukendt produkt",
          brand: submission.ai_parsed_data?.brand || null,
          ingredients_text: submission.ocr_raw_text || null,
          allergen_flags: submission.ai_parsed_data || null,
        }),
      });
      setSubmissions(s => s.filter(x => x.id !== submission.id));
    } catch (e) {
      alert("Fejl ved godkendelse: " + e.message);
    }
  };

  const rejectSubmission = async (id) => {
    try {
      const headers = { "Content-Type":"application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Prefer":"return=minimal" };
      await fetch(`${SUPABASE_URL}/rest/v1/product_submissions?id=eq.${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "rejected", reviewed_by: userId }),
      });
      setOpenSubmission(null);
      setEditingSubmission(null);
      await loadSubmissions("pending");
      loadAdminStats();
    } catch (e) {
      alert("Fejl ved afvisning: " + e.message);
    }
  };
  // ── FAVORITTER ────────────────────────────────────────────────────────────
  const toggleFavorite = (product) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.ean === product.ean || f.code === product.code);
      const updated = exists
        ? prev.filter(f => f.ean !== product.ean && f.code !== product.code)
        : [...prev, { ...product, savedAt: Date.now() }];
      localStorage.setItem("as_favorites", JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (ean) => favorites.some(f => f.ean === ean || f.code === ean);

  // ── AUTH ───────────────────────────────────────────────────────────────────
  const handleOAuth = async (provider) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const redirectTo = "https://eatsafe.dk/";
      const params = new URLSearchParams({
        provider,
        redirect_to: redirectTo,
        ...(provider === "google" ? { prompt: "select_account" } : {}),
      });
      window.location.href = `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;
    } catch (e) {
      setAuthError(`${provider} login fejlede: ${e.message}`);
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return;
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const text = await res.text();
      // Tjek for allowlist-fejl (returneres som plain text, ikke JSON)
      if (text === "Host not in allowlist") {
        setAuthError("⚙️ Supabase er ikke konfigureret til dette domæne. Jan skal tilføje denne sides URL i Supabase → Authentication → URL Configuration → Allowed Origins.");
        setAuthLoading(false); return;
      }
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error_description || data.message || "Login fejlede");
      saveTokens(data.access_token, data.refresh_token, data.user.id);
      setScreen(SCREENS.HOME);
    } catch (e) {
      if (e.message?.includes("allowlist") || e.message?.includes("Host")) {
        setAuthError("⚙️ Supabase er ikke konfigureret til dette domæne. Jan skal tilføje URL'en i Supabase → Authentication → URL Configuration.");
      } else {
        setAuthError("Forkert email eller kodeord. Prøv igen. (" + (e.message||"") + ")");
      }
    }
    setAuthLoading(false);
  };

  const handleSignup = async () => {
    if (!loginEmail || !loginPassword) return;
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const text = await res.text();
      if (text === "Host not in allowlist") {
        setAuthError("⚙️ Supabase er ikke konfigureret til dette domæne. Jan skal tilføje denne sides URL i Supabase → Authentication → URL Configuration → Allowed Origins.");
        setAuthLoading(false); return;
      }
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error_description || data.message || "Oprettelse fejlede");
      if (data.access_token) {
        saveTokens(data.access_token, data.refresh_token, data.user.id);
        setUser(u => ({ ...u, email: loginEmail }));
        setScreen(SCREENS.ONBOARD);
        setOnboardStep(1);
      } else {
        setAuthError("Tjek din email for bekræftelse — eller prøv at logge ind.");
      }
    } catch (e) {
      setAuthError(e.message || "Oprettelse fejlede. Prøv igen.");
    }
    setAuthLoading(false);
  };

  // ── ONBOARDING GEM ─────────────────────────────────────────────────────────
  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setFeedbackSending(true);
    try {
      // Saml al diagnostisk info automatisk
      const ctx = {
        screen,
        url: window.location.href,
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen_size: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine,
        timestamp: new Date().toISOString(),
        user_id: userId || null,
        user_name: user?.name || null,
        user_email: user?.email || loginEmail || null,
        user_role: user?.role || null,
        allergens_count: allergens.length,
        family_count: family.length,
        history_count: history.length,
        active_profiles: activeProfiles,
        app_version: "beta-1.0",
      };
      const headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      };
      await fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=minimal" },
        body: JSON.stringify({
          type: feedbackType,
          description: feedbackText,
          context: ctx,
          image_base64: feedbackImageB64 || null,
          status: "open",
          submitted_by: userId || null,
        }),
      });
      setFeedbackDone(true);
      setTimeout(() => { setFeedbackOpen(false); setFeedbackDone(false); setFeedbackText(""); setFeedbackImage(null); setFeedbackImageB64(null); setFeedbackType("bug"); }, 2000);
    } catch(e) { alert("Fejl: " + e.message); }
    setFeedbackSending(false);
  };

  const loadAdminUsers = async () => {
    setAdminUsersLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,name,email,role,created_at,onboarding_completed&order=created_at.desc&limit=1000`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json", "Prefer": "count=exact" },
      });
      const data = await res.json();
      setAdminUsers(Array.isArray(data) ? data : []);
    } catch { setAdminUsers([]); }
    setAdminUsersLoading(false);
  };

  const updateUserRole = async (uid, role) => {
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Prefer":"return=minimal" },
      body: JSON.stringify({ role }),
    });
    setAdminUsers(u => u.map(x => x.id === uid ? { ...x, role } : x));
  };

  const deleteUser = async (uid) => {
    if (!window.confirm("Er du sikker? Dette kan ikke fortrydes.")) return;
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}`, { method: "DELETE", headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}` } });
    setAdminUsers(u => u.filter(x => x.id !== uid));
  };

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?order=created_at.desc&limit=100`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" },
      });
      const data = await res.json();
      setAdminTickets(Array.isArray(data) ? data : []);
    } catch { setAdminTickets([]); }
    setTicketsLoading(false);
  };

  const updateTicketStatus = async (id, status) => {
    await fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Prefer":"return=minimal" },
      body: JSON.stringify({ status }),
    });
    setAdminTickets(t => t.map(x => x.id === id ? { ...x, status } : x));
    if (openTicket?.id === id) setOpenTicket(t => ({ ...t, status }));
  };

  // ── ONBOARDING GEM ─────────────────────────────────────────────────────────
  const saveProfileStep1 = async () => {
    if (!(user.name || "").trim()) return;
    const emailToSave = user.email || loginEmail || "";
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
        body: JSON.stringify({
          name: user.name,
          email: emailToSave || null,
          phone: user.phone || null,
          age: user.age ? parseInt(user.age) : null,
        }),
      });
      if (emailToSave) setUser(u => ({ ...u, email: emailToSave }));
    } catch { /* silent */ }
    setOnboardStep(4);
  };

  const saveAllergensStep2 = async () => {
    try {
      // Slet alle eksisterende, gem nye
      await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, {
        method: "DELETE",
        headers: makeHeaders(accessToken),
      });
      for (const a of allergens) {
        await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ user_id: userId, allergen: a, type: "allergen" }),
        });
      }
      for (const c of customAllerg) {
        await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ user_id: userId, allergen: c, type: "custom" }),
        });
      }
    } catch { /* silent */ }
    // step styres af knappen
  };

  const finishOnboard = async () => {
    // Marker onboarding som gennemført
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { "Content-Type":"application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Prefer":"return=minimal" },
        body: JSON.stringify({ onboarding_completed: true }),
      });
    } catch {}
    setScreen(SCREENS.HOME);
    setEditMode(false);
    setIsOAuth(false);
  };

  // ── SCANNING ───────────────────────────────────────────────────────────────
  const allActive = useCallback(() => {
    const ids = new Set(activeProfiles.includes("me") ? allergens : []);
    family.filter(m => activeProfiles.includes(m.id)).forEach(m => m.allergens.forEach(a => ids.add(a)));
    return { ids: [...ids], custom: [...customAllerg] };
  }, [allergens, customAllerg, family, activeProfiles]);

  const lastScannedRef = useRef(null); // Anti-duplikat
  const startCamera = async () => {
    if (cameraActive) return;
    setScanError("");
    setTorchOn(false);
    torchTrackRef.current = null;
    lastScannedRef.current = null;

    // Tjek browser-support
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Kamera ikke understøttet. Prøv Chrome eller Safari.");
      return;
    }

    // iPhone kræver simpel constraints — avancerede constraints fejler på Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const constraints = isIOS
      ? { video: { facingMode: { exact: "environment" } } }
      : { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } };

    // Bed om kamera-tilladelse
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = stream.getVideoTracks()[0];
      if (track) torchTrackRef.current = track;
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setScanError("Kamera-adgang nægtet. Gå til telefonens indstillinger og tillad kamera for denne app.");
      } else if (e.name === "NotFoundError") {
        setScanError("Intet kamera fundet på denne enhed.");
      } else if (e.name === "OverconstrainedError" && isIOS) {
        // iOS fallback — prøv uden exact
        try {
          const stream2 = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          stream2.getTracks().forEach(t => t.stop());
        } catch {
          setScanError("Kunne ikke starte kamera. Prøv at genindlæse siden.");
          return;
        }
      } else {
        setScanError("Kamera fejl: " + e.message);
        return;
      }
    }

    setCameraActive(true);
    await new Promise(r => setTimeout(r, isIOS ? 300 : 150)); // iOS har brug for lidt mere tid

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const readerId = "qr-reader-home";

      if (html5QrRef.current) {
        try { await html5QrRef.current.stop(); } catch {}
        html5QrRef.current = null;
      }

      const readerEl = document.getElementById(readerId);
      if (!readerEl) {
        setScanError("Kamera-element ikke fundet. Genindlæs siden.");
        setCameraActive(false);
        return;
      }

      html5QrRef.current = new Html5Qrcode(readerId, { verbose: false });

      const qrConfig = {
        fps: isIOS ? 10 : 20, // iOS klarer ikke 30fps
        qrbox: (w, h) => {
          const side = Math.min(w, h) * 0.8;
          return { width: Math.round(side), height: Math.round(side * 0.45) };
        },
        aspectRatio: isIOS ? undefined : 1.0, // iOS: lad den bestemme selv
        disableFlip: false,
        formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Alle stregkode-formater
        videoConstraints: isIOS
          ? { facingMode: { exact: "environment" } }
          : {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
              focusMode: "continuous",
              exposureMode: "continuous",
            },
      };

      await html5QrRef.current.start(
        { facingMode: isIOS ? { exact: "environment" } : "environment" },
        qrConfig,
        (code) => {
          // Anti-duplikat — ignorer samme kode inden for 2 sekunder
          const now = Date.now();
          if (lastScannedRef.current?.code === code && now - lastScannedRef.current.time < 2000) return;
          lastScannedRef.current = { code, time: now };

          // Vibration feedback
          if (navigator.vibrate) navigator.vibrate([40, 20, 40]);

          // Bip lyd
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 1800;
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.12);
          } catch {}

          stopCamera();
          lookupProduct(code);
        },
        () => {} // Scan fejl — stille fejl, kameraet fortsætter
      );

      // Opsnap video track til torch — vent lidt på iOS
      await new Promise(r => setTimeout(r, 500));
      const videoEl = document.querySelector("#qr-reader-home video");
      if (videoEl?.srcObject) {
        const track = videoEl.srcObject.getVideoTracks()[0];
        if (track) torchTrackRef.current = track;
      }

    } catch (e) {
      setCameraActive(false);
      // iPhone-venlig fejlbesked
      if (e.message?.includes("constraint") || e.message?.includes("Constraint")) {
        // Prøv igen uden constraints
        setTimeout(() => startCamera(), 500);
      } else {
        setScanError("Kamera kunne ikke starte. Prøv at lukke andre apps og prøv igen.");
      }
    }
  };

  const scanFromGallery = async (file) => {
    if (!file) return;
    setScanError("");
    setLoading(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader-gallery");
      const result = await scanner.scanFile(file, true);
      scanner.clear();
      lookupProduct(result);
    } catch (e) {
      setLoading(false);
      setScanError("Ingen stregkode fundet i billedet. Prøv et klarere billede.");
    }
  };

  const toggleTorch = async () => {
    try {
      // Find aktiv video track
      const videoEl = document.querySelector("#qr-reader-home video");
      const track = videoEl?.srcObject?.getVideoTracks?.()?.[0] || torchTrackRef.current;
      if (!track) return;
      const capabilities = track.getCapabilities?.();
      if (!capabilities?.torch) {
        setScanError("Lygte ikke understøttet på denne enhed.");
        return;
      }
      const newState = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: newState }] });
      setTorchOn(newState);
    } catch (e) {
      setScanError("Kunne ikke tænde lygte: " + e.message);
    }
  };

  const stopCamera = () => {
    if (html5QrRef.current) {
      html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
    // Sluk torch
    if (torchTrackRef.current) {
      try { torchTrackRef.current.applyConstraints({ advanced: [{ torch: false }] }); } catch {}
      torchTrackRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  useEffect(() => {
    if (screen !== SCREENS.HOME) stopCamera();
    if (screen === SCREENS.RECIPES && recipes.length === 0 && !recipesLoading) {
      loadRecipes("alle");
    }
  }, [screen]);

  // Intercepter Android/browser back-knap
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      // Gå tilbage i app-flow i stedet for at lukke
      if (activeSubtypeModal) { setActiveSubtypeModal(null); return; }
      if (madpasWaiterView) { setMadpasWaiterView(false); return; }
      if (showManualEan) { setShowManualEan(false); return; }
      if (showSubmitRecipe) { setShowSubmitRecipe(false); return; }
      if (selectedRecipe) { setSelectedRecipe(null); return; }
      if (screen === SCREENS.RESULT) { setScreen(SCREENS.HOME); return; }
      if (screen === SCREENS.SEARCH) { setScreen(SCREENS.HOME); return; }
      if (screen === SCREENS.LIST) { setScreen(SCREENS.HOME); return; }
      if (screen === SCREENS.FAVORITES) { setScreen(SCREENS.PROFILE); return; }
      if (screen === SCREENS.FAMILY) { setScreen(SCREENS.PROFILE); return; }
      if (screen === SCREENS.MADPAS) { setScreen(SCREENS.PROFILE); return; }
      if (screen === SCREENS.EDITPROFILE) { setScreen(SCREENS.PROFILE); return; }
      if (screen === SCREENS.SUGGEST_EDIT) { setScreen(SCREENS.RESULT); return; }
      if (screen === SCREENS.ADMIN) { setScreen(SCREENS.PROFILE); return; }
      if (screen === SCREENS.RECIPES) { setScreen(SCREENS.HOME); return; }
      if (screen === SCREENS.NOTFOUND) { setScreen(SCREENS.HOME); return; }
      // Hvis vi er på HOME, lad browser håndtere det
      window.history.pushState(null, "", window.location.href);
    };
    // Push en state så vi har noget at gå tilbage til
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [screen, activeSubtypeModal, madpasWaiterView, showManualEan, showSubmitRecipe, selectedRecipe]);

  const { ids: activeIds } = allActive();

  const lookupProduct = useCallback(async (ean) => {
    if (!ean?.trim()) return;
    
    // Vibrer ved scan
    if (navigator.vibrate) navigator.vibrate(40);
    
    // Tjek cache først
    const cached = productCacheRef.current[ean.trim()];
    if (cached) {
      setScanResult(cached);
      setScreen(SCREENS.RESULT);
      return;
    }
    
    setLoading(true); setScanResult(null); setScanError(""); setShowIng(false);
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/products/${ean.trim()}`, {
        headers: makeHeaders(accessToken),
      });

      if (!data.found) {
        // Produkt ikke fundet
        setNotFoundEan(ean.trim());
        await saveHistoryEntry(ean.trim(), null, "not_found", {});
        setLoading(false);
          setScreen(SCREENS.NOTFOUND);
        setNotFoundStep(1);
        setOcrText("");
        setProposedName("");
        setProposedFlags(Object.fromEntries(ALLERGENS.map(a => [a.id, false])));
        setProductImagePreview(null);
        setProductImageBase64(null);
        return;
      }

      const product = data.product;
      const flags = data.allergen_flags || {};
      const { status, matchedDanger, matchedWarning, hasUnknown } = compareAllergens(flags, activeIds);

      const flagList = [
        ...matchedDanger.map(id => ({ type:"bad", text:`Indeholder ${ALLERGENS.find(a=>a.id===id)?.label||id}` })),
        ...matchedWarning.map(id => ({ type:"maybe", text:`Kan indeholde spor af ${ALLERGENS.find(a=>a.id===id)?.label||id}` })),
        ...(hasUnknown ? [{ type:"maybe", text:"Visse allergener er ukendte — tjek altid pakken" }] : []),
        ...(matchedDanger.length===0 && matchedWarning.length===0 && !hasUnknown ? [{ type:"good", text:"Ingen af dine allergener fundet" }] : []),
      ];

      const headlines = { safe:"Sikkert produkt", danger:"Indeholder allergen", warn:"Mulige spor" };
      const summaries = {
        safe:"Ingen af dine registrerede allergener er fundet i dette produkt.",
        danger:`Produktet indeholder ${matchedDanger.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id).join(", ")}.`,
        warn:`Produktet kan indeholde spor af ${matchedWarning.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id).join(", ")}.`,
      };

      // Beregn per-familiemedlem påvirkning
      const familyImpact = [];
      if (family.length > 0) {
        for (const member of family.filter(m => activeProfiles.includes(m.id))) {
          const memberResult = compareAllergens(flags, member.allergens || []);
          if (memberResult.matchedDanger.length > 0 || memberResult.matchedWarning.length > 0) {
            familyImpact.push({
              name: member.name,
              color: member.color,
              danger: memberResult.matchedDanger,
              warning: memberResult.matchedWarning,
            });
          }
        }
      }

      const result = {
        code: ean.trim(),
        name: product.name || "Ukendt produkt",
        brand: product.brand || "",
        image_url: product.image_url || null,
        category: product.category || null,
        ingredients: data.ingredients?.raw_text || product.ingredients_text || product.ingredients?.raw_text || "",
        nutrition: data.nutrition || product.nutrition || null,
        verified_status: product.verified_status || "unverified",
        status,
        headline: headlines[status],
        summary: summaries[status],
        flags: flagList,
        allergen_flags: flags,
        matchedDanger,
        matchedWarning,
        familyImpact,
        source: data.source,
        hasUnknown,
        timestamp: Date.now(),
      };

      // Gem i cache (max 50 produkter)
      productCacheRef.current[ean.trim()] = result;
      const cacheKeys = Object.keys(productCacheRef.current);
      if (cacheKeys.length > 50) delete productCacheRef.current[cacheKeys[0]];
      
      setScanResult(result);
      setHistory(h => [result, ...h].slice(0, 50));
      await saveHistoryEntry(ean.trim(), product.id, status, flags);
      setScreen(SCREENS.RESULT);
    } catch (e) {
      setScanError("Der opstod en fejl. Tjek din forbindelse og prøv igen.");
    }
    setLoading(false);
  }, [accessToken, activeIds]);

  const saveHistoryEntry = async (ean, productId, result, flags) => {
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/history`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          user_id: userId,
          ean_scanned: ean,
          product_id: productId || null,
          result,
          flags_triggered: flags,
          active_profiles: activeProfiles,
        }),
      });
    } catch { /* silent */ }
  };

  // ── OCR FLOW ───────────────────────────────────────────────────────────────
  // Forsøg at udtrække produktnavn fra OCR tekst
  const extractProductName = (text) => {
    if (!text) return "";
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2 && l.length < 50);
    // Find linjer der ligner et produktnavn (ikke tal, ikke for korte)
    const candidates = lines.filter(l => 
      !/^[0-9\s\.,gkJ%]+$/.test(l) &&
      !/^(ingredienser|næringsindhold|opbevaring|bedst|energi|fedt|protein|salt|kulhydrat)/i.test(l) &&
      l.length > 3
    );
    return candidates[0] || "";
  };

  const handleProductImageCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      setProductImageBase64(base64);
      setProductImagePreview(URL.createObjectURL(file));

      // Brug Supabase OCR til at hente produktnavn fra forsidebilledet
      try {
        const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ image_base64: base64, mode: "product_name" }),
        });
        if (ocrData.success && ocrData.text) {
          // Ekstrakt produktnavn — første linje der ikke er tal/EAN
          const name = extractProductName(ocrData.text);
          if (name) setProposedName(name);
        }
      } catch { /* silent — bruger kan stadig skrive manuelt */ }
    } catch { setScanError("Billedet kunne ikke læses. Prøv igen."); }
    setOcrLoading(false);
    setNotFoundStep(2); // Gå automatisk til trin 2
  };

  const handleImageCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      setOcrImageBase64(base64);
      const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ image_base64: base64 }),
      });
      if (ocrData.success) {
        setOcrText(ocrData.text);
        if (!proposedName) setProposedName(extractProductName(ocrData.text));
        const allergenData = await apiCall(`${SUPABASE_URL}/functions/v1/allergens`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ text: ocrData.text }),
        });
        if (allergenData.success) setProposedFlags(allergenData.allergen_flags);
        setNotFoundStep(3); // Gå automatisk til bekræft
      } else {
        setScanError("Billedet kunne ikke læses. Prøv at tage et klarere billede.");
      }
    } catch { setScanError("Billedet kunne ikke analyseres. Prøv igen."); }
    setOcrLoading(false);
  };

  const handleEditIngredientCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditOcrLoading(true);
    try {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{ role:"user", content:[
            { type:"image", source:{ type:"base64", media_type:file.type, data:b64 } },
            { type:"text", text:"Udpak ingredienslisten fra dette billede. Returner kun den rene ingredienstekst, ingen forklaring." }
          ]}]
        })
      });
      const data = await resp.json();
      const text = data.content?.[0]?.text || "";
      setEditOcrText(text);
    } catch (e) { console.error(e); }
    setEditOcrLoading(false);
  };

  const handleEditProductCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setEditProductImage(url);
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = () => rej();
      r.readAsDataURL(file);
    });
    setEditProductImageB64(b64);
  };

  const submitProduct = async () => {
    setSubmitting(true);
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          ean: notFoundEan,
          submitted_by: userId,
          ocr_raw_text: ocrText,
          raw_label_image: ocrImageBase64 || null,
          ai_parsed_data: { ...proposedFlags, name: proposedName, product_image_base64: productImageBase64 },
          user_confirmed: true,
        }),
      });
      setScreen(SCREENS.SUBMITTED);
    } catch { setScanError("Indsendelse fejlede. Prøv igen."); }
    setSubmitting(false);
  };

  // ── INDKØBSLISTE ───────────────────────────────────────────────────────────
  const addToList = async (name) => {
    if (!name?.trim()) return;
    const tempId = uid();
    const newItem = { id: tempId, name: name.trim(), checked: false };
    setShoppingList(l => [...l, newItem]);
    setNewItemName("");
    try {
      if (shoppingListId) {
        const data = await apiCall(`${SUPABASE_URL}/functions/v1/shopping/${shoppingListId}/items`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ name: name.trim(), quantity: 1, added_by: userId }),
        });
        if (data.item?.id) setShoppingList(l => l.map(i => i.id === tempId ? { ...i, id: data.item.id } : i));
      }
    } catch { /* silent — keep optimistic update */ }
  };

  const toggleItem = async (id) => {
    const item = shoppingList.find(i => i.id === id);
    setShoppingList(l => l.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    try {
      if (shoppingListId) {
        await apiCall(`${SUPABASE_URL}/functions/v1/shopping/${shoppingListId}/items/${id}`, {
          method: "PATCH",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ checked: !item?.checked }),
        });
      }
    } catch { /* silent */ }
  };

  const removeItem = async (id) => {
    setShoppingList(l => l.filter(i => i.id !== id));
    try {
      if (shoppingListId) {
        await apiCall(`${SUPABASE_URL}/functions/v1/shopping/${shoppingListId}/items/${id}`, {
          method: "DELETE",
          headers: makeHeaders(accessToken),
        });
      }
    } catch { /* silent */ }
  };

  const clearDone = () => shoppingList.filter(i => i.checked).forEach(i => removeItem(i.id));

  // ── FAMILIE ────────────────────────────────────────────────────────────────
  const addMember = async () => {
    if (!newMemberName.trim()) return;
    const color = AVATAR_COLORS[family.length % AVATAR_COLORS.length];
    const tempMember = {
      id: uid(),
      name: newMemberName.trim(),
      allergens: newMemberAllerg,
      custom: newMemberCustomAllerg.filter(c => !c.endsWith("_intolerance")),
      diets: newMemberDiets,
      eNumbers: newMemberENumbers,
      subtypes: newMemberSubtypes,
      color
    };
    setFamily(f => [...f, tempMember]);
    setNewMemberName("");
    setNewMemberAllerg([]);
    setNewMemberCustomAllerg([]);
    setNewMemberDiets([]);
    setNewMemberENumbers([]);
    setNewMemberSubtypes({});
    setNewMemberCustomInput("");
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/family/members`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ user_id: userId, name: tempMember.name, color }),
      });
      if (data.member?.id) setFamily(f => f.map(m => m.id === tempMember.id ? { ...m, id: data.member.id } : m));
    } catch { /* silent */ }
  };

  const removeMember = async (id) => {
    setFamily(f => f.filter(m => m.id !== id));
    setActiveProfiles(a => a.filter(x => x !== id));
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/family/members/${id}`, {
        method: "DELETE",
        headers: makeHeaders(accessToken),
      });
    } catch { /* silent */ }
  };

  // ── SØGNING via Edge Function ───────────────────────────────────────────────

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchResults([]);
      const q = searchQuery.trim();

      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/search?q=${encodeURIComponent(q)}`,
          { headers: { "apikey": SUPABASE_ANON_KEY, ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}) } }
        );
        const data = await res.json();
        if (data.success) {
          setSearchResults((data.products || []).map(p => ({ ...p, source:"local", verified:p.verified_status, conflicts:[] })));
        }
      } catch {
        // silent
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, accessToken]);

    // ── HJÆLPEKOMPONENTER ──────────────────────────────────────────────────────

  // ── MADPAS SPEAK ────────────────────────────────────────────────────────────
  const madpasSpeak = () => {
    if (!window.speechSynthesis) return;
    if (madpasSpeaking) { window.speechSynthesis.cancel(); setMadpasSpeaking(false); return; }
    const lang = madpasLang;
    const bcp = MADPAS_LANGUAGES.find(l => l.code === lang)?.bcp || "en-US";

    // Byg præcis den tekst der vises på skærmen
    const introText = {
      da:"Hej! Jeg har nogle fødevareallergier og ønsker gerne din hjælp til at finde noget, jeg kan spise trygt.",
      en:"Hi! I have some food allergies and would love your help finding something safe for me to eat.",
      de:"Hallo! Ich habe einige Lebensmittelallergien und würde mich über Ihre Hilfe freuen.",
      fr:"Bonjour ! J'ai des allergies alimentaires et j'aurais besoin de votre aide.",
      es:"¡Hola! Tengo algunas alergias alimentarias y agradecería su ayuda.",
      it:"Ciao! Ho alcune allergie alimentari e apprezzerei il suo aiuto.",
      nl:"Hallo! Ik heb wat voedselallergieën en zou graag uw hulp willen.",
      pt:"Olá! Tenho algumas alergias alimentares e gostaria da sua ajuda.",
      pl:"Cześć! Mam kilka alergii pokarmowych i chciałbym prosić o pomoc.",
      sv:"Hej! Jag har några matallergier och skulle uppskatta din hjälp.",
      no:"Hei! Jeg har noen matallergier og ønsker gjerne din hjelp.",
      ja:"こんにちは！食物アレルギーがあります。安全な食事を見つけるお手伝いをお願いできますか。",
      zh:"您好！我有食物过敏，希望您能帮助我找到安全的食物。",
      ar:"مرحباً! لدي بعض الحساسية الغذائية وأود مساعدتك في إيجاد شيء آمن لي.",
      tr:"Merhaba! Gıda alerjilerim var ve güvenli bir şey bulmam için yardımınıza ihtiyacım var.",
      el:"Γεια σας! Έχω κάποιες αλλεργίες τροφίμων και θα εκτιμούσα τη βοήθειά σας.",
    };
    const cannotText = {
      da:"Jeg kan ikke spise", en:"I cannot eat", de:"Ich kann nicht essen",
      fr:"Je ne peux pas manger", es:"No puedo comer", it:"Non posso mangiare",
      nl:"Ik kan niet eten", pt:"Não posso comer", pl:"Nie mogę jeść",
      sv:"Jag kan inte äta", no:"Jeg kan ikke spise", ja:"食べられません",
      zh:"我不能吃", ar:"لا أستطيع تناول", tr:"Yiyemiyorum", el:"Δεν μπορώ να φάω",
    };
    const outroText = {
      da:"Tak for din hjælp — det betyder rigtig meget for mig.",
      en:"Thank you so much for your help — it means a lot to me.",
      de:"Vielen Dank für Ihre Hilfe — das bedeutet mir sehr viel.",
      fr:"Merci beaucoup pour votre aide — cela compte beaucoup pour moi.",
      es:"Muchas gracias por su ayuda — significa mucho para mí.",
      it:"Grazie mille per il suo aiuto — significa molto per me.",
      nl:"Heel erg bedankt voor uw hulp — dat betekent veel voor mij.",
      pt:"Muito obrigado pela sua ajuda — significa muito para mim.",
      pl:"Bardzo dziękuję za pomoc — wiele dla mnie znaczy.",
      sv:"Tack så mycket för din hjälp — det betyder mycket för mig.",
      no:"Tusen takk for hjelpen — det betyr mye for meg.",
      ja:"ご協力ありがとうございます。本当に助かります。",
      zh:"非常感谢您的帮助，对我来说意义重大。",
      ar:"شكراً جزيلاً على مساعدتك — هذا يعني لي الكثير.",
      tr:"Yardımınız için çok teşekkür ederim — bu benim için çok şey ifade ediyor.",
      el:"Σας ευχαριστώ πολύ για τη βοήθειά σας — σημαίνει πολλά για μένα.",
    };

    const parts = [];
    parts.push(introText[lang] || introText.en);

    // Allergener — samme rækkefølge og tekst som på skærmen
    const allItems = [...allergens, ...customAllerg.filter(c => !c.endsWith("_intolerance") && !allergens.includes(c))];
    allItems.forEach((item, i) => {
      if (typeof item !== "string") return;
      const a = ALLERGENS.find(x => x.id === item);
      const label = a ? (ALLERGEN_T[item]?.[lang]?.n || ALLERGEN_T[item]?.en?.n || a.label) : item;
      const ex = a ? ALLERGEN_EXAMPLES[item] : null;
      const exProducts = ex?.products?.[lang] || ex?.products?.en || [];
      const exIngredients = ex?.ingredients?.[lang] || ex?.ingredients?.en || [];
      const exText = [...exProducts.slice(0,3), ...exIngredients.slice(0,4)].join(", ");
      const prefix = i === 0 ? (cannotText[lang] || cannotText.en) + ": " : "";
      parts.push(prefix + label + (exText ? ". " + exText : ""));
    });

    // Diæt
    if (user.diets && user.diets.length > 0) {
      const dietNames = user.diets.map(d => DIETS.find(x=>x.id===d)?.label).filter(Boolean).join(", ");
      parts.push(dietNames);
    }

    // E-numre
    if (selectedENumbers && selectedENumbers.length > 0) {
      parts.push(selectedENumbers.join(", "));
    }

    parts.push(outroText[lang] || outroText.en);

    const utter = new SpeechSynthesisUtterance(parts.join(". "));
    utter.lang = bcp;
    utter.rate = 0.85;
    utter.onstart = () => setMadpasSpeaking(true);
    utter.onend = () => setMadpasSpeaking(false);
    utter.onerror = () => setMadpasSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const isOnboard = screen === SCREENS.WELCOME || screen === SCREENS.LOGIN || screen === SCREENS.ONBOARD || editMode;

  const FamilyChips = () => {
    const allIds = ["me", ...family.map(m => m.id)];
    const isAll = allIds.every(id => activeProfiles.includes(id));
    const toggleAll = () => setActiveProfiles(isAll ? ["me"] : allIds);
    const toggleOne = (id) => {
      if (isAll) { setActiveProfiles([id]); return; }
      const next = activeProfiles.includes(id) ? activeProfiles.filter(x => x !== id) : [...activeProfiles, id];
      setActiveProfiles(next.length === 0 ? [id] : next);
    };
    return (
      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
        <div className={`ap-chip${isAll?" on":""}`} onClick={toggleAll}>Hele familien</div>
        <div className={`ap-chip${!isAll&&activeProfiles.includes("me")?" on":""}`} onClick={() => toggleOne("me")}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"var(--green)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(user.name||"Mig")}</div>
          {(user.name||"Mig").split(" ")[0]}
        </div>
        {family.map(m => (
          <div key={m.id} className={`ap-chip${!isAll&&activeProfiles.includes(m.id)?" on":""}`} onClick={() => toggleOne(m.id)}>
            <div style={{width:20,height:20,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(m.name)}</div>
            {m.name.split(" ")[0]}
          </div>
        ))}
      </div>
    );
  };

  const StepBar = ({ total, current }) => (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:22 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`step-seg${i <= current-1 ? " done" : ""}`} />
      ))}
      <span className="step-num">{current}/{total}</span>
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour<5?"God nat":hour<10?"God morgen":hour<12?"God formiddag":hour<17?"God dag":hour<22?"God aften":"God nat";

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="app" role="application" aria-label="EatSafe">
        {/* Skip-link for tastatur/screen reader brugere */}
        <a href="#main-content" className="skip-link">Spring til indhold</a>

        {/* ══ VELKOMST ══ */}
        {screen === SCREENS.WELCOME && (
          <div className="welcome-screen fade-in">
            {/* Logo + wordmark som splash */}
            <div className="welcome-logo-wrap">
              <EatSafeLogo size={96} variant="light" />
              <div className="welcome-wordmark">
                <span className="welcome-wordmark-text">Eat<span>Safe</span></span>
              </div>
              <div className="welcome-tagline">Scan. Tjek. Spis trygt.</div>
            </div>

            <div className="welcome-divider" />

            {/* Features */}
            <div className="welcome-features">
              {[
                ["camera","Skan på sekunder","Hold kameraet over stregkoden og få svar med det samme"],
                ["family","Hele familien","Administrér allergiprofiler for alle i familien på ét sted"],
                ["cart","Smarte indkøbslister","Delte lister med allergencheck for hele familien"],
              ].map(([icon,title,text]) => (
                <div key={title} className="welcome-feat">
                  <div className="welcome-feat-icon"><Icon name={icon} size={20} color="var(--ink)" /></div>
                  <div className="welcome-feat-text"><strong>{title}</strong>{text}</div>
                </div>
              ))}
            </div>

            <button className="welcome-btn" onClick={() => { setAuthTab("signup"); setScreen(SCREENS.LOGIN); }}>Opret gratis konto →</button>
            <button className="welcome-btn-ghost" onClick={() => { setAuthTab("login"); setScreen(SCREENS.LOGIN); }}>Jeg har allerede en konto</button>

            {/* Privacy policy link */}
            <div style={{ marginTop:24, fontSize:11, color:"var(--muted)", lineHeight:1.6 }}>
              Ved at oprette en konto accepterer du vores{" "}
              <a href="/privacy.html" target="_blank" style={{ color:"var(--green)", fontWeight:600 }}>privatlivspolitik</a>
            </div>
          </div>
        )}

        {/* ══ LOGIN / REGISTRERING ══ */}
        {screen === SCREENS.LOGIN && (
          <div className="login-wrap fade-in">

            {/* Logo */}
            <div className="login-header">
              <div className="login-shield" style={{background:"none",padding:0,width:56,height:56}}><EatSafeLogo size={56} variant="light" /></div>
              <div className="login-title">Eat<span style={{color:"#22C55E",fontStyle:"italic"}}>Safe</span></div>
            </div>

            {/* Tab vælger */}
            <div className="tab-row">
              <div className={`tab${authTab==="signup"?" active":""}`} onClick={() => { setAuthTab("signup"); setAuthError(""); }}>Ny bruger</div>
              <div className={`tab${authTab==="login"?" active":""}`} onClick={() => { setAuthTab("login"); setAuthError(""); }}>Log ind</div>
            </div>

            {/* SIGNUP flow */}
            {authTab === "signup" && (
              <div className="fade-in">
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"var(--ink)" }}>Opret din gratis konto</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>Du opsætter dine allergier i næste trin</div>
                </div>
                <div className="card">
                  <label className="field-lbl">Email</label>
                  <input className="field" type="email" placeholder="din@email.dk" value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)} style={{ marginBottom:12 }}
                    onKeyDown={e => e.key==="Enter" && handleSignup()} />
                  <label className="field-lbl">Vælg kodeord</label>
                  <input className="field" type="password" placeholder="Minimum 8 tegn" value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleSignup()} />
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:8, lineHeight:1.5 }}>
                    Ved at oprette en konto accepterer du vores vilkår og bekræfter at du er over 13 år.
                  </div>
                </div>
                {authError && (
                  <div className="error-box" style={{ flexDirection:"column", alignItems:"flex-start", gap:4 }}>
                    <span style={{ fontWeight:800 }}>⚠️ Fejl</span>
                    <span style={{ fontWeight:500, fontSize:12, lineHeight:1.5 }}>{authError}</span>
                  </div>
                )}
                <button className="btn btn-primary btn-full" onClick={handleSignup} disabled={authLoading}>
                  {authLoading ? "Opretter konto…" : "Opret konto og fortsæt →"}
                </button>
                <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"var(--muted)" }}>
                  Har du allerede en konto?{" "}
                  <span style={{ color:"var(--green)", fontWeight:700, cursor:"pointer" }} onClick={() => { setAuthTab("login"); setAuthError(""); }}>
                    Log ind her
                  </span>
                </div>
              </div>
            )}

            {/* LOGIN flow */}
            {authTab === "login" && (
              <div className="fade-in">
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"var(--ink)" }}>Velkommen tilbage</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>Log ind med din email og kodeord</div>
                </div>
                <div className="card">
                  <label className="field-lbl">Email</label>
                  <input className="field" type="email" placeholder="din@email.dk" value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)} style={{ marginBottom:12 }}
                    onKeyDown={e => e.key==="Enter" && handleLogin()} />
                  <label className="field-lbl">Kodeord</label>
                  <input className="field" type="password" placeholder="Dit kodeord" value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleLogin()} />
                </div>
                {authError && (
                  <div className="error-box" style={{ flexDirection:"column", alignItems:"flex-start", gap:4 }}>
                    <span style={{ fontWeight:800 }}>⚠️ Fejl</span>
                    <span style={{ fontWeight:500, fontSize:12, lineHeight:1.5 }}>{authError}</span>
                  </div>
                )}
                <button className="btn btn-primary btn-full" onClick={handleLogin} disabled={authLoading}>
                  {authLoading ? "Logger ind…" : "Log ind →"}
                </button>
                <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"var(--muted)" }}>
                  Har du ikke en konto?{" "}
                  <span style={{ color:"var(--green)", fontWeight:700, cursor:"pointer" }} onClick={() => { setAuthTab("signup"); setAuthError(""); }}>
                    Opret en her
                  </span>
                </div>
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"14px 0 10px" }}>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
              <span style={{ fontSize:12, color:"var(--muted)", fontWeight:600 }}>eller log ind med</span>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
            </div>

            {/* Social login knapper */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
              {/* Google */}
              <button onClick={() => handleOAuth("google")} disabled={authLoading}
                style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"13px 16px",
                  background:"#fff", border:"1.5px solid var(--border2)", borderRadius:12,
                  cursor:"pointer", fontFamily:"var(--f)", fontSize:14, fontWeight:600, color:"var(--ink)",
                  boxShadow:"var(--sh)", transition:"all .15s" }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Fortsæt med Google
              </button>

              {/* Facebook */}
              <button onClick={() => handleOAuth("facebook")} disabled={authLoading}
                style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"13px 16px",
                  background:"#1877F2", border:"1.5px solid #1877F2", borderRadius:12,
                  cursor:"pointer", fontFamily:"var(--f)", fontSize:14, fontWeight:600, color:"#fff",
                  boxShadow:"var(--sh)", transition:"all .15s" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Fortsæt med Facebook
              </button>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 8px" }}>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
              <span style={{ fontSize:11, color:"var(--muted)", fontWeight:500 }}>eller</span>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
            </div>
            <button className="btn btn-ghost btn-full" onClick={() => {
              setUser({ name:"Jan", age:"", email:"jan@preview.dk", phone:"" });
              setAllergens(["gluten", "laktose"]);
              setCustomAllerg(["Fructose"]);
              setActiveProfiles(["me", "f1", "f2", "f3", "f4"]);
              setFamily([
                { id:"f1", name:"Frederikke", allergens:["laktose","aeg"], custom:[], diets:["vegetarian"], color:"#74c69d" },
                { id:"f2", name:"Tage", allergens:["jordnoedder","noedder"], custom:[], diets:[], color:"#40916c" },
                { id:"f3", name:"Sofie", allergens:["sesam","soja","fisk"], custom:["Kiwi"], diets:["vegan","gluten-free"], color:"#f4a261" },
                { id:"f4", name:"Mads", allergens:[], custom:["Sukker"], diets:["keto"], color:"#2d6a4f" },
              ]);
              setHistory([
                {code:"3017620422003",name:"Nutella",brand:"Ferrero",status:"danger",result:"danger",headline:"Indeholder nødder!",summary:"Produktet indeholder hasselnødder.",flags:[{type:"bad",text:"Indeholder hasselnødder"}],timestamp:Date.now()-180000,scanned_at:new Date(Date.now()-180000).toISOString()},
                {code:"5449000054227",name:"Coca-Cola",brand:"Coca-Cola",status:"safe",result:"safe",headline:"Sikkert produkt",summary:"Ingen allergener fundet.",flags:[{type:"good",text:"Ingen kendte allergener"}],timestamp:Date.now()-7200000,scanned_at:new Date(Date.now()-7200000).toISOString()},
              ]);
              setShoppingList([{id:"s1",name:"Glutenfri pasta",checked:false},{id:"s2",name:"Havremælk",checked:true}]);
              setScreen(SCREENS.HOME);
            }}>
              Prøv app uden login (preview)
            </button>

            <button className="btn btn-ghost btn-full btn-sm" style={{ marginTop:8, opacity:0.5, fontSize:12 }}
              onClick={() => {
                setOnboardStep(1);
                setAllergens([]);
                setCustomAllerg([]);
                setFamily([]);
                setUser({ name:"", age:"", email:"", phone:"" });
                setScreen(SCREENS.ONBOARD);
              }}>
              🧪 Test onboarding
            </button>
            
          </div>
        )}

        {/* ══ ONBOARDING ══ */}
        {(screen === SCREENS.ONBOARD || editMode) && (
          <div className="onboard-wrap fade-in">
            {!editMode && (
              <div style={{ textAlign:"center", padding:"4px 0 20px" }}>
                <div style={{ marginBottom:6 }}><EatSafeLogo size={40} variant="light" /></div>
                <div style={{ fontSize:20, fontWeight:800, color:"var(--text)" }}>Opsæt din profil</div>
                <div style={{ fontSize:13, color:"var(--muted)", marginTop:4 }}>Tager under 2 minutter</div>
              </div>
            )}
            {editMode && <div style={{ height:4 }} />}
            {/* Step header med tilbage og fremgang */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              {onboardStep > 1 && (
                <button onClick={() => setOnboardStep(onboardStep - 1)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:"4px 0", flexShrink:0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2">
                    <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
              )}
              <div style={{ flex:1 }}>
                <StepBar total={10} current={onboardStep === 25 ? 3 : onboardStep > 25 ? onboardStep - 1 : onboardStep} />
              </div>
            </div>

            {/* ── TRIN 1: Hvad er EatSafe ── */}
            {onboardStep === 1 && (
              <div className="fade-in">
                <div className="card" style={{ textAlign:"center", padding:"24px 20px 16px" }}>
                  <div style={{ marginBottom:10 }}><Icon name="list" size={48} color="var(--ink2)" /></div>
                  <div style={{ fontSize:19, fontWeight:900, color:"var(--ink)", marginBottom:8 }}>Velkommen til EatSafe</div>
                  <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.6 }}>Din personlige allergiguide — til dig og hele familien.</div>
                </div>

                {/* Feature tour — swipeable kort */}
                {[
                  { emoji:"📷", bg:"#1F2733", color:"#fff", title:"Skan på sekunder", desc:"Hold kameraet over en stregkode. EatSafe fortæller dig øjeblikkeligt om produktet er sikkert for dig.", tags:["Øjeblikkelig scanning","Vibration ved fund","Historik"] },
                  { emoji:"👨‍👩‍👧", bg:"#22C55E", color:"#fff", title:"Hele familien", desc:"Opret profiler for børn, partner og andre. Se på ét blik hvem der kan spise hvad.", tags:["Individuelle profiler","Fælles oversigt","Børnevenlig"] },
                  { emoji:"🍝", bg:"#6366F1", color:"#fff", title:"Sikre opskrifter", desc:"Over 600 opskrifter filtreret til netop din families præferencer. Med ingrediensliste og fremgangsmåde.", tags:["600+ opskrifter","Allergenfiltreret","Skalerbar portion"] },
                  { emoji:"🌍", bg:"#F59E0B", color:"#fff", title:"Madpas til udlandet", desc:"Vis tjenere dine allergier på 17 sprog. Med udtale og forklaring på det lokale sprog.", tags:["17 sprog","Tekst-til-tale","Offline"] },
                ].map((f, i) => i === tourIdx ? (
                  <div key={i} style={{ marginBottom:4 }}>
                    <div style={{ background:f.bg, borderRadius:18, padding:"20px", marginBottom:10 }}>
                      <div style={{ fontSize:36, marginBottom:8 }}>{f.emoji}</div>
                      <div style={{ fontSize:18, fontWeight:900, color:f.color, marginBottom:6 }}>{f.title}</div>
                      <div style={{ fontSize:13, color:f.color, opacity:0.8, lineHeight:1.65, marginBottom:8 }}>{f.desc}</div>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {f.tags.map(t => <span key={t} style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:100, background:"rgba(255,255,255,.15)", color:f.color }}>{t}</span>)}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:10 }}>
                      {[0,1,2,3].map(idx => (
                        <div key={idx} onClick={() => setTourIdx(idx)}
                          style={{ width: tourIdx===idx ? 20 : 7, height:7, borderRadius:4, background: tourIdx===idx ? "var(--ink)" : "var(--border2)", cursor:"pointer", transition:"all .25s" }} />
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      {tourIdx > 0 && (
                        <button onClick={() => setTourIdx(v => v-1)}
                          style={{ flex:1, padding:"12px", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--ink2)", cursor:"pointer" }}>
                          ← Forrige
                        </button>
                      )}
                      {tourIdx < 3 ? (
                        <button onClick={() => setTourIdx(v => v+1)}
                          style={{ flex:1, padding:"12px", background:"var(--ink)", border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer" }}>
                          Næste →
                        </button>
                      ) : (
                        <button onClick={() => setOnboardStep(2)}
                          style={{ flex:1, padding:"12px", background:"var(--green)", border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:14, fontWeight:800, color:"#fff", cursor:"pointer" }}>
                          Kom i gang →
                        </button>
                      )}
                    </div>
                    {tourIdx < 3 && (
                      <button onClick={() => setOnboardStep(2)}
                        style={{ width:"100%", background:"none", border:"none", padding:"10px", fontFamily:"var(--f)", fontSize:12, color:"var(--muted)", cursor:"pointer", marginTop:4 }}>
                        Spring over
                      </button>
                    )}
                  </div>
                ) : null)}
              </div>
            )}
            {onboardStep === 2 && (
              <div className="fade-in">
                <div className="card" style={{ textAlign:"center", padding:"20px 20px 14px" }}>
                  <div style={{ marginBottom:8 }}><Icon name="info" size={44} color="var(--ink2)" /></div>
                  <div style={{ fontSize:17, fontWeight:900, color:"var(--ink)", marginBottom:6 }}>Forstå vores data</div>
                  <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>Vi arbejder hårdt for at give dig pålidelig information — men det er vigtigt du forstår kilden.</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    ["check","Verificerede produkter","Gennemgået og godkendt af vores team.","var(--green-lt)","var(--green)"],
                    ["globe","Open Food Facts","Global frivillig database. Ikke garanteret korrekt.","var(--amber-lt)","var(--amber)"],
                    ["warning","Bruger-indsendte","Afventer godkendelse. Brug med forsigtighed.","var(--red-lt)","var(--red)"],
                  ].map(([icon, title, text, bg, color]) => (
                    <div key={title} style={{ background:bg, border:`1px solid ${color}`, borderRadius:12, padding:"10px 14px", display:"flex", gap:10, alignItems:"flex-start" }}>
                      <div style={{ flexShrink:0 }}><Icon name={icon} size={18} color={color} /></div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color, marginBottom:2 }}>{title}</div>
                        <div style={{ fontSize:11, color:"var(--muted2)", lineHeight:1.4 }}>{text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:12, padding:"12px", marginTop:8 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>Vigtigt</div>
                  <div style={{ fontSize:11, color:"var(--muted2)", lineHeight:1.6 }}>EatSafe <strong>erstatter ikke lægehjælp</strong>. Tjek altid den originale emballage ved alvorlige allergier. <strong>Brug på eget ansvar.</strong></div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(1)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setOnboardStep(25)}>Jeg forstår →</button>
                </div>
              </div>
            )}

            {/* ── TRIN 2.5: Hvad kan EatSafe? ── */}
            {onboardStep === 25 && (
              <div className="fade-in">
                <div style={{ textAlign:"center", marginBottom:20 }}>
                  <div style={{ fontSize:48, marginBottom:8 }}>✨</div>
                  <div className="step-title">EatSafe kan mere end allergier</div>
                  <div className="step-sub">Appen dækker tre typer fødevarepræferencer</div>
                </div>

                {[
                  {
                    emoji:"🚨",
                    color:"var(--red)",
                    bg:"var(--red-lt)",
                    border:"var(--red-md)",
                    title:"Allergier",
                    desc:"Livstruende reaktioner på fx gluten, nødder, skaldyr og mælk. Vi advarer tydeligt og kategorisk.",
                    examples:["Glutenallergi (cøliaki)","Nøddeallergi","Laktoseallergi","Skaldyrsallergi"],
                  },
                  {
                    emoji:"⚠️",
                    color:"var(--amber)",
                    bg:"var(--amber-lt)",
                    border:"var(--amber-md)",
                    title:"Intoleranser & E-numre",
                    desc:"Ubehag uden livstruende reaktion. Vi viser advarsler og fremhæver relevante E-numre i ingredienslister.",
                    examples:["Laktoseintolerance","Fruktoseintolerance","E-numre som E621 (MSG)","Histaminintolerance"],
                  },
                  {
                    emoji:"🌱",
                    color:"var(--green)",
                    bg:"var(--green-lt)",
                    border:"var(--green-mid)",
                    title:"Diæter & valg",
                    desc:"Personlige valg og livsstil. Vi filtrerer produkter og opskrifter der passer til dig.",
                    examples:["Vegansk","Vegetarisk","Halal / Kosher","Lavkulhydrat / Keto"],
                  },
                ].map(cat => (
                  <div key={cat.title} style={{ background:cat.bg, border:`1px solid ${cat.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:24 }}>{cat.emoji}</span>
                      <div style={{ fontSize:14, fontWeight:800, color:cat.color }}>{cat.title}</div>
                    </div>
                    <div style={{ fontSize:12, color:"var(--ink2)", lineHeight:1.6, marginBottom:8 }}>{cat.desc}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {cat.examples.map(e => (
                        <span key={e} style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:100, background:"rgba(255,255,255,.6)", color:"var(--ink2)" }}>{e}</span>
                      ))}
                    </div>
                  </div>
                ))}

                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(2)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setOnboardStep(3)}>Fortsæt →</button>
                </div>
              </div>
            )}

            {/* ── TRIN 3: Din profil ── */}
            {onboardStep === 3 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">Din profil</div>
                  <div className="step-sub">Fortæl os lidt om dig.</div>
                  {[
                    ["Dit fulde navn *","text","Fx. Anna Hansen","name"],
                    ["Email *","email","din@email.dk","email"],
                    ["Telefon","tel","+45 12 34 56 78","phone"],
                    ["Alder","number","Fx. 32","age"],
                  ].map(([lbl,type,ph,key]) => (
                    <div key={key} style={{ marginBottom:10 }}>
                      <label className="field-lbl">{lbl}</label>
                      <input className="field" type={type} placeholder={ph} value={user[key]||""} onChange={e => setUser(u => ({ ...u, [key]: e.target.value }))}
                        style={key==="email" ? { background: user.email ? "var(--paper2)" : "var(--paper2)", opacity: loginEmail ? 0.6 : 1 } : {}} 
                        readOnly={key === "email" && (!!loginEmail || isOAuth)}
                      />
                      {key === "email" && isOAuth && (
                        <div style={{ fontSize:10, color:"var(--green)", marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                          Bekræftet via Google
                        </div>
                      )}
                    </div>
                  ))}
                  <label className="field-lbl">Køn</label>
                  <div style={{ display:"flex", gap:8, marginBottom:4 }}>
                    {["Mand","Kvinde","Andet"].map(g => (
                      <div key={g} onClick={() => setUser(u => ({...u, gender:g}))}
                        style={{ flex:1, padding:"9px 0", textAlign:"center", borderRadius:8,
                          border:`1.5px solid ${user.gender===g?"var(--green)":"var(--border)"}`,
                          background:user.gender===g?"var(--green-lt)":"#fff",
                          fontSize:13, fontWeight:700,
                          color:user.gender===g?"var(--green)":"var(--muted)", cursor:"pointer" }}>
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary btn-full" onClick={saveProfileStep1}
                  disabled={!(user.name||"").trim() || !(user.email||loginEmail||"").trim()}>
                  Fortsæt →
                </button>
                {(!(user.name||"").trim() || !(user.email||loginEmail||"").trim()) && (
                  <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", marginTop:6 }}>
                    {!(user.name||"").trim() ? "Navn er påkrævet" : "Email er påkrævet"}
                  </div>
                )}
              </div>
            )}

            {/* ── TRIN 4: Dine allergier / intolerancer ── */}
            {onboardStep === 4 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">Allergier / intolerancer</div>

                  {/* Forklaring på farver */}
                  <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                    {[["var(--border)","var(--ink)","Ingen"],["var(--amber)","var(--amber)","Intolerance"],["var(--red)","var(--red)","Allergi"]].map(([border,color,label]) => (
                      <div key={label} style={{ flex:1, display:"flex", alignItems:"center", gap:5, padding:"5px 8px", border:`1.5px solid ${border}`, borderRadius:8, background: color==="var(--ink)"?"var(--paper2)":color==="var(--amber)"?"var(--amber-lt)":"var(--red-lt)" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }}/>
                        <span style={{ fontSize:10, fontWeight:700, color }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:12, lineHeight:1.4 }}>
                    Tryk 1x = Intolerance &nbsp;·&nbsp; 2x = Allergi &nbsp;·&nbsp; 3x = Fjern
                  </div>

                  <div className="chip-grid">
                    {ALLERGENS.map(a => {
                      const isAllergen = allergens.includes(a.id) && !customAllerg.includes(a.id+"_intolerance");
                      const isIntolerance = allergens.includes(a.id) && customAllerg.includes(a.id+"_intolerance");
                      const state = isAllergen ? "allergen" : isIntolerance ? "intolerance" : "none";
                      const bg = state==="allergen"?"var(--red-lt)":state==="intolerance"?"var(--amber-lt)":"var(--paper2)";
                      const border = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--border)";
                      const color = state==="allergen"?"var(--red)":state==="intolerance"?"var(--amber)":"var(--ink)";
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
                          {state!=="none" && allergenSubtypes[a.id] && (
                            <div style={{ fontSize:8, fontWeight:800, color, opacity:0.8 }}>✓ Præciseret</div>
                          )}
                          {state!=="none" && !allergenSubtypes[a.id] && (
                            <div style={{ fontSize:8, fontWeight:800, color }}>{state==="allergen"?"Allergi":"Intolerance"}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Præciser valgte allergier */}
                  {allergens.length > 0 && allergens.some(id => ALLERGEN_SUBTYPES[id]) && (
                    <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid var(--border)" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>Tilpas din allergi præcist til dig selv</div>
                      <div style={{ fontSize:11, color:"var(--muted)", marginBottom:10, lineHeight:1.5 }}>
                        For størst mulig tryghed kan du præcisere hvad du reagerer på inden for hver kategori.
                      </div>
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
                                <div style={{ fontSize:11, color:"var(--muted2)", marginTop:2 }}>
                                  {subtypeLabel || "Tryk for at præcisere →"}
                                </div>
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

                  {/* Skriv selv */}
                  <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid var(--border)" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Kan ikke finde din allergi?</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.5 }}>Skriv det selv herunder. Vi tilføjer løbende flere valgmuligheder med større sikkerhed.</div>
                    <div className="input-row" style={{ marginBottom: customAllerg.filter(c=>!c.endsWith("_intolerance")).length ? 8 : 0 }}>
                      <input className="field" placeholder="Fx. Fructose…" value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        onKeyDown={e => { if (e.key==="Enter"&&customInput.trim()) { setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}} />
                      <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}}>+</button>
                    </div>
                    {customAllerg.filter(c=>!c.endsWith("_intolerance")).length > 0 && (
                      <div className="tags">
                        {customAllerg.filter(c=>!c.endsWith("_intolerance")).map((a,i) => (
                          <div key={i} className="tag">{a}<span className="tag-x" onClick={() => setCustomAllerg(c=>c.filter(x=>x!==a))}>×</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button className="btn btn-primary btn-full" onClick={async () => { await saveAllergensStep2(); setOnboardStep(5); }}>Fortsæt →</button>
                <div className="onboard-skip">Kan springes over</div>
              </div>
            )}

            {/* ── TRIN 5: E-numre ── */}
            {onboardStep === 5 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">E-numre</div>
                  <div className="step-sub">Vælg E-numre du ønsker at undgå. Vi markerer dem i ingredienslister.</div>

                  {/* Mest valgte */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Mest valgte</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {[
                        {e:"E621",n:"MSG - Smagsforstærker"},
                        {e:"E211",n:"Natriumbenzoat (konservering)"},
                        {e:"E102",n:"Tartrazin (gul farve)"},
                        {e:"E951",n:"Aspartam (sødemiddel)"},
                        {e:"E250",n:"Natriumnitrit (konservering)"},
                        {e:"E320",n:"BHA (antioxidant)"},
                      ].map(({e,n}) => {
                        const on = selectedENumbers.includes(e);
                        return (
                          <div key={e} onClick={() => setSelectedENumbers(p => on ? p.filter(x=>x!==e) : [...p,e])}
                            style={{ padding:"6px 12px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:700,
                              background: on?"var(--red-lt)":"var(--paper2)",
                              color: on?"var(--red)":"var(--ink2)",
                              border:`1.5px solid ${on?"var(--red)":"var(--border)"}` }}>
                            {e} {on?"✓":""}
                            <div style={{ fontSize:10, fontWeight:400, color: on?"var(--red)":"var(--muted)" }}>{n}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <ENumberPicker selected={selectedENumbers} onChange={setSelectedENumbers} />
                  <div style={{ marginTop:10, fontSize:11, color:"var(--muted)", lineHeight:1.5, paddingTop:10, borderTop:"1px solid var(--border)" }}>
                    Kan du ikke finde det du leder efter? Vi tilføjer løbende flere valgmuligheder med større sikkerhed.
                  </div>
                </div>

                <button className="btn btn-primary btn-full" onClick={() => setOnboardStep(6)}>Fortsæt →</button>
                <div className="onboard-skip">Kan springes over</div>
              </div>
            )}

            {/* ── TRIN 7: Familie ── */}
            {onboardStep === 7 && (
              <div className="fade-in">
                <div className="step-title" style={{ textAlign:"center" }}>Familiemedlemmer</div>
                <div style={{ fontSize:13, color:"var(--muted2)", textAlign:"center", marginBottom:16 }}>Tilføj familiemedlemmer med egne allergier. Valgfrit.</div>

                {/* Allerede tilføjede */}
                {family.length > 0 && (
                  <div className="card" style={{ marginBottom:12 }}>
                    {family.map(m => (
                      <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                        <div className="fm-avatar" style={{ background:m.color, color:"#fff" }}>{initials(m.name)}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:800, fontSize:14 }}>{m.name}</div>
                          <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                            {m.allergens.length ? m.allergens.map(id => ALLERGENS.find(a=>a.id===id)?.label).join(", ") : "Ingen allergier"}
                          </div>
                        </div>
                        <div onClick={() => removeMember(m.id)} style={{ cursor:"pointer", opacity:.4 }}>
                          <Icon name="trash" size={18} color="var(--muted)" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tilføj nyt medlem */}
                <div className="card" style={{ marginBottom:12 }}>
                  <div className="card-lbl" style={{ marginBottom:12 }}>Tilføj nyt familiemedlem</div>
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

                <button className="btn btn-primary btn-full" onClick={() => setOnboardStep(8)}>Fortsæt →</button>
                <div className="onboard-skip">Kan springes over</div>
              </div>
            )}

            {/* ── TRIN 6: Diæt ── */}
            {onboardStep === 6 && (
              <div className="step fade-in">
                <div className="step-title">Din diæt</div>
                <div style={{ fontSize:13, color:"var(--muted2)", marginBottom:16, lineHeight:1.5 }}>
                  Vælg din diæt så vi kan filtrere produkter og opskrifter til dig.
                </div>
                <div className="chip-grid" style={{ marginBottom:12 }}>
                  {DIETS.map(d => { const on = (user.diets||[]).includes(d.id); return (
                    <div key={d.id} className={`chip${on?" on":""}`}
                      onClick={() => setUser(u => ({ ...u, diets: on ? (u.diets||[]).filter(x=>x!==d.id) : [...(u.diets||[]), d.id] }))}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700 }}>{d.label}</div>
                        <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{d.desc}</div>
                      </div>
                      {on && <div className="chip-check">✓</div>}
                    </div>
                  );})}
                </div>
                <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5, marginBottom:20 }}>
                  Diæt-tjek er vejledende og baseret på produkttags. Tjek altid ingredienserne selv.
                </div>
                <button className="btn btn-primary btn-full" onClick={() => setOnboardStep(7)}>Fortsæt →</button>
                <button className="btn btn-ghost btn-full btn-sm" style={{ marginTop:8 }} onClick={() => { setUser(u => ({...u, diets:[]})); setOnboardStep(7); }}>Ingen særlig diæt</button>
              </div>
            )}

            {/* ── TRIN 8: Fællesskabet ── */}
            {onboardStep === 8 && (
              <div className="fade-in">
                <div className="card" style={{ textAlign:"center", padding:"20px 20px 14px" }}>
                  <div style={{ marginBottom:8 }}><Icon name="heart" size={44} color="var(--ink2)" /></div>
                  <div style={{ fontSize:17, fontWeight:900, color:"var(--ink)", marginBottom:6 }}>Hjælp fællesskabet</div>
                  <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>Når du scanner et ukendt produkt kan du indsende det og hjælpe andre.</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    ["1️⃣","Skan stregkoden","Hold kameraet over stregkoden på produktet."],
                    ["2️⃣","Fotografér ingredienslisten","Tag et billede af bagsiden af pakken."],
                    ["3️⃣","AI analyserer","Vi finder allergener automatisk — du kan tjekke inden du sender."],
                    ["4️⃣","Admin godkender","En administrator gennemgår produktet."],
                    ["5️⃣","Alle får glæde af det","Produktet er nu tilgængeligt for alle brugere."],
                  ].map(([num, title, text]) => (
                    <div key={title} style={{ display:"flex", gap:10, alignItems:"flex-start", background:"#fff", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontSize:15, fontWeight:800, color:"var(--green)", flexShrink:0, width:20 }}>{num}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:"var(--ink)", marginBottom:2 }}>{title}</div>
                        <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.4 }}>{text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(7)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setOnboardStep(9)}>Fortsæt →</button>
                </div>
              </div>
            )}

            {/* ── TRIN 9: Oversigt & Klar! ── */}
            {onboardStep === 9 && (
              <div className="fade-in">

                {/* Header */}
                <div style={{ textAlign:"center", padding:"8px 0 20px" }}>
                  <div style={{ width:64, height:64, borderRadius:"50%", background:"var(--green-lt)",
                    display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
                    <Icon name="check" size={32} color="var(--green)" />
                  </div>
                  <div style={{ fontSize:24, fontWeight:900, color:"var(--ink)", marginBottom:6 }}>Alt er klar!</div>
                  <div style={{ fontSize:14, color:"var(--muted2)", lineHeight:1.6 }}>
                    Her er et overblik over din profil. Du kan altid redigere senere.
                  </div>
                </div>

                {/* Din profil */}
                <div className="card" style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ fontWeight:800, fontSize:15, color:"var(--ink)" }}>
                      {user.name || "Din profil"}
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize:12, padding:"4px 10px" }}
                      onClick={() => setOnboardStep(3)}>
                      Rediger
                    </button>
                  </div>

                  {/* Allergier */}
                  {allergens.length > 0 ? (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>
                        Allergier / intolerancer
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {allergens.map(id => {
                          const a = ALLERGENS.find(x=>x.id===id);
                          const isAllergen = !customAllerg.includes(id+"_intolerance");
                          const subtypeIds = allergenSubtypes[id] || [];
                          const subtypeData = ALLERGEN_SUBTYPES[id];
                          const subtypeLabel = subtypeIds.length > 0 && subtypeData
                            ? subtypeIds.map(sid => subtypeData.options.find(o=>o.id===sid)?.label).filter(Boolean).join(", ")
                            : null;
                          return (
                            <div key={id} style={{ padding:"5px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                              background:isAllergen?"var(--red-lt)":"var(--amber-lt)",
                              color:isAllergen?"var(--red)":"var(--amber)",
                              border:`1px solid ${isAllergen?"var(--red-md)":"var(--amber-md)"}` }}>
                              {a?.label}
                              {subtypeLabel && <span style={{ fontWeight:400, fontSize:10 }}> · {subtypeLabel}</span>}
                            </div>
                          );
                        })}
                        {customAllerg.filter(c=>!c.endsWith("_intolerance")).map((c,i) => (
                          <div key={i} style={{ padding:"5px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                            background:"var(--paper2)", color:"var(--muted)", border:"1px solid var(--border)" }}>
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>Ingen allergier registreret</div>
                  )}

                  {/* Diæt */}
                  {user.diets && user.diets.length > 0 && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Diæt</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {user.diets.map(d => (
                          <div key={d} style={{ padding:"5px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                            background:"var(--green-lt)", color:"var(--green)", border:"1px solid var(--green-mid)" }}>
                            {DIETS.find(x=>x.id===d)?.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* E-numre */}
                  {selectedENumbers.length > 0 && (
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>E-numre der undgås</div>
                      <div style={{ fontSize:12, color:"var(--muted2)" }}>{selectedENumbers.length} E-numre valgt</div>
                    </div>
                  )}
                </div>

                {/* Familiemedlemmer */}
                {family.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>Familiemedlemmer</div>
                    {family.map(m => (
                      <div key={m.id} className="card" style={{ marginBottom:8, padding:"12px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div className="fm-avatar" style={{ background:m.color, color:"#fff", flexShrink:0 }}>
                            {initials(m.name)}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:800, fontSize:14, color:"var(--ink)" }}>{m.name}</div>
                            <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                              {m.allergens.length
                                ? m.allergens.map(id=>ALLERGENS.find(a=>a.id===id)?.label).join(", ")
                                : "Ingen allergier"}
                            </div>
                          </div>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize:12, padding:"4px 10px", flexShrink:0 }}
                            onClick={() => { setScreen(SCREENS.FAMILY); }}>
                            Rediger
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {family.length === 0 && (
                  <div className="card" style={{ marginBottom:12, textAlign:"center", padding:"14px" }}>
                    <div style={{ fontSize:13, color:"var(--muted2)", marginBottom:8 }}>Ingen familiemedlemmer tilføjet</div>
                    <button className="btn btn-outline btn-sm" onClick={() => setOnboardStep(7)}>
                      + Tilføj familiemedlem
                    </button>
                  </div>
                )}

                {/* Afslut */}
                <button className="btn btn-primary btn-full" style={{ marginTop:4 }} onClick={finishOnboard}>
                  {editMode ? "Gem ændringer ✓" : "Gå til appen →"}
                </button>
                {editMode && (
                  <button className="btn btn-outline btn-full" style={{ marginTop:8 }}
                    onClick={() => { setEditMode(false); setScreen(SCREENS.PROFILE); }}>
                    Annuller
                  </button>
                )}
              </div>
            )}

                    </div>
        )}

        {/* TOPBAR */}
        {!isOnboard && (
          <header className="topbar">
            <div className="topbar-logo">
              <div className="topbar-shield" style={{background:"none",padding:0}}><EatSafeLogo size={34} variant="light" /></div>
              <div className="topbar-name">Eat<span>Safe</span></div>
              <div style={{ background:"var(--amber)", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:100, letterSpacing:".5px", marginLeft:4, marginTop:2 }}>BETA</div>
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              {/* Hjælp-knap */}
              <button onClick={() => setHelpOpen(true)}
                style={{ background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:"50%", width:32, height:32, fontFamily:"var(--f)", fontSize:15, fontWeight:800, color:"var(--muted2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                ?
              </button>
              {/* Feedback-knap */}
              <button onClick={() => { setFeedbackOpen(true); setFeedbackDone(false); }}
                style={{ background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:100, padding:"5px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--muted2)", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Feedback
              </button>
            </div>
          </header>
        )}

        {/* Feedback-knap under onboarding */}
        {isOnboard && (
          <div style={{ position:"fixed", top:12, right:12, zIndex:1000 }}>
            <button onClick={() => { setFeedbackOpen(true); setFeedbackDone(false); }}
              style={{ background:"rgba(255,255,255,.85)", backdropFilter:"blur(8px)", border:"1px solid var(--border2)", borderRadius:100, padding:"5px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--muted2)", cursor:"pointer", display:"flex", alignItems:"center", gap:5, boxShadow:"0 2px 8px rgba(0,0,0,.08)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Feedback
            </button>
          </div>
        )}

        {/* ══ HJÆLP MODAL ══ */}
        {helpOpen && (() => {
          const helpContent = {
            "home": { title:"📷 Scanner", tips:[
              { icon:"📱", title:"Skan stregkode", desc:"Tryk på scan-feltet og hold kameraet roligt over stregkoden. Appen scanner automatisk." },
              { icon:"🔍", title:"Søg manuelt", desc:"Kan du ikke scanne? Brug søgefeltet til at finde produkter ved navn." },
              { icon:"⚡", title:"Hurtig scanning", desc:"God belysning og rolig hånd giver hurtigere og mere præcist resultat." },
              { icon:"📜", title:"Historik", desc:"Dine seneste scanninger gemmes automatisk — find dem under Profil." },
            ]},
            "recipes": { title:"🍝 Opskrifter", tips:[
              { icon:"🔍", title:"Søg og filtrer", desc:"Søg på navn eller vælg kategori. Slå 'Kun sikre' til for at skjule opskrifter med dine allergener." },
              { icon:"❤️", title:"Favoritter", desc:"Tryk hjerte-ikonet for at gemme en opskrift til Favoritter-fanen." },
              { icon:"👤", title:"Portionsjustering", desc:"Åbn en opskrift og tryk + / − for at skalere ingredienser automatisk." },
              { icon:"🛒", title:"Indkøbsliste", desc:"Tryk 'Tilføj til indkøbsliste' for at sende ingredienser direkte til din liste." },
            ]},
            "list": { title:"🛒 Indkøbsliste", tips:[
              { icon:"✏️", title:"Tilføj varer", desc:"Skriv en vare og tryk Tilføj — eller tilføj direkte fra en opskrift." },
              { icon:"✓", title:"Afkryds varer", desc:"Tryk på en vare for at markere den som købt." },
              { icon:"🗑️", title:"Ryd listen", desc:"Brug 'Ryd' for at fjerne alle afkrydsede varer på én gang." },
            ]},
            "profile": { title:"👤 Profil & præferencer", tips:[
              { icon:"🚨", title:"Allergi vs. intolerance", desc:"Tryk én gang = intolerance (gul advarsel). To gange = allergi (rød advarsel)." },
              { icon:"👨‍👩‍👧", title:"Familie", desc:"Opret profiler for børn og partner — se allergencheck for alle på én gang." },
              { icon:"✏️", title:"E-numre og diæter", desc:"Brug 'Tilføj eget' for intoleranser, E-numre eller diæter der ikke er på listen." },
            ]},
            "madpas": { title:"🌍 Madpas", tips:[
              { icon:"🌐", title:"Vælg sprog", desc:"Vælg sproget for landet du besøger. EatSafe oversætter dine allergier automatisk." },
              { icon:"📋", title:"Vis til tjeneren", desc:"Tryk 'Vis til tjener' for en stor, tydelig skærm du kan vise restaurantpersonalet." },
              { icon:"🔊", title:"Oplæsning", desc:"Tryk højttalerikonet for at høre udtalen på det lokale sprog." },
            ]},
          };
          const content = helpContent[screen] || { title:"ℹ️ Hjælp", tips:[
            { icon:"💬", title:"Send feedback", desc:"Brug Feedback-knappen øverst til at rapportere problemer eller forslag." },
          ]};
          return (
            <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end" }}
              onClick={e => e.target === e.currentTarget && setHelpOpen(false)}>
              <div style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"80vh", overflowY:"auto" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <div style={{ fontSize:18, fontWeight:900, color:"var(--ink)" }}>{content.title}</div>
                  <button onClick={() => setHelpOpen(false)}
                    style={{ background:"var(--paper2)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--muted)" }}>×</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                  {content.tips.map((tip, i) => (
                    <div key={i} style={{ display:"flex", gap:12, padding:"12px 14px", background:"#fff", border:"1px solid var(--border)", borderRadius:12 }}>
                      <div style={{ fontSize:22, flexShrink:0 }}>{tip.icon}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:3 }}>{tip.title}</div>
                        <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>{tip.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setHelpOpen(false); setFeedbackOpen(true); setFeedbackDone(false); }}
                  style={{ width:"100%", padding:"12px", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--muted2)", cursor:"pointer" }}>
                  💬 Send feedback eller rapportér fejl
                </button>
              </div>
            </div>
          );
        })()}

        {/* ══ FEEDBACK MODAL ══ */}
        {feedbackOpen && (
          <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end" }}
            onClick={e => e.target === e.currentTarget && setFeedbackOpen(false)}>
            <div style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"85vh", overflowY:"auto" }}
              onClick={e => e.stopPropagation()}>

              {feedbackDone ? (
                <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🙏</div>
                  <div style={{ fontSize:18, fontWeight:900, color:"var(--ink)" }}>Tak for din feedback!</div>
                  <div style={{ fontSize:13, color:"var(--muted)", marginTop:6 }}>Vi kigger på det hurtigst muligt.</div>
                </div>
              ) : (
                <>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                    <div>
                      <div style={{ fontSize:17, fontWeight:900, color:"var(--ink)" }}>Send feedback</div>
                      <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>Skærm: {screen} · Beta v1.0</div>
                    </div>
                    <button onClick={() => setFeedbackOpen(false)}
                      style={{ background:"var(--paper2)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--muted)" }}>×</button>
                  </div>

                  {/* Type dropdown */}
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--ink)", display:"block", marginBottom:6 }}>Type</label>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {[
                        { id:"bug",        emoji:"🐛", label:"Fejl / bug" },
                        { id:"ui",         emoji:"🎨", label:"Design / UI" },
                        { id:"missing",    emoji:"💡", label:"Mangler noget" },
                        { id:"content",    emoji:"📦", label:"Forkert indhold" },
                        { id:"crash",      emoji:"💥", label:"App crasher" },
                        { id:"suggestion", emoji:"✨", label:"Forslag" },
                      ].map(t => (
                        <div key={t.id} onClick={() => setFeedbackType(t.id)}
                          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, cursor:"pointer",
                            border:`1.5px solid ${feedbackType===t.id?"var(--ink)":"var(--border)"}`,
                            background: feedbackType===t.id ? "var(--ink)" : "#fff" }}>
                          <span style={{ fontSize:16 }}>{t.emoji}</span>
                          <span style={{ fontSize:12, fontWeight:700, color: feedbackType===t.id ? "#fff" : "var(--ink2)" }}>{t.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Beskrivelse */}
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--ink)", display:"block", marginBottom:6 }}>Beskriv problemet</label>
                    <textarea
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      rows={4}
                      placeholder="Fx. 'Når jeg trykker på X sker der Y…' — jo mere detail, jo bedre"
                      style={{ width:"100%", padding:"12px 14px", border:"1.5px solid var(--border2)", borderRadius:12, background:"var(--paper2)", fontFamily:"var(--f)", fontSize:14, color:"var(--ink)", resize:"none", outline:"none", lineHeight:1.6, boxSizing:"border-box" }}
                    />
                  </div>

                  {/* Vedhæft billede */}
                  <div style={{ marginBottom:16 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--ink)", display:"block", marginBottom:6 }}>Skærmbillede (valgfrit)</label>
                    {feedbackImage ? (
                      <div style={{ position:"relative", display:"inline-block" }}>
                        <img src={feedbackImage} alt="Screenshot" style={{ maxWidth:"100%", maxHeight:160, borderRadius:10, objectFit:"contain", border:"1px solid var(--border)" }} />
                        <button onClick={() => { setFeedbackImage(null); setFeedbackImageB64(null); }}
                          style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,.6)", border:"none", borderRadius:"50%", width:24, height:24, color:"#fff", cursor:"pointer", fontSize:14 }}>×</button>
                      </div>
                    ) : (
                      <label style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 14px", border:"1.5px dashed var(--border2)", borderRadius:12, cursor:"pointer", background:"var(--paper2)" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        <span style={{ fontSize:13, color:"var(--muted)" }}>Tag skærmbillede eller vælg fra galleri</span>
                        <input type="file" accept="image/*" style={{ display:"none" }} onChange={async e => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setFeedbackImage(URL.createObjectURL(f));
                          const b64 = await new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(f); });
                          setFeedbackImageB64(b64);
                        }} />
                      </label>
                    )}
                  </div>

                  {/* Auto-context info */}
                  <div style={{ background:"var(--paper2)", borderRadius:10, padding:"10px 12px", marginBottom:14 }}>
                    <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, marginBottom:4 }}>📊 Automatisk inkluderet diagnostik</div>
                    <div style={{ fontSize:10, color:"var(--muted)", lineHeight:1.7 }}>
                      Skærm: <b>{screen}</b> · Bruger: <b>{user?.name || "anonym"}</b> · Enhed: <b>{/iPhone|iPad/.test(navigator.userAgent)?"iOS":/Android/.test(navigator.userAgent)?"Android":"Desktop"}</b> · Viewport: <b>{window.innerWidth}×{window.innerHeight}</b>
                    </div>
                  </div>

                  <button onClick={submitFeedback} disabled={feedbackSending || !feedbackText.trim()}
                    style={{ width:"100%", background: feedbackText.trim() ? "var(--ink)" : "var(--border2)", border:"none", borderRadius:12, padding:"15px", fontFamily:"var(--f)", fontSize:15, fontWeight:800, color:"#fff", cursor: feedbackText.trim() ? "pointer" : "not-allowed" }}>
                    {feedbackSending ? "Sender…" : "Send feedback →"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ HJEM ══ */}
        {screen === SCREENS.HOME && (
          <div className="screen fade-in" id="main-content" style={{ display:"flex", flexDirection:"column", minHeight:"calc(100vh - 130px)" }}>

            {/* Profil popup */}
            {profilePopup && (() => {
              const isUser = profilePopup === "user";
              const member = isUser ? null : family.find(m => m.id === profilePopup);
              const pName = isUser ? (user.name || "Din profil") : member?.name;
              const pAllergens = isUser ? allergens : (member?.allergens || []);
              const pCustom = isUser ? customAllerg : (member?.customAllerg || []);
              const pDiets = isUser ? (user.diets || []) : (member?.diets || []);
              const pENumbers = isUser ? selectedENumbers : (member?.eNumbers || []);
              const isActive = isUser
                ? activeProfiles.includes("user")
                : activeProfiles.includes(profilePopup);
              return (
                <div style={{ position:"fixed", inset:0, zIndex:9990, background:"rgba(0,0,0,.5)" }}
                  onClick={() => setProfilePopup(null)}>
                  <div style={{ position:"absolute", top:80, left:16, right:16,
                    background:"var(--paper)", borderRadius:20, padding:"20px 18px",
                    boxShadow:"0 8px 40px rgba(0,0,0,.2)" }}
                    onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                      <div style={{ width:44, height:44, borderRadius:"50%",
                        background: isUser ? "var(--green)" : (member?.color || "var(--ink)"),
                        color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:16, fontWeight:800, flexShrink:0 }}>
                        {initials(pName)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:16, color:"var(--ink)" }}>{pName}</div>
                        <div style={{ fontSize:12, color:"var(--muted)", marginTop:1 }}>
                          {isActive ? "✅ Aktiv i søgning" : "⬜ Ikke aktiv i søgning"}
                        </div>
                      </div>
                      <div onClick={() => setProfilePopup(null)} style={{ cursor:"pointer", padding:4, opacity:.5 }}>✕</div>
                    </div>

                    {/* Allergier */}
                    {pAllergens.length > 0 ? (
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Allergier / intolerancer</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                          {pAllergens.map(id => {
                            const a = ALLERGENS.find(x => x.id === id);
                            const isInt = pCustom.includes(id + "_intolerance");
                            return (
                              <div key={id} style={{ padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                                background: isInt ? "var(--amber-lt)" : "var(--red-lt)",
                                color: isInt ? "var(--amber)" : "var(--red)",
                                border: `1px solid ${isInt ? "var(--amber)" : "var(--red)"}` }}>
                                {a?.label || id}
                              </div>
                            );
                          })}
                          {pCustom.filter(c => !c.endsWith("_intolerance")).map((c,i) => (
                            <div key={i} style={{ padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                              background:"var(--paper2)", color:"var(--muted)", border:"1px solid var(--border)" }}>
                              {c}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize:12, color:"var(--muted)", marginBottom:12 }}>Ingen allergier registreret</div>
                    )}

                    {/* Diæt */}
                    {pDiets.length > 0 && (
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Diæt</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                          {pDiets.map(d => (
                            <div key={d} style={{ padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                              background:"var(--green-lt)", color:"var(--green)", border:"1px solid var(--green-mid)" }}>
                              {DIETS.find(x=>x.id===d)?.label || d}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* E-numre */}
                    {pENumbers.length > 0 && (
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>E-numre</div>
                        <div style={{ fontSize:12, color:"var(--muted2)" }}>{pENumbers.length} E-numre overvåges</div>
                      </div>
                    )}

                    {/* Aktiver/deaktiver */}
                    <button className="btn btn-full" style={{
                      marginTop:4,
                      background: isActive ? "var(--paper2)" : "var(--green)",
                      color: isActive ? "var(--muted)" : "#fff",
                      border: `1px solid ${isActive ? "var(--border)" : "var(--green)"}`,
                    }} onClick={() => {
                      const pid = isUser ? "user" : profilePopup;
                      setActiveProfiles(p => p.includes(pid) ? p.filter(x=>x!==pid) : [...p, pid]);
                      setProfilePopup(null);
                    }}>
                      {isActive ? "Deaktiver i søgning" : "Aktivér i søgning"}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Hilsen + Profil-bar */}
            <div style={{ padding:"16px 2px 12px" }}>
              <div style={{ fontSize:20, fontWeight:900, color:"var(--ink)", letterSpacing:"-.3px", marginBottom:10 }}>
                {greeting} {user.name?.split(" ")[0] || "der"}
              </div>

              {/* Vælg alle / fravælg alle */}
              <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                {(() => {
                  const allIds = ["user", ...family.map(m => m.id)];
                  const allActive = allIds.every(id => activeProfiles.includes(id));
                  return (
                    <>
                      <button onClick={() => setActiveProfiles(allIds)}
                        style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, border:"1.5px solid var(--green)",
                          background: allActive ? "var(--green)" : "var(--green-lt)", color: allActive ? "#fff" : "var(--green)", cursor:"pointer", fontFamily:"var(--f)" }}>
                        Vælg alle
                      </button>
                      <button onClick={() => setActiveProfiles([])}
                        style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, border:"1.5px solid var(--border)",
                          background:"var(--paper2)", color:"var(--muted)", cursor:"pointer", fontFamily:"var(--f)" }}>
                        Fravælg alle
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* Profil-avatars */}
              <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                {/* Brugeren selv */}
                {(() => {
                  const isActive = activeProfiles.includes("user");
                  return (
                    <div onClick={() => setProfilePopup("user")} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
                      <div style={{ position:"relative" }}>
                        <div style={{ width:46, height:46, borderRadius:"50%",
                          background: isActive ? "var(--green)" : "var(--paper2)",
                          color: isActive ? "#fff" : "var(--muted)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:15, fontWeight:800,
                          border: `2.5px solid ${isActive ? "var(--green)" : "var(--border)"}`,
                          boxShadow: isActive ? "0 0 0 3px var(--green-lt)" : "none",
                          transition:"all .2s" }}>
                          {initials(user.name || "?")}
                        </div>
                        {allergens.length > 0 && (
                          <div style={{ position:"absolute", bottom:-1, right:-1, width:16, height:16,
                            background:"var(--red)", borderRadius:"50%", border:"2px solid var(--paper)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:9, color:"#fff", fontWeight:800 }}>
                            {allergens.length}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:10, fontWeight:700,
                        color: isActive ? "var(--ink)" : "var(--muted2)",
                        maxWidth:48, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {user.name?.split(" ")[0] || "Mig"}
                      </div>
                    </div>
                  );
                })()}

                {/* Familiemedlemmer */}
                {family.map(m => {
                  const isActive = activeProfiles.includes(m.id);
                  return (
                    <div key={m.id} onClick={() => setProfilePopup(m.id)}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
                      <div style={{ position:"relative" }}>
                        <div style={{ width:46, height:46, borderRadius:"50%",
                          background: isActive ? "var(--green)" : "var(--paper2)",
                          color: isActive ? "#fff" : "var(--muted)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:15, fontWeight:800,
                          border: `2.5px solid ${isActive ? "var(--green)" : "var(--border)"}`,
                          boxShadow: isActive ? "0 0 0 3px var(--green-lt)" : "none",
                          transition:"all .2s" }}>
                          {initials(m.name)}
                        </div>
                        {(m.allergens||[]).length > 0 && (
                          <div style={{ position:"absolute", bottom:-1, right:-1, width:16, height:16,
                            background:"var(--red)", borderRadius:"50%", border:"2px solid var(--paper)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:9, color:"#fff", fontWeight:800 }}>
                            {(m.allergens||[]).length}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:10, fontWeight:700,
                        color: isActive ? "var(--ink)" : "var(--muted2)",
                        maxWidth:48, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {m.name?.split(" ")[0]}
                      </div>
                    </div>
                  );
                })}

                {/* Tilføj-knap */}
                <div onClick={() => setScreen(SCREENS.FAMILY)}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
                  <div style={{ width:46, height:46, borderRadius:"50%", background:"var(--paper2)",
                    border:"2px dashed var(--border)", display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:22, color:"var(--muted)", lineHeight:1 }}>+</div>
                  <div style={{ fontSize:10, color:"var(--muted2)", fontWeight:600 }}>Tilføj</div>
                </div>
              </div>
            </div>

            {/* Scan-boks — viser kamera når aktivt, animation ellers */}
            <div style={{
              background:"var(--ink)", borderRadius:20, marginBottom:10,
              overflow:"hidden", position:"relative",
              boxShadow:"0 4px 20px rgba(31,39,51,.18)",
            }}>
              {/* Kamera container — altid i DOM men skjult når ikke aktiv */}
              <div style={{ position:"relative", display: cameraActive ? "block" : "none" }}>
                <div id="qr-reader-home" style={{ width:"100%", background:"#000" }} />
                {/* Scanner overlay — ramme og laser */}
                <div style={{
                  position:"absolute", inset:0, pointerEvents:"none",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {/* Mørke hjørner */}
                  <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.4)" }} />
                  {/* Klar scanzone */}
                  <div style={{
                    position:"relative",
                    width:"75%", height:100,
                    boxShadow:"0 0 0 9999px rgba(0,0,0,.4)",
                    borderRadius:8,
                  }}>
                    {/* Hjørne-markører */}
                    {[["0","0","tl"],["0","auto","bl"],["auto","0","tr"],["auto","auto","br"]].map(([t,b,key]) => (
                      <div key={key} style={{
                        position:"absolute",
                        top: key.startsWith("t") ? 0 : "auto",
                        bottom: key.startsWith("b") ? 0 : "auto",
                        left: key.endsWith("l") ? 0 : "auto",
                        right: key.endsWith("r") ? 0 : "auto",
                        width:22, height:22,
                        borderColor:"var(--green)",
                        borderStyle:"solid",
                        borderWidth:0,
                        borderTopWidth: key.startsWith("t") ? 3 : 0,
                        borderBottomWidth: key.startsWith("b") ? 3 : 0,
                        borderLeftWidth: key.endsWith("l") ? 3 : 0,
                        borderRightWidth: key.endsWith("r") ? 3 : 0,
                        borderRadius: key==="tl"?"4px 0 0 0":key==="tr"?"0 4px 0 0":key==="bl"?"0 0 0 4px":"0 0 4px 0",
                      }} />
                    ))}
                    {/* Laser-linje */}
                    <div style={{
                      position:"absolute", left:4, right:4, height:2,
                      background:"linear-gradient(90deg, transparent, var(--green), rgba(134,239,172,.8), var(--green), transparent)",
                      boxShadow:"0 0 8px var(--green), 0 0 16px var(--green)",
                      animation:"laserMove 1.8s ease-in-out infinite",
                      top:0,
                    }} />
                  </div>
                </div>
              </div>
              <div id="qr-reader-gallery" style={{ display:"none" }} />
              <input ref={galleryInputRef} type="file" accept="image/*" style={{ display:"none" }}
                onChange={e => { if (e.target.files[0]) scanFromGallery(e.target.files[0]); e.target.value=""; }} />

              {/* Stop-knap når kamera er aktivt */}
              {cameraActive && (
                <div style={{ padding:"8px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ color:"rgba(255,255,255,.6)", fontSize:12, fontWeight:600 }}>Hold stregkoden ind i rammen</span>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => galleryInputRef.current?.click()} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:6, padding:"5px 10px", color:"#fff", fontSize:16, cursor:"pointer", lineHeight:1 }}>🖼️</button>
                    <button onClick={toggleTorch} style={{
                      background: torchOn ? "rgba(251,191,36,.3)" : "rgba(255,255,255,.15)",
                      border: torchOn ? "1px solid rgba(251,191,36,.6)" : "none",
                      borderRadius:6, padding:"5px 10px", color: torchOn ? "#FBB" : "#fff",
                      fontSize:16, cursor:"pointer", lineHeight:1
                    }}>🔦</button>
                    <button onClick={stopCamera} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:6, padding:"5px 12px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--f)" }}>Stop</button>
                  </div>
                </div>
              )}

              {/* Animation når kamera ikke er aktivt */}
              {!cameraActive && (
              <div style={{ cursor:"pointer", padding:"28px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:16, position:"relative" }}
                onClick={() => startCamera()}
                role="button"
                aria-label="Start kamera for at scanne stregkode"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && startCamera()}>
                {/* Stregkode-animation */}
                <div style={{ position:"relative", width:180, height:90 }}>
                  {/* Stregkode streger */}
                  <svg viewBox="0 0 180 90" width="180" height="90">
                    <g fill="rgba(255,255,255,0.15)">
                      <rect x="10" y="0" width="7" height="90" rx="1"/>
                      <rect x="22" y="0" width="3" height="90" rx="1"/>
                      <rect x="29" y="0" width="5" height="90" rx="1"/>
                      <rect x="38" y="0" width="2" height="90" rx="1"/>
                      <rect x="44" y="0" width="8" height="90" rx="1"/>
                      <rect x="56" y="0" width="3" height="90" rx="1"/>
                      <rect x="63" y="0" width="6" height="90" rx="1"/>
                      <rect x="73" y="0" width="2" height="90" rx="1"/>
                      <rect x="79" y="0" width="4" height="90" rx="1"/>
                      <rect x="87" y="0" width="7" height="90" rx="1"/>
                      <rect x="98" y="0" width="3" height="90" rx="1"/>
                      <rect x="105" y="0" width="5" height="90" rx="1"/>
                      <rect x="114" y="0" width="2" height="90" rx="1"/>
                      <rect x="120" y="0" width="6" height="90" rx="1"/>
                      <rect x="130" y="0" width="3" height="90" rx="1"/>
                      <rect x="137" y="0" width="8" height="90" rx="1"/>
                      <rect x="149" y="0" width="4" height="90" rx="1"/>
                      <rect x="157" y="0" width="2" height="90" rx="1"/>
                      <rect x="163" y="0" width="7" height="90" rx="1"/>
                    </g>
                  </svg>
                  {/* Laser linje */}
                  <div style={{
                    position:"absolute", left:0, right:0, height:2,
                    background:"linear-gradient(90deg, transparent, #22C55E, #4ADE80, #22C55E, transparent)",
                    animation:"laserMove 2s ease-in-out infinite",
                    filter:"drop-shadow(0 0 6px #22C55E)",
                    boxShadow:"0 0 8px #22C55E",
                  }}/>
                  {/* Hjørnemarkører */}
                  {[["0","0","top","left"],["0","0","top","right"],["0","0","bottom","left"],["0","0","bottom","right"]].map((_,i) => {
                    const pos = [{top:8,left:8},{top:8,right:8},{bottom:8,left:8},{bottom:8,right:8}][i];
                    const borders = [
                      {borderTop:"2px solid rgba(255,255,255,.6)",borderLeft:"2px solid rgba(255,255,255,.6)"},
                      {borderTop:"2px solid rgba(255,255,255,.6)",borderRight:"2px solid rgba(255,255,255,.6)"},
                      {borderBottom:"2px solid rgba(255,255,255,.6)",borderLeft:"2px solid rgba(255,255,255,.6)"},
                      {borderBottom:"2px solid rgba(255,255,255,.6)",borderRight:"2px solid rgba(255,255,255,.6)"},
                    ][i];
                    return <div key={i} style={{ position:"absolute", width:16, height:16, ...pos, ...borders, borderRadius:2 }}/>;
                  })}
                </div>
                {/* Tekst */}
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:900, color:"#fff", letterSpacing:"-.4px" }}>Skan produkt</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginTop:4 }}>Tryk for at starte kamera</div>
                  <div onClick={e => { e.stopPropagation(); galleryInputRef.current?.click(); }}
                    style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:8, textDecoration:"underline", cursor:"pointer" }}>
                    eller vælg billede fra galleri
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Fejlbesked fra kamera */}
            {scanError && (
              <div style={{ fontSize:12, color:"var(--red)", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:8, padding:"8px 12px", marginBottom:8 }}>
                {scanError} — <span style={{ textDecoration:"underline", cursor:"pointer" }} onClick={() => setShowManualEan(true)}>Indtast manuelt</span>
              </div>
            )}

            {/* Søg — fremhævet på forsiden */}
            <div className="card" style={{ padding:"12px 14px", cursor:"pointer", marginBottom:10 }}
              onClick={() => setScreen(SCREENS.SEARCH)}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:40, height:40, background:"var(--paper2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon name="search" size={20} color="var(--ink2)" /></div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>Søg produkter</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>Find varer der er sikre for dig</div>
                </div>
                <div style={{ fontSize:18, color:"var(--muted)" }}>›</div>
              </div>
            </div>

            {/* Indkøbsliste — kun hvis der er varer */}
            {shoppingList.filter(i => !i.checked).length > 0 && (
              <div className="card" style={{ padding:"12px 14px", cursor:"pointer", marginBottom:10 }}
                onClick={() => setScreen(SCREENS.LIST)}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:40, height:40, background:"var(--green-lt)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon name="cart" size={20} color="var(--green)" /></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>Indkøbsliste</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>
                      {shoppingList.filter(i => !i.checked).length} vare{shoppingList.filter(i => !i.checked).length !== 1 ? "r" : ""} mangler
                    </div>
                  </div>
                  <div style={{ fontSize:18, color:"var(--muted)" }}>›</div>
                </div>
              </div>
            )}

            <div style={{ flex:1, minHeight:20 }} />
            {/* Vidste du at — let, i bunden */}
            {(() => {
              const tip = HOME_TIPS[new Date().getDay() % HOME_TIPS.length];
              return (
                <div style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"10px 0", borderTop:"1px solid var(--border)", marginTop:4 }}>
                  <div style={{ flexShrink:0 }}><Icon name="bulb" size={20} color="#F59E0B" /></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:9, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:3 }}>Vidste du at</div>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>{tip.title}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5 }}>{tip.text}</div>
                  </div>
                  
                </div>
              );
            })()}

            {/* Version */}
            <div style={{ textAlign:"center", paddingTop:8, paddingBottom:4 }}>
              <div style={{ fontSize:10, color:"var(--muted)", opacity:0.5 }}>v1.0.6</div>
            </div>

          </div>
        )}


        {/* ══ RESULTAT ══ */}
        {screen === SCREENS.RESULT && scanResult && (
          <div className="screen fade-in">

            {/* ── 1. SIKKERHED + DIÆT ── */}
            {(() => {
              const flags = scanResult.allergen_flags || {};
              const profiles = [
                { id:"me", name: user.name||"Dig", allergens },
                ...family.filter(m => activeProfiles.includes(m.id)),
              ];
              const tagLabels = { vegan:"Vegansk", vegetarian:"Vegetarisk", "palm-oil-free":"Uden palmeolie", "gluten-free":"Glutenfri", organic:"Økologisk" };
              const hasTags = scanResult.tags && scanResult.tags.length > 0;

              return (
                <div style={{ marginBottom:10 }}>
                  {/* 2 kolonner */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom: hasTags ? 8 : 0 }}>
                  {profiles.map((p, pi) => {
                    const danger = p.allergens.filter(a => flags[a] === "yes");
                    const warning = p.allergens.filter(a => flags[a] === "traces");
                    const statusColor = danger.length > 0 ? "var(--red)" : warning.length > 0 ? "var(--amber)" : "var(--green)";
                    const statusBg = danger.length > 0 ? "var(--red-lt)" : warning.length > 0 ? "var(--amber-lt)" : "var(--green-lt)";
                    const statusBorder = danger.length > 0 ? "var(--red-md)" : warning.length > 0 ? "var(--amber-md)" : "var(--green-mid)";
                    const statusIcon = danger.length > 0 ? "×" : warning.length > 0 ? "!" : "✓";
                    const productTags = scanResult.tags || [];
                    const dietMatch = p.diets && p.diets.length > 0
                      ? p.diets.every(d => productTags.includes(d))
                      : null; // null = ingen diæt registreret
                    const statusText = danger.length > 0
                      ? danger.map(id => ALLERGENS.find(a=>a.id===id)?.label).filter(Boolean).join(", ")
                      : warning.length > 0
                      ? "Spor: " + warning.map(id => ALLERGENS.find(a=>a.id===id)?.label).filter(Boolean).join(", ")
                      : dietMatch === false ? "Passer ikke til diæt"
                      : "Sikkert";
                    const finalColor = danger.length > 0 ? "var(--red)" : warning.length > 0 ? "var(--amber)" : dietMatch === false ? "var(--amber)" : "var(--green)";
                    const finalBg = danger.length > 0 ? "var(--red-lt)" : warning.length > 0 ? "var(--amber-lt)" : dietMatch === false ? "var(--amber-lt)" : "var(--green-lt)";
                    const finalBorder = danger.length > 0 ? "var(--red-md)" : warning.length > 0 ? "var(--amber-md)" : dietMatch === false ? "var(--amber-md)" : "var(--green-mid)";
                    const finalIcon = danger.length > 0 ? "×" : warning.length > 0 ? "!" : dietMatch === false ? "!" : "✓";

                    return (
                      <div key={p.id} style={{
                        display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"6px 10px",
                        background: finalBg,
                        border:`1px solid ${finalBorder}`,
                        borderRadius:8,
                        gap:6,
                      }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
                          {p.id==="me" ? "Dig" : p.name}
                        </div>
                        <div style={{ fontSize:11, fontWeight:700, color:finalColor, flexShrink:0 }}>{finalIcon} {statusText}</div>
                      </div>
                    );
                  })}
                  </div>

                  {/* Diæt-tags — sømløst under profilerne */}
                  {hasTags && (
                    <div style={{
                      display:"flex", gap:6, flexWrap:"wrap",
                      padding:"8px 14px",
                      background:"#fff",
                      border:"1px solid var(--border)",
                      borderTop:"none",
                      borderRadius:"0 0 12px 12px",
                    }}>
                      {scanResult.tags.map((tag, i) => (
                        <span key={i} style={{ fontSize:11, fontWeight:700, color:"var(--green)", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:100, padding:"2px 9px" }}>
                          {tagLabels[tag] || tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── 2. PRODUKT HERO ── */}
            <div className="product-hero">
              {scanResult.image_url
                ? <img src={scanResult.image_url} alt={scanResult.name} className="product-hero-img" onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                : null}
              <div className="product-hero-img-placeholder" style={{ display: scanResult.image_url ? "none" : "flex", flexDirection:"column", gap:8, background:"var(--paper2)", borderRadius:12, padding:20, margin:"0 0 10px" }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--border2)" strokeWidth="1.5">
                  <rect x="4" y="10" width="40" height="30" rx="3"/>
                  <circle cx="16" cy="20" r="4"/>
                  <path strokeLinecap="round" d="M4 34l10-8 8 6 6-4 16 12"/>
                </svg>
                <div style={{ fontSize:11, color:"var(--muted)", fontWeight:500 }}>Ingen produktbillede</div>
              </div>
              <div className="product-hero-body">
                <div className="product-hero-name">{scanResult.name}</div>
                {scanResult.brand && <div className="product-hero-brand">{scanResult.brand}</div>}
                <div className="product-hero-meta">
                  <span style={{ fontSize:10, color:"var(--muted)", fontWeight:500 }}>EAN: {scanResult.code}</span>
                  {scanResult.source && (() => {
                    const vb = verifiedBadge(scanResult.verified_status, scanResult.source);
                    return <span className="product-hero-source" style={{ background:vb.bg, color:vb.color, fontSize:9, opacity:0.75 }}>{vb.label}</span>;
                  })()}
                </div>
              </div>
            </div>

            {/* ── 3. ANDRE ALLERGENER I PRODUKTET ── */}
            {scanResult.allergen_flags && (() => {
              const flags = scanResult.allergen_flags;
              const present = Object.entries(flags).filter(([k,v]) => v==="yes" && ALLERGENS.find(a=>a.id===k));
              const traces = Object.entries(flags).filter(([k,v]) => v==="traces" && ALLERGENS.find(a=>a.id===k));
              const myAllergens = new Set([...scanResult.matchedDanger||[], ...scanResult.matchedWarning||[]]);
              const otherPresent = present.filter(([k]) => !myAllergens.has(k));
              const otherTraces = traces.filter(([k]) => !myAllergens.has(k));
              if (otherPresent.length === 0 && otherTraces.length === 0) return null;
              return (
                <div className="card">
                  <div className="card-lbl">Andre allergener i produktet</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8 }}>Ikke registreret på dine profiler</div>
                  {otherPresent.length > 0 && <div className="tags" style={{ marginBottom:6 }}>{otherPresent.map(([k]) => { const a=ALLERGENS.find(x=>x.id===k); return a ? <div key={k} className="tag" style={{ background:"var(--paper2)", color:"var(--ink2)", borderColor:"var(--border2)" }}>{a.emoji} {a.label}</div> : null; })}</div>}
                  {otherTraces.length > 0 && <div className="tags">{otherTraces.map(([k]) => { const a=ALLERGENS.find(x=>x.id===k); return a ? <div key={k} className="tag" style={{ background:"var(--paper2)", color:"var(--muted)", borderColor:"var(--border2)" }}>spor: {a.emoji} {a.label}</div> : null; })}</div>}
                </div>
              );
            })()}

            {/* ── 4. INGREDIENSLISTE ── */}
            <div className="card">
              <div className="ing-toggle" onClick={() => scanResult.ingredients && setShowIng(v => !v)}
                style={{ cursor: scanResult.ingredients ? "pointer" : "default" }}>
                <span>Ingrediensliste</span>
                {scanResult.ingredients && <span>{showIng?"▲":"▼"}</span>}
              </div>
              {scanResult.ingredients ? (
                showIng && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ padding:"10px", background:"var(--paper2)", borderRadius:8, marginBottom:8 }}>
                      <IngredientsList text={scanResult.ingredients} allergenFlags={scanResult.allergen_flags||{}} />
                    </div>
                    <div style={{ fontSize:10, color:"var(--muted)", padding:"6px 8px", background:"var(--paper2)", borderRadius:6, lineHeight:1.4 }}>
                      Fremhævet = allergen · Listen kan være på originalsprog — tjek altid selv
                    </div>
                  </div>
                )
              ) : (
                <div style={{ padding:"8px 0" }}>
                  <div style={{ fontSize:13, color:"var(--muted2)", marginBottom:8 }}>Vi mangler ingredienslisten for dette produkt.</div>
                  <button className="btn btn-outline btn-sm" onClick={() => { setEditStep("start"); setEditIngText(scanResult?.ingredients || ""); setEditNote(""); setEditType(null); setScreen(SCREENS.SUGGEST_EDIT); }}>
                    Hjælp os — indsend ingrediensliste
                  </button>
                </div>
              )}
            </div>

            {/* ── 5. NÆRINGSINDHOLD — kollapsibel ── */}
            {!scanResult.nutrition && (
              <div className="card">
                <div className="ing-toggle" style={{ cursor:"default" }}>
                  <span>Næringsindhold pr. 100g</span>
                </div>
                <div style={{ padding:"12px 0", display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:"var(--muted2)", marginBottom:6 }}>Vi mangler næringsdata for dette produkt.</div>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditStep("start"); setEditIngText(scanResult?.ingredients || ""); setEditNote(""); setEditType(null); setScreen(SCREENS.SUGGEST_EDIT); }}>
                      Hjælp os — indsend næringsdata
                    </button>
                  </div>
                </div>
              </div>
            )}
            {scanResult.nutrition && (() => {
              const n = scanResult.nutrition;
              const rows = [
                ["Energi", n.energy_kcal ? `${n.energy_kcal} kcal` : null],
                ["Fedt", n.fat != null ? `${n.fat} g` : null],
                ["— heraf mættet", n.saturated_fat != null ? `${n.saturated_fat} g` : null],
                ["Kulhydrat", n.carbohydrates != null ? `${n.carbohydrates} g` : null],
                ["— heraf sukker", n.sugars != null ? `${n.sugars} g` : null],
                ["Kostfibre", n.fiber != null ? `${n.fiber} g` : null],
                ["Protein", n.protein != null ? `${n.protein} g` : null],
                ["Salt", n.salt != null ? `${n.salt} g` : null],
              ].filter(([,v]) => v !== null);
              if (!rows.length) return null;
              return (
                <div className="card">
                  <div className="ing-toggle" onClick={() => setShowNutrition(v => !v)}>
                    <span>Næringsindhold pr. 100g</span>
                    <span>{showNutrition?"▲":"▼"}</span>
                  </div>
                  {showNutrition && (
                    <div style={{ display:"flex", flexDirection:"column", marginTop:10 }}>
                      {rows.map(([label, value], i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom: i < rows.length-1 ? "1px solid var(--border)" : "none" }}>
                          <span style={{ fontSize:13, color: label.startsWith("—") ? "var(--muted)" : "var(--ink2)", paddingLeft: label.startsWith("—") ? 12 : 0 }}>{label}</span>
                          <span style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── 6. HANDLINGER ── */}
            <div className="card">
              <div className="card-lbl">Handlinger</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <button className="btn btn-sm" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                    background: isFavorite(scanResult.code) ? "var(--amber-lt)" : "var(--paper2)",
                    color: isFavorite(scanResult.code) ? "var(--amber)" : "var(--ink2)",
                    border:"1px solid var(--border)" }}
                  onClick={() => toggleFavorite(scanResult)}>
                  <Icon name="heart" size={15} color={isFavorite(scanResult.code) ? "var(--amber)" : "var(--muted)"} />
                  {isFavorite(scanResult.code) ? "Fjern" : "Favorit"}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ flex:1 }}
                  onClick={() => { if(navigator.share) navigator.share({title:scanResult.name, text:scanResult.headline}); }}>
                  Del
                </button>
                <button className="btn btn-outline btn-sm" style={{ flex:1 }}
                  onClick={() => { setEditStep("start"); setEditIngText(scanResult?.ingredients || ""); setEditNote(""); setEditType(null); setScreen(SCREENS.SUGGEST_EDIT); }}>
                  Foreslå ændring
                </button>
              </div>
            </div>

            {/* ── 7. TRUST-LAG — confidence score og verifikation ── */}
            {(() => {
              const { confidence } = compareAllergens(scanResult.allergen_flags||{}, activeIds);
              const verifiedAt = scanResult.verified_at || scanResult.updated_at;
              const daysSince = verifiedAt ? Math.floor((Date.now() - new Date(verifiedAt).getTime()) / 86400000) : null;

              const confidenceConfig = {
                high:   { color:"var(--green)", bg:"var(--green-lt)",  border:"var(--green-mid)", icon:"✓", label:"Høj sikkerhed",    desc:"Allergendata er verificeret og pålidelig." },
                medium: { color:"var(--amber)", bg:"var(--amber-lt)",  border:"var(--amber-md)",  icon:"⚠", label:"Middel sikkerhed", desc:"Visse allergener kunne ikke bekræftes fuldt ud." },
                low:    { color:"var(--muted)", bg:"var(--paper2)",    border:"var(--border2)",   icon:"?", label:"Lav sikkerhed",    desc:"Begrænsede allergendata — tjek altid emballagen." },
              };
              const cfg = confidenceConfig[confidence] || confidenceConfig.low;

              return (
                <div style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: daysSince !== null ? 6 : 0 }}>
                    <div style={{ fontSize:16, fontWeight:800, color:cfg.color, flexShrink:0 }}>{cfg.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{cfg.label}</div>
                      <div style={{ fontSize:11, color:"var(--muted)", marginTop:1, lineHeight:1.4 }}>{cfg.desc}</div>
                    </div>
                    {scanResult.verified_status === "verified" && (
                      <div style={{ fontSize:10, fontWeight:700, color:"var(--green)", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:20, padding:"2px 8px", flexShrink:0 }}>Verificeret</div>
                    )}
                  </div>
                  {daysSince !== null && (
                    <div style={{ fontSize:10, color:"var(--muted)", paddingTop:6, borderTop:`1px solid ${cfg.border}` }}>
                      Sidst opdateret: {daysSince === 0 ? "i dag" : daysSince === 1 ? "i går" : `for ${daysSince} dage siden`}
                      {daysSince > 180 && " · Data kan være forældet"}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ PRODUKT IKKE FUNDET ══ */}
        {screen === SCREENS.NOTFOUND && (
          <div className="screen fade-in">

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 0 14px" }}>
              <button onClick={() => setScreen(SCREENS.HOME)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2">
                  <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Nyt produkt</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:1, fontFamily:"monospace" }}>EAN: {notFoundEan}</div>
              </div>
              {/* Fremgangsindikator */}
              <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                {[1,2,3].map(s => (
                  <div key={s} style={{
                    width: notFoundStep === s ? 20 : 8,
                    height:8, borderRadius:4, transition:"all .3s",
                    background: s < notFoundStep ? "var(--green)" : s === notFoundStep ? "var(--ink)" : "var(--border2)"
                  }} />
                ))}
              </div>
            </div>

            {/* ── TRIN 1: Fotografér forsiden ── */}
            {notFoundStep === 1 && !ocrLoading && (
              <div className="fade-in">
                <div style={{ background:"var(--ink)", borderRadius:16, padding:"24px 20px", marginBottom:16, textAlign:"center" }}>
                  <div style={{ fontSize:52, marginBottom:10 }}>📦</div>
                  <div style={{ fontSize:18, fontWeight:900, color:"#fff", marginBottom:8 }}>
                    Vi kender ikke dette produkt
                  </div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", lineHeight:1.7 }}>
                    Tag 2 hurtige billeder — vi finder automatisk navn og allergener
                  </div>
                </div>

                {/* Trin-oversigt */}
                <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                  {[
                    { num:1, emoji:"📸", label:"Forside", desc:"Produktnavn" },
                    { num:2, emoji:"🔍", label:"Ingredienser", desc:"Allergenanalyse" },
                    { num:3, emoji:"✓", label:"Bekræft", desc:"Send ind" },
                  ].map(s => (
                    <div key={s.num} style={{ flex:1, background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"12px 8px", textAlign:"center", boxShadow:"var(--sh)" }}>
                      <div style={{ fontSize:22, marginBottom:4 }}>{s.emoji}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)" }}>{s.label}</div>
                      <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{s.desc}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>
                  Trin 1 — Fotografér produktets forside
                </div>
                <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.6, marginBottom:16 }}>
                  Hold telefonen foran produktets forside. Vi bruger billedet til at hente produktnavnet automatisk.
                </div>

                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                  width:"100%", padding:"16px", borderRadius:14, cursor:"pointer",
                  background:"var(--ink)", border:"none", color:"#fff",
                  fontSize:15, fontWeight:800, boxShadow:"0 4px 16px rgba(31,39,51,.25)",
                  marginBottom:10,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Fotografér forsiden
                  <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleProductImageCapture} />
                </label>
                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  width:"100%", padding:"13px", borderRadius:12, cursor:"pointer",
                  background:"#fff", border:"1.5px solid var(--border2)", color:"var(--ink2)",
                  fontSize:13, fontWeight:600, marginBottom:10,
                }}>
                  📁 Vælg fra galleri
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={handleProductImageCapture} />
                </label>
                <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", padding:"8px 0", fontFamily:"var(--f)" }}
                  onClick={() => setNotFoundStep(2)}>
                  Spring forside over →
                </button>
              </div>
            )}

            {/* ── SCANNING-LOADER ── */}
            {ocrLoading && (
              <div className="fade-in" style={{ textAlign:"center", padding:"60px 20px" }}>
                <div style={{ width:64, height:64, border:"4px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" }} />
                <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>
                  {notFoundStep === 1 ? "Henter produktnavn…" : "Analyserer ingredienser…"}
                </div>
                <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>
                  {notFoundStep === 1
                    ? "Vores AI læser produktnavnet fra billedet"
                    : "Vi finder allergener og ingredienser automatisk"
                  }
                </div>
              </div>
            )}

            {/* ── TRIN 2: Fotografér ingredienslisten ── */}
            {notFoundStep === 2 && !ocrLoading && (
              <div className="fade-in">
                {/* Vis produktbillede + navn hvis hentet */}
                {productImagePreview && (
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#fff", border:"1px solid var(--border)", borderRadius:12, marginBottom:14, boxShadow:"var(--sh)" }}>
                    <img src={productImagePreview} alt="Produkt"
                      style={{ width:52, height:52, objectFit:"contain", borderRadius:8, border:"1px solid var(--border)", flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <input
                        value={proposedName}
                        onChange={e => setProposedName(e.target.value)}
                        placeholder="Produktnavn…"
                        style={{ width:"100%", border:"none", outline:"none", fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--ink)", background:"transparent", padding:0 }}
                      />
                      <div style={{ fontSize:11, color:"var(--green)", marginTop:2 }}>✓ Forside fotograferet</div>
                    </div>
                  </div>
                )}

                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>
                  Trin 2 — Fotografér ingredienslisten
                </div>

                {/* Visuel guide */}
                <div style={{ background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:10 }}>Sådan finder du ingredienslisten:</div>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5 }}>Vend pakken om — ingredienslisten starter typisk med "Ingredienser:" eller "Indeholder:"</div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5 }}>Hold telefonen stille og vent til teksten er skarp</div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5 }}>God belysning giver bedre resultat — undgå skygger</div>
                  </div>
                </div>

                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                  width:"100%", padding:"16px", borderRadius:14, cursor:"pointer",
                  background:"var(--green)", border:"none", color:"#fff",
                  fontSize:15, fontWeight:800, boxShadow:"0 4px 16px rgba(34,197,94,.3)",
                  marginBottom:10,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Fotografér ingredienslisten
                  <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleImageCapture} />
                </label>
                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  width:"100%", padding:"13px", borderRadius:12, cursor:"pointer",
                  background:"#fff", border:"1.5px solid var(--border2)", color:"var(--ink2)",
                  fontSize:13, fontWeight:600, marginBottom:10,
                }}>
                  📁 Vælg fra galleri
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={handleImageCapture} />
                </label>
                {scanError && <div className="error-box" style={{ marginBottom:10 }}>⚠️ {scanError}</div>}
                <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", padding:"8px 0", fontFamily:"var(--f)" }}
                  onClick={() => { setProposedFlags({}); setNotFoundStep(3); }}>
                  Spring ingredienser over →
                </button>
              </div>
            )}

            {/* ── TRIN 3: Bekræft og send ── */}
            {notFoundStep === 3 && !ocrLoading && (
              <div className="fade-in">
                {/* Produktkort */}
                <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"var(--sh)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    {productImagePreview
                      ? <img src={productImagePreview} alt="Produkt" style={{ width:60, height:60, objectFit:"contain", borderRadius:10, border:"1px solid var(--border)", flexShrink:0 }} />
                      : <div style={{ width:60, height:60, borderRadius:10, background:"var(--paper2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>📦</div>
                    }
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600, marginBottom:4 }}>Produktnavn</div>
                      <input
                        value={proposedName}
                        onChange={e => setProposedName(e.target.value)}
                        placeholder="Skriv produktnavn…"
                        className="field"
                        style={{ padding:"8px 12px", fontSize:14 }}
                      />
                    </div>
                  </div>
                  {/* Ændre billede */}
                  <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--muted)", cursor:"pointer" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Skift forsidebillede
                    <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleProductImageCapture} />
                  </label>
                </div>

                {/* Ingredienser */}
                {ocrText ? (
                  <div style={{ background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"var(--green)" }}>✓ Ingredienser hentet</div>
                      <label style={{ fontSize:11, color:"var(--green)", cursor:"pointer", fontWeight:600 }}>
                        Nyt billede
                        <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleImageCapture} />
                      </label>
                    </div>
                    <div style={{ fontSize:11, color:"var(--muted2)", lineHeight:1.6, maxHeight:80, overflowY:"auto" }}>{ocrText}</div>
                  </div>
                ) : (
                  <div style={{ background:"var(--amber-lt)", border:"1px solid var(--amber-md)", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--amber)", marginBottom:6 }}>⚠ Ingen ingredienser endnu</div>
                    <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--amber)", cursor:"pointer", fontWeight:600 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      Fotografér ingredienslisten nu
                      <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleImageCapture} />
                    </label>
                  </div>
                )}

                {/* Detekterede allergener — toggle */}
                <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:12, boxShadow:"var(--sh)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>Allergener</div>
                    <div style={{ fontSize:11, color:"var(--muted)" }}>Tryk for at til/fra</div>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {ALLERGENS.filter(a => !["svovl","lupin","bloeddyr"].includes(a.id)).map(a => {
                      const val = proposedFlags?.[a.id];
                      const isOn = val === "yes" || val === true;
                      const isTrace = val === "traces";
                      return (
                        <div key={a.id}
                          onClick={() => {
                            setProposedFlags(prev => {
                              const cur = prev?.[a.id];
                              // Cycler: off → yes → traces → off
                              const next = !cur || cur === false ? "yes"
                                : cur === "yes" ? "traces"
                                : false;
                              return { ...prev, [a.id]: next };
                            });
                          }}
                          style={{
                            display:"flex", alignItems:"center", gap:5,
                            padding:"6px 11px", borderRadius:100, cursor:"pointer",
                            border:`1.5px solid ${isOn ? "var(--red-md)" : isTrace ? "var(--amber-md)" : "var(--border2)"}`,
                            background: isOn ? "var(--red-lt)" : isTrace ? "var(--amber-lt)" : "var(--paper2)",
                            transition:"all .15s",
                          }}>
                          <span style={{ fontSize:14 }}>{a.emoji}</span>
                          <span style={{ fontSize:11, fontWeight:700, color: isOn ? "var(--red)" : isTrace ? "var(--amber)" : "var(--muted2)" }}>
                            {a.label}
                          </span>
                          {isOn && <span style={{ fontSize:9, fontWeight:800, color:"var(--red)", background:"var(--red-lt)", padding:"1px 5px", borderRadius:4 }}>JA</span>}
                          {isTrace && <span style={{ fontSize:9, fontWeight:800, color:"var(--amber)", background:"var(--amber-lt)", padding:"1px 5px", borderRadius:4 }}>SPOR</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize:10, color:"var(--muted)", marginTop:10, lineHeight:1.5 }}>
                    Ét tryk = indeholder · To tryk = spor · Tre tryk = fjern
                  </div>
                </div>

                {/* Info */}
                <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 12px", background:"var(--paper2)", borderRadius:10, marginBottom:14 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
                    <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 16v-4M12 8h.01"/>
                  </svg>
                  <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5 }}>
                    Dit bidrag gennemgås af EatSafe-teamet inden publicering. Tak fordi du hjælper!
                  </div>
                </div>

                {scanError && <div className="error-box" style={{ marginBottom:10 }}>⚠️ {scanError}</div>}

                <button
                  onClick={submitProduct}
                  disabled={submitting || !proposedName.trim()}
                  style={{ width:"100%", background: proposedName.trim() ? "var(--ink)" : "var(--border2)", color:"#fff", border:"none",
                    borderRadius:12, padding:"15px", fontFamily:"var(--f)", fontSize:15,
                    fontWeight:800, cursor: proposedName.trim() ? "pointer" : "not-allowed", marginBottom:8,
                    opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Sender…" : "Send produkt ind ✓"}
                </button>
                <button className="btn btn-ghost btn-full" onClick={() => setNotFoundStep(2)}>← Tilbage</button>
              </div>
            )}

          </div>
        )}

        {/* ══ INDSENDELSE BEKRÆFTET ══ */}
        {screen === SCREENS.SUBMITTED && (
          <div className="screen fade-in">
            <div className="card" style={{ textAlign:"center", padding:"40px 24px", marginTop:32 }}>
              <div style={{ marginBottom:16 }}><Icon name="check" size={56} color="var(--green)" /></div>
              <div style={{ fontSize:22, fontWeight:900, color:"var(--text)", marginBottom:8 }}>Tak for dit bidrag!</div>
              <div style={{ fontSize:14, color:"var(--muted)", lineHeight:1.7, marginBottom:20 }}>
                Din indsendelse er modtaget og afventer godkendelse af vores team. Når produktet er godkendt, vil det være tilgængeligt for alle brugere.
              </div>
              <div className="info-box" style={{ textAlign:"left" }}>ℹ️ Midlertidigt allergenresultat er baseret på OCR-analysen og er ikke verificeret endnu.</div>
              {proposedFlags && (
                <div style={{ textAlign:"left", marginBottom:16 }}>
                  <div className="card-lbl">Analyserede allergener</div>
                  <div className="tags">
                    {Object.entries(proposedFlags).filter(([,v]) => v==="yes"||v==="traces").map(([k,v]) => {
                      const a = ALLERGENS.find(x=>x.id===k);
                      return a ? <div key={k} className="tag">{a.emoji} {a.label}</div> : null;
                    })}
                    {Object.entries(proposedFlags).filter(([,v]) => v==="yes"||v==="traces").length===0 && <div style={{fontSize:13,color:"var(--muted)"}}>Ingen allergener detekteret</div>}
                  </div>
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-full" onClick={() => { setOcrText(""); setProposedFlags(null); setScreen(SCREENS.HOME); }}>← Tilbage til hjem</button>
          </div>
        )}

        {/* ══ SØG ══ */}
        {screen === SCREENS.SEARCH && (
          <div className="screen fade-in">
            <div className="screen-title">Søg varer</div>

            {/* Profil-bar — samme som hjem */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                {(() => {
                  const allIds = ["user", ...family.map(m => m.id)];
                  const allActive = allIds.every(id => activeProfiles.includes(id));
                  return (
                    <>
                      <button onClick={() => setActiveProfiles(allIds)}
                        style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20,
                          border:"1.5px solid var(--green)",
                          background: allActive ? "var(--green)" : "var(--green-lt)",
                          color: allActive ? "#fff" : "var(--green)", cursor:"pointer", fontFamily:"var(--f)" }}>
                        Vælg alle
                      </button>
                      <button onClick={() => setActiveProfiles([])}
                        style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20,
                          border:"1.5px solid var(--border)",
                          background:"var(--paper2)", color:"var(--muted)", cursor:"pointer", fontFamily:"var(--f)" }}>
                        Fravælg alle
                      </button>
                    </>
                  );
                })()}
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                {[{id:"user", name: user.name, allergenCount: allergens.length}, ...family.map(m => ({id:m.id, name:m.name, allergenCount:(m.allergens||[]).length}))].map(p => {
                  const isActive = activeProfiles.includes(p.id);
                  return (
                    <div key={p.id} onClick={() => setProfilePopup(p.id)}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer" }}>
                      <div style={{ position:"relative" }}>
                        <div style={{ width:38, height:38, borderRadius:"50%",
                          background: isActive ? "var(--green)" : "var(--paper2)",
                          color: isActive ? "#fff" : "var(--muted)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:13, fontWeight:800,
                          border: `2px solid ${isActive ? "var(--green)" : "var(--border)"}`,
                          boxShadow: isActive ? "0 0 0 2px var(--green-lt)" : "none",
                          transition:"all .2s" }}>
                          {initials(p.name || "?")}
                        </div>
                        {p.allergenCount > 0 && (
                          <div style={{ position:"absolute", bottom:-1, right:-1, width:14, height:14,
                            background:"var(--red)", borderRadius:"50%", border:"2px solid var(--paper)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:8, color:"#fff", fontWeight:800 }}>
                            {p.allergenCount}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:9, fontWeight:700, color: isActive ? "var(--green)" : "var(--muted2)",
                        maxWidth:40, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {p.name?.split(" ")[0] || "Mig"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <input
                className="field"
                placeholder="Søg på produkt eller mærke…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { setSearchResults([]); }}}
                style={{ flex:1, marginBottom:0 }}
                autoFocus
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ whiteSpace:"nowrap", padding:"0 16px" }}
                onClick={() => { setSearchResults([]); }}
                disabled={!searchQuery.trim()}
              >
                Søg
              </button>
            </div>
            {/* Kategori filter */}
            <div style={{ marginBottom:10 }}>
              <CategorySelect
                value={searchCategory}
                onChange={setSearchCategory}
                options={[
                  {id:"alle",          label:"Alle kategorier"},
                  {id:"Drikkevarer",   label:"Drikkevarer"},
                  {id:"Kolonial",      label:"Kolonial"},
                  {id:"Snacks & slik", label:"Snacks & slik"},
                  {id:"Mejeri & æg",   label:"Mejeri & æg"},
                  {id:"Frugt & grønt", label:"Frugt & grønt"},
                  {id:"Frost",         label:"Frost"},
                  {id:"Brød & bagværk",label:"Brød & bagværk"},
                  {id:"Kød & fisk",    label:"Kød & fisk"},
                  {id:"Færdigretter",  label:"Færdigretter"},
                ]}
              />
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div className={`filter-chip${showSafeOnly?" active":""}`} onClick={() => setShowSafeOnly(v => !v)}>
                {showSafeOnly ? "Kun sikre" : "Vis kun sikre"}
              </div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>{searchResults.length} resultat{searchResults.length!==1?"er":""}</div>
            </div>
            {searchLoading && <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Søger…</div></div>}
            {searchLoading && searchResults.length===0 && (
              <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Søger…</div></div>
            )}
            {false && (
              <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", padding:"8px", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <div className="spinner" style={{ width:14, height:14, borderWidth:2 }} />
                Søger i Open Food Facts…
              </div>
            )}
            {!searchLoading && searchQuery && searchResults.length===0 && (
              <div className="empty-state"><div className="empty-txt">Ingen resultater</div><div className="empty-sub">Prøv et andet søgeord</div></div>
            )}
            {!searchQuery && (
              <div className="empty-state"><div className="empty-txt">Søg efter et produkt</div><div className="empty-sub">Skriv et produktnavn eller mærke</div></div>
            )}
            {searchResults.filter(p => {
              if (showSafeOnly && p.conflicts?.length > 0) return false;
              if (searchCategory !== "alle" && p.category !== searchCategory) return false;
              return true;
            }).map(p => {
              const { status, matchedDanger, matchedWarning, hasUnknown } = compareAllergens(p.allergen_flags||{}, activeIds);
              const statusColor = status==="safe" ? "var(--green)" : status==="danger" ? "var(--red)" : "var(--amber)";
              const statusLabel = status==="safe" ? "Sikker" : status==="danger" ? "Farlig" : "Advarsel";
              return (
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"10px 0", borderBottom:"1px solid var(--border)", cursor:"pointer" }}
                  onClick={() => lookupProduct(p.ean||p.id)}>
                  <ProductImage product={p} size={44} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{p.name}</div>
                    <div style={{ fontSize:11, color:"var(--muted)" }}>{p.brand}{p.category ? ` · ${p.category}` : ""}</div>
                    {p.tags && p.tags.length > 0 && (
                      <div style={{ display:"flex", gap:4, marginTop:3, flexWrap:"wrap" }}>
                        {p.tags.map((t,i) => {
                          const tagLabels = { vegan:"🌱 Vegansk", vegetarian:"🥦 Vegetarisk" };
                          return <span key={i} style={{ fontSize:10, fontWeight:700, color:"var(--green)", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:100, padding:"1px 7px" }}>{tagLabels[t]||t}</span>;
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:statusColor }}>{statusLabel}</div>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize:11, padding:"3px 8px" }}
                      onClick={e => { e.stopPropagation(); addToList(p.name); }}>+ Liste</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ INDKØBSLISTE ══ */}
        {screen === SCREENS.LIST && (
          <div className="screen fade-in">
            <div className="screen-title">Indkøbsliste</div>



            {/* Favoritter */}
            {favorites.length > 0 && (
              <div className="card" style={{ marginBottom:12 }}>
                <div className="card-lbl" style={{ marginBottom:10 }}>Dine favoritter</div>
                {favorites.slice(0,10).map(p => {
                  const { status } = compareAllergens(p.allergen_flags||{}, activeIds);
                  const statusColor = status==="safe" ? "var(--green)" : status==="danger" ? "var(--red)" : "var(--amber)";
                  const statusLabel = status==="safe" ? "Sikker" : status==="danger" ? "Farlig" : "Advarsel";
                  return (
                    <div key={p.ean||p.id} style={{ display:"flex", alignItems:"center", gap:10,
                      padding:"10px 0", borderBottom:"1px solid var(--border)", cursor:"pointer" }}
                      onClick={() => lookupProduct(p.ean||p.code||p.id)}>
                      <ProductImage product={p} size={44} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{p.name}</div>
                        <div style={{ fontSize:11, color:"var(--muted)" }}>{p.brand}</div>
                        {p.tags && p.tags.length > 0 && (
                          <div style={{ display:"flex", gap:4, marginTop:3, flexWrap:"wrap" }}>
                            {p.tags.map((t,i) => {
                              const tagLabels = { vegan:"🌱 Vegansk", vegetarian:"🥦 Vegetarisk" };
                              return <span key={i} style={{ fontSize:10, fontWeight:700, color:"var(--green)", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:100, padding:"1px 7px" }}>{tagLabels[t]||t}</span>;
                            })}
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

            <div className="share-bar">
              <span style={{ fontSize:18 }}></span>
              <span className="share-txt">Del listen med familie via link</span>
              <button className="btn btn-ghost btn-sm" style={{ fontSize:12 }} onClick={() => { navigator.clipboard?.writeText(window.location.href); alert("Link kopieret! 📋"); }}>Kopiér</button>
            </div>
            <div className="card" style={{ padding:"13px 14px", marginBottom:14 }}>
              <div className="card-lbl">Tilføj vare</div>
              <div className="input-row">
                <input className="field" placeholder="Fx. Glutenfri pasta…" value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key==="Enter" && addToList(newItemName)} />
                <button className="btn btn-primary btn-sm" style={{ whiteSpace:"nowrap" }} onClick={() => addToList(newItemName)}>Tilføj</button>
              </div>
            </div>
            {shoppingList.length===0 && <div className="empty-state"><div className="empty-txt">Listen er tom</div><div className="empty-sub">Tilføj din første vare</div></div>}
            {shoppingList.filter(i => !i.checked).length>0 && (
              <><div className="list-section">Mangler ({shoppingList.filter(i=>!i.checked).length})</div>
              {shoppingList.filter(i => !i.checked).map(item => (
                <div key={item.id} className="list-item">
                  <div className="list-check" onClick={() => toggleItem(item.id)} />
                  <div className="list-name">{item.name}</div>
                  <div className="list-del" onClick={() => removeItem(item.id)}><Icon name="trash" size={16} color="var(--muted)" /></div>
                </div>
              ))}</>
            )}
            {shoppingList.filter(i => i.checked).length>0 && (
              <><div className="list-section" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>Købt ({shoppingList.filter(i=>i.checked).length})</span>
                <span style={{ cursor:"pointer", color:"var(--red)", fontWeight:700, fontSize:12 }} onClick={clearDone}>Ryd</span>
              </div>
              {shoppingList.filter(i => i.checked).map(item => (
                <div key={item.id} className="list-item done">
                  <div className="list-check checked" onClick={() => toggleItem(item.id)}>✓</div>
                  <div className="list-name done">{item.name}</div>
                  <div className="list-del" onClick={() => removeItem(item.id)}><Icon name="trash" size={16} color="var(--muted)" /></div>
                </div>
              ))}</>
            )}
          </div>
        )}

        {/* ══ HISTORIK ══ */}
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

        {/* ══ PROFIL ══ */}
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
                <button onClick={() => { if(window.confirm("Er du sikker? Dette kan ikke fortrydes.")) alert("Kontakt support@eatsafe.dk for at slette konto."); }}
                  style={{ flex:1, padding:"11px", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--red)", cursor:"pointer" }}>
                  Slet konto
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ══ TICKET DETALJE ══ */}
        {openTicket && (
          <div style={{ position:"fixed", inset:0, zIndex:9990, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end" }}
            onClick={e => e.target === e.currentTarget && setOpenTicket(null)}>
            <div style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"90vh", overflowY:"auto" }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                <button onClick={() => setOpenTicket(null)}
                  style={{ background:"var(--paper2)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--muted)" }}>×</button>
                <div style={{ flex:1, fontSize:16, fontWeight:800, color:"var(--ink)" }}>🐛 Ticket #{openTicket.id?.slice(0,8)}</div>
              </div>

              {/* Status knapper */}
              <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                {[
                  { val:"open",        label:"🔴 Åben" },
                  { val:"in_progress", label:"🟡 I gang" },
                  { val:"resolved",    label:"🟢 Løst" },
                  { val:"closed",      label:"⚫ Lukket" },
                ].map(s => (
                  <button key={s.val} onClick={() => updateTicketStatus(openTicket.id, s.val)}
                    style={{ flex:1, padding:"8px 4px", borderRadius:10, border:`1.5px solid ${openTicket.status===s.val?"var(--ink)":"var(--border)"}`,
                      background: openTicket.status===s.val ? "var(--ink)" : "#fff",
                      fontFamily:"var(--f)", fontSize:10, fontWeight:700,
                      color: openTicket.status===s.val ? "#fff" : "var(--muted)", cursor:"pointer" }}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Beskrivelse */}
              <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:10 }}>
                <div style={{ fontSize:11, color:"var(--muted)", fontWeight:700, marginBottom:6 }}>BESKRIVELSE</div>
                <div style={{ fontSize:14, color:"var(--ink)", lineHeight:1.7 }}>{openTicket.description}</div>
              </div>

              {/* Skærmbillede */}
              {openTicket.image_base64 && (
                <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:10 }}>
                  <div style={{ fontSize:11, color:"var(--muted)", fontWeight:700, marginBottom:8 }}>SKÆRMBILLEDE</div>
                  <img src={`data:image/jpeg;base64,${openTicket.image_base64}`} alt="Screenshot"
                    style={{ width:"100%", borderRadius:8, objectFit:"contain" }} />
                </div>
              )}

              {/* Diagnostisk info */}
              {openTicket.context && (
                <div style={{ background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:10 }}>
                  <div style={{ fontSize:11, color:"var(--muted)", fontWeight:700, marginBottom:8 }}>📊 DIAGNOSTISK INFO</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {[
                      ["Bruger", openTicket.context.user_name || "Anonym"],
                      ["Email", openTicket.context.user_email || "—"],
                      ["Skærm", openTicket.context.screen],
                      ["Enhed", /iPhone|iPad/.test(openTicket.context.user_agent||"")?"iOS":/Android/.test(openTicket.context.user_agent||"")?"Android":"Desktop"],
                      ["Viewport", openTicket.context.viewport],
                      ["Version", openTicket.context.app_version],
                      ["Allergener", openTicket.context.allergens_count],
                      ["Familie", openTicket.context.family_count],
                      ["Scanninger", openTicket.context.history_count],
                      ["Online", openTicket.context.online ? "Ja" : "Nej"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background:"#fff", borderRadius:8, padding:"8px 10px" }}>
                        <div style={{ fontSize:9, color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:".4px" }}>{k}</div>
                        <div style={{ fontSize:12, fontWeight:600, color:"var(--ink)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kopi til Claude */}
              <div style={{ background:"var(--ink)", borderRadius:12, padding:"14px", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#fff", marginBottom:6 }}>📋 Send til Claude til fejlretning</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", lineHeight:1.6, marginBottom:10 }}>
                  Kopiér nedenstående og indsæt direkte i Claude-chatten:
                </div>
                <button onClick={() => {
                  const txt = `EatSafe Beta Bug Report #${openTicket.id?.slice(0,8)}
Type: ${openTicket.type}
Skærm: ${openTicket.context?.screen}
Bruger: ${openTicket.context?.user_name} (${openTicket.context?.user_email})
Enhed: ${openTicket.context?.user_agent?.slice(0,80)}
Viewport: ${openTicket.context?.viewport}
Tidspunkt: ${new Date(openTicket.created_at).toLocaleString("da-DK")}

BESKRIVELSE:
${openTicket.description}`;
                  navigator.clipboard?.writeText(txt).then(() => alert("Kopieret!")).catch(() => alert(txt));
                }}
                  style={{ width:"100%", background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.2)", borderRadius:10, padding:"10px", fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer" }}>
                  📋 Kopiér til Claude
                </button>
              </div>

              <button onClick={() => setOpenTicket(null)}
                style={{ width:"100%", background:"none", border:"none", padding:"10px", fontFamily:"var(--f)", fontSize:13, color:"var(--muted)", cursor:"pointer" }}>
                Luk
              </button>
            </div>
          </div>
        )}

        {/* ══ FAMILIE ══ */}
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

        {/* ══ ADMIN ══ */}
        {screen === SCREENS.ADMIN && !openSubmission && !openTicket && (
          <div className="screen fade-in">

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 0 14px" }}>
              <button onClick={() => setScreen(SCREENS.PROFILE)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2"><path strokeLinecap="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div style={{ flex:1, fontSize:18, fontWeight:900, color:"var(--ink)" }}>🛡️ Admin</div>
              <button onClick={() => { loadAdminStats(); if (adminSection==="submissions") loadSubmissions(submissionFilter); if (adminSection==="tickets") loadTickets(); }}
                style={{ background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:10, padding:"6px 12px", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink2)", cursor:"pointer" }}>
                🔄
              </button>
            </div>

            {/* Sektion tabs */}
            <div style={{ display:"flex", gap:4, marginBottom:16, background:"var(--paper2)", padding:4, borderRadius:12 }}>
              {[
                { id:"dashboard",   label:"📊" },
                { id:"users",       label:"👥" },
                { id:"submissions", label:"📦" },
                { id:"tickets",     label:"🐛" },
              ].map(s => (
                <button key={s.id} onClick={() => {
                  setAdminSection(s.id);
                  if (s.id === "submissions") loadSubmissions(submissionFilter);
                  if (s.id === "tickets") loadTickets();
                  if (s.id === "dashboard") loadAdminStats();
                  if (s.id === "users") loadAdminUsers();
                }}
                  style={{ flex:1, padding:"10px 4px", borderRadius:9, border:"none",
                    background: adminSection===s.id ? "#fff" : "transparent",
                    boxShadow: adminSection===s.id ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                    fontFamily:"var(--f)", fontSize:16, fontWeight:700,
                    color: adminSection===s.id ? "var(--ink)" : "var(--muted)", cursor:"pointer" }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* ── DASHBOARD ── */}
            {adminSection === "dashboard" && (
              <div className="fade-in">
                <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Brugere</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                  {[
                    { n:adminStats?.total_users,     emoji:"👤", label:"Brugere i alt",   color:"var(--ink)" },
                    { n:adminStats?.new_users_today,  emoji:"🆕", label:"Nye i dag",        color:"var(--green)" },
                    { n:adminStats?.total_scans,      emoji:"📱", label:"Scanninger i alt", color:"var(--ink)" },
                    { n:adminStats?.scans_today,      emoji:"⚡", label:"Scanninger i dag", color:"var(--amber)" },
                  ].map(({ n, emoji, label, color }) => (
                    <div key={label} style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"16px 14px", boxShadow:"var(--sh)" }}>
                      <div style={{ fontSize:24, marginBottom:4 }}>{emoji}</div>
                      <div style={{ fontSize:28, fontWeight:900, color, lineHeight:1 }}>{n ?? "—"}</div>
                      <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600, marginTop:4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Database & opgaver</div>
                <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", marginBottom:14, boxShadow:"var(--sh)" }}>
                  {[
                    { emoji:"📦", label:"Produkter i databasen",   n:adminStats?.total_products,        color:"var(--ink)" },
                    { emoji:"👨‍👩‍👧", label:"Familiemedlemmer oprettet", n:adminStats?.total_families,         color:"var(--ink)" },
                    { emoji:"⏳", label:"Indsendelser afventer",   n:adminStats?.pending_submissions,    color:"var(--amber)", action:() => { setAdminSection("submissions"); setSubmissionFilter("pending"); loadSubmissions("pending"); } },
                    { emoji:"🐛", label:"Åbne tickets",             n:adminStats?.open_tickets,           color:"var(--red)",   action:() => { setAdminSection("tickets"); loadTickets(); } },
                  ].map(({ emoji, label, n, color, action }, i, arr) => (
                    <div key={label} onClick={action}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none", cursor: action ? "pointer" : "default" }}>
                      <span style={{ fontSize:20 }}>{emoji}</span>
                      <span style={{ flex:1, fontSize:13, color:"var(--ink2)", fontWeight:500 }}>{label}</span>
                      <span style={{ fontSize:18, fontWeight:900, color }}>{n ?? "—"}</span>
                      {action && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>}
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Hurtige handlinger</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { emoji:"📦", label:"Godkend indsendelser", color:"var(--amber)", fn:() => { setAdminSection("submissions"); setSubmissionFilter("pending"); loadSubmissions("pending"); } },
                    { emoji:"🐛", label:"Gennemse tickets",     color:"var(--red)",   fn:() => { setAdminSection("tickets"); loadTickets(); } },
                    { emoji:"✅", label:"Godkendte produkter",  color:"var(--green)", fn:() => { setAdminSection("submissions"); setSubmissionFilter("approved"); loadSubmissions("approved"); } },
                    { emoji:"👥", label:"Administrér brugere",  color:"var(--ink)",   fn:() => { setAdminSection("users"); loadAdminUsers(); } },
                  ].map(({ emoji, label, color, fn }) => (
                    <button key={label} onClick={fn}
                      style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:6, padding:"14px", background:"#fff", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", boxShadow:"var(--sh)", fontFamily:"var(--f)", textAlign:"left" }}>
                      <span style={{ fontSize:24 }}>{emoji}</span>
                      <span style={{ fontSize:12, fontWeight:700, color }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── BRUGERE ── */}
            {adminSection === "users" && (
              <div className="fade-in">

                {/* Søgebar */}
                <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                  <input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Søg bruger…"
                    style={{ flex:1, padding:"10px 14px", border:"1.5px solid var(--border2)", borderRadius:10, fontFamily:"var(--f)", fontSize:14, background:"#fff", outline:"none", color:"var(--ink)" }}
                  />
                  {userSearch && (
                    <button onClick={() => setUserSearch("")}
                      style={{ padding:"0 12px", border:"1px solid var(--border)", borderRadius:10, background:"var(--paper2)", fontFamily:"var(--f)", fontSize:12, color:"var(--muted)", cursor:"pointer" }}>
                      ✕
                    </button>
                  )}
                </div>

                {/* Søge-parameter filter */}
                <div style={{ display:"flex", gap:5, overflowX:"auto", marginBottom:12, paddingBottom:2 }}>
                  {[
                    { id:"all",         label:"Alle felter" },
                    { id:"name",        label:"Navn" },
                    { id:"email",       label:"Email" },
                    { id:"role",        label:"Rolle" },
                    { id:"onboarding",  label:"Onboarding" },
                    { id:"admin",       label:"Kun admins" },
                    { id:"incomplete",  label:"Ufærdig onboarding" },
                  ].map(p => (
                    <button key={p.id} onClick={() => setUserSearchParam(p.id)}
                      style={{ flexShrink:0, padding:"5px 12px", borderRadius:100, border:`1.5px solid ${userSearchParam===p.id ? "var(--ink)" : "var(--border)"}`,
                        background: userSearchParam===p.id ? "var(--ink)" : "#fff",
                        fontFamily:"var(--f)", fontSize:11, fontWeight:700,
                        color: userSearchParam===p.id ? "#fff" : "var(--muted)", cursor:"pointer" }}>
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Tæller */}
                {(() => {
                  const filtered = adminUsers.filter(u => {
                    if (userSearchParam === "admin") return u.role === "admin";
                    if (userSearchParam === "incomplete") return u.onboarding_completed === false;
                    if (!userSearch.trim()) return true;
                    const q = userSearch.toLowerCase();
                    if (userSearchParam === "name") return (u.name||"").toLowerCase().includes(q);
                    if (userSearchParam === "email") return (u.email||"").toLowerCase().includes(q);
                    if (userSearchParam === "role") return (u.role||"").toLowerCase().includes(q);
                    if (userSearchParam === "onboarding") return String(u.onboarding_completed).includes(q);
                    return (u.name||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q);
                  });
                  return (
                    <>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>
                        {filtered.length} af {adminUsers.length} brugere
                      </div>
                      {adminUsersLoading && <div style={{ textAlign:"center", padding:"32px 0" }}><div style={{ width:36, height:36, border:"3px solid var(--border2)", borderTopColor:"var(--ink)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto" }} /></div>}
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {filtered.map(u => (
                          <div key={u.id} onClick={() => setOpenAdminUser(u)}
                            style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", boxShadow:"var(--sh)", cursor:"pointer" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ width:38, height:38, borderRadius:"50%", background: u.role==="admin" ? "var(--ink)" : "var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", flexShrink:0 }}>
                                {(u.name||u.email||"?").charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name || "Ingen navn"}</div>
                                <div style={{ fontSize:11, color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                              </div>
                              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:100, background: u.role==="admin" ? "var(--ink)" : "var(--paper2)", color: u.role==="admin" ? "#fff" : "var(--muted)" }}>
                                  {u.role==="admin" ? "Admin" : "Bruger"}
                                </span>
                                {u.onboarding_completed === false && <span style={{ fontSize:9, color:"var(--amber)", fontWeight:700 }}>Onboarding ufærdig</span>}
                                {u.id === userId && <span style={{ fontSize:9, color:"var(--green)", fontWeight:700 }}>← Dig</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── BRUGER DETALJE MODAL ── */}
            {openAdminUser && (
              <div style={{ position:"fixed", inset:0, zIndex:9990, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end" }}
                onClick={e => e.target === e.currentTarget && setOpenAdminUser(null)}>
                <div style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"85vh", overflowY:"auto" }}
                  onClick={e => e.stopPropagation()}>

                  {/* Header */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                    <div style={{ width:48, height:48, borderRadius:"50%", background: openAdminUser.role==="admin" ? "var(--ink)" : "var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#fff", flexShrink:0 }}>
                      {(openAdminUser.name||openAdminUser.email||"?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:17, fontWeight:900, color:"var(--ink)" }}>{openAdminUser.name || "Ingen navn"}</div>
                      <div style={{ fontSize:12, color:"var(--muted)" }}>{openAdminUser.email}</div>
                    </div>
                    <button onClick={() => setOpenAdminUser(null)}
                      style={{ background:"var(--paper2)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--muted)" }}>×</button>
                  </div>

                  {/* Info grid */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                    {[
                      ["Rolle", openAdminUser.role === "admin" ? "🛡️ Admin" : "👤 Bruger"],
                      ["Oprettet", new Date(openAdminUser.created_at).toLocaleDateString("da-DK")],
                      ["Onboarding", openAdminUser.onboarding_completed ? "✅ Færdig" : "⏳ Ikke færdig"],
                      ["Bruger-ID", openAdminUser.id?.slice(0,8) + "…"],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px" }}>
                        <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>{label}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Handlinger */}
                  {openAdminUser.id !== userId && (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <button onClick={() => { updateUserRole(openAdminUser.id, openAdminUser.role==="admin" ? "user" : "admin"); setOpenAdminUser(u => ({ ...u, role: u.role==="admin" ? "user" : "admin" })); }}
                        style={{ width:"100%", padding:"13px", background:"var(--ink)", border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"#fff", cursor:"pointer" }}>
                        {openAdminUser.role==="admin" ? "→ Skift til Bruger" : "→ Skift til Admin"}
                      </button>
                      <button onClick={() => { deleteUser(openAdminUser.id); setOpenAdminUser(null); }}
                        style={{ width:"100%", padding:"13px", background:"var(--red-lt)", border:"1.5px solid var(--red-md)", borderRadius:12, fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--red)", cursor:"pointer" }}>
                        🗑️ Slet bruger
                      </button>
                    </div>
                  )}
                  {openAdminUser.id === userId && (
                    <div style={{ padding:"12px", background:"var(--green-lt)", borderRadius:10, fontSize:13, color:"var(--green)", fontWeight:700, textAlign:"center" }}>
                      Dette er din egen konto — kan ikke ændres
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SUBMISSIONS ── */}
            {adminSection === "submissions" && (
              <div className="fade-in">
                <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                  {[
                    { val:"pending",  label:"⏳ Afventer", color:"var(--amber)" },
                    { val:"approved", label:"✅ Godkendt",  color:"var(--green)" },
                    { val:"rejected", label:"❌ Afvist",    color:"var(--red)" },
                  ].map(({ val, label, color }) => (
                    <button key={val} onClick={() => { setSubmissionFilter(val); loadSubmissions(val); }}
                      style={{ flex:1, padding:"9px 4px", borderRadius:10, border:`1.5px solid ${submissionFilter===val ? color : "var(--border)"}`,
                        background: submissionFilter===val ? (val==="pending"?"var(--amber-lt)":val==="approved"?"var(--green-lt)":"var(--red-lt)") : "#fff",
                        fontFamily:"var(--f)", fontSize:11, fontWeight:700,
                        color: submissionFilter===val ? color : "var(--muted)", cursor:"pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>
                {submissionsLoading && <div style={{ textAlign:"center", padding:"32px 0" }}><div style={{ width:36, height:36, border:"3px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto" }} /></div>}
                {!submissionsLoading && submissions.length === 0 && (
                  <div style={{ textAlign:"center", padding:"48px 0" }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>{submissionFilter==="pending"?"🎉":"📭"}</div>
                    <div style={{ fontSize:16, fontWeight:800, color:"var(--ink)" }}>{submissionFilter==="pending" ? "Ingen afventer" : "Ingen indsendelser"}</div>
                  </div>
                )}
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {submissions.map(s => {
                    const flags = s.ai_parsed_data || {};
                    const dangerAllergens = ALLERGENS.filter(a => flags[a.id]==="yes" || flags[a.id]===true);
                    const daysSince = Math.floor((Date.now() - new Date(s.created_at).getTime()) / 86400000);
                    return (
                      <div key={s.id} onClick={() => { setOpenSubmission(s); setEditingSubmission({ name: s.ai_parsed_data?.name || s.product_name || "", brand: s.ai_parsed_data?.brand || s.brand || "", allergen_flags: s.ai_parsed_data || {} }); }}
                        style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", cursor:"pointer", boxShadow:"var(--sh)" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                          <div style={{ width:48, height:48, borderRadius:10, background:"var(--paper2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>📦</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.ai_parsed_data?.name || s.product_name || "Ukendt produkt"}</div>
                            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:6, fontFamily:"monospace" }}>EAN: {s.ean} · {daysSince === 0 ? "i dag" : `${daysSince}d siden`}</div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                              {dangerAllergens.slice(0,3).map(a => <span key={a.id} style={{ fontSize:10, padding:"2px 7px", borderRadius:100, background:"var(--red-lt)", color:"var(--red)", fontWeight:700 }}>{a.emoji} {a.label}</span>)}
                              {dangerAllergens.length === 0 && <span style={{ fontSize:10, color:"var(--muted)" }}>Ingen allergener</span>}
                            </div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TICKETS ── */}
            {adminSection === "tickets" && (
              <div className="fade-in">
                {/* Status tæller grid — klikbar filter */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginBottom:12 }}>
                  {[
                    { status:"all",         label:"Alle",   color:"var(--ink)" },
                    { status:"open",        label:"Åbne",   color:"var(--red)" },
                    { status:"in_progress", label:"I gang", color:"var(--amber)" },
                    { status:"resolved",    label:"Løst",   color:"var(--green)" },
                    { status:"closed",      label:"Lukket", color:"var(--muted)" },
                  ].map(s => {
                    const count = s.status === "all" ? adminTickets.length : adminTickets.filter(t => t.status === s.status).length;
                    const isActive = adminTicketFilter === s.status;
                    return (
                      <div key={s.status} onClick={() => setAdminTicketFilter(s.status)}
                        style={{ background: isActive ? s.color : "#fff", border:`1.5px solid ${isActive ? s.color : "var(--border)"}`, borderRadius:10, padding:"10px 6px", textAlign:"center", cursor:"pointer", transition:"all .15s",
                          gridColumn: s.status === "all" ? "1 / -1" : "auto" }}>
                        <div style={{ fontSize:18, fontWeight:900, color: isActive ? "#fff" : s.color }}>{count}</div>
                        <div style={{ fontSize:9, color: isActive ? "rgba(255,255,255,.8)" : "var(--muted)", fontWeight:700, textTransform:"uppercase" }}>{s.label}</div>
                      </div>
                    );
                  })}
                </div>
                {ticketsLoading && <div style={{ textAlign:"center", padding:"32px 0" }}><div style={{ width:36, height:36, border:"3px solid var(--border2)", borderTopColor:"var(--ink)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto" }} /></div>}
                {!ticketsLoading && adminTickets.length === 0 && <div style={{ textAlign:"center", padding:"48px 0" }}><div style={{ fontSize:48, marginBottom:12 }}>🎉</div><div style={{ fontSize:16, fontWeight:800, color:"var(--ink)" }}>Ingen tickets</div></div>}
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {adminTickets.filter(t => adminTicketFilter === "all" || t.status === adminTicketFilter).map(t => {
                    const typeConfig = { bug:{emoji:"🐛",color:"var(--red)",bg:"var(--red-lt)",label:"Fejl"}, ui:{emoji:"🎨",color:"var(--amber)",bg:"var(--amber-lt)",label:"Design"}, missing:{emoji:"💡",color:"var(--amber)",bg:"var(--amber-lt)",label:"Mangler"}, content:{emoji:"📦",color:"var(--ink2)",bg:"var(--paper2)",label:"Indhold"}, crash:{emoji:"💥",color:"var(--red)",bg:"var(--red-lt)",label:"Crash"}, suggestion:{emoji:"✨",color:"var(--green)",bg:"var(--green-lt)",label:"Forslag"} };
                    const cfg = typeConfig[t.type] || typeConfig.bug;
                    const statusColor = t.status==="open"?"var(--red)":t.status==="in_progress"?"var(--amber)":t.status==="resolved"?"var(--green)":"var(--muted)";
                    const statusLabel = t.status==="open"?"Åben":t.status==="in_progress"?"I gang":t.status==="resolved"?"Løst":"Lukket";
                    return (
                      <div key={t.id} style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", boxShadow:"var(--sh)" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }} onClick={() => setOpenTicket(t)}>
                          <div style={{ width:38, height:38, borderRadius:10, background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{cfg.emoji}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:cfg.color, background:cfg.bg, padding:"2px 8px", borderRadius:100 }}>{cfg.label}</span>
                            </div>
                            <div style={{ fontSize:13, color:"var(--ink)", lineHeight:1.4, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.description}</div>
                            <div style={{ fontSize:10, color:"var(--muted)" }}>{t.context?.user_name || "Anonym"} · {t.context?.screen} · {new Date(t.created_at).toLocaleDateString("da-DK", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0, marginTop:4 }}><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
                        </div>
                        {/* Status toggle direkte på kortet */}
                        <div style={{ display:"flex", gap:5, marginTop:10, paddingTop:10, borderTop:"1px solid var(--border)" }}>
                          {[
                            { val:"open",        label:"Åben",   color:"var(--red)" },
                            { val:"in_progress", label:"I gang", color:"var(--amber)" },
                            { val:"resolved",    label:"Løst",   color:"var(--green)" },
                            { val:"closed",      label:"Lukket", color:"var(--muted)" },
                          ].map(s => (
                            <button key={s.val} onClick={() => updateTicketStatus(t.id, s.val)}
                              style={{ flex:1, padding:"5px 2px", borderRadius:8, border:`1px solid ${t.status===s.val ? s.color : "var(--border)"}`,
                                background: t.status===s.val ? s.color : "#fff",
                                fontFamily:"var(--f)", fontSize:9, fontWeight:700,
                                color: t.status===s.val ? "#fff" : "var(--muted)", cursor:"pointer" }}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ══ ADMIN — ÅBEN SUBMISSION ══ */}
        {screen === SCREENS.ADMIN && openSubmission && editingSubmission && (
          <div className="screen fade-in">

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 0 14px" }}>
              <button onClick={() => { setOpenSubmission(null); setEditingSubmission(null); }}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2"><path strokeLinecap="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Gennemse indsendelse</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{new Date(openSubmission.created_at).toLocaleDateString("da-DK", { day:"numeric", month:"long", year:"numeric" })}</div>
              </div>
              {/* Hurtig-godkend/afvis */}
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => updateSubmissionAndApprove(openSubmission, editingSubmission)}
                  style={{ background:"var(--green)", border:"none", borderRadius:10, padding:"8px 14px", fontFamily:"var(--f)", fontSize:12, fontWeight:800, color:"#fff", cursor:"pointer" }}>
                  ✓ Godkend
                </button>
                <button onClick={() => { rejectSubmission(openSubmission.id); setOpenSubmission(null); setEditingSubmission(null); }}
                  style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10, padding:"8px 14px", fontFamily:"var(--f)", fontSize:12, fontWeight:800, color:"var(--red)", cursor:"pointer" }}>
                  ✗
                </button>
              </div>
            </div>

            {/* Produktkort */}
            <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"var(--sh)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                {openSubmission.ai_parsed_data?.product_image_base64
                  ? <img src={`data:image/jpeg;base64,${openSubmission.ai_parsed_data.product_image_base64}`}
                      style={{ width:64, height:64, borderRadius:10, objectFit:"contain", border:"1px solid var(--border)", flexShrink:0 }} alt="" />
                  : <div style={{ width:64, height:64, borderRadius:10, background:"var(--paper2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>📦</div>
                }
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600, marginBottom:4 }}>Produktnavn</div>
                  <input value={editingSubmission.name} onChange={e => setEditingSubmission(s => ({ ...s, name: e.target.value }))}
                    placeholder="Produktnavn…"
                    style={{ width:"100%", border:"none", outline:"none", fontFamily:"var(--f)", fontSize:15, fontWeight:800, color:"var(--ink)", background:"transparent", padding:0 }} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div>
                  <div style={{ fontSize:10, color:"var(--muted)", fontWeight:600, marginBottom:4 }}>BRAND</div>
                  <input value={editingSubmission.brand} onChange={e => setEditingSubmission(s => ({ ...s, brand: e.target.value }))}
                    placeholder="Brand / Mærke…" className="field" style={{ padding:"8px 10px", fontSize:13 }} />
                </div>
                <div>
                  <div style={{ fontSize:10, color:"var(--muted)", fontWeight:600, marginBottom:4 }}>EAN</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", padding:"8px 10px", background:"var(--paper2)", borderRadius:8, fontFamily:"monospace" }}>{openSubmission.ean}</div>
                </div>
              </div>
              {openSubmission.notes && (
                <div style={{ marginTop:10, padding:"8px 10px", background:"var(--amber-lt)", borderRadius:8 }}>
                  <div style={{ fontSize:10, color:"var(--amber)", fontWeight:700, marginBottom:2 }}>BRUGER-BEMÆRKNING</div>
                  <div style={{ fontSize:12, color:"var(--ink2)" }}>{openSubmission.notes}</div>
                </div>
              )}
            </div>

            {/* Foto af ingredienslisten */}
            {openSubmission.raw_label_image && (
              <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"var(--sh)" }}>
                <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:10 }}>📸 Foto af ingredienslisten</div>
                <img src={`data:image/jpeg;base64,${openSubmission.raw_label_image}`} alt="Ingrediensliste"
                  style={{ width:"100%", borderRadius:10, objectFit:"contain", maxHeight:240 }} />
              </div>
            )}

            {/* OCR tekst */}
            {openSubmission.ocr_raw_text && (
              <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"var(--sh)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>📄 Ingredienser fra OCR</div>
                  <button onClick={() => cleanOcrWithAI(openSubmission.ocr_raw_text)} disabled={cleaningOcr}
                    style={{ background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:8, padding:"5px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--green)", cursor:"pointer" }}>
                    {cleaningOcr ? "🤖 Renskriver…" : "🤖 Renskiv med AI"}
                  </button>
                </div>
                <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.7, background:"var(--paper2)", borderRadius:8, padding:"10px", maxHeight:120, overflowY:"auto" }}>
                  {openSubmission.ocr_raw_text}
                </div>
                {cleanedOcrText && (
                  <div style={{ marginTop:10, borderTop:"1px solid var(--border)", paddingTop:10 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--green)", marginBottom:6 }}>✓ AI renskrivet — tjek at intet er fjernet</div>
                    <div style={{ background:"var(--green-lt)", borderRadius:8, padding:"10px", marginBottom:8, fontSize:12, color:"var(--ink2)", lineHeight:1.7 }}>
                      {cleanedOcrText}
                    </div>
                    <button onClick={() => setEditingSubmission(s => ({ ...s, ingredients_text: cleanedOcrText }))}
                      style={{ width:"100%", background:"var(--green)", border:"none", borderRadius:10, padding:"10px", fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer" }}>
                      ✓ Brug denne version
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Allergener — toggle grid */}
            <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"var(--sh)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>Allergener</div>
                <div style={{ fontSize:10, color:"var(--muted)" }}>Ja → Spor → Nej</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {ALLERGENS.map(a => {
                  const val = editingSubmission.allergen_flags[a.id] || "no";
                  const next = val==="no" ? "yes" : val==="yes" ? "traces" : "no";
                  const isYes = val === "yes";
                  const isTrace = val === "traces";
                  return (
                    <button key={a.id} onClick={() => setEditingSubmission(s => ({ ...s, allergen_flags: { ...s.allergen_flags, [a.id]: next } }))}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, cursor:"pointer",
                        border:`1.5px solid ${isYes?"var(--red-md)":isTrace?"var(--amber-md)":"var(--border)"}`,
                        background: isYes?"var(--red-lt)":isTrace?"var(--amber-lt)":"var(--paper2)",
                        fontFamily:"var(--f)" }}>
                      <span style={{ fontSize:16 }}>{a.emoji}</span>
                      <span style={{ flex:1, fontSize:12, fontWeight:700, color:isYes?"var(--red)":isTrace?"var(--amber)":"var(--muted2)", textAlign:"left" }}>{a.label}</span>
                      <span style={{ fontSize:10, fontWeight:800, color:isYes?"var(--red)":isTrace?"var(--amber)":"var(--muted)" }}>
                        {isYes?"JA":isTrace?"SPOR":"NEJ"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Handlings-knapper */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, paddingBottom:16 }}>
              <button onClick={() => updateSubmissionAndApprove(openSubmission, editingSubmission)}
                style={{ width:"100%", background:"var(--green)", border:"none", borderRadius:12, padding:"15px", fontFamily:"var(--f)", fontSize:15, fontWeight:800, color:"#fff", cursor:"pointer", boxShadow:"0 4px 16px rgba(34,197,94,.3)" }}>
                ✅ Godkend og opret produkt
              </button>
              <button onClick={() => { rejectSubmission(openSubmission.id); setOpenSubmission(null); setEditingSubmission(null); }}
                style={{ width:"100%", background:"var(--red-lt)", border:"1.5px solid var(--red-md)", borderRadius:12, padding:"13px", fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--red)", cursor:"pointer" }}>
                ❌ Afvis indsendelse
              </button>
              <button onClick={() => { setOpenSubmission(null); setEditingSubmission(null); }}
                style={{ width:"100%", background:"none", border:"none", padding:"10px", fontFamily:"var(--f)", fontSize:13, color:"var(--muted)", cursor:"pointer" }}>
                Annullér
              </button>
            </div>

          </div>
        )}

        {/* SIDE ID — vises på alle sider */}
        <PageID screen={screen} />

        {/* ══ FAVORITTER ══ */}
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

        {/* ══ MADPAS ══ */}
        {screen === SCREENS.MADPAS && (
          <div className="mp-page fade-in">

            {/* Beregn aktive allergener baseret på valgt profil */}
            {(() => {
              const lang = madpasLang;
              const rtl = MADPAS_LANGUAGES.find(l => l.code === lang)?.rtl;
              const helloText = { en:"I have food allergies.", de:"Ich habe Lebensmittelallergien.", fr:"J'ai des allergies alimentaires.", es:"Tengo alergias alimentarias.", it:"Ho allergie alimentari.", nl:"Ik heb voedselallergieën.", pt:"Tenho alergias alimentares.", pl:"Mam alergie pokarmowe.", ja:"食物アレルギーがあります。", zh:"我有食物过敏。", ar:"لدي حساسية غذائية.", tr:"Gıda alerjilerim var.", sv:"Jag har matallergier.", no:"Jeg har matallergier.", th:"ฉันมีอาการแพ้อาหาร", el:"Έχω αλλεργίες τροφίμων.", da:"Jeg har fødevareallergier." };
              const cannotLabel = { en:"I cannot eat:", de:"Ich kann nicht essen:", fr:"Je ne peux pas manger :", es:"No puedo comer:", it:"Non posso mangiare:", nl:"Ik kan niet eten:", pt:"Não posso comer:", pl:"Nie mogę jeść:", ja:"食べられません：", zh:"我不能吃：", ar:"لا أستطيع تناول:", tr:"Yiyemiyorum:", sv:"Jag kan inte äta:", no:"Jeg kan ikke spise:", th:"ฉันไม่สามารถกิน:", el:"Δεν μπορώ να φάω:", da:"Jeg kan ikke spise:" };
              const helpText = { en:"Can you help me find something safe?", de:"Können Sie mir helfen?", fr:"Pouvez-vous m'aider ?", es:"¿Puede ayudarme?", it:"Può aiutarmi?", nl:"Kunt u mij helpen?", pt:"Pode ajudar-me?", pl:"Czy może mi pomóc?", ja:"手伝っていただけますか？", zh:"您能帮助我吗？", ar:"هل يمكنك مساعدتي؟", tr:"Yardım edebilir misiniz?", sv:"Kan du hjälpa mig?", no:"Kan du hjelpe meg?", th:"คุณช่วยฉันได้ไหม?", el:"Μπορείτε να με βοηθήσετε;", da:"Kan du hjælpe mig?" };
              const productLabel = { da:"Fx i", en:"E.g. in", de:"Z.B. in", fr:"Ex. dans", es:"Ej. en", it:"Es. in", nl:"Bijv. in", pt:"Ex. em", pl:"Np. w", sv:"T.ex. i", no:"F.eks. i", ja:"例えば", zh:"例如", ar:"مثلاً في", tr:"Örn.", th:"เช่นใน", el:"Π.χ." };
              const ingredientLabel = { da:"Se efter", en:"Look for", de:"Achten auf", fr:"Chercher", es:"Buscar", it:"Cercare", nl:"Let op", pt:"Procurar", pl:"Szukaj", sv:"Se efter", no:"Se etter", ja:"確認を", zh:"注意", ar:"ابحث عن", tr:"Ara", th:"ดูหา", el:"Ψάξτε" };
              const langInfo = MADPAS_LANGUAGES.find(l => l.code === lang);
              return (
                <div style={{ position:"fixed", inset:0, zIndex:9999, background:"#fff", display:"flex", flexDirection:"column" }} dir={rtl ? "rtl" : "ltr"}>

                  {/* Header — sprog + kryds */}
                  <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:20 }}>{langInfo?.flag}</span>
                      <span style={{ fontSize:13, color:"var(--muted)", fontWeight:600 }}>{langInfo?.name}</span>
                    </div>
                    <button onClick={() => { setMadpasWaiterView(false); if(madpasSpeaking){ window.speechSynthesis?.cancel(); setMadpasSpeaking(false); } }}
                      style={{ background:"none", border:"none", padding:4, cursor:"pointer" }}>
                      <Icon name="x" size={22} color="var(--ink2)" />
                    </button>
                  </div>

                  {/* Indhold — fuldstændig ensartet tekst */}
                  <div style={{ flex:1, overflowY:"auto", padding:"32px 28px" }}>

                    {/* Alle linjer samme font, størrelse og vægt */}
                    {(() => {
                      const s = { fontSize:17, fontWeight:400, color:"var(--ink)", margin:"0 0 16px", lineHeight:1.7, display:"block" };
                      const sIntro = { ...s, margin:"0 0 32px" };
                      const lines = [];

                      // Intro
                      const introText = {
                        da: "Hej! Jeg har nogle fødevareallergier og ønsker gerne din hjælp til at finde noget, jeg kan spise trygt.",
                        en: "Hi! I have some food allergies and would love your help finding something safe for me to eat.",
                        de: "Hallo! Ich habe einige Lebensmittelallergien und würde mich über Ihre Hilfe freuen.",
                        fr: "Bonjour ! J'ai des allergies alimentaires et j'aurais besoin de votre aide.",
                        es: "¡Hola! Tengo algunas alergias alimentarias y agradecería su ayuda.",
                        it: "Ciao! Ho alcune allergie alimentari e apprezzerei il suo aiuto.",
                        nl: "Hallo! Ik heb wat voedselallergieën en zou graag uw hulp willen.",
                        pt: "Olá! Tenho algumas alergias alimentares e gostaria da sua ajuda.",
                        pl: "Cześć! Mam kilka alergii pokarmowych i chciałbym prosić o pomoc.",
                        sv: "Hej! Jag har några matallergier och skulle uppskatta din hjälp.",
                        no: "Hei! Jeg har noen matallergier og ønsker gjerne din hjelp.",
                        ja: "こんにちは！食物アレルギーがあります。安全な食事を見つけるお手伝いをお願いできますか。",
                        zh: "您好！我有食物过敏，希望您能帮助我找到安全的食物。",
                        ar: "مرحباً! لدي بعض الحساسية الغذائية وأود مساعدتك في إيجاد شيء آمن لي.",
                        tr: "Merhaba! Gıda alerjilerim var ve güvenli bir şey bulmam için yardımınıza ihtiyacım var.",
                        el: "Γεια σας! Έχω κάποιες αλλεργίες τροφίμων και θα εκτιμούσα τη βοήθειά σας.",
                      };
                      lines.push(<span key="hello" style={sIntro}>{introText[lang] || introText.en}</span>);

                      // Allergener
                      [...mpAllergens, ...mpCustom.filter(c => !c.endsWith("_intolerance") && !mpAllergens.includes(c))].forEach((item, i) => {
                        if (typeof item !== "string") return;
                        const a = ALLERGENS.find(x => x.id === item);
                        const label = a ? (ALLERGEN_T[item]?.[lang]?.n || ALLERGEN_T[item]?.en?.n || a.label) : item;
                        const ex = a ? ALLERGEN_EXAMPLES[item] : null;
                        const exProducts = ex?.products?.[lang] || ex?.products?.en || [];
                        const exIngredients = ex?.ingredients?.[lang] || ex?.ingredients?.en || [];
                        const exText = [
                          exProducts.slice(0,3).join(", "),
                          exIngredients.slice(0,4).join(", ")
                        ].filter(Boolean).join(" · ");

                        const cannotText = {
                          da:"Jeg kan ikke spise", en:"I cannot eat", de:"Ich kann nicht essen",
                          fr:"Je ne peux pas manger", es:"No puedo comer", it:"Non posso mangiare",
                          nl:"Ik kan niet eten", pt:"Não posso comer", pl:"Nie mogę jeść",
                          sv:"Jag kan inte äta", no:"Jeg kan ikke spise", ja:"食べられません",
                          zh:"我不能吃", ar:"لا أستطيع تناول", tr:"Yiyemiyorum", el:"Δεν μπορώ να φάω",
                        };
                        lines.push(
                          <span key={`a${i}`} style={s}>
                            {i === 0 ? (cannotText[lang] || cannotText.en) + ": " : ""}{label}{exText ? ` (${exText})` : ""}
                          </span>
                        );
                      });

                      // Diæt
                      if (user.diets && user.diets.length > 0) {
                        const dietNames = user.diets.map(d => DIETS.find(x=>x.id===d)?.label).filter(Boolean).join(", ");
                        lines.push(<span key="diet" style={s}>{dietNames}</span>);
                      }

                      // E-numre
                      if (selectedENumbers && selectedENumbers.length > 0) {
                        lines.push(<span key="enum" style={s}>{selectedENumbers.join(", ")}</span>);
                      }

                      // Hjælp
                      const outroText = {
                        da: "Tak for din hjælp — det betyder rigtig meget for mig.",
                        en: "Thank you so much for your help — it means a lot to me.",
                        de: "Vielen Dank für Ihre Hilfe — das bedeutet mir sehr viel.",
                        fr: "Merci beaucoup pour votre aide — cela compte beaucoup pour moi.",
                        es: "Muchas gracias por su ayuda — significa mucho para mí.",
                        it: "Grazie mille per il suo aiuto — significa molto per me.",
                        nl: "Heel erg bedankt voor uw hulp — dat betekent veel voor mij.",
                        pt: "Muito obrigado pela sua ajuda — significa muito para mim.",
                        pl: "Bardzo dziękuję za pomoc — wiele dla mnie znaczy.",
                        sv: "Tack så mycket för din hjälp — det betyder mycket för mig.",
                        no: "Tusen takk for hjelpen — det betyr mye for meg.",
                        ja: "ご協力ありがとうございます。本当に助かります。",
                        zh: "非常感谢您的帮助，对我来说意义重大。",
                        ar: "شكراً جزيلاً على مساعدتك — هذا يعني لي الكثير.",
                        tr: "Yardımınız için çok teşekkür ederim — bu benim için çok şey ifade ediyor.",
                        el: "Σας ευχαριστώ πολύ για τη βοήθειά σας — σημαίνει πολλά για μένα.",
                      };
                      lines.push(<span key="help" style={{ ...s, marginTop:8 }}>{outroText[lang] || outroText.en}</span>);

                      return lines;
                    })()}
                  </div>

                  {/* Footer */}
                  <div style={{ padding:"12px 24px 28px", borderTop:"1px solid var(--border)", flexShrink:0, display:"flex", justifyContent:"flex-end" }}>
                    {window.speechSynthesis && (
                      <button onClick={madpasSpeak} style={{
                        background: madpasSpeaking ? "var(--amber)" : "var(--green)",
                        border:"none", borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:700,
                        color:"#fff", cursor:"pointer", fontFamily:"var(--f)",
                        display:"flex", alignItems:"center", gap:7,
                      }}>
                        <Icon name={madpasSpeaking ? "speakerOff" : "speaker"} size={15} color="#fff" />
                        {madpasSpeaking ? "Stop" : "Oplæs"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="mp-scroll">

              {/* HEADER */}
              <div className="mp-head">
                <div className="mp-title">Madpas</div>
                <div className="mp-subtitle">Vis dit madpas til din tjener/ekspedient for at forklare dine ønsker.</div>

                {/* Profilvælger — selv + familie */}
                {family.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div className="mp-section-lbl">VIS MADPAS FOR</div>
                    <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
                      {/* Brugeren selv */}
                      <button onClick={() => setMadpasProfileId("self")}
                        style={{ flexShrink:0, display:"flex", alignItems:"center", gap:7, padding:"8px 14px", borderRadius:100,
                          border:`1.5px solid ${madpasProfileId==="self" ? "var(--ink)" : "var(--border)"}`,
                          background: madpasProfileId==="self" ? "var(--ink)" : "#fff",
                          fontFamily:"var(--f)", fontSize:12, fontWeight:700,
                          color: madpasProfileId==="self" ? "#fff" : "var(--ink2)", cursor:"pointer" }}>
                        <div style={{ width:22, height:22, borderRadius:"50%", background: madpasProfileId==="self" ? "rgba(255,255,255,.25)" : "var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#fff" }}>
                          {initials(user.name || "?")}
                        </div>
                        {user.name?.split(" ")[0] || "Mig"}
                      </button>
                      {/* Familiemedlemmer */}
                      {family.map(m => (
                        <button key={m.id} onClick={() => setMadpasProfileId(m.id)}
                          style={{ flexShrink:0, display:"flex", alignItems:"center", gap:7, padding:"8px 14px", borderRadius:100,
                            border:`1.5px solid ${madpasProfileId===m.id ? "var(--ink)" : "var(--border)"}`,
                            background: madpasProfileId===m.id ? "var(--ink)" : "#fff",
                            fontFamily:"var(--f)", fontSize:12, fontWeight:700,
                            color: madpasProfileId===m.id ? "#fff" : "var(--ink2)", cursor:"pointer" }}>
                          <div style={{ width:22, height:22, borderRadius:"50%", background: madpasProfileId===m.id ? "rgba(255,255,255,.25)" : "var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#fff" }}>
                            {initials(m.name || "?")}
                          </div>
                          {m.name?.split(" ")[0] || "Familiemedlem"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sprog-dropdown */}
                <div className="mp-section-lbl">VÆLG SPROG</div>
                {!langOpen ? (
                  <div className="mp-lang-dropdown" onClick={() => setLangOpen(true)}>
                    <span className="mp-lang-flag">{MADPAS_LANGUAGES.find(l=>l.code===madpasLang)?.flag||"🌍"}</span>
                    <span className="mp-lang-name">{MADPAS_LANGUAGES.find(l=>l.code===madpasLang)?.name||"English"}</span>
                    <span className="mp-lang-arrow">▾</span>
                  </div>
                ) : (
                  <div className="mp-lang-list">
                    {MADPAS_LANGUAGES.map(l => (
                      <div key={l.code} className={`mp-lang-opt${madpasLang===l.code?" on":""}`}
                        onClick={() => { setMadpasLang(l.code); localStorage.setItem("as_madpas_lang", l.code); setLangOpen(false); if (madpasSpeaking) { window.speechSynthesis.cancel(); setMadpasSpeaking(false); }}}>
                        <span style={{ fontSize:20 }}>{l.flag}</span>
                        <span style={{ fontSize:14, fontWeight:madpasLang===l.code?800:600, color:madpasLang===l.code?"var(--green)":"var(--ink)" }}>{l.name}</span>
                        {madpasLang===l.code && <span style={{ marginLeft:"auto", color:"var(--green)" }}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tom state */}
              {mpAllergens.length === 0 && mpCustom.length === 0 && (
                <div className="empty-state" style={{ paddingTop:32 }}>
                  <span className="empty-icon">🌾</span>
                  <div className="empty-txt">Ingen allergier registreret</div>
                  <div className="empty-sub">Tilføj dine allergier, intoleranser og diæter under Profil → Mine præferencer</div>
                </div>
              )}

              {/* ALLERGEN LISTE */}
              {(mpAllergens.length > 0 || mpCustom.length > 0) && (() => {
                const lang = madpasLang;
                const rtl = MADPAS_LANGUAGES.find(l => l.code === lang)?.rtl;
                const helloText = { en:"I have food allergies.", de:"Ich habe Lebensmittelallergien.", fr:"J'ai des allergies alimentaires.", es:"Tengo alergias alimentarias.", it:"Ho allergie alimentari.", nl:"Ik heb voedselallergieën.", pt:"Tenho alergias alimentares.", pl:"Mam alergie pokarmowe.", ja:"食物アレルギーがあります。", zh:"我有食物过敏。", ar:"لدي حساسية غذائية.", tr:"Gıda alerjilerim var.", sv:"Jag har matallergier.", no:"Jeg har matallergier.", th:"ฉันมีอาการแพ้อาหาร", el:"Έχω αλλεργίες τροφίμων.", da:"Jeg har fødevareallergier." };
                const cannotLabel = { en:"I cannot eat:", de:"Ich kann nicht essen:", fr:"Je ne peux pas manger :", es:"No puedo comer:", it:"Non posso mangiare:", nl:"Ik kan niet eten:", pt:"Não posso comer:", pl:"Nie mogę jeść:", ja:"食べられません：", zh:"我不能吃：", ar:"لا أستطيع تناول:", tr:"Yiyemiyorum:", sv:"Jag kan inte äta:", no:"Jeg kan ikke spise:", th:"ฉันไม่สามารถกิน:", el:"Δεν μπορώ να φάω:", da:"Jeg kan ikke spise:" };
                const helpText = { en:"Can you help me find something safe?", de:"Können Sie mir helfen?", fr:"Pouvez-vous m'aider ?", es:"¿Puede ayudarme?", it:"Può aiutarmi?", nl:"Kunt u mij helpen?", pt:"Pode ajudar-me?", pl:"Czy może mi pomóc?", ja:"手伝っていただけますか？", zh:"您能帮助我吗？", ar:"هل يمكنك مساعدتي؟", tr:"Yardım edebilir misiniz?", sv:"Kan du hjälpa mig?", no:"Kan du hjelpe meg?", th:"คุณช่วยฉันได้ไหม?", el:"Μπορείτε να με βοηθήσετε;", da:"Kan du hjælpe mig?" };
                return (
                  <div style={{ paddingBottom:8 }} dir={rtl ? "rtl" : "ltr"}>

                    {/* Allergen liste — ren, ingen labels */}
                    <div style={{ display:"flex", flexDirection:"column" }}>
                      {[...mpAllergens, ...mpCustom.filter(c => !c.endsWith("_intolerance") && !mpAllergens.includes(c))].map((item, i, arr) => {
                        const isLast = i === arr.length - 1;
                        if (typeof item !== "string") return null;
                        const a = ALLERGENS.find(x => x.id === item);
                        if (!a) return null;
                        const t = ALLERGEN_T[item]?.[lang] || ALLERGEN_T[item]?.en;
                        const ex = ALLERGEN_EXAMPLES[item];
                        const exProducts = ex?.products?.[lang] || ex?.products?.en || [];
                        const exIngredients = ex?.ingredients?.[lang] || ex?.ingredients?.en || [];
                        return (
                          <div key={i} style={{ padding:"14px 0", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                            <div style={{ fontSize:18, fontWeight:700, color:"var(--ink)", marginBottom: (exProducts.length||exIngredients.length) ? 4 : 0 }}>
                              {t?.n || a.label}
                            </div>
                            {(exProducts.length > 0 || exIngredients.length > 0) && (
                              <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.5 }}>
                                {[...exProducts.slice(0,3), ...exIngredients.slice(0,4)].join(", ")}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {mpCustom.filter(c => !c.endsWith("_intolerance") && !mpAllergens.includes(c)).map((c, i) => (
                        <div key={`custom${i}`} style={{ padding:"14px 0", borderBottom:"1px solid var(--border)" }}>
                          <div style={{ fontSize:18, fontWeight:700, color:"var(--ink)" }}>{c}</div>
                        </div>
                      ))}
                    </div>

                    {/* VIS TIL TJENER */}
                    <button className="mp-big-btn" onClick={() => setMadpasWaiterView(true)}>
                      <span style={{ fontSize:18 }}>⤢</span>
                      Vis til tjener
                    </button>

                    <div style={{ textAlign:"center", fontSize:11, color:"var(--muted)", marginTop:10 }}>
                      🇩🇰 EatSafe · {new Date().toLocaleDateString("da-DK")}
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        )}  {/* ← lukker IIFE og screen === MADPAS */}
        {screen === SCREENS.RECIPES && !selectedRecipe && !showSubmitRecipe && (() => {
          const categories = [
            { id:"alle", label:"🍽️ Alle" }, { id:"favoritter", label:"❤️ Favoritter" },
            { id:"morgenmad", label:"☕ Morgenmad" }, { id:"frokost", label:"🥗 Frokost" },
            { id:"aftensmad", label:"🍝 Aftensmad" }, { id:"dessert", label:"🍰 Dessert" },
            { id:"tilbehør", label:"🥦 Tilbehør" },
          ];
          const getCatEmoji = c => ({ morgenmad:"☕",frokost:"🥗",aftensmad:"🍝",dessert:"🍰",tilbehør:"🥦",snack:"🍿" })[c] || "🍽️";
          const profiles = [
            { id:"me", name: user.name||"Dig", allergens },
            ...family.filter(m => activeProfiles.includes(m.id)),
          ];
          const filtered = (recipeFilter === "favoritter" ? recipes.filter(r => favoriteRecipes.includes(r.id)) : recipes).filter(r => {
            if (recipeSearch && !r.title.toLowerCase().includes(recipeSearch.toLowerCase())) return false;
            if (recipeSafeOnly && compareAllergens(r.allergen_flags || {}, activeIds).status === "danger") return false;
            return true;
          });
          return (
            <div className="screen fade-in">
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 0 14px" }}>
                <div style={{ fontSize:22, fontWeight:900, color:"var(--ink)", letterSpacing:"-.4px" }}>Opskrifter</div>
                <button onClick={() => setShowSubmitRecipe(true)}
                  style={{ background:"var(--green)", color:"#fff", border:"none", borderRadius:10, padding:"8px 14px", fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  + Indsend
                </button>
              </div>

              {/* Søgefelt */}
              <div className="recipe-search-wrap">
                <div className="recipe-search-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                </div>
                <input className="recipe-search-input" placeholder="Søg opskrifter…" value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} />
              </div>

              {/* Kategori chips — 2-kolonne grid så alle ses */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 }}>
                {categories.map(c => (
                  <div key={c.id} className={`recipe-filter-chip${recipeFilter === c.id ? " active" : ""}`}
                    style={{ textAlign:"center" }}
                    onClick={() => {
                      if (c.id === recipeFilter) return;
                      setRecipeFilter(c.id);
                      setRecipeSearch("");
                      if (c.id !== "favoritter") {
                        setRecipes([]); // ryd gamle resultater
                        loadRecipes(c.id);
                      }
                    }}>
                    {c.label}
                  </div>
                ))}
              </div>

              {/* Kun-sikre + tæller */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div onClick={() => setRecipeSafeOnly(v => !v)} style={{
                  display:"flex", alignItems:"center", gap:6, padding:"5px 12px",
                  borderRadius:100, border:`1.5px solid ${recipeSafeOnly ? "var(--green)" : "var(--border2)"}`,
                  background: recipeSafeOnly ? "var(--green-lt)" : "#fff", cursor:"pointer",
                  fontSize:12, fontWeight:700, color: recipeSafeOnly ? "var(--green)" : "var(--muted2)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                  Kun sikre
                </div>
                {recipes.length > 0 && <div style={{ fontSize:12, color:"var(--muted)", marginLeft:"auto" }}>{filtered.length} opskrift{filtered.length !== 1 ? "er" : ""}</div>}
              </div>

              {/* Skeleton loader */}
              {recipesLoading && [1,2,3].map(i => (
                <div key={i} className="recipe-skeleton">
                  <div className="skeleton-img" />
                  <div style={{ padding:"12px 14px" }}>
                    <div className="skeleton-line" style={{ width:"70%" }} />
                    <div className="skeleton-line" style={{ width:"45%" }} />
                  </div>
                </div>
              ))}

              {/* Startside — ingen filter, ingen opskrifter endnu */}
              {!recipesLoading && recipes.length === 0 && recipeFilter === "alle" && (
                <div>
                  <div style={{ background:"var(--ink)", borderRadius:16, padding:"22px 20px", marginBottom:16, display:"flex", alignItems:"center", gap:16 }}>
                    <div style={{ fontSize:44, flexShrink:0 }}>🍳</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:18, fontWeight:900, color:"#fff", letterSpacing:"-.3px", marginBottom:4 }}>Over 600 opskrifter</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,.55)", marginBottom:12 }}>Filtreret til dig og din familie</div>
                      <button onClick={() => loadRecipes("alle")}
                        style={{ background:"var(--green)", color:"#fff", border:"none", borderRadius:10, padding:"9px 18px", fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                        Vis opskrifter →
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>Hop direkte til</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
                    {[
                      { id:"aftensmad", label:"Aftensmad", emoji:"🍝", desc:"Hverdagens klassikere" },
                      { id:"morgenmad", label:"Morgenmad", emoji:"☕", desc:"Start dagen godt" },
                      { id:"dessert",   label:"Dessert",   emoji:"🍰", desc:"Søde sager" },
                      { id:"frokost",   label:"Frokost",   emoji:"🥗", desc:"Let og lækker" },
                    ].map(cat => (
                      <div key={cat.id} onClick={() => { setRecipeFilter(cat.id); setRecipes([]); loadRecipes(cat.id); }}
                        style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"14px", cursor:"pointer", boxShadow:"var(--sh)" }}>
                        <div style={{ fontSize:28, marginBottom:6 }}>{cat.emoji}</div>
                        <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:2 }}>{cat.label}</div>
                        <div style={{ fontSize:11, color:"var(--muted)" }}>{cat.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tom favorit-liste */}
              {!recipesLoading && recipeFilter === "favoritter" && recipes.filter(r => favoriteRecipes.includes(r.id)).length === 0 && (
                <div style={{ textAlign:"center", padding:"48px 0" }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>🤍</div>
                  <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom:6 }}>Ingen favoritter endnu</div>
                  <div style={{ fontSize:13, color:"var(--muted)" }}>Tryk ❤️ på en opskrift for at gemme den</div>
                </div>
              )}

              {/* Label over kortene */}
              {!recipesLoading && filtered.length > 0 && (
                <div style={{ fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>
                  {recipeFilter === "alle" ? "⭐ Mest populære" :
                   recipeFilter === "favoritter" ? "❤️ Dine favoritter" :
                   `🍽️ ${recipeFilter.charAt(0).toUpperCase() + recipeFilter.slice(1)}`}
                  {" "}· {filtered.length} opskrift{filtered.length !== 1 ? "er" : ""}
                </div>
              )}

              {/* Ingen søgeresultater */}
              {!recipesLoading && recipes.length > 0 && filtered.length === 0 && recipeFilter !== "favoritter" && recipeSearch && (
                <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <div style={{ fontSize:13, color:"var(--muted)", marginBottom:10 }}>Ingen opskrifter matcher "{recipeSearch}"</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setRecipeSearch("")}>Ryd søgning</button>
                </div>
              )}

              {/* Opskrift-kort */}
              <div className="recipe-grid">
                {filtered.map(r => {
                  // allergen_flags kan være string eller objekt
                  let rFlags = {};
                  try { rFlags = typeof r.allergen_flags === "string" ? JSON.parse(r.allergen_flags) : (r.allergen_flags || {}); } catch {}
                  const { status } = compareAllergens(rFlags, activeIds);
                  const isFav = favoriteRecipes.includes(r.id);
                  const totalMins = (r.prep_time_minutes||0) + (r.cook_time_minutes||0);
                  return (
                    <div key={r.id} className="recipe-card"
                      onClick={() => { setSelectedRecipe(r); loadRecipeIngredients(r.id); setCompletedSteps({}); setRecipeServings(r.servings || 4); }}>
                      <button className="recipe-fav-btn"
                        onClick={e => { e.stopPropagation(); setFavoriteRecipes(f => isFav ? f.filter(x=>x!==r.id) : [...f,r.id]); }}>
                        {isFav ? "❤️" : "🤍"}
                      </button>
                      {r.image_url
                        ? <img src={r.image_url} alt={r.title} className="recipe-card-img" loading="lazy" />
                        : <div className="recipe-card-img-placeholder">{getCatEmoji(r.category)}</div>
                      }
                      <div className="recipe-card-body">
                        <div className="recipe-card-title">{r.title}</div>
                        {r.description && (
                          <div className="recipe-card-desc" style={{ display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                            {r.description}
                          </div>
                        )}
                        <div className="recipe-card-meta">
                          {r.category && <span className="recipe-pill" style={{ background:"var(--paper2)", color:"var(--muted2)", borderColor:"var(--border)" }}>{getCatEmoji(r.category)} {r.category}</span>}
                          {totalMins > 0 && <span className="recipe-pill" style={{ background:"var(--paper2)", color:"var(--muted2)", borderColor:"var(--border)" }}>⏱ {totalMins} min</span>}
                          {r.servings && <span className="recipe-pill" style={{ background:"var(--paper2)", color:"var(--muted2)", borderColor:"var(--border)" }}>👤 {r.servings} pers.</span>}
                          {(r.tags||[]).filter(t=>t==="vegetarisk"||t==="vegan").map(t => (
                            <span key={t} className="recipe-pill" style={{ background:"var(--green-lt)", color:"var(--green)", borderColor:"var(--green-mid)" }}>
                              {t==="vegan"?"🌱":"🥦"} {t}
                            </span>
                          ))}
                        </div>
                        {/* Sikkerhed per profil */}
                        <div className="recipe-safe-bar">
                          {profiles.map(p => {
                            const { status: ps } = compareAllergens(rFlags, p.allergens||[]);
                            const color = ps==="safe"?"var(--green)":ps==="danger"?"var(--red)":"var(--amber)";
                            const bg = ps==="safe"?"var(--green-lt)":ps==="danger"?"var(--red-lt)":"var(--amber-lt)";
                            return (
                              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:100, border:`1px solid ${color}`, background:bg, fontSize:10, fontWeight:700, color }}>
                                <span>{ps==="safe"?"✓":ps==="danger"?"✗":"!"}</span>
                                <span>{p.id==="me"?"Dig":p.name.split(" ")[0]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtered.length > 0 && (
                <div style={{ display:"flex", gap:8, alignItems:"center", padding:"12px", background:"var(--paper2)", borderRadius:10, marginTop:4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2"><path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <div style={{ fontSize:10, color:"var(--muted)", lineHeight:1.5 }}>Allergener er vejledende. Tjek altid ingrediensernes emballage.</div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ OPSKRIFT DETALJE ══ */}
        {screen === SCREENS.RECIPES && selectedRecipe && !showSubmitRecipe && (() => {
          const isFav = favoriteRecipes.includes(selectedRecipe.id);
          const getCatEmoji = c => ({ morgenmad:"☕",frokost:"🥗",aftensmad:"🍝",dessert:"🍰",tilbehør:"🥦",snack:"🍿" })[c] || "🍽️";

          // Parse trin — håndter JSON-array, string-array og plain tekst
          let steps = [];
          try {
            const raw = selectedRecipe.instructions;
            if (typeof raw === "string") {
              const parsed = JSON.parse(raw);
              steps = Array.isArray(parsed) ? parsed.filter(s => s?.trim()) : [raw];
            } else if (Array.isArray(raw)) {
              steps = raw.filter(s => s?.trim());
            }
          } catch {
            steps = (selectedRecipe.instructions||"").split("\n").filter(s => s.trim());
          }

          // Parse tags
          let recipeTags = [];
          try { recipeTags = Array.isArray(selectedRecipe.tags) ? selectedRecipe.tags : (typeof selectedRecipe.tags === "string" ? JSON.parse(selectedRecipe.tags) : []); } catch {}

          // Ingredienser: brug ingredients_raw fra recipes-tabellen
          let rawIngs = [];
          try {
            const ri = selectedRecipe.ingredients_raw;
            rawIngs = Array.isArray(ri) ? ri : (typeof ri === "string" ? JSON.parse(ri) : []);
          } catch {}

          // Brug ingredients_raw (altid) — recipeIngredients er tom da vi ikke bruger den tabellen
          const displayIngs = rawIngs.length > 0
            ? rawIngs.map(i => ({ name: i.name, amount: i.amount, unit: i.unit, nameEn: i.name_en, measure: i.measure }))
            : recipeIngredients.map(i => ({ name: i.name, amount: i.amount, unit: i.unit, nameEn: i.name_en }));

          // YouTube fra metadata
          let youtubeUrl = null;
          try { const m = typeof selectedRecipe.metadata==="string" ? JSON.parse(selectedRecipe.metadata) : selectedRecipe.metadata; youtubeUrl = m?.youtube||null; } catch {}

          // Servings — bruger component-level state
          const servings = recipeServings;
          const setServings = setRecipeServings;
          const ratio = servings / (selectedRecipe.servings || 4);

          const scaleAmt = (amt) => {
            if (!amt || isNaN(amt)) return null;
            const s = amt * ratio;
            return s === Math.floor(s) ? s : Math.round(s * 10) / 10;
          };
          const fmtUnit = u => {
            if (!u || u==="null") return "";
            const m = { spsk:"spsk",tsk:"tsk",dl:"dl",g:"g",kg:"kg",l:"l",ml:"ml",stk:"stk" };
            return m[u.trim().toLowerCase()] || u;
          };

          // Allergen-detektion på ingrediensnavn
          const allergenKeywords = { gluten:["wheat","flour","bread","rye","barley","oat","spelt","hvede","hvedemel","rug","byg","havre"], laktose:["milk","cream","butter","cheese","yogurt","mælk","fløde","smør","ost"], aeg:["egg","æg"], noedder:["almond","walnut","cashew","hazel","pistachio","pecan","nut","mandel","valnød","nødder"], jordnoedder:["peanut","jordnød"], soja:["soy","tofu","soja"], fisk:["fish","salmon","tuna","cod","anchov","sardine","laks","torsk","tun"], skaldyr:["shrimp","prawn","crab","lobster","mussel","clam","rejer","krabbe","musling"], selleri:["celery","selleri"], sennep:["mustard","sennep"], sesam:["sesame","tahini","sesam"] };
          const isAllergenIng = (ing) => allergens.some(a => (allergenKeywords[a]||[]).some(kw => (ing.nameEn||ing.name||"").toLowerCase().includes(kw)));

          // Parse allergen_flags (kan være string eller objekt)
          let recipeFlags = {};
          try { recipeFlags = typeof selectedRecipe.allergen_flags === "string" ? JSON.parse(selectedRecipe.allergen_flags) : (selectedRecipe.allergen_flags || {}); } catch {}

          const profiles = [{ id:"me", name:user.name||"Dig", allergens }, ...family.filter(m => activeProfiles.includes(m.id))];
          const doneTrin = steps.filter((_,i) => completedSteps[`${selectedRecipe.id}_${i}`]).length;
          const pct = steps.length ? Math.round((doneTrin/steps.length)*100) : 0;

          return (
            <div className="screen fade-in" style={{ paddingTop:0 }}>
              {/* Hero */}
              <div className="recipe-detail-hero">
                {selectedRecipe.image_url
                  ? <img src={selectedRecipe.image_url} alt={selectedRecipe.title} className="recipe-detail-img" />
                  : <div className="recipe-detail-img-placeholder">{getCatEmoji(selectedRecipe.category)}</div>
                }
                <button className="recipe-detail-back" onClick={() => setSelectedRecipe(null)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button className="recipe-detail-fav"
                  onClick={() => setFavoriteRecipes(f => isFav ? f.filter(x=>x!==selectedRecipe.id) : [...f,selectedRecipe.id])}>
                  {isFav ? "❤️" : "🤍"}
                </button>
              </div>

              <div style={{ padding:"0 16px" }}>
                {/* Titel */}
                <div style={{ paddingTop:16, marginBottom:6 }}>
                  <div className="recipe-detail-title">{selectedRecipe.title}</div>
                </div>

                {/* Meta */}
                <div className="recipe-meta-row">
                  {selectedRecipe.category && <div className="recipe-meta-pill">{getCatEmoji(selectedRecipe.category)} {selectedRecipe.category}</div>}
                  {((selectedRecipe.prep_time_minutes||0)+(selectedRecipe.cook_time_minutes||0)) > 0 && (
                    <div className="recipe-meta-pill">⏱ {(selectedRecipe.prep_time_minutes||0)+(selectedRecipe.cook_time_minutes||0)} min</div>
                  )}
                  {recipeTags.filter(t=>t==="vegetarisk"||t==="vegan").map(t => (
                    <div key={t} className="recipe-meta-pill" style={{ color:"var(--green)", borderColor:"var(--green-mid)", background:"var(--green-lt)" }}>
                      {t==="vegan"?"🌱":"🥦"} {t}
                    </div>
                  ))}
                </div>

                {/* Beskrivelse */}
                {selectedRecipe.description && <div style={{ fontSize:14, color:"var(--muted2)", lineHeight:1.65, marginBottom:14 }}>{selectedRecipe.description}</div>}

                {/* Sikkerhed per profil */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
                  {profiles.map(p => {
                    const { status:ps, matchedDanger } = compareAllergens(recipeFlags, p.allergens||[]);
                    const color = ps==="safe"?"var(--green)":ps==="danger"?"var(--red)":"var(--amber)";
                    const bg = ps==="safe"?"var(--green-lt)":ps==="danger"?"var(--red-lt)":"var(--amber-lt)";
                    const border = ps==="safe"?"var(--green-mid)":ps==="danger"?"var(--red-md)":"var(--amber-md)";
                    const label = ps==="safe"?"Sikker":ps==="danger"?matchedDanger.map(id=>ALLERGENS.find(a=>a.id===id)?.label).join(", "):"Mulige spor";
                    return (
                      <div key={p.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:bg, border:`1px solid ${border}`, borderRadius:100, fontSize:12, fontWeight:700, color }}>
                        <span>{ps==="safe"?"✓":ps==="danger"?"✗":"!"}</span>
                        <span>{p.id==="me"?"Dig":p.name.split(" ")[0]}</span>
                        <span style={{ fontWeight:400, opacity:.8 }}>· {label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* ── INGREDIENSER ── */}
                <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, marginBottom:12, overflow:"hidden", boxShadow:"var(--sh)" }}>
                  <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)" }}>Ingredienser</div>
                    <div className="servings-ctrl">
                      <button className="servings-btn" onClick={() => setServings(s => Math.max(1,s-1))}>−</button>
                      <div className="servings-num">{servings}</div>
                      <button className="servings-btn" onClick={() => setServings(s => s+1)}>+</button>
                      <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600 }}>pers.</div>
                    </div>
                  </div>
                  <div style={{ padding:"8px 16px" }}>
                    {displayIngs.length === 0 && <div style={{ fontSize:13, color:"var(--muted)", padding:"12px 0" }}>Ingen ingredienser fundet</div>}
                    {displayIngs.map((ing, i) => {
                      const isAllerg = isAllergenIng(ing);
                      const scaledAmt = scaleAmt(ing.amount);
                      return (
                        <div key={i} className="ingredient-row">
                          <div className="ingredient-dot" style={{ background: isAllerg ? "var(--red)" : "var(--border2)" }} />
                          <div style={{ flex:1, fontSize:13, color: isAllerg?"var(--red)":"var(--ink)", fontWeight: isAllerg?700:400, lineHeight:1.4 }}>{ing.name}</div>
                          <div style={{ fontSize:12, fontWeight:700, color:"var(--muted2)", flexShrink:0 }}>
                            {scaledAmt}{scaledAmt && ing.unit ? " " : ""}{fmtUnit(ing.unit)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)" }}>
                    <button onClick={() => {
                      displayIngs.forEach(ing => {
                        const a = scaleAmt(ing.amount);
                        const txt = [a, fmtUnit(ing.unit), ing.name].filter(Boolean).join(" ").trim();
                        if (txt) addToList(txt);
                      });
                      setScreen(SCREENS.LIST);
                    }} style={{ width:"100%", background:"var(--ink)", color:"#fff", border:"none", borderRadius:10, padding:"10px 16px", fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path strokeLinecap="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                      Tilføj til indkøbsliste ({servings} pers.)
                    </button>
                  </div>
                </div>

                {/* ── FREMGANGSMÅDE ── */}
                {steps.length > 0 && (
                  <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, marginBottom:12, overflow:"hidden", boxShadow:"var(--sh)" }}>
                    <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)" }}>
                      <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)" }}>Fremgangsmåde</div>
                      <div style={{ fontSize:11, color:"var(--muted)", marginTop:3 }}>Tryk på hvert trin for at afkrydse det</div>
                    </div>
                    <div style={{ padding:"0 16px" }}>
                      {steps.map((step, i) => {
                        const key = `${selectedRecipe.id}_${i}`;
                        const done = !!completedSteps[key];
                        return (
                          <div key={i} className="step-row" style={{ opacity: done ? 0.45 : 1 }}
                            onClick={() => setCompletedSteps(s => ({ ...s, [key]: !s[key] }))}>
                            <div className="step-circle" style={{ background: done?"var(--green)":"var(--paper2)", border:`2px solid ${done?"var(--green)":"var(--border2)"}` }}>
                              {done
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                                : <span style={{ fontSize:12, fontWeight:800, color:"var(--muted)" }}>{i+1}</span>
                              }
                            </div>
                            <div style={{ flex:1, fontSize:13, color:"var(--ink2)", lineHeight:1.7, textDecoration: done?"line-through":"none" }}>{step}</div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Fremskridtsbar */}
                    <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)" }}>Fremgang</div>
                        <div style={{ fontSize:11, fontWeight:800, color: doneTrin===steps.length?"var(--green)":"var(--ink)" }}>
                          {doneTrin}/{steps.length} trin {doneTrin===steps.length&&"🎉"}
                        </div>
                      </div>
                      <div style={{ height:6, background:"var(--paper2)", borderRadius:6, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:(pct)+"%", background: doneTrin===steps.length?"var(--green)":"var(--ink)", borderRadius:6, transition:"width .4s" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* YouTube */}
                {youtubeUrl && (
                  <button className="youtube-btn" onClick={() => window.open(youtubeUrl, "_blank")}>
                    <svg width="20" height="14" viewBox="0 0 20 14" fill="#fff"><path d="M19.582 2.186A2.506 2.506 0 0017.822.425C16.254 0 10 0 10 0S3.747 0 2.178.425A2.506 2.506 0 00.418 2.186C0 3.756 0 7 0 7s0 3.244.418 4.814A2.506 2.506 0 002.178 13.575C3.747 14 10 14 10 14s6.254 0 7.822-.425a2.506 2.506 0 001.76-1.761C20 10.244 20 7 20 7s0-3.244-.418-4.814z"/><path d="M8 10l5.25-3L8 4v6z" fill="red"/></svg>
                    Se video på YouTube
                  </button>
                )}

                {/* Disclaimer */}
                <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 14px", background:"var(--paper2)", borderRadius:10, marginBottom:16 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}><path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <div style={{ fontSize:10, color:"var(--muted)", lineHeight:1.5 }}>
                    {selectedRecipe.disclaimer || "Allergener er vejledende. Tjek altid ingrediensernes emballage ved alvorlige allergier."}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══ INDSEND OPSKRIFT ══ */}
        {screen === SCREENS.RECIPES && showSubmitRecipe && (
          <div className="screen fade-in">
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 0 20px" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSubmitRecipe(false)}>← Tilbage</button>
              <div style={{ fontSize:18, fontWeight:800, color:"var(--ink)" }}>Indsend opskrift</div>
            </div>

            <div className="card" style={{ marginBottom:10 }}>
              <div className="card-lbl">Grundoplysninger</div>
              <label className="field-lbl">Titel</label>
              <input className="field" placeholder="Fx. Pasta med kødsovs" value={submitRecipe.title}
                onChange={e => setSubmitRecipe(r => ({...r, title:e.target.value}))} style={{ marginBottom:10 }} />
              <label className="field-lbl">Kort beskrivelse</label>
              <input className="field" placeholder="Fx. En klassisk hjemmeret..." value={submitRecipe.description}
                onChange={e => setSubmitRecipe(r => ({...r, description:e.target.value}))} style={{ marginBottom:10 }} />
              <label className="field-lbl">Kategori</label>
              <select className="field" value={submitRecipe.category}
                onChange={e => setSubmitRecipe(r => ({...r, category:e.target.value}))} style={{ marginBottom:0 }}>
                {["morgenmad","frokost","aftensmad","dessert","tilbehør","snack"].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="card" style={{ marginBottom:10 }}>
              <div className="card-lbl">Ingredienser</div>
              {submitIngredients.map((ing, i) => (
                <div key={i} style={{ display:"flex", gap:6, marginBottom:8, alignItems:"center" }}>
                  <input className="field" placeholder="Ingrediens" value={ing.name}
                    onChange={e => setSubmitIngredients(list => list.map((x,j) => j===i?{...x,name:e.target.value}:x))}
                    style={{ flex:2, marginBottom:0 }} />
                  <input className="field" placeholder="Mængde" value={ing.amount}
                    onChange={e => setSubmitIngredients(list => list.map((x,j) => j===i?{...x,amount:e.target.value}:x))}
                    style={{ flex:1, marginBottom:0 }} />
                  <input className="field" placeholder="Enhed" value={ing.unit}
                    onChange={e => setSubmitIngredients(list => list.map((x,j) => j===i?{...x,unit:e.target.value}:x))}
                    style={{ flex:1, marginBottom:0 }} />
                  {submitIngredients.length > 1 && (
                    <div onClick={() => setSubmitIngredients(l => l.filter((_,j)=>j!==i))} style={{ cursor:"pointer", flexShrink:0 }}>
                      <Icon name="x" size={16} color="var(--muted)" />
                    </div>
                  )}
                </div>
              ))}
              <button className="btn btn-outline btn-sm btn-full" onClick={() => setSubmitIngredients(l => [...l, {name:"",amount:"",unit:""}])}>
                + Tilføj ingrediens
              </button>
            </div>

            <div className="card" style={{ marginBottom:10 }}>
              <div className="card-lbl">Fremgangsmåde — trin for trin</div>
              {submitSteps.map((step, i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", background:"var(--green)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, flexShrink:0, marginTop:10 }}>{i+1}</div>
                  <textarea
                    className="field"
                    placeholder={`Trin ${i+1}…`}
                    value={step}
                    rows={2}
                    onChange={e => setSubmitSteps(s => s.map((x,j) => j===i ? e.target.value : x))}
                    style={{ flex:1, resize:"none", fontFamily:"var(--f)", marginBottom:0 }}
                  />
                  {submitSteps.length > 1 && (
                    <div onClick={() => setSubmitSteps(s => s.filter((_,j) => j!==i))}
                      style={{ cursor:"pointer", paddingTop:10, flexShrink:0 }}>
                      <Icon name="x" size={16} color="var(--muted)" />
                    </div>
                  )}
                </div>
              ))}
              <button className="btn btn-outline btn-sm btn-full"
                onClick={() => setSubmitSteps(s => [...s, ""])}
                style={{ marginTop:4 }}>
                + Tilføj trin
              </button>
            </div>

            {/* Vilkår accordion */}
            <div style={{ border:"1px solid var(--border)", borderRadius:12, marginBottom:12, overflow:"hidden" }}>
              <div
                onClick={() => setRecipeTermsOpen(v => !v)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", cursor:"pointer", background: recipeTermsOpen ? "var(--paper2)" : "#fff" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>Vilkår for indsendelse</div>
                <Icon name={recipeTermsOpen ? "chevronUp" : "chevronDown"} size={18} color="var(--muted)" />
              </div>
              {recipeTermsOpen && (
                <div style={{ padding:"0 14px 14px", background:"var(--paper2)", borderTop:"1px solid var(--border)" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", margin:"12px 0 6px" }}>Ved at indsende bekræfter du at:</div>
                  {[
                    "Opskriften er din egen og ikke kopieret fra en anden kilde",
                    "Du giver EatSafe tilladelse til at offentliggøre og dele opskriften gratis",
                    "Du er indforstået med at opskriften kan redigeres af EatSafes redaktion",
                  ].map((t, i) => (
                    <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
                      <Icon name="check" size={14} color="var(--green)" />
                      <div style={{ fontSize:12, color:"var(--ink2)", lineHeight:1.5 }}>{t}</div>
                    </div>
                  ))}
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", margin:"12px 0 6px" }}>Om allergener</div>
                  <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5, marginBottom:10 }}>
                    Allergener identificeres automatisk og er vejledende. EatSafe påtager sig intet ansvar for fejl i allergeninformationen. Brugere opfordres altid til at tjekke ingrediensernes emballage.
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", margin:"0 0 6px" }}>Indhold vi afviser</div>
                  <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5 }}>
                    Vi godkender ikke opskrifter der er kopieret fra andre, indeholder skadeligt indhold eller ikke er relateret til mad.
                  </div>
                </div>
              )}
            </div>

            {/* Accept checkbox */}
            <div
              onClick={() => setRecipeTermsAccepted(v => !v)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#fff", border:`1.5px solid ${recipeTermsAccepted ? "var(--green)" : "var(--border2)"}`, borderRadius:10, cursor:"pointer", marginBottom:12 }}>
              <div style={{ width:20, height:20, borderRadius:6, background: recipeTermsAccepted ? "var(--green)" : "var(--paper2)", border:`1.5px solid ${recipeTermsAccepted ? "var(--green)" : "var(--border2)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {recipeTermsAccepted && <Icon name="check" size={12} color="#fff" />}
              </div>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--ink)" }}>Jeg accepterer vilkårene for indsendelse</div>
            </div>

            <button className="btn btn-primary btn-full"
              onClick={submitUserRecipe}
              disabled={submittingRecipe || !submitRecipe.title.trim() || !recipeTermsAccepted}>
              {submittingRecipe ? "Sender…" : "Indsend opskrift"}
            </button>
          </div>
        )}

        {/* ══ REDIGER PROFIL ══ */}
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

        {/* ══ FORESLÅ ÆNDRING ══ */}
        {screen === SCREENS.SUGGEST_EDIT && scanResult && (() => {

          const runOcr = async (file) => {
            setEditStep("scanning");
            try {
              const b64 = await new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = () => res(r.result.split(",")[1]);
                r.onerror = rej;
                r.readAsDataURL(file);
              });
              // Brug Supabase OCR edge function
              const resp = await fetch(`${SUPABASE_URL}/functions/v1/ocr`, {
                method: "POST",
                headers: makeHeaders(accessToken),
                body: JSON.stringify({ image_base64: b64 }),
              });
              const data = await resp.json();
              if (data.success && data.text) {
                setEditIngText(data.text);
                setEditStep("review");
              } else {
                // OCR fejlede — lad brugeren skrive manuelt
                setEditStep("review");
              }
            } catch {
              setEditStep("review");
            }
          };

          const submit = async () => {
            setEditStep("sending");
            try {
              await apiCall(`${SUPABASE_URL}/rest/v1/product_submissions`, {
                method: "POST",
                headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
                body: JSON.stringify({
                  product_id: scanResult.id || null,
                  ean: scanResult.code || scanResult.ean,
                  product_name: scanResult.name,
                  brand: scanResult.brand,
                  ingredients: editType === "ingredients" ? editIngText : null,
                  notes: `Type: ${editType}. ${editNote}`.trim(),
                  submitted_by: userId,
                  status: "pending",
                  type: "edit",
                }),
              });
              setEditStep("done");
            } catch (e) {
              alert("Fejl: " + e.message);
              setEditStep("review");
            }
          };

          return (
            <div className="screen fade-in">

              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 0 14px" }}>
                <button onClick={() => setScreen(SCREENS.RESULT)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2">
                    <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Hjælp os med at forbedre</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{scanResult.name}</div>
                </div>
              </div>

              {/* Produkt-chip — vises på alle trin */}
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#fff", border:"1px solid var(--border)", borderRadius:12, marginBottom:16, boxShadow:"var(--sh)" }}>
                <ProductImage product={scanResult} size={40} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{scanResult.name}</div>
                  {scanResult.brand && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{scanResult.brand}</div>}
                  <div style={{ fontSize:10, color:"var(--muted)", marginTop:1, fontFamily:"monospace" }}>EAN: {scanResult.code}</div>
                </div>
              </div>

              {/* ── TRIN 1: Vælg hvad der mangler ── */}
              {editStep === "start" && (
                <div className="fade-in">
                  <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.6, marginBottom:16 }}>
                    Hvad mangler eller er forkert på dette produkt?
                  </div>
                  {[
                    { id:"ingredients", emoji:"🥦", title:"Ingrediensliste mangler", desc:"Fotografér bagsiden af pakken med ingredienserne" },
                    { id:"nutrition",   emoji:"📊", title:"Næringsindhold mangler",  desc:"Fotografér næringstabellen på pakken" },
                    { id:"image",       emoji:"📸", title:"Produktbilledet er forkert", desc:"Tag et nyt billede af produktets forside" },
                    { id:"other",       emoji:"✏️", title:"Andet er forkert",         desc:"Skriv hvad der skal rettes" },
                  ].map(opt => (
                    <div key={opt.id} onClick={() => { setEditType(opt.id); setEditStep(opt.id === "other" ? "review" : "guide"); }}
                      style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
                        background:"#fff", border:"1px solid var(--border)", borderRadius:14,
                        marginBottom:8, cursor:"pointer", boxShadow:"var(--sh)" }}>
                      <div style={{ fontSize:28, flexShrink:0 }}>{opt.emoji}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>{opt.title}</div>
                        <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{opt.desc}</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                        <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TRIN 2: Guide til foto ── */}
              {editStep === "guide" && (
                <div className="fade-in">
                  {/* Visuel guide */}
                  <div style={{ background:"var(--ink)", borderRadius:16, padding:"20px", marginBottom:16, textAlign:"center" }}>
                    <div style={{ fontSize:48, marginBottom:10 }}>
                      {editType === "ingredients" ? "🥫" : editType === "nutrition" ? "📋" : "📦"}
                    </div>
                    <div style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:8 }}>
                      {editType === "ingredients" ? "Fotografér ingredienslisten" :
                       editType === "nutrition" ? "Fotografér næringstabellen" :
                       "Fotografér produktets forside"}
                    </div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", lineHeight:1.7 }}>
                      {editType === "ingredients"
                        ? "Vend pakken om og find listen der starter med 'Ingredienser:'. Hold telefonen stille og sørg for god belysning."
                        : editType === "nutrition"
                        ? "Find tabellen med energi, fedt, protein osv. Hold telefonen parallelt med pakken for skarpest billede."
                        : "Hold produktet mod en lys baggrund. Sørg for at stregkoden og produktnavnet er synlige."}
                    </div>
                  </div>

                  {/* Tips */}
                  <div style={{ background:"var(--paper2)", borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>💡 Tips til et godt billede</div>
                    {["Hold telefonen vandret og i armslængde", "Sørg for god belysning — undgå skygger", "Hold billedet skarpt — vent til kameraet fokuserer"].map((tip, i) => (
                      <div key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom: i < 2 ? 6 : 0 }}>
                        <div style={{ width:18, height:18, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <div style={{ fontSize:12, color:"var(--muted2)" }}>{tip}</div>
                      </div>
                    ))}
                  </div>

                  {/* Foto-knap — stor og tydelig */}
                  <label style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                    width:"100%", padding:"16px", borderRadius:14, cursor:"pointer",
                    background:"var(--green)", border:"none", color:"#fff",
                    fontSize:16, fontWeight:800, boxShadow:"0 4px 16px rgba(34,197,94,.3)",
                    marginBottom:10,
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    Tag billede med kamera
                    <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                  </label>

                  <label style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    width:"100%", padding:"13px", borderRadius:12, cursor:"pointer",
                    background:"#fff", border:"1.5px solid var(--border2)", color:"var(--ink2)",
                    fontSize:14, fontWeight:600, marginBottom:10,
                  }}>
                    📁 Vælg billede fra galleri
                    <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                  </label>

                  <button className="btn btn-ghost btn-full btn-sm" onClick={() => { setEditStep("review"); }}>
                    Skriv manuelt i stedet
                  </button>
                </div>
              )}

              {/* ── TRIN 3: Scanner ── */}
              {editStep === "scanning" && (
                <div className="fade-in" style={{ textAlign:"center", padding:"60px 20px" }}>
                  <div style={{ width:64, height:64, border:"4px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" }} />
                  <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>Analyserer billede…</div>
                  <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>
                    Vores AI læser teksten fra dit billede.<br/>Det tager et par sekunder.
                  </div>
                </div>
              )}

              {/* ── TRIN 4: Gennemse og send ── */}
              {editStep === "review" && (
                <div className="fade-in">

                  {/* Ingrediensliste / tekst */}
                  {(editType === "ingredients" || editType === "nutrition") && (
                    <div className="card" style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>
                          {editType === "ingredients" ? "Ingrediensliste" : "Næringsindhold"}
                        </div>
                        {editIngText && (
                          <div style={{ fontSize:11, color:"var(--green)", fontWeight:700 }}>✓ Tekst fundet</div>
                        )}
                      </div>
                      {editIngText ? (
                        <div style={{ background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
                          <div style={{ fontSize:11, color:"var(--green)", fontWeight:700, marginBottom:6 }}>📖 Tekst fra billedet — ret hvis nødvendigt:</div>
                          <textarea
                            value={editIngText}
                            onChange={e => setEditIngText(e.target.value)}
                            rows={6}
                            style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontFamily:"var(--f)", fontSize:12, color:"var(--ink2)", resize:"vertical", lineHeight:1.6, boxSizing:"border-box" }}
                          />
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>
                            Billedet kunne ikke læses automatisk. Skriv teksten manuelt:
                          </div>
                          <textarea
                            value={editIngText}
                            onChange={e => setEditIngText(e.target.value)}
                            rows={5}
                            placeholder={editType === "ingredients" ? "Fx. Vand, hvede, salt, gær..." : "Fx. Energi: 250 kcal, Fedt: 5g..."}
                            className="field"
                            style={{ resize:"vertical", fontFamily:"var(--f)", fontSize:13, lineHeight:1.6 }}
                          />
                        </div>
                      )}
                      {/* Tag nyt billede */}
                      <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--muted)", cursor:"pointer", marginTop:4 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        Tag nyt billede
                        <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                      </label>
                    </div>
                  )}

                  {/* Produktbillede */}
                  {editType === "image" && (
                    <div className="card" style={{ marginBottom:12 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>Nyt produktbillede</div>
                      {editProductImage && (
                        <img src={editProductImage} alt="Produkt"
                          style={{ width:"100%", maxHeight:180, objectFit:"contain", borderRadius:10, marginBottom:10 }} />
                      )}
                      <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", background:"var(--paper2)", border:"1.5px dashed var(--border2)", borderRadius:10, cursor:"pointer", fontSize:13, color:"var(--muted2)" }}>
                        {editProductImage ? "📸 Tag nyt billede" : "📸 Tag billede af produktet"}
                        <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleEditProductCapture} />
                      </label>
                    </div>
                  )}

                  {/* Bemærkning */}
                  <div className="card" style={{ marginBottom:12 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>Bemærkning (valgfrit)</div>
                    <textarea
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      rows={2}
                      placeholder="Fx. Ny udgave af produktet, fejl i allergen-info..."
                      className="field"
                      style={{ resize:"none", fontFamily:"var(--f)", fontSize:13 }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 12px", background:"var(--paper2)", borderRadius:10, marginBottom:14 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
                      <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 16v-4M12 8h.01"/>
                    </svg>
                    <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5 }}>
                      Dit forslag gennemgås af vores team inden det publiceres. Tak for din hjælp!
                    </div>
                  </div>

                  <button
                    onClick={submit}
                    disabled={editType === "ingredients" && !editIngText.trim()}
                    style={{ width:"100%", background:"var(--ink)", color:"#fff", border:"none",
                      borderRadius:12, padding:"15px", fontFamily:"var(--f)", fontSize:15,
                      fontWeight:800, cursor:"pointer", marginBottom:8,
                      opacity: (editType === "ingredients" && !editIngText.trim()) ? 0.4 : 1 }}>
                    Send forslag ✓
                  </button>
                  <button className="btn btn-ghost btn-full" onClick={() => setScreen(SCREENS.RESULT)}>Annuller</button>
                </div>
              )}

              {/* ── TRIN 5: Sender ── */}
              {editStep === "sending" && (
                <div className="fade-in" style={{ textAlign:"center", padding:"60px 20px" }}>
                  <div style={{ width:64, height:64, border:"4px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" }} />
                  <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Sender…</div>
                </div>
              )}

              {/* ── TRIN 6: Tak! ── */}
              {editStep === "done" && (
                <div className="fade-in" style={{ textAlign:"center", padding:"48px 20px" }}>
                  <div style={{ width:72, height:72, borderRadius:"50%", background:"var(--green-lt)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5">
                      <path strokeLinecap="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <div style={{ fontSize:22, fontWeight:900, color:"var(--ink)", marginBottom:8 }}>Tak for din hjælp! 🙏</div>
                  <div style={{ fontSize:14, color:"var(--muted2)", lineHeight:1.7, marginBottom:28 }}>
                    Dit forslag er modtaget og vil blive gennemgået af vores team snarest.
                    Du hjælper andre med allergi med at spise trygt.
                  </div>
                  <button className="btn btn-primary btn-full" onClick={() => setScreen(SCREENS.RESULT)}>
                    Tilbage til produktet
                  </button>
                </div>
              )}

            </div>
          );
        })()}

        {/* ALLERGEN SUBTYPE MODAL */}
        {activeSubtypeModal && (
          <SubtypeModal
            allergenId={activeSubtypeModal}
            selectedSubtypes={allergenSubtypes[activeSubtypeModal] || []}
            onToggle={(id) => setAllergenSubtypes(s => {
              const cur = s[activeSubtypeModal] || [];
              return { ...s, [activeSubtypeModal]: cur.includes(id) ? cur.filter(x=>x!==id) : [...cur, id] };
            })}
            onClose={() => setActiveSubtypeModal(null)}
          />
        )}

        {/* BUNDNAVIGATION */}
        {!isOnboard && !madpasWaiterView && (
          <nav className="bottom-nav" role="navigation" aria-label="Hovednavigation">
            {[
              [SCREENS.RECIPES, "recipes",  "Opskrifter"],
              [SCREENS.LIST,    "cart",     "Indkøbsliste"],
              [SCREENS.HOME,    "home",     "Hjem"],
              [SCREENS.MADPAS,  "globe",    "Madpas"],
              [SCREENS.PROFILE, "profile",  "Profil"],
            ].map(([s,icon,lbl]) => (
              <div key={s} className={`nav-item${(
                screen===s ||
                (screen===SCREENS.RESULT && s===SCREENS.HOME) ||
                (screen===SCREENS.NOTFOUND && s===SCREENS.HOME) ||
                (screen===SCREENS.SUBMITTED && s===SCREENS.HOME) ||
                (screen===SCREENS.SEARCH && s===SCREENS.HOME) ||
                (screen===SCREENS.HISTORY && s===SCREENS.PROFILE) ||
                (screen===SCREENS.FAVORITES && s===SCREENS.PROFILE) ||
                (screen===SCREENS.FAMILY && s===SCREENS.PROFILE) ||
                (screen===SCREENS.ADMIN && s===SCREENS.PROFILE)
              )?" active":""}`}
                onClick={() => setScreen(s)}
                role="button"
                aria-label={lbl}
                aria-current={screen===s ? "page" : undefined}
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setScreen(s)}>
                <div className="nav-icon"><Icon name={icon} size={22} /></div>
                <div className="nav-lbl">{lbl}</div>
              </div>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}

