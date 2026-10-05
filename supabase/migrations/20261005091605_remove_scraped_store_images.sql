-- 5. okt. 2026: fjern billeder scrapet fra nemlig.com og Bilka (Salling digitalassets).
-- Rækker gemmes i backup-tabellen (RLS slået til, ingen policies) og kan genskabes derfra.
create table public.removed_image_backup_20261005 as
  select 'products'::text as tbl, id::text as row_id, image_url from public.products
   where source = 'nemlig' or image_url like '%sallinggroup.com%'
  union all
  select 'shopping_list_items', id::text, image_url from public.shopping_list_items
   where image_url ~ 'nemlig\.com|sallinggroup\.com';
alter table public.removed_image_backup_20261005 enable row level security;

update public.products set image_url = null
 where source = 'nemlig' or image_url like '%sallinggroup.com%';
update public.shopping_list_items set image_url = null
 where image_url ~ 'nemlig\.com|sallinggroup\.com';
