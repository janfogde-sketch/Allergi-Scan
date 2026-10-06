# Migrationer

`20260930000000_baseline.sql` er et øjebliksbillede af produktionens skema
30. sept. 2026. Den dækker alle 57 ældre migrationer, som kun findes i
databasens historik (`supabase_migrations.schema_migrations`), og de løse
filer i `supabase/sql/`.

**Køres aldrig mod produktion.** Den bruges til at genskabe skemaet i et
tomt projekt (staging eller lokal `supabase start`) og til at kunne læse og
diffe skemaet i repoet.

## Nye ændringer (fra 6. okt. 2026)

Alle databaseændringer, også enkeltstående rettelser (grant, sletning), skrives som en fil her og går i en PR.
Workflowet `apply-migrations.yml` anvender nye filer ved merge til main (Jans "push" er godkendelsen); tråde
bruger ikke `apply_migration`/`execute_sql` til skrivning, fordi Supabase-forbindelsens bekræftelsesdialog ikke
er synlig for Jan.

1. Gem SQL som `<ÅÅÅÅMMDDTTMMSS>_<navn>.sql` (version nyere end alle eksisterende).
2. Skriv i PR-teksten tydeligt, hvis filen sletter eller ændrer data.
3. Filen køres i én transaktion og registreres i `schema_migrations`; fejler den, stopper workflowet.
4. Test uden at ændre noget: kør SQL'en i en transaktion, der rulles tilbage (`begin; ...; rollback;`), eller start
   workflowet manuelt med `dry_run`. Læsning (`execute_sql` med select) er stadig fint.

## Hvis Supabase CLI skal bruge mappen (`supabase db push`)

CLI'en forventer, at hver version i databasens historik har en fil her. Før
første `db push` skal historikken derfor ryddes op med
`supabase migration repair` (de 57 gamle versioner markeres `reverted`,
baselinen markeres `applied`). Det ændrer kun historik-tabellen, ikke
skemaet — men gør det først efter aftale med Jan.
