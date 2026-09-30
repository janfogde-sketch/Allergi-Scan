-- Notifikationer: testbrugere (30. sept. 2026).
--
-- app_flags.notifications_test_users er en liste af bruger-id'er, som får push/mail, selvom de globale
-- flag (notifications_push_enabled / notifications_email_enabled) er FRA. Så kan en aftalt testkonto
-- afprøve hele kæden på rigtige telefoner uden at rigtige brugere rammes.
-- notification_flag(nøgle, bruger) = globalt flag TIL, eller brugeren står på testlisten.

insert into public.app_flags (key, value) values ('notifications_test_users', '[]'::jsonb) on conflict (key) do nothing;
comment on table public.app_flags is 'Driftsflag (kun service_role). notifications_push_enabled/notifications_email_enabled skal forblive false, til beskedsiden er testet på rigtige telefoner; notifications_test_users (liste af bruger-id''er) tænder dem kun for testkonti.';

create or replace function public.notification_flag(p_key text, p_user uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select coalesce((select value = 'true'::jsonb from public.app_flags where key = p_key), false)
      or (p_user is not null
          and coalesce((select value ? p_user::text from public.app_flags where key = 'notifications_test_users'), false))
$function$;
revoke execute on function public.notification_flag(text, uuid) from public, anon, authenticated;
grant execute on function public.notification_flag(text, uuid) to service_role;

-- De mail-triggere, der tidligere kun tjekkede det globale flag, tjekker nu pr. bruger.
do $mig$
declare
  fn text;
  d text;
  old text := $$exists (select 1 from public.app_flags where key = 'notifications_email_enabled' and value = 'true'::jsonb)$$;
  who text;
begin
  foreach fn in array array['send_submission_email', 'send_ticket_email', 'send_welcome_email', 'send_welcome_after_onboarding'] loop
    who := case fn when 'send_submission_email' then 'NEW.submitted_by' when 'send_ticket_email' then 'NEW.submitted_by' else 'NEW.id' end;
    d := pg_get_functiondef(('public.' || fn || '()')::regprocedure);
    if position(old in d) = 0 then raise exception 'Fandt ikke flag-tjekket i %', fn; end if;
    d := replace(d, old, 'public.notification_flag(''notifications_email_enabled'', ' || who || ')');
    execute d;
  end loop;
end
$mig$;
