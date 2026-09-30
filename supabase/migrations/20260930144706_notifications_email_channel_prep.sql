-- Notifikationer, trin 3a: mailkanal via notify (30. sept. 2026).
--
-- * notification_deliveries: endpoint er nu NOT NULL med '' for mail, og et almindeligt
--   UNIQUE på (notification_id, channel, endpoint). Det gamle indeks på coalesce(...) kunne
--   ikke bruges som ON CONFLICT-mål fra edge-funktionen (upsert ville fejle).
-- * app_flags.notifications_email_enabled (starter FRA): når den tændes, sender `notify` mails
--   med de nye Resend-skabeloner, og de gamle mail-triggere (indsendelse/ticket) springer over,
--   så ingen får to mails.

alter table public.notification_deliveries alter column endpoint set default '';
update public.notification_deliveries set endpoint = '' where endpoint is null;
alter table public.notification_deliveries alter column endpoint set not null;
drop index if exists public.notification_deliveries_uniq;
alter table public.notification_deliveries add constraint notification_deliveries_uniq unique (notification_id, channel, endpoint);
comment on column public.notification_deliveries.endpoint is 'Hash af push-endpointet; tom streng for mail.';

insert into public.app_flags (key, value) values ('notifications_email_enabled', 'false'::jsonb) on conflict (key) do nothing;

create or replace function public.send_submission_email()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_email text;
  v_name  text;
  v_type  text;
  v_product text;
  v_service_key text;
begin
  -- Efter overgangen til notify sender den mailen (skabeloner i Resend) — flaget slår den gamle vej fra.
  if exists (select 1 from public.app_flags where key = 'notifications_email_enabled' and value = 'true'::jsonb) then
    return NEW;
  end if;
  if OLD.status = NEW.status then return NEW; end if;
  if NEW.status not in ('approved', 'rejected') then return NEW; end if;
  if NEW.submitted_by is null then return NEW; end if;
  if not public.notification_enabled(NEW.submitted_by, 'submission_status', 'email') then return NEW; end if;
  select u.email, u.name into v_email, v_name
  from public.users u where u.id = NEW.submitted_by;
  if v_email is null then return NEW; end if;
  begin
    v_type := case NEW.status when 'approved' then 'submission_approved' else 'submission_rejected' end;
    select p.name into v_product from public.products p where p.id = NEW.product_id;
    v_product := coalesce(v_product, nullif(NEW.ai_parsed_data->>'name', ''), 'Ukendt produkt');
    select decrypted_secret into v_service_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
    perform net.http_post(
      url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'type', v_type,
        'to', v_email,
        'data', jsonb_build_object(
          'name', coalesce(v_name, 'der'),
          'productName', v_product,
          'ean', coalesce(NEW.ean, ''),
          'reason', coalesce(NEW.review_note, '')
        )
      )
    );
  exception when others then
    raise warning 'send_submission_email fejlede: %', sqlerrm;
    begin
      perform public.log_client_error(sqlerrm, null, 'db:send_submission_email', null, null, null, null,
        jsonb_build_object('submission_id', NEW.id));
    exception when others then null;
    end;
  end;
  return NEW;
end;
$function$;

create or replace function public.send_ticket_email()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_email text;
  v_name  text;
  v_service_key text;
begin
  -- Efter overgangen til notify sender den mailen (skabeloner i Resend) — flaget slår den gamle vej fra.
  if exists (select 1 from public.app_flags where key = 'notifications_email_enabled' and value = 'true'::jsonb) then
    return NEW;
  end if;
  if OLD.status = NEW.status then return NEW; end if;
  if NEW.submitted_by is null then return NEW; end if;
  if not public.notification_enabled(NEW.submitted_by, 'feedback', 'email') then return NEW; end if;
  select u.email, u.name into v_email, v_name
  from public.users u where u.id = NEW.submitted_by;
  if v_email is null then return NEW; end if;
  select decrypted_secret into v_service_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
  begin
    perform net.http_post(
      url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'type', 'ticket_update',
        'to', v_email,
        'data', jsonb_build_object(
          'name', coalesce(v_name, 'der'),
          'status', NEW.status,
          'message', coalesce(NEW.admin_note, 'Din feedback er blevet opdateret.')
        )
      )
    );
  exception when others then
    raise warning 'send_ticket_email fejlede: %', sqlerrm;
    begin
      perform public.log_client_error(sqlerrm, null, 'db:send_ticket_email', null, null, null, null,
        jsonb_build_object('ticket_id', NEW.id));
    exception when others then null;
    end;
  end;
  return NEW;
end;
$function$;
