// Privatlivspolitik-teksten: ÉN kilde til appens skærm og den offentlige side.
// Skærmen (PrivacyScreen.jsx) og public/privacy.html (genereres af
// scripts/build-legal-pages.mjs) læser begge herfra. Ret KUN her; kør derefter
// node scripts/build-legal-pages.mjs (testen src/legalText.test.js fejler ved afvigelse).
// Mini-markup i tekst: **fed**, \n = linjeskift, {mail} = hej@eatsafe.dk, [tekst](url) = link.
// Åbne juridiske punkter hører i admin-ticket, aldrig her (teksten er offentlig).
export default {
  "updated": "8. oktober 2026",
  "draftNotice": "Denne side er en foreløbig udgave af EatSafes privatlivspolitik og er endnu ikke juridisk gennemgået. Kontakt {mail}, hvis du har spørgsmål, indtil den endelige version er på plads.",
  "blocks": [
    [
      "p",
      "Denne privatlivspolitik beskriver, hvordan EatSafe behandler personoplysninger, når du opretter en konto og bruger EatSafes funktioner."
    ],
    [
      "p",
      "EatSafe behandler kun personoplysninger til relevante og angivne formål. Vi sælger ikke dine personoplysninger."
    ],
    [
      "h2",
      "1. Hvem er dataansvarlig?"
    ],
    [
      "p",
      "Den dataansvarlige for EatSafe er:"
    ],
    [
      "p",
      "E-mail: {mail}"
    ],
    [
      "h2",
      "2. Hvilke oplysninger behandler vi?"
    ],
    [
      "p",
      "Afhængigt af hvilke funktioner du bruger, kan EatSafe behandle følgende oplysninger:"
    ],
    [
      "p",
      "**Kontooplysninger**\nNavn, e-mailadresse, alder (fødselsår), køn og andre oplysninger, du giver i forbindelse med oprettelse eller administration af din konto. Alder og køn bruges til at tilpasse tjenesten og forstå, hvem den bruges af."
    ],
    [
      "p",
      "**Allergier og intolerancer**\nDe allergier, intolerancer og andre helbredsrelaterede oplysninger, du selv registrerer for at få personlige produktkontroller og advarsler, herunder hvordan du ønsker, at spor af et allergen skal behandles."
    ],
    [
      "p",
      "Oplysninger om helbred er en særlig kategori af personoplysninger og er underlagt skærpede regler efter GDPR."
    ],
    [
      "p",
      "**Kostpræferencer**\nEksempelvis vegansk, vegetarisk eller andre kosthensyn, du selv vælger."
    ],
    [
      "p",
      "**E-numre og øvrige fravalg**\nOplysninger om tilsætningsstoffer eller andre forhold, som du vælger at holde øje med eller undgå."
    ],
    [
      "p",
      "**Familieoplysninger**\nNavn, profiloplysninger og eventuelle allergi-, intolerance- eller helbredsoplysninger om personer, der indgår i din familie i EatSafe."
    ],
    [
      "p",
      "**Scanningshistorik, søgehistorik og favoritter**\nProdukter og stregkoder, du scanner, gemmer som favorit eller på anden måde interagerer med, hvis de relevante funktioner anvendes. Når du søger efter et produkt og vælger et i resultatet, gemmer vi dit søgeord og det valgte produkt, så søgningen bliver bedre for dig."
    ],
    [
      "p",
      "**Indkøbslister**\nProdukter og andre oplysninger, som du tilføjer til dine indkøbslister."
    ],
    [
      "p",
      "**Produktindsendelser**\nBilleder, stregkoder, ingrediensoplysninger og andre produktoplysninger, som du frivilligt sender til EatSafe."
    ],
    [
      "p",
      "**Feedback og support**\nDe oplysninger, du sender til os i forbindelse med feedback, fejlmeldinger, support eller anden kontakt."
    ],
    [
      "p",
      "**Tekniske oplysninger**\nNødvendige tekniske oplysninger om brugen af EatSafe, sikkerhed og fejlfinding, eksempelvis tidsstempler, fejlmeddelelser og tekniske logs."
    ],
    [
      "h2",
      "3. Allergi- og helbredsoplysninger"
    ],
    [
      "p",
      "Oplysninger om allergier og visse intolerancer kan være helbredsoplysninger og dermed særlige kategorier af personoplysninger."
    ],
    [
      "p",
      "Når EatSafe behandler sådanne oplysninger på baggrund af samtykke, indhenter vi et særskilt og udtrykkeligt samtykke."
    ],
    [
      "p",
      "Samtykket skal gives aktivt og særskilt fra accept af EatSafes brugsvilkår og fra det forhold, at du har læst privatlivspolitikken."
    ],
    [
      "p",
      "Du kan til enhver tid trække dit samtykke tilbage under Indstillinger → Privatliv & data. Trækker du samtykket tilbage, slettes dine allergi- og helbredsoplysninger, allergener på dine familieprofiler, valg af følsomhed, valgte E-numre, din scanningshistorik og beskeder om ændrede allergener."
    ],
    [
      "p",
      "Ændrer vi ordlyden af samtykket på en måde, der har betydning for dig, beder vi dig om at bekræfte det på ny, første gang du gemmer helbredsoplysninger efter ændringen. Dit tidligere samtykke gælder, indtil du har svaret, og du kan i stedet trække det tilbage."
    ],
    [
      "p",
      "Hvis du trækker dit samtykke tilbage, stopper EatSafe med at behandle de helbredsoplysninger, der er omfattet af samtykket, medmindre der findes et andet lovligt grundlag for en konkret fortsat behandling."
    ],
    [
      "p",
      "Funktioner, der kræver en allergi- eller helbredsprofil, vil herefter muligvis ikke kunne anvendes."
    ],
    [
      "p",
      "GDPR kræver et udtrykkeligt samtykke, når artikel 9, stk. 2, litra a anvendes som undtagelse til forbuddet mod behandling af følsomme oplysninger. Samtykket skal desuden kunne dokumenteres."
    ],
    [
      "h2",
      "4. Familie og oplysninger om andre personer"
    ],
    [
      "p",
      "Hvis du opretter oplysninger om en anden person, kan EatSafe behandle personoplysninger, som ikke kommer direkte fra den person, oplysningerne vedrører."
    ],
    [
      "p",
      "Voksne familiemedlemmer inviteres og skal selv acceptere invitationen, før de indgår i din familie. Når du inviterer en voksen, indtaster du vedkommendes e-mailadresse, og EatSafe sender en invitationsmail dertil via vores e-mailleverandør. Invitationen er knyttet til den adresse og til et personligt link i mailen, så den kan bruges af den, der modtager mailen, også hvis vedkommende logger ind med en anden adresse eller metode, fx Facebook. Modtageren kan se dit fornavn i mailen og på invitationssiden, før vedkommende har oprettet en konto. Forbindelsen oprettes først, når modtageren selv har bekræftet den i appen. Du kan også invitere uden en e-mailadresse ved at dele et personligt link, fx i en besked. Her kan den, der bruger linket, se dit fornavn, og forbindelsen oprettes først, når både vedkommende og du selv har godkendt den i appen. Profiler, du selv administrerer uden egen konto, er kun til børn under 18 år."
    ],
    [
      "p",
      "Du kan dele en indkøbsliste med din familie, med udvalgte personer fra din familie eller med et link til personer uden for familien. Linket er ikke en åben webside: den, der får det, skal have en EatSafe-konto og være logget ind, og ser kun listens navn og dit fornavn, før vedkommende selv vælger at tilslutte sig. Når personen er tilsluttet, kan vedkommende se og redigere hele listen, altså de varer og noter, der står på den. Alle, der får linket, kan tilslutte sig, så del det kun med personer, du stoler på. Linket virker, til du laver et nyt link eller stopper delingen, og du kan til enhver tid fjerne enkelte personer fra listen. Der deles ingen oplysninger om din profil, dine allergier eller din scanningshistorik gennem en delt liste. Skriver du helbredsoplysninger som fritekst på en delt liste, bliver de synlige for dem, du deler med."
    ],
    [
      "p",
      "Når personoplysninger ikke er indsamlet direkte hos den registrerede, kan EatSafe have en informationspligt efter GDPR artikel 14. Informationen skal som udgangspunkt gives inden for rimelig tid og senest inden for én måned, medmindre en relevant undtagelse finder anvendelse."
    ],
    [
      "p",
      "Ved oprettelse af en profil for et barn skal den person, der opretter profilen, have ret til at handle på barnets vegne."
    ],
    [
      "p",
      "Hvis EatSafe senere tilbyder tjenesten direkte til børn, skal reglerne om børns egne konti og samtykke vurderes særskilt."
    ],
    [
      "h2",
      "5. Hvad bruger vi oplysningerne til?"
    ],
    [
      "p",
      "EatSafe kan bruge oplysningerne til at:"
    ],
    [
      "ul",
      [
        "oprette og administrere din konto",
        "gemme dine indstillinger og præferencer",
        "sammenholde produktoplysninger med dine valgte allergier, intolerancer, kostpræferencer, E-numre og andre valg",
        "vise personlige produktresultater og advarsler",
        "levere familiefunktioner",
        "gemme historik, favoritter og indkøbslister",
        "behandle produktindsendelser og rettelser",
        "forbedre kvaliteten af EatSafes produktdata",
        "sende nødvendige servicebeskeder",
        "besvare feedback og supporthenvendelser",
        "forebygge misbrug",
        "sikre, fejlrette, vedligeholde og forbedre EatSafe."
      ]
    ],
    [
      "p",
      "EatSafe anvender automatiske sammenligninger mellem produktdata og dine valgte oplysninger."
    ],
    [
      "p",
      "Disse sammenligninger anvendes ikke til at træffe automatiske afgørelser, der har juridisk eller tilsvarende væsentlig virkning for dig."
    ],
    [
      "h2",
      "6. Retsgrundlag"
    ],
    [
      "p",
      "Retsgrundlaget afhænger af, hvilke oplysninger der behandles, og til hvilket formål."
    ],
    [
      "p",
      "**Aftale (GDPR artikel 6, stk. 1, litra b):** oprettelse og drift af din konto og de funktioner, du har bedt om, herunder personlige produktkontroller, profiler, indkøbslister, historik og de beskeder, der er en del af tjenesten."
    ],
    [
      "p",
      "**Legitim interesse (artikel 6, stk. 1, litra f):** sikkerhed, forebyggelse af misbrug, fejlfinding og drift af tjenesten, behandling af alder og køn med henblik på at forstå, hvem tjenesten bruges af, og forbedring af produktdata. Du har ret til at gøre indsigelse mod behandling, der sker på dette grundlag."
    ],
    [
      "p",
      "**Retlig forpligtelse (artikel 6, stk. 1, litra c):** når vi skal opbevare eller udlevere oplysninger for at overholde loven, fx for at besvare en anmodning om dine rettigheder."
    ],
    [
      "p",
      "**Helbredsoplysninger (artikel 9, stk. 2, litra a):** dine allergi- og intoleranceoplysninger og øvrige helbredsrelaterede valg behandles kun på grundlag af dit udtrykkelige samtykke, ud over aftalegrundlaget i artikel 6, stk. 1, litra b. Samtykket gives særskilt, før vi behandler oplysningerne, og du kan til enhver tid trække det tilbage (se afsnit 3)."
    ],
    [
      "p",
      "Oplysninger om andre personer, som du har registreret på en profil, du administrerer, behandles på samme grundlag, og forudsætter den pågældendes samtykke (se afsnit 4)."
    ],
    [
      "h2",
      "7. E-mails og push-notifikationer"
    ],
    [
      "p",
      "EatSafe kan sende beskeder til dig i appen, som push-notifikationer og som e-mail. Beskederne handler om din brug af tjenesten og kan blandt andet vedrøre:"
    ],
    [
      "ul",
      [
        "din konto og sikkerhed",
        "din familie, invitationer og delte lister",
        "dine produktindsendelser, din feedback og support",
        "advarsler og oplysninger om produkter, du har gemt eller scannet, fx ændrede allergenoplysninger eller tilbagekaldelser",
        "funktioner, du selv har anmodet om."
      ]
    ],
    [
      "p",
      "Push-notifikationer sendes kun, når EatSafe har den nødvendige tilladelse på din enhed. Du kan administrere tilladelsen i EatSafe og/eller i din enheds indstillinger."
    ],
    [
      "p",
      "Du kan vælge, hvilke typer beskeder du vil modtage, og om de skal komme som push eller e-mail, under Indstillinger → Notifikationer. EatSafe kan tilføje eller fjerne typer af beskeder, så længe de handler om ovenstående formål."
    ],
    [
      "h2",
      "8. Produktbilleder og automatisk/AI-baseret analyse"
    ],
    [
      "p",
      "EatSafe kan anvende automatiseret billed- og tekstanalyse til eksempelvis at aflæse:"
    ],
    [
      "ul",
      [
        "ingredienslister",
        "allergenoplysninger",
        "produktnavne",
        "stregkoder",
        "anden information på produktemballage."
      ]
    ],
    [
      "p",
      "Når du aktivt anvender en funktion, der analyserer et produktbillede, kan billedet blive sendt til en teknisk leverandør med henblik på analysen."
    ],
    [
      "p",
      "EatSafe forsøger at begrænse de oplysninger, der sendes, til det, der er nødvendigt for den relevante funktion."
    ],
    [
      "p",
      "Et produktbillede kan imidlertid selv indeholde personoplysninger, hvis sådanne oplysninger er synlige på billedet."
    ],
    [
      "p",
      "EatSafe anvender Anthropic API som kommerciel tjeneste til aflæsning af emballagebilleder og vurdering af ingredienstekst; der sendes aldrig konto-, profil- eller helbredsoplysninger til Anthropic. Anthropic oplyser aktuelt, at deres DPA med SCC’er indgår i Commercial Terms, og at inputs og outputs fra kommercielle produkter som udgangspunkt ikke bruges til modeltræning."
    ],
    [
      "h2",
      "9. Leverandører og modtagere"
    ],
    [
      "p",
      "EatSafe anvender eksterne leverandører til at drive og levere tjenesten."
    ],
    [
      "p",
      "Afhængigt af EatSafes aktuelle tekniske opsætning kan disse omfatte:"
    ],
    [
      "p",
      "**Supabase**\nAnvendes til database, autentificering og relateret backend-infrastruktur."
    ],
    [
      "p",
      "Supabases aktuelle DPA beskriver Supabase som databehandler og siger, at data, som kunden instruerer Supabase om at behandle i en bestemt geografisk region, lagres og primært behandles i den region, med visse forbehold. DPA’en indeholder desuden EU-standardkontraktbestemmelser for relevante internationale overførsler."
    ],
    [
      "p",
      "**Vercel**\nAnvendes til hosting og levering af EatSafes webbaserede infrastruktur."
    ],
    [
      "p",
      "Vercels aktuelle DPA oplyser, at virksomhedens primære behandlingsfaciliteter er i USA, og at data kan behandles internationalt. DPA’en beskriver samtidig mekanismer for lovlige internationale overførsler."
    ],
    [
      "p",
      "**Anthropic**\nAnvendes til automatisk analyse af produktbilleder og ingredienstekst."
    ],
    [
      "p",
      "**Open Food Facts**\nAnvendes som ekstern kilde til produktoplysninger og billeder. Disse stammer fra Open Food Facts og dets bidragydere og er udgivet under Open Database License (ODbL), Database Contents License og Creative Commons Attribution-ShareAlike (billeder). Opslag af produktdata sker fra EatSafes server alene med produktets stregkode. Produktbilleder kan hentes direkte fra Open Food Facts’ servere, hvorved din IP-adresse og tekniske enhedsoplysninger kan blive synlige for dem."
    ],
    [
      "p",
      "**Resend**\nAnvendes til at sende e-mails fra EatSafe, fx bekræftelse af e-mail, nulstilling af adgangskode, invitationer til familie og beskeder. Resend modtager din e-mailadresse, dit navn og beskedens indhold."
    ],
    [
      "p",
      "**Google, Facebook og Apple**\nHvis du vælger at logge ind med din Google-, Facebook- eller Apple-konto, modtager vi dit navn og din e-mailadresse fra udbyderen. Hos Apple kan du vælge at skjule din e-mailadresse; så modtager vi i stedet en adresse fra Apple, som videresender vores mails til dig."
    ],
    [
      "p",
      "**EatSafes personale**\nTil support og fejlfinding kan udvalgte personer hos EatSafe se kontooplysninger og de oplysninger, du har registreret i appen, herunder helbredsoplysninger. Adgangen er begrænset til de personer, der har brug for den, og bruges kun til drift, support og sikkerhed."
    ],
    [
      "p",
      "**Push-tjenester**\nPush-notifikationer leveres via din browser- eller enhedsleverandørs push-tjeneste (fx Apple, Google eller Mozilla)."
    ],
    [
      "h2",
      "10. Overførsel af oplysninger uden for EU/EØS"
    ],
    [
      "p",
      "Nogle af EatSafes leverandører eller deres underdatabehandlere kan behandle personoplysninger uden for EU/EØS."
    ],
    [
      "p",
      "Når personoplysninger overføres til et tredjeland, anvendes et relevant lovligt overførselsgrundlag, hvor dette er nødvendigt, eksempelvis:"
    ],
    [
      "ul",
      [
        "en EU-afgørelse om tilstrækkeligt beskyttelsesniveau",
        "EU-U.S. Data Privacy Framework, hvor betingelserne er opfyldt",
        "EU-Kommissionens standardkontraktbestemmelser",
        "andre lovlige overførselsmekanismer efter databeskyttelsesreglerne."
      ]
    ],
    [
      "p",
      "Du kan kontakte os på {mail}, hvis du ønsker yderligere oplysninger om relevante overførsler og garantier."
    ],
    [
      "h2",
      "11. Hvor længe opbevarer vi oplysninger?"
    ],
    [
      "p",
      "EatSafe opbevarer ikke personoplysninger længere end nødvendigt til de formål, de blev indsamlet til."
    ],
    [
      "p",
      "Kontodata og aktive profiloplysninger opbevares som udgangspunkt, mens din konto er aktiv. Bruger du ikke din konto i 36 måneder, sender vi dig en mail og sletter kontoen og alle oplysninger på den efter 30 dage, medmindre du logger ind igen inden da."
    ],
    [
      "p",
      "Hvis du trækker et samtykke til behandling af helbredsoplysninger tilbage, håndteres de pågældende oplysninger i overensstemmelse med den relevante sletteprocedure."
    ],
    [
      "p",
      "Når du sletter din konto (Indstillinger → Slet konto, eller ved at skrive til hej@eatsafe.dk; se eatsafe.dk/slet-konto), slettes din profil, dine allergi- og helbredsoplysninger, familieprofiler, indkøbslister, scanningshistorik, søgehistorik, favoritter, beskeder, tilmeldinger til push, feedback og produktindsendelser, herunder de billeder, du har indsendt, samt selve loginkontoen straks. Et produkt, du har indsendt, og som er blevet godkendt og indgår i EatSafes produktdatabase, forbliver som produktoplysninger sammen med det produktbillede, produktet bruger."
    ],
    [
      "p",
      "Øvrige opbevaringsfrister:"
    ],
    [
      "ul",
      [
        "scanningshistorik: slettes automatisk 24 måneder efter scanningen",
        "søgehistorik (dine søgeord og de produkter, du valgte): slettes automatisk 12 måneder efter, den er gemt",
        "beskeder i appen: slettes automatisk efter 12 måneder",
        "tekniske hændelser og afsendelseslog for beskeder: slettes automatisk efter 90 dage",
        "tekniske fejllogs: slettes automatisk efter 90 dage og er ikke knyttet til din konto efter en sletning",
        "tællere for dagligt forbrug af tekniske funktioner (beskyttelse mod misbrug): slettes automatisk efter 30 dage og slettes med din konto",
        "e-mailadressen på en person, du har inviteret til din familie: slettes, så snart invitationen er besvaret eller udløbet (invitationen virker højst 24 timer, og oprydningen sker dagligt), og senest når du sletter din konto",
        "feedback og fejlmeldinger sendt uden at være logget ind: slettes automatisk 12 måneder efter, at du sendte dem (sendt som logget ind slettes de med din konto)",
        "sikkerhedsindberetninger (hvis du har oplyst, at en e-mail om nulstilling af adgangskode ikke var fra dig): slettes automatisk efter 12 måneder",
        "logs hos vores leverandører (fx Supabase og Vercel): efter leverandørernes egne standardfrister",
        "sikkerhedskopier: hvis EatSafe tager sikkerhedskopier, udfases slettede oplysninger, når kopierne udløber."
      ]
    ],
    [
      "h2",
      "12. Cookies, lokal lagring og lignende teknologier"
    ],
    [
      "p",
      "EatSafe kan anvende lokal lagring og andre teknologier, der er nødvendige for eksempelvis:"
    ],
    [
      "ul",
      [
        "login-session",
        "sikkerhed",
        "brugerindstillinger",
        "teknisk funktionalitet."
      ]
    ],
    [
      "p",
      "Nødvendige teknologier anvendes kun til at levere den funktion, de er nødvendige for."
    ],
    [
      "p",
      "Hvis EatSafe senere anvender analytics, annoncering, tracking pixels eller andre ikke-nødvendige teknologier, bliver denne politik og EatSafes samtykkeløsning opdateret."
    ],
    [
      "p",
      "Reglerne gælder ikke kun traditionelle cookies, men også apps, enhedsidentifikatorer og lignende teknologier. Teknisk nødvendige teknologier kan anvendes uden cookie-samtykke, mens eksempelvis statistik og personaliseret annoncering som udgangspunkt kræver samtykke."
    ],
    [
      "h2",
      "13. Dine rettigheder"
    ],
    [
      "p",
      "Afhængigt af omstændighederne har du efter databeskyttelsesreglerne blandt andet ret til:"
    ],
    [
      "ul",
      [
        "indsigt i de personoplysninger, vi behandler om dig",
        "berigtigelse af urigtige eller ufuldstændige oplysninger",
        "sletning af personoplysninger, når betingelserne er opfyldt",
        "begrænsning af behandlingen i visse tilfælde",
        "indsigelse mod behandling, der sker på bestemte behandlingsgrundlag",
        "dataportabilitet, når betingelserne er opfyldt",
        "tilbagetrækning af samtykke til enhver tid."
      ]
    ],
    [
      "p",
      "Tilbagetrækning af et samtykke påvirker ikke lovligheden af den behandling, der fandt sted, før samtykket blev trukket tilbage."
    ],
    [
      "p",
      "Du kan administrere en række oplysninger direkte i EatSafe."
    ],
    [
      "p",
      "Kontoen kan slettes via: Menu → Indstillinger → Slet konto (nederst på siden)."
    ],
    [
      "p",
      "Har du oprettet en profil for et barn, udøves barnets rettigheder af den, der har forældremyndigheden, ved henvendelse til os."
    ],
    [
      "p",
      "Hvis du ønsker at gøre brug af en anden rettighed, kan du kontakte:"
    ],
    [
      "p",
      "{mail}"
    ],
    [
      "p",
      "Vi kan bede om nødvendige oplysninger for at sikre, at en anmodning kommer fra den rette person."
    ],
    [
      "h2",
      "14. Sikkerhed"
    ],
    [
      "p",
      "EatSafe anvender tekniske og organisatoriske foranstaltninger med henblik på at beskytte personoplysninger mod blandt andet uautoriseret adgang, tab, ændring eller videregivelse."
    ],
    [
      "p",
      "Ingen internetbaseret tjeneste kan garantere absolut sikkerhed."
    ],
    [
      "h2",
      "15. Klage"
    ],
    [
      "p",
      "Hvis du mener, at EatSafe behandler dine personoplysninger forkert, opfordrer vi dig til først at kontakte os på:"
    ],
    [
      "p",
      "{mail}"
    ],
    [
      "p",
      "Du har også ret til at klage til:"
    ],
    [
      "p",
      "Datatilsynet\n[www.datatilsynet.dk](https://www.datatilsynet.dk)"
    ],
    [
      "h2",
      "16. Ændringer af privatlivspolitikken"
    ],
    [
      "p",
      "Vi kan opdatere denne privatlivspolitik, når EatSafe ændres, når vores behandling af personoplysninger ændres, eller når det er nødvendigt som følge af lovgivningen."
    ],
    [
      "p",
      "Ved væsentlige ændringer informerer vi brugerne på passende måde."
    ],
    [
      "p",
      "Den gældende version vil altid være tilgængelig i EatSafe."
    ],
    [
      "h2",
      "17. Kontakt"
    ],
    [
      "p",
      "Har du spørgsmål om EatSafes behandling af personoplysninger eller ønsker du at gøre brug af dine rettigheder, kan du kontakte:"
    ],
    [
      "p",
      "E-mail: {mail}"
    ]
  ],
  "contactBox": "Spørgsmål til vores behandling af dine oplysninger?\nSkriv til os på {mail}"
};
