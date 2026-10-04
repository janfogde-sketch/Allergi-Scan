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
| Enheds- og logiktest, inkl. appens hooks og sheets i jsdom (46 tests i `familyInvitesFlow.test.jsx`) | `npx vitest run` | Alle grønne (903 pr. 4. okt.) |
| Databasen, 48 kontroller (M1-M14, L1-L16, S1-S9, E1-E6, O1, P1, P2) | Kør `docs/familie-invitationer-test.sql` i Supabase SQL Editor | Fejler med `TEST_RESULTAT ... Antal FEJL: 0`. Alt rulles tilbage. E4 og E5 (annullering, `delete`-udløberen) kan kun køres i SQL Editor, ikke via Claude-værktøjet |
| Invitationssiden i browser, 774 kontroller: 28 enheder/browserstrenge (iPhone, iPad, Android, Samsung, Firefox, Edge, Opera, computer, 10 app-browsere) × tilstande, kopiér-knap, installationsråd, vandret scroll, konsolfejl | `node scripts/e2e/invite-page.mjs` | `774/774 kontroller OK` |
| Appens routing for invitationslinks, 72 kontroller (6 browserstrenge × 4 links × 3 første besøg) | `npm run build && npx vite preview --port 4174`, derefter `node scripts/e2e/app-invite.mjs` | `72/72 OK` |

**Begrænsning:** browsertestene kører kun i Chromium. Safari, Firefox og Samsung Internet er EMULERET med browserstreng, skærmstørrelse og
berøring, ikke med de rigtige motorer. Rigtige enheder, mailklienter, push til en rigtig telefon og Google-/Facebook-login kræver manuel test
(afsnit 2-5).

Databasetesten dækker: e-mail-match, anden e-mail, token-vejen, udløb, accept/afvis, dobbelt brug, afsenderens egen invitation, delt link
(anmodning, låsning, tredje person, godkend, afvis, udløb), linkets status, notifikationshændelser (anmodning, godkendelse, afvisning, annullering),
oprydning af e-mail og rettigheder (herunder at klienten ikke kan oprette invitationer direkte).

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
| R10 | Linket åbnes i browser A, login i browser B med **anden** e-mail eller Facebook | ✘ Ingen sheet i B af sig selv (forventet). I B: Familie → "Har du fået et invitationslink?" → indsæt linket → ✔ sheet. Alternativt åbn mailens link i B |
| R23 | Første besøg på invitationslinket (ny browser, service workeren genindlæser siden) | ✔ Brugeren lander på oprettelse/login, ikke på velkomstsiden (rettet 4. okt., `recentInviteLinkFollowed`) |
| R24 | "Har du fået et invitationslink?": indsæt et gyldigt link, et forkert link og tom tekst | ✔ Gyldigt: sheet vises med det samme. Forkert: "Det ligner ikke et invitationslink…". Tom: knappen er slået fra |
| R25 | Et link, der ikke kan bruges (brugt, udløbet, trukket tilbage, låst, ukendt) følges, mens man er logget ind | ✔ En tydelig besked, ikke en stille forsvinden. Tokenet ryddes |
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
| L3 | A åbner appen (eller har den åben) | ✔ Push og besked i appen "Anmodning om forbindelse" (N10, kun push, ingen mail). Sheet "Godkend forbindelse" med M's fornavn, senest efter 30 sek. |
| L4 | A trykker Godkend | ✔ Forbundet. A og M ser hinanden. M får push/besked "Du er nu i en familie" (N11, godkendt). A får IKKE N5 om sin egen godkendelse |
| L5 | A trykker Afvis | ✔ M er ikke forbundet. Linket virker ikke mere. M får push/besked "Anmodningen blev ikke godkendt" (N11, afvist) |
| L6 | A lukker godkendelsessheetet (X) | ✔ Intet afgøres, sheetet kommer igen ved næste åbning |
| L7 | Samme link som L2, men M logger ind med Facebook | ✔ som L2 |
| L8 | M2 følger samme link, efter M1 har bedt om det | ✘ Ingen forbindelse. M2 får en besked: "Linket er allerede brugt af en anden…", og `invite.html` siger "Linket er allerede brugt" |
| L9 | M1 følger linket igen efter at have bedt om det | ✔ Ingen dublet |
| L10 | Linket åbnes i app-browser (Messenger) | ✔ Advarsel, og kopiér-knap |
| L11 | Linket er over 24 timer gammelt og ingen har bedt om det | ✘ "Invitationen er udløbet" |
| L12 | M bad om det, A godkender mere end 24 timer senere | ✔ Udløbet forlænges til 24 t fra anmodningen, så en sen godkendelse virker |
| L13 | A annullerer linket, efter M har bedt om det | ✔ Ingen forbindelse. M får push/besked "Anmodningen blev ikke godkendt" |
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
| T7 | P2 (invitation udløber snart, 4 t før): mail, push og besked i appen, for både mail-invitation og delt link | ✔ Teksten passer til begge ("Har du sendt invitationen som mail… Har du delt et link…") |
| T10 | Notifikationsindstillinger → Familieinvitationer | Beskrivelsen: "Svar på dine invitationer og anmodninger om at blive forbundet". N10/N11 følger kategoriens push-/besked-valg. De har ingen mail |
| T11 | Afsenderens konto slettes, efter at nogen har bedt om et delt link | Ingen besked sendes til den, der bad (afsenderen findes ikke mere) |
| T8 | Vilkår og privatlivspolitik | Teksten om invitationer (afsnit 4, 7, 11) passer og viser "Sidst opdateret: 3. oktober 2026" |
| T9 | Tilgængelighed: sheetene med skærmlæser/tastatur | Fokus i sheetet, Escape lukker (= "senere"), knapper har tekst |

## 6. Huller fundet i planlægningen, rettet 4. okt. 2026
1. ~~M fik ingen besked, når A godkender, afviser eller annullerer et delt link.~~ Rettet: N11 (godkendt/afvist) som push og besked i appen, via `family_invite_accepted` (kind=link) og udløberen `trg_notify_link_declined` (afvisning og annullering).
2. ~~En anden med et låst delt link fik ingen forklaring.~~ Rettet: `get_family_invite_link_status` og en tydelig besked i appen; `invite.html` viser "Linket er allerede brugt" og "Invitationen er trukket tilbage".
3. ~~P2-teksten talte om invitationsmailen for delte links.~~ Rettet: teksten dækker både mail og delt link (også Resend-skabelonen, når den er opdateret).
4. ~~A fik ingen push om en anmodning.~~ Rettet: N10 til afsenderen, første gang nogen beder om forbindelse (ingen dublet ved gentagelse).
5. ~~Mailens link virkede kun i den browser, hvor tokenet blev gemt.~~ Rettet: "Har du fået et invitationslink?" under Familie, hvor linket kan indsættes i den browser, man er logget ind i.

Også rettet undervejs: iPad (Safari fremstår som en Mac) fik Android-råd, computere fik Android-tekst, første besøg på et invitationslink endte på velkomstsiden i stedet for oprettelsen, og mailen lovede "automatisk" kobling, selv om brugeren selv skal sige ja.

**Kendte begrænsninger, ikke huller:** N10/N11 har ingen mail (kun push og besked i appen). Linket i mailen kan bruges af alle, der har mailen (enkelt-brug, 24 t, kræver altid eget ja og, for delte links, afsenderens godkendelse). `?join-list=` (delt indkøbsliste) har samme første-besøg-genindlæsning, som invitationer havde; den er ikke rettet her.

## 7. Resultater
Noter dato, hvem der testede, enheder og fund her eller som tickets. Opret et ticket for hvert ✘, der ikke er forventet.

| Dato | Test | Enhed/browser | Resultat |
|---|---|---|---|
| 3. okt. 2026 | Databasetest (33 kontroller) | Supabase | 0 FEJL |
| 4. okt. 2026 | Databasetest, udvidet (13 af 15 nye: S1-S9, E1-E3, E6; E4/E5 kræver SQL Editor) | Supabase | 0 FEJL |
| 4. okt. 2026 | Vitest, 903 tests (46 nye i `familyInvitesFlow.test.jsx`) | Node/jsdom | Alle grønne |
| 4. okt. 2026 | Invitationssiden, 774 kontroller | Chromium med 28 emulerede enheder/browsere | 774/774 OK (fandt og rettede iPad- og computerfejl) |
| 4. okt. 2026 | Appens routing for links, 72 kontroller | Chromium med 6 emulerede browsere | 72/72 OK (fandt og rettede første-besøg-fejlen) |
| 4. okt. 2026 | Mail N9 (begge varianter) i lys og mørk tilstand, 390 px | Chromium | Læsbar, intet overløb. Logoer ikke indlæst (eksterne billeder blokeret i testen) |
| Mangler | Push til rigtig telefon, N10/N11 gennem hele kæden (dispatch → notify → besked), testmails i rigtige mailklienter, Google-/Facebook-login, rigtige Safari/Firefox/Samsung-enheder | – | Venter på merge og på manuel test |
