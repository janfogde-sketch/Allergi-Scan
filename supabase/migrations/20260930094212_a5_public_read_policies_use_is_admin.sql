-- A5 opfølgning (30. sept. 2026): de offentlige læse-politikker tjekkede
-- admin med EXISTS (SELECT ... FROM users), som anon ikke længere må læse
-- efter 20260930094147. Det gav 401 på opskrifter uden login. Skiftet til
-- is_admin() (security definer), som i resten af politikkerne.
drop policy if exists recipes_select_combined on public.recipes;
create policy recipes_select_combined on public.recipes as permissive for select to public
  using ((status = 'approved'::text) or ((select auth.uid() as uid) = submitted_by) or is_admin((select auth.uid() as uid)));

drop policy if exists recipe_ingredients_select_combined on public.recipe_ingredients;
create policy recipe_ingredients_select_combined on public.recipe_ingredients as permissive for select to public
  using ((exists (select 1 from recipes where recipes.id = recipe_ingredients.recipe_id and recipes.status = 'approved'::text)) or is_admin((select auth.uid() as uid)));

drop policy if exists "Alle kan læse godkendte allergener" on public.custom_allergens;
create policy "Alle kan læse godkendte allergener" on public.custom_allergens as permissive for select to public
  using ((approved = true) or (created_by = (select auth.uid() as uid)) or is_admin((select auth.uid() as uid)));
