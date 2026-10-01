-- Jans ord 1. okt. 2026: mail tændes for alle (push er allerede tændt), og testlisten ryddes.
update public.app_flags set value = 'true'::jsonb where key = 'notifications_email_enabled';
update public.app_flags set value = '[]'::jsonb where key = 'notifications_test_users';
