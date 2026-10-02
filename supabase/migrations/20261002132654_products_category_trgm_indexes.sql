-- Søgningen (edge-funktionen search) matcher med ilike på name, brand, category og subcategory.
-- name/brand havde trigram-indeks, category/subcategory ikke, så OR-søgningen læste hele tabellen (ca. 1,2 s).
create index if not exists products_category_trgm_idx on public.products using gin (category extensions.gin_trgm_ops);
create index if not exists products_subcategory_trgm_idx on public.products using gin (subcategory extensions.gin_trgm_ops);
