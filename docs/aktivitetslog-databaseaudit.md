# Aktivitetslog: hvad registreres, hvad ikke, og anbefaling (16. okt. 2026)

Status er læst fra koden, den levende database (kun læsning) og DB-testene. Intet er ændret i databasen.

## Hvad der registreres i dag
- **Databaseudløsere (kun når handlende er en administrator med eget login, `auth.uid()`):** rolleskift, ticketstatus, indsendelsesstatus, sletning af produkt og leksikonpost, oprettelse/rettelse af produkt og leksikon (før/efter, 500 tegn), rettelse af en andens brugerprofil (kun feltnavne), tilføjelse/fjernelse af en brugers allergier (kun antal), sletning af familiemedlem og invitation, push-tekster.
- **RPC:** CSV-eksport af brugere (`log_admin_export`).
- **Edge-funktioner med service-nøglen (`log_admin_event`):** produkter (opret/ret/slet), allergener, indsendelser (godkendt/afvist), sletning af en andens konto, import, genanalyse, test-push, afviste og mislykkede forsøg. Triggerne ser ikke adminen her (service-nøglen), så der er ingen dubletter: hver handling logges af præcis én vej.

## Huller
1. **Aktør ukendt = intet logges.** Udløserne springer over, når `auth.uid()` er tom (SQL-editor/databaseadministrator, systemproces, service-nøgle uden egen log). Det er bevidst: en admin må ikke angives som aktør, når identiteten er ukendt. Konsekvens: direkte databaseændringer er usynlige.
2. **Loggen kan ændres af `service_role` og `postgres`** (UPDATE/DELETE-rettigheder, ingen spærreudløser). Almindelige brugere og administratorer kan ikke (testet i `admin_audit.sql`).
3. Ikke dækket: sletning af brugerkonto uden om edge-funktionen `delete-user`, familieoprettelse/-ændring af admin, rettigheder/policies/roller i databasen (DDL), ændring af `app_flags`.

## Anbefaling (kræver Jans ja; database og sikkerhed)
1. **Spærreudløser på `admin_audit_log`:** UPDATE forbudt; DELETE kun fra opbevaringsfunktionen (`cleanup_notifications`, via en transaktionsvariabel). Lille, lav risiko; lukker hul 2 for alle undtagen en bevidst omgåelse.
2. **Systemaktør i stedet for ingen post, men kun for et udvalg:** udløserne på `users.role`, sletning af `users`, `family_members`/`family_invites` og `app_flags` skriver en post med `admin_id = null` og `details.aktoer = 'system'` (kilde: `current_user`/`session_user`), når `auth.uid()` er tom. Ikke for produkter og leksikon (import og genanalyse ville give tusindvis af poster; de logger i forvejen en samlet "kørsel"). Skeln: administrator (admin_id sat), system/databaseadministrator (admin_id tom, aktoer sat).
3. **Ikke anbefalet nu:** fuld databaseauditing (fx pgaudit eller generisk trigger på alle tabeller): meget støj, risiko for personoplysninger i loggen og større opbevaringsansvar (privatlivspolitikken skal opdateres).
Omfang: én migration + testudvidelse. Risici: (1) kan blokere en fremtidig oprydning, der ikke går gennem funktionen; (2) flere poster i loggen, 12 måneders opbevaring uændret.
