-- Delt invitationslink med afsenderens godkendelse (Jan, 3. okt. 2026). E-mail-invitationer er uændrede. En invitation af typen 'link' har
-- ingen e-mail: afsenderen deler linket (fx i Messenger), den første, der følger det og siger ja, bliver LÅST til invitationen
-- (`requested_by`), og først når afsenderen selv godkender, bliver de forbundet. Så kan et videresendt link ikke give en fremmed adgang til
-- afsenderens helbredsoplysninger. Anvendt via execute_sql 3. okt. 2026 (apply_migration blev blokeret).
alter table public.family_invites add column if not exists kind text not null default 'email';
alter table public.family_invites add column if not exists requested_by uuid references public.users(id) on delete set null;
alter table public.family_invites add column if not exists requested_at timestamptz;
alter table public.family_invites add constraint family_invites_kind_check check (kind in ('email','link'));

create or replace function public.get_family_invite_by_link(p_token text)
 returns jsonb
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
           'id', i.id,
           'kind', i.kind,
           'expires_at', i.expires_at,
           'inviter_first_name', nullif(left(split_part(btrim(u.name), ' ', 1), 30), ''),
           'awaiting', (i.requested_by is not null and i.requested_by = auth.uid())
         )
  from public.family_invites i
  join public.users u on u.id = i.invited_by
  where i.token = p_token
    and i.status = 'pending'
    and i.expires_at > now()
    and i.invited_by <> auth.uid()
    and (i.requested_by is null or i.requested_by = auth.uid())
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
    return jsonb_build_object('success', true, 'pending_approval', true);
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
  -- Et delt link afvises ikke af en tilfældig, der har linket: kun mail-invitationer kan afvises med tokenet.
  update public.family_invites
  set status = 'revoked', invitee_email = null
  where token = p_token and status = 'pending' and kind = 'email' and invited_by <> auth.uid();
  return jsonb_build_object('success', found);
end;
$function$;

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
    'expires_at', v_invite.expires_at,
    'invited_by', v_invite.invited_by,
    'inviter_first_name', v_first,
    'invitee_email_hint', v_hint
  );
end;
$function$;

-- Afsenderens side: hvem har bedt om at blive forbundet via det delte link, og godkend eller afvis.
create or replace function public.get_family_link_requests()
 returns jsonb
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
           'invite_id', i.id,
           'requested_at', i.requested_at,
           'requester_first_name', nullif(left(split_part(btrim(u.name), ' ', 1), 30), '')
         ) order by i.requested_at), '[]'::jsonb)
  from public.family_invites i
  join public.users u on u.id = i.requested_by
  where i.invited_by = auth.uid()
    and i.kind = 'link'
    and i.status = 'pending'
    and i.expires_at > now()
    and i.requested_by is not null
$function$;

create or replace function public.approve_family_link_request(p_invite_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  update public.family_invites
  set status = 'accepted', accepted_by = requested_by, accepted_at = now()
  where id = p_invite_id and invited_by = auth.uid() and kind = 'link'
    and status = 'pending' and requested_by is not null and expires_at > now();
  return jsonb_build_object('success', found);
end;
$function$;

create or replace function public.decline_family_link_request(p_invite_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  update public.family_invites
  set status = 'revoked'
  where id = p_invite_id and invited_by = auth.uid() and kind = 'link'
    and status = 'pending' and requested_by is not null;
  return jsonb_build_object('success', found);
end;
$function$;

revoke execute on function public.get_family_link_requests() from public, anon;
revoke execute on function public.approve_family_link_request(uuid) from public, anon;
revoke execute on function public.decline_family_link_request(uuid) from public, anon;
grant execute on function public.get_family_link_requests() to authenticated;
grant execute on function public.approve_family_link_request(uuid) to authenticated;
grant execute on function public.decline_family_link_request(uuid) to authenticated;
