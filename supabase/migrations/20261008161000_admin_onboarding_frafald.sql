-- Frafald i første start: samlede tal pr. onboarding-trin til admin-panelet (to do 736d6ade).
-- Kun tællinger, ingen oplysninger om enkelte brugere. Kun admins kan kalde funktionen.
create or replace function public.admin_onboarding_funnel()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  result jsonb;
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total', count(*),
    'completed', count(*) filter (where onboarding_completed is true),
    'steps', coalesce((
      select jsonb_agg(jsonb_build_object(
        'step', s.step, 'stuck', s.stuck, 'stuck_over_24h', s.stuck_old) order by s.step)
      from (
        select coalesce(onboarding_step, 1) as step,
               count(*) as stuck,
               count(*) filter (where created_at < now() - interval '24 hours') as stuck_old
        from public.users
        where onboarding_completed is not true
        group by 1
      ) s), '[]'::jsonb)
  ) into result
  from public.users;

  return result;
end;
$$;

revoke execute on function public.admin_onboarding_funnel() from public, anon;
grant execute on function public.admin_onboarding_funnel() to authenticated;
