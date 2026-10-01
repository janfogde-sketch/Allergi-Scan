-- has_health_consent kan kaldes som RPC af enhver indlogget bruger: returnér kun status for kalderen selv (admin og service role undtaget).
create or replace function public.has_health_consent(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when auth.uid() is not null and auth.uid() <> p_user and not public.is_admin(auth.uid()) then false
    else coalesce((select action = 'given' from public.consent_log
                   where user_id = p_user and kind = 'health' order by created_at desc, id desc limit 1), false)
  end;
$$;
