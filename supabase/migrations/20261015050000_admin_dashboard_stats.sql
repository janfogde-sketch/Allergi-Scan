-- Admin-dashboardets tal i ét kald (to do b9a16fdb, G27). Før sendte panelet 12 forespørgsler og hentede alle scanninger og nye
-- brugere fra 30 dage række for række. Nu tæller databasen selv. Samme definitioner som før (src/admin/statsLogic.js):
-- scanning = found_via 'scan', søgeåbning = found_via 'search', døgn i dansk tid. Kun tællinger, ingen oplysninger om enkelte brugere.
create or replace function public.admin_dashboard_stats(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_days integer := least(greatest(coalesce(p_days, 30), 1), 90);
  v_today date := (now() at time zone 'Europe/Copenhagen')::date;
  v_start date := v_today - (v_days - 1);
  v_today_start timestamptz := v_today::timestamp at time zone 'Europe/Copenhagen';
  v_trend_start timestamptz := v_start::timestamp at time zone 'Europe/Copenhagen';
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'total_users', (select count(*) from public.users),
    'admin_users', (select count(*) from public.users where role = 'admin'),
    'total_products', (select count(*) from public.products),
    'total_scans', (select count(*) from public.scan_history where found_via = 'scan'),
    'search_opens', (select count(*) from public.scan_history where found_via = 'search'),
    'pending_submissions', (select count(*) from public.submissions where status = 'pending'),
    'total_families', (select count(*) from public.family_members),
    'open_tickets', (select count(*) from public.feedback_tickets where status = 'open'),
    'scans_today', (select count(*) from public.scan_history where found_via = 'scan' and scanned_at >= v_today_start),
    'new_users_today', (select count(*) from public.users where created_at >= v_today_start),
    'scan_trend', (
      select jsonb_agg(jsonb_build_object('date', d::date::text, 'count', coalesce(s.n, 0)) order by d)
      from generate_series(v_start, v_today, interval '1 day') d
      left join (
        select (scanned_at at time zone 'Europe/Copenhagen')::date as day, count(*) as n
        from public.scan_history
        where found_via = 'scan' and scanned_at >= v_trend_start
        group by 1
      ) s on s.day = d::date),
    'user_trend', (
      select jsonb_agg(jsonb_build_object('date', d::date::text, 'count', coalesce(u.n, 0)) order by d)
      from generate_series(v_start, v_today, interval '1 day') d
      left join (
        select (created_at at time zone 'Europe/Copenhagen')::date as day, count(*) as n
        from public.users
        where created_at >= v_trend_start
        group by 1
      ) u on u.day = d::date)
  );
end;
$$;

revoke execute on function public.admin_dashboard_stats(integer) from public, anon;
grant execute on function public.admin_dashboard_stats(integer) to authenticated;
