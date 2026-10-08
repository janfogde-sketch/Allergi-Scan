-- Opbevaringsfrist (Jan, 8. okt. 2026): søgehistorikken (search_selections: søgeord + valgt vare, bruges til rangering) slettes
-- automatisk 12 måneder efter, den er gemt. Ryddes i den natlige cleanup_notifications() (03:30 UTC); ellers uændret fra 20261007151500.
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
  delete from public.search_selections where created_at < now() - interval '12 months';
$function$;
