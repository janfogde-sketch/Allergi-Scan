-- Databaseplads (to do e1df3ff5, 8. okt. 2026). Databasen fyldte 220 MB; ca. 100 MB var døde rester og ubrugte tabeller.
-- Ingen backup-tabeller, der skal beholdes, røres (removed_image_backup_20261005, products_allergen_backup_20261006,
-- products_allergen_backup_20261007b, products_unknown_flags_backup_20261007, base64_image_backup_20261006, G1-backups,
-- EAN-oprydningens kopi, products_backup, knowledge_base_backup_20260930 m.fl.).

-- 1) De gamle allergen-tabeller bruges ikke længere af appen eller edge-funktionerne (#612): ingen funktion, visning
--    eller fremmednøgle peger på dem. Rækkerne findes allerede som products.allergen_flags / products.ingredients_text.
drop table if exists public.allergen_flags;
drop table if exists public.ingredients;

-- 2) Forskelstabellen fra den store genanalyse (20 MB) er brugt og gennemgået; produkternes tidligere værdier ligger
--    i products_allergen_backup_20261006 (beholdes). Tabellen selv beholdes tom, fordi funktionen allergen-reanalyze
--    skriver til den ved næste kørsel.
truncate table public.allergen_reanalysis_diff_20261006;

-- 3) Døde rester: products (efter ca. 175.000 opdateringer), submissions og feedback_tickets (store billedfelter, der er
--    tømt eller slettet, men stadig fylder). CLUSTER skriver tabellen om uden hullerne (som VACUUM FULL, men kan køre
--    i en transaktion). Tabellerne er låst i et øjeblik, mens det kører.
cluster public.products using products_pkey;
cluster public.submissions using submissions_pkey;
cluster public.feedback_tickets using feedback_tickets_pkey;
analyze public.products;
