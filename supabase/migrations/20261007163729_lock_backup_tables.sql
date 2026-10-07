-- 7. okt. 2026: Backup-/diff-/down-tabeller kunne tømmes (TRUNCATE) af alle med appens offentlige nøgle,
-- fordi nye tabeller automatisk gav anon og authenticated rettighederne TRUNCATE, REFERENCES, TRIGGER og MAINTAIN
-- (og products_backup gav fuld læse-/skriveadgang). Rækkesikkerheden (RLS) stopper ikke TRUNCATE.
-- Rettelsen fjerner KUN rettighederne for appens roller. Ingen data eller tabeller slettes; edge-funktioner
-- (service_role) og admin-SQL er upåvirkede. Tabellerne ligger kun til rollback og læses ikke af appen.
do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
      and (c.relname ~ '_(backup|fix|diff|down|match|ids)(_|$)' or c.relname ~ '_[0-9]{8}[a-z]?$')
  loop
    execute format('revoke all on table public.%I from anon, authenticated', r.relname);
  end loop;
end $$;

-- Nye tabeller (oprettet af migrationer) får ikke længere de farlige standardrettigheder automatisk.
-- SELECT/INSERT/UPDATE/DELETE gives som hidtil eksplicit pr. tabel i hver migration.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables from anon, authenticated;
