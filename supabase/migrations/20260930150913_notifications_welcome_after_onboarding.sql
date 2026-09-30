-- Notifikationer: N1 (velkomstmail efter onboarding) — 30. sept. 2026.
--
-- Udviklerpakken: velkomstmailen sendes præcis én gang, når onboarding er gennemført
-- (onboarding_completed = true), ikke ved e-mailbekræftelse. Hele skiftet er styret af
-- app_flags.notifications_email_enabled (FRA): er flaget fra, virker de gamle triggere som hidtil
-- (velkomstmail ved bekræftelse med den gamle skabelon); er det til, springer de over, og den nye
-- trigger sender den nye N1-skabelon (Resend) efter onboarding. users.welcome_sent_at forhindrer dubletter.

alter table public.users add column if not exists welcome_sent_at timestamp with time zone;
comment on column public.users.welcome_sent_at is 'Hvornår velkomstmailen (N1) blev sendt — sættes kun én gang.';

-- Alle med bekræftet e-mail har allerede fået den gamle velkomstmail ved bekræftelsen.
update public.users u set welcome_sent_at = coalesce(u.welcome_sent_at, now())
  from auth.users a where a.id = u.id and a.email_confirmed_at is not null;

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
  -- Når mailkanalen via notify er slået til, sendes velkomstmailen i stedet efter onboarding
  -- (send_welcome_after_onboarding) — ikke ved oprettelse/bekræftelse.
  if exists (select 1 from public.app_flags where key = 'notifications_email_enabled' and value = 'true'::jsonb) then
    return NEW;
  end if;
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
    -- Så den nye velkomstmail (efter onboarding) ikke sendes en gang til, hvis flaget senere tændes
    update public.users set welcome_sent_at = coalesce(welcome_sent_at, now()) where id = NEW.id;
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

create or replace function public.send_welcome_after_onboarding()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_key text;
  v_email text;
begin
  begin
    if not exists (select 1 from public.app_flags where key = 'notifications_email_enabled' and value = 'true'::jsonb) then
      return NEW;
    end if;
    if NEW.onboarding_completed is not true or OLD.onboarding_completed is true then return NEW; end if;
    if NEW.welcome_sent_at is not null then return NEW; end if;
    -- Adressen hentes fra kontoen (auth.users, bekræftet) — ikke fra en profilkolonne, brugeren selv kan ændre
    select email into v_email from auth.users where id = NEW.id and email_confirmed_at is not null;
    if v_email is null then return NEW; end if;
    -- Markér først (dublet-sikring), send derefter
    update public.users set welcome_sent_at = now() where id = NEW.id;
    select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
    perform net.http_post(
      url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
      body := jsonb_build_object('type', 'welcome_onboarded', 'to', v_email,
                                 'data', jsonb_build_object('name', coalesce(split_part(btrim(coalesce(NEW.name, '')), ' ', 1), ''))),
      timeout_milliseconds := 15000
    );
  exception when others then
    raise warning 'send_welcome_after_onboarding fejlede: %', sqlerrm;
    begin
      perform public.log_client_error(sqlerrm, null, 'db:send_welcome_after_onboarding', null, null, null, null,
        jsonb_build_object('user_id', NEW.id));
    exception when others then null;
    end;
  end;
  return NEW;
end;
$function$;
revoke execute on function public.send_welcome_after_onboarding() from public, anon, authenticated;

drop trigger if exists on_onboarding_completed on public.users;
create trigger on_onboarding_completed after update of onboarding_completed on public.users
  for each row execute function public.send_welcome_after_onboarding();

-- Brugeren kan ikke selv nulstille welcome_sent_at (ville give gentagne velkomstmails).
create or replace function public.keep_welcome_sent_at()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  if current_user in ('authenticated', 'anon') then
    NEW.welcome_sent_at := OLD.welcome_sent_at;
  end if;
  return NEW;
end;
$function$;
drop trigger if exists keep_welcome_sent_at on public.users;
create trigger keep_welcome_sent_at before update on public.users
  for each row execute function public.keep_welcome_sent_at();
