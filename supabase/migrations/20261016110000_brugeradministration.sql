-- Brugeradministration (Bjørn, 16. okt. 2026; plan godkendt i tråden). Håndhæver på serveren det, panelet før kun lovede i skærmbilledet:
-- 1) En administrator kan ikke ændre sin egen rolle (før kun låst i UI'et). Sidste-admin-spærren (guard_last_admin) er uændret.
-- 2) admin_set_role(): rolleskift via én funktion; ændringen logges af den eksisterende udløser (rolle_aendret, fra/til, admin).
-- 3) admin_get_user(): henter ÉN brugers oplysninger; allergier, E-numre og spor hentes kun, når de bedes om (dataminimering), og der returneres
--    en versionsnøgle, så en gemning aldrig overskriver en nyere ændring (fra en anden administrator eller brugeren selv).
-- 4) admin_save_user_profile(): navn, fødselsår og køn kan ændres uden begrundelse; e-mail, rolle og onboardingstatus kan IKKE længere ændres
--    her (e-mail er login-adressen i Supabase Auth, onboarding er en faktisk status). Ændring af allergipræferencer kræver en begrundelse og
--    logges som ÉN post med antal og begrundelse (aldrig hvilke allergier). Null-parametre og manglende nøgler lader værdien stå.
-- 5) admin_user_delete_summary(): kun tal (familieprofiler, lister mv.), så panelet kan sige, hvad en sletning rammer.
-- Alt er kun for administratorer; anonyme og almindelige brugere får 42501.

-- 1) Egen rolle kan ikke ændres. (auth.uid() er tom ved SQL-editor og service-nøgle; de afvises som før, fordi de ikke er administratorer.)
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := (select auth.uid());
begin
  if new.role is distinct from old.role then
    if not is_admin(v_uid) then
      raise exception 'Kun administratorer kan ændre rolle';
    end if;
    if new.id = v_uid then
      raise exception 'Du kan ikke ændre din egen rolle';
    end if;
  end if;
  return new;
end;
$function$;

-- 2) Rolleskift
create or replace function public.admin_set_role(p_user uuid, p_role text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('user', 'admin') then
    raise exception 'Ugyldig rolle' using errcode = '22023';
  end if;
  update public.users set role = p_role where id = p_user;
  if not found then
    raise exception 'Bruger ikke fundet' using errcode = 'P0002';
  end if;
  return jsonb_build_object('role', p_role);
end;
$$;

-- Versionsnøgle over de felter, panelet kan gemme (aldrig udleveret som data, kun som md5)
create or replace function public.admin_user_version(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select md5(jsonb_build_object(
    'name', u.name, 'birth_year', u.birth_year, 'gender', u.gender, 'e_numbers', u.e_numbers, 'levels', u.allergen_levels,
    'allergens', coalesce((select jsonb_agg(a.allergen order by a.allergen) from public.user_allergens a where a.user_id = u.id and a.family_member_id is null and a.type = 'allergen'), '[]'::jsonb),
    'custom', coalesce((select jsonb_agg(a.allergen order by a.allergen) from public.user_allergens a where a.user_id = u.id and a.family_member_id is null and a.type = 'custom'), '[]'::jsonb)
  )::text) from public.users u where u.id = p_user;
$$;
revoke all on function public.admin_user_version(uuid) from public, anon, authenticated;

-- 3) Hent én bruger
create or replace function public.admin_get_user(p_user uuid, p_with_preferences boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  u record;
  v jsonb;
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  select id, name, email, role, created_at, onboarding_completed, onboarding_step, birth_year, gender, e_numbers, allergen_levels,
         (select a.email_confirmed_at is not null from auth.users a where a.id = public.users.id) as email_confirmed
    into u from public.users where id = p_user;
  if not found then
    raise exception 'Bruger ikke fundet' using errcode = 'P0002';
  end if;
  v := jsonb_build_object(
    'id', u.id, 'name', u.name, 'email', u.email, 'role', u.role, 'created_at', u.created_at,
    'onboarding_completed', u.onboarding_completed, 'onboarding_step', u.onboarding_step, 'birth_year', u.birth_year, 'gender', u.gender, 'email_confirmed', u.email_confirmed,
    'version', public.admin_user_version(p_user)
  );
  if p_with_preferences then
    v := v || jsonb_build_object(
      'e_numbers', u.e_numbers, 'allergen_levels', u.allergen_levels,
      'allergens', coalesce((select jsonb_agg(a.allergen order by a.allergen) from public.user_allergens a where a.user_id = p_user and a.family_member_id is null and a.type = 'allergen'), '[]'::jsonb),
      'custom', coalesce((select jsonb_agg(a.allergen order by a.allergen) from public.user_allergens a where a.user_id = p_user and a.family_member_id is null and a.type = 'custom'), '[]'::jsonb)
    );
  end if;
  return v;
end;
$$;

-- 4) Gem profil og præferencer
drop function if exists public.admin_save_user_profile(uuid, jsonb, text[], text[]);
create or replace function public.admin_save_user_profile(
  p_user uuid,
  p_profile jsonb,
  p_allergens text[] default null,
  p_custom text[] default null,
  p_reason text default null,
  p_version text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := (select auth.uid());
  u record;
  v_reason text := left(btrim(coalesce(p_reason, '')), 300);
  v_old_a text[]; v_old_c text[]; v_new_a text[]; v_new_c text[];
  v_levels jsonb; v_enums jsonb;
  v_add int := 0; v_rem int := 0; v_cadd int := 0; v_crem int := 0; v_lvl int := 0; v_enum boolean := false;
  v_pref_changed boolean;
begin
  if not public.is_admin(v_admin) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  select * into u from public.users where id = p_user for update;
  if not found then
    raise exception 'Bruger ikke fundet' using errcode = 'P0002';
  end if;
  if p_version is not null and p_version <> public.admin_user_version(p_user) then
    raise exception 'Brugeren er ændret, siden du åbnede den. Hent igen, før du gemmer.' using errcode = '40001';
  end if;

  select coalesce(array_agg(allergen order by allergen), '{}') into v_old_a from public.user_allergens where user_id = p_user and family_member_id is null and type = 'allergen';
  select coalesce(array_agg(allergen order by allergen), '{}') into v_old_c from public.user_allergens where user_id = p_user and family_member_id is null and type = 'custom';
  v_new_a := case when p_allergens is null then v_old_a else coalesce((select array_agg(distinct a order by a) from (select trim(x) a from unnest(p_allergens) x) s where a <> ''), '{}') end;
  v_new_c := case when p_custom is null then v_old_c else coalesce((select array_agg(distinct c order by c) from (select trim(x) c from unnest(p_custom) x) s where c <> ''), '{}') end;
  v_levels := case when p_profile ? 'allergen_levels' then coalesce(p_profile -> 'allergen_levels', '{}'::jsonb) else u.allergen_levels end;
  v_enums := case when p_profile ? 'e_numbers' then coalesce(p_profile -> 'e_numbers', '[]'::jsonb) else u.e_numbers end;

  v_add := (select count(*) from unnest(v_new_a) x where x <> all (v_old_a));
  v_rem := (select count(*) from unnest(v_old_a) x where x <> all (v_new_a));
  v_cadd := (select count(*) from unnest(v_new_c) x where x <> all (v_old_c));
  v_crem := (select count(*) from unnest(v_old_c) x where x <> all (v_new_c));
  v_lvl := (select count(*) from (select key from jsonb_each_text(v_levels) union select key from jsonb_each_text(u.allergen_levels)) k
             where (v_levels -> k.key) is distinct from (u.allergen_levels -> k.key));
  v_enum := v_enums is distinct from u.e_numbers;
  v_pref_changed := (v_add + v_rem + v_cadd + v_crem + v_lvl) > 0 or v_enum;
  if v_pref_changed and v_reason = '' then
    raise exception 'En begrundelse er påkrævet, når allergipræferencer ændres' using errcode = '22023';
  end if;

  -- E-mail (login-adressen i Supabase Auth), rolle og onboardingstatus ændres ALDRIG herfra.
  update public.users
     set name = case when p_profile ? 'name' then nullif(btrim(p_profile ->> 'name'), '') else name end,
         birth_year = case when p_profile ? 'birth_year' then nullif(p_profile ->> 'birth_year', '')::integer else birth_year end,
         gender = case when p_profile ? 'gender' then nullif(p_profile ->> 'gender', '') else gender end,
         e_numbers = v_enums,
         allergen_levels = v_levels
   where id = p_user;

  if p_allergens is not null or p_custom is not null then
    perform set_config('app.admin_save_profile', '1', true); -- den samlede logpost nedenfor erstatter udløserens
    if p_allergens is not null then
      delete from public.user_allergens where user_id = p_user and family_member_id is null and type = 'allergen';
      insert into public.user_allergens (user_id, allergen, type) select p_user, a, 'allergen' from unnest(v_new_a) a;
    end if;
    if p_custom is not null then
      delete from public.user_allergens where user_id = p_user and family_member_id is null and type = 'custom';
      insert into public.user_allergens (user_id, allergen, type) select p_user, c, 'custom' from unnest(v_new_c) c;
    end if;
    perform set_config('app.admin_save_profile', '', true);
  end if;

  if v_pref_changed then
    insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
      values (v_admin, 'brugerpraeferencer_aendret', 'users', p_user::text,
              jsonb_build_object('begrundelse', v_reason, 'allergener_tilfoejet', v_add, 'allergener_fjernet', v_rem,
                                 'egne_tilfoejet', v_cadd, 'egne_fjernet', v_crem, 'sporindstillinger_aendret', v_lvl, 'enumre_aendret', v_enum));
  end if;
  return jsonb_build_object('version', public.admin_user_version(p_user), 'praeferencer_aendret', v_pref_changed);
end;
$$;

-- Udløseren på user_allergens springer over, når funktionen ovenfor selv logger (én post i stedet for to)
create or replace function public.trg_admin_audit_user_allergens()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := (select auth.uid());
begin
  if v_admin is null or not public.is_admin(v_admin) then
    return null;
  end if;
  if coalesce(current_setting('app.admin_save_profile', true), '') = '1' then
    return null;
  end if;
  insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
    select v_admin, 'brugerallergier_aendret', 'users', r.user_id::text,
           jsonb_build_object('handling', case tg_op when 'INSERT' then 'tilføjet' else 'fjernet' end, 'antal', count(*))
      from changed_rows r
      where r.user_id is not null and r.user_id <> v_admin
      group by r.user_id;
  return null;
end;
$$;
revoke all on function public.trg_admin_audit_user_allergens() from public, anon, authenticated;

-- 5) Hvad rammer en sletning? Kun tal.
create or replace function public.admin_user_delete_summary(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  if not exists (select 1 from public.users where id = p_user) then
    raise exception 'Bruger ikke fundet' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'is_admin', (select role = 'admin' from public.users where id = p_user),
    'family_profiles_owned', (select count(*) from public.family_members where family_owner_id = p_user and user_id is distinct from p_user),
    'family_links', (select count(*) from public.family_members where user_id = p_user and family_owner_id is distinct from p_user),
    'invites_sent', (select count(*) from public.family_invites where invited_by = p_user),
    'shopping_lists_owned', (select count(*) from public.shopping_lists where owner_id = p_user),
    'scan_history', (select count(*) from public.scan_history where user_id = p_user)
  );
end;
$$;

revoke all on function public.admin_set_role(uuid, text) from public, anon;
revoke all on function public.admin_get_user(uuid, boolean) from public, anon;
revoke all on function public.admin_save_user_profile(uuid, jsonb, text[], text[], text, text) from public, anon;
revoke all on function public.admin_user_delete_summary(uuid) from public, anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_get_user(uuid, boolean) to authenticated;
grant execute on function public.admin_save_user_profile(uuid, jsonb, text[], text[], text, text) to authenticated;
grant execute on function public.admin_user_delete_summary(uuid) to authenticated;
