-- Vagten på products (migration 20261015110000): varer kan ikke gemmes med butikskilde, butikskode eller billede fra butikkernes servere.
-- Alt rulles tilbage til sidst.
begin;

do $$
declare blocked int := 0;
begin
  begin insert into products (ean, name, source) values ('5700000000001', 'Test', 'nemlig');
  exception when check_violation then blocked := blocked + 1; end;
  begin insert into products (ean, name, source) values ('NEMLIG-1', 'Test', 'user');
  exception when check_violation then blocked := blocked + 1; end;
  begin insert into products (ean, name, source, image_url) values ('5700000000002', 'Test', 'user', 'https://digitalassets.sallinggroup.com/a.jpg');
  exception when check_violation then blocked := blocked + 1; end;
  if blocked <> 3 then
    raise exception 'Vagten stoppede kun % af 3 forsøg', blocked;
  end if;

  insert into products (ean, name, source) values ('ES-999999', 'Katalogvare', 'katalog');
  if not exists (select 1 from products where ean = 'ES-999999' and source = 'katalog') then
    raise exception 'Neutral katalogvare skal kunne gemmes';
  end if;
  if to_regprocedure('public.nutrition_nemlig_candidates(int)') is not null then
    raise exception 'Engangsfunktionen skal være fjernet';
  end if;
  if has_table_privilege('anon', 'public.kildeoprydning_backup_20261015', 'select')
     or has_table_privilege('authenticated', 'public.kildeoprydning_backup_20261015', 'select') then
    raise exception 'Sikkerhedskopien må ikke kunne læses af brugere';
  end if;
end $$;

rollback;
