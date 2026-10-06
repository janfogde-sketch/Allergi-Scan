-- Gem allergier, egne valg, spor-valg og E-numre i ét kald (én transaktion).
-- Før: app'en slettede først alle rækker og sendte så de nye i et andet kald; et netudfald imellem
-- efterlod en tom allergiliste. Nu lykkes alt eller intet. SECURITY INVOKER: RLS (inkl. helbredssamtykke) gælder uændret.
create or replace function public.save_my_allergens(
  p_allergens text[],
  p_custom text[],
  p_e_numbers jsonb,
  p_allergen_levels jsonb,
  p_diets jsonb default null
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  update public.users
     set e_numbers = coalesce(p_e_numbers, '[]'::jsonb),
         allergen_levels = coalesce(p_allergen_levels, '{}'::jsonb),
         diets = coalesce(p_diets, diets)
   where id = v_uid;
  if not found then
    raise exception 'user row not found' using errcode = 'P0002';
  end if;

  delete from public.user_allergens where user_id = v_uid and family_member_id is null;

  insert into public.user_allergens (user_id, allergen, type)
  select v_uid, a, 'allergen' from unnest(coalesce(p_allergens, '{}')) a
  union all
  select v_uid, c, 'custom' from unnest(coalesce(p_custom, '{}')) c;
end;
$$;

revoke all on function public.save_my_allergens(text[], text[], jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_my_allergens(text[], text[], jsonb, jsonb, jsonb) to authenticated;
