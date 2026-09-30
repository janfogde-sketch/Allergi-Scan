# Migrationer

`20260930000000_baseline.sql` er et øjebliksbillede af produktionens skema
30. sept. 2026. Den dækker alle 57 ældre migrationer, som kun findes i
databasens historik (`supabase_migrations.schema_migrations`), og de løse
filer i `supabase/sql/`.

**Køres aldrig mod produktion.** Den bruges til at genskabe skemaet i et
tomt projekt (staging eller lokal `supabase start`) og til at kunne læse og
diffe skemaet i repoet.

## Nye ændringer

1. Kør ændringen med `apply_migration` (Supabase MCP) — navnet i snake_case.
2. Gem præcis samme SQL her som `<version>_<navn>.sql`, hvor `<version>` er
   den version, `list_migrations` viser for den nye migration.
3. Commit filen i samme omgang som koden, der bruger ændringen.

## Hvis Supabase CLI skal bruge mappen (`supabase db push`)

CLI'en forventer, at hver version i databasens historik har en fil her. Før
første `db push` skal historikken derfor ryddes op med
`supabase migration repair` (de 57 gamle versioner markeres `reverted`,
baselinen markeres `applied`). Det ændrer kun historik-tabellen, ikke
skemaet — men gør det først efter aftale med Jan.
