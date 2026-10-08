-- Demokonto til Apple/Google-anmeldere (Bjørn, 8. okt. 2026).
-- En almindelig brugerkonto (ikke admin) med bekræftet e-mail, færdig onboarding, helbredssamtykke,
-- en realistisk allergiprofil og en børneprofil. Adgangskoden står KUN som bcrypt-hash her; selve
-- login-oplysningerne ligger i udfyldningsarket i projektmappen.
-- Der sendes ingen mails: velkomstmailen er markeret som sendt i samme opdatering, og mailkanalen er slået fra.
-- Idempotent: findes e-mailen allerede, sker der intet.

do $$
declare
  v_uid   constant uuid := '146869cb-8d00-482e-83d9-d84ebe569ce2';
  v_email constant text := 'appreview@eatsafe.dk';
  v_now   timestamptz := now();
begin
  if exists (select 1 from auth.users where email = v_email) then
    raise notice 'Demokontoen findes allerede';
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user, is_anonymous, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
    '$2a$10$xSJ4F9mQwXzbTn5Im8L2xuqPlFpR2WAfK6nCferlGQ4rm18FQ70MK', v_now,
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Alex"}'::jsonb, false, false, false, v_now, v_now
  );

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_uid::text, v_uid,
          jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
          'email', v_now, v_now, v_now);

  -- Rækken i public.users er oprettet af on_auth_user_created. Velkomstmailen markeres som sendt i samme
  -- opdatering, så on_onboarding_completed ikke sender noget.
  insert into public.consent_log (user_id, kind, action, version) values (v_uid, 'health', 'given', '2026-10-02');

  update public.users
     set name = 'Alex', birth_year = 1988, gender = 'Kvinde',
         e_numbers = '[]'::jsonb, allergen_levels = '{}'::jsonb,
         onboarding_step = 5, welcome_sent_at = v_now, onboarding_completed = true, updated_at = v_now
   where id = v_uid;

  -- Jordnødder og nødder (advar ved spor, standard) og laktoseintolerans.
  insert into public.user_allergens (user_id, allergen, type) values
    (v_uid, 'jordnoedder', 'allergen'), (v_uid, 'noedder', 'allergen'), (v_uid, 'laktose', 'allergen');

  -- Børneprofil: Emma, 7 år, mælkeallergi og æg.
  insert into public.family_members (user_id, name, color, gender, birth_year, allergens, custom_allergens, diets, e_numbers, allergen_levels)
  values (v_uid, 'Emma', '#52b788', 'Kvinde', 2019, '["maelkeallergi","aeg"]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '{}'::jsonb);

  -- Ingen mail til kontoen (adressen har ingen indbakke); push og beskeder i appen er uændrede.
  insert into public.notification_preferences (user_id, category, channel, enabled)
  select v_uid, c, 'email', false
    from unnest(array['submission_status','missing_product_found','family','feedback','weekly_digest',
                      'shared_lists','product_changes','recalls','onboarding_reminder']) c
  on conflict do nothing;
end $$;

-- To do: demokontoen er oprettet; Apple-login er bygget og venter på udviklerkontoen.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '00dcb2d2-4a9f-455b-b2f2-364dbc4c4fbd' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select '00dcb2d2-4a9f-455b-b2f2-364dbc4c4fbd', 'Lukket 8. okt. 2026 (Claude, efter Bjørns ja): demokontoen appreview@eatsafe.dk er oprettet ved denne merge (bekræftet, onboarding færdig, samtykke, jordnødder/nødder/laktose og børneprofilen Emma med mælk og æg; mailkanalen slået fra). Login-oplysninger og noter til anmelderne (stregkoder at prøve, kontosletning, samtykke) står i /mnt/project-files/eatsafe/butikserklaeringer-udfyldningsark-2026-10-08.md. Kontoen må ikke slettes eller gøres til admin.'
where exists (select 1 from public.admin_todos where id = '00dcb2d2-4a9f-455b-b2f2-364dbc4c4fbd');
insert into public.admin_todo_comments (todo_id, body)
select 'c9e99f2d-d86a-4c37-a612-6c33b7148e86', '8. okt. 2026 (Claude): "Fortsæt med Apple" er bygget i appen og vises automatisk, når Apple-udbyderen slås til i Supabase. Opsætning hos Apple og Supabase: docs/apple-login-opsaetning.md. Mangler: Apple Developer-kontoen (næste uge), nøglen/Services ID og aktivering i Supabase. Apple-hemmeligheden udløber efter højst 6 måneder og skal fornyes.'
where exists (select 1 from public.admin_todos where id = 'c9e99f2d-d86a-4c37-a612-6c33b7148e86');
