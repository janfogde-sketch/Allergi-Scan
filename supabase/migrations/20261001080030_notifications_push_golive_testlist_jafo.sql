-- Jans ord 1. okt. 2026: testlisten sættes til jafo, og push tændes globalt først (mail forbliver FRA).
update public.app_flags set value = '["9e92dc72-f105-454c-b793-eec22ccf8ca3"]'::jsonb where key = 'notifications_test_users';
update public.app_flags set value = 'true'::jsonb where key = 'notifications_push_enabled';
