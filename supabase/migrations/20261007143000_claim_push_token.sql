-- Ved en delt telefon: når en konto gemmer enhedens push-abonnement, fjernes samme abonnement fra alle andre konti.
-- Så kan den forrige brugers beskeder ikke dukke op hos den næste, selv hvis ryd-op ved log ud fejlede (udløbet nøgle, offline).
create or replace function public.claim_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or p_token is null or length(p_token) = 0 then
    raise exception 'ikke logget ind' using errcode = '28000';
  end if;
  delete from public.push_tokens where token = p_token and user_id <> v_uid;
  insert into public.push_tokens (user_id, token) values (v_uid, p_token)
  on conflict (user_id, token) do nothing;
end;
$$;

revoke execute on function public.claim_push_token(text) from public, anon;
grant execute on function public.claim_push_token(text) to authenticated;
