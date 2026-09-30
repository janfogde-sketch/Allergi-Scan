-- Kørt live 30. sept. 2026 via apply_migration (version 20260930193753).
-- Onboarding: konto oprettes med kun e-mail og adgangskode (30. sept. 2026).
-- Navn, alder og køn udfyldes først i onboarding EFTER e-mailbekræftelsen, så:
--  1) handle_new_user sætter ikke længere e-mailens lokale del som navn, når der
--     ikke er et navn i metadata (onboarding trin 1 skal starte med et tomt felt).
--  2) send_welcome_email (gammel velkomstmail ved bekræftelse) springer over, når
--     navnet endnu ikke kendes — og markerer ikke welcome_sent_at.
--  3) send_welcome_after_onboarding sender den gamle velkomstmail (med navn), når
--     onboarding bliver færdig, så længe notifications_email_enabled er FRA. Med
--     flaget TIL er adfærden uændret (N1-skabelonen efter onboarding).

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text := nullif(left(btrim(coalesce(meta->>'name', meta->>'full_name', '')), 100), '');
  v_phone text := nullif(left(btrim(coalesce(meta->>'phone', '')), 20), '');
  v_birth_year int;
  v_gender text := meta->>'gender';
  v_step int := 1;
begin
  if (meta->>'birth_year') ~ '^\d{4}$' then
    v_birth_year := (meta->>'birth_year')::int;
    if v_birth_year < extract(year from now())::int - 120 or v_birth_year > extract(year from now())::int then
      v_birth_year := null;
    end if;
  end if;
  if v_gender is not null and v_gender not in ('Mand','Kvinde','Andet','Vil ikke oplyse') then
    v_gender := null;
  end if;
  if meta->>'signup_profile' = 'true' and v_name is not null and v_birth_year is not null and v_gender is not null then
    v_step := 2;
  end if;

  insert into public.users (id, email, name, phone, birth_year, gender, onboarding_step, onboarding_completed, created_at, updated_at)
  values (new.id, new.email, v_name, v_phone, v_birth_year, v_gender, v_step, false, now(), now());
  return new;
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
  -- Når mailkanalen via notify er slået til, sendes velkomstmailen i stedet efter onboarding
  -- (send_welcome_after_onboarding) — ikke ved oprettelse/bekræftelse.
  if public.notification_flag('notifications_email_enabled', NEW.id) then
    return NEW;
  end if;
  begin
    if TG_TABLE_SCHEMA = 'auth' then
      v_email := NEW.email;
      select name into v_name from public.users where id = NEW.id;
    else
      if not exists (select 1 from auth.users where id = NEW.id and email_confirmed_at is not null) then
        return NEW;
      end if;
      v_email := NEW.email;
      v_name := NEW.name;
    end if;
    if v_email is null then
      return NEW;
    end if;
    -- Navnet kendes endnu ikke (udfyldes i onboarding efter bekræftelsen):
    -- velkomstmailen sendes i stedet, når onboarding er færdig.
    if nullif(btrim(coalesce(v_name, '')), '') is null then
      return NEW;
    end if;
    select decrypted_secret into v_service_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
    perform net.http_post(
      url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_service_key),
      body := jsonb_build_object('type', 'welcome', 'to', v_email, 'data', jsonb_build_object('name', v_name)),
      timeout_milliseconds := 15000
    );
    -- Så velkomstmailen ikke sendes en gang til efter onboarding
    update public.users set welcome_sent_at = coalesce(welcome_sent_at, now()) where id = NEW.id;
  exception when others then
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
  v_new_channel boolean;
begin
  begin
    if NEW.onboarding_completed is not true or OLD.onboarding_completed is true then return NEW; end if;
    if NEW.welcome_sent_at is not null then return NEW; end if;
    select email into v_email from auth.users where id = NEW.id and email_confirmed_at is not null;
    if v_email is null then return NEW; end if;
    v_new_channel := public.notification_flag('notifications_email_enabled', NEW.id);
    -- Markér først (dublet-sikring), send derefter
    update public.users set welcome_sent_at = now() where id = NEW.id;
    select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
    if v_new_channel then
      perform net.http_post(
        url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/send-email',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
        body := jsonb_build_object('type', 'welcome_onboarded', 'to', v_email,
                                   'data', jsonb_build_object('name', coalesce(split_part(btrim(coalesce(NEW.name, '')), ' ', 1), ''))),
        timeout_milliseconds := 15000
      );
    else
      -- Flaget er fra: den nuværende velkomstmail, nu med navnet fra onboarding.
      perform net.http_post(
        url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/send-email',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
        body := jsonb_build_object('type', 'welcome', 'to', v_email,
                                   'data', jsonb_build_object('name', coalesce(nullif(btrim(coalesce(NEW.name, '')), ''), 'der'))),
        timeout_milliseconds := 15000
      );
    end if;
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
revoke execute on function public.send_welcome_email() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
