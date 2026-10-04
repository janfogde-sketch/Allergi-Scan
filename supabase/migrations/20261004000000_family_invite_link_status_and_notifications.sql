-- Opfølgning på det delte invitationslink (4. okt. 2026), huller fra docs/familie-invitationer-testplan.md afsnit 6:
--  * get_family_invite_link_status(token): hvorfor kan et link ikke bruges (locked/used/expired/revoked/own/awaiting/unknown/ok), så appen
--    kan forklare det i stedet for at tie stille (hul 2).
--  * get_invite_preview får `locked`, så invite.html kan sige, at linket allerede er taget af en anden (hul 2).
--  * Afsenderen får besked, når nogen har bedt om forbindelse via det delte link (hul 4): hændelsen family_link_requested.
--  * Den, der bad om forbindelse, får besked, når afsenderen afviser eller annullerer (hul 1): hændelsen family_link_declined (trigger).
--    Godkendelse bruger den eksisterende family_invite_accepted; notify sender den til den, der bad (ikke til den, der godkendte).
-- Anvendt via execute_sql 4. okt. 2026 (apply_migration blev blokeret).
create or replace function public.get_family_invite_link_status(p_token text)
 returns text
 language plpgsql
 stable
 security definer
 set search_path to 'public'
as $function$
declare
  i public.family_invites%rowtype;
begin
  select * into i from public.family_invites where token = p_token;
  if not found then return 'unknown'; end if;
  if i.invited_by = auth.uid() then return 'own'; end if;
  if i.status = 'accepted' and i.accepted_by = auth.uid() then return 'mine'; end if;
  if i.status = 'accepted' then return 'used'; end if;
  if i.status <> 'pending' then return 'revoked'; end if;
  if i.expires_at <= now() then return 'expired'; end if;
  if i.requested_by is not null and i.requested_by = auth.uid() then return 'awaiting'; end if;
  if i.requested_by is not null then return 'locked'; end if;
  return 'ok';
end;
$function$;
revoke execute on function public.get_family_invite_link_status(text) from public, anon;
grant execute on function public.get_family_invite_link_status(text) to authenticated;

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
    'invited_by', v_invite.invited_by,
    'inviter_first_name', v_first,
    'invitee_email_hint', v_hint
  );
end;
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

  -- Delt link: ingen forbindes, før afsenderen har godkendt. Linket låses til den første, der beder om det.
  if v_invite.kind = 'link' then
    if v_invite.requested_by is not null and v_invite.requested_by <> v_user_id then
      return jsonb_build_object('success', false, 'error', 'Invitationen er allerede brugt');
    end if;
    update public.family_invites
    set requested_by = v_user_id,
        requested_at = coalesce(requested_at, now()),
        expires_at = greatest(expires_at, now() + interval '24 hours')
    where id = v_invite.id;
    -- Afsenderen får besked om anmodningen (kun første gang; en gentagen anmodning fra samme bruger giver ingen ny besked)
    if v_invite.requested_by is null then
      perform public.enqueue_notification_event(
        'invite:' || v_invite.id || ':requested', 'family_link_requested', jsonb_build_object('invite_id', v_invite.id));
    end if;
    return jsonb_build_object('success', true, 'pending_approval', true);
  end if;

  update public.family_invites
  set status = 'accepted', accepted_by = v_user_id, accepted_at = now(), invitee_email = null
  where id = v_invite.id;

  return jsonb_build_object('success', true, 'invited_by', v_invite.invited_by);
end;
$function$;

create or replace function public.trg_notify_link_declined()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  -- Afvist (UPDATE til revoked) eller annulleret (DELETE) af afsenderen, efter at en person har bedt om forbindelse via det delte link
  if TG_OP = 'UPDATE' then
    if NEW.kind = 'link' and NEW.status = 'revoked' and OLD.status = 'pending' and NEW.requested_by is not null then
      perform public.enqueue_notification_event(
        'invite:' || NEW.id || ':declined', 'family_link_declined',
        jsonb_build_object('invite_id', NEW.id, 'requester_id', NEW.requested_by, 'inviter_id', NEW.invited_by));
    end if;
    return NEW;
  else
    if OLD.kind = 'link' and OLD.status = 'pending' and OLD.requested_by is not null then
      perform public.enqueue_notification_event(
        'invite:' || OLD.id || ':declined', 'family_link_declined',
        jsonb_build_object('invite_id', OLD.id, 'requester_id', OLD.requested_by, 'inviter_id', OLD.invited_by));
    end if;
    return OLD;
  end if;
end;
$function$;

create trigger notify_link_declined_update after update of status on public.family_invites
  for each row execute function public.trg_notify_link_declined();
create trigger notify_link_declined_delete before delete on public.family_invites
  for each row execute function public.trg_notify_link_declined();
