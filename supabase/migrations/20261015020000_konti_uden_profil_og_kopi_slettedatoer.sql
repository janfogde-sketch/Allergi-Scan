-- To do e73205d0 (Jans ja 14. okt. 2026): konti uden profil og slettedatoer på sikkerhedskopier.
-- SLETTER DATA: én loginkonto uden profil (Google, oprettet og sidst logget ind 19. sept. 2026, ingen data i appen).
-- Loginoplysningerne gemmes først i en låst kopi, der selv slettes 13. nov. 2026.

-- 1) Kopi af kontoen, derefter sletning (identities og sessions følger med via cascade).
create table public.auth_users_no_profile_backup_20261014 as
select u.id, u.email, u.created_at, u.last_sign_in_at, u.raw_app_meta_data, u.raw_user_meta_data
from auth.users u
where u.id = 'e33318ab-491d-4248-b2f0-042c6ef02fcf'
  and not exists (select 1 from public.users p where p.id = u.id);
alter table public.auth_users_no_profile_backup_20261014 enable row level security;
revoke all on public.auth_users_no_profile_backup_20261014 from anon, authenticated;
comment on table public.auth_users_no_profile_backup_20261014 is
  'Kopi af loginkonto uden profil, slettet 14. okt. 2026 (to do e73205d0). Slettes automatisk 13. nov. 2026 (backup_retention).';

delete from auth.users u
where u.id = 'e33318ab-491d-4248-b2f0-042c6ef02fcf'
  and not exists (select 1 from public.users p where p.id = u.id)
  and exists (select 1 from public.auth_users_no_profile_backup_20261014 b where b.id = u.id);

-- 2) Fremover: loginkonti, der har stået uden profil i over 30 dage, slettes dagligt.
--    Sådan en konto kan ikke bruge appen og ses ikke af inactive_accounts() (som kun ser konti med profil).
create or replace function public.cleanup_accounts_without_profile()
returns integer language plpgsql security definer set search_path = public, auth as $$
declare n integer;
begin
  delete from auth.users u
  where u.created_at < now() - interval '30 days'
    and not exists (select 1 from public.users p where p.id = u.id);
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.cleanup_accounts_without_profile() from public, anon, authenticated;

-- 3) Slettedatoer på sikkerhedskopier. Den daglige oprydning sletter en kopi på dens dato.
create table public.backup_retention (
  table_name text primary key check (table_name ~ '_[0-9]{8}[a-z]?$' and table_name <> 'removed_image_backup_20261005'),
  delete_after date not null,
  note text
);
alter table public.backup_retention enable row level security;
revoke all on public.backup_retention from anon, authenticated;
comment on table public.backup_retention is
  'Slettedato pr. sikkerhedskopi (to do e73205d0). cleanup_expired_backups() sletter tabellen på datoen. removed_image_backup_20261005 beholdes og kan ikke stå her.';

insert into public.backup_retention (table_name, delete_after, note) values
  ('users_diets_backup_20261013', '2026-11-12', 'Diæt-kopi (Jans dato)'),
  ('family_members_diets_backup_20261013', '2026-11-12', 'Diæt-kopi (Jans dato)'),
  ('auth_users_no_profile_backup_20261014', '2026-11-13', 'Kopi af slettet konto uden profil (30 dage)'),
  ('opskrift_rester_backup_20261014', '2026-11-13', 'Opskrift-kopi (Jans dato); slettes kun, hvis den findes'),
  ('products_allergen_backup_20261006', '2026-12-14', 'Kopi fra 5.-8. okt.'),
  ('products_allergen_backup_20261007', '2026-12-14', 'Kopi fra 5.-8. okt.'),
  ('products_allergen_backup_20261007b', '2026-12-14', 'Kopi fra 5.-8. okt.'),
  ('products_allergen_down_backup_20261006', '2026-12-14', 'Kopi fra 5.-8. okt.'),
  ('products_unknown_flags_backup_20261007', '2026-12-14', 'Kopi fra 5.-8. okt.'),
  ('base64_image_backup_20261006', '2026-12-14', 'Kopi fra 5.-8. okt.'),
  ('products_hygiene_backup_20261008', '2026-12-14', 'Kopi fra 5.-8. okt.'),
  ('image_removed_ids_20261005', '2026-12-14', 'Kopi fra 5.-8. okt.'),
  ('nemlig_off_image_match_20261005', '2026-12-14', 'Kopi fra 5.-8. okt.'),
  ('knowledge_base_funfacts_backup_20261013', '2027-01-14', 'Kopi fra 13.-14. okt.'),
  ('products_category_backup_20261013', '2027-01-14', 'Kopi fra 13.-14. okt.'),
  ('products_category_backup_20261014', '2027-01-14', 'Kopi fra 13.-14. okt.'),
  ('products_nutrition_backup_20261013', '2027-01-14', 'Kopi fra 13.-14. okt.'),
  ('products_nutrition_backup_nemlig_20261013', '2027-01-14', 'Kopi fra 13.-14. okt.');

-- Slettedatoen også som kommentar på hver eksisterende kopi.
do $$
declare r record;
begin
  for r in select * from public.backup_retention loop
    if to_regclass('public.' || quote_ident(r.table_name)) is not null then
      execute format('comment on table public.%I is %L', r.table_name,
        coalesce(obj_description(('public.' || quote_ident(r.table_name))::regclass, 'pg_class') || ' ', '')
        || 'Slettes automatisk ' || to_char(r.delete_after, 'YYYY-MM-DD') || ' (backup_retention, to do e73205d0).');
    end if;
  end loop;
end $$;

create or replace function public.cleanup_expired_backups()
returns integer language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  for r in select table_name from public.backup_retention where delete_after <= current_date loop
    execute format('drop table if exists public.%I', r.table_name);
    delete from public.backup_retention where table_name = r.table_name;
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.cleanup_expired_backups() from public, anon, authenticated;

-- 4) Dagligt kl. 04:00 og 04:05 UTC (før inactive-accounts-cleanup 04:10).
select cron.schedule('backup-retention-cleanup', '0 4 * * *', 'select public.cleanup_expired_backups();');
select cron.schedule('accounts-without-profile-cleanup', '5 4 * * *', 'select public.cleanup_accounts_without_profile();');
