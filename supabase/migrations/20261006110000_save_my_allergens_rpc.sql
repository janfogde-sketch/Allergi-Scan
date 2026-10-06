-- F2-2 (6. okt. 2026): brugerens egne allergier gemmes i én transaktion.
-- Før: DELETE + POST som to kald; fejlede POST, stod brugeren uden allergier.
-- security invoker: RLS (inkl. kravet om helbredssamtykke ved INSERT) gælder som før.
create or replace function public.save_my_allergens(p_allergens text[], p_custom text[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  delete from public.user_allergens
   where user_id = v_uid and family_member_id is null;

  insert into public.user_allergens (user_id, allergen, type)
  select v_uid, a, 'allergen'
    from (select distinct trim(x) a from unnest(coalesce(p_allergens, '{}')) x) s
   where a <> '';

  insert into public.user_allergens (user_id, allergen, type)
  select v_uid, c, 'custom'
    from (select distinct trim(x) c from unnest(coalesce(p_custom, '{}')) x) s
   where c <> '';
end;
$$;

revoke execute on function public.save_my_allergens(text[], text[]) from public, anon;
grant execute on function public.save_my_allergens(text[], text[]) to authenticated;
