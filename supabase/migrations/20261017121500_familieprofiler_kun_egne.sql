-- 17. okt. 2026 (sikkerhedsgennemgang, fund SIK-1). Strammer skrivereglerne for familieprofiler (family_members).
-- Før: indsæt/ret/slet tillod "kalderen er i family_group(family_owner_id)". Da family_group(mig) altid indeholder mig selv,
-- kunne enhver logget ind bruger indsætte en profil (med allergier) med user_id = en ANDEN konto og family_owner_id = sig selv,
-- så den dukkede op i den andens familie. Forbundne voksne kunne også rette/slette hinandens profiler, hvor family_owner_id var sat.
-- Nu: man skriver kun profiler, man selv ejer (user_id = mig, eller user_id tom og family_owner_id = mig).
-- Bagudkompatibel: appen (src/useFamily.js) skriver altid med user_id = mig og uden family_owner_id; edge-funktionen family
-- (service-role) og admin-funktionerne (security definer) påvirkes ikke. Læsereglen er uændret. Ingen data ændres, intet slettes.
-- Shopping-reglerne fra samme gennemgang (SIK-3, SIK-4) er ikke med her.
alter policy family_members_insert_combined on public.family_members
  with check (
    (user_id = (select auth.uid()) or (user_id is null and family_owner_id = (select auth.uid())))
    and (family_owner_id is null or family_owner_id = (select auth.uid()))
  );

alter policy family_members_update_combined on public.family_members
  using (user_id = (select auth.uid()) or family_owner_id = (select auth.uid()))
  with check (
    (user_id = (select auth.uid()) or (user_id is null and family_owner_id = (select auth.uid())))
    and (family_owner_id is null or family_owner_id = (select auth.uid()))
  );

alter policy family_members_delete_combined on public.family_members
  using (user_id = (select auth.uid()) or family_owner_id = (select auth.uid()));
