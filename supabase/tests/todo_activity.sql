-- Test af to do-historikken (admin_todo_activity, 14. okt. 2026). Kører i CI mod en frisk database bygget fra migrationerne.
-- Ændringer i status, prioritet, ansvarlig og frist logges med hvem og hvordan (admin, ticket, workflow); kun administratorer
-- kan læse historikken, og ingen kan skrive, rette eller slette i den. Alt rulles tilbage.
begin;

do $$
declare
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid();
  tid uuid; todo uuid; ttodo uuid; n int; res text := '';
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;
  insert into public.admin_todos(title) values ('Historiktest') returning id into todo;
  insert into public.feedback_tickets(type,description,submitted_by) values ('bug','d',usr) returning id into tid;
  select id into ttodo from public.admin_todos where ticket_id=tid;
  if ttodo is null then res := res || 'TICKET-GAV-INGEN-OPGAVE '; end if;

  -- Administrator i admin-panelet
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  update public.admin_todos set status='doing', priority='high', due_date='2026-12-01', assignee_id=adm, title='Ny titel' where id=todo;
  select count(*) into n from public.admin_todo_activity where todo_id=todo and changed_by=adm and via='admin';
  if n<>4 then res := res || 'ADMIN-AENDRING-LOGGET(' || n || ', forventet 4) '; end if;
  select count(*) into n from public.admin_todo_activity where todo_id=todo and field='status' and old_value='todo' and new_value='doing';
  if n<>1 then res := res || 'STATUS-FRA-TIL-MANGLER '; end if;
  -- uændret værdi giver ingen række
  update public.admin_todos set status='doing' where id=todo;
  select count(*) into n from public.admin_todo_activity where todo_id=todo;
  if n<>4 then res := res || 'UAENDRET-LOGGET '; end if;
  -- ticketten skifter status, og opgaven følger med: mærkes "ticket"
  update public.feedback_tickets set status='resolved' where id=tid;
  select count(*) into n from public.admin_todo_activity where todo_id=ttodo and field='status' and via='ticket' and new_value='done' and changed_by=adm;
  if n<>1 then res := res || 'TICKET-SYNK-IKKE-LOGGET(' || n || ') '; end if;
  -- administratoren kan læse, men ikke skrive, rette eller slette
  select count(*) into n from public.admin_todo_activity; if n=0 then res := res || 'ADMIN-KAN-IKKE-LAESE '; end if;
  begin
    insert into public.admin_todo_activity(todo_id,via,field) values (todo,'admin','status'); res := res || 'ADMIN-SKRIVER-HISTORIK ';
  exception when others then null; end;
  begin
    update public.admin_todo_activity set new_value='x'; get diagnostics n = row_count; if n>0 then res := res || 'ADMIN-RETTER-HISTORIK '; end if;
  exception when others then null; end;
  begin
    delete from public.admin_todo_activity; get diagnostics n = row_count; if n>0 then res := res || 'ADMIN-SLETTER-HISTORIK '; end if;
  exception when others then null; end;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  -- Almindelig bruger og anonym kan intet se
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);
  select count(*) into n from public.admin_todo_activity; if n<>0 then res := res || 'BRUGER-LAESER-HISTORIK '; end if;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';
  execute 'set local role anon';
  begin
    perform count(*) from public.admin_todo_activity; res := res || 'ANON-LAESER-HISTORIK ';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  -- Workflowet "Skriv til to do" logges som "workflow" uden person
  perform public.todo_apply(jsonb_build_object('ops', jsonb_build_array(jsonb_build_object('op','update','id',todo,'priority','low','assignee',null))));
  select count(*) into n from public.admin_todo_activity where todo_id=todo and via='workflow' and changed_by is null and field in ('priority','assignee_id');
  if n<>2 then res := res || 'WORKFLOW-IKKE-LOGGET(' || n || ') '; end if;

  -- Historikken kan heller ikke rettes af databasens egne roller, men forsvinder med opgaven
  begin
    update public.admin_todo_activity set new_value='x' where todo_id=todo; res := res || 'HISTORIK-KAN-RETTES ';
  exception when others then null; end;
  delete from public.admin_todos where id=todo;
  select count(*) into n from public.admin_todo_activity where todo_id=todo; if n<>0 then res := res || 'HISTORIK-OVERLEVER-OPGAVEN '; end if;

  -- Oprydning efter 12 måneder (rækken indsættes direkte som ejer med gammel dato)
  insert into public.admin_todo_activity(todo_id,created_at,via,field) values (ttodo, now() - interval '13 months', 'system', 'status');
  perform public.cleanup_notifications();
  select count(*) into n from public.admin_todo_activity where created_at < now() - interval '12 months';
  if n<>0 then res := res || 'GAMMEL-HISTORIK-IKKE-RYDDET '; end if;
  select count(*) into n from public.admin_todo_activity where todo_id=ttodo; if n<>1 then res := res || 'FRISK-HISTORIK-RYDDET '; end if;

  if res <> '' then raise exception 'TO DO-HISTORIK: %', res; end if;
end $$;

rollback;
select 'TO DO-HISTORIK: ALLE TESTS BESTAAET' as resultat;
