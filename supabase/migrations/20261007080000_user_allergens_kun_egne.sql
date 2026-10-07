-- Allergi-rækker må kun skrives på brugerens EGEN konto (user_id = mig, family_member_id tom).
-- Før kunne INSERT/UPDATE også ramme en række med family_member_id ejet af mig uden at binde user_id,
-- så en bruger kunne skrive en allergi ind på en andens konto. Appen skriver aldrig family_member_id her.

drop policy if exists "Brugere kan oprette egne allergener" on public.user_allergens;
create policy "Brugere kan oprette egne allergener" on public.user_allergens
  for insert to authenticated
  with check (
    (user_id = (select auth.uid()) and family_member_id is null and public.has_health_consent((select auth.uid())))
    or public.is_admin((select auth.uid()))
  );

drop policy if exists "Brugere kan opdatere egne allergener" on public.user_allergens;
create policy "Brugere kan opdatere egne allergener" on public.user_allergens
  for update to authenticated
  using (
    (user_id = (select auth.uid()) and family_member_id is null)
    or public.is_admin((select auth.uid()))
  )
  with check (
    (user_id = (select auth.uid()) and family_member_id is null and public.has_health_consent((select auth.uid())))
    or public.is_admin((select auth.uid()))
  );

-- Invitationssiden (åben for alle) må ikke afsløre afsenderens interne id; kun fornavnet bruges.
create or replace function public.get_invite_preview(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_invite public.family_invites%rowtype;
  v_first  text;
  v_hint   text;
begin
  select * into v_invite from public.family_invites where token = p_token;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  if v_invite.status = 'pending' and v_invite.expires_at > now() then
    select nullif(left(split_part(btrim(u.name), ' ', 1), 30), '') into v_first
      from public.users u where u.id = v_invite.invited_by;
    if v_invite.invitee_email is not null then
      v_hint := left(split_part(v_invite.invitee_email, '@', 1), 1)
        || repeat('•', greatest(length(split_part(v_invite.invitee_email, '@', 1)) - 1, 2))
        || '@' || split_part(v_invite.invitee_email, '@', 2);
    end if;
  end if;
  return jsonb_build_object(
    'found', true,
    'status', v_invite.status,
    'kind', v_invite.kind,
    'locked', (v_invite.requested_by is not null),
    'expires_at', v_invite.expires_at,
    'inviter_first_name', v_first,
    'invitee_email_hint', v_hint
  );
end;
$function$;
