-- 17. okt. 2026 (sikkerhedsgennemgang, fund SIK-3 og SIK-4). Strammer skrivereglerne på indkøbslisterne.
-- Appen skriver aldrig shopping_lists/shopping_list_items direkte; det sker via edge-funktionen shopping (service-role,
-- påvirkes ikke af RLS eller kolonnerettigheder). Hullerne kræver derfor direkte REST-kald med egen gyldig JWT.
-- Ingen data ændres, intet slettes. Kun REVOKE, GRANT og ALTER POLICY, så gammel og ny app virker begge.
-- (Delen om family_members fra samme gennemgang ligger i 20261017121500_familieprofiler_kun_egne.sql.)

-- SIK-3 (shopping_lists): opdateringspolitikken har ingen WITH CHECK, og et familiemedlem med adgang til en
-- familieliste kunne sætte owner_id til sig selv (overtage listen) eller ændre delekoden (share_link) direkte via REST.
-- Rettelse: appens rolle må kun ændre navn, delingstype og updated_at; ejer, delekode og id kan kun ændres af
-- edge-funktionen (service-role). Politikken er uændret.
revoke update on table public.shopping_lists from authenticated;
grant update (name, type, updated_at) on table public.shopping_lists to authenticated;

-- SIK-4 (shopping_list_items): indsættelse krævede ikke added_by = mig, så en med skriveadgang kunne lægge varer ind
-- "fra" en anden person (bruges i besked-teksten "X har tilføjet ..."). Samme betingelse som før + added_by = mig.
alter policy shopping_list_items_insert_combined on public.shopping_list_items
  with check (
    added_by = (select auth.uid())
    and (
      exists (
        select 1 from public.shopping_lists
        where shopping_lists.id = shopping_list_items.list_id
          and (shopping_lists.owner_id = (select auth.uid())
               or exists (select 1 from public.shopping_list_access
                          where shopping_list_access.list_id = shopping_lists.id
                            and shopping_list_access.user_id = (select auth.uid())
                            and shopping_list_access.permission = 'edit'))
      )
      or exists (
        select 1 from public.shopping_lists sl
        where sl.id = shopping_list_items.list_id
          and sl.type = 'family'
          and (select auth.uid()) in (select public.family_group(sl.owner_id))
      )
    )
  );
