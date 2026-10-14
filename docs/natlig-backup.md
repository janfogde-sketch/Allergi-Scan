# Natlig sikkerhedskopi (Jan, 14. okt. 2026)

Plan: `eatsafe/plan-natlig-backup-2026-10-14.md` i projektmappen. Supabase Free har ingen kopier, vi selv kan hente, så et lille job tager en egen.

## Hvordan det virker
- **Nat (kl. 01 UTC = 03 dansk sommertid):** `backup.yml` kører `pg_dump` af skemaerne `public`, `auth` og `storage` (kun metadata), låser filen med `gpg` (AES256, kodeordet `BACKUP_PASSPHRASE`) og gemmer **kun den låste fil** som Actions-fil med `retention-days: 7`. Den ulåste fil slettes straks.
- **Opbevaring:** de seneste 7 nætter. Ældre slettes af GitHub selv. Slettede oplysninger er derfor væk fra kopierne senest 7 dage efter (matcher privatlivspolitik §11).
- **Prøve-gendannelse (den 1. hver måned kl. 05 UTC):** `restore-test.yml` henter nyeste kopi, låser op, lægger den i en midlertidig `postgres:17` og tæller rækker i `public.users`, `public.user_allergens` og `public.products`. Er en tom eller mangler den, fejler kørslen, og GitHub sender fejlmail til arkivets ejer.
- **Sikkerhedsspærrer:** begge kørsler stopper med en tydelig fejl, hvis secrets mangler. `backup.yml` stopper også, hvis arkivet ikke er privat, eller hvis kopien er under 1 MB. Intet slettes i databasen; jobbet læser kun.
- Pris 0 kr. (ca. 90 af 2.000 gratis minutter og ca. 150 af 500 MB gratis plads om måneden). Billeder i lagerbøtterne er ikke med.

## Hvor filerne bor
Skabelonerne ligger her i `docs/backup-repo/workflows/` og skal ligge i det **private** arkiv `eatsafe-backup` under `.github/workflows/`. De må **aldrig** lægges i det offentlige Allergi-Scan, fordi Actions-filer er synlige for alle i et offentligt arkiv (de er låste, men skal ikke ligge åbent).

## Opsætning (Jan, én gang; står også som to do)
1. GitHub → New repository → `eatsafe-backup`, **Private**.
2. Arkivets Settings → Secrets and variables → Actions → New repository secret:
   - `SUPABASE_DB_URL`: Supabase → Connect → "Session pooler" (kopiér adressen, indsæt databasens kodeord i stedet for `[YOUR-PASSWORD]`).
   - `BACKUP_PASSPHRASE`: et langt kodeord, du selv vælger. Gem det i adgangskode-appen (og evt. på papir). **Uden det kan kopien ikke åbnes.**
3. Tilføj arkivet til Claude-projektet (så en tråd kan lægge de to workflow-filer ind og starte første kørsel).

## Åbn en kopi i hånden
```
gpg --decrypt eatsafe-ÅÅÅÅ-MM-DD.pgdump.gpg > dump.pgdump     # beder om kodeordet
pg_restore --list dump.pgdump                                    # indholdsfortegnelse
pg_restore -d <ny database> --no-owner --no-privileges dump.pgdump
```
Hent filen: arkivet → Actions → kørslen → Artifacts.

## Tjek efter første opsætning
Kør `backup.yml` med "Run workflow", bekræft at en fil på flere MB findes under Artifacts, og kør derefter `restore-test.yml` i hånden én gang.
