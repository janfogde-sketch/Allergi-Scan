-- Test af fejladministrationen (15. okt. 2026): stabilt fingeraftryk, ignoreret forbliver ignoreret, løst genåbnes automatisk og logges,
-- statusskift logges med hvem/fra/til/begrundelse, ignorering kræver begrundelse, alvorlighed logges, og kun admin kan læse tal og ændre status.
-- Kører i CI mod en frisk database bygget fra migrationerne. Alt rulles tilbage.
begin;

do $$
declare
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid();
  n int; res text := ''; eid uuid; rec record; v jsonb;
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;

  -- Fingeraftryk: Safari og Chrome-udgaven af samme fejl på samme skærm bliver én gruppe; en anden egenskab eller skærm er en anden
  perform public.log_client_error('undefined is not an object (evaluating ''e._result.default'')', null, 'react', 'Scanner', '/', 'ua', 'aaa1111', null);
  perform public.log_client_error('Cannot read properties of undefined (reading ''default'')', null, 'react', 'Scanner', '/', 'ua', 'bbb2222', null);
  perform public.log_client_error('Cannot read properties of undefined (reading ''map'')', null, 'react', 'Scanner', '/', 'ua', 'bbb2222', null);
  perform public.log_client_error('Cannot read properties of undefined (reading ''default'')', null, 'react', 'Profil', '/', 'ua', 'bbb2222', null);
  select count(*) into n from public.client_errors; if n<>3 then res := res || 'GRUPPERING-FORKERT(' || n || ') '; end if;
  select id, occurrences, app_versions into rec from public.client_errors where screen='Scanner' and message like '%default%';
  eid := rec.id;
  if rec.occurrences<>2 then res := res || 'FORENINGER-IKKE-TAELLT(' || rec.occurrences || ') '; end if;
  if not (rec.app_versions @> array['aaa1111','bbb2222']) then res := res || 'VERSIONER-MANGLER '; end if;

  -- En åben fejl samles uden tidsgrænse (ikke en ny række efter en time)
  update public.client_errors set last_seen = now() - interval '5 hours' where id=eid;
  perform public.log_client_error('Cannot read properties of undefined (reading ''default'')', null, 'react', 'Scanner', '/', 'ua', 'aaa1111', null);
  select count(*) into n from public.client_errors where screen='Scanner' and message like '%default%'; if n<>1 then res := res || 'AABEN-FEJL-NY-RAEKKE '; end if;

  -- Ignoreret forbliver ignoreret, men tælles; løst genåbnes automatisk, tælles og logges uden admin
  update public.client_errors set status='ignored', status_reason='Kendt støj' where id=eid;
  perform public.log_client_error('undefined is not an object (evaluating ''e._result.default'')', null, 'react', 'Scanner', '/', 'ua', 'aaa1111', null);
  select status, occurrences into rec from public.client_errors where id=eid;
  if rec.status<>'ignored' then res := res || 'IGNORERET-AENDRET '; end if;
  if rec.occurrences<>4 then res := res || 'IGNORERET-IKKE-TAELLT(' || rec.occurrences || ') '; end if;
  update public.client_errors set status='resolved' where id=eid;
  perform public.log_client_error('Cannot read properties of undefined (reading ''default'')', null, 'react', 'Scanner', '/', 'ua', 'aaa1111', null);
  select status, reopen_count, status_reason into rec from public.client_errors where id=eid;
  if rec.status<>'open' or rec.reopen_count<>1 then res := res || 'IKKE-GENAABNET(' || rec.status || ',' || rec.reopen_count || ') '; end if;
  select count(*) into n from public.admin_audit_log where action='fejl_genaabnet' and target_id=eid::text and admin_id is null and details->>'automatisk'='true';
  if n<>1 then res := res || 'AUTOMATISK-GENAABNING-IKKE-LOGGET(' || n || ') '; end if;

  -- Almindelig bruger: kan hverken læse tal eller ændre status
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);
  begin perform public.admin_error_stats(); res := res || 'BRUGER-LAESER-TAL '; exception when others then null; end;
  update public.client_errors set status='resolved' where id=eid; get diagnostics n = row_count; if n>0 then res := res || 'BRUGER-AENDRER-STATUS '; end if;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  -- Administrator
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  update public.client_errors set status='resolved' where id=eid;
  select count(*) into n from public.admin_audit_log where action='fejlstatus_aendret' and admin_id=adm and target_id=eid::text and details->>'fra'='open' and details->>'til'='resolved';
  if n<>1 then res := res || 'STATUSSKIFT-IKKE-LOGGET(' || n || ') '; end if;
  begin
    update public.client_errors set status='ignored' where id=eid; res := res || 'IGNORERING-UDEN-BEGRUNDELSE '; 
  exception when others then null; end;
  begin
    update public.client_errors set status='ignored', status_reason='   ' where id=eid; res := res || 'IGNORERING-MED-TOM-BEGRUNDELSE ';
  exception when others then null; end;
  update public.client_errors set status='ignored', status_reason='Forældet chunk efter deploy' where id=eid;
  select count(*) into n from public.admin_audit_log where action='fejlstatus_aendret' and admin_id=adm and target_id=eid::text and details->>'til'='ignored' and details->>'begrundelse'='Forældet chunk efter deploy';
  if n<>1 then res := res || 'BEGRUNDELSE-IKKE-LOGGET(' || n || ') '; end if;
  update public.client_errors set status='open' where id=eid;
  select status_reason into rec from public.client_errors where id=eid; if rec.status_reason is not null then res := res || 'BEGRUNDELSE-IKKE-RYDDET '; end if;
  update public.client_errors set severity='high' where id=eid;
  select count(*) into n from public.admin_audit_log where action='fejlalvor_aendret' and admin_id=adm and details->>'til'='high';
  if n<>1 then res := res || 'ALVORLIGHED-IKKE-LOGGET(' || n || ') '; end if;
  begin update public.client_errors set severity='alvorlig' where id=eid; res := res || 'UGYLDIG-ALVORLIGHED '; exception when others then null; end;

  v := public.admin_error_stats();
  if (v->>'total')::int<>3 or (v->>'open')::int<>3 or (v->>'reopened')::int<>1 or (v->>'occurrences')::int<>7 then res := res || 'TAL-FORKERTE(' || v::text || ') '; end if;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  -- Anonym: ingen læsning, men logningen virker fortsat, og loftet på nye rækker gælder
  execute 'set local role anon';
  begin perform count(*) from public.client_errors; res := res || 'ANON-LAESER '; exception when insufficient_privilege then null; end;
  perform public.log_client_error('anonym fejl', null, 'react', 'Scanner', '/', 'ua', 'ccc3333', null);
  for n in 1..320 loop perform public.log_client_error('loft-test ' || n || 'x', null, 'react', 'Loft', '/', 'ua', null, null); end loop;
  execute 'reset role';
  select count(*) into n from public.client_errors where first_seen > now() - interval '10 minutes';
  if n > 301 then res := res || 'LOFT-OVERSKREDET(' || n || ') '; end if;

  if res <> '' then raise exception 'FEJLADMINISTRATION: %', res; end if;
end $$;

rollback;
select 'FEJLADMINISTRATION: ALLE TESTS BESTAAET' as resultat;
