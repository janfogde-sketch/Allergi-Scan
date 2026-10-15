-- Test af adminadgang og adminlog (Bjørn, 14. okt. 2026). Kører i CI mod en frisk database bygget fra migrationerne.
-- En almindelig bruger må hverken læse eller skrive adminloggen, hverken ophøje sig selv eller andre eller læse andres
-- tickets; en administrator kan læse loggen, og rolle- og statusskift fra en administrator logges med tid og admin.
-- Alt rulles tilbage.
begin;

do $$
declare
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid(); oth uuid := gen_random_uuid();
  tid uuid; pid uuid; n int; res text := ''; v_status text;
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (oth,'oth-'||substr(oth::text,1,8)||'@example.invalid','authenticated','authenticated');
  -- Opsætning: udløseren mod selvophøjelse slås fra et øjeblik (uden login-id afviser den alle), og audit-udløseren skal ikke logge opsætningen
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;
  insert into feedback_tickets(type,description,submitted_by) values ('bug','d',oth) returning id into tid;
  insert into public.products(ean,name) values ('5700000099991','Testvare') returning id into pid;
  insert into public.scan_history(user_id,product_id,ean_scanned,result) values (usr,pid,'5700000099991','ok');

  -- Almindelig bruger
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);

  select count(*) into n from public.admin_audit_log; if n<>0 then res := res || 'BRUGER-LÆSER-ADMINLOG '; end if;
  begin
    insert into public.admin_audit_log(action,target_table) values ('x','y'); res := res || 'BRUGER-SKRIVER-ADMINLOG ';
  exception when others then null; end;
  begin
    update public.admin_audit_log set action='x'; get diagnostics n = row_count; if n>0 then res := res || 'BRUGER-ÆNDRER-ADMINLOG '; end if;
  exception when others then null; end;
  begin
    delete from public.admin_audit_log; get diagnostics n = row_count; if n>0 then res := res || 'BRUGER-SLETTER-ADMINLOG '; end if;
  exception when others then null; end;
  begin
    update public.users set role='admin' where id=usr; res := res || 'BRUGER-OPHØJER-SIG ';
  exception when others then null; end;
  begin
    update public.users set role='admin' where id=oth; get diagnostics n = row_count; if n>0 then res := res || 'BRUGER-OPHØJER-ANDEN '; end if;
  exception when others then null; end;
  select count(*) into n from public.feedback_tickets where id=tid; if n<>0 then res := res || 'BRUGER-LÆSER-ANDENS-TICKET '; end if;
  begin
    update public.feedback_tickets set status='resolved' where id=tid; get diagnostics n = row_count; if n>0 then res := res || 'BRUGER-ÆNDRER-TICKET '; end if;
  exception when others then null; end;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  select count(*) into n from public.admin_audit_log; if n<>0 then res := res || 'BRUGERHANDLING-LOGGET(' || n || ') '; end if;

  -- Anonym
  execute 'set local role anon';
  begin
    perform count(*) from public.admin_audit_log; res := res || 'ANON-LÆSER-ADMINLOG ';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  -- Administrator
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  update public.users set role='admin' where id=oth;
  update public.feedback_tickets set status='resolved' where id=tid;
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='rolle_aendret' and target_id=oth::text and details->>'til'='admin';
  if n<>1 then res := res || 'ADMIN-ROLLESKIFT-IKKE-LOGGET(' || n || ') '; end if;
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='ticketstatus_aendret' and target_id=tid::text;
  if n<>1 then res := res || 'ADMIN-TICKETSKIFT-IKKE-LOGGET(' || n || ') '; end if;
  begin
    delete from public.admin_audit_log; get diagnostics n = row_count; if n>0 then res := res || 'ADMIN-SLETTER-ADMINLOG '; end if;
  exception when others then null; end;

  -- Produktrettelse logges med feltnavne, og et scannet produkt kan slettes (historikken beholder stregkoden)
  update public.products set ingredients_text='mel, salt' where id=pid;
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='produkt_rettet' and target_id=pid::text
    and details->'felter' ? 'ingredients_text' and details->>'ean'='5700000099991';
  if n<>1 then res := res || 'ADMIN-PRODUKTRETTELSE-IKKE-LOGGET(' || n || ') '; end if;
  -- Produkter er indhold: før/efter-værdier gemmes pr. felt, og lange værdier afkortes til 500 tegn
  select count(*) into n from public.admin_audit_log where action='produkt_rettet' and target_id=pid::text
    and details->'aendringer' @> '[{"felt":"ingredients_text","til":"mel, salt"}]'::jsonb;
  if n<>1 then res := res || 'PRODUKT-FOER-EFTER-MANGLER(' || n || ') '; end if;
  update public.products set ingredients_text=repeat('x', 2000) where id=pid;
  select count(*) into n from public.admin_audit_log where action='produkt_rettet' and target_id=pid::text
    and exists (select 1 from jsonb_array_elements(details->'aendringer') e
                 where e->>'felt'='ingredients_text' and length(e->>'til') = 501 and e->>'fra'='mel, salt');
  if n<>1 then res := res || 'LANG-VAERDI-IKKE-AFKORTET(' || n || ') '; end if;

  -- Oprettelser af produkter og leksikonposter logges; leksikonrettelser får før/efter
  insert into public.products(ean,name) values ('5700000099992','Ny testvare');
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='produkt_oprettet' and details->>'ean'='5700000099992';
  if n<>1 then res := res || 'PRODUKT-OPRETTELSE-IKKE-LOGGET(' || n || ') '; end if;
  insert into public.knowledge_base(category,title,slug) values ('faq','Testpost','testpost-audit-'||substr(adm::text,1,8)) returning id::text into v_status;
  update public.knowledge_base set summary='Kort' where id::text=v_status;
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='vidensindgang_oprettet' and target_id=v_status and details->>'navn'='Testpost';
  if n<>1 then res := res || 'LEKSIKON-OPRETTELSE-IKKE-LOGGET(' || n || ') '; end if;
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='vidensindgang_rettet' and target_id=v_status
    and details->'aendringer' @> '[{"felt":"summary","til":"Kort"}]'::jsonb;
  if n<>1 then res := res || 'LEKSIKON-RETTELSE-IKKE-LOGGET(' || n || ') '; end if;
  begin
    delete from public.products where id=pid;
    select count(*) into n from public.admin_audit_log where admin_id=adm and action='produkt_slettet' and details->>'navn'='Testvare';
    if n<>1 then res := res || 'ADMIN-PRODUKTSLETNING-IKKE-LOGGET(' || n || ') '; end if;
  exception when others then res := res || 'ADMIN-KAN-IKKE-SLETTE-SCANNET-PRODUKT(' || sqlerrm || ') '; end;

  -- Ændring af en andens profil logges med feltnavne, aldrig værdierne
  update public.users set name='Nyt navn' where id=usr;
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='brugerprofil_aendret' and target_id=usr::text
    and details->'felter' ? 'name' and details::text not like '%Nyt navn%';
  if n<>1 then res := res || 'ADMIN-PROFILAENDRING-IKKE-LOGGET(' || n || ') '; end if;
  select count(*) into n from public.admin_audit_log where action='brugerprofil_aendret' and details ? 'aendringer';
  if n<>0 then res := res || 'PROFILVAERDIER-I-LOGGEN '; end if;

  -- Allergier: kun antal, aldrig hvilke
  insert into public.user_allergens(user_id, allergen, type) values (usr, 'jordnoedder', 'allergen');
  select count(*) into n from public.admin_audit_log where action='brugerallergier_aendret' and target_id=usr::text
    and details->>'antal'='1' and details::text not like '%jordnoedder%';
  if n<>1 then res := res || 'ALLERGIER-FORKERT-LOGGET(' || n || ') '; end if;
  select count(*) into n from public.admin_audit_log where details::text like '%jordnoedder%';
  if n<>0 then res := res || 'ALLERGI-I-LOGGEN '; end if;

  -- CSV-eksport kan meldes af en admin
  perform public.log_admin_export('users', 3);
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='csv_eksport' and target_table='users';
  if n<>1 then res := res || 'ADMIN-CSV-IKKE-LOGGET(' || n || ') '; end if;

  -- Den sidste administrator kan ikke fjernes: oth må nedgraderes (adm er tilbage), men derefter ikke adm selv
  update public.users set role='user' where id=oth;
  begin
    update public.users set role='user' where id=adm; res := res || 'SIDSTE-ADMIN-FJERNET ';
  exception when others then null; end;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  -- En almindelig bruger kan ikke melde en eksport
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);
  begin
    perform public.log_admin_export('users', 1); res := res || 'BRUGER-MELDER-EKSPORT ';
  exception when others then null; end;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  -- Logning fra edge-funktionerne: kun service-nøglen må kalde log_admin_event
  if has_function_privilege('authenticated', 'public.log_admin_event(uuid,text,text,text,jsonb,text)', 'execute') then
    res := res || 'BRUGER-KAN-KALDE-LOG_ADMIN_EVENT '; end if;
  if has_function_privilege('anon', 'public.log_admin_event(uuid,text,text,text,jsonb,text)', 'execute') then
    res := res || 'ANON-KAN-KALDE-LOG_ADMIN_EVENT '; end if;
  if not has_function_privilege('service_role', 'public.log_admin_event(uuid,text,text,text,jsonb,text)', 'execute') then
    res := res || 'SERVICE-KAN-IKKE-KALDE-LOG_ADMIN_EVENT '; end if;
  -- Afviste forsøg: højst én række pr. bruger, handling og funktion i timen
  if not public.log_admin_event(usr, 'adgang_naegtet', 'edge_function', null, '{"funktion":"products"}'::jsonb, 'afvist') then
    res := res || 'AFVIST-IKKE-LOGGET '; end if;
  if public.log_admin_event(usr, 'adgang_naegtet', 'edge_function', null, '{"funktion":"products"}'::jsonb, 'afvist') then
    res := res || 'AFVIST-LOGGET-TO-GANGE '; end if;
  if not public.log_admin_event(usr, 'adgang_naegtet', 'edge_function', null, '{"funktion":"allergens"}'::jsonb, 'afvist') then
    res := res || 'AFVIST-ANDEN-FUNKTION-IKKE-LOGGET '; end if;
  begin
    perform public.log_admin_event(adm, 'x', 'y', null, null, 'ukendt'); res := res || 'UKENDT-OUTCOME-GODTAGET ';
  exception when check_violation then null; end;

  -- Opbevaring: afviste/mislykkede rækker efter 90 dage, admins handlinger efter 12 måneder
  insert into public.admin_audit_log(created_at, admin_id, action, target_table, outcome) values
    (now() - interval '100 days', usr, 'gammel_afvist', 'edge_function', 'afvist'),
    (now() - interval '100 days', adm, 'gammel_mislykket', 'products', 'mislykket'),
    (now() - interval '100 days', adm, 'gammel_ok', 'products', 'ok'),
    (now() - interval '13 months', adm, 'aeldgammel_ok', 'products', 'ok'),
    (now() - interval '10 days', usr, 'ny_afvist', 'edge_function', 'afvist');
  perform public.cleanup_notifications();
  select count(*) into n from public.admin_audit_log where action in ('gammel_afvist', 'gammel_mislykket', 'aeldgammel_ok');
  if n<>0 then res := res || 'GAMLE-LOGRAEKKER-IKKE-RYDDET(' || n || ') '; end if;
  select count(*) into n from public.admin_audit_log where action in ('gammel_ok', 'ny_afvist');
  if n<>2 then res := res || 'FOR-MEGET-RYDDET(' || n || ') '; end if;

  if res <> '' then raise exception 'ADMINADGANG: %', res; end if;
end $$;

rollback;
select 'ADMINADGANG: ALLE TESTS BESTAAET' as resultat;
