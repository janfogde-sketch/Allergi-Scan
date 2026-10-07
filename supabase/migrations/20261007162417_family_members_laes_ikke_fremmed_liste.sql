-- En fremmed kunne lægge en familieprofil ind i en andens familieliste
-- (user_id = egen id, family_owner_id = en andens id). Nu skal profilen enten
-- ligge i ens egen liste (family_owner_id tom eller egen id) eller i listen hos
-- en man er forbundet med via en accepteret invitation (family_group).
-- Ændrer ingen data; appen opretter profiler uden family_owner_id.
drop policy if exists family_members_insert_combined on public.family_members;
create policy family_members_insert_combined on public.family_members
  for insert to authenticated
  with check (
    (user_id = (select auth.uid()) and (family_owner_id is null or family_owner_id = (select auth.uid())))
    or ((select auth.uid()) in (select family_group(family_members.family_owner_id)))
  );

drop policy if exists family_members_update_combined on public.family_members;
create policy family_members_update_combined on public.family_members
  for update to authenticated
  using (
    (user_id = (select auth.uid()))
    or ((select auth.uid()) in (select family_group(family_members.family_owner_id)))
  )
  with check (
    (user_id = (select auth.uid()) and (family_owner_id is null or family_owner_id = (select auth.uid())))
    or ((select auth.uid()) in (select family_group(family_members.family_owner_id)))
  );
