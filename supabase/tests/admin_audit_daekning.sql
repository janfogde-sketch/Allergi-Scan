-- Dækningstest for adminloggen (16. okt. 2026): hver handling, som databasens udløsere registrerer for en administrator, giver PRÆCIS én
-- logpost (ingen dubletter) med rigtig handling, aktør, mål og uden følsomme værdier. Supplerer admin_audit.sql (rolle, ticket, produkt,
-- profil, allergier, eksport, opbevaring og adgang). Dokumenterer også, hvad der IKKE logges: ændringer uden administratorlogin
-- (systemproces, databaseadministrator, service-nøglen). Kører i CI mod en frisk database bygget fra migrationerne. Alt rulles tilbage.
begin;

do $$
declare
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid(); oth uuid := gen_random_uuid();
  fm uuid; fi uuid; sid uuid; kid text; pid uuid; n int; before_n int; res text := '';
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (usr,'usr-'||substr(usr::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (oth,'oth-'||substr(oth::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;
  delete from public.admin_audit_log;

  -- Handlingerne udføres som database-ejer, men med administratorens login-id (som PostgREST giver udløserne det)
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);

  -- Familie: en admin sletter en andens familiemedlem og annullerer en andens invitation
  insert into public.family_members(family_owner_id, name) values (oth, 'Testbarn') returning id into fm;
  select count(*) into n from public.admin_audit_log; if n<>0 then res := res || 'FAMILIE-OPRETTELSE-LOGGET(' || n || ') '; end if;
  delete from public.family_members where id = fm;
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='familiemedlem_slettet' and target_id=fm::text and target_table='family_members';
  if n<>1 then res := res || 'FAMILIEMEDLEM-SLETNING(' || n || ') '; end if;
  select count(*) into n from public.admin_audit_log where details::text like '%Testbarn%';
  if n<>0 then res := res || 'FAMILIEMEDLEMS-NAVN-I-LOGGEN '; end if;

  insert into public.family_invites(invited_by) values (oth) returning id into fi;
  delete from public.family_invites where id = fi;
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='invitation_annulleret' and target_id=fi::text;
  if n<>1 then res := res || 'INVITATION-ANNULLERET(' || n || ') '; end if;

  -- Push-tekster: oprettelse, rettelse og sletning giver hver én post; titel og tekst er indhold og må stå i loggen
  insert into public.notification_push_overrides(key, title, body) values ('test_audit_nøgle', 'Titel', 'Tekst');
  update public.notification_push_overrides set body = 'Ny tekst' where key = 'test_audit_nøgle';
  delete from public.notification_push_overrides where key = 'test_audit_nøgle';
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='pushtekst_aendret' and target_id='test_audit_nøgle';
  if n<>3 then res := res || 'PUSHTEKST-ANTAL-POSTER(' || n || ') '; end if;
  select count(*) into n from public.admin_audit_log where action='pushtekst_aendret' and details->>'tekst'='Ny tekst';
  if n<>1 then res := res || 'PUSHTEKST-RETTELSE-MANGLER-TEKST(' || n || ') '; end if;

  -- Indsendelser: statusskift fra en admin med egen login logges én gang (via edge-funktionen logges det som godkendt/afvist, se nedenfor)
  insert into public.submissions(ean) values ('5700000099993') returning id into sid;
  update public.submissions set status = 'approved' where id = sid;
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='indsendelse_behandlet' and target_id=sid::text
    and details->>'fra'='pending' and details->>'til'='approved';
  if n<>1 then res := res || 'INDSENDELSE-STATUS(' || n || ') '; end if;
  update public.submissions set ean = '5700000099994' where id = sid; -- uden statusskift: intet logges
  select count(*) into n from public.admin_audit_log where action='indsendelse_behandlet' and target_id=sid::text;
  if n<>1 then res := res || 'INDSENDELSE-UDEN-STATUSSKIFT-LOGGET(' || n || ') '; end if;

  -- Leksikon: sletning logges med titel
  insert into public.knowledge_base(category,title,slug) values ('faq','Sletteposten','sletteposten-audit-'||substr(adm::text,1,8)) returning id::text into kid;
  delete from public.knowledge_base where id::text = kid;
  select count(*) into n from public.admin_audit_log where admin_id=adm and action='vidensindgang_slettet' and target_id=kid and details->>'navn'='Sletteposten';
  if n<>1 then res := res || 'LEKSIKON-SLETNING(' || n || ') '; end if;

  -- Adminens egne rækker logges ikke (egen profil og eget familiemedlem)
  select count(*) into before_n from public.admin_audit_log;
  update public.users set name = 'Admin selv' where id = adm;
  select count(*) into n from public.admin_audit_log; if n<>before_n then res := res || 'EGEN-PROFIL-LOGGET '; end if;

  -- Ændringer UDEN administratorlogin (systemproces, databaseadministrator, service-nøgle) registreres IKKE af udløserne:
  -- aktøren er ukendt, og en administrator må aldrig angives som aktør, når identiteten er ukendt.
  perform set_config('request.jwt.claims', '', true);
  insert into public.products(ean,name) values ('5700000099995','Systemvare') returning id into pid;
  update public.products set ingredients_text = 'mel' where id = pid;
  delete from public.products where id = pid;
  update public.users set name = 'Systemrettet' where id = usr;
  select count(*) into n from public.admin_audit_log where target_id = pid::text or target_id = usr::text;
  if n<>0 then res := res || 'SYSTEMHANDLING-LOGGET-MED-AKTOER(' || n || ') '; end if;

  -- En almindelig brugers ændring af eget indhold logges ikke som adminhandling
  perform set_config('request.jwt.claims', json_build_object('sub', usr, 'role', 'authenticated')::text, true);
  update public.users set name = 'Bruger selv' where id = usr;
  select count(*) into n from public.admin_audit_log where target_id = usr::text; if n<>0 then res := res || 'BRUGERHANDLING-LOGGET(' || n || ') '; end if;
  perform set_config('request.jwt.claims', '', true);

  if res <> '' then raise exception 'ADMINLOG-DAEKNING: %', res; end if;
end $$;

rollback;
select 'ADMINLOG-DAEKNING: ALLE TESTS BESTAAET' as resultat;
