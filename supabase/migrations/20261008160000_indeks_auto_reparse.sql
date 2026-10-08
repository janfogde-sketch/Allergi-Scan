-- Indeks til den natlige auto-reparse (to do 38d255f9).
-- Forespørgslen vælger de produkter, der skal genanalyseres (kvalitet pending/low, med ingrediensliste),
-- sorteret efter kvalitet og sidste kørsel. Det delvise indeks idx_products_allergen_quality dækkede kun 'pending',
-- så hver kørsel læste hele tabellen (ca. 2,5 s). Det nye indeks dækker præcis den forespørgsel og er lille (kun
-- rækker i køen). idx_products_allergen_quality er derfor overflødigt og fjernes (ingen dublet).
-- Adminsøgningen i products (name/brand/ean) bruger allerede trigram-indeksene og er målt til ca. 0,2 s: intet nyt dér.
create index if not exists idx_products_reparse_queue
  on public.products (allergen_quality, reparsed_at nulls first)
  where allergen_quality in ('pending', 'low') and ingredients_text is not null and ingredients_text <> '';

drop index if exists public.idx_products_allergen_quality;
