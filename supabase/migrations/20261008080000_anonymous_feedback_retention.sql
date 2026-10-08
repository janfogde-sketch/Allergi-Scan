-- Opbevaring (Jan, 8. okt. 2026): feedback fra brugere uden login (submitted_by er tom) indeholder fritekst, diagnostik og en saltet
-- IP-hash og blev aldrig slettet. De slettes nu automatisk 12 måneder efter oprettelsen (tickets har ingen lukketid, så fristen
-- regnes fra oprettelsen). Feedback fra loggede brugere følger kontoen og slettes med den. Opgaven på admin-listen følger med
-- (admin_todos.ticket_id er on delete cascade). Skærmbilleder i bøtten feedback-screenshots ryddes af cleanup-orphan-images.

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
  delete from public.feedback_tickets where submitted_by is null and created_at < now() - interval '12 months';
$function$;

-- Skærmbilleder i feedback-screenshots, som ingen ticket peger på (slettet ticket eller konto). 24 timers frist til nye uploads.
create or replace function public.orphan_feedback_screenshots()
returns table(name text)
language sql
security definer
set search_path = public, storage
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'feedback-screenshots'
    and o.created_at < now() - interval '24 hours'
    and not exists (select 1 from public.feedback_tickets t where t.image_path = o.name);
$$;
revoke all on function public.orphan_feedback_screenshots() from public, anon, authenticated;
grant execute on function public.orphan_feedback_screenshots() to service_role;
