-- Ret send_submission_email og log fejl i e-mail-triggerne til client_errors
-- (arkitektur-audit A3, 30. sept. 2026).
--
-- send_submission_email brugte NEW.name og NEW.rejection_reason, som
-- submissions ikke har. Fejlen blev fanget af EXCEPTION-blokken, så mailen
-- om godkendt/afvist indsendelse er aldrig blevet sendt. Produktnavnet
-- hentes nu fra products (rettelser) eller ai_parsed_data (nye produkter),
-- og begrundelsen fra review_note.
--
-- Alle tre e-mail-triggere skriver nu fejl til client_errors (kilde
-- "db:<funktion>"), så de ses i admin under "Fejl". Selve logningen er
-- pakket i sin egen blok, så den aldrig kan blokere en konto eller en
-- statusændring.

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

create or replace function public.send_welcome_email()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_service_key text;
  v_email text;
  v_name text;
begin
  begin
    if TG_TABLE_SCHEMA = 'auth' then
      -- on_auth_email_confirmed: e-mailen er netop blevet bekræftet
      v_email := NEW.email;
      select name into v_name from public.users where id = NEW.id;
    else
      -- on_user_created (public.users INSERT): kun hvis auth-brugeren
      -- allerede er bekræftet (fx Google) — ellers venter vi på bekræftelsen
      if not exists (select 1 from auth.users where id = NEW.id and email_confirmed_at is not null) then
        return NEW;
      end if;
      v_email := NEW.email;
      v_name := NEW.name;
    end if;
    if v_email is null then
      return NEW;
    end if;
    select decrypted_secret into v_service_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
    perform net.http_post(
      url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_service_key),
      body := jsonb_build_object('type', 'welcome', 'to', v_email, 'data', jsonb_build_object('name', coalesce(v_name, 'der'))),
      timeout_milliseconds := 15000
    );
  exception when others then
    -- Må aldrig blokere oprettelse/bekræftelse af en konto
    raise warning 'send_welcome_email fejlede: %', sqlerrm;
    begin
      perform public.log_client_error(sqlerrm, null, 'db:send_welcome_email', null, null, null, null,
        jsonb_build_object('user_id', NEW.id));
    exception when others then null;
    end;
  end;
  return NEW;
end;
$function$;
