-- EAN- og navnehygiejne (to do d6638639): triggeren på products skal normalisere stregkoder og navne.
-- Alt rulles tilbage til sidst.
begin;

insert into products (ean, name, source) values
  ('499041601114', '  Creme   fraiche ', 'user'),        -- 12 cifre, gyldigt som 13 med foranstillet nul
  ('259804', 'BUTIKSNUMMER KAGE', 'katalog'),            -- internt varenummer: ean røres ikke
  ('3364048109147', 'COGNAC VSOP', 'katalog'),           -- versaler -> normal skrift, VSOP bevares
  ('5714946004583', 'IPA', 'katalog');                   -- kort enkeltord i versaler røres ikke

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

-- Nødrettelse 16. okt.: triggeren skal virke for andre roller end ejeren (fx edge-funktioner og admin), ikke kun i testen som superbruger.
set local role service_role;
insert into products (ean, name, source) values ('76222004', '  SERVICE   ROLLE TEST ', 'user');
update products set name = 'NYT NAVN PRODUKT' where ean = '76222004';
reset role;

do $$
begin
  if not exists (select 1 from products where ean = '76222004' and name = 'Nyt navn produkt') then
    raise exception 'Triggeren virker ikke for service_role';
  end if;
  if not (select prosecdef from pg_proc where oid = 'public.products_hygiene_trg()'::regprocedure) then
    raise exception 'products_hygiene_trg skal køre med ejerens rettigheder';
  end if;
end $$;

rollback;
