-- Udtrykkeligt samtykke til helbredsoplysninger (GDPR art. 9, stk. 2, litra a) — 2. okt. 2026.
-- Samtykket logges kun af serveren (tidspunkt + version) via RPC; brugeren kan ikke skrive direkte i loggen.
-- Tilbagetrækning sletter helbredsdata (egne allergier, familieprofilernes allergener, følsomhed, E-numre, scanningshistorik,
-- allergen-beskeder) i én transaktion. Databasen kræver samtykke for at gemme allergener (RLS + triggere).

create table if not exists public.consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('health')),
  action text not null check (action in ('given', 'withdrawn')),
  version text not null check (char_length(version) between 1 and 40),
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists consent_log_user_kind_idx on public.consent_log (user_id, kind, created_at desc);
alter table public.consent_log enable row level security;
revoke all on public.consent_log from anon, authenticated;
grant select on public.consent_log to authenticated;
drop policy if exists consent_log_select_own_or_admin on public.consent_log;
create policy consent_log_select_own_or_admin on public.consent_log for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

create or replace function public.has_health_consent(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select action = 'given' from public.consent_log
                   where user_id = p_user and kind = 'health' order by created_at desc, id desc limit 1), false);
$$;
revoke execute on function public.has_health_consent(uuid) from public, anon;
grant execute on function public.has_health_consent(uuid) to authenticated, service_role;

create or replace function public.give_health_consent(p_version text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_at timestamptz;
begin
  if v_uid is null then raise exception 'Ikke logget ind' using errcode = '42501'; end if;
  if p_version is null or char_length(p_version) not between 1 and 40 then raise exception 'Ugyldig version'; end if;
  if public.has_health_consent(v_uid) then
    select created_at into v_at from public.consent_log
      where user_id = v_uid and kind = 'health' and action = 'given' order by created_at desc, id desc limit 1;
    return v_at;
  end if;
  insert into public.consent_log (user_id, kind, action, version) values (v_uid, 'health', 'given', p_version)
    returning created_at into v_at;
  return v_at;
end $$;
revoke execute on function public.give_health_consent(text) from public, anon;
grant execute on function public.give_health_consent(text) to authenticated;

create or replace function public.withdraw_health_consent()
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_at timestamptz; v_version text;
begin
  if v_uid is null then raise exception 'Ikke logget ind' using errcode = '42501'; end if;
  select version into v_version from public.consent_log
    where user_id = v_uid and kind = 'health' and action = 'given' order by created_at desc, id desc limit 1;
  delete from public.user_allergens
    where user_id = v_uid or family_member_id in (select id from public.family_members where user_id = v_uid);
  update public.family_members set allergens = '[]'::jsonb, custom_allergens = '[]'::jsonb, allergen_levels = '{}'::jsonb, e_numbers = '[]'::jsonb
    where user_id = v_uid;
  update public.users set allergen_levels = '{}'::jsonb, e_numbers = '[]'::jsonb where id = v_uid;
  delete from public.scan_history where user_id = v_uid;
  delete from public.notifications where user_id = v_uid and type = 'P1';
  insert into public.consent_log (user_id, kind, action, version)
    values (v_uid, 'health', 'withdrawn', coalesce(v_version, 'ukendt')) returning created_at into v_at;
  return v_at;
end $$;
revoke execute on function public.withdraw_health_consent() from public, anon;
grant execute on function public.withdraw_health_consent() to authenticated;

-- RLS: allergener (egne og familieprofilers) kan kun gemmes med samtykke; admin er undtaget (redigerer for andre).
drop policy if exists "Brugere kan oprette egne allergener" on public.user_allergens;
create policy "Brugere kan oprette egne allergener" on public.user_allergens for insert to authenticated
  with check (
    (((user_id = (select auth.uid()))
      or exists (select 1 from public.family_members fm where fm.id = user_allergens.family_member_id and fm.user_id = (select auth.uid())))
     and public.has_health_consent((select auth.uid())))
    or public.is_admin((select auth.uid())));

drop policy if exists "Brugere kan opdatere egne allergener" on public.user_allergens;
create policy "Brugere kan opdatere egne allergener" on public.user_allergens for update to authenticated
  using ((user_id = (select auth.uid()))
      or exists (select 1 from public.family_members fm where fm.id = user_allergens.family_member_id and fm.user_id = (select auth.uid()))
      or public.is_admin((select auth.uid())))
  with check (public.has_health_consent((select auth.uid())) or public.is_admin((select auth.uid())));

-- Triggere for de jsonb-kolonner, RLS ikke kan begrænse pr. kolonne. auth.uid() er null for service role/interne kald (springes over).
create or replace function public.enforce_health_consent_users()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin(auth.uid()) then return new; end if;
  if new.allergen_levels is distinct from old.allergen_levels
     and coalesce(new.allergen_levels, '{}'::jsonb) <> '{}'::jsonb
     and not public.has_health_consent(auth.uid()) then
    raise exception 'Samtykke til helbredsoplysninger mangler' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.enforce_health_consent_users() from public, anon, authenticated;
drop trigger if exists enforce_health_consent_users on public.users;
create trigger enforce_health_consent_users before update of allergen_levels on public.users
  for each row execute function public.enforce_health_consent_users();

create or replace function public.enforce_health_consent_family()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_has boolean;
begin
  if auth.uid() is null or public.is_admin(auth.uid()) then return new; end if;
  v_has := coalesce(new.allergens, '[]'::jsonb) <> '[]'::jsonb
        or coalesce(new.custom_allergens, '[]'::jsonb) <> '[]'::jsonb
        or coalesce(new.allergen_levels, '{}'::jsonb) <> '{}'::jsonb;
  if v_has and (tg_op = 'INSERT'
      or new.allergens is distinct from old.allergens
      or new.custom_allergens is distinct from old.custom_allergens
      or new.allergen_levels is distinct from old.allergen_levels)
     and not public.has_health_consent(auth.uid()) then
    raise exception 'Samtykke til helbredsoplysninger mangler' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.enforce_health_consent_family() from public, anon, authenticated;
drop trigger if exists enforce_health_consent_family on public.family_members;
create trigger enforce_health_consent_family before insert or update on public.family_members
  for each row execute function public.enforce_health_consent_family();
