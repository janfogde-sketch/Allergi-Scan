-- Staging + backup til engangsgenberegning af products.allergen_flags (2. okt. 2026, motorrettelser).
-- Ingen personoplysninger. Tabellen droppes, når rettelsen er verificeret (senest 1. nov. 2026).
create table if not exists public.allergen_flags_fix_20261002 (
  id uuid primary key,
  patch jsonb not null,
  old_flags jsonb,
  applied_at timestamptz
);
alter table public.allergen_flags_fix_20261002 enable row level security;
revoke all on public.allergen_flags_fix_20261002 from anon, authenticated, public;
comment on table public.allergen_flags_fix_20261002 is 'Engangs-backup/staging for allergen_flags-genberegning 2. okt. 2026. Kan droppes efter verifikation.';
