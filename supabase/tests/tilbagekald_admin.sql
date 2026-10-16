-- Test af tilbagekaldelser (16. okt. 2026): afgørelse logger hvem og hvorfor og gemmer matches, historikken kan ikke rettes, matchafgørelser kræver begrundelse og administrator,
-- varslingstal er kun tal, scanneren finder en tilbagekaldelse uanset foranstillede nuller, arkivering skjuler ikke advarslen, og annullering gør. Alt rulles tilbage.
begin;
do $$
declare
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid(); rid uuid; rid2 uuid; n int; st text; j jsonb; res text := '';
  e1 text := '5700000099916'; e2 text := '15700000099913';
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;
  insert into public.products(ean,name) values (e1,'Tilbagekaldstest') on conflict do nothing;
  insert into public.recalls(source_url,title,published_at,status,eans) values ('https://foedevarestyrelsen.dk/test-'||adm,'Tilbagekald: test',now()-interval '2 days','needs_review','{}') returning id into rid;
  insert into public.recalls(source_url,title,published_at,status,eans) values ('https://foedevarestyrelsen.dk/test2-'||adm,'Tilbagekald: test2',now()-interval '2 days','ready',array['0'||e1]) returning id into rid2;

  -- Almindelig bruger: ingen adgang
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);
  begin perform public.admin_resolve_recall(rid, 'archive'); res := res || 'BRUGER-KAN-AFGOERE '; exception when others then null; end;
  begin perform public.admin_set_recall_match(rid, e1, 'confirmed', 'Begrundelse her'); res := res || 'BRUGER-KAN-MATCHE '; exception when others then null; end;
  begin perform public.admin_recall_notification_stats(rid); res := res || 'BRUGER-KAN-TAL '; exception when others then null; end;
  select count(*) into n from public.recall_events; if n <> 0 then res := res || 'BRUGER-SER-HISTORIK '; end if;
  execute 'reset role';

  -- Administrator
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  begin perform public.admin_set_recall_match(rid, e1, 'not_covered', 'kort'); res := res || 'BEGRUNDELSE-FOR-KORT '; exception when sqlstate '22023' then null; end;
  begin perform public.admin_set_recall_match(rid, e1, 'fantasi', 'Lang nok begrundelse'); res := res || 'UGYLDIGT-NIVEAU '; exception when sqlstate '22023' then null; end;
  perform public.admin_set_recall_match(rid, e1, 'not_covered', 'Andet parti kontrolleret på emballage');
  select count(*) into n from public.recall_matches where recall_id = rid and ean = e1 and level = 'not_covered' and decided_by = adm; if n <> 1 then res := res || 'MATCH-IKKE-GEMT '; end if;
  select count(*) into n from public.recall_events where recall_id = rid and kind = 'match_decided' and actor_id = adm; if n <> 1 then res := res || 'MATCH-IKKE-LOGGET '; end if;

  -- Knyt og send: valgt produkt bliver bekræftet match med begrundelse, besked lægges i kø én gang, og hændelsen logges
  perform public.admin_resolve_recall(rid, 'link', array[e1], 'Navn og stregkode stemmer');
  select status into st from public.recalls where id = rid; if st <> 'ready' then res := res || 'IKKE-READY '; end if;
  select count(*) into n from public.recall_matches where recall_id = rid and ean = e1 and level = 'confirmed' and basis = 'Navn og stregkode stemmer'; if n <> 1 then res := res || 'BEKRAEFTET-MATCH-IKKE-GEMT '; end if;
  select count(*) into n from public.recall_events where recall_id = rid and kind = 'linked' and actor_id = adm; if n <> 1 then res := res || 'LINKED-IKKE-LOGGET '; end if;
  begin perform public.admin_resolve_recall(rid, 'archive'); res := res || 'GENAFGOERELSE '; exception when others then null; end;
  j := public.admin_recall_notification_stats(rid);
  if (j ->> 'recipients')::int <> 0 then res := res || 'MODTAGERE-FORKERT '; end if;
  if j ? 'user_id' or j::text ilike '%@%' then res := res || 'PERSONDATA-I-TAL '; end if;

  -- Historikken kan ikke rettes
  begin update public.recall_events set kind = 'note' where recall_id = rid; res := res || 'HISTORIK-KAN-RETTES '; exception when others then null; end;
  begin delete from public.recall_events where recall_id = rid; res := res || 'HISTORIK-KAN-SLETTES '; exception when others then null; end;
  execute 'reset role';

  -- Scanneren: foranstillede nuller, arkivering og annullering
  execute 'set local role anon';
  select count(*) into n from public.active_recalls_for_ean(e1) where title = 'Tilbagekald: test2'; if n <> 1 then res := res || 'NULLER-FINDES-IKKE(' || n || ') '; end if;
  select count(*) into n from public.active_recalls_for_ean('0'||e1) where title = 'Tilbagekald: test2'; if n <> 1 then res := res || 'DIREKTE-FINDES-IKKE '; end if;
  select count(*) into n from public.active_recalls_for_ean(e2) where title = 'Tilbagekald: test2'; if n <> 0 then res := res || 'KARTON-FEJLMATCH '; end if;
  execute 'reset role';
  update public.recalls set status = 'archived' where id = rid2;
  execute 'set local role anon';
  select count(*) into n from public.active_recalls_for_ean(e1) where title = 'Tilbagekald: test2'; if n <> 1 then res := res || 'ARKIVERING-SKJULER-ADVARSEL '; end if;
  execute 'reset role';
  update public.recalls set status = 'cancelled' where id = rid2;
  execute 'set local role anon';
  select count(*) into n from public.active_recalls_for_ean(e1) where title = 'Tilbagekald: test2'; if n <> 0 then res := res || 'ANNULLERET-VISES '; end if;
  execute 'reset role';
  update public.recalls set status = 'archived', published_at = now() - interval '90 days' where id = rid2;
  execute 'set local role anon';
  select count(*) into n from public.active_recalls_for_ean(e1) where title = 'Tilbagekald: test2'; if n <> 0 then res := res || 'FOR-GAMMEL-VISES '; end if;
  execute 'reset role';

  -- Kørselslog accepterer hentningen
  if public.import_run_start('recalls_sync', 'cron') is null then res := res || 'SYNC-KOERSEL-AFVIST '; end if;
  if res <> '' then raise exception 'TILBAGEKALD-ADMIN: %', res; end if;
end $$;
rollback;
select 'TILBAGEKALD-ADMIN: ALLE TESTS BESTAAET' as resultat;
