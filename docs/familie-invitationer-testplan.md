# Familie-invitationer: testplan

Gælder begge måder at invitere på: **mail** til en adresse og **delt link** med afsenderens godkendelse. Planen skal køres, før vi
siger, at invitationer virker hele vejen rundt, og igen efter hver ændring af `family-invite`, `family_invites`-funktionerne,
`invite.html`, `useFamilyInviteInbox`, `useFamilyLinkRequests`, `useIncomingLinks` eller mailen N9.

Notation: **A** = afsender (inviterer), **M** = modtager, **✔** = skal virke, **✘** = skal afvises.

## 0. Forberedelse
- To rigtige telefoner (helst én iPhone og én Android) og mindst tre konti: A, M1 (e-mail + adgangskode) og M2 (Google). Gerne en Facebook-konto.
- Testmail sendes kun til Jans/Bjørns egne adresser (CLAUDE.md §0). Opret ikke flere konti end nødvendigt, og slet dem bagefter.
- Kør først databasetesten (afsnit 1). Fejler den, så stop her.

## 1. Automatiske test (kør altid først)
| Hvad | Hvordan | Forventet |
|---|---|---|
| Enheds- og logiktest | `npx vitest run` | Alle grønne (bl.a. `familyInvite.test.js`, `inviteMail.test.js`, `familyInviteInbox.test.js`, `mailDarkMode.test.js`) |
| Databasen, 33 kontroller (M1-M14, L1-L16, O1, P1, P2) | Kør `docs/familie-invitationer-test.sql` i Supabase SQL Editor | Fejler med `TEST_RESULTAT ... Antal FEJL: 0`. Alt rulles tilbage |

Databasetesten dækker: e-mail-match, anden e-mail, token-vejen, udløb, accept/afvis, dobbelt brug, afsenderens egen invitation, delt link
(anmodning, låsning, tredje person, godkend, afvis, udløb), oprydning af e-mail og rettigheder (herunder at klienten ikke kan oprette invitationer direkte).

## 2. Afsenderen opretter (mail)
| # | Handling | Forventet |
|---|---|---|
| A1 | Familie → Invitér til familien → fanen "Send på mail", skriv en adresse uden konto | ✔ Mailen kommer frem (tjek spam), emne "<Fornavn> har inviteret dig til sin familie i EatSafe", teksten "Sådan gør du" (ny bruger) |
| A2 | Samme, men en adresse med en eksisterende konto | ✔ Mailen siger "Du har allerede en EatSafe-konto". Afsenderen ser samme besked som i A1 (afslører ikke, om adressen har en konto) |
| A3 | Ugyldig adresse (`abc`, `a@b`, `søren@…`) | ✘ "Indtast en gyldig e-mailadresse." |
| A4 | Din egen adresse | ✘ "Det er din egen e-mailadresse…" |
| A5 | En adresse, du allerede er forbundet med | ✘ "I er allerede forbundet i familien." |
| A6 | Samme adresse to gange, mens første er åben | ✘ "Du har allerede sendt en invitation…" |
| A7 | 11 invitationer (mail og links) inden for et døgn | ✘ Den 11. giver "Du har sendt mange invitationer i dag." |
| A8 | "Send igen" straks efter | ✘ "Vent lidt, før du sender den igen" (30 min. pause) |
| A9 | "Send igen" efter 30 min. | ✔ Ny mail |
| A10 | "Annuller invitation" | ✔ Forsvinder fra oversigten. Linket i mailen viser "Denne invitation findes ikke" |
| A11 | Mailen i Gmail (app og web), Apple Mail og Outlook, lys og mørk tilstand | ✔ Læsbar, knappen er grøn, logoet skifter |

## 3. Modtageren: mail-invitation
Kør hver række på den nævnte kombination. "Sheet" = "Invitation til familien" med "Ja, forbind os" / "Nej tak".

| # | Modtager og vej | Forventet |
|---|---|---|
| R1 | Ny bruger, e-mail + adgangskode, **samme adresse**: åbn mailen i Chrome (Android), opret konto, bekræft e-mail, gennemfør onboarding | ✔ Sheet vises efter onboarding. "Ja" → forbundet. A ser M under Familie |
| R2 | Som R1, men i Safari (iPhone) | ✔ som R1 |
| R3 | Som R1, men i Samsung Internet | ✔ som R1 |
| R4 | Som R1, men i Firefox og Edge | ✔ som R1 |
| R5 | Ny bruger med Google, samme adresse | ✔ Sheet efter onboarding |
| R6 | Ny bruger med Facebook (anden adresse eller ingen adresse) og linket fra mailen | ✔ Sheet vises (token-vejen). "Ja" → forbundet |
| R7 | Eksisterende bruger, appen lukket, logger ind | ✔ Sheet ved login |
| R8 | Eksisterende bruger, appen åben i baggrunden, invitationen sendes nu | ✔ Sheet, når appen kommer i forgrunden |
| R9 | Linket åbnes i browser A, login sker i browser B (samme e-mail) | ✔ Sheet vises i B (e-mail-match, ingen token nødvendig) |
| R10 | Linket åbnes i browser A, login i browser B med **anden** e-mail eller Facebook | ✘ Ingen sheet i B (forventet). Åbn mailens link i B igen → ✔ sheet |
| R11 | Linket åbnes i Messenger/Instagram/Googles app-browser | ✔ Advarsel "Åbn invitationen i din browser" og "Kopiér link". Fuldfør i rigtig browser |
| R12 | Konto, hvis e-mail ikke er bekræftet | ✘ Ingen sheet, før e-mailen er bekræftet |
| R13 | Midt i onboarding | ✘ Ingen sheet, før onboarding er færdig. Token overlever lukning af appen |
| R14 | Installeret app (PWA) i stedet for browser | ✔ Sheet vises også dér |
| R15 | "Nej tak" | ✔ Invitationen er væk hos A. M er ikke forbundet. Linket virker ikke mere |
| R16 | Luk sheetet (X) eller Escape | ✔ Intet afgøres. Sheetet kommer igen næste gang appen åbnes |
| R17 | To invitationer fra to afsendere på samme tid | ✔ Sheets vises efter hinanden |
| R18 | Invitationen er over 24 timer gammel | ✘ `invite.html` siger "Invitationen er udløbet". Intet sheet |
| R19 | Linket åbnes efter accept | ✘ "Denne invitation er allerede brugt" |
| R20 | A åbner sit eget link | ✘ Intet sheet |
| R21 | Efter accept: A får N5 ("invitation accepteret") som besked i appen, og push/mail hvis slået til | ✔ |
| R22 | Efter accept: M ser A, og A ser M under Familie (begge sider) og kan afslutte forbindelsen | ✔ |

## 4. Delt link med godkendelse
| # | Handling | Forventet |
|---|---|---|
| L1 | A: fanen "Del et link" → Opret link → Del linket / Kopiér link | ✔ Linket kopieres/deles (`eatsafe.dk/invite/…`). Står i oversigten som "Delt link" med Del/Kopiér/Annuller |
| L2 | M (ny bruger, e-mail) følger linket → opretter sig → sheet "Ja, send anmodning" | ✔ Toast "Anmodningen er sendt…". M er IKKE forbundet |
| L3 | A åbner appen (eller har den åben) | ✔ Sheet "Godkend forbindelse" med M's fornavn, senest efter 30 sek. |
| L4 | A trykker Godkend | ✔ Forbundet. A og M ser hinanden. N5 sendes til A |
| L5 | A trykker Afvis | ✔ M er ikke forbundet. Linket virker ikke mere |
| L6 | A lukker godkendelsessheetet (X) | ✔ Intet afgøres, sheetet kommer igen ved næste åbning |
| L7 | Samme link som L2, men M logger ind med Facebook | ✔ som L2 |
| L8 | M2 følger samme link, efter M1 har bedt om det | ✘ Ingen forbindelse (se kendt hul 2: M2 får ingen besked) |
| L9 | M1 følger linket igen efter at have bedt om det | ✔ Ingen dublet |
| L10 | Linket åbnes i app-browser (Messenger) | ✔ Advarsel, og kopiér-knap |
| L11 | Linket er over 24 timer gammelt og ingen har bedt om det | ✘ "Invitationen er udløbet" |
| L12 | M bad om det, A godkender mere end 24 timer senere | ✔ Udløbet forlænges til 24 t fra anmodningen, så en sen godkendelse virker |
| L13 | A annullerer linket, efter M har bedt om det | ✔ Ingen forbindelse. M får ingen besked (se kendt hul 1) |
| L14 | A forsøger at bruge sit eget link | ✘ Ingen anmodning |
| L15 | Mail- og linkinvitationer sammen tæller mod grænsen på 10 pr. døgn | ✔ |

## 5. Tværgående
| # | Hvad | Forventet |
|---|---|---|
| T1 | Privatliv: mail-invitationens `invitee_email` | Nulstilles ved accept/afvis. Udløbne nulstilles af cron `family-invite-email-cleanup` kl. 03:40 UTC (tjek dagen efter) |
| T2 | Kontosletning, afsender | Invitationer slettes med kontoen |
| T3 | Kontosletning, den der har bedt om et delt link | `requested_by` nulstilles. Linket kan bruges af en anden (til udløb) |
| T4 | Rettigheder | Anonyme kan ikke kalde RPC'erne. Klienten kan ikke indsætte i `family_invites` (testet i SQL-scriptet, P1/P2) |
| T5 | `invite.html` alle tilstande: gyldig mail, gyldig delt link, udløbet, brugt, findes ikke, netværksfejl | ✔ Rigtig tekst. Maskeret adresse vises kun for mail-invitationer |
| T6 | `invite.html` installationsråd: Safari, Samsung Internet, Firefox, Edge, Opera, Chrome | ✔ Eget råd pr. browser. Skjules i installeret app |
| T7 | P2 (invitation udløber snart, 4 t før): mail og push | ✔ Ny tekst. Se kendt hul 3 for delte links |
| T8 | Vilkår og privatlivspolitik | Teksten om invitationer (afsnit 4, 7, 11) passer og viser "Sidst opdateret: 3. oktober 2026" |
| T9 | Tilgængelighed: sheetene med skærmlæser/tastatur | Fokus i sheetet, Escape lukker (= "senere"), knapper har tekst |

## 6. Kendte huller (forventes at fejle, indtil de er rettet)
1. **M får ingen besked, når A godkender, afviser eller annullerer et delt link.** M ser først forbindelsen ved næste besøg på Familie (opdateres hvert 12. sek. dér). Overvej en besked/notifikationstype.
2. **En anden person med et allerede låst delt link får ingen forklaring** (tokenet ryddes stille). `invite.html` kender ikke til låsningen.
3. **P2-teksten taler om "invitationsmailen"**, også for delte links, hvor der ikke findes en mail. Linkinvitationer bør have egen tekst ("del linket igen").
4. **A får ingen push eller mail, når nogen har bedt om et delt link**, kun sheetet ved næste åbning (maks. 30 sek. når appen er åben).
5. **Linket i mailen virker kun i den browser, hvor tokenet blev gemt**, når modtageren bruger en anden e-mail end den inviterede. E-mail-match dækker de øvrige tilfælde.

## 7. Resultater
Noter dato, hvem der testede, enheder og fund her eller som tickets. Opret et ticket for hvert ✘, der ikke er forventet.

| Dato | Test | Enhed/browser | Resultat |
|---|---|---|---|
| 3. okt. 2026 | Databasetest (33 kontroller) | Supabase | 0 FEJL |
