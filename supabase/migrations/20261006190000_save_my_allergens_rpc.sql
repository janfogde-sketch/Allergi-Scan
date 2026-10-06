-- F2-2 (6. okt. 2026): allergier, egne valg, spor-valg og E-numre gemmes i ÉN transaktion.
-- Før: appen slettede alle rækker og sendte de nye i et andet kald (og spor/E-numre i et tredje);
-- et netudfald imellem efterlod en tom eller halv allergiliste. Nu lykkes alt eller intet.
-- De tre sidste parametre er valgfrie: udeladt (null) røres feltet ikke.
-- security invoker: RLS (inkl. kravet om helbredssamtykke ved INSERT) gælder som før.
create or replace function public.save_my_allergens(
  p_allergens text[],
  p_custom text[],
  p_e_numbers jsonb default null,
  p_allergen_levels jsonb default null,
  p_diets jsonb default null
) returns void
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

  if p_e_numbers is not null or p_allergen_levels is not null or p_diets is not null then
    update public.users
       set e_numbers = coalesce(p_e_numbers, e_numbers),
           allergen_levels = coalesce(p_allergen_levels, allergen_levels),
           diets = coalesce(p_diets, diets)
     where id = v_uid;
    if not found then
      raise exception 'user row not found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.user_allergens where user_id = v_uid and family_member_id is null;

  insert into public.user_allergens (user_id, allergen, type)
  select v_uid, a, 'allergen'
    from (select distinct trim(x) a from unnest(coalesce(p_allergens, '{}')) x) s where a <> '';

  insert into public.user_allergens (user_id, allergen, type)
  select v_uid, c, 'custom'
    from (select distinct trim(x) c from unnest(coalesce(p_custom, '{}')) x) s where c <> '';
end;
$$;

revoke all on function public.save_my_allergens(text[], text[], jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_my_allergens(text[], text[], jsonb, jsonb, jsonb) to authenticated;
