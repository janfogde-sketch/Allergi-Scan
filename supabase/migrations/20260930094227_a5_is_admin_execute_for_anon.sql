-- Offentlige læse-politikker (recipes, recipe_ingredients, custom_allergens)
-- kalder is_admin(); anon skal kunne evaluere dem. is_admin() returnerer
-- altid false for anon (auth.uid() er null), så det afslører intet.
grant execute on function public.is_admin(uuid) to anon;
