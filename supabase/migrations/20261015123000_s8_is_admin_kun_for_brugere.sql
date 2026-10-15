-- S8 trin 1 (15. okt. 2026, to do 9434c834): ikke-loggede (anon) må ikke længere kalde is_admin().
-- Fire læseregler for rollen public kaldte is_admin(), så anon havde brug for at kunne køre den. Reglerne deles nu i
-- en anon-del (kun det offentlige) og en authenticated-del (som før, inkl. admin). Brugere og admin ser det samme som før.
-- recipes/recipe_ingredients beholdes (Jan 13. okt.), men anon kan ikke længere læse dem (appen bruger dem ikke).
-- family_invites: anon så i forvejen intet (auth.uid() er tom), så reglen gælder nu kun authenticated.
-- Bagudkompatibel: Allergi-listen virker stadig for ikke-loggede (godkendte allergener). Ingen data ændres.

-- custom_allergens: anon ser godkendte; brugere ser godkendte, egne og (admin) alle
alter policy "Alle kan læse godkendte allergener" on public.custom_allergens to anon
  using (approved = true);
drop policy if exists "Brugere kan læse godkendte og egne allergener" on public.custom_allergens;
create policy "Brugere kan læse godkendte og egne allergener" on public.custom_allergens as permissive for select to authenticated
  using ((approved = true) or (created_by = (select auth.uid() as uid)) or is_admin((select auth.uid() as uid)));

-- recipes / recipe_ingredients: kun loggede brugere
alter policy recipes_select_combined on public.recipes to authenticated
  using ((status = 'approved'::text) or ((select auth.uid() as uid) = submitted_by) or is_admin((select auth.uid() as uid)));

alter policy recipe_ingredients_select_combined on public.recipe_ingredients to authenticated
  using ((exists (select 1 from recipes where recipes.id = recipe_ingredients.recipe_id and recipes.status = 'approved'::text)) or is_admin((select auth.uid() as uid)));

-- family_invites: kun loggede brugere
alter policy family_invites_select_own on public.family_invites to authenticated
  using (((select auth.uid() as uid) = invited_by) or ((select auth.uid() as uid) = accepted_by) or is_admin((select auth.uid() as uid)));

-- is_admin: kun authenticated og service_role (PUBLIC har ikke adgangen, så revoke fra anon virker; tjekkes i access_rules.sql)
revoke execute on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
