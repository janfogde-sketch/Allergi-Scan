-- Nødrettelse 16. okt. 2026: intet produkt kunne gemmes eller omdøbes siden 8. okt.
-- Triggeren products_hygiene_trg (20261008153700_ean_og_navnehygiejne.sql) kalder normalize_product_ean og clean_product_name,
-- men execute på dem blev fjernet fra public, anon og authenticated, og dermed også fra service_role (som kun havde den via public).
-- Triggeren kørte med den kaldende rolles rettigheder, så indsættelse/ændring af ean eller navn gav
-- "permission denied for function normalize_product_ean" (bl.a. godkendelse af indsendelser i admin og nye produkter fra Open Food Facts).
-- Rettelse: triggeren kører med ejerens rettigheder (security definer, fast search_path). Hjælpefunktionerne forbliver lukket udefra.
-- Ingen data ændres.

alter function public.products_hygiene_trg() security definer;
alter function public.products_hygiene_trg() set search_path = public;
revoke execute on function public.products_hygiene_trg() from public, anon, authenticated;
