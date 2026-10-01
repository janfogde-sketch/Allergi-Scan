-- Jans ord 1. okt. 2026: testkontoen er janfogde@gmail.com (har push-abonnementet), ikke jafo.
update public.app_flags set value = '["6a759160-9bde-43bf-8619-e19e454323a5"]'::jsonb where key = 'notifications_test_users';
