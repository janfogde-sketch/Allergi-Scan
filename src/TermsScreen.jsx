// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// TermsScreen.jsx — Brugsvilkår som en almindelig underside i appen.
//
// Egen, selvstændig sticky header (.legal-topbar, se theme.jsx) i stedet for
// AppHeader — se App.jsx's isLegalPage-kommentar for hvorfor: siden kan
// åbnes BÅDE fra kontekster med AppHeader (Indstillinger/Profil) og uden
// (Velkommen/Log ind, hvor AppHeader er skjult under onboarding), så den
// viser altid denne ene header, uanset indgang. Tilbagepilen fører til
// legalReturnScreen (den skærm der åbnede siden via openLegal i
// NavigationContext), IKKE et fast mål — se App.jsx.
//
// public/terms.html er en uafhængig kopi af samme tekst (offentlig URL uden
// for appen), ikke en delt kilde — ret begge, hvis vilkårene ændres.
//
// Åbne, interne punkter i vilkårene står KUN i admin-ticketen
// "[Brugsvilkår · IKKE FÆRDIGE]" i feedback_tickets — aldrig her, da både
// JS-bundlen og terms.html er offentligt tilgængelige.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Icon } from "./SharedComponents.jsx";

const S = {
  updated: { fontSize:12.5, color:"var(--muted)", marginBottom:16 },
  draftNotice: { background:"var(--amber-lt)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:24, fontSize:13, color:"var(--ink2)", fontWeight:500, lineHeight:1.5 },
  h2: { fontSize:15, fontWeight:800, color:"var(--green)", margin:"24px 0 8px" },
  p: { fontSize:13.5, color:"var(--ink2)", lineHeight:1.55, marginBottom:10 },
  ul: { fontSize:13.5, color:"var(--ink2)", lineHeight:1.55, paddingLeft:18, marginBottom:10 },
  li: { marginBottom:5 },
  a: { color:"var(--green)", fontWeight:700, textDecoration:"none" },
  contactBox: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 18px", marginTop:28, boxShadow:"var(--sh)" },
};

const Mail = () => <a href="mailto:hej@eatsafe.dk" style={S.a}>hej@eatsafe.dk</a>;

export default function TermsScreen({ onBack }) {
  return (
    <>
      <header className="legal-topbar">
        <button onClick={onBack} aria-label="Tilbage" className="legal-topbar-back">
          <span className="legal-topbar-back-circle">
            <Icon name="chevronLeft" size={17} color="var(--ink)" />
          </span>
        </button>
        <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Brugsvilkår</div>
      </header>
      {/* paddingTop matcher .legal-topbar's egen renderede højde (header er
          position:fixed, tager ikke plads i normal flow) + lidt luft. */}
      <div className="screen fade-in" style={{ paddingTop:"calc(75px + env(safe-area-inset-top))" }}>
        <div style={S.updated}>Sidst opdateret: 6. oktober 2026</div>

        <div style={S.draftNotice}>
          Denne side er en foreløbig udgave af EatSafes brugsvilkår og er endnu ikke juridisk gennemgået. Kontakt <Mail />, hvis du har spørgsmål, indtil den endelige version er på plads.
        </div>

        <p style={S.p}>Disse brugsvilkår gælder for din brug af EatSafe.</p>
        <p style={S.p}>EatSafe hjælper dig med at sammenholde oplysninger om fødevarer med de allergier, intolerancer, kostpræferencer, E-numre og andre valg, du har registreret i appen.</p>
        <p style={S.p}>Ved at oprette en konto og bruge EatSafe accepterer du disse brugsvilkår.</p>

        <h2 style={S.h2}>1. Hvem står bag EatSafe?</h2>
        <p style={S.p}>EatSafe drives af:</p>
        <p style={S.p}>E-mail: <Mail /></p>

        <h2 style={S.h2}>2. Hvad gør EatSafe?</h2>
        <p style={S.p}>EatSafe er et digitalt værktøj, der hjælper dig med at vurdere, om oplysninger om et fødevareprodukt matcher de valg, du har registreret i EatSafe.</p>
        <p style={S.p}>EatSafe kan blandt andet:</p>
        <ul style={S.ul}>
          <li style={S.li}>scanne eller søge efter fødevarer</li>
          <li style={S.li}>sammenholde produktdata med dine registrerede allergier og intolerancer</li>
          <li style={S.li}>kontrollere kostpræferencer og valgte E-numre</li>
          <li style={S.li}>vise ingredienser, allergener og næringsoplysninger</li>
          <li style={S.li}>gemme historik, favoritter og indkøbslister</li>
          <li style={S.li}>understøtte profiler for familiemedlemmer eller andre personer i din familie</li>
          <li style={S.li}>modtage produktbilleder, rettelser og andre produktoplysninger fra brugere.</li>
        </ul>
        <p style={S.p}>Hvilke funktioner der er tilgængelige, kan ændre sig over tid.</p>

        <h2 style={S.h2}>3. EatSafe er vejledende</h2>
        <p style={S.p}>EatSafe er et vejledende hjælpemiddel. EatSafe kan ikke garantere, at et produkt er sikkert for dig at indtage.</p>
        <p style={S.p}>EatSafe baserer sine resultater på de produktdata, der er tilgængelige for tjenesten. Produktoplysninger kan være mangelfulde, forkerte, forældede eller være blevet ændret af producenten.</p>
        <p style={S.p}>Kontrollér derfor altid produktets aktuelle emballage, ingrediensliste og allergenoplysninger, før du bruger eller indtager produktet.</p>
        <p style={S.p}>Hvis oplysningerne i EatSafe afviger fra produktets aktuelle emballage, skal du lægge oplysningerne på emballagen til grund.</p>
        <p style={S.p}>EatSafe kan kun advare om forhold, som kan identificeres ud fra de tilgængelige produktdata. Ændrede opskrifter, produktionsforhold, krydskontaminering eller andre forhold fremgår ikke nødvendigvis af EatSafes data.</p>
        <p style={S.p}>EatSafe yder ikke lægelig, ernæringsfaglig eller anden sundhedsfaglig rådgivning.</p>

        <h2 style={S.h2}>4. EatSafe-resultater</h2>
        <p style={S.p}>Et resultat som eksempelvis “Ingen advarsler fundet” betyder, at EatSafe ikke har fundet et match mellem de tilgængelige produktdata og de relevante valg, du har registreret i EatSafe.</p>
        <p style={S.p}>Resultatet er ikke en garanti for, at produktet er fri for et bestemt allergen eller sikkert for dig at indtage.</p>
        <p style={S.p}>Hvis EatSafe viser et usikkert resultat, betyder det, at de tilgængelige oplysninger ikke er tilstrækkelige til, at EatSafe kan foretage en sikker vurdering.</p>
        <p style={S.p}>Du bør derfor altid kontrollere produktets aktuelle ingrediens- og allergenoplysninger på emballagen.</p>

        <h2 style={S.h2}>5. Produktdata og eksterne kilder</h2>
        <p style={S.p}>EatSafe anvender produktinformation fra forskellige kilder. Det kan blandt andet være offentligt tilgængelige produktdatabaser, producenter, EatSafe-brugere og oplysninger aflæst fra produktemballage.</p>
        <p style={S.p}>Hvor det er relevant, kan EatSafe vise, hvilken kilde produktdata stammer fra.</p>
        <p style={S.p}>Tredjepartsdata og brugerindsendte oplysninger kan indeholde fejl, være ufuldstændige eller være forældede. EatSafe kontrollerer ikke nødvendigvis alle oplysninger manuelt, før de vises i appen.</p>
        <p style={S.p}>Produktdata og billeder fra Open Food Facts og dets bidragydere er udgivet under Open Database License (ODbL), Database Contents License og Creative Commons Attribution-ShareAlike (billeder), se openfoodfacts.org. Produktnavne, varemærker, billeder og andet materiale tilhører deres respektive rettighedshavere.</p>

        <h2 style={S.h2}>6. Automatisk billed- og tekstanalyse</h2>
        <p style={S.p}>EatSafe kan anvende automatiseret billed- og tekstanalyse til eksempelvis at aflæse stregkoder, ingredienslister, allergenoplysninger og anden produktinformation.</p>
        <p style={S.p}>Automatisk analyse kan tage fejl. Oplysninger, der er fundet ved automatisk analyse, bør derfor kontrolleres mod produktets aktuelle emballage.</p>
        <p style={S.p}>EatSafe kan markere oplysninger som usikre, hvis de tilgængelige produktdata ikke er tilstrækkelige til at foretage en pålidelig vurdering.</p>

        <h2 style={S.h2}>7. Din konto</h2>
        <p style={S.p}>Du er ansvarlig for, at de oplysninger, du giver i forbindelse med oprettelse og brug af din EatSafe-konto, er korrekte.</p>
        <p style={S.p}>Du skal beskytte dine loginoplysninger og må ikke give andre uberettiget adgang til din konto.</p>
        <p style={S.p}>Hvis du mener, at din konto er blevet misbrugt, skal du kontakte os hurtigst muligt på <Mail />.</p>
        <p style={S.p}>Du kan slette din konto via EatSafes indstillinger.</p>
        <p style={S.p}>Behandling og sletning af personoplysninger er nærmere beskrevet i EatSafes privatlivspolitik.</p>

        <h2 style={S.h2}>8. Familieprofiler</h2>
        <p style={S.p}>EatSafe kan gøre det muligt at oprette eller administrere profiler for andre personer i din familie.</p>
        <p style={S.p}>Du må kun registrere oplysninger om en anden person, når du har ret til det.</p>
        <p style={S.p}>Voksne personer skal selv acceptere en invitation, før de indgår i din familie. Du må kun invitere personer, der ønsker det, og skal indtaste deres egen e-mailadresse; en invitation kan kun bruges af den, der har fået mailen eller linket, og kun én gang. Deler du et link, skal du selv godkende, hvem der bruger det. Registrerer du oplysninger om en voksen på en profil, du selv administrerer, forudsætter det, at personen har givet dig sit samtykke.</p>
        <p style={S.p}>Ved oprettelse af en profil for et barn skal du have ret til at handle på barnets vegne.</p>
        <p style={S.p}>EatSafe kan begrænse eller ændre mulighederne for at registrere oplysninger om andre personer for at beskytte deres privatliv og sikkerhed.</p>

        <h2 style={S.h2}>9. Brugerindsendt indhold</h2>
        <p style={S.p}>Du kan i visse dele af EatSafe indsende produktbilleder, ingrediensoplysninger, stregkoder, rettelser og anden produktinformation.</p>
        <p style={S.p}>Du skal efter bedste evne sikre, at de oplysninger, du indsender, er korrekte og vedrører det relevante produkt.</p>
        <p style={S.p}>Du må ikke indsende materiale, som er ulovligt, vildledende, krænkende eller som du ikke har ret til at anvende.</p>
        <p style={S.p}>Du beholder eventuelle rettigheder til materiale, du indsender.</p>
        <p style={S.p}>Du giver EatSafe en ikke-eksklusiv ret til at opbevare, behandle, tilpasse og vise materialet i det omfang, det er nødvendigt for at drive og forbedre EatSafe og EatSafes produktdata.</p>
        <p style={S.p}>EatSafe kan rette eller fjerne brugerindsendte oplysninger, hvis de vurderes at være forkerte, irrelevante, forældede eller i strid med disse brugsvilkår.</p>

        <h2 style={S.h2}>10. Acceptabel brug</h2>
        <p style={S.p}>Du må ikke:</p>
        <ul style={S.ul}>
          <li style={S.li}>bruge EatSafe til ulovlige formål</li>
          <li style={S.li}>forsøge at få uautoriseret adgang til EatSafes systemer eller andre brugeres konti</li>
          <li style={S.li}>omgå EatSafes sikkerheds- eller adgangsbegrænsninger</li>
          <li style={S.li}>automatiseret hente eller kopiere større mængder data fra EatSafe uden tilladelse</li>
          <li style={S.li}>bevidst indsende falske eller vildledende produktdata</li>
          <li style={S.li}>forsøge at manipulere produktresultater</li>
          <li style={S.li}>bruge tjenesten på en måde, der kan skade, overbelaste eller forstyrre EatSafe.</li>
        </ul>
        <p style={S.p}>EatSafe kan begrænse eller suspendere adgangen til tjenesten ved væsentligt eller gentaget misbrug.</p>

        <h2 style={S.h2}>11. Immaterielle rettigheder</h2>
        <p style={S.p}>EatSafes navn, logo, design, software, tekster og øvrige materiale, som EatSafe selv ejer eller har rettigheder til, må ikke kopieres, distribueres eller anvendes kommercielt uden tilladelse, medmindre andet følger af lovgivningen eller en relevant tredjepartslicens.</p>
        <p style={S.p}>Rettigheder til tredjepartsdata, varemærker, billeder og andet materiale tilhører de respektive rettighedshavere.</p>

        <h2 style={S.h2}>12. Drift og Beta</h2>
        <p style={S.p}>EatSafe er fortsat under udvikling og tilbydes aktuelt som en Beta-version.</p>
        <p style={S.p}>Der kan derfor forekomme fejl, manglende funktioner og ændringer i tjenesten.</p>
        <p style={S.p}>Funktioner kan blive tilføjet, ændret eller fjernet i takt med, at EatSafe udvikles.</p>
        <p style={S.p}>Vi bestræber os på at holde EatSafe tilgængelig og funktionsdygtig, men kan ikke garantere uafbrudt adgang til tjenesten.</p>
        <p style={S.p}>Midlertidige driftsforstyrrelser kan blandt andet forekomme i forbindelse med vedligeholdelse, tekniske fejl eller problemer hos eksterne leverandører.</p>

        <h2 style={S.h2}>13. Ansvar</h2>
        <p style={S.p}>EatSafes ansvar reguleres af dansk rets almindelige regler.</p>
        <p style={S.p}>Intet i disse brugsvilkår begrænser de rettigheder, du har efter ufravigelig forbrugerbeskyttende lovgivning.</p>
        <p style={S.p}>EatSafe er et vejledende værktøj, og tjenestens begrænsninger vedrørende produktdata, automatiske analyser og EatSafe-resultater er beskrevet i disse brugsvilkår.</p>
        <p style={S.p}>Du bør altid kontrollere produktets aktuelle ingrediens- og allergenoplysninger på emballagen, inden produktet anvendes eller indtages.</p>

        <h2 style={S.h2}>14. Suspension og lukning af konto</h2>
        <p style={S.p}>Du kan til enhver tid stoppe med at bruge EatSafe og slette din konto.</p>
        <p style={S.p}>EatSafe kan suspendere eller lukke en konto ved væsentlig eller gentagen overtrædelse af disse brugsvilkår, misbrug af tjenesten eller handlinger, der kan true EatSafes eller andre brugeres sikkerhed.</p>
        <p style={S.p}>Hvor det er rimeligt og muligt, vil brugeren blive informeret om årsagen.</p>

        <h2 style={S.h2}>15. Betalte funktioner</h2>
        <p style={S.p}>EatSafe kan på et senere tidspunkt tilbyde betalte funktioner eller abonnementer.</p>
        <p style={S.p}>Pris, betalingsperiode, indhold, opsigelsesvilkår og øvrige relevante købsvilkår vil i så fald blive oplyst tydeligt, inden du foretager et køb.</p>

        <h2 style={S.h2}>16. Ændringer af brugsvilkårene</h2>
        <p style={S.p}>Vi kan opdatere disse brugsvilkår, når EatSafe udvikles, når tjenestens funktioner ændres, eller når det er nødvendigt som følge af lovgivning, sikkerhed eller andre relevante forhold.</p>
        <p style={S.p}>Ved væsentlige ændringer informerer vi brugerne på passende måde.</p>
        <p style={S.p}>Den aktuelle version af brugsvilkårene vil altid være tilgængelig i EatSafe.</p>

        <h2 style={S.h2}>17. Lovvalg og forbrugerrettigheder</h2>
        <p style={S.p}>Disse brugsvilkår er underlagt dansk ret.</p>
        <p style={S.p}>Dette påvirker ikke ufravigelige rettigheder, som du måtte have som forbruger efter gældende lovgivning.</p>

        <h2 style={S.h2}>18. Kontakt og klager</h2>
        <p style={S.p}>Har du spørgsmål til disse brugsvilkår eller ønsker du at klage over EatSafe, kan du kontakte os på:</p>
        <p style={S.p}><Mail /></p>
        <p style={S.p}>Hvis vi ikke kan finde en løsning, kan du undersøge dine muligheder for at indbringe sagen for den relevante danske forbrugerklageinstans.</p>

        <div style={S.contactBox}>
          <p style={{ margin:0, fontSize:13.5, color:"var(--ink2)", lineHeight:1.55 }}>
            Spørgsmål til brugsvilkårene?<br/>
            Skriv til os på <Mail />
          </p>
        </div>
      </div>
    </>
  );
}
