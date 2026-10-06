-- 6. okt. 2026: nye tabeller fik ingen rettigheder til service_role (edge-funktionen allergen-reanalyze svarede 500).
-- Kun de to nye genanalyse-tabeller; ingen andre tabeller eller roller berøres.
grant select, insert, update, delete on public.allergen_reanalysis_diff_20261006 to service_role;
grant select on public.products_allergen_backup_20261006 to service_role;
