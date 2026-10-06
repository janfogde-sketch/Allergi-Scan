-- 6. okt. 2026 (G1): tabel til gennemgang af de nedgange, som genanalysen bevidst ikke skriver (ja/spor -> nej).
-- Fyldes af edge-funktionen allergen-reanalyze (mode dry_run_down); rører IKKE products. Ingen personoplysninger.
-- RLS er slået til uden politikker (kun service-role/admin via SQL). Rækkerne gennemgås enkeltvis, og kun godkendte
-- nedgange skrives bagefter (egen tilstand, kræver Jans særskilte ja).
create table public.allergen_reanalysis_down_20261006 (
  product_id uuid primary key,
  ean text,
  ingredients_text text,
  old_flags jsonb,
  new_flags jsonb,
  down_allergens text[] not null default '{}',
  old_method text,
  decision text,
  applied_at timestamptz
);
alter table public.allergen_reanalysis_down_20261006 enable row level security;
grant select, insert, update, delete on public.allergen_reanalysis_down_20261006 to service_role;
