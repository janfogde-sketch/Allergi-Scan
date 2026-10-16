-- Frafald i onboarding (Bjørn, 16. okt. 2026; opgaven delegeret i tråden). Gør onboardingstatus pålidelig og målbar på serveren:
-- 1) Tre små, dataminimerende felter på users: onboarding_max_step (højeste registrerede trin), onboarding_progress_at (sidste registrerede fremgang)
--    og onboarding_completed_at. De vedligeholdes af en udløser, så en klient aldrig selv kan opdigte dem. Ingen ny tabel, ingen hændelseslog pr. bruger;
--    felterne slettes sammen med kontoen.
-- 2) Serverkontrol af "gennemført": onboarding kan kun markeres som gennemført, når de obligatoriske trin er opfyldt (navn, alder og køn; samtykke til
--    helbredsoplysninger, hvis der er gemt helbredsdata). Trin 3-5 er valgfrie, og et sprunget valgfrit trin tæller ikke som frafald. SQL-editor og
--    service-nøgle (ingen login) er undtaget, så rettelser og tests kan køres.
-- 3) admin_onboarding_stats(): kun samlede tal for en periode (kohorten = konti oprettet i perioden, dansk tid), ingen oplysninger om enkelte brugere.
-- Historik opfindes ikke: max_step og fremgang kendes kun for konti, der var uafsluttede ved udgivelsen, og for alle nye konti.

alter table public.users add column if not exists onboarding_max_step integer;
alter table public.users add column if not exists onboarding_progress_at timestamptz;
alter table public.users add column if not exists onboarding_completed_at timestamptz;

-- Eksisterende uafsluttede konti: højeste trin = nuværende trin (det er faktisk nået). Sidste fremgang kendes kun, hvis rækken er ændret efter oprettelsen.
update public.users
   set onboarding_max_step = onboarding_step,
       onboarding_progress_at = case when updated_at is not null and updated_at > created_at + interval '1 minute' then updated_at end
 where onboarding_completed is not true and onboarding_max_step is null;

create or replace function public.trg_onboarding_track()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.onboarding_max_step := new.onboarding_step;
    return new;
  end if;
  if new.onboarding_step is distinct from old.onboarding_step then
    new.onboarding_max_step := greatest(coalesce(old.onboarding_max_step, old.onboarding_step), new.onboarding_step);
    new.onboarding_progress_at := now();
  end if;
  if new.onboarding_completed is true and old.onboarding_completed is distinct from true then
    new.onboarding_completed_at := now();
    new.onboarding_progress_at := now();
    new.onboarding_max_step := greatest(coalesce(new.onboarding_max_step, old.onboarding_max_step, old.onboarding_step), new.onboarding_step);
  elsif new.onboarding_completed is not true and old.onboarding_completed is true then
    new.onboarding_completed_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists onboarding_track_trigger on public.users;
create trigger onboarding_track_trigger before insert or update of onboarding_step, onboarding_completed on public.users
  for each row execute function public.trg_onboarding_track();

-- Serverkontrol af gennemført onboarding
create or replace function public.trg_onboarding_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.onboarding_completed is true and old.onboarding_completed is distinct from true and (select auth.uid()) is not null then
    if btrim(coalesce(new.name, '')) = '' or new.birth_year is null or new.gender is null then
      raise exception 'Onboarding kan først afsluttes, når navn, alder og køn er udfyldt' using errcode = '23514';
    end if;
    if (exists (select 1 from public.user_allergens where user_id = new.id and family_member_id is null)
        or coalesce(new.e_numbers, '[]'::jsonb) <> '[]'::jsonb)
       and not public.has_health_consent(new.id) then
      raise exception 'Onboarding kan først afsluttes, når samtykket til helbredsoplysninger er givet' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.trg_onboarding_guard() from public, anon, authenticated;
drop trigger if exists onboarding_guard_trigger on public.users;
create trigger onboarding_guard_trigger before update of onboarding_completed on public.users
  for each row execute function public.trg_onboarding_guard();

-- Samlede tal til admin-panelet. Statusserne overlapper aldrig: gennemført, e-mail ikke bekræftet, ikke startet (ingen registreret fremgang),
-- igangværende (fremgang inden for 24 timer) og muligt frafald (ingen fremgang i over 24 timer).
create or replace function public.admin_onboarding_stats(p_from date, p_to date, p_include_test boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v jsonb;
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_from > p_to or p_to - p_from > 800 then
    raise exception 'Ugyldig periode' using errcode = '22023';
  end if;

  with base as (
    select u.id, u.created_at, u.onboarding_completed, u.onboarding_step, u.onboarding_max_step, u.onboarding_progress_at,
           (a.email_confirmed_at is not null) as confirmed,
           (u.id::text in (select jsonb_array_elements_text(coalesce((select f.value from public.app_flags f where f.key = 'notifications_test_users'), '[]'::jsonb)))
              or lower(coalesce(u.email, '')) ~ '@example\.(com|invalid)$') as is_test
      from public.users u left join auth.users a on a.id = u.id
     where (u.created_at at time zone 'Europe/Copenhagen')::date between p_from and p_to
  ), cls as (
    select b.*, case
        when b.onboarding_completed is true then 'completed'
        when not b.confirmed then 'unconfirmed'
        when b.onboarding_progress_at is null then 'not_started'
        when b.onboarding_progress_at >= now() - interval '24 hours' then 'in_progress'
        else 'possible_dropout' end as status
      from base b where p_include_test or not b.is_test
  )
  select jsonb_build_object(
    'from', p_from, 'to', p_to, 'include_test', p_include_test,
    'first_account', (select min(created_at) from public.users),
    'test_accounts', (select count(*) from base where is_test),
    'total', (select count(*) from cls),
    'completed', (select count(*) from cls where status = 'completed'),
    'in_progress', (select count(*) from cls where status = 'in_progress'),
    'possible_dropout', (select count(*) from cls where status = 'possible_dropout'),
    'not_started', (select count(*) from cls where status = 'not_started'),
    'unconfirmed', (select count(*) from cls where status = 'unconfirmed'),
    'steps', coalesce((select jsonb_agg(jsonb_build_object('step', s.step, 'latest', s.n, 'inactive', s.old) order by s.step)
        from (select onboarding_step as step, count(*) as n, count(*) filter (where status = 'possible_dropout') as old
                from cls where status in ('in_progress', 'possible_dropout') group by 1) s), '[]'::jsonb),
    'funnel_users', (select count(*) from cls where confirmed and onboarding_max_step is not null),
    'funnel', (select jsonb_agg(jsonb_build_object(
          'step', k,
          'reached', (select count(*) from cls where confirmed and onboarding_max_step is not null and (onboarding_completed is true or onboarding_max_step >= k)),
          'continued', (select count(*) from cls where confirmed and onboarding_max_step is not null and (onboarding_completed is true or onboarding_max_step > k))
        ) order by k) from generate_series(1, 5) k),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('date', d.day, 'created', d.n, 'completed', d.done) order by d.day)
        from (select (created_at at time zone 'Europe/Copenhagen')::date as day, count(*) as n, count(*) filter (where status = 'completed') as done
                from cls group by 1) d), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;
revoke all on function public.admin_onboarding_stats(date, date, boolean) from public, anon;
grant execute on function public.admin_onboarding_stats(date, date, boolean) to authenticated;
