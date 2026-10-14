-- Ryd rester af Opskrifter og ubrugte kolonner (Jan, 14. okt. 2026, to do 0fc24fd5; samlet gennemgang G22, G23).
-- SLETTER DATA: notifikationsvalget "weekly_digest" (ugentlig opskriftsmail) og kolonnerne users.phone og users.preferred_stores
-- (begge tomme). Først en sikkerhedskopi af de rækker/værdier, der fjernes.
-- Tabellerne recipes/recipe_ingredients og funktionen food-waste beholdes (Jans valg 13. okt. 2026).

-- 1) Sikkerhedskopi (RLS slået til, ingen politikker = kun service-nøglen kan læse). Slettes 13. nov. 2026.
create table if not exists public.opskrift_rester_backup_20261014 (
  kilde text not null,
  data jsonb not null,
  gemt_at timestamptz not null default now()
);
alter table public.opskrift_rester_backup_20261014 enable row level security;
revoke all on public.opskrift_rester_backup_20261014 from anon, authenticated;
comment on table public.opskrift_rester_backup_20261014 is
  'Sikkerhedskopi før oprydning af opskrift-rester og ubrugte kolonner (14. okt. 2026). Slettes 13. nov. 2026.';

insert into public.opskrift_rester_backup_20261014 (kilde, data)
select 'notification_preferences', to_jsonb(np) from public.notification_preferences np where np.category = 'weekly_digest';

insert into public.opskrift_rester_backup_20261014 (kilde, data)
select 'users', jsonb_build_object('id', u.id, 'phone', u.phone, 'preferred_stores', u.preferred_stores)
from public.users u where nullif(u.phone, '') is not null or u.preferred_stores is not null;

-- 2) Notifikationsvalget for den ugentlige opskriftsmail
delete from public.notification_preferences where category = 'weekly_digest';
alter table public.notification_preferences drop constraint if exists notification_preferences_category_check;
alter table public.notification_preferences add constraint notification_preferences_category_check
  check (category = any (array['submission_status','missing_product_found','family','feedback','product_changes',
                               'shared_lists','recalls','onboarding_reminder']));

-- 3) Oprettelse af nye brugere skriver ikke længere telefonnummer (appen indsamler det ikke)
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text := nullif(left(btrim(coalesce(meta->>'name', meta->>'full_name', '')), 100), '');
  v_birth_year int;
  v_gender text := meta->>'gender';
  v_step int := 1;
begin
  if (meta->>'birth_year') ~ '^\d{4}$' then
    v_birth_year := (meta->>'birth_year')::int;
    if v_birth_year < extract(year from now())::int - 120 or v_birth_year > extract(year from now())::int then
      v_birth_year := null;
    end if;
  end if;
  if v_gender is not null and v_gender not in ('Mand','Kvinde','Andet','Vil ikke oplyse') then
    v_gender := null;
  end if;
  if meta->>'signup_profile' = 'true' and v_name is not null and v_birth_year is not null and v_gender is not null then
    v_step := 2;
  end if;

  insert into public.users (id, email, name, birth_year, gender, onboarding_step, onboarding_completed, created_at, updated_at)
  values (new.id, new.email, v_name, v_birth_year, v_gender, v_step, false, now(), now());
  return new;
end;
$function$;

-- 4) Ubrugte kolonner
alter table public.users drop column if exists phone;
alter table public.users drop column if exists preferred_stores;
