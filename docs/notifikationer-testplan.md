# Testplan: notifikationer på rigtige telefoner

Til Jan og Bjørn. Formål: bevise, at push, beskedside og mail virker, **før** de globale flag tændes for rigtige brugere.
Status pr. 30. sept. 2026: alt er bygget og deployet, men `notifications_push_enabled` og `notifications_email_enabled` er begge FRA, og der er sendt hverken rigtige push eller mails.

## 0. Sådan testes uden at ramme rigtige brugere

Der findes en **testliste** (`app_flags.notifications_test_users`). Står en konto på listen, får den push og mail, selvom de globale flag er FRA. Alle andre får intet.

- **Testkonto:** `janfogde+eatsafeqa@gmail.com` (admin, id `9ae4ac4c-8cb0-489e-b31b-13bec0f77fd3`). Brug den på begge telefoner.
- **Ny-bruger-test (N1):** en frisk alias-adresse, fx `janfogde+test1@gmail.com`. Den skal også på testlisten *før* onboarding gennemføres.
- **Claude sætter testlisten** ("sæt testlisten til QA-kontoen") og **rydder den bagefter** ("ryd testlisten"). Claude kan også fremprovokere en hændelse direkte ("send testhændelse P3 til QA"), hvis den rigtige vej er besværlig.
- Mail til `janfogde+…@gmail.com` lander i Jans indbakke. Ingen andre modtager noget.

**Telefoner**
| | iPhone | Android |
|---|---|---|
| Åbn | Safari → www.eatsafe.dk → Del → *Føj til hjemmeskærm* → åbn fra ikonet | Chrome → www.eatsafe.dk → *Installer app* |
| Push kræver | installeret app + tilladelse | tilladelse |
| Tjek | Indstillinger → Notifikationer: push slået til for kategorierne | samme |

## 1. Beskedsiden (kræver hverken flag eller testliste)

Beskeden oprettes altid, også uden push/mail. Udløs en hændelse (fx afvis en indsendelse i adminpanelet) og tjek:

- [ ] Menu → **Beskeder** viser beskeden med tid og ulæst-markering; menupunktet viser "N ulæste".
- [ ] Åbn beskeden: fuld tekst, ingen mailfooter/afmelding/hilsen, knap med konkret tekst ("Se produktet", "Se din feedback" …).
- [ ] Efter visning er beskeden **læst** (og tælleren falder). Åbnes den ikke, forbliver den ulæst.
- [ ] Afvisning (N3) viser **begrundelsen først**. En afvisning uden begrundelse kan ikke sendes fra adminpanelet.
- [ ] Tilbage-knappen fører til oversigten.
- [ ] Åbn `https://www.eatsafe.dk/?notification=<id>` **logget ud** → login → beskeden åbner efter login.
- [ ] Åbn samme link **logget ind som en anden konto** → neutral "Beskeden er ikke længere tilgængelig" + "Log ind med en anden konto"; indholdet vises ikke.
- [ ] Ugyldigt id (`?notification=abc`) → ingen fejl, almindelig forside.
- [ ] Flytilstand: åbn en besked uden net → "kunne ikke hentes" + *Prøv igen*.
- [ ] Log ud og ind med anden konto: den forrige kontos beskeder er ikke synlige.

## 2. Push (QA-kontoen på testlisten)

For hver variant: (a) appen **lukket**, (b) appen **åben**, (c) appen i **baggrunden**. Tjek at teksten er kort, at klik åbner **den konkrete besked** (ikke forsiden), og at ingen fejl vises.

| Variant | Sådan udløses | Forventet push-tekst (titel) |
|---|---|---|
| N2a Produkt godkendt | QA indsender nyt produkt → admin godkender | Dit produkt er godkendt |
| N2b Rettelse godkendt | QA foreslår rettelse → admin godkender | Din rettelse er godkendt |
| N3 Afvist | Admin afviser med begrundelse | Din indsendelse er ikke godkendt |
| N4 Produkt tilføjet | QA scanner ukendt EAN, andre indsender/godkender samme EAN | Produktet findes nu i EatSafe |
| N5 Invitation accepteret | Anden konto accepterer QA's invitation | Din invitation er accepteret |
| N6 ×4 Feedback | QA sender feedback → admin sætter *I gang* / *Løst* / *Åben igen* / skriver svar | Vi arbejder … / løst / åbnet igen / Nyt svar |
| P2 Invitation udløber | QA-invitation med højst 4 timer tilbage (Claude kan sætte udløbstid) | Din invitation udløber snart |
| P1 Ændrede allergener | Claude hæver et allergen på et produkt, QA har som favorit og har som allergi (10 min forsinkelse) | Allergenoplysninger er ændret |
| P6 Tilbagekaldelse | Claude opretter en testtilbagekaldelse for et produkt, QA har scannet | Et produkt er tilbagekaldt |
| P3 Delt liste ×2 | Anden konto tilføjer 1 vare / flere til en liste delt med QA | Jeres indkøbsliste er opdateret |

Ikke bygget: N7 opskrifter (opskrifter er på pause). P5 er droppet.

Fælles krav:
- [ ] Push kommer **efter** at beskeden findes (klik åbner den aldrig som "ikke tilgængelig").
- [ ] Ingen dublet, selv ved flere enheder/genforsøg.
- [ ] **P1:** kun allergener fra QA's egen profil står i beskeden; push nævner ingen allergennavne; faldende risiko giver ingen besked.
- [ ] **P6:** beskeden viser årsag, berørte partier og et link, der åbner Fødevarestyrelsens side; produktknappen åbner produktet. Testtilbagekaldelsen slettes bagefter.
- [ ] **P3:** højst én besked pr. 30 min pr. liste; varenavne står **ikke** i pushen (kun i appen).
- [ ] **P2:** efter at invitationen er accepteret/udløbet, ses forklaringen, men **ingen aktiv knap**.
- [ ] Slår QA kategorien fra i Indstillinger → ingen push. Slår QA *både* push og mail fra → **ingen besked overhovedet**.
- [ ] Ingen fast vibration; lyd/vibration følger telefonens egne indstillinger. Intet manglende ikon/badge.
- [ ] iPhone: virker kun fra den installerede app (ikke fra Safari-fane).

## 3. Mail (QA-kontoen på testlisten)

Samme hændelser som i afsnit 2. Læs mailen på **iPhone Mail, Gmail-app og web** (lys og mørk tilstand).

- [ ] Emne, preheader og indhold svarer til den godkendte mail; navn og produktnavn er udfyldt (ingen `{{{…}}}`).
- [ ] Teksten svarer til beskeden i appen (samme begrundelse, samme svar).
- [ ] Logo, knap og mørk tilstand ser rigtige ud; ingen afmeldingslink kræves, men footer forklarer *hvorfor* og hvor man slår det fra.
- [ ] **Kun én mail pr. hændelse.** Ingen gammel mail ved siden af (de gamle triggere er slået fra for testkontoen).
- [ ] Værdier med `<`, `&`, `"` (fx produktnavn `Ben & Jerry's <b>`) vises som tekst, ikke som HTML.
- [ ] **N1 Velkomst:** ny alias-konto på testlisten → opret → bekræft e-mail (kommer ikke velkomst endnu) → gennemfør onboarding → **én** velkomstmail. Log ud/ind og gå gennem onboarding igen: ingen ny mail.
- [ ] **P4 Slettekvittering:** slet en tom testkonto på testlisten → mail kommer *efter* sletningen med tidspunkt; kontoen kan ikke længere logge ind.
- [ ] Skabelonerne i Resend er uændret bagefter (ingen har redigeret dem i den visuelle editor).

## 4. Fejl og kanttilfælde

- [ ] Slettet besked/ticket/invitation → neutral besked, ingen crash.
- [ ] "Se din feedback" viser tilbagemelding, status og teamets svar; anden kontos ticket kan ikke åbnes.
- [ ] Afvis flere indsendelser på én gang (bulk): der spørges om **én** begrundelse, som sendes til alle.
- [ ] Tjek admin → Fejl: ingen nye `edge:notify`-fejl efter testen.

## 5. Klar til at tænde for alle?

Alle skal være sat, før Jan siger "tænd":
- [ ] Afsnit 1, 2 og 3 gennemført på **både iPhone og Android**.
- [ ] Ingen åbne fejl i admin → Fejl.
- [ ] Bjørn har set beskedsiden og et par mails og godkendt udseendet.
- [ ] Tekst til brugerne om, at der nu kommer beskeder (valgfrit).
- [ ] Beslutning: tænd push og mail samtidig, eller kun push først?

Go-live gør Claude på Jans ord: `notifications_push_enabled` og `notifications_email_enabled` → TIL, testlisten ryddes. Det kan rulles tilbage ved at sætte dem FRA igen (beskeder i appen påvirkes ikke).
