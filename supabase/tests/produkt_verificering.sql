-- Test: et produkt kan ikke markeres som verificeret uden ingrediensliste; med ingrediensliste kan det, og andre ændringer påvirkes ikke. Alt rulles tilbage.
begin;
do $$
declare pid uuid; res text := '';
begin
  insert into public.products(ean, name, verified_status) values ('0000000000017', 'Testprodukt', 'unverified') returning id into pid;
  begin update public.products set verified_status = 'verified' where id = pid; res := res || 'VERIFICERET-UDEN-INGREDIENSER '; exception when sqlstate '22023' then null; end;
  begin insert into public.products(ean, name, verified_status) values ('0000000000024', 'Testprodukt 2', 'verified'); res := res || 'OPRETTET-VERIFICERET-UDEN-INGREDIENSER '; exception when sqlstate '22023' then null; end;
  update public.products set verified_status = 'partial' where id = pid;
  update public.products set ingredients_text = 'Vand, sukker, salt' where id = pid;
  update public.products set verified_status = 'verified' where id = pid;
  if (select verified_status from public.products where id = pid) <> 'verified' then res := res || 'IKKE-VERIFICERET '; end if;
  -- Et allerede verificeret produkt kan stadig få andre felter rettet
  update public.products set name = 'Nyt navn' where id = pid;
  if res <> '' then raise exception 'PRODUKT-VERIFICERING: %', res; end if;
end $$;
rollback;
select 'PRODUKT-VERIFICERING: ALLE TESTS BESTAAET' as resultat;
