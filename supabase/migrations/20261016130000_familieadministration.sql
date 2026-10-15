-- Familieadministration (16. okt. 2026): administratorer læser og ændrer familier kun gennem funktioner med kontrol, afledt status på invitationer,
-- tilbagekaldelse (ikke sletning) og fjernelse af medlem med påkrævet begrundelse, begge med præcis ÉN logpost. Direkte sletning for administratorer
-- på tabellerne fjernes (ejere beholder deres egne rettigheder). Bagudkompatibel: ingen kolonner ændres.

-- 1) Felt-udløseren springer over, når en funktion logger selv (undgår dobbeltlog)
create or replace function public.trg_admin_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := (select auth.uid());
  v_old jsonb; v_new jsonb; v_row jsonb; v_fields text[]; v_details jsonb := '{}'::jsonb;
begin
  if v_admin is null or not public.is_admin(v_admin) then
    return coalesce(new, old);
  end if;
  if coalesce(current_setting('app.admin_audit_manual', true), '') = '1' then
    return coalesce(new, old);
  end if;
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old); end if;
  if tg_op in ('UPDATE', 'INSERT') then v_new := to_jsonb(new); end if;
  v_row := coalesce(v_new, v_old);
  if (nullif(tg_argv[1], '') is not null and v_row ->> tg_argv[1] = v_admin::text)
     or (nullif(tg_argv[2], '') is not null and v_row ->> tg_argv[2] = v_admin::text) then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' then
    select array_agg(k order by k) into v_fields
      from jsonb_object_keys(v_new) as k
      where k not in ('updated_at', 'role', 'reparsed_at', 'inactivity_warned_at', 'welcome_sent_at', 'onboarding_step')
        and (v_old -> k) is distinct from (v_new -> k);
    if v_fields is null then return new; end if;
    v_details := jsonb_build_object('felter', to_jsonb(v_fields));
    if tg_table_name in ('products', 'knowledge_base', 'notification_push_overrides') then
      v_details := v_details || jsonb_build_object('aendringer', (
        select jsonb_agg(jsonb_build_object('felt', f, 'fra', public.audit_short(v_old -> f), 'til', public.audit_short(v_new -> f)) order by f)
          from unnest(v_fields) as f));
    end if;
  end if;
  if tg_table_name = 'products' then
    v_details := v_details || jsonb_build_object('navn', v_row ->> 'name', 'ean', v_row ->> 'ean');
  elsif tg_table_name = 'knowledge_base' then
    v_details := v_details || jsonb_build_object('navn', v_row ->> 'title');
  elsif tg_table_name = 'notification_push_overrides' and v_new is not null then
    v_details := v_details || jsonb_build_object('titel', v_new ->> 'title', 'tekst', v_new ->> 'body');
  end if;
  insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
    values (v_admin, tg_argv[0], tg_table_name, coalesce(v_row ->> 'id', v_row ->> 'key'), nullif(v_details, '{}'::jsonb));
  return coalesce(new, old);
end;
$$;
revoke all on function public.trg_admin_audit_fields() from public, anon, authenticated;

-- 2) Administratorer sletter ikke længere direkte i familietabellerne
drop policy if exists family_invites_delete on public.family_invites;
create policy family_invites_delete on public.family_invites as permissive for delete to authenticated
  using ((select auth.uid()) = invited_by and status = 'pending');
drop policy if exists family_members_delete_combined on public.family_members;
create policy family_members_delete_combined on public.family_members as permissive for delete to authenticated
  using (user_id = (select auth.uid()) or (select auth.uid()) in (select public.family_group(family_members.family_owner_id)));

-- 3) Afledt status på en invitation (databasen opdaterer ikke selv 'pending' til 'expired')
create or replace function public.family_invite_status(p_status text, p_expires timestamptz)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p_status = 'pending' and p_expires < now() then 'expired' else p_status end
$$;

-- 4) Oversigt: én række pr. familie (ejer), uden allergier og helbredsdata
create or replace function public.admin_family_overview(p_q text default '', p_limit int default 50, p_offset int default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_q text := nullif(trim(coalesce(p_q, '')), '');
  v_res jsonb;
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  with owners as (
    select coalesce(fm.family_owner_id, fm.user_id) as owner_id,
           count(*) as profiles,
           count(*) filter (where fm.user_id is null) as child_profiles,
           max(fm.created_at) as last_change
      from public.family_members fm
      where coalesce(fm.family_owner_id, fm.user_id) is not null
      group by 1
  ), inv as (
    select i.invited_by as owner_id,
           count(*) filter (where public.family_invite_status(i.status, i.expires_at) = 'pending') as pending_invites,
           count(*) filter (where public.family_invite_status(i.status, i.expires_at) = 'accepted') as accepted_invites
      from public.family_invites i group by 1
  ), rows as (
    select o.owner_id, u.name, u.email, o.profiles, o.child_profiles, o.last_change,
           coalesce(v.pending_invites, 0) as pending_invites, coalesce(v.accepted_invites, 0) as accepted_invites
      from owners o
      left join public.users u on u.id = o.owner_id
      left join inv v on v.owner_id = o.owner_id
      where v_q is null or u.name ilike '%' || v_q || '%' or u.email ilike '%' || v_q || '%'
  )
  select jsonb_build_object(
    'total', (select count(*) from rows),
    'rows', coalesce((select jsonb_agg(to_jsonb(r) order by r.last_change desc nulls last) from (
      select * from rows order by last_change desc nulls last limit greatest(least(p_limit, 200), 1) offset greatest(p_offset, 0)) r), '[]'::jsonb))
  into v_res;
  return v_res;
end;
$$;

-- 5) Én families medlemmer og invitationer (ingen allergier)
create or replace function public.admin_family_detail(p_owner uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'owner', (select jsonb_build_object('id', u.id, 'name', u.name, 'email', u.email) from public.users u where u.id = p_owner),
    'members', coalesce((select jsonb_agg(jsonb_build_object('id', fm.id, 'name', fm.name, 'user_id', fm.user_id, 'is_child', fm.user_id is null,
                                                              'birth_year', fm.birth_year, 'created_at', fm.created_at) order by fm.created_at)
                           from public.family_members fm where coalesce(fm.family_owner_id, fm.user_id) = p_owner), '[]'::jsonb),
    'invites', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'status', public.family_invite_status(i.status, i.expires_at),
                                                              'created_at', i.created_at, 'expires_at', i.expires_at, 'accepted_at', i.accepted_at,
                                                              'accepted_by', i.accepted_by, 'is_request', i.requested_by is not null) order by i.created_at desc)
                           from public.family_invites i where i.invited_by = p_owner), '[]'::jsonb));
end;
$$;

-- 6) Invitationer med afledt status
create or replace function public.admin_list_family_invites(p_status text default null, p_limit int default 100)
returns table (id uuid, status text, created_at timestamptz, expires_at timestamptz, accepted_at timestamptz,
               invited_by uuid, inviter_name text, accepted_by uuid, accepted_name text, is_request boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  return query
    select i.id, public.family_invite_status(i.status, i.expires_at), i.created_at, i.expires_at, i.accepted_at,
           i.invited_by, ui.name, i.accepted_by, ua.name, i.requested_by is not null
      from public.family_invites i
      left join public.users ui on ui.id = i.invited_by
      left join public.users ua on ua.id = i.accepted_by
      where p_status is null or public.family_invite_status(i.status, i.expires_at) = p_status
      order by i.created_at desc
      limit greatest(least(p_limit, 500), 1);
end;
$$;

-- 7) Tilbagekald en ventende invitation (rækken bevares som 'revoked'); forespørgsler om forbindelse røres ikke
create or replace function public.admin_revoke_family_invite(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := (select auth.uid());
  v_inv public.family_invites%rowtype;
  v_reason text := trim(coalesce(p_reason, ''));
begin
  if not public.is_admin(v_admin) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  if length(v_reason) < 3 then
    raise exception 'Begrundelse mangler' using errcode = '22023';
  end if;
  select * into v_inv from public.family_invites where id = p_id for update;
  if not found then raise exception 'Invitation ikke fundet' using errcode = 'P0002'; end if;
  if v_inv.requested_by is not null then
    raise exception 'Forespørgsler om forbindelse kan ikke tilbagekaldes af administratorer' using errcode = '22023';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'Kun ventende invitationer kan tilbagekaldes' using errcode = '22023';
  end if;
  update public.family_invites set status = 'revoked' where id = p_id;
  insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
    values (v_admin, 'invitation_tilbagekaldt', 'family_invites', p_id::text, jsonb_build_object('begrundelse', v_reason));
end;
$$;

-- 8) Fjern et familiemedlem med begrundelse
create or replace function public.admin_remove_family_member(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := (select auth.uid());
  v_row public.family_members%rowtype;
  v_reason text := trim(coalesce(p_reason, ''));
begin
  if not public.is_admin(v_admin) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  if length(v_reason) < 3 then
    raise exception 'Begrundelse mangler' using errcode = '22023';
  end if;
  select * into v_row from public.family_members where id = p_id for update;
  if not found then raise exception 'Medlem ikke fundet' using errcode = 'P0002'; end if;
  perform set_config('app.admin_audit_manual', '1', true);
  delete from public.family_members where id = p_id;
  perform set_config('app.admin_audit_manual', '', true);
  insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
    values (v_admin, 'familiemedlem_fjernet', 'family_members', p_id::text,
            jsonb_build_object('begrundelse', v_reason, 'familie', coalesce(v_row.family_owner_id, v_row.user_id), 'barneprofil', v_row.user_id is null));
end;
$$;

revoke all on function public.family_invite_status(text, timestamptz) from public, anon;
revoke all on function public.admin_family_overview(text, int, int) from public, anon;
revoke all on function public.admin_family_detail(uuid) from public, anon;
revoke all on function public.admin_list_family_invites(text, int) from public, anon;
revoke all on function public.admin_revoke_family_invite(uuid, text) from public, anon;
revoke all on function public.admin_remove_family_member(uuid, text) from public, anon;
grant execute on function public.family_invite_status(text, timestamptz) to authenticated;
grant execute on function public.admin_family_overview(text, int, int) to authenticated;
grant execute on function public.admin_family_detail(uuid) to authenticated;
grant execute on function public.admin_list_family_invites(text, int) to authenticated;
grant execute on function public.admin_revoke_family_invite(uuid, text) to authenticated;
grant execute on function public.admin_remove_family_member(uuid, text) to authenticated;
