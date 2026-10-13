# Android-app (Google Play): hvad er klar, og hvad mangler

Status 13. okt. 2026. Android-appen er en "Trusted Web Activity" (TWA): en lille Android-skal, der åbner www.eatsafe.dk i Chrome uden adresselinje. Al kode, push, kamera og login er uændret.

## Klar
- Pakkenavn `dk.eatsafe.app` og adresse `www.eatsafe.dk` (aldrig uden www).
- `android/twa-manifest.json`: færdig opsætning til Bubblewrap (bygge-værktøjet). Ingen nøgler ligger i repoet.
- `public/.well-known/assetlinks.json` er live og har rette pakkenavn; kun fingeraftrykket mangler.
- Manifest, ikoner (også "maskable"), service worker og offline-side findes. Kontosletning: appen og https://www.eatsafe.dk/slet-konto.
- Butikstekster og erklæringer: `APP_STORE_METADATA.md`, `BUTIKSDEKLARATIONER.md`.

## Mangler, når Google Play-kontoen findes (Jan)
1. Opret appen "EatSafe" i Play Console med pakkenavn `dk.eatsafe.app`, og slå Play App Signing til.
2. Kopiér SHA-256-fingeraftrykket under Opsætning > App-signering (Play-nøglen) og indsæt det i `public/.well-known/assetlinks.json` (i `sha256_cert_fingerprints`). Det er nok at sige det til Claude. Merge, og tjek `https://www.eatsafe.dk/.well-known/assetlinks.json` (200, `application/json`).
3. Byg appen: `npm i -g @bubblewrap/cli`, derefter `bubblewrap init --manifest=https://www.eatsafe.dk/manifest.json` (eller brug `android/twa-manifest.json`) og `bubblewrap build`. Det opretter en uploadnøgle (keystore). Gem den og adgangskoden sikkert (fx i en adgangskodeboks), aldrig i repoet. Bygget giver en `.aab`-fil. Kan Claude gøre det, når nøglen er oprettet, siger du til.
4. Upload `.aab` til "Intern test", tilføj Jan og Bjørn som testere, og installér via testlinket.
5. Indtast Data safety, indholdsvurdering, målgruppe (18+) og kontosletnings-URL ud fra `BUTIKSDEKLARATIONER.md`.
6. Tjek i Play Console, om organisationskonti er undtaget kravet om 12 testere i 14 dage.
7. Test på en rigtig Android: adresselinjen er skjult (ellers er fingeraftrykket forkert), kamera, push og Google-login virker.
8. Bjørn: se ikon og splash-skærm.

## Afventer før indsendelse
CVR, D-U-N-S og organisationskonto. Intet er indsendt.
