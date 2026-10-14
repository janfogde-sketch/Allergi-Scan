-- Admin og sikkerhed (Jan, 14. okt. 2026; samlet gennemgang G13, G14, G17).
-- 1) Et produkt kan slettes, selv om det er scannet, står på en indkøbsliste, har ændringshistorik eller er "kanonisk" for en variant:
--    henvisningerne sættes til tom (historikken beholder stregkoden i ean_scanned, indkøbslisten beholder navnet).
-- 2) Adminloggen dækker flere følsomme handlinger: produktrettelser (også allergener), ændring af andres profil og allergier,
--    sletning af familiemedlemmer og invitationer, push-tekster til alle og CSV-eksport af brugere. Kun feltnavne gemmes,
--    aldrig værdier fra brugerens profil (ingen helbredsdata i loggen). Godkendelse/afvisning af indsendelser logges af
--    edge-funktionen submissions (den kører med service-nøglen, så triggeren kan ikke se, hvem der er admin).
-- 3) Databasen nægter at fjerne den sidste administrator (rolleskift eller sletning).

-- 1) Fremmednøgler til products: on delete set null ---------------------------------------------------------------
alter table public.scan_history drop constraint if exists scan_history_product_id_fkey;
alter table public.scan_history add constraint scan_history_product_id_fkey
  foreign key (product_id) references public.products(id) on delete set null;
alter table public.shopping_list_items drop constraint if exists shopping_list_items_product_id_fkey;
alter table public.shopping_list_items add constraint shopping_list_items_product_id_fkey
  foreign key (product_id) references public.products(id) on delete set null;
alter table public.revision_log drop constraint if exists revision_log_product_id_fkey;
alter table public.revision_log add constraint revision_log_product_id_fkey
  foreign key (product_id) references public.products(id) on delete set null;
alter table public.products drop constraint if exists products_canonical_ean_fkey;
alter table public.products add constraint products_canonical_ean_fkey
  foreign key (canonical_ean) references public.products(ean) on delete set null;

-- 2a) Eksisterende trigger: et slettet produkt får navn og stregkode med i loggen (ellers kan det ikke genkendes bagefter)
create or replace function public.trg_admin_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := (select auth.uid());
  v_col text := tg_argv[1];
  v_old text; v_new text; v_row jsonb;
begin
  if v_admin is null or not public.is_admin(v_admin) then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
    insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
      values (v_admin, tg_argv[0], tg_table_name, v_row ->> 'id',
              case when tg_table_name = 'products' then jsonb_build_object('navn', v_row ->> 'name', 'ean', v_row ->> 'ean') end);
    return old;
  end if;
  v_row := to_jsonb(new);
  v_old := to_jsonb(old) ->> v_col;
  v_new := v_row ->> v_col;
  if v_old is distinct from v_new then
    insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
      values (v_admin, tg_argv[0], tg_table_name, v_row ->> 'id', jsonb_build_object('felt', v_col, 'fra', v_old, 'til', v_new));
  end if;
  return new;
end;
$$;
revoke all on function public.trg_admin_audit() from public, anon, authenticated;

-- 2b) Ny trigger: logger hvilke felter en admin har ændret (ikke værdierne). Argumenter: handling, og op til to
--     ejerkolonner; er rækken adminens egen (fx egen profil eller eget familiemedlem), logges den ikke.
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
  end if;
  if tg_table_name = 'products' then
    v_details := v_details || jsonb_build_object('navn', v_row ->> 'name', 'ean', v_row ->> 'ean');
  elsif tg_table_name = 'notification_push_overrides' and v_new is not null then
    v_details := v_details || jsonb_build_object('titel', v_new ->> 'title', 'tekst', v_new ->> 'body');
  end if;
  insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
    values (v_admin, tg_argv[0], tg_table_name, coalesce(v_row ->> 'id', v_row ->> 'key'), nullif(v_details, '{}'::jsonb));
  return coalesce(new, old);
end;
$$;
revoke all on function public.trg_admin_audit_fields() from public, anon, authenticated;

drop trigger if exists audit_products_update on public.products;
create trigger audit_products_update after update on public.products
  for each row execute function public.trg_admin_audit_fields('produkt_rettet');
drop trigger if exists audit_users_update on public.users;
create trigger audit_users_update after update on public.users
  for each row execute function public.trg_admin_audit_fields('brugerprofil_aendret', 'id');
drop trigger if exists audit_family_members_delete on public.family_members;
create trigger audit_family_members_delete after delete on public.family_members
  for each row execute function public.trg_admin_audit_fields('familiemedlem_slettet', 'user_id', 'family_owner_id');
drop trigger if exists audit_family_invites_delete on public.family_invites;
create trigger audit_family_invites_delete after delete on public.family_invites
  for each row execute function public.trg_admin_audit_fields('invitation_annulleret', 'invited_by', 'accepted_by');
drop trigger if exists audit_push_overrides on public.notification_push_overrides;
create trigger audit_push_overrides after insert or update or delete on public.notification_push_overrides
  for each row execute function public.trg_admin_audit_fields('pushtekst_aendret');

-- 2c) Allergier: én linje pr. bruger og kald (ikke pr. allergen), kun antal, aldrig hvilke allergier.
create or replace function public.trg_admin_audit_user_allergens()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := (select auth.uid());
begin
  if v_admin is null or not public.is_admin(v_admin) then
    return null;
  end if;
  insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
    select v_admin, 'brugerallergier_aendret', 'users', r.user_id::text,
           jsonb_build_object('handling', case tg_op when 'INSERT' then 'tilføjet' else 'fjernet' end, 'antal', count(*))
      from changed_rows r
      where r.user_id is not null and r.user_id <> v_admin
      group by r.user_id;
  return null;
end;
$$;
revoke all on function public.trg_admin_audit_user_allergens() from public, anon, authenticated;

drop trigger if exists audit_user_allergens_insert on public.user_allergens;
create trigger audit_user_allergens_insert after insert on public.user_allergens
  referencing new table as changed_rows
  for each statement execute function public.trg_admin_audit_user_allergens();
drop trigger if exists audit_user_allergens_delete on public.user_allergens;
create trigger audit_user_allergens_delete after delete on public.user_allergens
  referencing old table as changed_rows
  for each statement execute function public.trg_admin_audit_user_allergens();

-- 2d) CSV-eksport sker i browseren, så admin-panelet melder den selv. Kun administratorer, kun kendte lister.
create or replace function public.log_admin_export(p_target text, p_count integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := (select auth.uid());
begin
  if v_admin is null or not public.is_admin(v_admin) then
    raise exception 'Kun administratorer';
  end if;
  if p_target not in ('users', 'products') then
    raise exception 'Ukendt eksport';
  end if;
  insert into public.admin_audit_log (admin_id, action, target_table, details)
    values (v_admin, 'csv_eksport', p_target, jsonb_build_object('antal', greatest(coalesce(p_count, 0), 0)));
end;
$$;
revoke all on function public.log_admin_export(text, integer) from public, anon;
grant execute on function public.log_admin_export(text, integer) to authenticated;

-- 3) Den sidste administrator kan ikke miste rollen eller slettes ---------------------------------------------------
create or replace function public.guard_last_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role is distinct from 'admin') then
    perform pg_advisory_xact_lock(hashtext('public.guard_last_admin'));
    if not exists (select 1 from public.users where role = 'admin' and id <> old.id) then
      raise exception 'Den sidste administrator kan ikke fjernes';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;
revoke all on function public.guard_last_admin() from public, anon, authenticated;

drop trigger if exists guard_last_admin_update on public.users;
create trigger guard_last_admin_update before update of role on public.users
  for each row execute function public.guard_last_admin();
drop trigger if exists guard_last_admin_delete on public.users;
create trigger guard_last_admin_delete before delete on public.users
  for each row execute function public.guard_last_admin();
