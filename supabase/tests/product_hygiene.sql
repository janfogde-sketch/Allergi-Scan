-- EAN- og navnehygiejne (to do d6638639): triggeren på products skal normalisere stregkoder og navne.
-- Alt rulles tilbage til sidst.
begin;

insert into products (ean, name, source) values
  ('499041601114', '  Creme   fraiche ', 'user'),        -- 12 cifre, gyldigt som 13 med foranstillet nul
  ('259804', 'BUTIKSNUMMER KAGE', 'bilka'),              -- internt varenummer: ean røres ikke
  ('3364048109147', 'COGNAC VSOP', 'bilka'),             -- versaler -> normal skrift, VSOP bevares
  ('5714946004583', 'IPA', 'bilka');                     -- kort enkeltord i versaler røres ikke

do $$
begin
  if (select count(*) from products where ean = '0499041601114' and name = 'Creme fraiche') <> 1 then
    raise exception 'EAN eller mellemrum ikke normaliseret';
  end if;
  if not exists (select 1 from products where ean = '259804' and name = 'Butiksnummer kage') then
    raise exception 'Internt varenummer må ikke ændres, navnet skal have normal skrift';
  end if;
  if not exists (select 1 from products where ean = '3364048109147' and name = 'Cognac VSOP') then
    raise exception 'Versaler/VSOP forkert';
  end if;
  if not exists (select 1 from products where ean = '5714946004583' and name = 'IPA') then
    raise exception 'IPA må ikke ændres';
  end if;
  if public.normalize_product_ean('099999999999') <> '099999999999' then
    raise exception 'Ugyldigt GTIN må ikke ændres';
  end if;
  if has_function_privilege('anon', 'public.normalize_product_ean(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.clean_product_name(text)', 'EXECUTE') then
    raise exception 'Hjælpefunktionerne må ikke kunne kaldes udefra';
  end if;
end $$;

rollback;
