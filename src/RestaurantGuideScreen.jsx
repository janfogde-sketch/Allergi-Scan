// @ts-nocheck
import React, { useState } from "react";
import { SCREENS, ALLERGENS } from "./constants.jsx";
import { getAllergenLabels } from "./helpers.js";

const TIPS = [
  {
    id: "forbered",
    icon: "📋",
    title: "Forbered dig inden du går",
    color: "#818cf8",
    bg: "rgba(129,140,248,.10)",
    border: "rgba(129,140,248,.22)",
    tips: [
      "Tjek restaurantens hjemmeside eller ring på forhånd — mange har allergeninfo online.",
      "Book bord og nævn dine allergier i reservationen. Så er køkkenet forberedt.",
      "Undgå spidsbelastning (fredag-lørdag aften) — stressede køkkener laver flere fejl.",
      "Vælg restauranter med simpelt menukort. Jo færre ingredienser, jo lavere risiko for krydsforurening.",
    ],
  },
  {
    id: "ankom",
    icon: "🚪",
    title: "Når du ankommer",
    color: "#4ADE80",
    bg: "rgba(74,222,128,.08)",
    border: "rgba(74,222,128,.2)",
    tips: [
      "Fortæl tjeneren om dine allergier med det samme — ikke når maden er bestilt.",
      "Brug dit EatSafe madpas: tryk 'Vis til tjener' og lad dem læse det direkte.",
      "Spørg om krydsforurening: deles der skærebrætter, friture eller kogevand med dine allergener?",
      "Hvis tjeneren virker usikker, bed om at tale med køkkenchefen direkte.",
    ],
  },
  {
    id: "bestil",
    icon: "🍽️",
    title: "Bestillingsøjeblikket",
    color: "#f97316",
    bg: "rgba(249,115,22,.08)",
    border: "rgba(249,115,22,.2)",
    tips: [
      "Vær konkret: sig 'Jeg er allergisk over for mælkeprotein' frem for 'Jeg tåler ikke mælk'.",
      "Spørg specifikt: 'Indeholder saucen mel eller opbagt med smør?'",
      "Undgå retter med mange skjulte ingredienser: saucer, marinader, færdigblandinger.",
      "Bed om at retten tilberedes separat med rene redskaber og handsker.",
      "Sæt allergien i kontekst: fortæl hvad der sker hvis du spiser det (opkast, anafylaksi osv.).",
    ],
  },
  {
    id: "udlandet",
    icon: "✈️",
    title: "Rejser og udlandet",
    color: "#fbbf24",
    bg: "rgba(251,191,36,.08)",
    border: "rgba(251,191,36,.2)",
    tips: [
      "Brug madpassets sprogfunktion — 17 sprog virker offline og i udlandet.",
      "I lande med stærk madkultur (Frankrig, Japan, Italien) kan det være sværere at ændre opskrifter — vær ekstra tydelig.",
      "Medbring altid din medicin (antihistamin, EpiPen) i håndbagagen — aldrig i kufferten.",
      "Skriv dine allergier ned på et kort på det lokale sprog og hav det i pungen.",
      "Find allergivenlige restauranter via apps som AllergyEats eller Find Me Gluten Free inden afrejse.",
    ],
  },
  {
    id: "kantina",
    icon: "🏢",
    title: "Kantiner og buffeter",
    color: "#34d399",
    bg: "rgba(52,211,153,.08)",
    border: "rgba(52,211,153,.2)",
    tips: [
      "Buffeter har høj risiko for krydsforurening — skeer og tænger bruges på tværs af retter.",
      "Spørg kantinepersonalet om ingredienslister — de er forpligtet til at oplyse 14 EU-allergener.",
      "Mærk dine allergier hos arbejdspladsens kantineansvarlige — de kan ofte tilpasse.",
      "Kom tidligt på buffeter, inden der er rodet i retterne.",
    ],
  },
  {
    id: "rettigheder",
    icon: "⚖️",
    title: "Dine rettigheder",
    color: "#a78bfa",
    bg: "rgba(167,139,250,.08)",
    border: "rgba(167,139,250,.2)",
    tips: [
      "EU-forordning 1169/2011: restauranter er lovpligtige til at oplyse om 14 allergener i alle retter.",
      "Du har ret til skriftlig allergeninformation — bed om den, hvis du er usikker.",
      "Restauranten kan ikke nægte dig dette — det er et lovkrav, ikke en service.",
      "Hvis en restaurant ikke kan garantere allergenfrihed, har du ret til at vide det — og vælge noget andet.",
    ],
  },
];

const QUICK_PHRASES = [
  { da: "Jeg er allergisk over for", en: "I am allergic to" },
  { da: "Indeholder denne ret…?", en: "Does this dish contain…?" },
  { da: "Kan det tilberedes uden…?", en: "Can it be made without…?" },
  { da: "Deles skærebrættet med…?", en: "Is the cutting board shared with…?" },
  { da: "Jeg har brug for at tale med køkkenchefen", en: "I need to speak with the chef" },
  { da: "Det er en alvorlig allergi", en: "This is a serious allergy" },
];

export default function RestaurantGuideScreen({ screen, setScreen, allergens, customAllerg }) {
  const [openSection, setOpenSection] = useState(null);

  if (screen !== SCREENS.RESTAURANTGUIDE) return null;

  const allergenNames = [
    ...allergens.map(id => ALLERGENS.find(x => x.id === id)?.label).filter(Boolean),
    ...customAllerg,
  ];

  return (
    <div className="screen fade-in">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 0 4px" }}>
        <button onClick={() => setScreen(SCREENS.PROFILE)}
          style={{ background:"none", border:"none", cursor:"pointer", padding:"4px 8px 4px 0", color:"var(--muted)", fontSize:20, lineHeight:1 }}>
          ‹
        </button>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:"var(--ink)" }}>Restaurantguide</div>
          <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>Sådan spiser du trygt ude</div>
        </div>
      </div>

      {/* Dine allergener — kontekst */}
      {allergenNames.length > 0 && (
        <div style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:12, padding:"12px 14px", marginBottom:14, marginTop:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--red)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>
            Dine allergener — husk at nævne disse
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {allergenNames.map((name, i) => (
              <div key={i} style={{ padding:"3px 10px", borderRadius:20, background:"var(--red-lt)", border:"1px solid var(--red-md)", fontSize:12, fontWeight:700, color:"var(--red)" }}>
                {name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tip til madpas */}
      <div style={{ background:"rgba(74,222,128,.07)", border:"1px solid rgba(74,222,128,.2)", borderRadius:12, padding:"12px 14px", marginBottom:16, display:"flex", gap:10, alignItems:"flex-start" }}>
        <div style={{ fontSize:20, flexShrink:0 }}>💡</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--green)", marginBottom:3 }}>Brug dit madpas</div>
          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5 }}>
            Vis dit madpas direkte til tjeneren — på dansk eller 16 andre sprog. Tryk på Madpas i menuen.
          </div>
        </div>
      </div>

      {/* Tip-sektioner — accordions */}
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
        {TIPS.map(section => {
          const isOpen = openSection === section.id;
          return (
            <div key={section.id}
              style={{ background:"var(--surface)", border:`1px solid ${isOpen ? section.border : "var(--border)"}`, borderRadius:14, overflow:"hidden", transition:"border-color .2s" }}>
              {/* Accordion header */}
              <div onClick={() => setOpenSection(isOpen ? null : section.id)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}>
                <div style={{ width:38, height:38, borderRadius:10, background: section.bg, border:`1px solid ${section.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                  {section.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>{section.title}</div>
                  {!isOpen && (
                    <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{section.tips.length} tips</div>
                  )}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5"
                  style={{ transform: isOpen ? "rotate(180deg)" : "none", transition:"transform .2s", flexShrink:0 }}>
                  <path strokeLinecap="round" d="M6 9l6 6 6-6"/>
                </svg>
              </div>

              {/* Accordion body */}
              {isOpen && (
                <div style={{ borderTop:`1px solid ${section.border}`, padding:"4px 0 12px" }}>
                  {section.tips.map((tip, i) => (
                    <div key={i} style={{ display:"flex", gap:10, padding:"10px 16px", alignItems:"flex-start" }}>
                      <div style={{ width:22, height:22, borderRadius:"50%", background: section.bg, border:`1px solid ${section.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color: section.color, flexShrink:0, marginTop:1 }}>
                        {i + 1}
                      </div>
                      <div style={{ fontSize:13, color:"var(--ink)", lineHeight:1.55, flex:1 }}>{tip}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hurtige sætninger */}
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:4 }}>💬 Nyttige sætninger</div>
        <div style={{ fontSize:11, color:"var(--muted)", marginBottom:12, lineHeight:1.5 }}>
          Brug disse sætninger direkte — på dansk og engelsk.
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {QUICK_PHRASES.map((p, i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom: i < QUICK_PHRASES.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>{p.da}</div>
              <div style={{ fontSize:12, color:"var(--muted)", fontStyle:"italic" }}>{p.en}</div>
            </div>
          ))}
        </div>
      </div>

      {/* EU-lovgivning footer-note */}
      <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.6, padding:"0 4px 24px", textAlign:"center" }}>
        🇪🇺 EU-forordning 1169/2011 forpligter alle restauranter til at oplyse om 14 allergener. Det er din ret at spørge.
      </div>
    </div>
  );
}
