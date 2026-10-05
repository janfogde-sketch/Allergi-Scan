-- 5. okt. 2026: slet backup-tabellen med de fjernede nemlig/Bilka-billedlinks.
-- Kun produkt-id'erne (uden billedlinks) beholdes til erstatning fra Open Food Facts; tabellen slettes, når den er brugt.
create table if not exists public.image_removed_ids_20261005 as
  select tbl, row_id from public.removed_image_backup_20261005;
alter table public.image_removed_ids_20261005 enable row level security;
comment on table public.image_removed_ids_20261005 is
  'Ids (uden billedlinks) på rækker, hvis nemlig/Bilka-billede blev fjernet 2026-10-05. Bruges til OFF-erstatning; slettes bagefter.';

drop table if exists public.removed_image_backup_20261005;
