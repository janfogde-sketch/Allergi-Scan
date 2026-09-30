-- 30. sept. 2026 (Jans punkt 7): Onboarding trin 1 (navn, telefon, alder,
-- køn) udfyldes nu FØR kontoen oprettes og sendes med i signup som
-- user_metadata. handle_new_user() gemmer dem i public.users, så navnet er
-- på plads, når velkomstmailen sendes ved bekræftelse (i stedet for
-- e-mail-præfikset), og onboarding fortsætter fra trin 2 efter
-- bekræftelseslinket. Metadata er brugerstyret input: kun egne felter,
-- typetjekket og længdebegrænset; role læses aldrig herfra.
--
-- Samtidig: gender-check tillod ikke "Vil ikke oplyse", som appen tilbyder
-- — valget fik hele trin 1-gemningen (også navn/alder) til at fejle stille.

alter table public.users drop constraint if exists users_gender_check;
alter table public.users add constraint users_gender_check
  check (gender = any (array['Mand','Kvinde','Andet','Vil ikke oplyse']));
alter table public.family_members drop constraint if exists family_members_gender_check;
alter table public.family_members add constraint family_members_gender_check
  check (gender = any (array['Mand','Kvinde','Andet','Vil ikke oplyse']));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text := nullif(left(btrim(coalesce(meta->>'name', meta->>'full_name', '')), 100), '');
  v_phone text := nullif(left(btrim(coalesce(meta->>'phone', '')), 20), '');
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
  -- Trin 1 er gennemført i appen før oprettelse, når alle obligatoriske
  -- felter er med (signup_profile markerer at det kommer fra det flow).
  if meta->>'signup_profile' = 'true' and v_name is not null and v_birth_year is not null and v_gender is not null then
    v_step := 2;
  end if;

  insert into public.users (id, email, name, phone, birth_year, gender, onboarding_step, onboarding_completed, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(v_name, split_part(new.email, '@', 1)),
    v_phone,
    v_birth_year,
    v_gender,
    v_step,
    false,
    now(),
    now()
  );
  return new;
end;
$function$;
