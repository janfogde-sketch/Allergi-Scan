-- Opbevaring O2 og O3 (Jan, 15. okt. 2026; plan /mnt/project-files/eatsafe/plan-opbevaring-o1-o3-2026-10-15.md).
-- O2: loginsessioner (med IP-adresse og enhedstype) slettes efter 6 måneder uden brug; login-nøglerne følger med (cascade).
--     Brugeren skal så logge ind igen (refreshed_at er uden tidszone og står i UTC). Sessioner slettes allerede ved logud og kontosletning.
-- O3: afsluttet feedback fra brugere med konto slettes 12 måneder efter oprettelsen (tabellen har ingen afslutningsdato;
--     åbne tickets røres ikke), og behandlede indsendelser 12 måneder efter behandlingen. Et godkendt produkt og dets
--     produktbillede bliver i produktdatabasen; skærmbilleder og indsendte filer ryddes af cleanup-orphan-images.
-- Resten af funktionen er uændret.
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
  delete from public.feedback_tickets where submitted_by is null and created_at < now() - interval '12 months';
  delete from public.feedback_tickets where submitted_by is not null and status = 'resolved' and created_at < now() - interval '12 months';
  delete from public.submissions where status in ('approved', 'rejected') and reviewed_at < now() - interval '12 months';
  delete from auth.sessions where coalesce(refreshed_at at time zone 'UTC', updated_at, created_at) < now() - interval '6 months';
  delete from public.admin_audit_log where created_at < now() - interval '12 months';
  delete from public.admin_todo_activity where created_at < now() - interval '12 months';
$function$;
