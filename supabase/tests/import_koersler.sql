-- Test af kørselsloggen for import og genanalyse (16. okt. 2026): kun én kørsel pr. type ad gangen, hængende kørsler afsluttes, kun administratorer kan læse loggen og overblikket,
-- og kun service_role kan starte en kørsel. Alt rulles tilbage.
begin;
do $$
declare
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid(); a uuid; b uuid; c uuid; n int; st text; res text := '';
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;

  -- Én kørsel ad gangen pr. type; en anden type må gerne køre samtidigt
  a := public.import_run_start('off_import', 'cron');
  if a is null then res := res || 'FOERSTE-KOERSEL-AFVIST '; end if;
  b := public.import_run_start('off_import', 'manual');
  if b is not null then res := res || 'SAMTIDIG-KOERSEL-TILLADT '; end if;
  c := public.import_run_start('reanalyze', 'manual');
  if c is null then res := res || 'ANDEN-TYPE-AFVIST '; end if;

  -- En hængende kørsel (over 10 minutter) afsluttes som afbrudt, og en ny kan starte
  update public.import_runs set started_at = now() - interval '20 minutes' where id = a;
  b := public.import_run_start('off_import', 'manual');
  if b is null then res := res || 'HAENGENDE-BLOKERER '; end if;
  select status into st from public.import_runs where id = a; if st <> 'failed' then res := res || 'HAENGENDE-IKKE-AFSLUTTET(' || coalesce(st,'null') || ') '; end if;

  -- Ugyldig status afvises
  begin update public.import_runs set status = 'fantasi' where id = b; res := res || 'UGYLDIG-STATUS '; exception when check_violation then null; end;

  -- Almindelig bruger: ingen læsning, ingen funktioner
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);
  select count(*) into n from public.import_runs; if n <> 0 then res := res || 'BRUGER-SER-LOG '; end if;
  begin perform * from public.admin_import_overview(); res := res || 'BRUGER-KAN-OVERBLIK '; exception when sqlstate '42501' then null; end;
  begin perform public.import_run_start('off_import', 'manual'); res := res || 'BRUGER-KAN-STARTE '; exception when sqlstate '42501' then null; end;
  execute 'reset role';
  -- Administrator læser, men kan ikke starte eller skrive
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  select count(*) into n from public.import_runs; if n < 3 then res := res || 'ADMIN-SER-IKKE-LOG(' || n || ') '; end if;
  perform * from public.admin_import_overview();
  begin perform public.import_run_start('off_import', 'manual'); res := res || 'ADMIN-KAN-STARTE '; exception when sqlstate '42501' then null; end;
  begin update public.import_runs set status = 'ok' where id = b; get diagnostics n = row_count; if n <> 0 then res := res || 'ADMIN-KAN-SKRIVE '; end if; exception when sqlstate '42501' then null; end;
  execute 'reset role';
  execute 'set local role anon';
  begin perform count(*) from public.import_runs; res := res || 'ANON-KAN-LAESE '; exception when sqlstate '42501' then null; end;
  execute 'reset role';
  if res <> '' then raise exception 'IMPORT-KOERSLER: %', res; end if;
end $$;
rollback;
select 'IMPORT-KOERSLER: ALLE TESTS BESTAAET' as resultat;
