-- Test af kontosletning og opbevaringsfrister (GDPR). Kører i CI mod en frisk lokal database bygget fra migrationerne
-- (.github/workflows/db-tests.yml): `psql -v ON_ERROR_STOP=1 -f supabase/tests/account_deletion.sql`. Rører aldrig produktion.
--
-- 1) Liste-vagt: hver tabel/kolonne i public, der peger på en bruger eller rummer en e-mail, skal stå i `dækket` nedenfor.
--    Ny tabel med personoplysninger => testen fejler, til den er med i delete-user/cascade/oprydning OG på listen.
-- 2) Sletning: opretter en bruger med data i alle tabeller, gentager delete-user's trin, forventer nul rester.
-- 3) Opbevaring: gamle rækker ryddes af cleanup_notifications()/cleanup_family_invite_emails(), friske bliver.
--
-- DELETE-STEPS: shopping_list_items,shopping_lists,shopping_list_access,scan_history,user_allergens,family_members,family_memberships,families,feedback_tickets,submissions,users
-- (listen over er delete-user's rækkefølge; src/accountDeletionGuard.test.js tjekker, at den følger supabase/functions/delete-user/index.ts)
begin;

do $$
declare
  covered text[] := array[
    'admin_todo_comments.author_id','admin_todos.assignee_id','admin_todos.completed_by','admin_todos.created_by',
    'api_usage.user_id','client_errors.user_id','consent_log.user_id','custom_allergens.created_by',
    'families.created_by','family_invites.accepted_by','family_invites.invited_by','family_invites.invitee_email',
    'family_invites.requested_by','family_members.family_owner_id','family_members.user_id',
    'family_memberships.user_id','favorites.user_id','feedback_tickets.submitted_by',
    'notification_preferences.user_id','notification_push_overrides.updated_by','notifications.user_id',
    'push_tokens.user_id','recipes.reviewed_by','recipes.submitted_by','revision_log.changed_by',
    'scan_history.user_id','search_selections.user_id','security_reports.user_id',
    'shopping_list_access.user_id','shopping_list_hidden.user_id','shopping_list_items.added_by',
    'shopping_lists.owner_id','submissions.reviewed_by','submissions.submitted_by','user_allergens.user_id',
    'users.email','users.id'
  ];
  found text[]; missing text[]; stale text[];
begin
  select array_agg(distinct c.table_name||'.'||c.column_name order by c.table_name||'.'||c.column_name) into found
  from information_schema.columns c
  join information_schema.tables t on t.table_schema=c.table_schema and t.table_name=c.table_name and t.table_type='BASE TABLE'
  where c.table_schema='public'
    and c.table_name !~ '_(backup|fix|diff|down|match|ids)_?[0-9]*$' and c.table_name !~ '_[0-9]{8}$'
    and (
      c.column_name ~ '(^|_)(user_id|owner_id|created_by|submitted_by|added_by|invited_by|accepted_by|requested_by|reviewed_by|changed_by|author_id|assignee_id|updated_by|completed_by)$'
      or c.column_name ~ 'email$'
      or exists (select 1 from pg_constraint k join pg_attribute a on a.attrelid=k.conrelid and a.attnum=any(k.conkey)
                 where k.contype='f' and k.conrelid=to_regclass('public.'||quote_ident(c.table_name)) and a.attname=c.column_name
                   and k.confrelid in ('public.users'::regclass,'auth.users'::regclass))
    );
  select array_agg(x) into missing from unnest(found) x where x <> all(covered);
  select array_agg(x) into stale from unnest(covered) x where x <> all(found);
  if missing is not null then
    raise exception 'LISTE-VAGT: kolonner med brugerdata er ikke på listen over dækkede (tilføj sletning/oprydning, derefter listen): %', missing;
  end if;
  if stale is not null then
    raise exception 'LISTE-VAGT: kolonner på listen findes ikke mere (ryd listen op): %', stale;
  end if;
end $$;

do $$
declare
  uid uuid := gen_random_uuid(); uid2 uuid := gen_random_uuid();
  em text := 'gdpr-' || substr(gen_random_uuid()::text,1,8) || '@example.invalid';
  lid uuid; fid uuid; nid uuid; r record; cnt int; res text := '';
begin
  insert into auth.users(id,email,aud,role) values (uid,em,'authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (uid2,'ejer-'||substr(gen_random_uuid()::text,1,8)||'@example.invalid','authenticated','authenticated');
  update public.users set name='Test Slet' where id=uid;
  if not exists (select 1 from public.users where id=uid and email=em) then raise exception 'testbruger blev ikke oprettet i public.users'; end if;

  insert into api_usage(user_id,kind,day) values (uid,'ocr',current_date);
  insert into client_errors(user_id,fingerprint,message) values (uid,'fp'||uid,'m');
  insert into consent_log(user_id,kind,action,version) values (uid,'health','given','1');
  insert into families(name,created_by) values ('F',uid) returning id into fid;
  insert into family_memberships(family_id,user_id) values (fid,uid);
  insert into family_invites(invited_by,invitee_email) values (uid,'inv-'||em);
  insert into family_invites(invited_by,invitee_email,accepted_by,requested_by,status) values (uid2,em,uid,uid,'accepted');
  insert into family_members(name,user_id,family_owner_id) values ('Barn',uid,uid);
  insert into favorites(user_id,ean,product_snapshot) values (uid,'123','{}');
  insert into feedback_tickets(type,description,submitted_by) values ('bug','d',uid);
  insert into notification_preferences(user_id,category,channel) values (uid,'family','push');
  insert into notifications(user_id,event_key,type,category,template_version,title,push_body,content_blocks) values (uid,'k','t','c',1,'t','b','[]') returning id into nid;
  insert into notification_deliveries(notification_id,channel) values (nid,'push');
  insert into push_tokens(user_id,token) values (uid,'tok'||uid);
  insert into scan_history(user_id,ean_scanned,result) values (uid,'123','ok');
  insert into search_selections(user_id,query_norm,ean) values (uid,'q','123');
  insert into security_reports(user_id,kind) values (uid,'unrequested_password_reset');
  insert into shopping_lists(name,owner_id) values ('L',uid) returning id into lid;
  insert into shopping_list_access(list_id,user_id) values (lid,uid);
  insert into shopping_list_hidden(list_id,user_id) values (lid,uid);
  insert into shopping_list_items(list_id,added_by) values (lid,uid);
  insert into submissions(ean,submitted_by) values ('999'||substr(uid::text,1,6),uid);
  insert into user_allergens(user_id,allergen) values (uid,'gluten');
  insert into custom_allergens(name,created_by) values ('x',uid);

  -- samme trin som supabase/functions/delete-user/index.ts
  delete from shopping_list_items where added_by=uid;
  delete from shopping_lists where owner_id=uid;
  delete from shopping_list_access where user_id=uid;
  delete from scan_history where user_id=uid;
  delete from user_allergens where user_id=uid;
  delete from family_members where user_id=uid;
  delete from family_memberships where user_id=uid;
  update families set created_by=null where created_by=uid;
  delete from feedback_tickets where submitted_by=uid;
  delete from submissions where submitted_by=uid;
  delete from public.users where id=uid;
  delete from auth.users where id=uid;

  -- Modtagerens e-mail på en besvaret invitation ryddes af den natlige oprydning (højst ca. 48 t), ikke af sletningen.
  perform public.cleanup_family_invite_emails();

  for r in
    select c.table_name, c.column_name, c.udt_name
    from information_schema.columns c
    join information_schema.tables t on t.table_schema=c.table_schema and t.table_name=c.table_name and t.table_type='BASE TABLE'
    where c.table_schema='public' and c.udt_name in ('uuid','text')
  loop
    if r.udt_name='uuid' then
      execute format('select count(*) from public.%I where %I=$1', r.table_name, r.column_name) into cnt using uid;
    else
      execute format('select count(*) from public.%I where %I ilike $1', r.table_name, r.column_name) into cnt using '%'||em||'%';
    end if;
    if cnt>0 then res := res || r.table_name||'.'||r.column_name||'='||cnt||' '; end if;
  end loop;
  if res <> '' then raise exception 'SLETNING: rester efter kontosletning: %', res; end if;
end $$;

do $$
declare uid uuid := gen_random_uuid(); n int;
begin
  insert into auth.users(id,email,aud,role) values (uid,'ret-'||substr(uid::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into notifications(user_id,event_key,type,category,template_version,title,push_body,content_blocks,created_at)
    values (uid,'old','t','c',1,'t','b','[]', now()-interval '13 months'), (uid,'new','t','c',1,'t','b','[]', now()-interval '11 months');
  insert into client_errors(fingerprint,message,last_seen) values ('old'||uid,'m',now()-interval '91 days'),('new'||uid,'m',now()-interval '89 days');
  insert into security_reports(user_id,kind,created_at) values (uid,'unrequested_password_reset',now()-interval '13 months'),(uid,'unrequested_password_reset',now()-interval '11 months');
  insert into notification_events(kind,event_key,status,created_at) values ('k','old'||uid,'done',now()-interval '91 days'),('k','new'||uid,'done',now()-interval '89 days'),('k','pend'||uid,'pending',now()-interval '100 days');
  insert into api_usage(user_id,kind,day) values (uid,'old',current_date-31),(uid,'new',current_date-29);
  perform public.cleanup_notifications();
  select count(*) into n from notifications where user_id=uid; if n<>1 then raise exception 'OPBEVARING: notifications forventet 1 efter oprydning, fik %', n; end if;
  select count(*) into n from client_errors where fingerprint in ('old'||uid,'new'||uid); if n<>1 then raise exception 'OPBEVARING: client_errors forventet 1, fik %', n; end if;
  select count(*) into n from security_reports where user_id=uid; if n<>1 then raise exception 'OPBEVARING: security_reports forventet 1, fik %', n; end if;
  select count(*) into n from notification_events where event_key in ('old'||uid,'new'||uid,'pend'||uid); if n<>2 then raise exception 'OPBEVARING: notification_events forventet 2 (ny + afventende), fik %', n; end if;
  select count(*) into n from api_usage where user_id=uid; if n<>1 then raise exception 'OPBEVARING: api_usage forventet 1, fik %', n; end if;
end $$;

do $$
declare uid uuid := gen_random_uuid(); uid2 uuid := gen_random_uuid(); fid uuid; lid uuid; n int;
begin
  -- Direkte sletning af loginkontoen (uden delete-user) skal selv fjerne profilen og alt, der hænger på den.
  insert into auth.users(id,email,aud,role) values (uid,'cas-'||substr(uid::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (uid2,'cas2-'||substr(uid2::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into families(name,created_by) values ('F',uid) returning id into fid;
  insert into family_memberships(family_id,user_id) values (fid,uid),(fid,uid2);
  insert into shopping_lists(name,owner_id) values ('L',uid2) returning id into lid;
  insert into shopping_list_access(list_id,user_id) values (lid,uid);
  insert into user_allergens(user_id,allergen) values (uid,'gluten');
  delete from auth.users where id=uid;
  select count(*) into n from public.users where id=uid; if n<>0 then raise exception 'CASCADE: profil blev ikke slettet med loginkontoen'; end if;
  select count(*) into n from user_allergens where user_id=uid; if n<>0 then raise exception 'CASCADE: allergier blev ikke slettet'; end if;
  select count(*) into n from family_memberships where user_id=uid; if n<>0 then raise exception 'CASCADE: familiemedlemskab blev ikke slettet'; end if;
  select count(*) into n from shopping_list_access where user_id=uid; if n<>0 then raise exception 'CASCADE: listeadgang blev ikke slettet'; end if;
  select count(*) into n from families where id=fid and created_by is null; if n<>1 then raise exception 'CASCADE: familien skulle bestå uden opretter'; end if;
  select count(*) into n from family_memberships where user_id=uid2; if n<>1 then raise exception 'CASCADE: andre medlemmer skulle blive'; end if;
end $$;

rollback;
select 'KONTOSLETNING OG OPBEVARING: ALLE TESTS BESTAAET' as resultat;
