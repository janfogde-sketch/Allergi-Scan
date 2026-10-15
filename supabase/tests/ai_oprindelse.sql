-- Test af AI-forbrugets oprindelse (16. okt. 2026): ældre kald med fire parametre virker og bliver "unknown", oprindelsen adskiller rækkerne,
-- ukendte værdier bliver "unknown", kun service-nøglen kan logge, og almindelige brugere kan ikke læse tabellen. Kører i CI. Alt rulles tilbage.
begin;

do $$
declare
  usr uuid := gen_random_uuid(); n int; res text := ''; c bigint;
begin
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  delete from public.ai_usage_daily;

  perform public.log_ai_usage('allergens', 'claude-haiku-4-5', 100, 10);                      -- gammelt kald: fire parametre
  perform public.log_ai_usage('allergens', 'claude-haiku-4-5', 100, 10, 'user');
  perform public.log_ai_usage('allergens', 'claude-haiku-4-5', 100, 10, 'user');
  perform public.log_ai_usage('allergens', 'claude-haiku-4-5', 100, 10, 'internal');
  perform public.log_ai_usage('allergens', 'claude-haiku-4-5', 100, 10, 'noget-andet');        -- ukendt værdi
  perform public.log_ai_usage('allergens', 'claude-haiku-4-5', null, null, 'user');           -- manglende tokens tæller som 0

  select count(*) into n from public.ai_usage_daily; if n<>3 then res := res || 'RAEKKER(' || n || ') '; end if;
  select calls into c from public.ai_usage_daily where origin='user'; if c<>3 then res := res || 'USER-KALD(' || c || ') '; end if;
  select input_tokens into c from public.ai_usage_daily where origin='user'; if c<>200 then res := res || 'USER-TOKENS(' || c || ') '; end if;
  select calls into c from public.ai_usage_daily where origin='internal'; if c<>1 then res := res || 'INTERNAL-KALD(' || c || ') '; end if;
  select calls into c from public.ai_usage_daily where origin='unknown'; if c<>2 then res := res || 'UNKNOWN-KALD(' || c || ') '; end if;
  select count(*) into n from public.ai_usage_daily where day <> (now() at time zone 'Europe/Copenhagen')::date; if n<>0 then res := res || 'FORKERT-DAG '; end if;

  begin
    insert into public.ai_usage_daily(day, function_name, model, origin) values (current_date, 'x', 'y', 'forkert'); res := res || 'UGYLDIG-ORIGIN-ACCEPTERET ';
  exception when check_violation then null; end;

  if has_function_privilege('anon', 'public.log_ai_usage(text,text,bigint,bigint,text)', 'EXECUTE') then res := res || 'ANON-KAN-LOGGE '; end if;
  if has_function_privilege('authenticated', 'public.log_ai_usage(text,text,bigint,bigint,text)', 'EXECUTE') then res := res || 'BRUGER-KAN-LOGGE '; end if;
  if not has_function_privilege('service_role', 'public.log_ai_usage(text,text,bigint,bigint,text)', 'EXECUTE') then res := res || 'SERVICE-KAN-IKKE-LOGGE '; end if;

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);
  select count(*) into n from public.ai_usage_daily; if n<>0 then res := res || 'BRUGER-LAESER-FORBRUG(' || n || ') '; end if;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  if res <> '' then raise exception 'AI-OPRINDELSE: %', res; end if;
end $$;

rollback;
select 'AI-OPRINDELSE: ALLE TESTS BESTAAET' as resultat;
