-- Test af claim_push_token: et push-abonnement følger kun den konto, der senest gemte det (delt telefon).
-- Kører i CI mod en frisk lokal database (.github/workflows/db-tests.yml). Rører aldrig produktion.
begin;

do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); n int;
begin
  insert into auth.users (id, email) values (a, 'claim-a@test.invalid'), (b, 'claim-b@test.invalid');
  insert into public.users (id, email) values (a, 'claim-a@test.invalid'), (b, 'claim-b@test.invalid')
    on conflict (id) do nothing;
  insert into public.push_tokens (user_id, token) values (a, 'DEVICE-1'), (a, 'DEVICE-2');

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.claim_push_token('DEVICE-1');
  perform public.claim_push_token('DEVICE-1'); -- gentagelse skal være ufarlig
  reset role;

  select count(*) into n from public.push_tokens where user_id = a and token = 'DEVICE-1';
  if n <> 0 then raise exception 'Forrige konto beholdt telefonens abonnement'; end if;
  select count(*) into n from public.push_tokens where user_id = a and token = 'DEVICE-2';
  if n <> 1 then raise exception 'Den forrige kontos andre enhed blev ramt'; end if;
  select count(*) into n from public.push_tokens where user_id = b and token = 'DEVICE-1';
  if n <> 1 then raise exception 'Ny konto fik ikke abonnementet (eller fik dublet)'; end if;

  if has_function_privilege('anon', 'public.claim_push_token(text)', 'EXECUTE') then
    raise exception 'anon må ikke kunne kalde claim_push_token';
  end if;
end $$;

rollback;
