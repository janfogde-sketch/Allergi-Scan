# Dataimport og AI-genanalyse: risikovurdering (16. okt. 2026)

Kortlægning af hvad der sker med allergenoplysninger ved import og genanalyse, og hvad der er (og ikke er) ændret. Ingen af punkterne nedenfor er ændret i koden uden Jans ja.

## Hvad der er på plads (verificeret i kode og tests)
- **Genanalyse hæver kun** (`mergeFlagsUpward`: nej → spor → ja). Den kan ikke sænke en værdi.
- **Håndrettede produkter røres ikke:** en manuel rettelse sætter `allergen_quality = verified`, og genanalysen vælger kun `pending`/`low` (nat) og `medium` (manuel kørsel).
- **Manglende dokumentation er ukendt:** databasereglen `products_unknown_without_ingredients` gør allergener til "unknown", når der ikke er en ingrediensliste (gælder alle veje ind, også import).
- **Grænser på serveren:** manuel genanalyse højst 25 produkter, nat højst 200; import højst 50 stregkoder pr. kørsel; admin-tjek på manuelle kald; AI-loft og adminpulje (G29) uændrede. Kun én kørsel af hver slags ad gangen (ny).

## Fund, der kræver en beslutning (ikke ændret)
1. **Import sætter `verified_status = auto_verified`** på produkter fra Open Food Facts (ét produkt i dag). Navnet kan læses som "kontrolleret", selvom intet menneske har set produktet. Forslag: import sætter `unverified`. Berører produktstatus: kræver Jans ja.
2. **Import starter alle allergener på "nej" og hæver ud fra OFF's mærker og nøgleordsmotoren.** Er OFF's mærker ufuldstændige, men der findes en ingrediensliste, kan et allergen stå som "Ikke påvist" uden dokumentation ud over at motoren intet fandt. Forslag: allergener, som OFF ikke eksplicit angiver, og som motoren ikke har bekræftet med en ren ingrediensliste, står som ukendt. Allergenlogik: kræver Jans ja og regressionsliste (`allergenRegression.json`).
3. **Der gemmes ingen ændringshistorik pr. produkt for allergener** (tidligere værdi, ny værdi, kilde, metode, modelversion, tidspunkt, automatisk/godkendt). Kun tællere pr. kørsel (`import_runs.counts.changed`, nyt) og adminloggens feltnavne. Forslag: en tabel `allergen_change_log` fyldt af en trigger på `products.allergen_flags`, med kilde sat af det, der ændrer (admin, import, genanalyse, indsendelse). Dette er også det, Ændringshistorikken mangler for at kunne vise før/efter. Datamodel og opbevaring (GDPR: ingen personoplysninger ud over administrator-id): kræver Jans ja.
4. **Ingen kø til manuel gennemgang** af usikre eller modstridende AI-resultater. Siden viser derfor "–" for det tal. Forslag: først når punkt 3 findes; usikre resultater gemmes som forslag og publiceres ikke.
5. **Automatiske ændringer påvirker brugernes vurdering:** ja. `allergen_flags` på produktet er det, appen vurderer ud fra, så en hævet værdi slår straks igennem ("sikker" kan blive "spor"/"farlig"). Det er den sikre retning; en sænkning sker aldrig automatisk.

## Licens og kilde
Open Food Facts-data er under ODbL: kilden skal angives, og afledte databaser deles på samme vilkår; billeder er normalt CC BY-SA. Kilden står i vilkår og privatlivspolitik (`src/legalText/`) og på produktet (`source`); billeder vises kun med kildeangivelse (CLAUDE.md §5). Ikke vurderet juridisk, om vores samlede produktdatabase er en "afledt database" efter ODbL: lægges i det juridiske spor hos Jan.

## AI-omkostning
Genanalysen tæller AI-kald (`import_runs.counts.ai_calls`) pr. kørsel; samlet forbrug og lofter står under AI-forbrug. Fejlede AI-kald gentages ikke automatisk i samme kørsel; produktet tages igen ved næste planlagte kørsel.
