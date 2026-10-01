-- Når en bruger skifter e-mail (Supabase Auth, fx Secure email change), følger public.users.email med.
-- notify og send-email sender mails til public.users.email, så den må ikke blive stående på den gamle adresse.
create or replace function public.sync_public_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set email = new.email, updated_at = now() where id = new.id;
  return new;
end;
$$;

revoke all on function public.sync_public_user_email() from public, anon, authenticated;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (new.email is distinct from old.email)
  execute function public.sync_public_user_email();

-- Engangsretning af eventuelle konti, der allerede er ude af trit
update public.users u set email = a.email, updated_at = now()
from auth.users a
where a.id = u.id and u.email is distinct from a.email;
