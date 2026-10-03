-- Har en e-mailadresse allerede en EatSafe-konto? Kun edge-funktionen `family-invite` (service role) kalder den, så invitationsmailen
-- kan bede en eksisterende bruger om at logge ind i stedet for at oprette sig. Resultatet vises ALDRIG for afsenderen (ingen afsløring
-- af, hvem der har en konto). Anvendt via execute_sql 3. okt. 2026 (apply_migration blev blokeret); ingen række i migrationshistorikken.
create or replace function public.invitee_has_account(p_email text)
 returns boolean
 language sql
 stable
 security definer
 set search_path to 'public', 'auth'
as $function$
  select exists (select 1 from auth.users u where lower(btrim(u.email)) = lower(btrim(p_email)))
$function$;
revoke execute on function public.invitee_has_account(text) from public, anon, authenticated;
grant execute on function public.invitee_has_account(text) to service_role;
