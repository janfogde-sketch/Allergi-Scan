-- Invitationen kan også bruges via linket i mailen, uanset loginmetode og e-mailadresse (Jan, 3. okt. 2026): en bruger, der logger ind
-- med Facebook (eller en anden adresse end den inviterede), får ellers aldrig vist invitationen ved e-mail-match. Linket med tokenet
-- er sendt til den inviterede, så den, der følger det, kan forbindes. Samme krav som ellers: brugeren skal selv sige ja, tokenet virker
-- højst 24 timer og kun én gang, og afsenderen kan ikke acceptere sin egen invitation.
-- Anvendt via execute_sql 3. okt. 2026 (apply_migration blev blokeret).
create or replace function public.get_family_invite_by_link(p_token text)
 returns jsonb
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
           'id', i.id,
           'expires_at', i.expires_at,
           'inviter_first_name', nullif(left(split_part(btrim(u.name), ' ', 1), 30), '')
         )
  from public.family_invites i
  join public.users u on u.id = i.invited_by
  where i.token = p_token
    and i.status = 'pending'
    and i.expires_at > now()
    and i.invited_by <> auth.uid()
$function$;

create or replace function public.accept_family_invite_by_link(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_invite  public.family_invites%rowtype;
  v_user_id uuid := auth.uid();
begin
  select * into v_invite
  from public.family_invites
  where token = p_token and status = 'pending' and expires_at > now()
    and invited_by <> v_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Invitationen er ugyldig eller udløbet');
  end if;

  update public.family_invites
  set status = 'accepted', accepted_by = v_user_id, accepted_at = now(), invitee_email = null
  where id = v_invite.id;

  return jsonb_build_object('success', true, 'invited_by', v_invite.invited_by);
end;
$function$;

create or replace function public.decline_family_invite_by_link(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  update public.family_invites
  set status = 'revoked', invitee_email = null
  where token = p_token and status = 'pending' and invited_by <> auth.uid();
  return jsonb_build_object('success', found);
end;
$function$;

revoke execute on function public.get_family_invite_by_link(text) from public, anon;
revoke execute on function public.accept_family_invite_by_link(text) from public, anon;
revoke execute on function public.decline_family_invite_by_link(text) from public, anon;
grant execute on function public.get_family_invite_by_link(text) to authenticated;
grant execute on function public.accept_family_invite_by_link(text) to authenticated;
grant execute on function public.decline_family_invite_by_link(text) to authenticated;
