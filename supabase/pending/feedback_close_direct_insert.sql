-- Feedback-grænse, del 2 (arkitektur-audit A4, 30. sept. 2026).
--
-- KØRES FØRST EFTER MERGE TIL MAIN, når eatsafe.dk sender feedback via
-- edge-functionen feedback. Før det ville feedback fra den gamle app-
-- version i produktion fejle. Kør med apply_migration (navn
-- feedback_close_direct_insert) og flyt filen til supabase/migrations/
-- med den version, list_migrations viser.
--
-- Lukker den direkte INSERT, som tillod alle at oprette tickets uden
-- grænse og med en vilkårlig submitted_by. Edge-functionen skriver med
-- service_role og er upåvirket.
drop policy if exists "Alle kan oprette tickets" on public.feedback_tickets;
revoke insert on public.feedback_tickets from anon, authenticated;
