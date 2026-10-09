// Brugsvilkår-teksten: ÉN kilde til appens skærm og den offentlige side.
// Skærmen (TermsScreen.jsx) og public/terms.html (genereres af
// scripts/build-legal-pages.mjs) læser begge herfra. Ret KUN her; kør derefter
// node scripts/build-legal-pages.mjs (testen src/legalText.test.js fejler ved afvigelse).
// Mini-markup i tekst: **fed**, \n = linjeskift, {mail} = hej@eatsafe.dk, [tekst](url) = link.
// Åbne juridiske punkter hører i admin-ticket, aldrig her (teksten er offentlig).
export default {
  "updated": "6. oktober 2026",
  "draftNotice": "Denne side er en foreløbig udgave af EatSafes brugsvilkår og er endnu ikke juridisk gennemgået. Kontakt {mail}, hvis du har spørgsmål, indtil den endelige version er på plads.",
  "blocks": [
    [
      "p",
      "Disse brugsvilkår gælder for din brug af EatSafe."
    ],
    [
      "p",
      "EatSafe hjælper dig med at sammenholde oplysninger om fødevarer med de allergier, intolerancer, kostpræferencer, E-numre og andre valg, du har registreret i appen."
    ],
    [
      "p",
      "Ved at oprette en konto og bruge EatSafe accepterer du disse brugsvilkår."
    ],
    [
      "h2",
      "1. Hvem står bag EatSafe?"
    ],
    [
      "p",
      "EatSafe drives af:"
    ],
    [
      "p",
      "E-mail: {mail}"
    ],
    [
      "h2",
      "2. Hvad gør EatSafe?"
    ],
    [
      "p",
      "EatSafe er et digitalt værktøj, der hjælper dig med at vurdere, om oplysninger om et fødevareprodukt matcher de valg, du har registreret i EatSafe."
    ],
    [
      "p",
      "EatSafe kan blandt andet:"
    ],
    [
      "ul",
      [
        "scanne eller søge efter fødevarer",
        "sammenholde produktdata med dine registrerede allergier og intolerancer",
        "kontrollere kostpræferencer og valgte E-numre",
        "vise ingredienser, allergener og næringsoplysninger",
        "gemme historik, favoritter og indkøbslister",
        "understøtte profiler for familiemedlemmer eller andre personer i din familie",
        "modtage produktbilleder, rettelser og andre produktoplysninger fra brugere."
      ]
    ],
    [
      "p",
      "Hvilke funktioner der er tilgængelige, kan ændre sig over tid."
    ],
    [
      "h2",
      "3. EatSafe er vejledende"
    ],
    [
      "p",
      "EatSafe er et vejledende hjælpemiddel. EatSafe kan ikke garantere, at et produkt er sikkert for dig at indtage."
    ],
    [
      "p",
      "EatSafe baserer sine resultater på de produktdata, der er tilgængelige for tjenesten. Produktoplysninger kan være mangelfulde, forkerte, forældede eller være blevet ændret af producenten."
    ],
    [
      "p",
      "Kontrollér derfor altid produktets aktuelle emballage, ingrediensliste og allergenoplysninger, før du bruger eller indtager produktet."
    ],
    [
      "p",
      "Hvis oplysningerne i EatSafe afviger fra produktets aktuelle emballage, skal du lægge oplysningerne på emballagen til grund."
    ],
    [
      "p",
      "EatSafe kan kun advare om forhold, som kan identificeres ud fra de tilgængelige produktdata. Ændrede opskrifter, produktionsforhold, krydskontaminering eller andre forhold fremgår ikke nødvendigvis af EatSafes data."
    ],
    [
      "p",
      "EatSafe yder ikke lægelig, ernæringsfaglig eller anden sundhedsfaglig rådgivning."
    ],
    [
      "h2",
      "4. EatSafe-resultater"
    ],
    [
      "p",
      "Et resultat som eksempelvis “Ingen match med dine valg” betyder, at EatSafe ikke har fundet et match mellem de tilgængelige produktdata og de relevante valg, du har registreret i EatSafe."
    ],
    [
      "p",
      "Resultatet er ikke en garanti for, at produktet er fri for et bestemt allergen eller sikkert for dig at indtage."
    ],
    [
      "p",
      "Hvis EatSafe viser et usikkert resultat, betyder det, at de tilgængelige oplysninger ikke er tilstrækkelige til, at EatSafe kan foretage en sikker vurdering."
    ],
    [
      "p",
      "Du bør derfor altid kontrollere produktets aktuelle ingrediens- og allergenoplysninger på emballagen."
    ],
    [
      "h2",
      "5. Produktdata og eksterne kilder"
    ],
    [
      "p",
      "EatSafe anvender produktinformation fra forskellige kilder. Det kan blandt andet være offentligt tilgængelige produktdatabaser, producenter, EatSafe-brugere og oplysninger aflæst fra produktemballage."
    ],
    [
      "p",
      "Hvor det er relevant, kan EatSafe vise, hvilken kilde produktdata stammer fra."
    ],
    [
      "p",
      "Tredjepartsdata og brugerindsendte oplysninger kan indeholde fejl, være ufuldstændige eller være forældede. EatSafe kontrollerer ikke nødvendigvis alle oplysninger manuelt, før de vises i appen."
    ],
    [
      "p",
      "Produktdata og billeder fra Open Food Facts og dets bidragydere er udgivet under Open Database License (ODbL), Database Contents License og Creative Commons Attribution-ShareAlike (billeder), se openfoodfacts.org. Produktnavne, varemærker, billeder og andet materiale tilhører deres respektive rettighedshavere."
    ],
    [
      "h2",
      "6. Automatisk billed- og tekstanalyse"
    ],
    [
      "p",
      "EatSafe kan anvende automatiseret billed- og tekstanalyse til eksempelvis at aflæse stregkoder, ingredienslister, allergenoplysninger og anden produktinformation."
    ],
    [
      "p",
      "Automatisk analyse kan tage fejl. Oplysninger, der er fundet ved automatisk analyse, bør derfor kontrolleres mod produktets aktuelle emballage."
    ],
    [
      "p",
      "EatSafe kan markere oplysninger som usikre, hvis de tilgængelige produktdata ikke er tilstrækkelige til at foretage en pålidelig vurdering."
    ],
    [
      "h2",
      "7. Din konto"
    ],
    [
      "p",
      "Du er ansvarlig for, at de oplysninger, du giver i forbindelse med oprettelse og brug af din EatSafe-konto, er korrekte."
    ],
    [
      "p",
      "Du skal beskytte dine loginoplysninger og må ikke give andre uberettiget adgang til din konto."
    ],
    [
      "p",
      "Hvis du mener, at din konto er blevet misbrugt, skal du kontakte os hurtigst muligt på {mail}."
    ],
    [
      "p",
      "Du kan slette din konto via EatSafes indstillinger."
    ],
    [
      "p",
      "Behandling og sletning af personoplysninger er nærmere beskrevet i EatSafes privatlivspolitik."
    ],
    [
      "h2",
      "8. Familieprofiler"
    ],
    [
      "p",
      "EatSafe kan gøre det muligt at oprette eller administrere profiler for andre personer i din familie."
    ],
    [
      "p",
      "Du må kun registrere oplysninger om en anden person, når du har ret til det."
    ],
    [
      "p",
      "Voksne personer skal selv acceptere en invitation, før de indgår i din familie. Du må kun invitere personer, der ønsker det, og skal indtaste deres egen e-mailadresse; en invitation kan kun bruges af den, der har fået mailen eller linket, og kun én gang. Deler du et link, skal du selv godkende, hvem der bruger det. Registrerer du oplysninger om en voksen på en profil, du selv administrerer, forudsætter det, at personen har givet dig sit samtykke."
    ],
    [
      "p",
      "Ved oprettelse af en profil for et barn skal du have ret til at handle på barnets vegne."
    ],
    [
      "p",
      "EatSafe kan begrænse eller ændre mulighederne for at registrere oplysninger om andre personer for at beskytte deres privatliv og sikkerhed."
    ],
    [
      "h2",
      "9. Brugerindsendt indhold"
    ],
    [
      "p",
      "Du kan i visse dele af EatSafe indsende produktbilleder, ingrediensoplysninger, stregkoder, rettelser og anden produktinformation."
    ],
    [
      "p",
      "Du skal efter bedste evne sikre, at de oplysninger, du indsender, er korrekte og vedrører det relevante produkt."
    ],
    [
      "p",
      "Du må ikke indsende materiale, som er ulovligt, vildledende, krænkende eller som du ikke har ret til at anvende."
    ],
    [
      "p",
      "Du beholder eventuelle rettigheder til materiale, du indsender."
    ],
    [
      "p",
      "Du giver EatSafe en ikke-eksklusiv ret til at opbevare, behandle, tilpasse og vise materialet i det omfang, det er nødvendigt for at drive og forbedre EatSafe og EatSafes produktdata."
    ],
    [
      "p",
      "EatSafe kan rette eller fjerne brugerindsendte oplysninger, hvis de vurderes at være forkerte, irrelevante, forældede eller i strid med disse brugsvilkår."
    ],
    [
      "h2",
      "10. Acceptabel brug"
    ],
    [
      "p",
      "Du må ikke:"
    ],
    [
      "ul",
      [
        "bruge EatSafe til ulovlige formål",
        "forsøge at få uautoriseret adgang til EatSafes systemer eller andre brugeres konti",
        "omgå EatSafes sikkerheds- eller adgangsbegrænsninger",
        "automatiseret hente eller kopiere større mængder data fra EatSafe uden tilladelse",
        "bevidst indsende falske eller vildledende produktdata",
        "forsøge at manipulere produktresultater",
        "bruge tjenesten på en måde, der kan skade, overbelaste eller forstyrre EatSafe."
      ]
    ],
    [
      "p",
      "EatSafe kan begrænse eller suspendere adgangen til tjenesten ved væsentligt eller gentaget misbrug."
    ],
    [
      "h2",
      "11. Immaterielle rettigheder"
    ],
    [
      "p",
      "EatSafes navn, logo, design, software, tekster og øvrige materiale, som EatSafe selv ejer eller har rettigheder til, må ikke kopieres, distribueres eller anvendes kommercielt uden tilladelse, medmindre andet følger af lovgivningen eller en relevant tredjepartslicens."
    ],
    [
      "p",
      "Rettigheder til tredjepartsdata, varemærker, billeder og andet materiale tilhører de respektive rettighedshavere."
    ],
    [
      "h2",
      "12. Drift og Beta"
    ],
    [
      "p",
      "EatSafe er fortsat under udvikling og tilbydes aktuelt som en Beta-version."
    ],
    [
      "p",
      "Der kan derfor forekomme fejl, manglende funktioner og ændringer i tjenesten."
    ],
    [
      "p",
      "Funktioner kan blive tilføjet, ændret eller fjernet i takt med, at EatSafe udvikles."
    ],
    [
      "p",
      "Vi bestræber os på at holde EatSafe tilgængelig og funktionsdygtig, men kan ikke garantere uafbrudt adgang til tjenesten."
    ],
    [
      "p",
      "Midlertidige driftsforstyrrelser kan blandt andet forekomme i forbindelse med vedligeholdelse, tekniske fejl eller problemer hos eksterne leverandører."
    ],
    [
      "h2",
      "13. Ansvar"
    ],
    [
      "p",
      "EatSafes ansvar reguleres af dansk rets almindelige regler."
    ],
    [
      "p",
      "Intet i disse brugsvilkår begrænser de rettigheder, du har efter ufravigelig forbrugerbeskyttende lovgivning."
    ],
    [
      "p",
      "EatSafe er et vejledende værktøj, og tjenestens begrænsninger vedrørende produktdata, automatiske analyser og EatSafe-resultater er beskrevet i disse brugsvilkår."
    ],
    [
      "p",
      "Du bør altid kontrollere produktets aktuelle ingrediens- og allergenoplysninger på emballagen, inden produktet anvendes eller indtages."
    ],
    [
      "h2",
      "14. Suspension og lukning af konto"
    ],
    [
      "p",
      "Du kan til enhver tid stoppe med at bruge EatSafe og slette din konto."
    ],
    [
      "p",
      "EatSafe kan suspendere eller lukke en konto ved væsentlig eller gentagen overtrædelse af disse brugsvilkår, misbrug af tjenesten eller handlinger, der kan true EatSafes eller andre brugeres sikkerhed."
    ],
    [
      "p",
      "Hvor det er rimeligt og muligt, vil brugeren blive informeret om årsagen."
    ],
    [
      "h2",
      "15. Betalte funktioner"
    ],
    [
      "p",
      "EatSafe kan på et senere tidspunkt tilbyde betalte funktioner eller abonnementer."
    ],
    [
      "p",
      "Pris, betalingsperiode, indhold, opsigelsesvilkår og øvrige relevante købsvilkår vil i så fald blive oplyst tydeligt, inden du foretager et køb."
    ],
    [
      "h2",
      "16. Ændringer af brugsvilkårene"
    ],
    [
      "p",
      "Vi kan opdatere disse brugsvilkår, når EatSafe udvikles, når tjenestens funktioner ændres, eller når det er nødvendigt som følge af lovgivning, sikkerhed eller andre relevante forhold."
    ],
    [
      "p",
      "Ved væsentlige ændringer informerer vi brugerne på passende måde."
    ],
    [
      "p",
      "Den aktuelle version af brugsvilkårene vil altid være tilgængelig i EatSafe."
    ],
    [
      "h2",
      "17. Lovvalg og forbrugerrettigheder"
    ],
    [
      "p",
      "Disse brugsvilkår er underlagt dansk ret."
    ],
    [
      "p",
      "Dette påvirker ikke ufravigelige rettigheder, som du måtte have som forbruger efter gældende lovgivning."
    ],
    [
      "h2",
      "18. Kontakt og klager"
    ],
    [
      "p",
      "Har du spørgsmål til disse brugsvilkår eller ønsker du at klage over EatSafe, kan du kontakte os på:"
    ],
    [
      "p",
      "{mail}"
    ],
    [
      "p",
      "Hvis vi ikke kan finde en løsning, kan du undersøge dine muligheder for at indbringe sagen for den relevante danske forbrugerklageinstans."
    ]
  ],
  "contactBox": "Spørgsmål til brugsvilkårene?\nSkriv til os på {mail}"
};
