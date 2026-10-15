-- Test af AI-budgettet (15. okt. 2026): kun administratorer kan læse og sætte det, ugyldige værdier afvises, og en ændring logges i adminloggen.
-- Kører i CI mod en frisk database bygget fra migrationerne. Alt rulles tilbage.
begin;

do $$
declare
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid();
  n int; res text := ''; v jsonb;
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;

  -- Almindelig bruger: hverken læse eller sætte
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);
  begin perform public.get_ai_budget(); res := res || 'BRUGER-LAESER-BUDGET '; exception when others then null; end;
  begin perform public.set_ai_budget(500, 80, 100); res := res || 'BRUGER-SAETTER-BUDGET '; exception when others then null; end;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  -- Anonym: ingen adgang til funktionerne
  if has_function_privilege('anon', 'public.set_ai_budget(numeric,integer,integer)', 'EXECUTE') then res := res || 'ANON-KAN-SAETTE '; end if;
  if has_function_privilege('anon', 'public.get_ai_budget()', 'EXECUTE') then res := res || 'ANON-KAN-LAESE '; end if;

  -- Administrator
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  v := public.get_ai_budget();
  if v is not null then res := res || 'BUDGET-FOER-SAET-IKKE-TOMT '; end if;
  v := public.set_ai_budget(500, 80, 100);
  if (v ->> 'monthly_dkk')::numeric <> 500 then res := res || 'BUDGET-IKKE-GEMT '; end if;
  v := public.get_ai_budget();
  if (v ->> 'warn_1')::int <> 80 or (v ->> 'warn_2')::int <> 100 then res := res || 'GRAENSER-FORKERTE '; end if;
  -- Ugyldige værdier afvises
  begin perform public.set_ai_budget(0, 80, 100); res := res || 'NUL-BUDGET-ACCEPTERET '; exception when others then null; end;
  begin perform public.set_ai_budget(-5, 80, 100); res := res || 'NEGATIVT-BUDGET-ACCEPTERET '; exception when others then null; end;
  begin perform public.set_ai_budget(500, 120, 100); res := res || 'FORKERT-RAEKKEFOELGE-ACCEPTERET '; exception when others then null; end;
  begin perform public.set_ai_budget(2000000, 80, 100); res := res || 'FOR-STORT-BUDGET-ACCEPTERET '; exception when others then null; end;
  -- Ændringen logges med fra og til
  perform public.set_ai_budget(750, 70, 100);
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='ai_budget_aendret' and details->>'fra'='500.00 kr.' and details->>'til'='750.00 kr.';
  if n<>1 then res := res || 'BUDGETAENDRING-IKKE-LOGGET(' || n || ') '; end if;
  -- Intet budget fjerner indstillingen
  perform public.set_ai_budget(null);
  if public.get_ai_budget() is not null then res := res || 'BUDGET-IKKE-FJERNET '; end if;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  if res <> '' then raise exception 'AI-BUDGET: %', res; end if;
end $$;

rollback;
select 'AI-BUDGET: ALLE TESTS BESTAAET' as resultat;
