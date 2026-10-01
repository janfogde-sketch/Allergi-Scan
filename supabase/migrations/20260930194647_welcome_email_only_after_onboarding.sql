-- Kørt live 30. sept. 2026 via apply_migration (version 20260930194647).
-- Velkomstmail kun efter færdig onboarding (30. sept. 2026, Bjørns spec).
--
-- Kontoens tre tilstande holdes adskilt: konto oprettet → e-mail bekræftet →
-- onboarding færdig. Velkomstmailen må KUN udløses, når onboarding_completed
-- skifter fra false til true — aldrig ved oprettelse, login, e-mailbekræftelse,
-- genstart eller et genåbnet bekræftelseslink. Derfor fjernes de to gamle
-- triggere (on_auth_email_confirmed på auth.users og on_user_created på
-- public.users) og deres funktion send_welcome_email().
--
-- Én mail pr. bruger: users.welcome_sent_at (null = ikke sendt) reserveres
-- atomisk (UPDATE ... WHERE welcome_sent_at IS NULL) FØR afsendelsen. Kun det
-- kald, der fik reservationen, sender — også hvis flere opdateringer løber
-- samtidig. Brugeren kan ikke selv nulstille feltet (keep_welcome_sent_at).

drop trigger if exists on_auth_email_confirmed on auth.users;
drop trigger if exists on_user_created on public.users;
drop function if exists public.send_welcome_email();

create or replace function public.send_welcome_after_onboarding()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_key text;
  v_email text;
  v_claimed int;
  v_type text;
  v_name text;
begin
  begin
    if NEW.onboarding_completed is not true or OLD.onboarding_completed is true then return NEW; end if;
    select email into v_email from auth.users where id = NEW.id and email_confirmed_at is not null;
    if v_email is null then return NEW; end if;
    -- Reservér afsendelsen; lykkes det ikke, er mailen allerede sendt.
    update public.users set welcome_sent_at = now() where id = NEW.id and welcome_sent_at is null;
    get diagnostics v_claimed = row_count;
    if v_claimed = 0 then return NEW; end if;
    -- Skabelon: N1 (welcome_onboarded) når den nye mailkanal er slået til, ellers
    -- den nuværende velkomstmail (welcome). Begge sendes først her.
    if public.notification_flag('notifications_email_enabled', NEW.id) then
      v_type := 'welcome_onboarded';
      v_name := coalesce(split_part(btrim(coalesce(NEW.name, '')), ' ', 1), '');
    else
      v_type := 'welcome';
      v_name := coalesce(nullif(btrim(coalesce(NEW.name, '')), ''), 'der');
    end if;
    select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
    perform net.http_post(
      url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
      body := jsonb_build_object('type', v_type, 'to', v_email, 'data', jsonb_build_object('name', v_name)),
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
