-- Admins ændring af en brugers profil og allergier i ÉN transaktion (to do b9a16fdb, G28).
-- Før sendte panelet tre kald (profil, slet allergier, indsæt allergier); et netudfald efter sletningen efterlod personen uden
-- allergier. Nu lykkes alt eller intet. Samme opbygning som save_my_allergens.
-- security invoker: adgangsreglerne (RLS) og adminloggens udløsere på users og user_allergens gælder som før.
create or replace function public.admin_save_user_profile(
  p_user uuid,
  p_profile jsonb,
  p_allergens text[],
  p_custom text[]
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;

  update public.users
     set name = nullif(p_profile->>'name', ''),
         email = nullif(p_profile->>'email', ''),
         role = coalesce(nullif(p_profile->>'role', ''), role),
         birth_year = nullif(p_profile->>'birth_year', '')::integer,
         gender = nullif(p_profile->>'gender', ''),
         e_numbers = coalesce(p_profile->'e_numbers', '[]'::jsonb),
         allergen_levels = coalesce(p_profile->'allergen_levels', '{}'::jsonb),
         onboarding_completed = coalesce((p_profile->>'onboarding_completed')::boolean, onboarding_completed)
   where id = p_user;
  if not found then
    raise exception 'Bruger ikke fundet' using errcode = 'P0002';
  end if;

  delete from public.user_allergens where user_id = p_user and family_member_id is null;

  insert into public.user_allergens (user_id, allergen, type)
  select p_user, a, 'allergen'
    from (select distinct trim(x) a from unnest(coalesce(p_allergens, '{}')) x) s where a <> '';

  insert into public.user_allergens (user_id, allergen, type)
  select p_user, c, 'custom'
    from (select distinct trim(x) c from unnest(coalesce(p_custom, '{}')) x) s where c <> '';
end;
$$;

revoke all on function public.admin_save_user_profile(uuid, jsonb, text[], text[]) from public, anon;
grant execute on function public.admin_save_user_profile(uuid, jsonb, text[], text[]) to authenticated;
