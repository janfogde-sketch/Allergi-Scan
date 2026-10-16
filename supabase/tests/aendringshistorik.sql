-- Test af ændringshistorikken (16. okt. 2026): kun administratorer, begge kilder samlet uden at gætte manglende værdier, produktnavn/EAN overlever sletning,
-- filtre (handling, allergen, søgning, periode) og sortering. Alt rulles tilbage.
begin;
do $$
declare
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid(); pid uuid; n int; st text; r record; res text := '';
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin', name='Testadmin Historik' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;
  insert into public.products(ean,name) values ('0090000009991','Historiktest') returning id into pid;

  insert into public.admin_audit_log(admin_id,action,target_table,target_id,details,created_at) values
    (adm,'produkt_rettet','products',pid::text,'{"ean":"0090000009991","navn":"Historiktest","felter":["allergen_flags"],"aendringer":[{"felt":"allergen_flags","fra":{"maelkeallergi":"unknown"},"til":{"maelkeallergi":"yes"}}]}', now()-interval '1 hour'),
    (adm,'produkt_rettet','products',pid::text,'{"ean":"0090000009991","navn":"Historiktest","felter":["name"],"aendringer":[{"felt":"name","fra":"Gammelt navn","til":"Historiktest"}]}', now()-interval '2 hours'),
    (adm,'produkt_slettet','products','00000000-0000-0000-0000-000000000001','{"ean":"0090000009900","navn":"Slettet vare"}', now()-interval '3 hours');
  insert into public.revision_log(product_id,changed_by,change_type,field_changed,new_value,created_at) values (pid, adm, 'created', 'all', 'Oprettet via brugerindsendelse', now()-interval '4 hours');
  insert into public.admin_audit_log(admin_id,action,target_table,target_id,details,outcome) values (adm,'produkt_rettet','products',pid::text,'{"fejl":"x"}','mislykket');

  -- Ikke-administrator får ingenting
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', usr,'role','authenticated')::text, true);
  begin perform * from public.admin_product_history(); res := res || 'BRUGER-KAN-LAESE '; exception when sqlstate '42501' then null; end;
  execute 'reset role';
  execute 'set local role anon';
  begin perform * from public.admin_product_history(); res := res || 'ANON-KAN-LAESE '; exception when sqlstate '42501' then null; end;
  execute 'reset role';

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  select count(*) into n from public.admin_product_history('0090000009'); if n <> 1 then res := res || 'EAN-PRAEFIKS(' || n || ') '; end if;
  select count(*) into n from public.admin_product_history('Historiktest'); if n <> 3 then res := res || 'SOEGNING-NAVN(' || n || ') '; end if;
  select count(*) into n from public.admin_product_history('Testadmin'); if n <> 4 then res := res || 'SOEGNING-AKTOER(' || n || ') '; end if;
  select count(*) into n from public.admin_product_history('Historiktest', null, null, true); if n <> 1 then res := res || 'ALLERGENFILTER(' || n || ') '; end if;
  select count(*) into n from public.admin_product_history('Historiktest', 'deleted'); if n <> 0 then res := res || 'SLETTET-FILTER-NAVN '; end if;
  select count(*) into n from public.admin_product_history('Slettet vare', 'deleted'); if n <> 1 then res := res || 'SLETTET-FILTER(' || n || ') '; end if;
  select count(*) into n from public.admin_product_history('Historiktest', 'created'); if n <> 1 then res := res || 'OPRETTET-FILTER(' || n || ') '; end if;
  -- Mislykkede forsøg er ikke ændringer: aktørsøgningen finder kun de tre lykkede audit-poster og den ældre post
  select count(*) into n from public.admin_product_history('Testadmin'); if n <> 4 then res := res || 'MISLYKKET-MEDTAGET(' || n || ') '; end if;
  -- Slettet produkt: navn og EAN fra øjebliksbilledet, ikke eksisterende
  select * into r from public.admin_product_history('Slettet vare'); if r.product_exists or r.ean <> '0090000009900' then res := res || 'SLETTET-IDENTIFICERES-IKKE '; end if;
  -- Ældre post: ingen før/efter-værdier opfundet, men produkt og aktør findes
  select * into r from public.admin_product_history('Historiktest', 'created'); if r.changes is not null or r.source <> 'legacy' or r.actor_name <> 'Testadmin Historik' or r.name <> 'Historiktest' then res := res || 'AELDRE-POST(' || coalesce(r.source,'?') || ') '; end if;
  -- Før/efter bevares uændret
  select * into r from public.admin_product_history('Historiktest', null, null, true); if r.changes -> 0 -> 'til' ->> 'maelkeallergi' <> 'yes' or r.changes -> 0 -> 'fra' ->> 'maelkeallergi' <> 'unknown' then res := res || 'FOER-EFTER-FORKERT '; end if;
  -- Sortering
  select action into st from public.admin_product_history('Historiktest', null, null, false, 'oldest', 1, 0); if st <> 'created' then res := res || 'AELDST-FOERST(' || coalesce(st,'?') || ') '; end if;
  select action into st from public.admin_product_history('Historiktest', null, null, false, 'newest', 1, 0); if st <> 'updated' then res := res || 'NYESTE-FOERST(' || coalesce(st,'?') || ') '; end if;
  select count(*) into n from public.admin_product_history('Historiktest', null, 1); if n <> 3 then res := res || 'PERIODE(' || n || ') '; end if;
  execute 'reset role';
  if res <> '' then raise exception 'AENDRINGSHISTORIK: %', res; end if;
end $$;
rollback;
select 'AENDRINGSHISTORIK: ALLE TESTS BESTAAET' as resultat;
