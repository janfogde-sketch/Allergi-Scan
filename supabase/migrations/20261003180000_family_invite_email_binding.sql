-- Familie-invitationer bindes til modtagerens e-mailadresse (Jan, 3. okt. 2026, ticket 51698c51).
-- Før: et token i et link, gemt i localStorage; mistet, når linket åbnes i én browser (Messenger) og login sker i en anden.
-- Nu: invitationen oprettes af edge-funktionen `family-invite`, sendes som mail og gælder kun for den e-mail, den er sendt til.
-- Modtageren ser en bekræftelse i appen, når en bekræftet konto med samme e-mail logger ind (ingen token nødvendig).
-- Modtagerens e-mail slettes, så snart invitationen er besvaret eller udløbet (privatlivspolitik afsnit 11).

alter table public.family_invites add column if not exists invitee_email text;
-- Hvornår invitationsmailen sidst blev sendt (pause mellem "send igen").
alter table public.family_invites add column if not exists mail_sent_at timestamptz;

alter table public.family_invites drop constraint if exists family_invites_invitee_email_norm;
alter table public.family_invites add constraint family_invites_invitee_email_norm
  check (invitee_email is null or invitee_email = lower(btrim(invitee_email)));

create index if not exists family_invites_invitee_email_pending_idx
  on public.family_invites (invitee_email) where status = 'pending';

-- Klienten opretter ikke længere invitationer selv: kun edge-funktionen (service role), som begrænser antal og sender mailen.
-- (Kørt separat, fordi værktøjet blokerede `drop policy`: se to do 9e6c5888.)
drop policy if exists family_invites_insert_own on public.family_invites;

-- Kalderens bekræftede e-mail (små bogstaver). Intern hjælper: ingen må kalde den direkte.
create or replace function public._caller_verified_email()
 returns text
 language sql
 stable
 security definer
 set search_path to 'public', 'auth'
as $function$
  select lower(btrim(u.email)) from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null
$function$;
revoke execute on function public._caller_verified_email() from public, anon, authenticated;

-- Token-vejen (ældre klienter og linket i mailen): kræver nu, at kontoens bekræftede e-mail er den, invitationen blev sendt til.
create or replace function public.accept_family_invite(p_token text)
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
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Invitationen er ugyldig eller udløbet');
  end if;

  if v_invite.invited_by = v_user_id then
    return jsonb_build_object('success', false, 'error', 'Du kan ikke acceptere din egen invitation');
  end if;

  if v_invite.invitee_email is null or v_invite.invitee_email is distinct from public._caller_verified_email() then
    return jsonb_build_object('success', false, 'error', 'email_mismatch');
  end if;

  update public.family_invites
  set status = 'accepted', accepted_by = v_user_id, accepted_at = now(), invitee_email = null
  where id = v_invite.id;

  return jsonb_build_object('success', true, 'invited_by', v_invite.invited_by);
end;
$function$;

-- Invitationer til kalderens bekræftede e-mail, som venter på svar. Kun afsenderens fornavn vises.
create or replace function public.get_my_pending_family_invites()
 returns jsonb
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', i.id,
           'expires_at', i.expires_at,
           'inviter_first_name', nullif(left(split_part(btrim(u.name), ' ', 1), 30), '')
         ) order by i.created_at desc), '[]'::jsonb)
  from public.family_invites i
  join public.users u on u.id = i.invited_by
  where i.status = 'pending'
    and i.expires_at > now()
    and i.invited_by <> auth.uid()
    and i.invitee_email is not null
    and i.invitee_email = public._caller_verified_email()
$function$;

create or replace function public.accept_my_family_invite(p_invite_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_invite public.family_invites%rowtype;
  v_user_id uuid := auth.uid();
begin
  select * into v_invite
  from public.family_invites
  where id = p_invite_id and status = 'pending' and expires_at > now()
    and invitee_email is not null and invitee_email = public._caller_verified_email()
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

create or replace function public.decline_my_family_invite(p_invite_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  update public.family_invites
  set status = 'revoked', invitee_email = null
  where id = p_invite_id and status = 'pending'
    and invitee_email is not null and invitee_email = public._caller_verified_email()
    and invited_by <> auth.uid();
  return jsonb_build_object('success', found);
end;
$function$;

-- Invitationssiden (anonym, kræver tokenet): viser en maskeret e-mail, så modtageren ved, hvilken adresse de skal oprette sig med.
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
    'expires_at', v_invite.expires_at,
    'invited_by', v_invite.invited_by,
    'inviter_first_name', v_first,
    'invitee_email_hint', v_hint
  );
end;
$function$;

-- Findes der allerede en accepteret forbindelse mellem afsenderen og en konto med den e-mail? (kun edge-funktionen kalder den)
create or replace function public.invitee_already_connected(p_inviter uuid, p_email text)
 returns boolean
 language sql
 stable
 security definer
 set search_path to 'public', 'auth'
as $function$
  select exists (
    select 1
    from auth.users u
    join public.family_invites i on i.status = 'accepted'
      and ((i.invited_by = p_inviter and i.accepted_by = u.id) or (i.accepted_by = p_inviter and i.invited_by = u.id))
    where lower(btrim(u.email)) = lower(btrim(p_email))
  )
$function$;
revoke execute on function public.invitee_already_connected(uuid, text) from public, anon, authenticated;
grant execute on function public.invitee_already_connected(uuid, text) to service_role;

-- Regel 7 (CLAUDE.md): PUBLIC har adgang som standard, så tilbagekald eksplicit og giv kun det, der skal bruges.
revoke execute on function public.get_my_pending_family_invites() from public, anon;
revoke execute on function public.accept_my_family_invite(uuid) from public, anon;
revoke execute on function public.decline_my_family_invite(uuid) from public, anon;
grant execute on function public.get_my_pending_family_invites() to authenticated;
grant execute on function public.accept_my_family_invite(uuid) to authenticated;
grant execute on function public.decline_my_family_invite(uuid) to authenticated;

-- Opbevaring: modtagerens e-mail slettes, når invitationen er besvaret eller udløbet (rækken bevares, som forbindelsen kræver).
-- Egen funktion og eget cron-job (dagligt 03:40 UTC, lige efter `notify-cleanup`), så cleanup_notifications() er uændret.
create or replace function public.cleanup_family_invite_emails()
 returns void
 language sql
 security definer
 set search_path to 'public'
as $function$
  update public.family_invites set invitee_email = null
    where invitee_email is not null and (status <> 'pending' or expires_at < now());
$function$;
revoke execute on function public.cleanup_family_invite_emails() from public, anon, authenticated;
select cron.schedule('family-invite-email-cleanup', '40 3 * * *', 'select public.cleanup_family_invite_emails();');
