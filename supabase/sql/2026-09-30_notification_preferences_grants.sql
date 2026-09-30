-- 30. sept. 2026: notification_preferences manglede tabel-rettigheder for
-- authenticated (kun REFERENCES/TRIGGER/TRUNCATE). Appens GET/POST fik 403,
-- så ingen brugers notifikationsvalg er nogensinde blevet gemt (0 rækker).
-- RLS-politikkerne (*_own) begrænser allerede hver bruger til egne rækker.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
