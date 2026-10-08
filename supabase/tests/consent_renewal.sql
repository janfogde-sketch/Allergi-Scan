-- Samtykkefornyelse: give_health_consent logger et nyt samtykke ved ny version, men ikke ved samme version. Alt rulles tilbage.
begin;
do $$
declare uid uuid := gen_random_uuid(); n int; r2 timestamptz; r3 timestamptz;
begin
  insert into auth.users(id,email,aud,role) values (uid,'cr-'||substr(gen_random_uuid()::text,1,8)||'@example.invalid','authenticated','authenticated');
  perform set_config('request.jwt.claims', json_build_object('sub',uid,'role','authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uid::text, true);
  perform public.give_health_consent('v1');
  perform public.give_health_consent('v1');
  select count(*) into n from public.consent_log where user_id=uid;
  if n <> 1 then raise exception 'samme version skal ikke logges igen, fik % rækker', n; end if;
  r2 := public.give_health_consent('v2');
  select count(*) into n from public.consent_log where user_id=uid;
  if n <> 2 then raise exception 'ny version skal logges, fik % rækker', n; end if;
  r3 := public.give_health_consent('v2');
  if r3 <> r2 then raise exception 'gentagelse af v2 skal returnere samme tidspunkt'; end if;
  if (select version from public.consent_log where user_id=uid order by created_at desc, id desc limit 1) <> 'v2' then
    raise exception 'nyeste række skal være v2';
  end if;
end $$;
rollback;
