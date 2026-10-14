# Politikker og opbevaring — detaljer

Detaljer bag afsnit 0b i `CLAUDE.md` (stående regler, Jan 2. okt. 2026).

## Politikker mod appen

Vilkår og privatlivspolitik skal følge appen. Teksten bor ét sted (`src/legalText/terms.js`/`privacy.js`). Skærmene læser den, og `public/terms.html`/`privacy.html` genereres med `node scripts/build-legal-pages.mjs`. Testen `src/legalText.test.js` fejler ved afvigelse. Ret aldrig HTML-filerne i hånden.

**Hver funktions- eller dataændring**, der rører personoplysninger (nye felter/tabeller, leverandører, notifikationstyper, lagring, login-metoder, AI-brug, opbevaring): tjek og ret teksterne i samme PR, og sæt "Sidst opdateret". Skriv teksterne generelt (kategorier og formål, ikke enkelte beskedtyper), så almindelige tilføjelser ikke kræver ny tekst.

**Sessionstart:** har den tilbagevendende to do "Gennemgå politikker mod appændringer" overskredet sin frist, så gennemgå `git log` siden sidste gennemgang mod teksterne, opret fund som to do, luk opgaven og opret en ny med frist om en måned.

Åbne juridiske punkter står i de to tickets "[Brugsvilkår · IKKE FÆRDIGE]" og "[Privatlivspolitik · IKKE FÆRDIG]", aldrig i den offentlige tekst. Væsentlige ændringer skal meddeles brugerne på passende måde (Jan beslutter hvordan).

## Opbevaringsfrister

Frister står i privatlivspolitikkens afsnit 11 og i `src/CONTEXT.md` §3, og databasen skal faktisk gøre det samme.

- Kontodata slettes straks ved kontosletning.
- Scanningshistorik: 24 mdr.
- Inaktiv konto (36 mdr. uden aktivitet) slettes 30 dage efter en advarselsmail (`inactive-accounts`, dagligt 04:10 UTC, `inactive_accounts()`).
- Beskeder: 12 mdr.
- Notifikationshændelser og fejllogs: 90 dage (`cleanup_notifications()`, dagligt kl. 03:30 UTC).
- Sikkerhedsindberetninger: 12 mdr.
- Invitationens `invitee_email` slettes ved svar eller udløb (højst ca. 48 t).
- Backup-tabeller: se `docs/drift.md`.

Ny tabel/kolonne med personoplysninger: definér frist, sørg for sletning ved kontosletning (`delete-user` eller cascade) og automatisk oprydning, og opdatér politikken. DB-testen `supabase/tests/account_deletion.sql` (workflow `db-tests.yml`) fejler, hvis en kolonne med brugerdata ikke står på dens "dækket"-liste. Tilføj sletning/oprydning først, derefter listen.

## Samtykke til helbredsdata (art. 9)

Samtykket gives særskilt og logges i `consent_log` (RPC `give_health_consent`/`withdraw_health_consent`; `src/CONTEXT.md` §3). Tilbagetrækning sletter helbredsdata.

Ændres samtykketeksten eller politikken væsentligt, hæves `HEALTH_CONSENT_VERSION` (`constants.jsx`) og `policyUpdated` i `healthConsent.test.js`. Alle bliver så bedt om at bekræfte på ny ved næste appåbning (`ConsentRenewalModal.jsx`, Jan 13. okt. 2026).
