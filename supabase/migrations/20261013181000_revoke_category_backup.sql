-- Sikkerhedsrettelse: backup-tabellen fra kategoriseringen (20261013150000) manglede "revoke" til anon/authenticated,
-- hvilket DB-testen access_rules.sql fanger. Samme mønster som øvrige backup-tabeller.
revoke all on public.products_category_backup_20261013 from anon, authenticated;
