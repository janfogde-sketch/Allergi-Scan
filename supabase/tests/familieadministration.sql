-- Test af familieadministrationen (16. okt. 2026): kun administratorer kalder funktionerne, status på invitationer afledes (udløbet ventende),
-- tilbagekaldelse bevarer rækken og kræver begrundelse, forespørgsler om forbindelse røres ikke, fjernelse af medlem kræver begrundelse og giver
-- præcis ÉN logpost, og administratorer kan ikke længere slette direkte i tabellerne. Kører i CI mod en frisk database. Alt rulles tilbage.
begin;

do $$
declare
  adm uuid := gen_random_uuid(); own uuid := gen_random_uuid(); oth uuid := gen_random_uuid();
  inv_pend uuid; inv_exp uuid; inv_req uuid; inv_acc uuid; fid uuid;
  n int; res text := ''; v jsonb;
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (own,'own-'||substr(own::text,1,8)||'@example.invalid','authenticated','authenticated');
  insert into auth.users(id,email,aud,role) values (oth,'oth-'||substr(oth::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;
  insert into public.family_members(family_owner_id, name) values (own, 'Barn') returning id into fid;
  insert into public.family_invites(token, invited_by, status, expires_at) values ('t-pend-'||gen_random_uuid(), own, 'pending', now() + interval '1 day') returning id into inv_pend;
  insert into public.family_invites(token, invited_by, status, expires_at) values ('t-exp-'||gen_random_uuid(), own, 'pending', now() - interval '1 day') returning id into inv_exp;
  insert into public.family_invites(token, invited_by, status, expires_at, requested_by) values ('t-req-'||gen_random_uuid(), own, 'pending', now() + interval '1 day', oth) returning id into inv_req;
  insert into public.family_invites(token, invited_by, status, expires_at, accepted_by, accepted_at) values ('t-acc-'||gen_random_uuid(), own, 'accepted', now() + interval '1 day', oth, now()) returning id into inv_acc;
  delete from public.admin_audit_log;

  if has_function_privilege('anon', 'public.admin_family_overview(text,int,int)', 'execute') or has_function_privilege('anon', 'public.admin_remove_family_member(uuid,text)', 'execute')
     or has_function_privilege('anon', 'public.admin_revoke_family_invite(uuid,text)', 'execute') then res := res || 'ANON-KAN-KALDE '; end if;

  -- Almindelig bruger afvises overalt
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', oth,'role','authenticated')::text, true);
  begin perform public.admin_family_overview(); res := res || 'BRUGER-SER-OVERSIGT '; exception when others then null; end;
  begin perform public.admin_family_detail(own); res := res || 'BRUGER-SER-DETALJER '; exception when others then null; end;
  begin perform * from public.admin_list_family_invites(); res := res || 'BRUGER-SER-INVITATIONER '; exception when others then null; end;
  begin perform public.admin_revoke_family_invite(inv_pend, 'Test'); res := res || 'BRUGER-TILBAGEKALDER '; exception when others then null; end;
  begin perform public.admin_remove_family_member(fid, 'Test'); res := res || 'BRUGER-FJERNER '; exception when others then null; end;
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);

  -- Oversigt og detaljer
  v := public.admin_family_overview();
  if (v->>'total')::int < 1 then res := res || 'OVERSIGT-TOM '; end if;
  if v::text like '%Barn%' then res := res || 'NAVN-I-OVERSIGT '; end if;
  v := public.admin_family_detail(own);
  if jsonb_array_length(v->'members') <> 1 or jsonb_array_length(v->'invites') <> 4 then res := res || 'DETALJER-FORKERTE '; end if;
  if v::text like '%allergen%' then res := res || 'ALLERGIER-I-DETALJER '; end if;

  -- Afledt status
  select count(*) into n from public.admin_list_family_invites('expired') where id = inv_exp; if n<>1 then res := res || 'UDLOEBET-IKKE-AFLEDT '; end if;
  select count(*) into n from public.admin_list_family_invites('pending') where id = inv_exp; if n<>0 then res := res || 'UDLOEBET-SOM-VENTENDE '; end if;
  select count(*) into n from public.admin_list_family_invites('pending') where id = inv_pend; if n<>1 then res := res || 'VENTENDE-MANGLER '; end if;

  -- Tilbagekald: kræver begrundelse, afviser forespørgsler og accepterede, bevarer rækken
  begin perform public.admin_revoke_family_invite(inv_pend, '  '); res := res || 'TILBAGEKALD-UDEN-BEGRUNDELSE '; exception when others then null; end;
  begin perform public.admin_revoke_family_invite(inv_req, 'Test'); res := res || 'FORESPOERGSEL-TILBAGEKALDT '; exception when others then null; end;
  begin perform public.admin_revoke_family_invite(inv_acc, 'Test'); res := res || 'ACCEPTERET-TILBAGEKALDT '; exception when others then null; end;
  perform public.admin_revoke_family_invite(inv_pend, 'Bruger bad om det');
  select count(*) into n from public.family_invites where id = inv_pend and status = 'revoked'; if n<>1 then res := res || 'RAEKKE-IKKE-BEVARET '; end if;
  select count(*) into n from public.admin_audit_log where action='invitation_tilbagekaldt' and target_id=inv_pend::text and details->>'begrundelse'='Bruger bad om det'; if n<>1 then res := res || 'TILBAGEKALD-LOG(' || n || ') '; end if;

  -- Direkte sletning er ikke længere muligt for administratorer
  delete from public.family_invites where id = inv_exp; get diagnostics n = row_count; if n<>0 then res := res || 'ADMIN-SLETTER-INVITATION '; end if;
  delete from public.family_members where id = fid; get diagnostics n = row_count; if n<>0 then res := res || 'ADMIN-SLETTER-MEDLEM '; end if;

  -- Fjern medlem: kræver begrundelse, giver præcis én logpost
  begin perform public.admin_remove_family_member(fid, ''); res := res || 'FJERN-UDEN-BEGRUNDELSE '; exception when others then null; end;
  perform public.admin_remove_family_member(fid, 'Oprettet ved en fejl');
  select count(*) into n from public.family_members where id = fid; if n<>0 then res := res || 'MEDLEM-IKKE-FJERNET '; end if;
  select count(*) into n from public.admin_audit_log where target_id=fid::text; if n<>1 then res := res || 'FJERN-LOG(' || n || ') '; end if;
  select count(*) into n from public.admin_audit_log where action='familiemedlem_fjernet' and details->>'begrundelse'='Oprettet ved en fejl'; if n<>1 then res := res || 'FJERN-BEGRUNDELSE '; end if;

  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';
  if res <> '' then raise exception 'FAMILIEADMINISTRATION: %', res; end if;
end $$;

rollback;
select 'FAMILIEADMINISTRATION: ALLE TESTS BESTAAET' as resultat;
