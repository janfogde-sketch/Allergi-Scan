-- 6. okt. 2026 (kodegennemgang fase 2, K4): forberedelse til genanalyse af alle produkters allergenflag
-- efter rettelsen af allergenmotoren. Opretter KUN to nye tabeller og tager en backup; ingen produkter ændres.
--  * products_allergen_backup_20261006: kopi af flag, kvalitet, metode og ingrediensliste for alle produkter
--    (tilbagerulning, se nederst). Beholdes, til Jan siger drop.
--  * allergen_reanalysis_diff_20261006: fyldes af edge-funktionen allergen-reanalyze (mode dry_run) med de nye flag
--    pr. produkt; mode apply skriver kun de rækker herfra, der er godkendt.
-- Ingen personoplysninger i tabellerne; RLS er slået til uden politikker (kun service-role/admin via SQL).
create table public.products_allergen_backup_20261006 as
  select id, ean, ingredients_text, allergen_flags, allergen_quality, allergen_source_method, reparsed_at
  from public.products;
alter table public.products_allergen_backup_20261006 add primary key (id);
alter table public.products_allergen_backup_20261006 enable row level security;

create table public.allergen_reanalysis_diff_20261006 (
  product_id uuid primary key,
  ean text,
  old_flags jsonb,
  new_flags jsonb,
  old_quality text,
  old_method text,
  changed boolean not null default false,
  applied_at timestamptz
);
alter table public.allergen_reanalysis_diff_20261006 enable row level security;

-- Tilbagerulning efter en genanalyse:
-- update public.products p set allergen_flags = b.allergen_flags, allergen_quality = b.allergen_quality,
--   allergen_source_method = b.allergen_source_method, reparsed_at = b.reparsed_at
-- from public.products_allergen_backup_20261006 b where b.id = p.id
--   and p.id in (select product_id from public.allergen_reanalysis_diff_20261006 where applied_at is not null);
