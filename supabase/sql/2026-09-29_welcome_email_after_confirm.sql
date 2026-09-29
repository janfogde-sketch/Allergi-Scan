-- QA-beslutning D1 (29. sept. 2026): velkomstmailen sendes først, når
-- brugerens e-mail er bekræftet — ikke allerede ved oprettelse (hvor den
-- ellers også rammer forkerte/fremmede adresser).
--
-- STATUS: Anvendt 29. sept. 2026 via Supabase MCP `apply_migration`
-- (navn: welcome_email_after_confirm). Tjek:
--   select count(*) from information_schema.triggers
--   where trigger_name = 'on_auth_email_confirmed';   -- 1 = anvendt
--
-- Ændrer ingen adfærd så længe "Confirm email" er slået FRA i Supabase:
-- testet 29. sept. i en tilbagerullet transaktion — præcis én velkomstmail
-- i alle tre tilfælde (e-mail + bekræftelseslink, Google, autoconfirm).

create or replace function public.send_welcome_email()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
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
  end;
  return NEW;
end;
$$;

drop trigger if exists on_auth_email_confirmed on auth.users;
create trigger on_auth_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.send_welcome_email();
