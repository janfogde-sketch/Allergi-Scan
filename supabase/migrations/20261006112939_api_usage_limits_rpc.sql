-- Tæller atomisk og returnerer true, hvis kaldet er inden for loftet (og så er talt med), ellers false.
create or replace function public.bump_api_usage(p_user uuid, p_kind text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_n integer;
begin
  insert into public.api_usage as u (user_id, kind, day, n)
  values (p_user, p_kind, (now() at time zone 'Europe/Copenhagen')::date, 1)
  on conflict (user_id, kind, day) do update set n = u.n + 1 where u.n < p_limit
  returning u.n into v_n;
  return v_n is not null;
end;
$function$;

create or replace function public.bump_api_usage_global(p_kind text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_n integer;
begin
  insert into public.api_usage_global as g (kind, day, n)
  values (p_kind, (now() at time zone 'Europe/Copenhagen')::date, 1)
  on conflict (kind, day) do update set n = g.n + 1 where g.n < p_limit
  returning g.n into v_n;
  return v_n is not null;
end;
$function$;

revoke execute on function public.bump_api_usage(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.bump_api_usage_global(text, integer) from public, anon, authenticated;
grant execute on function public.bump_api_usage(uuid, text, integer) to service_role;
grant execute on function public.bump_api_usage_global(text, integer) to service_role;

