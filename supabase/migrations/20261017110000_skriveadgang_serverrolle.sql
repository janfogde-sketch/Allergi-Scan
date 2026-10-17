-- Skriveadgang for service-rollen (gennemgang 16.-17. okt. 2026, backend B1/B16, SIK-2).
--
-- Baggrund: i produktionen giver standardrettighederne (pg_default_acl for postgres i public) kun service_role
-- references/trigger/truncate på nye tabeller, ikke select/insert/update/delete. CI's testdatabase giver alt, så testene
-- opdager det ikke. Edge-funktioner, der bruger service-nøglen direkte på en tabel, får derfor "permission denied":
--   * shopping_list_hidden: "Forlad liste" i edge-funktionen shopping har aldrig virket (~90 afvisninger 14.-16. okt.).
--   * import_runs (20261017093000): finishRun i _shared/runLog.ts kan ikke afslutte kørsler, så de står som "running".
--   * recall_events (20261017096000): recalls-sync kan ikke logge hændelser.
-- Målt 17. okt.: 29 tabeller i public mangler service_role-DML; kun de tre ovenfor bruges direkte af edge-funktioner
-- (resten er backups eller tilgås via security definer-funktioner) og får derfor ikke ekstra rettigheder her.
--
-- Standardreglen sørger for, at kommende tabeller fra migrationer får samme rettigheder som i CI. anon og authenticated
-- røres ikke; RLS er fortsat slået til (service_role omgår RLS som hidtil).
-- Idempotent, bagudkompatibel, ingen data ændres.

grant select, insert, update, delete on table public.shopping_list_hidden to service_role;

do $$
begin
  if to_regclass('public.import_runs') is not null then
    grant select, insert, update, delete on table public.import_runs to service_role;
  end if;
  if to_regclass('public.recall_events') is not null then
    grant select, insert, update, delete on table public.recall_events to service_role;
  end if;
end $$;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;
