-- Stram rettigheder for anon (ikke logget ind) og ubrugte rettigheder
-- (arkitektur-audit A5, 30. sept. 2026).
--
-- RLS stoppede allerede anon på disse tabeller, men anon havde stadig
-- fulde tabelrettigheder, så én forkert policy ville åbne dem. Nu er
-- rettighederne et ekstra lag.
--
-- Tjekket mod appens brug uden login: velkomst/login/onboarding trin 1,
-- invite.html (kun RPC'en get_invite_preview), preview-tilstanden (læser
-- produkter, viden og opskrifter). Edge functions bruger kun anon-nøglen
-- til auth.getUser() og service_role til tabeller.

-- 1) Tabeller der altid kræver login: ingen rettigheder til anon.
revoke all on
  public.users,
  public.families,
  public.family_invites,
  public.family_members,
  public.family_memberships,
  public.favorites,
  public.push_tokens,
  public.revision_log,
  public.scan_history,
  public.shopping_list_access,
  public.shopping_list_items,
  public.shopping_lists,
  public.submissions,
  public.user_allergens
from anon;

-- 2) Offentligt læsbare opslagsdata: anon må kun læse.
revoke insert, update, delete on
  public.allergen_flags,
  public.custom_allergens,
  public.ingredients,
  public.plans,
  public.products,
  public.recipe_ingredients,
  public.recipes
from anon;

-- 3) feedback_tickets: anon skal kun kunne oprette (indtil den direkte
--    INSERT lukkes helt, se supabase/pending/feedback_close_direct_insert.sql).
revoke select, update, delete on public.feedback_tickets from anon;

-- 4) TRUNCATE går uden om RLS, og TRIGGER/REFERENCES/MAINTAIN bruges ikke
--    af API'et. Fjern dem fra begge API-roller på alle tabeller i public.
revoke truncate, trigger, references, maintain on all tables in schema public from anon, authenticated;

-- 5) Storage: politikken "Service role kan uploade" gjaldt i praksis for
--    alle (også uden login) i hele product-images. Service role går uden
--    om RLS og har ikke brug for den. Det eneste klient-upload er
--    opskriftsbilleder (RecipesScreen.jsx, med brugerens login, stien
--    recipes/...), så politikken erstattes af en snævrere.
drop policy if exists "Service role kan uploade" on storage.objects;
create policy "Brugere kan uploade opskriftsbilleder" on storage.objects as permissive for insert to authenticated
  with check (bucket_id = 'product-images'::text and name like 'recipes/%');
