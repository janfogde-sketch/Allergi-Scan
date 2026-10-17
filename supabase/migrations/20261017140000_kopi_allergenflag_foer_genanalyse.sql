-- Kopi af alle allergenflag før genanalysen med den nye allergenmotor (PR 910, Jans ja 17. okt. 2026).
-- Genanalysen hæver kun (ca. 408 felter på 372 varer, målt 17. okt.); kopien gør det muligt at se og rulle hver ændring tilbage.
-- Køres ved merge til main, dvs. lige før genanalysen. Ingen data ændres her.
-- RLS uden politikker og ingen brugeradgang; slettes automatisk 16. nov. 2026 (backup_retention).

create table if not exists public.products_allergen_backup_20261017 (
  product_id uuid primary key,
  ean text,
  allergen_flags jsonb,
  allergen_quality text,
  allergen_source_method text,
  created_at timestamptz not null default now()
);
alter table public.products_allergen_backup_20261017 enable row level security;
revoke all on public.products_allergen_backup_20261017 from public, anon, authenticated;

insert into public.products_allergen_backup_20261017 (product_id, ean, allergen_flags, allergen_quality, allergen_source_method)
select id, ean, allergen_flags, allergen_quality, allergen_source_method
from public.products
where ingredients_text is not null and ingredients_text <> ''
on conflict (product_id) do nothing;

insert into public.backup_retention (table_name, delete_after, note)
values ('products_allergen_backup_20261017', '2026-11-16', 'Allergenflag før genanalyse med ny motor (30 dage)')
on conflict (table_name) do nothing;
