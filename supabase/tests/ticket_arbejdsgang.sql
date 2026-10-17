-- Test af ticket-arbejdsgangen (16. okt. 2026): interne felter kun for administratorer, prioritet logges og spejles i den tilknyttede to do, uafsluttet verificering røres ikke af
-- tjeklisten, historikken kan ikke rettes, ugyldig prioritet afvises, og alt følger ticketten ved sletning. Alt rulles tilbage.
begin;
do $$
declare
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid(); tid uuid; todo_id uuid; n int; st text; tsk uuid; res text := '';
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;
  insert into public.feedback_tickets(type, description, submitted_by) values ('bug', 'Testticket til arbejdsgang', usr) returning id into tid;
  select id into todo_id from public.admin_todos where ticket_id = tid;

  -- Almindelig bruger (indsenderen) ser hverken interne felter eller tjekliste
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);
  select count(*) into n from public.ticket_meta; if n <> 0 then res := res || 'BRUGER-SER-META '; end if;
  begin insert into public.ticket_meta(ticket_id, priority) values (tid, 'critical'); res := res || 'BRUGER-KAN-SKRIVE-META '; exception when insufficient_privilege or sqlstate '42501' then null; end;
  begin insert into public.ticket_tasks(ticket_id, title) values (tid, 'x'); res := res || 'BRUGER-KAN-SKRIVE-OPGAVE '; exception when sqlstate '42501' then null; end;
  execute 'reset role';

  -- Administrator: opretter og ændrer
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  insert into public.ticket_meta(ticket_id, priority, launch_blocking) values (tid, 'critical', true);
  begin update public.ticket_meta set priority = 'fantasi' where ticket_id = tid; res := res || 'UGYLDIG-PRIORITET '; exception when check_violation then null; end;
  select count(*) into n from public.ticket_meta_log where ticket_id = tid and field = 'priority' and new_value = 'critical' and changed_by = adm; if n <> 1 then res := res || 'PRIORITET-IKKE-LOGGET(' || n || ') '; end if;
  select count(*) into n from public.ticket_meta_log where ticket_id = tid and field = 'launch_blocking' and new_value = 'true'; if n <> 1 then res := res || 'BLOKERING-IKKE-LOGGET '; end if;
  select priority into st from public.admin_todos where id = todo_id; if todo_id is not null and st <> 'high' then res := res || 'TODO-PRIORITET-IKKE-SPEJLET(' || coalesce(st,'?') || ') '; end if;
  update public.ticket_meta set priority = 'low' where ticket_id = tid;
  select priority into st from public.admin_todos where id = todo_id; if todo_id is not null and st <> 'low' then res := res || 'TODO-LAV-IKKE-SPEJLET '; end if;

  -- Verificering: tidspunkter logges, og en afsluttet tjekliste sætter dem aldrig af sig selv
  insert into public.ticket_tasks(ticket_id, title) values (tid, 'Første punkt') returning id into tsk;
  update public.ticket_tasks set status = 'done' where id = tsk;
  select count(*) into n from public.ticket_tasks where id = tsk and done_at is not null; if n <> 1 then res := res || 'DONE-AT-MANGLER '; end if;
  select count(*) into n from public.ticket_meta where ticket_id = tid and (implemented_at is not null or tested_at is not null or reviewed_at is not null); if n <> 0 then res := res || 'TJEKLISTE-GODKENDTE-AUTOMATISK '; end if;
  update public.ticket_tasks set status = 'todo' where id = tsk;
  select count(*) into n from public.ticket_tasks where id = tsk and done_at is null; if n <> 1 then res := res || 'DONE-AT-IKKE-NULSTILLET '; end if;
  update public.ticket_meta set tested_at = now() where ticket_id = tid;
  select count(*) into n from public.ticket_meta_log where ticket_id = tid and field = 'tested' and new_value = 'ja'; if n <> 1 then res := res || 'TESTET-IKKE-LOGGET '; end if;

  -- Historikken kan ikke rettes eller slettes af administratorer
  begin update public.ticket_meta_log set new_value = 'x' where ticket_id = tid; res := res || 'LOG-KAN-RETTES '; exception when sqlstate '42501' then null; end;
  begin delete from public.ticket_meta_log where ticket_id = tid; res := res || 'LOG-KAN-SLETTES '; exception when sqlstate '42501' then null; end;
  execute 'reset role';

  -- Alt følger ticketten ved sletning
  delete from public.feedback_tickets where id = tid;
  select count(*) into n from public.ticket_meta where ticket_id = tid; if n <> 0 then res := res || 'META-BLEV-STAAENDE '; end if;
  select count(*) into n from public.ticket_tasks where ticket_id = tid; if n <> 0 then res := res || 'OPGAVER-BLEV-STAAENDE '; end if;
  select count(*) into n from public.ticket_meta_log where ticket_id = tid; if n <> 0 then res := res || 'LOG-BLEV-STAAENDE '; end if;
  if res <> '' then raise exception 'TICKET-ARBEJDSGANG: %', res; end if;
end $$;
rollback;
select 'TICKET-ARBEJDSGANG: ALLE TESTS BESTAAET' as resultat;
