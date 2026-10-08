-- To do a9b909ed: nye (og ændrede) varer uden ingrediensliste skal stå som "unknown", aldrig "nej" eller tomt.
-- Gælder alle veje ind (products, auto-import-off, Bilka-import, indsendelser), fordi reglen ligger i databasen.
-- Uændret: "yes"/"traces" (kendt indhold fra fx Open Food Facts' egne tags), producent-verificerede varer.
-- Rollback: drop trigger trg_products_unknown_without_ingredients on public.products;

create or replace function public.products_unknown_without_ingredients()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  k text;
  v text;
  new_flags jsonb := '{}'::jsonb;
  keys text[] := array['aeg','fisk','soja','hvede','lupin','sesam','svovl','gluten','sennep','laktose',
                       'noedder','selleri','skaldyr','bloeddyr','jordnoedder','maelkeallergi'];
begin
  if new.ingredients_text is not null and btrim(new.ingredients_text) <> '' then
    return new;
  end if;
  if coalesce(new.verified_status, '') = 'verified' or coalesce(new.source, '') = 'producer' then
    return new;
  end if;
  -- ved ændring: kun når ingrediensliste eller flag faktisk er ændret
  if tg_op = 'UPDATE'
     and new.ingredients_text is not distinct from old.ingredients_text
     and new.allergen_flags is not distinct from old.allergen_flags then
    return new;
  end if;

  foreach k in array keys loop
    v := lower(coalesce(new.allergen_flags ->> k, ''));
    if v in ('yes', 'traces', 'true') then
      new_flags := new_flags || jsonb_build_object(k, case when v = 'true' then 'yes' else v end);
    else
      new_flags := new_flags || jsonb_build_object(k, 'unknown');
    end if;
  end loop;

  new.allergen_flags := new_flags;
  if coalesce(new.allergen_quality, '') in ('', 'pending', 'medium', 'high') then
    new.allergen_quality := 'low';
  end if;
  return new;
end;
$$;

revoke execute on function public.products_unknown_without_ingredients() from public, anon, authenticated;

drop trigger if exists trg_products_unknown_without_ingredients on public.products;
create trigger trg_products_unknown_without_ingredients
  before insert or update on public.products
  for each row execute function public.products_unknown_without_ingredients();
