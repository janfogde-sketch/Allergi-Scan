-- Rettelse: sikkerhedskopien af kategorier (fra #692) kunne skrives til af anon.
-- Tabellen havde kun rækkeniveau-sikkerhed slået til, men ingen lukning af rettigheder.
-- DB-testen access_rules.sql fejlede på main derfor ("ANON-SKRIVER"). Samme lukning som for næringsbackuppen.
revoke all on public.products_category_backup_20261013 from public, anon, authenticated;
