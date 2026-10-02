// @ts-nocheck
import React from "react";
import { Icon } from "./SharedComponents.jsx";
import { DIETS_ENABLED } from "./constants.jsx";
import { UI } from "./styleUtils.js";

const HELP_CONTENT = {
  "home": { title:"Scanner", titleIcon:"camera", tips:[
    { icon:"barcode", title:"Scan stregkode", desc:"Tryk på det grønne scan-felt for at åbne kameraet, og hold det roligt over stregkoden. Appen scanner automatisk." },
    { icon:"search", title:"Søg produkter", desc:"Kan du ikke scanne? Brug genvejen 'Søg produkter' længere nede på skærmen til at finde varer ved navn." },
    { icon:"hash", title:"Indtast manuelt", desc:"Har du kun tallene fra stregkoden? Tryk 'Indtast EAN-nummer manuelt' under scan-feltet." },
    { icon:"zap", title:"Hurtig scanning", desc:"God belysning og rolig hånd giver hurtigere og mere præcist resultat." },
    { icon:"list", title:"Historik", desc:"Dine seneste scanninger gemmes automatisk — find dem under Profil." },
  ]},
  "recipes": { title:"Opskrifter", titleIcon:"recipes", tips:[
    { icon:"search", title:"Søg og filtrer", desc:"Søg på navn eller vælg kategori. Slå 'Kun sikre' til for at skjule opskrifter med dine allergener." },
    { icon:"heart", title:"Favoritter", desc:"Tryk hjerte-ikonet for at gemme en opskrift til Favoritter-fanen." },
    { icon:"profile", title:"Portionsjustering", desc:"Åbn en opskrift og tryk + / − for at skalere ingredienser automatisk." },
    { icon:"cart", title:"Indkøbsliste", desc:"Tryk 'Tilføj til indkøbsliste' for at sende ingredienser direkte til din liste." },
  ]},
  "search": { title:"Søg produkter", titleIcon:"search", tips:[
    { icon:"profile", title:"Filtrér efter profil", desc:"Vælg hvilke profiler resultaterne skal tjekkes op imod, øverst på siden." },
    { icon:"edit", title:"Allergener og kategori", desc:"Fold 'Allergener' ud for at tilføje ekstra allergener manuelt, eller indsnævr til én kategori — begge sidder lige over søgefeltet." },
    { icon:"cart", title:"Tilføj til liste", desc:"Tryk '+ Liste' på et resultat for at sende det direkte til din indkøbsliste." },
  ]},
  "list": { title:"Indkøbsliste", titleIcon:"cart", tips:[
    { icon:"list", title:"Flere lister", desc:"Tryk på listenavnet øverst for at skifte mellem lister eller oprette en ny." },
    { icon:"link", title:"Del listen", desc:"Tryk på del-ikonet og vælg: kun dig, hele familien eller bestemte personer. Du kan også sende et link til en, der ikke er i familien." },
    { icon:"edit", title:"Tilføj varer", desc:"Skriv en vare og tryk Tilføj — eller send direkte fra en opskrift eller et søgeresultat." },
    { icon:"check", title:"Afkryds og ryd", desc:"Tryk på en vare for at markere den som købt, og brug 'Ryd' for at fjerne alle købte varer på én gang." },
  ]},
  "profile": { title:"Profil", titleIcon:"profile", tips:[
    { icon:"edit", title:"Mine præferencer", desc:DIETS_ENABLED ? "Allergier, diæter og E-numre du overvåges for — tryk 'Rediger' for at ændre dem." : "Allergier, intolerancer og E-numre du overvåges for — tryk 'Rediger' for at ændre dem." },
    { icon:"family", title:"Din familie", desc:"Voksne, du har inviteret (eller som har inviteret dig), kan se hinandens allergier og dele lister. Se dem under Familie i menuen." },
    { icon:"list", title:"Mine / Familien", desc:"Under historik og favoritter kan du skifte mellem kun dine egne og hele familiens." },
  ]},
  "family": { title:"Familie", titleIcon:"family", tips:[
    { icon:"👶", title:"Allergiprofiler", desc:"Opret en profil til et barn eller en anden uden egen konto — vælg dem på Scan-siden for at tjekke varer for dem." },
    { icon:"home", title:"Voksne med egen konto", desc:"Når en voksen siger ja til din invitation, kan I se hinandens allergier og dele lister. Begge kan afslutte forbindelsen igen." },
    { icon:"link", title:"Invitér en voksen", desc:"Send invitationen til en voksen. Linket virker i 24 timer og kun til én person." },
  ]},
  "result": { title:"Scanningsresultat", titleIcon:"package", tips:[
    { icon:"🚦", title:"Farvet ramme", desc:"Grøn = sikkert, gul = advarsel, rød = farligt — vurderet ud fra dine aktive profiler." },
    { icon:"check", title:"Sikre alternativer", desc:"Ved advarsel eller fare foreslår vi sikre alternativer i samme kategori, du kan trykke direkte på." },
    { icon:"book", title:"Tryk på en ingrediens", desc:"Åbner leksikonet med forklaring på allergener, E-numre og tilsætningsstoffer." },
    { icon:"heart", title:"Favorit og del", desc:"De to runde knapper øverst på billedet gemmer produktet som favorit eller deler det." },
    { icon:"edit", title:"Ret forkerte data", desc:"Mangler eller fejler noget? Tryk 'Ret forkerte data' nederst for at foreslå en rettelse." },
  ]},
  "history": { title:"Scanningshistorik", titleIcon:"list", tips:[
    { icon:"family", title:"Mine / Familien", desc:"Skift mellem kun dine egne scanninger og hele familiens, hvis du har en." },
    { icon:"👆", title:"Åbn en scanning", desc:"Tryk på en linje for at se det fulde resultat igen." },
  ]},
  "favorites": { title:"Favoritter", titleIcon:"star", tips:[
    { icon:"heart", title:"Gem favoritter", desc:"Tryk hjerte-ikonet på et produkt under scanning for at gemme det her." },
    { icon:"family", title:"Mine / Familien", desc:"Se dine egne favoritter eller hele familiens." },
    { icon:"x", title:"Fjern", desc:"Du kan kun fjerne dine egne favoritter herfra — ikke andres." },
  ]},
  "madpas": { title:"Madpas", titleIcon:"globe", tips:[
    { icon:"globe", title:"Vælg sprog", desc:"Vælg sproget for landet du besøger. EatSafe oversætter dine allergier automatisk." },
    { icon:"list", title:"Vis til tjeneren", desc:"Tryk 'Vis til tjener' for en stor, tydelig skærm du kan vise restaurantpersonalet." },
    { icon:"speaker", title:"Oplæsning", desc:"Tryk højttalerikonet for at høre udtalen på det lokale sprog." },
  ]},
  "editprofile": { title:"Rediger profil", titleIcon:"edit", tips:[
    { icon:"profile", title:"Dit navn", desc:"Navnet bruges i appen og i mails fra EatSafe." },
    { icon:"warning", title:"Allergier og præferencer", desc:DIETS_ENABLED ? "Allergier, intolerancer, diæter og E-numre ændrer du under 'Rediger præferencer' på din profil." : "Allergier, intolerancer og E-numre ændrer du under 'Rediger præferencer' på din profil." },
  ]},
  "suggest_edit": { title:"Foreslå rettelse", titleIcon:"edit", tips:[
    { icon:"camera", title:"Ingrediensliste", desc:"Fotografér etiketten og lad OCR læse teksten, eller ret ingredienserne manuelt." },
    { icon:"clock", title:"Godkendelse", desc:"Dit forslag gennemgås, før ændringen bliver synlig for andre brugere." },
  ]},
  "notfound": { title:"Tilføj nyt produkt", titleIcon:"package", tips:[
    { icon:"camera", title:"Fotografér", desc:"Tag billede af forsiden og ingredienslisten — vi udfylder automatisk navn og allergener med AI." },
    { icon:"eye", title:"Gennemgå", desc:"Tjek at det udfyldte er korrekt, før du sender produktet ind." },
    { icon:"clock", title:"Godkendelse", desc:"Produktet gennemgås, før det er synligt for andre brugere." },
  ]},
  "submitted": { title:"Indsendt", titleIcon:"check", tips:[
    { icon:"🙏", title:"Tak for hjælpen", desc:"Din indsendelse gennemgås snarest og bliver synlig for andre, når den er godkendt." },
  ]},
  "knowledge": { title:"Leksikon", titleIcon:"book", tips:[
    { icon:"search", title:"Søg eller filtrér", desc:"Søg efter et emne, eller vælg en kategori som allergener og E-numre" + (DIETS_ENABLED ? " eller diæter." : ".") },
    { icon:"👆", title:"Åbnet fra et produkt", desc:"Tryk på en ingrediens eller et E-nummer i et scanningsresultat for at hoppe direkte hertil." },
  ]},
  "admin": { title:"Admin", titleIcon:"shield", tips:[
    { icon:"check", title:"Godkend indsendelser", desc:"Gennemgå og godkend eller afvis nye produkter og rettelsesforslag fra brugere." },
    { icon:"family", title:"Brugere og tickets", desc:"Administrér brugerroller og besvar indsendt feedback under de øvrige faner." },
  ]},
};

// ── Hjælp-modal — kontekstuel tips-liste ud fra hvilken skærm brugeren er på ──
export default function HelpModal({ screen, onClose, onOpenFeedback }) {
  const content = HELP_CONTENT[screen] || { title:"Hjælp", titleIcon:"info", tips:[
    { icon:"message", title:"Send feedback", desc:"Brug Feedback-knappen øverst til at rapportere problemer eller forslag." },
  ]};
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.85)", display:"flex", alignItems:"flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"80vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={UI.rowBetweenMb16}>
          <div style={{ ...UI.ufs18_fw900_cink, display:"flex", alignItems:"center", gap:8 }}><Icon name={content.titleIcon} size={17} color="var(--ink)" /> {content.title}</div>
          <button onClick={onClose} aria-label="Luk"
            style={{ background:"var(--surface)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--ink)" }}>×</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
          {content.tips.map((tip, i) => (
            <div key={i} style={{ display:"flex", gap:12, padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12 }}>
              <div style={{ ...UI.ufs22_shr0, display:"flex" }}>
                {typeof tip.icon === "string" && !["👶","🚦","👆","🙏"].includes(tip.icon)
                  ? <Icon name={tip.icon} size={20} color="var(--ink2)" />
                  : <span style={UI.ufs22_shr0}>{tip.icon}</span>}
              </div>
              <div>
                <div style={UI.ufs13_fw800_cink_mb3}>{tip.title}</div>
                <div style={UI.ufs12_cmuted2_lh16}>{tip.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { onClose(); onOpenFeedback(); }}
          style={{ width:"100%", padding:"12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--muted2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <Icon name="message" size={13} color="var(--muted2)" /> Send feedback eller rapportér fejl
        </button>
      </div>
    </div>
  );
}
