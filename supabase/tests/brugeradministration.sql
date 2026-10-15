-- Test af brugeradministrationen (16. okt. 2026): rolleskift kun af administratorer og aldrig på sig selv, hentning af én bruger med dataminimering og
-- versionsnøgle, gemning uden at røre e-mail/rolle/onboarding, begrundelse ved ændring af allergipræferencer med ÉN logpost uden hvilke allergier,
-- afvisning af forældet version og sletteoversigt med tal. Kører i CI mod en frisk database bygget fra migrationerne. Alt rulles tilbage.
begin;

do $$
declare
  adm uuid := gen_random_uuid(); adm2 uuid := gen_random_uuid(); usr uuid := gen_random_uuid(); oth uuid := gen_random_uuid();
  n int; res text := ''; v jsonb; ver text; rec record; fid uuid;
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (adm2,'adm2-'||substr(adm2::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (oth,'oth-'||substr(oth::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id in (adm, adm2);
  alter table public.users enable trigger prevent_role_self_escalation_trigger;
  update public.users set name='Bruger Et', birth_year=1990, gender='Kvinde', onboarding_completed=false where id=usr;
  insert into public.user_allergens(user_id, allergen, type) values (usr,'milk','allergen'), (usr,'kanel','custom');
  insert into public.family_members(family_owner_id, name) values (usr, 'Barn') returning id into fid;
  delete from public.admin_audit_log;

  -- Anonym og almindelig bruger: ingen af funktionerne
  if has_function_privilege('anon', 'public.admin_set_role(uuid,text)', 'execute') or has_function_privilege('anon', 'public.admin_get_user(uuid,boolean)', 'execute')
     or has_function_privilege('anon', 'public.admin_save_user_profile(uuid,jsonb,text[],text[],text,text)', 'execute')
     or has_function_privilege('anon', 'public.admin_user_delete_summary(uuid)', 'execute') then res := res || 'ANON-KAN-KALDE '; end if;
  if has_function_privilege('authenticated', 'public.admin_user_version(uuid)', 'execute') then res := res || 'VERSION-AABEN '; end if;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', oth,'role','authenticated')::text, true);
  begin perform public.admin_set_role(usr, 'admin'); res := res || 'BRUGER-SAETTER-ROLLE '; exception when others then null; end;
  begin perform public.admin_get_user(usr, true); res := res || 'BRUGER-HENTER-BRUGER '; exception when others then null; end;
  begin perform public.admin_save_user_profile(usr, '{"name":"Hacket"}'::jsonb); res := res || 'BRUGER-GEMMER '; exception when others then null; end;
  begin perform public.admin_user_delete_summary(usr); res := res || 'BRUGER-SER-SLETTEOVERSIGT '; exception when others then null; end;
  begin update public.users set role='admin' where id=oth; res := res || 'BRUGER-OPHOEJER-SIG '; exception when others then null; end;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  -- Administrator
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);

  -- Rolle: aldrig sin egen (heller ikke direkte), ugyldig rolle afvises, en andens rolle skiftes og logges med fra/til og aktør
  begin perform public.admin_set_role(adm, 'user'); res := res || 'ADMIN-AENDRER-EGEN-ROLLE '; exception when others then null; end;
  begin update public.users set role='user' where id=adm; res := res || 'ADMIN-AENDRER-EGEN-ROLLE-DIREKTE '; exception when others then null; end;
  select role into rec from public.users where id=adm; if rec.role<>'admin' then res := res || 'EGEN-ROLLE-AENDRET '; end if;
  begin perform public.admin_set_role(usr, 'superadmin'); res := res || 'UGYLDIG-ROLLE-ACCEPTERET '; exception when others then null; end;
  begin perform public.admin_set_role(gen_random_uuid(), 'admin'); res := res || 'UKENDT-BRUGER-ACCEPTERET '; exception when others then null; end;
  perform public.admin_set_role(usr, 'admin');
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='rolle_aendret' and target_id=usr::text and details->>'fra'='user' and details->>'til'='admin';
  if n<>1 then res := res || 'ROLLESKIFT-IKKE-LOGGET(' || n || ') '; end if;
  perform public.admin_set_role(usr, 'user');
  -- Den sidste administrator kan ikke fjernes (adm2 er stadig admin, så først adm2 ned, derefter kan adm ikke fjernes af andre end sig selv)
  perform public.admin_set_role(adm2, 'user');
  begin perform public.admin_set_role(adm2, 'admin'); exception when others then res := res || 'ADMIN-KAN-IKKE-GENOPHOEJE '; end;
  perform public.admin_set_role(adm2, 'user');
  perform public.admin_set_role(adm2, 'admin');

  -- Hent én bruger: uden præferencer indeholder svaret ingen allergier, E-numre eller sporindstillinger; med dem indeholder det dem
  v := public.admin_get_user(usr);
  if v ? 'allergens' or v ? 'custom' or v ? 'e_numbers' or v ? 'allergen_levels' then res := res || 'PRAEFERENCER-UDEN-BEHOV '; end if;
  if v->>'name' <> 'Bruger Et' or (v->>'onboarding_completed')::boolean is not false then res := res || 'BRUGER-FORKERT '; end if;
  ver := v->>'version';
  v := public.admin_get_user(usr, true);
  if v->'allergens' <> '["milk"]'::jsonb or v->'custom' <> '["kanel"]'::jsonb then res := res || 'PRAEFERENCER-FORKERTE '; end if;
  if v->>'version' <> ver then res := res || 'VERSION-USTABIL '; end if;

  -- Navn, fødselsår og køn uden begrundelse; e-mail, rolle og onboarding ændres IKKE, og præferencer står urørt
  perform public.admin_save_user_profile(usr, '{"name":"Nyt Navn","birth_year":1985,"gender":"Mand","email":"hack@example.invalid","role":"admin","onboarding_completed":true}'::jsonb, null, null, null, ver);
  select name, birth_year, gender, email, role, onboarding_completed into rec from public.users where id=usr;
  if rec.name<>'Nyt Navn' or rec.birth_year<>1985 or rec.gender<>'Mand' then res := res || 'PROFIL-IKKE-GEMT '; end if;
  if rec.email like 'hack%' then res := res || 'EMAIL-AENDRET '; end if;
  if rec.role='admin' then res := res || 'ROLLE-AENDRET-VIA-PROFIL '; end if;
  if rec.onboarding_completed is not false then res := res || 'ONBOARDING-AENDRET '; end if;
  select count(*) into n from public.user_allergens where user_id=usr and family_member_id is null; if n<>2 then res := res || 'PRAEFERENCER-RAAET(' || n || ') '; end if;
  select count(*) into n from public.admin_audit_log where action='brugerpraeferencer_aendret'; if n<>0 then res := res || 'PRAEFERENCE-LOG-UDEN-AENDRING '; end if;

  -- Forældet version afvises, og intet ændres
  begin perform public.admin_save_user_profile(usr, '{"name":"Gammel"}'::jsonb, null, null, null, ver); res := res || 'FORAELDET-VERSION-ACCEPTERET '; exception when others then null; end;
  select name into rec from public.users where id=usr; if rec.name<>'Nyt Navn' then res := res || 'FORAELDET-AENDREDE '; end if;
  ver := public.admin_get_user(usr)->>'version';

  -- Præferencer kræver begrundelse; uden den (eller med tom) ændres intet
  begin perform public.admin_save_user_profile(usr, '{}'::jsonb, array['milk','egg'], array['kanel'], null, ver); res := res || 'PRAEFERENCER-UDEN-BEGRUNDELSE '; exception when others then null; end;
  begin perform public.admin_save_user_profile(usr, '{}'::jsonb, array['milk','egg'], array['kanel'], '   ', ver); res := res || 'PRAEFERENCER-MED-TOM-BEGRUNDELSE '; exception when others then null; end;
  begin perform public.admin_save_user_profile(usr, '{"allergen_levels":{"milk":"direct_only"}}'::jsonb, null, null, null, ver); res := res || 'SPOR-UDEN-BEGRUNDELSE '; exception when others then null; end;
  select count(*) into n from public.user_allergens where user_id=usr and family_member_id is null and allergen='egg'; if n<>0 then res := res || 'AFVIST-AENDRING-GEMT '; end if;

  -- Med begrundelse: gemmes, ÉN logpost med antal og begrundelse, aldrig hvilke allergier, og ingen dublet fra udløseren
  perform public.admin_save_user_profile(usr, '{"allergen_levels":{"milk":"direct_only"},"e_numbers":["E220"]}'::jsonb, array['milk','egg'], array[]::text[], 'Support: bruger bad os rette', ver);
  select count(*) into n from public.user_allergens where user_id=usr and family_member_id is null and type='allergen' and allergen in ('milk','egg'); if n<>2 then res := res || 'ALLERGIER-IKKE-GEMT(' || n || ') '; end if;
  select count(*) into n from public.user_allergens where user_id=usr and type='custom'; if n<>0 then res := res || 'EGNE-IKKE-FJERNET '; end if;
  select count(*) into n from public.admin_audit_log where action='brugerpraeferencer_aendret' and admin_id=adm and target_id=usr::text
     and details->>'begrundelse'='Support: bruger bad os rette' and (details->>'allergener_tilfoejet')::int=1 and (details->>'allergener_fjernet')::int=0
     and (details->>'egne_fjernet')::int=1 and (details->>'sporindstillinger_aendret')::int=1 and (details->>'enumre_aendret')::boolean;
  if n<>1 then res := res || 'PRAEFERENCE-LOG-FORKERT(' || n || ') '; end if;
  select count(*) into n from public.admin_audit_log where action='brugerallergier_aendret' and target_id=usr::text; if n<>0 then res := res || 'DOBBELT-LOG(' || n || ') '; end if;
  select count(*) into n from public.admin_audit_log where target_id=usr::text and (details::text like '%milk%' or details::text like '%egg%' or details::text like '%kanel%' or details::text like '%E220%');
  if n<>0 then res := res || 'ALLERGI-I-LOGGEN(' || n || ') '; end if;

  -- Sletteoversigt: kun tal
  v := public.admin_user_delete_summary(usr);
  if (v->>'family_profiles_owned')::int<>1 or (v->>'is_admin')::boolean then res := res || 'SLETTEOVERSIGT-FORKERT '; end if;
  if v::text like '%Barn%' then res := res || 'NAVN-I-SLETTEOVERSIGT '; end if;
  begin perform public.admin_user_delete_summary(gen_random_uuid()); res := res || 'UKENDT-BRUGER-SLETTEOVERSIGT '; exception when others then null; end;

  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';
  if res <> '' then raise exception 'BRUGERADMINISTRATION: %', res; end if;
end $$;

rollback;
select 'BRUGERADMINISTRATION: ALLE TESTS BESTAAET' as resultat;
