-- custom_allergens.created_by pegede på en bruger uden fremmednøgle, så kontosletning efterlod brugerens id.
-- Nu nulstilles den ved sletning (rækken er et ordforslag, ikke brugerens egne data). Fundet af sletningstesten
-- (supabase/tests/account_deletion.sql, opgave "Fase 7: test af kontosletning").
update public.custom_allergens set created_by = null
  where created_by is not null and not exists (select 1 from public.users u where u.id = custom_allergens.created_by);

alter table public.custom_allergens
  add constraint custom_allergens_created_by_fkey foreign key (created_by) references public.users(id) on delete set null;
