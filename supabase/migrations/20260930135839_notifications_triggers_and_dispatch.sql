-- Notifikationer, trin 1c: hændelses-triggere og afvikling (30. sept. 2026).
--
-- Databasetriggere skriver en hændelse (kun id'er + evt. holdets tekst) i
-- notification_events i SAMME transaktion som ændringen. Edge-funktionen
-- `notify` afvikler dem via cron (hvert minut, kun hændelser ældre end 15 sek.,
-- så produktet når at blive oprettet efter statusskiftet i submissions-funktionen).
-- Triggerne må aldrig kunne blokere selve ændringen: alle fejl fanges og
-- logges i client_errors.
--
-- De eksisterende mail-triggere (send_submission_email, send_ticket_email …)
-- er UÆNDREDE; mail kobles på i trin 3.

comment on table public.notification_events is 'Holdbar outbox. event_key er stabil pr. hændelse (retries giver samme nøgle). payload indeholder id''er og holdets egen tekst (fx svar på feedback), aldrig brugerens personoplysninger.';

create or replace function public.enqueue_notification_event(p_key text, p_kind text, p_payload jsonb)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into public.notification_events (event_key, kind, payload)
  values (p_key, p_kind, p_payload)
  on conflict (event_key) do nothing;
exception when others then
  begin
    perform public.log_client_error(sqlerrm, null, 'db:enqueue_notification_event', null, null, null, null,
      jsonb_build_object('event_key', p_key, 'kind', p_kind));
  exception when others then null;
  end;
end;
$function$;
revoke execute on function public.enqueue_notification_event(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.enqueue_notification_event(text, text, jsonb) to service_role;

-- ── Indsendelser: godkendt/afvist (N2a, N2b, N3) og "produkt nu tilgængeligt" (N4)
create or replace function public.trg_notify_submission_reviewed()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if OLD.status is not distinct from NEW.status then return NEW; end if;
  if NEW.status not in ('approved', 'rejected') or NEW.submitted_by is null then return NEW; end if;
  perform public.enqueue_notification_event(
    'submission:' || NEW.id || ':' || NEW.status, 'submission_reviewed', jsonb_build_object('submission_id', NEW.id));
  if NEW.status = 'approved' and NEW.type = 'new_product' then
    perform public.enqueue_notification_event(
      'missing:' || NEW.id, 'missing_product_found', jsonb_build_object('submission_id', NEW.id));
  end if;
  return NEW;
end;
$function$;
drop trigger if exists notify_submission_reviewed on public.submissions;
create trigger notify_submission_reviewed after update of status on public.submissions
  for each row execute function public.trg_notify_submission_reviewed();

-- ── Familieinvitation accepteret (N5)
create or replace function public.trg_notify_invite_accepted()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if NEW.status = 'accepted' and OLD.status is distinct from 'accepted' and NEW.accepted_by is not null then
    perform public.enqueue_notification_event(
      'invite:' || NEW.id || ':accepted', 'family_invite_accepted', jsonb_build_object('invite_id', NEW.id));
  end if;
  return NEW;
end;
$function$;
drop trigger if exists notify_invite_accepted on public.family_invites;
create trigger notify_invite_accepted after update of status on public.family_invites
  for each row execute function public.trg_notify_invite_accepted();

-- ── Feedback: statusskift eller nyt svar fra holdet (N6)
-- Hver ændring er sin egen hændelse (tidsstemplet nøgle); en retry af samme
-- hændelse genbruger rækken og giver derfor ingen dubletter.
create or replace function public.trg_notify_ticket_update()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_variant text;
begin
  if NEW.submitted_by is null then return NEW; end if;
  if OLD.status is distinct from NEW.status then
    v_variant := case NEW.status when 'in_progress' then 'in_progress' when 'resolved' then 'resolved' when 'open' then 'reopened' else null end;
  elsif OLD.admin_note is distinct from NEW.admin_note and nullif(btrim(coalesce(NEW.admin_note, '')), '') is not null then
    v_variant := 'reply';
  end if;
  if v_variant is null then return NEW; end if;
  perform public.enqueue_notification_event(
    'ticket:' || NEW.id || ':' || v_variant || ':' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint,
    'ticket_update',
    jsonb_build_object('ticket_id', NEW.id, 'variant', v_variant, 'message', coalesce(NEW.admin_note, '')));
  return NEW;
end;
$function$;
drop trigger if exists notify_ticket_update on public.feedback_tickets;
create trigger notify_ticket_update after update of status, admin_note on public.feedback_tickets
  for each row execute function public.trg_notify_ticket_update();

-- ── Afvikling: kalder notify, når der ligger hændelser (ellers ingen kald)
create or replace function public.dispatch_notification_events()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_key text;
begin
  if not exists (select 1 from public.notification_events where status = 'pending' and created_at < now() - interval '15 seconds') then
    return;
  end if;
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
  perform net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/notify',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$function$;
revoke execute on function public.dispatch_notification_events() from public, anon, authenticated;
grant execute on function public.dispatch_notification_events() to service_role;

select cron.schedule('notify-dispatch', '* * * * *', $cron$ select public.dispatch_notification_events(); $cron$);

-- ── Oprydning (fastlagt opbevaring: beskeder 12 mdr., hændelser/afsendelser 90 dage)
create or replace function public.cleanup_notifications()
 returns void
 language sql
 security definer
 set search_path to 'public'
as $function$
  delete from public.notifications where created_at < now() - interval '12 months';
  delete from public.notification_events where created_at < now() - interval '90 days' and status <> 'pending';
$function$;
revoke execute on function public.cleanup_notifications() from public, anon, authenticated;
grant execute on function public.cleanup_notifications() to service_role;
select cron.schedule('notify-cleanup', '30 3 * * *', $cron$ select public.cleanup_notifications(); $cron$);
