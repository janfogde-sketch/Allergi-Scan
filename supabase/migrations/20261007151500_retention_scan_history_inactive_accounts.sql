-- Opbevaringsfrister (Jan, 7. okt. 2026): scanningshistorik slettes 24 måneder efter scanningen; en konto uden aktivitet i 36 måneder
-- slettes efter en advarselsmail og 30 dages frist. Scanninger ryddes i den natlige cleanup_notifications() (03:30 UTC).
-- Inaktive konti håndteres af edge-funktionen inactive-accounts (dagligt 04:10 UTC), som genbruger delete-user.

create or replace function public.cleanup_notifications()
returns void
language sql
security definer
set search_path to 'public'
as $function$
  delete from public.notifications where created_at < now() - interval '12 months';
  delete from public.notification_events where created_at < now() - interval '90 days' and status <> 'pending';
  delete from public.client_errors where last_seen < now() - interval '90 days';
  delete from public.security_reports where created_at < now() - interval '12 months';
  delete from public.api_usage where day < current_date - 30;
  delete from public.api_usage_global where day < current_date - 30;
  delete from public.scan_history where scanned_at < now() - interval '24 months';
$function$;

-- Hvornår advarslen om inaktivitet blev sendt (nulstilles ikke; en ny aktivitet efter advarslen gør den ugyldig).
alter table public.users add column if not exists inactivity_warned_at timestamptz;

-- Seneste aktivitet: seneste login, seneste fornyelse af en aktiv session (appen holder brugeren logget ind), seneste scanning, ellers oprettelsen.
create or replace function public.inactive_accounts(p_warn_after interval default interval '35 months', p_delete_after interval default interval '36 months', p_grace interval default interval '30 days')
returns table(user_id uuid, email text, name text, last_activity timestamptz, action text)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  with act as (
    select u.id, u.email::text as email, pu.name::text as name, pu.inactivity_warned_at as warned, pu.role,
      greatest(
        coalesce(u.last_sign_in_at, u.created_at), u.created_at,
        (select max(coalesce(s.refreshed_at, s.updated_at, s.created_at)) from auth.sessions s where s.user_id = u.id),
        (select max(sh.scanned_at) from public.scan_history sh where sh.user_id = u.id)
      ) as last_act
    from auth.users u join public.users pu on pu.id = u.id
  )
  select x.id, x.email, x.name, x.last_act, x.act
  from (
    select a.id, a.email, a.name, a.last_act, a.role,
      case when a.last_act < now() - p_delete_after and a.warned is not null and a.warned >= a.last_act and a.warned < now() - p_grace then 'delete'
           when a.last_act < now() - p_warn_after and (a.warned is null or a.warned < a.last_act) then 'warn'
      end as act
    from act a
  ) x
  where x.act is not null and coalesce(x.role, '') <> 'admin';
end;
$$;
revoke all on function public.inactive_accounts(interval, interval, interval) from public, anon, authenticated;
grant execute on function public.inactive_accounts(interval, interval, interval) to service_role;

create or replace function public.mark_inactivity_warned(p_user uuid)
returns void language sql security definer set search_path = public as $$
  update public.users set inactivity_warned_at = now() where id = p_user;
$$;
revoke all on function public.mark_inactivity_warned(uuid) from public, anon, authenticated;
grant execute on function public.mark_inactivity_warned(uuid) to service_role;

create or replace function public.cleanup_inactive_accounts()
returns void language plpgsql security definer set search_path = public as $$
declare v_key text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
  perform net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/inactive-accounts',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;
revoke all on function public.cleanup_inactive_accounts() from public, anon, authenticated;

-- Dagligt 04:10 UTC (efter orphan-images-cleanup 03:50).
select cron.schedule('inactive-accounts-cleanup', '10 4 * * *', 'select public.cleanup_inactive_accounts();');
