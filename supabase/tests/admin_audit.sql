-- Test af adminadgang og adminlog (Bjørn, 14. okt. 2026). Kører i CI mod en frisk database bygget fra migrationerne.
-- En almindelig bruger må hverken læse eller skrive adminloggen, hverken ophøje sig selv eller andre eller læse andres
-- tickets; en administrator kan læse loggen, og rolle- og statusskift fra en administrator logges med tid og admin.
-- Alt rulles tilbage.
begin;

do $$
declare
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid(); oth uuid := gen_random_uuid();
  tid uuid; n int; res text := ''; v_status text;
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (oth,'oth-'||substr(oth::text,1,8)||'@example.invalid','authenticated','authenticated');
  update public.users set role='admin' where id=adm;
  insert into feedback_tickets(type,description,submitted_by) values ('bug','d',oth) returning id into tid;

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
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  if res <> '' then raise exception 'ADMINADGANG: %', res; end if;
end $$;

rollback;
select 'ADMINADGANG: ALLE TESTS BESTAAET' as resultat;
