-- Databasetest af triggeren prevent_plan_email_self_edit (kodegennemgang F2). Rulles altid tilbage: scriptet afslutter med en fejl, TEST_RESULTAT.
-- Kør i Supabase SQL Editor eller via execute_sql. Kræver mindst to brugere (den første skal ikke være admin; ellers bruges nr. 2).
do $$
declare
  u uuid; adm uuid; plan uuid; login_email text;
  log text := ''; fejl int := 0; ok boolean;
begin
  select id into u from public.users where role is distinct from 'admin' order by created_at limit 1;
  select id into adm from public.users where role = 'admin' order by created_at limit 1;
  select id into plan from public.plans limit 1;
  select email into login_email from auth.users where id = u;
  if u is null or adm is null then raise exception 'Kræver en almindelig bruger og en admin'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);

  -- egne felter virker
  begin update public.users set name = coalesce(name, 'x') where id = u; ok := true; exception when others then ok := false; end;
  log := log || case when ok then 'OK   ' else 'FEJL ' end || 'U1 bruger kan opdatere eget navn' || E'\n'; if not ok then fejl := fejl + 1; end if;

  -- onboarding: email sat til login-adressen (andre store/små bogstaver) virker
  begin update public.users set email = upper(login_email) where id = u; ok := true; exception when others then ok := false; end;
  log := log || case when ok then 'OK   ' else 'FEJL ' end || 'U2 bruger kan sætte email til egen login-adresse' || E'\n'; if not ok then fejl := fejl + 1; end if;

  -- fremmed email afvises
  begin update public.users set email = 'fremmed@example.com' where id = u; ok := false; exception when others then ok := true; end;
  log := log || case when ok then 'OK   ' else 'FEJL ' end || 'U3 bruger kan IKKE sætte fremmed email' || E'\n'; if not ok then fejl := fejl + 1; end if;

  -- plan afvises
  begin update public.users set plan_id = plan where id = u; ok := false; exception when others then ok := true; end;
  log := log || case when ok then 'OK   ' else 'FEJL ' end || 'U4 bruger kan IKKE sætte plan_id' || E'\n'; if not ok then fejl := fejl + 1; end if;
  begin update public.users set plan_expires_at = now() + interval '1 year' where id = u; ok := false; exception when others then ok := true; end;
  log := log || case when ok then 'OK   ' else 'FEJL ' end || 'U5 bruger kan IKKE sætte plan_expires_at' || E'\n'; if not ok then fejl := fejl + 1; end if;

  -- admin må
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  begin update public.users set plan_id = plan, email = 'admin-rettet@example.com' where id = u; ok := true; exception when others then ok := false; end;
  log := log || case when ok then 'OK   ' else 'FEJL ' end || 'U6 admin kan ændre plan og email' || E'\n'; if not ok then fejl := fejl + 1; end if;

  -- service-nøgle / migration (ingen auth.uid())
  perform set_config('request.jwt.claims', '', true);
  begin update public.users set plan_id = null where id = u; ok := true; exception when others then ok := false; end;
  log := log || case when ok then 'OK   ' else 'FEJL ' end || 'U7 service (uden auth.uid) kan ændre plan' || E'\n'; if not ok then fejl := fejl + 1; end if;

  raise exception 'TEST_RESULTAT (%, fejl: %)%', case when fejl = 0 then 'ALT OK' else 'FEJL' end, fejl, E'\n' || log;
end $$;
