-- Pr. allergen: hvor følsom brugeren er. Tom/mangler = "strict" (spor flagges, som hidtil).
-- "direct_only" = reagerer kun på direkte indhold; spor flagges ikke (vises som grå info).
-- Format: {"maelkeallergi":"direct_only"}. Nøglerne er allergen-id'er fra ALLERGENS.
alter table public.users add column if not exists allergen_levels jsonb not null default '{}'::jsonb;
alter table public.family_members add column if not exists allergen_levels jsonb not null default '{}'::jsonb;

alter table public.users add constraint users_allergen_levels_object check (jsonb_typeof(allergen_levels) = 'object');
alter table public.family_members add constraint family_members_allergen_levels_object check (jsonb_typeof(allergen_levels) = 'object');
