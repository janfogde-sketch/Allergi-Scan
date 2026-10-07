-- Varer uden ingrediensliste skal stå som "unknown" (ukendt), ikke som tomt/"nej".
-- Rammer kun: ingen ingrediensliste, kvalitet 'low', ikke producent-verificeret,
-- og flag der er tomme ({}) eller kun har false. Alt andet røres ikke.
-- Rollback: gendan allergen_flags fra products_unknown_flags_backup_20261007.

create table if not exists public.products_unknown_flags_backup_20261007 as
select id, allergen_flags, allergen_quality, updated_at
from public.products
where (ingredients_text is null or btrim(ingredients_text) = '')
  and allergen_quality = 'low'
  and coalesce(verified_status, '') <> 'verified' and coalesce(source, '') <> 'producer'
  and (allergen_flags = '{}'::jsonb
       or (allergen_flags::text like '%false%' and allergen_flags::text not like '%"yes"%'
           and allergen_flags::text not like '%"traces"%' and allergen_flags::text not like '%true%'));

alter table public.products_unknown_flags_backup_20261007 enable row level security;

update public.products p
set allergen_flags = jsonb_build_object(
      'aeg','unknown','fisk','unknown','soja','unknown','hvede','unknown','lupin','unknown',
      'sesam','unknown','svovl','unknown','gluten','unknown','sennep','unknown','laktose','unknown',
      'noedder','unknown','selleri','unknown','skaldyr','unknown','bloeddyr','unknown',
      'jordnoedder','unknown','maelkeallergi','unknown')
from public.products_unknown_flags_backup_20261007 b
where b.id = p.id
  and (p.ingredients_text is null or btrim(p.ingredients_text) = '')
  and p.allergen_quality = 'low';
