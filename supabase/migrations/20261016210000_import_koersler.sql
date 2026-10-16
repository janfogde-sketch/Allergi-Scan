-- Dataimport (16. okt. 2026): kørselslog for automatisk produktimport (Open Food Facts) og genanalyse af allergener. Før fandtes kun adminloggen for manuelle kørsler;
-- natkørsler og resultater (fundet, importeret, allerede oprettet, ikke fundet, fejl) blev ikke gemt. Tabellen indeholder ingen personoplysninger og ingen nøgler:
-- kun tællere, korte statuslinjer og en kort fejlkode. En kørsel pr. job ad gangen (unikt indeks), så automatisk og manuel kørsel ikke løber samtidigt.
-- Ændrer ingen produkter og ingen allergenoplysninger.
create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null check (job in ('off_import', 'reanalyze')),
  trigger text not null check (trigger in ('cron', 'manual')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'ok', 'partial', 'failed')),
  counts jsonb not null default '{}'::jsonb,
  error_code text,
  log jsonb not null default '[]'::jsonb
);
create index if not exists import_runs_started_idx on public.import_runs (job, started_at desc);
create unique index if not exists import_runs_one_running_idx on public.import_runs (job) where status = 'running';

alter table public.import_runs enable row level security;
revoke all on public.import_runs from anon, authenticated;
grant select on public.import_runs to authenticated;
create policy "Administratorer kan læse kørsler" on public.import_runs as permissive for select to authenticated
  using (public.is_admin((select auth.uid())));

-- Overblik: hvad afventer? (kun tællere)
create or replace function public.admin_import_overview()
returns table (pending_eans bigint, pending_reanalyze bigint, pending_reanalyze_manual bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  return query
  select
    (select count(*) from public.missing_ean_log m
      where (m.last_checked is null or m.last_checked < now() - interval '30 days')
        and not exists (select 1 from public.products p where p.ean = m.ean)),
    (select count(*) from public.products p where p.allergen_quality in ('pending', 'low') and coalesce(p.ingredients_text, '') <> ''),
    (select count(*) from public.products p where p.allergen_quality in ('pending', 'low', 'medium') and coalesce(p.ingredients_text, '') <> '');
end;
$$;
revoke all on function public.admin_import_overview() from public, anon;
grant execute on function public.admin_import_overview() to authenticated;

-- Rydder gamle kørsler (180 dage) og afslutter kørsler, der hang (funktionen blev afbrudt): kaldes af edge-funktionerne ved start.
create or replace function public.import_run_start(p_job text, p_trigger text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  update public.import_runs set status = 'failed', finished_at = now(), error_code = 'afbrudt'
    where job = p_job and status = 'running' and started_at < now() - interval '10 minutes';
  delete from public.import_runs where started_at < now() - interval '180 days';
  insert into public.import_runs (job, trigger) values (p_job, p_trigger) returning id into v_id;
  return v_id;
exception when unique_violation then
  return null; -- der kører allerede en kørsel af samme slags
end;
$$;
revoke all on function public.import_run_start(text, text) from public, anon, authenticated;
grant execute on function public.import_run_start(text, text) to service_role;
