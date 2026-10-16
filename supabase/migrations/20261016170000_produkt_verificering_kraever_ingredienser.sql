-- Produkter: et produkt kan ikke markeres som "verified" uden en ingrediensliste (16. okt. 2026, Bjørn og Jan).
-- Baggrund: "Ikke påvist" for et allergen kræver en registreret ingrediensliste, og et ufuldstændigt produkt må ikke fremstå verificeret. Reglen ligger i databasen,
-- så den gælder alle veje ind (admin-panelet, importer, funktioner). Ingen eksisterende rækker ændres (0 produkter er "verified" i dag); kun nye overgange til "verified" afvises.
-- Rollback: drop trigger trg_products_verified_needs_ingredients on public.products;

create or replace function public.products_verified_needs_ingredients()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.verified_status = 'verified'
     and (tg_op = 'INSERT' or old.verified_status is distinct from 'verified')
     and coalesce(btrim(new.ingredients_text), '') = '' then
    raise exception 'Et produkt uden ingrediensliste kan ikke markeres som verificeret' using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke execute on function public.products_verified_needs_ingredients() from public, anon, authenticated;

drop trigger if exists trg_products_verified_needs_ingredients on public.products;
create trigger trg_products_verified_needs_ingredients
  before insert or update of verified_status on public.products
  for each row execute function public.products_verified_needs_ingredients();
