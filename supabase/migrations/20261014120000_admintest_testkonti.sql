-- Live-test af adminadgang (to do 0d0e9d8b, Jan 14. okt. 2026: "ja"): opretter to almindelige testkonti
-- admintest-a@example.com og admintest-b@example.com (role 'user', aldrig admin) på example.com, et domæne der ikke kan
-- modtage mail. Bekræftet e-mail, færdig onboarding og samtykke. Adgangskoden står KUN som bcrypt-hash her.
-- Ingen mails/push: velkomstmailen markeres som sendt, og mail- og push-kanalen slås fra. Kontiene slettes igen
-- af en separat migration, når testen er kørt. Idempotent: eksisterende e-mails springes over.

do $$
declare
  v_hash  constant text := '$2a$10$xYLFKRlt400yqaf8bvAMruUKnB.8yDPUCIjf3/P6AlICfXcMU2Rsy';
  v_now   timestamptz := now();
  v_uid   uuid;
  v_email text;
  v_tag   text;
begin
  foreach v_tag in array array['a', 'b'] loop
    v_email := 'admintest-' || v_tag || '@example.com';
    if exists (select 1 from auth.users where email = v_email) then continue; end if;
    v_uid := md5('eatsafe-admintest-' || v_tag)::uuid;

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user, is_anonymous, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email, v_hash, v_now,
      '', '', '', '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('name', 'Admintest ' || upper(v_tag)),
      false, false, false, v_now, v_now
    );
    insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid::text, v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
            'email', v_now, v_now, v_now);

    -- Rækken i public.users oprettes af on_auth_user_created.
    insert into public.consent_log (user_id, kind, action, version) values (v_uid, 'health', 'given', '2026-10-02');
    update public.users
       set name = 'Admintest ' || upper(v_tag), birth_year = 1980, gender = 'Andet',
           e_numbers = '[]'::jsonb, allergen_levels = '{}'::jsonb,
           onboarding_step = 5, welcome_sent_at = v_now, onboarding_completed = true, updated_at = v_now
     where id = v_uid;
    insert into public.user_allergens (user_id, allergen, type) values (v_uid, 'aeg', 'allergen');
    insert into public.notification_preferences (user_id, category, channel, enabled)
    select v_uid, c, ch, false
      from unnest(array['submission_status','missing_product_found','family','feedback','weekly_digest',
                        'shared_lists','product_changes','recalls','onboarding_reminder']) c,
           unnest(array['email','push']) ch
    on conflict do nothing;
  end loop;
end $$;
