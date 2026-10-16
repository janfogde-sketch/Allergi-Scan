-- Ukendte stregkoder (16. okt. 2026): administrationssiden kunne aldrig se registreringerne, fordi tabellen kun havde reglen "Kun service role" (using false) og
-- siden læste direkte med administratorens nøgle. Registreringen i sig virker (log_missing_ean). Nu: administratorer kan læse via to funktioner, en behandlingsstatus
-- gemmes (ny/under behandling/afvist; "oprettet" afledes af produkttabellen, så den altid stemmer med produktdatabasen), og gentagne forsøg inden for 30 sekunder
-- tælles ikke (automatiske genforsøg). Ingen brugeroplysninger gemmes eller vises; antal unikke brugere kan ikke opgøres, fordi registreringen ikke har brugeren.
alter table public.missing_ean_log add column if not exists status text not null default 'new';
alter table public.missing_ean_log add column if not exists status_updated_at timestamptz;
alter table public.missing_ean_log drop constraint if exists missing_ean_log_status_check;
alter table public.missing_ean_log add constraint missing_ean_log_status_check check (status in ('new', 'in_progress', 'rejected'));

-- Tæller kun forsøg, der ikke er genforsøg (inden for 30 sekunder). En afvist kode forbliver afvist; en kode, der er "under behandling", forbliver det.
create or replace function public.log_missing_ean(p_ean text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into missing_ean_log (ean, count, first_seen, last_seen)
  values (p_ean, 1, now(), now())
  on conflict (ean) do update
  set count = case when missing_ean_log.last_seen > now() - interval '30 seconds' then missing_ean_log.count else missing_ean_log.count + 1 end,
      last_seen = now();
end;
$function$;

-- Oversigt: søgning på EAN, status (afledt), periode (sidste forsøg), sortering og sider. Produkt-id vises, hvis produktet nu findes.
create or replace function public.admin_missing_eans(p_search text default null, p_status text default null, p_days integer default null,
                                                     p_sort text default 'count', p_limit integer default 50, p_offset integer default 0)
returns table (ean text, attempts integer, first_seen timestamptz, last_seen timestamptz, status text, product_id uuid, product_name text, total_count bigint)
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
  with base as (
    select m.ean, coalesce(m.count, 1) as attempts, m.first_seen, m.last_seen,
           case when p.id is not null then 'created' else m.status end as status, p.id as product_id, p.name as product_name
      from public.missing_ean_log m
      left join public.products p on p.ean = m.ean
     where (p_search is null or p_search = '' or m.ean like replace(replace(p_search, '%', ''), '_', '') || '%')
       and (p_days is null or m.last_seen >= now() - make_interval(days => p_days))
  )
  select b.ean, b.attempts::integer, b.first_seen, b.last_seen, b.status, b.product_id, b.product_name, count(*) over ()
    from base b
   where p_status is null or p_status = '' or b.status = p_status
   order by case when p_sort = 'last_seen' then null else b.attempts end desc nulls last, b.last_seen desc, b.ean
   limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

-- Tællere til siden: ubehandlede (ny og endnu uden produkt), under behandling, oprettede og afviste, uanset filter.
create or replace function public.admin_missing_ean_summary()
returns table (total bigint, new_count bigint, in_progress bigint, created bigint, rejected bigint)
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
  select count(*),
         count(*) filter (where p.id is null and m.status = 'new'),
         count(*) filter (where p.id is null and m.status = 'in_progress'),
         count(*) filter (where p.id is not null),
         count(*) filter (where p.id is null and m.status = 'rejected')
    from public.missing_ean_log m left join public.products p on p.ean = m.ean;
end;
$$;

-- Ændrer behandlingsstatus (ny, under behandling, afvist) og logger det i aktivitetsloggen. At åbne en registrering ændrer intet.
create or replace function public.admin_set_missing_ean_status(p_ean text, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := (select auth.uid());
  v_old text;
begin
  if not public.is_admin(v_admin) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  if p_status not in ('new', 'in_progress', 'rejected') then
    raise exception 'Ugyldig status' using errcode = '22023';
  end if;
  select status into v_old from public.missing_ean_log where ean = p_ean for update;
  if not found then
    raise exception 'Stregkoden findes ikke' using errcode = 'P0002';
  end if;
  if v_old is distinct from p_status then
    update public.missing_ean_log set status = p_status, status_updated_at = now() where ean = p_ean;
    insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
      values (v_admin, 'ukendt_stregkode_status', 'missing_ean_log', p_ean, jsonb_build_object('ean', p_ean, 'fra', v_old, 'til', p_status));
  end if;
end;
$$;

revoke all on function public.admin_missing_eans(text, text, integer, text, integer, integer) from public, anon;
revoke all on function public.admin_missing_ean_summary() from public, anon;
revoke all on function public.admin_set_missing_ean_status(text, text) from public, anon;
grant execute on function public.admin_missing_eans(text, text, integer, text, integer, integer) to authenticated;
grant execute on function public.admin_missing_ean_summary() to authenticated;
grant execute on function public.admin_set_missing_ean_status(text, text) to authenticated;
