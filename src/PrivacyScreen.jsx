// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// PrivacyScreen.jsx — Privatlivspolitik som en almindelig underside i appen.
//
// Se TermsScreen.jsx's filhoved for header-mønsteret (egen sticky
// .legal-topbar i stedet for AppHeader, tilbagepil til legalReturnScreen).
//
// public/privacy.html er en uafhængig kopi af samme tekst (offentlig URL uden
// for appen), ikke en delt kilde — ret begge, hvis politikken ændres.
//
// Åbne, interne punkter i politikken står KUN i admin-ticketen
// "[Privatlivspolitik · IKKE FÆRDIG]" i feedback_tickets — aldrig her, da
// både JS-bundlen og privacy.html er offentligt tilgængelige.
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

export default function PrivacyScreen({ onBack }) {
  return (
    <>
      <header className="legal-topbar">
        <button onClick={onBack} aria-label="Tilbage" className="legal-topbar-back">
          <span className="legal-topbar-back-circle">
            <Icon name="chevronLeft" size={17} color="var(--ink)" />
          </span>
        </button>
        <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Privatlivspolitik</div>
      </header>
      {/* paddingTop matcher .legal-topbar's egen renderede højde (header er
          position:fixed, tager ikke plads i normal flow) + lidt luft. */}
      <div className="screen fade-in" style={{ paddingTop:"calc(75px + env(safe-area-inset-top))" }}>
        <div style={S.updated}>Sidst opdateret: 3. oktober 2026</div>

        <div style={S.draftNotice}>
          Denne side er en foreløbig udgave af EatSafes privatlivspolitik og er endnu ikke juridisk gennemgået. Kontakt <Mail />, hvis du har spørgsmål, indtil den endelige version er på plads.
        </div>

        <p style={S.p}>Denne privatlivspolitik beskriver, hvordan EatSafe behandler personoplysninger, når du opretter en konto og bruger EatSafes funktioner.</p>
        <p style={S.p}>EatSafe behandler kun personoplysninger til relevante og angivne formål. Vi sælger ikke dine personoplysninger.</p>

        <h2 style={S.h2}>1. Hvem er dataansvarlig?</h2>
        <p style={S.p}>Den dataansvarlige for EatSafe er:</p>
        <p style={S.p}>E-mail: <Mail /></p>

        <h2 style={S.h2}>2. Hvilke oplysninger behandler vi?</h2>
        <p style={S.p}>Afhængigt af hvilke funktioner du bruger, kan EatSafe behandle følgende oplysninger:</p>
        <p style={S.p}><strong>Kontooplysninger</strong><br/>Navn, e-mailadresse, alder (fødselsår), køn og andre oplysninger, du giver i forbindelse med oprettelse eller administration af din konto. Alder og køn bruges til at tilpasse tjenesten og forstå, hvem den bruges af.</p>
        <p style={S.p}><strong>Allergier og intolerancer</strong><br/>De allergier, intolerancer og andre helbredsrelaterede oplysninger, du selv registrerer for at få personlige produktkontroller og advarsler, herunder hvordan du ønsker, at spor af et allergen skal behandles.</p>
        <p style={S.p}>Oplysninger om helbred er en særlig kategori af personoplysninger og er underlagt skærpede regler efter GDPR.</p>
        <p style={S.p}><strong>Kostpræferencer</strong><br/>Eksempelvis vegansk, vegetarisk eller andre kosthensyn, du selv vælger.</p>
        <p style={S.p}><strong>E-numre og øvrige fravalg</strong><br/>Oplysninger om tilsætningsstoffer eller andre forhold, som du vælger at holde øje med eller undgå.</p>
        <p style={S.p}><strong>Husstands- og familieoplysninger</strong><br/>Navn, profiloplysninger og eventuelle allergi-, intolerance- eller helbredsoplysninger om personer, der indgår i din EatSafe-husstand.</p>
        <p style={S.p}><strong>Scanningshistorik og favoritter</strong><br/>Produkter og stregkoder, du scanner, gemmer som favorit eller på anden måde interagerer med, hvis de relevante funktioner anvendes.</p>
        <p style={S.p}><strong>Indkøbslister</strong><br/>Produkter og andre oplysninger, som du tilføjer til dine indkøbslister.</p>
        <p style={S.p}><strong>Produktindsendelser</strong><br/>Billeder, stregkoder, ingrediensoplysninger og andre produktoplysninger, som du frivilligt sender til EatSafe.</p>
        <p style={S.p}><strong>Feedback og support</strong><br/>De oplysninger, du sender til os i forbindelse med feedback, fejlmeldinger, support eller anden kontakt.</p>
        <p style={S.p}><strong>Tekniske oplysninger</strong><br/>Nødvendige tekniske oplysninger om brugen af EatSafe, sikkerhed og fejlfinding, eksempelvis tidsstempler, fejlmeddelelser og tekniske logs.</p>

        <h2 style={S.h2}>3. Allergi- og helbredsoplysninger</h2>
        <p style={S.p}>Oplysninger om allergier og visse intolerancer kan være helbredsoplysninger og dermed særlige kategorier af personoplysninger.</p>
        <p style={S.p}>Når EatSafe behandler sådanne oplysninger på baggrund af samtykke, indhenter vi et særskilt og udtrykkeligt samtykke.</p>
        <p style={S.p}>Samtykket skal gives aktivt og særskilt fra accept af EatSafes brugsvilkår og fra det forhold, at du har læst privatlivspolitikken.</p>
        <p style={S.p}>Du kan til enhver tid trække dit samtykke tilbage under Indstillinger → Privatliv & data. Trækker du samtykket tilbage, slettes dine allergi- og helbredsoplysninger, allergener på dine familieprofiler, valg af følsomhed, valgte E-numre, din scanningshistorik og beskeder om ændrede allergener.</p>
        <p style={S.p}>Hvis du trækker dit samtykke tilbage, stopper EatSafe med at behandle de helbredsoplysninger, der er omfattet af samtykket, medmindre der findes et andet lovligt grundlag for en konkret fortsat behandling.</p>
        <p style={S.p}>Funktioner, der kræver en allergi- eller helbredsprofil, vil herefter muligvis ikke kunne anvendes.</p>
        <p style={S.p}>GDPR kræver et udtrykkeligt samtykke, når artikel 9, stk. 2, litra a anvendes som undtagelse til forbuddet mod behandling af følsomme oplysninger. Samtykket skal desuden kunne dokumenteres.</p>

        <h2 style={S.h2}>4. Husstand, familie og oplysninger om andre personer</h2>
        <p style={S.p}>Hvis du opretter oplysninger om en anden person, kan EatSafe behandle personoplysninger, som ikke kommer direkte fra den person, oplysningerne vedrører.</p>
        <p style={S.p}>Voksne husstandsmedlemmer inviteres og skal selv acceptere invitationen, før de indgår i din husstand. Når du inviterer en voksen, indtaster du vedkommendes e-mailadresse, og EatSafe sender en invitationsmail dertil via vores e-mailleverandør. Invitationen er knyttet til den adresse og til et personligt link i mailen, så den kan bruges af den, der modtager mailen, også hvis vedkommende logger ind med en anden adresse eller metode, fx Facebook. Modtageren kan se dit fornavn i mailen og på invitationssiden, før vedkommende har oprettet en konto. Forbindelsen oprettes først, når modtageren selv har bekræftet den i appen. Du kan også invitere uden en e-mailadresse ved at dele et personligt link, fx i en besked. Her kan den, der bruger linket, se dit fornavn, og forbindelsen oprettes først, når både vedkommende og du selv har godkendt den i appen. Profiler, du selv administrerer uden egen konto, er kun til børn under 18 år.</p>
        <p style={S.p}>Når personoplysninger ikke er indsamlet direkte hos den registrerede, kan EatSafe have en informationspligt efter GDPR artikel 14. Informationen skal som udgangspunkt gives inden for rimelig tid og senest inden for én måned, medmindre en relevant undtagelse finder anvendelse.</p>
        <p style={S.p}>Ved oprettelse af en profil for et barn skal den person, der opretter profilen, have ret til at handle på barnets vegne.</p>
        <p style={S.p}>Hvis EatSafe senere tilbyder tjenesten direkte til børn, skal reglerne om børns egne konti og samtykke vurderes særskilt.</p>

        <h2 style={S.h2}>5. Hvad bruger vi oplysningerne til?</h2>
        <p style={S.p}>EatSafe kan bruge oplysningerne til at:</p>
        <ul style={S.ul}>
          <li style={S.li}>oprette og administrere din konto</li>
          <li style={S.li}>gemme dine indstillinger og præferencer</li>
          <li style={S.li}>sammenholde produktoplysninger med dine valgte allergier, intolerancer, kostpræferencer, E-numre og andre valg</li>
          <li style={S.li}>vise personlige produktresultater og advarsler</li>
          <li style={S.li}>levere familie- og husstandsfunktioner</li>
          <li style={S.li}>gemme historik, favoritter og indkøbslister</li>
          <li style={S.li}>behandle produktindsendelser og rettelser</li>
          <li style={S.li}>forbedre kvaliteten af EatSafes produktdata</li>
          <li style={S.li}>sende nødvendige servicebeskeder</li>
          <li style={S.li}>besvare feedback og supporthenvendelser</li>
          <li style={S.li}>forebygge misbrug</li>
          <li style={S.li}>sikre, fejlrette, vedligeholde og forbedre EatSafe.</li>
        </ul>
        <p style={S.p}>EatSafe anvender automatiske sammenligninger mellem produktdata og dine valgte oplysninger.</p>
        <p style={S.p}>Disse sammenligninger anvendes ikke til at træffe automatiske afgørelser, der har juridisk eller tilsvarende væsentlig virkning for dig.</p>

        <h2 style={S.h2}>6. Retsgrundlag</h2>
        <p style={S.p}>Retsgrundlaget afhænger af, hvilke oplysninger der behandles, og til hvilket formål.</p>
        <p style={S.p}><strong>Aftale (GDPR artikel 6, stk. 1, litra b):</strong> oprettelse og drift af din konto og de funktioner, du har bedt om, herunder personlige produktkontroller, profiler, indkøbslister, historik og de beskeder, der er en del af tjenesten.</p>
        <p style={S.p}><strong>Legitim interesse (artikel 6, stk. 1, litra f):</strong> sikkerhed, forebyggelse af misbrug, fejlfinding og drift af tjenesten, behandling af alder og køn med henblik på at forstå, hvem tjenesten bruges af, og forbedring af produktdata. Du har ret til at gøre indsigelse mod behandling, der sker på dette grundlag.</p>
        <p style={S.p}><strong>Retlig forpligtelse (artikel 6, stk. 1, litra c):</strong> når vi skal opbevare eller udlevere oplysninger for at overholde loven, fx for at besvare en anmodning om dine rettigheder.</p>
        <p style={S.p}><strong>Helbredsoplysninger (artikel 9, stk. 2, litra a):</strong> dine allergi- og intoleranceoplysninger og øvrige helbredsrelaterede valg behandles kun på grundlag af dit udtrykkelige samtykke, ud over aftalegrundlaget i artikel 6, stk. 1, litra b. Samtykket gives særskilt, før vi behandler oplysningerne, og du kan til enhver tid trække det tilbage (se afsnit 3).</p>
        <p style={S.p}>Oplysninger om andre personer, som du har registreret på en profil, du administrerer, behandles på samme grundlag, og forudsætter den pågældendes samtykke (se afsnit 4).</p>

        <h2 style={S.h2}>7. E-mails og push-notifikationer</h2>
        <p style={S.p}>EatSafe kan sende beskeder til dig i appen, som push-notifikationer og som e-mail. Beskederne handler om din brug af tjenesten og kan blandt andet vedrøre:</p>
        <ul style={S.ul}>
          <li style={S.li}>din konto og sikkerhed</li>
          <li style={S.li}>din husstand, invitationer og delte lister</li>
          <li style={S.li}>dine produktindsendelser, din feedback og support</li>
          <li style={S.li}>advarsler og oplysninger om produkter, du har gemt eller scannet, fx ændrede allergenoplysninger eller tilbagekaldelser</li>
          <li style={S.li}>funktioner, du selv har anmodet om.</li>
        </ul>
        <p style={S.p}>Push-notifikationer sendes kun, når EatSafe har den nødvendige tilladelse på din enhed. Du kan administrere tilladelsen i EatSafe og/eller i din enheds indstillinger.</p>
        <p style={S.p}>Du kan vælge, hvilke typer beskeder du vil modtage, og om de skal komme som push eller e-mail, under Indstillinger → Notifikationer. EatSafe kan tilføje eller fjerne typer af beskeder, så længe de handler om ovenstående formål.</p>

        <h2 style={S.h2}>8. Produktbilleder og automatisk/AI-baseret analyse</h2>
        <p style={S.p}>EatSafe kan anvende automatiseret billed- og tekstanalyse til eksempelvis at aflæse:</p>
        <ul style={S.ul}>
          <li style={S.li}>ingredienslister</li>
          <li style={S.li}>allergenoplysninger</li>
          <li style={S.li}>produktnavne</li>
          <li style={S.li}>stregkoder</li>
          <li style={S.li}>anden information på produktemballage.</li>
        </ul>
        <p style={S.p}>Når du aktivt anvender en funktion, der analyserer et produktbillede, kan billedet blive sendt til en teknisk leverandør med henblik på analysen.</p>
        <p style={S.p}>EatSafe forsøger at begrænse de oplysninger, der sendes, til det, der er nødvendigt for den relevante funktion.</p>
        <p style={S.p}>Et produktbillede kan imidlertid selv indeholde personoplysninger, hvis sådanne oplysninger er synlige på billedet.</p>
        <p style={S.p}>Hvis EatSafe anvender Anthropic API som kommerciel tjeneste, oplyser Anthropic aktuelt, at deres DPA med SCC’er indgår i Commercial Terms, og at inputs og outputs fra kommercielle produkter som udgangspunkt ikke bruges til modeltræning.</p>

        <h2 style={S.h2}>9. Leverandører og modtagere</h2>
        <p style={S.p}>EatSafe anvender eksterne leverandører til at drive og levere tjenesten.</p>
        <p style={S.p}>Afhængigt af EatSafes aktuelle tekniske opsætning kan disse omfatte:</p>
        <p style={S.p}><strong>Supabase</strong><br/>Anvendes til database, autentificering og relateret backend-infrastruktur.</p>
        <p style={S.p}>Supabases aktuelle DPA beskriver Supabase som databehandler og siger, at data, som kunden instruerer Supabase om at behandle i en bestemt geografisk region, lagres og primært behandles i den region, med visse forbehold. DPA’en indeholder desuden EU-standardkontraktbestemmelser for relevante internationale overførsler.</p>
        <p style={S.p}><strong>Vercel</strong><br/>Anvendes til hosting og levering af EatSafes webbaserede infrastruktur.</p>
        <p style={S.p}>Vercels aktuelle DPA oplyser, at virksomhedens primære behandlingsfaciliteter er i USA, og at data kan behandles internationalt. DPA’en beskriver samtidig mekanismer for lovlige internationale overførsler.</p>
        <p style={S.p}><strong>Anthropic</strong><br/>Kan anvendes til automatisk analyse af produktbilleder og tekst.</p>
        <p style={S.p}><strong>Open Food Facts</strong><br/>Anvendes som ekstern kilde til produktoplysninger og billeder. Disse stammer fra Open Food Facts og dets bidragydere og er udgivet under Open Database License (ODbL), Database Contents License og Creative Commons Attribution-ShareAlike (billeder). Opslag af produktdata sker fra EatSafes server alene med produktets stregkode. Produktbilleder kan hentes direkte fra Open Food Facts’ servere, hvorved din IP-adresse og tekniske enhedsoplysninger kan blive synlige for dem.</p>
        <p style={S.p}><strong>Resend</strong><br/>Anvendes til at sende e-mails fra EatSafe, fx bekræftelse af e-mail, nulstilling af adgangskode, invitationer til familie og beskeder. Resend modtager din e-mailadresse, dit navn og beskedens indhold.</p>
        <p style={S.p}><strong>Google og Facebook</strong><br/>Hvis du vælger at logge ind med din Google- eller Facebook-konto, modtager vi dit navn og din e-mailadresse fra udbyderen.</p>
        <p style={S.p}><strong>Push-tjenester</strong><br/>Push-notifikationer leveres via din browser- eller enhedsleverandørs push-tjeneste (fx Apple, Google eller Mozilla).</p>

        <h2 style={S.h2}>10. Overførsel af oplysninger uden for EU/EØS</h2>
        <p style={S.p}>Nogle af EatSafes leverandører eller deres underdatabehandlere kan behandle personoplysninger uden for EU/EØS.</p>
        <p style={S.p}>Når personoplysninger overføres til et tredjeland, anvendes et relevant lovligt overførselsgrundlag, hvor dette er nødvendigt, eksempelvis:</p>
        <ul style={S.ul}>
          <li style={S.li}>en EU-afgørelse om tilstrækkeligt beskyttelsesniveau</li>
          <li style={S.li}>EU-U.S. Data Privacy Framework, hvor betingelserne er opfyldt</li>
          <li style={S.li}>EU-Kommissionens standardkontraktbestemmelser</li>
          <li style={S.li}>andre lovlige overførselsmekanismer efter databeskyttelsesreglerne.</li>
        </ul>
        <p style={S.p}>Du kan kontakte os på <Mail />, hvis du ønsker yderligere oplysninger om relevante overførsler og garantier.</p>

        <h2 style={S.h2}>11. Hvor længe opbevarer vi oplysninger?</h2>
        <p style={S.p}>EatSafe opbevarer ikke personoplysninger længere end nødvendigt til de formål, de blev indsamlet til.</p>
        <p style={S.p}>Kontodata og aktive profiloplysninger opbevares som udgangspunkt, mens din konto er aktiv.</p>
        <p style={S.p}>Hvis du trækker et samtykke til behandling af helbredsoplysninger tilbage, håndteres de pågældende oplysninger i overensstemmelse med den relevante sletteprocedure.</p>
        <p style={S.p}>Når du sletter din konto (Indstillinger → Slet konto), slettes din profil, dine allergi- og helbredsoplysninger, familieprofiler, indkøbslister, scanningshistorik, favoritter, beskeder, tilmeldinger til push, feedback og produktindsendelser samt selve loginkontoen straks. Et produkt, du har indsendt, og som er blevet godkendt og indgår i EatSafes produktdatabase, forbliver som produktoplysninger.</p>
        <p style={S.p}>Øvrige opbevaringsfrister:</p>
        <ul style={S.ul}>
          <li style={S.li}>beskeder i appen: slettes automatisk efter 12 måneder</li>
          <li style={S.li}>tekniske hændelser og afsendelseslog for beskeder: slettes automatisk efter 90 dage</li>
          <li style={S.li}>tekniske fejllogs: slettes automatisk efter 90 dage og er ikke knyttet til din konto efter en sletning</li>
          <li style={S.li}>e-mailadressen på en person, du har inviteret til din familie: slettes, så snart invitationen er besvaret eller udløbet (invitationen virker højst 24 timer, og oprydningen sker dagligt), og senest når du sletter din konto</li>
          <li style={S.li}>sikkerhedsindberetninger (hvis du har oplyst, at en e-mail om nulstilling af adgangskode ikke var fra dig): slettes automatisk efter 12 måneder</li>
          <li style={S.li}>logs hos vores leverandører (fx Supabase og Vercel): efter leverandørernes egne standardfrister</li>
          <li style={S.li}>sikkerhedskopier: hvis EatSafe tager sikkerhedskopier, udfases slettede oplysninger, når kopierne udløber.</li>
        </ul>

        <h2 style={S.h2}>12. Cookies, lokal lagring og lignende teknologier</h2>
        <p style={S.p}>EatSafe kan anvende lokal lagring og andre teknologier, der er nødvendige for eksempelvis:</p>
        <ul style={S.ul}>
          <li style={S.li}>login-session</li>
          <li style={S.li}>sikkerhed</li>
          <li style={S.li}>brugerindstillinger</li>
          <li style={S.li}>teknisk funktionalitet.</li>
        </ul>
        <p style={S.p}>Nødvendige teknologier anvendes kun til at levere den funktion, de er nødvendige for.</p>
        <p style={S.p}>Hvis EatSafe senere anvender analytics, annoncering, tracking pixels eller andre ikke-nødvendige teknologier, bliver denne politik og EatSafes samtykkeløsning opdateret.</p>
        <p style={S.p}>Reglerne gælder ikke kun traditionelle cookies, men også apps, enhedsidentifikatorer og lignende teknologier. Teknisk nødvendige teknologier kan anvendes uden cookie-samtykke, mens eksempelvis statistik og personaliseret annoncering som udgangspunkt kræver samtykke.</p>

        <h2 style={S.h2}>13. Dine rettigheder</h2>
        <p style={S.p}>Afhængigt af omstændighederne har du efter databeskyttelsesreglerne blandt andet ret til:</p>
        <ul style={S.ul}>
          <li style={S.li}>indsigt i de personoplysninger, vi behandler om dig</li>
          <li style={S.li}>berigtigelse af urigtige eller ufuldstændige oplysninger</li>
          <li style={S.li}>sletning af personoplysninger, når betingelserne er opfyldt</li>
          <li style={S.li}>begrænsning af behandlingen i visse tilfælde</li>
          <li style={S.li}>indsigelse mod behandling, der sker på bestemte behandlingsgrundlag</li>
          <li style={S.li}>dataportabilitet, når betingelserne er opfyldt</li>
          <li style={S.li}>tilbagetrækning af samtykke til enhver tid.</li>
        </ul>
        <p style={S.p}>Tilbagetrækning af et samtykke påvirker ikke lovligheden af den behandling, der fandt sted, før samtykket blev trukket tilbage.</p>
        <p style={S.p}>Du kan administrere en række oplysninger direkte i EatSafe.</p>
        <p style={S.p}>Kontoen kan slettes via: Menu → Indstillinger → Slet konto (nederst på siden).</p>
        <p style={S.p}>Har du oprettet en profil for et barn, udøves barnets rettigheder af den, der har forældremyndigheden, ved henvendelse til os.</p>
        <p style={S.p}>Hvis du ønsker at gøre brug af en anden rettighed, kan du kontakte:</p>
        <p style={S.p}><Mail /></p>
        <p style={S.p}>Vi kan bede om nødvendige oplysninger for at sikre, at en anmodning kommer fra den rette person.</p>

        <h2 style={S.h2}>14. Sikkerhed</h2>
        <p style={S.p}>EatSafe anvender tekniske og organisatoriske foranstaltninger med henblik på at beskytte personoplysninger mod blandt andet uautoriseret adgang, tab, ændring eller videregivelse.</p>
        <p style={S.p}>Ingen internetbaseret tjeneste kan garantere absolut sikkerhed.</p>

        <h2 style={S.h2}>15. Klage</h2>
        <p style={S.p}>Hvis du mener, at EatSafe behandler dine personoplysninger forkert, opfordrer vi dig til først at kontakte os på:</p>
        <p style={S.p}><Mail /></p>
        <p style={S.p}>Du har også ret til at klage til:</p>
        <p style={S.p}>Datatilsynet<br/><a href="https://www.datatilsynet.dk" target="_blank" rel="noopener noreferrer" style={S.a}>www.datatilsynet.dk</a></p>

        <h2 style={S.h2}>16. Ændringer af privatlivspolitikken</h2>
        <p style={S.p}>Vi kan opdatere denne privatlivspolitik, når EatSafe ændres, når vores behandling af personoplysninger ændres, eller når det er nødvendigt som følge af lovgivningen.</p>
        <p style={S.p}>Ved væsentlige ændringer informerer vi brugerne på passende måde.</p>
        <p style={S.p}>Den gældende version vil altid være tilgængelig i EatSafe.</p>

        <h2 style={S.h2}>17. Kontakt</h2>
        <p style={S.p}>Har du spørgsmål om EatSafes behandling af personoplysninger eller ønsker du at gøre brug af dine rettigheder, kan du kontakte:</p>
        <p style={S.p}>E-mail: <Mail /></p>

        <div style={S.contactBox}>
          <p style={{ margin:0, fontSize:13.5, color:"var(--ink2)", lineHeight:1.55 }}>
            Spørgsmål til vores behandling af dine oplysninger?<br/>
            Skriv til os på <Mail />
          </p>
        </div>
      </div>
    </>
  );
}
