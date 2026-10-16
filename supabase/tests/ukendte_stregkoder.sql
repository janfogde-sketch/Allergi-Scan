-- Test af ukendte stregkoder (16. okt. 2026): kun administratorer kan læse og ændre status, "oprettet" afledes af produkttabellen, genforsøg inden for 30 sekunder tælles ikke,
-- prioritering efter antal, periodefilter, ugyldig status afvises og statusændringer logges. Alt rulles tilbage.
begin;
do $$
declare
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid(); n int; c int; st text; res text := '';
  e1 text := '0090000000011'; e2 text := '0090000000028'; e3 text := '0090000000035';
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;

  -- Registrering: første forsøg tæller 1; et genforsøg lige efter tælles ikke; et ældre forsøg tæller
  perform public.log_missing_ean(e1);
  perform public.log_missing_ean(e1);
  select count into c from public.missing_ean_log where ean=e1; if c<>1 then res := res || 'GENFORSOEG-TAELLES(' || c || ') '; end if;
  update public.missing_ean_log set last_seen = now() - interval '2 minutes' where ean=e1;
  perform public.log_missing_ean(e1);
  select count into c from public.missing_ean_log where ean=e1; if c<>2 then res := res || 'NYT-FORSOEG-TAELLES-IKKE(' || c || ') '; end if;
  select status into st from public.missing_ean_log where ean=e1; if st<>'new' then res := res || 'IKKE-NY-SOM-STANDARD '; end if;

  insert into public.missing_ean_log(ean,count,first_seen,last_seen) values (e2,9,now()-interval '200 days',now()-interval '100 days'), (e3,5,now()-interval '5 days',now()-interval '1 day');

  -- Almindelig bruger: ingen adgang til tabel eller funktioner
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);
  select count(*) into n from public.missing_ean_log; if n<>0 then res := res || 'BRUGER-SER-TABEL '; end if;
  begin perform * from public.admin_missing_eans(); res := res || 'BRUGER-KAN-LISTE '; exception when sqlstate '42501' then null; end;
  begin perform * from public.admin_missing_ean_summary(); res := res || 'BRUGER-KAN-TAELLERE '; exception when sqlstate '42501' then null; end;
  begin perform public.admin_set_missing_ean_status(e1,'rejected'); res := res || 'BRUGER-KAN-AENDRE '; exception when sqlstate '42501' then null; end;
  execute 'reset role';
  execute 'set local role anon';
  begin perform * from public.admin_missing_eans(); res := res || 'ANON-KAN-LISTE '; exception when insufficient_privilege then null; end;
  execute 'reset role';

  -- Administrator
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  select ean into st from public.admin_missing_eans('009',null,null,'count',1,0); if st<>e2 then res := res || 'IKKE-SORTERET-EFTER-ANTAL(' || coalesce(st,'null') || ') '; end if;
  select ean into st from public.admin_missing_eans('009',null,null,'last_seen',1,0); if st<>e1 then res := res || 'IKKE-SORTERET-EFTER-SENESTE(' || coalesce(st,'null') || ') '; end if;
  select count(*) into n from public.admin_missing_eans('009',null,30); if n<>2 then res := res || 'PERIODEFILTER(' || n || ') '; end if;
  select count(*) into n from public.admin_missing_eans('00900000000'); if n<>3 then res := res || 'SOEGNING(' || n || ') '; end if;

  -- Status: ændres kun af administrator, ugyldig afvises, og ændringen logges (én post, ingen ved uændret)
  perform public.admin_set_missing_ean_status(e1,'in_progress');
  perform public.admin_set_missing_ean_status(e1,'in_progress');
  select count(*) into n from public.admin_audit_log where action='ukendt_stregkode_status' and target_id=e1; if n<>1 then res := res || 'STATUS-LOG(' || n || ') '; end if;
  begin perform public.admin_set_missing_ean_status(e1,'created'); res := res || 'OPRETTET-KAN-SAETTES '; exception when sqlstate '22023' then null; end;
  begin perform public.admin_set_missing_ean_status('0090000000999','rejected'); res := res || 'UKENDT-KODE-ACCEPTERET '; exception when sqlstate 'P0002' then null; end;
  select status into st from public.admin_missing_eans(e1); if st<>'in_progress' then res := res || 'STATUS-IKKE-GEMT '; end if;

  -- "Oprettet" afledes af produkttabellen: uden at røre rækken
  execute 'reset role';
  insert into public.products(ean,name) values (e1,'Testprodukt');
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  select status into st from public.admin_missing_eans(e1); if st<>'created' then res := res || 'IKKE-OPRETTET-AFLEDT(' || coalesce(st,'null') || ') '; end if;
  select count(*) into n from public.admin_missing_eans('009',null) where status='created' and product_id is not null; if n<>1 then res := res || 'PRODUKT-ID-MANGLER '; end if;
  select created into n from public.admin_missing_ean_summary(); if n<1 then res := res || 'TAELLER-OPRETTET '; end if;
  execute 'reset role';
  if res <> '' then raise exception 'UKENDTE-STREGKODER: %', res; end if;
end $$;
rollback;
select 'UKENDTE-STREGKODER: ALLE TESTS BESTAAET' as resultat;
