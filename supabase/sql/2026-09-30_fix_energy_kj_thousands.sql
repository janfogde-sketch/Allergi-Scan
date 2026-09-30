-- 30. sept. 2026: energy_kj var gemt med tusindtals-punktum læst som
-- decimal (fx 1.352 i stedet for 1352) på 4.876 produkter (4.581 bilka,
-- 294 open_food_facts, 1 user). Kun rækker hvor kJ*1000 stemmer med
-- kcal*4,184 (±15 %) er rettet — reelt små værdier (light-sodavand,
-- sødemiddel) er urørte. Gamle værdier ligger i products_kj_backup_20260930
-- (RLS slået til, ingen API-adgang). KØRT i produktion; genkør ikke.

create table if not exists public.products_kj_backup_20260930 as
select id, nutrition->'energy_kj' as old_kj from products
where jsonb_typeof(nutrition->'energy_kj')='number'
  and (nutrition->>'energy_kj')::numeric < 10
  and (nutrition->>'energy_kj')::numeric <> trunc((nutrition->>'energy_kj')::numeric)
  and (nutrition->>'energy_kcal')::numeric > 0
  and abs((nutrition->>'energy_kj')::numeric*1000 - (nutrition->>'energy_kcal')::numeric*4.184)
      <= (nutrition->>'energy_kcal')::numeric*4.184*0.15;
alter table public.products_kj_backup_20260930 enable row level security;
revoke all on public.products_kj_backup_20260930 from anon, authenticated;

update products p
set nutrition = jsonb_set(p.nutrition, '{energy_kj}', to_jsonb(round((b.old_kj)::text::numeric * 1000)))
from products_kj_backup_20260930 b where b.id = p.id;

-- Rul tilbage (om nødvendigt):
-- update products p set nutrition = jsonb_set(p.nutrition, '{energy_kj}', b.old_kj)
-- from products_kj_backup_20260930 b where b.id = p.id;
