-- 30. sept. 2026: Opskrifter sat på pause (Bjørns beslutning, "Slet helt").
-- Kørt direkte mod produktion via execute_sql (dataændring, ingen skema-
-- ændring, derfor ikke en migration). Ingen backup blev taget.
-- Resultat: 629 opskrifter slettet (627 approved + 2 rejected), og
-- 13.182 rækker i recipe_ingredients fulgte med via ON DELETE CASCADE.
-- Tabellerne og deres politikker er uændrede, så opskrifter kan
-- importeres igen senere. Appen viser "Siden er under udvikling"
-- (RECIPES_ENABLED = false i src/RecipesScreen.jsx).

delete from recipes;
