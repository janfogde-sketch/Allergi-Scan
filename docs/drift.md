# Drift og opsætning — detaljer

Detaljer bag afsnit 0 i `CLAUDE.md`.

## Betalte planer

- **Supabase Pro er sat på pause (Jans beslutning):** backups, testmiljø og Leaked Password Protection venter. Spørg ikke, om det er glemt, kun om han vil opgradere.
- **Vercel skal skifte til Pro, før appen går live.** Vercels DPA gælder kun Pro/Enterprise (to do på listen).

## Testrunden på rigtige telefoner

Sat på pause. Tjeklisten er https://claude.ai/artifact/1YwwF252KhrCAWrgSssw1X, resultater i dens database (`results`). Opret tickets for `fail`. Alle iPhone-tests lægges som to do hos Bjørn.

## Netværk

Cloud-miljøet når eatsafe.dk, www.eatsafe.dk, Supabase og world.openfoodfacts.org. Admin-test kræver en testkonto med admin-rolle, som kun oprettes efter Jans ja. Test-mail og test-push sendes kun til Jans og Bjørns egne konti.

## Login og mail

- Egen SMTP via Resend (`noreply@eatsafe.dk`). "Confirm email" er slået til.
- Send Email Hook (`auth-send-email`) sender alle auth-mails med skabelonerne i `supabase/templates/auth/` (`src/CONTEXT.md` §11).
- Der findes kun én velkomstmail: `supabase/templates/resend/N1-velkomst.html` (type `welcome_onboarded`, sendt efter onboarding).
- Alle 24 mailskabeloner (inkl. N9 familieinvitation, sendt direkte af `family-invite`) deler mørk palette (`supabase/templates/resend/README.md`, test `src/mailDarkMode.test.js`). Ændr den i alle samtidig.
- `deploy-auth-templates.yml` kører kun manuelt (tilbagerulning).
- `RESEND_API_KEY` findes kun som edge-secret, ikke i Vault.

## Adgangskode

Mindst 10 tegn plus lille bogstav, stort bogstav og tal (`passwordErrorText()`/`PASSWORD_REQUIREMENTS_TEXT` i `helpers.js`). Ændres kravene i Supabase, ret `helpers.js` tilsvarende.

## Notifikationer

Live: push og mail slået til via `app_flags`. Beskeder i appen påvirkes ikke af flagene. Detaljer, testplan og rollback: `src/CONTEXT.md` §9 og `docs/notifikationer-testplan.md`.

## Admin-panel

- `eatsafe.dk/admin.html`, eget Vite-entry (`src/admin/`). Rører ikke den mobile PWA's bundle.
- Responsivt: kort på mobil, tabel på desktop (`useIsMobile`, `statusTone.js`).
- Adminrettigheder håndhæves i databasen (RLS med `is_admin`) og i edge-funktionerne. `admin.html` er kun en klientport.
- Ny følsom admin-handling: tilføj en audit-trigger (`admin_audit_log`, 12 mdr.).
- Admin-udseendet er IKKE frosset (Jan afviste det 14. okt. 2026).
- Alle detaljer (Opgaver, tidl. To do; Dashboard; Indsendelser; aktivitetslog; menu): `docs/produktbeslutninger.md` og `docs/admin-statusser.md`. Reference i `src/CONTEXT.md` §2 og §10.

## Edge-funktioner og migrationer

- Databaseændringer skrives som fil i `supabase/migrations/` (version = tidsstempel) og anvendes af `apply-migrations.yml` ved merge til main. Se `supabase/migrations/README.md`.
- Edge-funktioner deployes ved merge af `deploy-edge-functions.yml` (secret `SUPABASE_ACCESS_TOKEN`, skal have "Full access"; 401/403 = ny adgangsnøgle, udløber).
- `SUPABASE_ACCESS_TOKEN` ligger i GitHub-miljøet `produktion` (Settings → Environments), som kun `main` må bruge. Alle workflows med nøglen
  (`apply-migrations`, `deploy-edge-functions`, `deploy-auth-templates`, `todo-write`, `natjob-hent`, `natjob-skriv`, `flyt-indsendte-billeder`) kører kun på `main`. Ny nøgle lægges
  i miljøet, ikke som repo-secret (sikkerhedsgennemgang 15. okt. 2026, S1).
- `supabase/config.toml` har `verify_jwt` pr. funktion.
- Backup-tabeller bevares indtil deres frist (fx `opskrift_rester_backup_20261014` til 13. nov.; `products_allergen_backup_20261006`).
