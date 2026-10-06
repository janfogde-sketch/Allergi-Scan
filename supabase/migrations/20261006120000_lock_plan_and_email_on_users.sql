-- Sikkerhedsrettelse F2 (kodegennemgang fase 1): en bruger kunne selv ændre plan_id, plan_expires_at og email på sin profil.
-- Samme mønster som prevent_role_self_escalation: kun admin og service-nøglen (auth.uid() er null) må ændre planfelterne;
-- email må kun sættes til kontoens egen login-adresse (auth.users.email), så onboarding virker uændret, og notifikationsmails
-- ikke kan sendes til en vilkårlig adresse.
create or replace function public.prevent_plan_email_self_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := (select auth.uid());
  login_email text;
begin
  if caller is null or is_admin(caller) then
    return new;
  end if;

  if new.plan_id is distinct from old.plan_id
     or new.plan_expires_at is distinct from old.plan_expires_at then
    raise exception 'Kun administratorer kan ændre abonnement';
  end if;

  if new.email is distinct from old.email then
    select email into login_email from auth.users where id = new.id;
    if lower(btrim(coalesce(new.email, ''))) is distinct from lower(btrim(coalesce(login_email, ''))) then
      raise exception 'E-mail kan kun ændres via kontoens login';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_plan_email_self_edit() from public, anon, authenticated;

drop trigger if exists prevent_plan_email_self_edit_trigger on public.users;
create trigger prevent_plan_email_self_edit_trigger
  before update on public.users
  for each row execute function public.prevent_plan_email_self_edit();

-- Engangsretning af rækker, der er ude af trit med login (kører som migrationsejer, ikke som bruger)
update public.users u set email = a.email, updated_at = now()
from auth.users a
where a.id = u.id and u.email is distinct from a.email;
