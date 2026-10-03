-- Databasetest af familie-invitationer (mail og delt link). Kan køres igen og igen: ALT rulles tilbage til sidst (scriptet afslutter altid med
-- en fejl, TEST_RESULTAT, så intet gemmes). Kør i Supabase SQL Editor eller via execute_sql. Kræver mindst tre brugere i public.users.
-- Hver linje i resultatet starter med OK eller FEJL. Se docs/familie-invitationer-testplan.md for den fulde testplan (også manuelle test).
do $$
declare
  u_a uuid; u_b uuid; u_c uuid;           -- A inviterer, B og C er modtagere
  email_b text; email_c text;
  inv uuid; tok text; r jsonb; n int;
  log text := ''; fejl int := 0;

  -- lille hjælper: skift den indloggede bruger (auth.uid())
begin
  select id into u_a from public.users order by created_at limit 1;
  select id into u_b from public.users where id <> u_a order by created_at limit 1;
  select id into u_c from public.users where id not in (u_a, u_b) order by created_at limit 1;
  if u_c is null then raise exception 'Kræver mindst tre brugere'; end if;
  select lower(btrim(email)) into email_b from auth.users where id = u_b;
  select lower(btrim(email)) into email_c from auth.users where id = u_c;

  -- ===== MAIL-INVITATION =====
  insert into public.family_invites (invited_by, invitee_email, kind) values (u_a, email_b, 'email') returning id, token into inv, tok;

  perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
  n := jsonb_array_length(public.get_my_pending_family_invites());
  log := log || case when n = 1 then 'OK   ' else 'FEJL ' end || 'M1 modtager (samme e-mail) ser invitationen: ' || n || E'\n'; if n <> 1 then fejl := fejl + 1; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', u_c, 'role', 'authenticated')::text, true);
  n := jsonb_array_length(public.get_my_pending_family_invites());
  log := log || case when n = 0 then 'OK   ' else 'FEJL ' end || 'M2 anden e-mail ser IKKE invitationen via e-mail-match: ' || n || E'\n'; if n <> 0 then fejl := fejl + 1; end if;
  r := public.accept_my_family_invite(inv);
  log := log || case when (r->>'success')::boolean is false then 'OK   ' else 'FEJL ' end || 'M3 anden e-mail kan ikke acceptere via id: ' || r::text || E'\n'; if (r->>'success')::boolean then fejl := fejl + 1; end if;
  r := public.decline_my_family_invite(inv);
  log := log || case when (r->>'success')::boolean is false then 'OK   ' else 'FEJL ' end || 'M4 anden e-mail kan ikke afvise via id: ' || r::text || E'\n'; if (r->>'success')::boolean then fejl := fejl + 1; end if;
  r := public.accept_family_invite(tok);
  log := log || case when r->>'error' = 'email_mismatch' then 'OK   ' else 'FEJL ' end || 'M5 gamle token-funktion kræver e-mail-match: ' || r::text || E'\n'; if r->>'error' is distinct from 'email_mismatch' then fejl := fejl + 1; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  r := public.accept_my_family_invite(inv);
  log := log || case when (r->>'success')::boolean is false then 'OK   ' else 'FEJL ' end || 'M6 afsenderen kan ikke acceptere sin egen invitation: ' || r::text || E'\n'; if (r->>'success')::boolean then fejl := fejl + 1; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
  r := public.accept_my_family_invite(inv);
  log := log || case when (r->>'success')::boolean then 'OK   ' else 'FEJL ' end || 'M7 modtager (samme e-mail) accepterer: ' || r::text || E'\n'; if not (r->>'success')::boolean then fejl := fejl + 1; end if;
  log := log || case when (select status = 'accepted' and accepted_by = u_b and invitee_email is null from public.family_invites where id = inv) then 'OK   ' else 'FEJL ' end || 'M8 status accepteret, accepteret_af sat, e-mail slettet' || E'\n';
  if not (select status = 'accepted' and accepted_by = u_b and invitee_email is null from public.family_invites where id = inv) then fejl := fejl + 1; end if;
  r := public.accept_my_family_invite(inv);
  log := log || case when (r->>'success')::boolean is false then 'OK   ' else 'FEJL ' end || 'M9 invitationen kan ikke bruges to gange: ' || r::text || E'\n'; if (r->>'success')::boolean then fejl := fejl + 1; end if;

  -- Mail-invitation accepteret via mailens link (token) af en bruger med en ANDEN e-mail (fx Facebook)
  insert into public.family_invites (invited_by, invitee_email, kind) values (u_a, 'nogen.andre@example.invalid', 'email') returning id, token into inv, tok;
  perform set_config('request.jwt.claims', json_build_object('sub', u_c, 'role', 'authenticated')::text, true);
  r := public.get_family_invite_by_link(tok);
  log := log || case when r->>'id' = inv::text and r->>'kind' = 'email' then 'OK   ' else 'FEJL ' end || 'M10 token-slag viser mail-invitationen for en anden e-mail: ' || coalesce(r::text,'null') || E'\n'; if r->>'id' is distinct from inv::text then fejl := fejl + 1; end if;
  r := public.accept_family_invite_by_link(tok);
  log := log || case when (r->>'success')::boolean and r->>'pending_approval' is null then 'OK   ' else 'FEJL ' end || 'M11 mail-invitation via link accepteres direkte (afsenderen har selv valgt modtageren): ' || r::text || E'\n'; if not (r->>'success')::boolean then fejl := fejl + 1; end if;

  -- Afvisning via link virker kun for mail-invitationer
  insert into public.family_invites (invited_by, invitee_email, kind) values (u_a, 'afvis@example.invalid', 'email') returning id, token into inv, tok;
  r := public.decline_family_invite_by_link(tok);
  log := log || case when (r->>'success')::boolean and (select status from public.family_invites where id = inv) = 'revoked' then 'OK   ' else 'FEJL ' end || 'M12 mail-invitation kan afvises via link: ' || r::text || E'\n';

  -- Udløbet invitation kan ikke bruges
  insert into public.family_invites (invited_by, invitee_email, kind, expires_at) values (u_a, email_c, 'email', now() - interval '1 hour') returning id, token into inv, tok;
  n := jsonb_array_length(public.get_my_pending_family_invites());
  r := public.accept_my_family_invite(inv);
  log := log || case when n = 0 and (r->>'success')::boolean is false then 'OK   ' else 'FEJL ' end || 'M13 udløbet invitation vises og accepteres ikke: ' || n || ' / ' || r::text || E'\n';
  r := public.get_family_invite_by_link(tok);
  log := log || case when r is null then 'OK   ' else 'FEJL ' end || 'M14 udløbet token vises ikke: ' || coalesce(r::text,'null') || E'\n';

  -- ===== DELT LINK =====
  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  insert into public.family_invites (invited_by, kind) values (u_a, 'link') returning id, token into inv, tok;

  perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
  r := public.get_family_invite_by_link(tok);
  log := log || case when r->>'kind' = 'link' and (r->>'awaiting')::boolean is false then 'OK   ' else 'FEJL ' end || 'L1 modtager ser det delte link (kind=link, ikke afventende): ' || coalesce(r::text,'null') || E'\n';
  r := public.accept_family_invite_by_link(tok);
  log := log || case when (r->>'success')::boolean and (r->>'pending_approval')::boolean then 'OK   ' else 'FEJL ' end || 'L2 ja på delt link giver kun en anmodning: ' || r::text || E'\n';
  log := log || case when (select status = 'pending' and requested_by = u_b and accepted_by is null from public.family_invites where id = inv) then 'OK   ' else 'FEJL ' end || 'L3 intet er forbundet endnu (pending, låst til modtageren)' || E'\n';
  r := public.accept_family_invite_by_link(tok);
  log := log || case when (r->>'success')::boolean and (r->>'pending_approval')::boolean then 'OK   ' else 'FEJL ' end || 'L4 samme modtager kan sende anmodningen igen uden skade: ' || r::text || E'\n';

  perform set_config('request.jwt.claims', json_build_object('sub', u_c, 'role', 'authenticated')::text, true);
  r := public.get_family_invite_by_link(tok);
  log := log || case when r is null then 'OK   ' else 'FEJL ' end || 'L5 en tredje ser ikke linket, når det er låst: ' || coalesce(r::text,'null') || E'\n';
  r := public.accept_family_invite_by_link(tok);
  log := log || case when r->>'error' = 'Invitationen er allerede brugt' then 'OK   ' else 'FEJL ' end || 'L6 en tredje afvises: ' || r::text || E'\n';
  r := public.approve_family_link_request(inv);
  log := log || case when (r->>'success')::boolean is false then 'OK   ' else 'FEJL ' end || 'L7 en tredje kan ikke godkende: ' || r::text || E'\n';
  r := public.decline_family_invite_by_link(tok);
  log := log || case when (r->>'success')::boolean is false and (select status from public.family_invites where id = inv) = 'pending' then 'OK   ' else 'FEJL ' end || 'L8 en tilfældig med linket kan ikke ødelægge invitationen: ' || r::text || E'\n';

  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  r := public.accept_family_invite_by_link(tok);
  log := log || case when (r->>'success')::boolean is false then 'OK   ' else 'FEJL ' end || 'L9 afsenderen kan ikke bruge sit eget link: ' || r::text || E'\n';
  n := jsonb_array_length(public.get_family_link_requests());
  log := log || case when n = 1 then 'OK   ' else 'FEJL ' end || 'L10 afsenderen ser præcis én anmodning: ' || n || E'\n';
  r := public.approve_family_link_request(inv);
  log := log || case when (r->>'success')::boolean then 'OK   ' else 'FEJL ' end || 'L11 afsenderen godkender: ' || r::text || E'\n';
  log := log || case when (select status = 'accepted' and accepted_by = u_b from public.family_invites where id = inv) then 'OK   ' else 'FEJL ' end || 'L12 den rigtige modtager er forbundet' || E'\n';
  r := public.approve_family_link_request(inv);
  log := log || case when (r->>'success')::boolean is false then 'OK   ' else 'FEJL ' end || 'L13 kan ikke godkendes to gange: ' || r::text || E'\n';

  -- Afvisning af anmodning
  insert into public.family_invites (invited_by, kind) values (u_a, 'link') returning id, token into inv, tok;
  perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
  perform public.accept_family_invite_by_link(tok);
  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  r := public.decline_family_link_request(inv);
  log := log || case when (r->>'success')::boolean and (select status from public.family_invites where id = inv) = 'revoked' then 'OK   ' else 'FEJL ' end || 'L14 afsenderen afviser anmodningen (revoked): ' || r::text || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', u_c, 'role', 'authenticated')::text, true);
  r := public.accept_family_invite_by_link(tok);
  log := log || case when (r->>'success')::boolean is false then 'OK   ' else 'FEJL ' end || 'L15 afvist link kan ikke bruges igen: ' || r::text || E'\n';

  -- Delt link uden anmodning, men udløbet
  insert into public.family_invites (invited_by, kind, expires_at) values (u_a, 'link', now() - interval '1 minute') returning id, token into inv, tok;
  perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
  r := public.accept_family_invite_by_link(tok);
  log := log || case when (r->>'success')::boolean is false then 'OK   ' else 'FEJL ' end || 'L16 udløbet delt link kan ikke bruges: ' || r::text || E'\n';

  -- ===== OPBEVARING =====
  insert into public.family_invites (invited_by, invitee_email, kind, expires_at) values (u_a, 'udloebet@example.invalid', 'email', now() - interval '2 days');
  perform public.cleanup_family_invite_emails();
  log := log || case when (select count(*) from public.family_invites where invitee_email = 'udloebet@example.invalid') = 0 then 'OK   ' else 'FEJL ' end || 'O1 oprydning nulstiller e-mail på udløbne invitationer' || E'\n';

  -- ===== RETTIGHEDER =====
  log := log || case when not has_function_privilege('anon','public.accept_family_invite_by_link(text)','EXECUTE')
                      and not has_function_privilege('anon','public.accept_my_family_invite(uuid)','EXECUTE')
                      and not has_function_privilege('anon','public.get_family_link_requests()','EXECUTE')
                      and not has_function_privilege('anon','public.approve_family_link_request(uuid)','EXECUTE')
                      and not has_function_privilege('authenticated','public._caller_verified_email()','EXECUTE')
                      and not has_function_privilege('authenticated','public.invitee_already_connected(uuid,text)','EXECUTE')
                      and not has_function_privilege('authenticated','public.invitee_has_account(text)','EXECUTE')
                      and has_function_privilege('service_role','public.invitee_has_account(text)','EXECUTE')
                 then 'OK   ' else 'FEJL ' end || 'P1 rettigheder: anonyme og indloggede kan ikke kalde interne funktioner' || E'\n';

  -- Klienten (rollen authenticated) kan ikke oprette invitationer direkte
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
    insert into public.family_invites (invited_by, kind) values (u_a, 'link');
    reset role;
    log := log || 'FEJL P2 en klient kunne oprette en invitation direkte (RLS-politikken er ikke låst)' || E'\n';
  exception when others then
    reset role;
    log := log || 'OK   P2 en klient kan ikke oprette en invitation direkte (' || sqlstate || ')' || E'\n';
  end;

  raise exception E'TEST_RESULTAT (alt er rullet tilbage). Antal FEJL: %\n%', (length(log) - length(replace(log, 'FEJL', ''))) / 4, log;
end $$;
