-- Test af onboardingstatus og -statistik (16. okt. 2026): serverkontrol af "gennemført", registrering af trin og fremgang, statusser der aldrig overlapper,
-- testkonti adskilt, ubekræftede konti for sig, tragt fra faktisk registrerede trin, kun for administratorer og ingen personoplysninger i svaret.
-- Kører i CI mod en frisk database bygget fra migrationerne. Alt rulles tilbage.
begin;

do $$
declare
  adm uuid := gen_random_uuid(); done_u uuid := gen_random_uuid(); unc uuid := gen_random_uuid(); ns uuid := gen_random_uuid();
  ip uuid := gen_random_uuid(); dr uuid := gen_random_uuid(); tst uuid := gen_random_uuid(); usr uuid := gen_random_uuid();
  n int; res text := ''; v jsonb; rec record; d date := (now() at time zone 'Europe/Copenhagen')::date;
begin
  insert into auth.users(id,email,aud,role,email_confirmed_at) values
    (adm, 'adm-'||substr(adm::text,1,8)||'@example.org','authenticated','authenticated', now()),
    (done_u, 'done-'||substr(done_u::text,1,8)||'@example.org','authenticated','authenticated', now()),
    (unc, 'unc-'||substr(unc::text,1,8)||'@example.org','authenticated','authenticated', null),
    (ns, 'ns-'||substr(ns::text,1,8)||'@example.org','authenticated','authenticated', now()),
    (ip, 'ip-'||substr(ip::text,1,8)||'@example.org','authenticated','authenticated', now()),
    (dr, 'dr-'||substr(dr::text,1,8)||'@example.org','authenticated','authenticated', now()),
    (tst, 'test-'||substr(tst::text,1,8)||'@example.com','authenticated','authenticated', now()),
    (usr, 'usr-'||substr(usr::text,1,8)||'@example.org','authenticated','authenticated', now());
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;
  -- Administratorens og den almindelige brugers konti hører ikke med i testen af kohorten: de er gennemført, så de kan udelades ved at flytte oprettelsesdatoen
  update public.users set created_at = now() - interval '40 days' where id in (adm, usr);

  -- Nye konti starter som ufærdige med trin og højeste trin registreret
  select onboarding_completed, onboarding_step, onboarding_max_step into rec from public.users where id=ns;
  if rec.onboarding_completed is not false or rec.onboarding_max_step is distinct from rec.onboarding_step then res := res || 'NY-KONTO-FORKERT '; end if;

  -- Serverkontrol: kan ikke gennemføres uden navn, alder og køn (som den handlende bruger selv)
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', done_u,'role','authenticated')::text, true);
  begin update public.users set onboarding_completed=true where id=done_u; res := res || 'GENNEMFOERT-UDEN-PROFIL '; exception when others then null; end;
  update public.users set name='Done', birth_year=1990 where id=done_u;
  begin update public.users set onboarding_completed=true where id=done_u; res := res || 'GENNEMFOERT-UDEN-KOEN '; exception when others then null; end;
  update public.users set gender='Kvinde' where id=done_u;
  update public.users set onboarding_completed=true where id=done_u;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';
  select onboarding_completed, onboarding_completed_at, onboarding_progress_at into rec from public.users where id=done_u;
  if rec.onboarding_completed is not true or rec.onboarding_completed_at is null or rec.onboarding_progress_at is null then res := res || 'GENNEMFOERT-IKKE-REGISTRERET '; end if;
  -- Samtykke: gemte allergier uden samtykke kan ikke gennemføres (en SQL-rettelse uden login er undtaget)
  update public.users set name='Ip', birth_year=1990, gender='Mand' where id=ip;
  insert into public.user_allergens(user_id, allergen, type) values (ip, 'milk', 'allergen');
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', ip,'role','authenticated')::text, true);
  begin update public.users set onboarding_completed=true where id=ip; res := res || 'GENNEMFOERT-UDEN-SAMTYKKE '; exception when others then null; end;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';
  select onboarding_completed into rec from public.users where id=ip; if rec.onboarding_completed is true then res := res || 'IP-ER-GENNEMFOERT '; end if;
  delete from public.user_allergens where user_id=ip;

  -- Trinregistrering: højeste trin falder aldrig, og fremgang registreres kun ved et ændret trin
  update public.users set onboarding_step=3 where id=ip;
  update public.users set onboarding_step=2 where id=ip;
  select onboarding_max_step, onboarding_progress_at into rec from public.users where id=ip;
  if rec.onboarding_max_step<>3 or rec.onboarding_progress_at is null then res := res || 'TRIN-IKKE-REGISTRERET '; end if;
  update public.users set onboarding_step=3 where id=ip;
  update public.users set onboarding_step=2 where id=dr;
  update public.users set onboarding_progress_at = now() - interval '30 hours' where id=dr; -- fremgangen er 30 timer gammel
  select count(*) into n from public.users where id=ns and onboarding_progress_at is not null; if n<>0 then res := res || 'IKKE-STARTET-HAR-FREMGANG '; end if;

  -- Statistik: kun administratorer
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);
  begin perform public.admin_onboarding_stats(d, d); res := res || 'BRUGER-SER-STATISTIK '; exception when others then null; end;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';
  if has_function_privilege('anon', 'public.admin_onboarding_stats(date,date,boolean)', 'execute') then res := res || 'ANON-SER-STATISTIK '; end if;

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  begin perform public.admin_onboarding_stats(d, d - 1); res := res || 'OMVENDT-PERIODE '; exception when others then null; end;
  begin perform public.admin_onboarding_stats(d - 900, d); res := res || 'FOR-LANG-PERIODE '; exception when others then null; end;

  v := public.admin_onboarding_stats(d, d);
  -- Kohorten er de 6 konti oprettet i dag minus testkontoen: gennemført, ubekræftet, ikke startet, igangværende og muligt frafald
  if (v->>'total')::int<>5 then res := res || 'TOTAL(' || (v->>'total') || ') '; end if;
  if (v->>'completed')::int<>1 or (v->>'unconfirmed')::int<>1 or (v->>'not_started')::int<>1 or (v->>'in_progress')::int<>1 or (v->>'possible_dropout')::int<>1 then
    res := res || 'STATUSSER(' || v::text || ') '; end if;
  if (v->>'completed')::int + (v->>'unconfirmed')::int + (v->>'not_started')::int + (v->>'in_progress')::int + (v->>'possible_dropout')::int <> (v->>'total')::int then res := res || 'STATUSSER-OVERLAPPER '; end if;
  if (v->>'test_accounts')::int<>1 then res := res || 'TESTKONTI(' || (v->>'test_accounts') || ') '; end if;
  v := public.admin_onboarding_stats(d, d, true);
  if (v->>'total')::int<>6 or (v->>'completed')::int + (v->>'unconfirmed')::int + (v->>'not_started')::int + (v->>'in_progress')::int + (v->>'possible_dropout')::int <> 6 then res := res || 'MED-TESTKONTI-FORKERT '; end if;
  v := public.admin_onboarding_stats(d, d);

  -- Trin: senest registrerede trin for uafsluttede, bekræftede konti med fremgang; heraf inaktive
  if not (v->'steps' @> '[{"step":3,"latest":1,"inactive":0}]'::jsonb) then res := res || 'TRIN-3-FORKERT '; end if;
  if not (v->'steps' @> '[{"step":2,"latest":1,"inactive":1}]'::jsonb) then res := res || 'TRIN-2-FORKERT '; end if;
  -- Tragt: kun bekræftede konti med registreret trin; gennemført tæller som fortsat forbi alle trin
  if (v->>'funnel_users')::int<>4 then res := res || 'TRAGT-ANTAL(' || (v->>'funnel_users') || ') '; end if;
  if not (v->'funnel' @> '[{"step":1,"reached":4,"continued":3}]'::jsonb) then res := res || 'TRAGT-1(' || (v->'funnel')::text || ') '; end if;
  if not (v->'funnel' @> '[{"step":3,"reached":2,"continued":1}]'::jsonb) then res := res || 'TRAGT-3(' || (v->'funnel')::text || ') '; end if;
  -- Ingen personoplysninger i svaret
  if v::text like '%@%' or v::text like '%example%' then res := res || 'PERSONDATA-I-SVAR '; end if;
  if (select count(*) from jsonb_object_keys(v) k where k in ('email','name','users','ids')) <> 0 then res := res || 'PERSON-NOEGLER '; end if;
  -- Perioden afgrænser kohorten: i går er tom
  v := public.admin_onboarding_stats(d - 1, d - 1);
  if (v->>'total')::int<>0 then res := res || 'GAARSDAGEN-IKKE-TOM '; end if;
  if v->>'first_account' is null then res := res || 'FOERSTE-KONTO-MANGLER '; end if;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  if res <> '' then raise exception 'ONBOARDING-STATUS: %', res; end if;
end $$;

rollback;
select 'ONBOARDING-STATUS: ALLE TESTS BESTAAET' as resultat;
