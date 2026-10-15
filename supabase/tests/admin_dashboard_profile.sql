-- Test af admin-dashboardets tal og admins samlede gemning af en brugers profil og allergier (to do b9a16fdb, G27/G28).
-- En almindelig bruger kan ingen af delene; en admins gemning sker i ét hug og logges; en fejl ruller alt tilbage.
-- Kører i CI mod en frisk database bygget fra migrationerne. Alt rulles tilbage.
begin;

do $$
declare
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid();
  pid uuid; n int; res text := ''; st jsonb; v_name text;
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;
  update public.users set name='Gammelt navn' where id=usr;
  insert into public.user_allergens(user_id, allergen, type) values (usr,'milk','allergen');
  insert into public.products(ean,name) values ('5700000099992','Testvare') returning id into pid;
  insert into public.scan_history(user_id,product_id,ean_scanned,result,found_via) values (usr,pid,'5700000099992','ok','scan');
  insert into public.scan_history(user_id,product_id,ean_scanned,result,found_via) values (usr,pid,'5700000099992','ok','search');

  -- Almindelig bruger
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);
  begin
    perform public.admin_dashboard_stats(30); res := res || 'BRUGER-SER-DASHBOARD ';
  exception when others then null; end;
  begin
    perform public.admin_save_user_profile(usr, '{"name":"Hacket"}'::jsonb, '{}', '{}'); res := res || 'BRUGER-GEMMER-VIA-ADMIN ';
  exception when others then null; end;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  -- Anonym
  execute 'set local role anon';
  begin
    perform public.admin_dashboard_stats(30); res := res || 'ANON-SER-DASHBOARD ';
  exception when others then null; end;
  execute 'reset role';

  -- Administrator
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);

  st := public.admin_dashboard_stats(30);
  if jsonb_array_length(st->'scan_trend') <> 30 or jsonb_array_length(st->'user_trend') <> 30 then res := res || 'TREND-IKKE-30-DAGE '; end if;
  if (st->>'total_scans')::int < 1 or (st->>'search_opens')::int < 1 then res := res || 'SCANNINGER-ELLER-SØGNINGER-MANGLER '; end if;
  if (st->>'scans_today')::int <> (select count(*) from public.scan_history where found_via='scan'
        and scanned_at >= ((now() at time zone 'Europe/Copenhagen')::date)::timestamp at time zone 'Europe/Copenhagen') then res := res || 'SCANNINGER-I-DAG-FORKERT '; end if;
  if (st->'scan_trend'->29->>'date') <> ((now() at time zone 'Europe/Copenhagen')::date)::text then res := res || 'SIDSTE-DAG-ER-IKKE-I-DAG '; end if;
  if (st->'scan_trend'->29->>'count')::int <> (st->>'scans_today')::int then res := res || 'GRAF-OG-I-DAG-UENIGE '; end if;
  if (st->>'total_users')::int < 2 or (st->>'admin_users')::int < 1 then res := res || 'BRUGERTAL-FORKERT '; end if;

  -- Gem profil og allergier i ét hug
  perform public.admin_save_user_profile(usr,
    '{"name":"Nyt navn","e_numbers":["E100"],"allergen_levels":{"peanuts":"severe"}}'::jsonb,
    array['peanuts','peanuts',' '], array['kiwi'], 'Test: brugeren bad om rettelse');
  select name into v_name from public.users where id=usr;
  if v_name <> 'Nyt navn' then res := res || 'NAVN-IKKE-GEMT '; end if;
  select count(*) into n from public.user_allergens where user_id=usr and family_member_id is null;
  if n <> 2 then res := res || 'ALLERGIER-FORKERT(' || n || ') '; end if;
  select count(*) into n from public.user_allergens where user_id=usr and allergen='milk';
  if n <> 0 then res := res || 'GAMLE-ALLERGIER-STÅR-DER-STADIG '; end if;
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='brugerprofil_aendret' and target_id=usr::text;
  if n < 1 then res := res || 'PROFILÆNDRING-IKKE-LOGGET '; end if;

  -- En fejl (ugyldigt fødselsår) ruller det hele tilbage: navn og allergier er uændrede
  begin
    perform public.admin_save_user_profile(usr, '{"name":"Fejl","birth_year":"abc"}'::jsonb, array['milk'], '{}', 'Test');
    res := res || 'UGYLDIG-VÆRDI-ACCEPTERET ';
  exception when others then null; end;
  select name into v_name from public.users where id=usr;
  if v_name <> 'Nyt navn' then res := res || 'FEJL-ÆNDREDE-NAVN '; end if;
  select count(*) into n from public.user_allergens where user_id=usr and family_member_id is null;
  if n <> 2 then res := res || 'FEJL-ÆNDREDE-ALLERGIER(' || n || ') '; end if;

  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  if res <> '' then raise exception 'ADMIN-DASHBOARD/PROFIL: %', res; end if;
end $$;

rollback;
select 'ADMIN-DASHBOARD/PROFIL: ALLE TESTS BESTAAET' as resultat;
