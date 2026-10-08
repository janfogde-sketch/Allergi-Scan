-- To do a9b909ed: varer uden ingrediensliste får "unknown" ved oprettelse. Rulles tilbage til sidst.
begin;

insert into products (ean, name, source, allergen_flags) values
  ('5700000000011', 'Uden liste og uden flag', 'user', '{}'::jsonb),
  ('5700000000028', 'Uden liste, nej-flag', 'off_auto_import', '{"gluten":"no","aeg":"yes","fisk":"traces"}'::jsonb);
insert into products (ean, name, source, ingredients_text, allergen_flags) values
  ('5700000000035', 'Med liste', 'user', 'Hvedemel, vand', '{"gluten":"yes","aeg":"no"}'::jsonb);

do $$
begin
  if (select allergen_flags ->> 'gluten' from products where ean = '5700000000011') <> 'unknown'
     or (select allergen_flags ->> 'maelkeallergi' from products where ean = '5700000000011') <> 'unknown' then
    raise exception 'Tomme flag uden ingrediensliste skal blive unknown';
  end if;
  if (select allergen_quality from products where ean = '5700000000011') <> 'low' then
    raise exception 'Kvalitet skal være low';
  end if;
  if (select allergen_flags ->> 'gluten' from products where ean = '5700000000028') <> 'unknown'
     or (select allergen_flags ->> 'aeg' from products where ean = '5700000000028') <> 'yes'
     or (select allergen_flags ->> 'fisk' from products where ean = '5700000000028') <> 'traces' then
    raise exception 'nej -> unknown, men yes/traces skal bevares';
  end if;
  if (select allergen_flags ->> 'aeg' from products where ean = '5700000000035') <> 'no' then
    raise exception 'Varer med ingrediensliste må ikke røres';
  end if;
end $$;

rollback;
