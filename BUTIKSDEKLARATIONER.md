# EatSafe — butiksdeklarationer (Apple privacy labels og Google Data safety)

Udkast til svarene i App Store Connect og Play Console (8. okt. 2026). Skal stemme med privatlivspolitikken (`src/legalText/privacy.js`) og med det, appen faktisk gør.
Tjek mod koden før hver indsendelse. Ændres data, leverandører eller opbevaring, så ret denne fil og politikken i samme PR.

**Grundfakta (verificeret i koden)**
- Ingen analytics-, tracking- eller reklame-SDK'er. Ingen reklame, ingen deling af data til reklameformål, ingen salg af data.
- Skrifttyper hostes selv (ingen Google Fonts-kald).
- Al data ligger i Supabase (EU). Mail sendes via Resend. Anthropic (Claude) modtager kun et emballagebillede (aflæsning) eller ingredienstekst (allergenvurdering), aldrig konto-, profil- eller helbredsdata.
- Kontosletning findes i appen (Indstillinger → Slet konto) og på `https://www.eatsafe.dk/slet-konto`.
- Alt sendes krypteret (HTTPS). Privatlivspolitik: `https://www.eatsafe.dk/privacy.html`.
- Målgruppe: forældre og voksne; børneprofiler er administreret af en voksen. Appen søges **ikke** i Kids-kategorien / Designed for Families.

## Dataoversigt

| Data | Formål | Valgfri? | Kobles til brugeren | Slettes |
|---|---|---|---|---|
| Navn, e-mail | Konto, mails | Nej | Ja | Ved kontosletning |
| Fødselsår, køn | Tilpasning af tjenesten | Nej (obligatorisk i onboarding) | Ja | Ved kontosletning |
| Allergier, intolerancer, E-numre, spor-valg (også på børneprofiler) | Personlige resultater | Ja (kræver særskilt samtykke) | Ja | Ved tilbagetrækning af samtykke eller kontosletning |
| Scanningshistorik, favoritter, søgevalg, indkøbslister | Funktioner i appen | Ja | Ja | Scanningshistorik 24 mdr., søgehistorik 12 mdr.; alt ved kontosletning |
| Produktindsendelser (billeder, ingredienstekst) | Forbedre produktdata | Ja | Ja | Ved kontosletning, undtagen godkendte (indgår i produktdatabasen) |
| Feedback (fritekst, tekniske felter) | Support | Ja | Ja (anonyme kan forekomme) | Se politikken |
| Push-token (Web Push) | Notifikationer | Ja | Ja | Ved kontosletning |
| Fejllogs (tekniske fejl, internt bruger-id) | Fejlfinding | Nej | Ja | 90 dage |
| Samtykkelog | Dokumentation af samtykke | Nej | Ja | Ved kontosletning |
| Login via Google/Facebook (navn, e-mail) | Login | Ja | Ja | Ved kontosletning |

## Apple App Privacy (privacy labels)

**Tracking:** Nej. Ingen data bruges til at spore brugere på tværs af andre virksomheders apps og websteder.

Alle typer nedenfor er **"Data Linked to You"**, bruges **ikke** til Tracking, og formålet er **App Functionality** (medmindre andet er angivet):

| Apple-kategori | Datatype | Formål |
|---|---|---|
| Contact Info | Name, Email Address | App Functionality |
| Health & Fitness | Health (allergier og intolerancer) | App Functionality |
| Sensitive Info | (ikke relevant; allergier angives som Health) | — |
| User Content | Photos or Videos (indsendte produktbilleder), Customer Support (feedback), Other User Content (indkøbslister, indsendt ingredienstekst) | App Functionality |
| Identifiers | User ID | App Functionality |
| Usage Data | Product Interaction (scanninger, favoritter) | App Functionality |
| Search History | Search History (søgeord og valgt produkt, 12 mdr.) | App Functionality |
| Diagnostics | Crash Data / Other Diagnostic Data (fejllogs) | App Functionality |
| Demographics | Alder (fødselsår) og køn: vælg "Other Data Types" | App Functionality, Analytics ikke valgt |

Ikke indsamlet: Financial Info, Location, Contacts, Browsing History, Purchases, Audio, Advertising Data.

Kamera: bruges til stregkodescanning og billede af emballage; billeder forlader enheden kun, når brugeren selv indsender eller aflæser en etiket. Beskrivelse til Info.plist (iOS-versionen): "EatSafe bruger kameraet til at scanne stregkoder og fotografere ingredienslister."

## Google Play Data safety

**Indsamler appen data?** Ja. **Deles data med tredjeparter?** Nej i Googles forstand (Supabase, Resend og Anthropic er databehandlere, som handler på vores vegne, og tæller ikke som "deling"); vælg "ja" kun hvis Play Console kræver, at serviceudbydere oplyses, og angiv dem som "service providers".

**Sikkerhedspraksis**
- Data krypteres under transport: **Ja**
- Brugere kan bede om sletning: **Ja** (i appen og via `https://www.eatsafe.dk/slet-konto`)
- Følger Families-politikken: **Nej / ikke relevant** (målgruppen er voksne; ikke en børneapp)

| Googles kategori | Datatype | Indsamlet | Delt | Valgfri | Formål |
|---|---|---|---|---|---|
| Personal info | Name, Email address, User IDs | Ja | Nej | Nej | App functionality, Account management |
| Personal info | Other info (fødselsår, køn) | Ja | Nej | Nej | App functionality |
| Health and fitness | Health info (allergier og intolerancer) | Ja | Nej | Ja | App functionality |
| Photos and videos | Photos (indsendte produktbilleder) | Ja | Nej | Ja | App functionality |
| App activity | App interactions (scanninger, favoritter), In-app search history, Other user-generated content (feedback, lister) | Ja | Nej | Ja | App functionality |
| App info and performance | Crash logs, Diagnostics | Ja | Nej | Nej | Analytics (fejlfinding), App functionality |
| Device or other IDs | Push-token | Ja | Nej | Ja | App functionality |

Ikke indsamlet: Location, Financial info, Contacts, Calendar, Messages, Audio, Files, Web browsing, Advertising ID.

## Andre erklæringer ved indsendelsen
- **Indholdsvurdering / alder:** se "Aldersrating" nedenfor.
- **Helbredsapp (Google Play "Health apps" deklaration):** Play Console spørger, om appen har helbredsfunktioner. Svar: appen håndterer helbredsoplysninger (allergier, intolerancer), men er et informationsværktøj til madvarer og giver ikke diagnose, behandling, medicinsk måling eller medicinsk rådgivning; vælg ikke "medicinsk"/"sygdomsstyring" som funktion. Disclaimer "EatSafe er vejledende" vises i appen. Apple: ikke en medicinsk enhed; Apple-spørgsmålet om "Medical or Treatment Information" besvares "Infrequent" (se Aldersrating).
- **Målgruppe (Google Play Target audience and content):** aldersgruppe **18 og derover**. Appen er ikke rettet mod børn og søges ikke i Families-programmet. Børneprofiler er forælder-administrerede; barnet bruger ikke selv appen. Svar "Nej" til, at appen appellerer til børn.
- **Reklame-ID (Google):** appen bruger ikke reklame-ID; svar "Nej".
- **Nyhedsapp / COVID / finans / myndigheder:** Nej til alle.
- **Reklame:** Nej. **Betalinger i appen:** Nej (premium kommer først efter lancering og skal så via Apple IAP/Google Billing).
- **Kontosletning (Google):** URL `https://www.eatsafe.dk/slet-konto`.
- **Eksportkontrol (Apple):** appen bruger kun standard-kryptering (HTTPS) → "Nej" til proprietær kryptering.
- **Sign in with Apple (iOS):** åbent valg for Jan og Bjørn; hører under iOS-sporet.

## Aldersrating (svar til spørgeskemaerne)

Det fulde udfyldningsark (Apple-skemaet, IARC, Data safety og øvrige erklæringer, klik for klik) ligger i projektmappen: `eatsafe/butikserklaeringer-udfyldningsark-2026-10-08.md`.

**Apple (spørgeskemaet fra 2025): forventet 13+, ikke 4+.** Leksikonets FAQ har nødråd (fx "Brug EpiPen og ring 112"), så "Medical or Treatment Information" er **Infrequent** (13+), og appen viser alkoholholdige varer, så "Alcohol, Tobacco, or Drug Use or References" er **Infrequent** (13+). "Health or Wellness Topics": Ja. "User-Generated Content": Ja (godkendte indsendelser er synlige for alle; ændrer ikke ratingen). Alt andet: None/Nej. Age Categories: Not Applicable. Har vilkårene en minimumsalder over 13, skal "Override to Higher Age Rating" sættes til den.

**Google Play (IARC, "All Other App Types"):** alkohol: Ja, kun "references" (varer med ingredienser). Brugere interagerer/udveksler indhold: Ja (delte indkøbslister, indsendelser). Alt andet: Nej. Forventet lav rating; IARC beregner selv.

## Hvad der venter på kontiene
Intet af ovenstående kan udfyldes, før Google Play-konto (kræver CVR/D-U-N-S) og Apple Developer-konto findes. Når de findes: kopiér titel, beskrivelser, søgeord, kategori og svarene herover; tjek tallene først (SQL øverst i `APP_STORE_METADATA.md`); upload billeder og banner fra projektmappen (`eatsafe/butiksbilleder-v3-2026-10-07`); angiv politik-URL `https://www.eatsafe.dk/privacy.html` og sletnings-URL.

## Afhængigheder, der stadig afventer Jan
- Dataansvarlig (virksomhedsnavn, CVR, adresse) i privatlivspolitikken, når ApS'et har CVR. Politik-URL'en kan ikke indsendes uden.
- Anthropic: bekræft DPA/ingen modeltræning for kontoen, nøglen hører til.
- Vercel Pro (DPA) før eksterne testere.
