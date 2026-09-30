-- 30. sept. 2026 (arkitektur-audit): tre INSERT-politikker med WITH CHECK
-- (true) for rollen public lod enhver, også uden login, skrive direkte i
-- tabellerne via REST (verificeret: anon kunne indsætte en users-række med
-- role='admin'). Ingen af dem bruges af appen: handle_new_user() kører som
-- SECURITY DEFINER (ejer postgres), og revision_log/submissions skrives kun af
-- edge-funktioner med service-rollen. Kørt som migration
-- drop_open_insert_policies_users_revision_log_submissions; verificeret med
-- en rigtig signup bagefter.
drop policy if exists "Trigger kan oprette brugerprofil" on public.users;
drop policy if exists "System kan oprette i revisionslog" on public.revision_log;
drop policy if exists "Brugere kan oprette indsendelser" on public.submissions;
