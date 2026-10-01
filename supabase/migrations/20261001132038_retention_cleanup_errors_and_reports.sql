-- Opbevaringsfrister (2. okt. 2026): tekniske fejllogs 90 dage, sikkerhedsindberetninger 12 måneder.
-- Kører i det eksisterende daglige job notify-cleanup (kl. 03:30 UTC). Frister står i privatlivspolitikken (afsnit 11).
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
$function$;
