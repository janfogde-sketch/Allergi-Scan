-- Test af gemning af pushtekst (16. okt. 2026): kun administratorer, ny tekst gemmes, forældet version afvises (konflikt), gendan standard sletter, og tabellens
-- audit-udløser logger. Kører i CI mod en frisk database. Alt rulles tilbage.
begin;

do $$
declare
  adm uuid := gen_random_uuid(); oth uuid := gen_random_uuid();
  v1 timestamptz; v2 timestamptz; n int; res text := '';
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (oth,'oth-'||substr(oth::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;
  delete from public.notification_push_overrides where key = 'N2a:default';
  delete from public.admin_audit_log;

  if has_function_privilege('anon', 'public.admin_save_push_override(text,text,text,timestamptz)', 'execute') then res := res || 'ANON-KAN-KALDE '; end if;

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', oth,'role','authenticated')::text, true);
  begin perform public.admin_save_push_override('N2a:default', 'x', 'y', null); res := res || 'BRUGER-GEMMER '; exception when others then null; end;
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);

  begin perform public.admin_save_push_override('ugyldig', 'x', 'y', null); res := res || 'UGYLDIG-NOEGLE '; exception when others then null; end;
  begin perform public.admin_save_push_override('N2a:default', repeat('x', 61), 'y', null); res := res || 'FOR-LANG-TITEL '; exception when others then null; end;

  v1 := public.admin_save_push_override('N2a:default', 'Ny titel', 'Ny tekst', null);
  select count(*) into n from public.notification_push_overrides where key='N2a:default' and title='Ny titel' and updated_at=v1; if n<>1 then res := res || 'IKKE-GEMT '; end if;

  -- En anden administrator, der så "ingen tekst", afvises; så versionen gemmer
  begin perform public.admin_save_push_override('N2a:default', 'Konflikt', 'x', null); res := res || 'KONFLIKT-IKKE-AFVIST '; exception when sqlstate '40001' then null; end;
  select count(*) into n from public.notification_push_overrides where key='N2a:default' and title='Ny titel'; if n<>1 then res := res || 'KONFLIKT-OVERSKREV '; end if;
  v2 := public.admin_save_push_override('N2a:default', 'Titel 2', 'Tekst 2', v1);
  if v2 is null then res := res || 'INGEN-NY-VERSION '; end if;
  begin perform public.admin_save_push_override('N2a:default', 'Gammel', 'x', v1); res := res || 'FORAELDET-ACCEPTERET '; exception when sqlstate '40001' then null; end;

  -- Gendan standard: sletter (kræver også den aktuelle version)
  begin perform public.admin_save_push_override('N2a:default', '', '', v1); res := res || 'GENDAN-MED-GAMMEL '; exception when sqlstate '40001' then null; end;
  perform public.admin_save_push_override('N2a:default', '', '', v2);
  select count(*) into n from public.notification_push_overrides where key='N2a:default'; if n<>0 then res := res || 'IKKE-SLETTET '; end if;
  select count(*) into n from public.admin_audit_log where action='pushtekst_aendret'; if n<3 then res := res || 'IKKE-LOGGET(' || n || ') '; end if;

  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';
  if res <> '' then raise exception 'NOTIFIKATIONER: %', res; end if;
end $$;

rollback;
select 'NOTIFIKATIONER: ALLE TESTS BESTAAET' as resultat;
