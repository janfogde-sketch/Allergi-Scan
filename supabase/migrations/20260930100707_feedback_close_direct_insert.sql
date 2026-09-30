-- Feedback-grænse, del 2 (arkitektur-audit A4, 30. sept. 2026).
--
-- Kørt 30. sept. 2026 efter merge af #411, da eatsafe.dk sendte feedback
-- via edge-functionen.
--
-- Lukker den direkte INSERT, som tillod alle at oprette tickets uden
-- grænse og med en vilkårlig submitted_by. Edge-functionen skriver med
-- service_role og er upåvirket.
drop policy if exists "Alle kan oprette tickets" on public.feedback_tickets;
revoke insert on public.feedback_tickets from anon, authenticated;
