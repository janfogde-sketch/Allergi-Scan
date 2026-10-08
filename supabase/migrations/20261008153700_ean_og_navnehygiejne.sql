-- EAN- og navnehygiejne (to do d6638639, 8. okt. 2026).
-- 1) Stregkoder: 11- og 12-cifrede koder (UPC uden foranstillet nul) får 13 cifre, så de matcher det, telefonen scanner.
--    Kun koder der bliver et gyldigt GTIN. Butikkernes interne varenumre (4 og 6 cifre) og NEMLIG-numre røres ikke.
-- 2) Dublet: Sriracha findes både som 87666052802 (Bilka, med ingredienser) og 0087666052802 (OFF, uden). Bilka-rækken
--    beholdes og får OFF-billedet; OFF-rækken slettes (ingen scanninger, lister eller rettelser peger på den).
-- 3) Navne: dobbelte/ledende/afsluttende mellemrum ryddes, og NAVNE I VERSALER får normalt skrift.
-- 4) Fremover: trigger der gør det samme ved indsættelse/ændring.
-- Alle ændrede rækker (før-billede) gemmes i products_hygiene_backup_20261008.

create or replace function public.normalize_product_ean(p_ean text)
returns text language sql immutable set search_path = public as $$
  select case
    when p_ean ~ '^\d{11,12}$' and public.is_valid_gtin(lpad(p_ean, 13, '0')) then lpad(p_ean, 13, '0')
    else p_ean
  end
$$;

create or replace function public.clean_product_name(p_name text)
returns text language plpgsql immutable set search_path = public as $$
declare
  v text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  l text;
  a text;
begin
  if v = '' then return p_name; end if;
  -- Kun rene versaler, og ikke et enkelt kort ord (IPA, OST).
  if v = upper(v) and v ~ '[A-ZÆØÅ]{3}' and (v ~ ' ' or length(v) >= 5) then
    l := lower(v);
    l := upper(left(l, 1)) || substr(l, 2);
    foreach a in array array['vsop','xo','bbq','ipa','uht','mm','lbv','vvd','pet','mct','dha','ph'] loop
      l := regexp_replace(l, '(^|[^[:alpha:]])' || a || '($|[^[:alpha:]])', '\1' || upper(a) || '\2', 'gi');
      l := regexp_replace(l, '(^|[^[:alpha:]])' || upper(a) || '($|[^[:alpha:]])', '\1' || upper(a) || '\2', 'g');
    end loop;
    return l;
  end if;
  return v;
end;
$$;

-- Kun triggeren og migrationen skal bruge dem; ikke en del af den åbne API.
revoke execute on function public.normalize_product_ean(text) from public, anon, authenticated;
revoke execute on function public.clean_product_name(text) from public, anon, authenticated;

-- Før-billede af alle rækker der ændres.
create table if not exists public.products_hygiene_backup_20261008 as
select p.*, now() as backed_up_at
from public.products p
where (p.ean ~ '^\d{11,12}$' and public.normalize_product_ean(p.ean) <> p.ean)
   or p.name is distinct from public.clean_product_name(p.name)
   or p.ean = '0087666052802';
alter table public.products_hygiene_backup_20261008 enable row level security;
comment on table public.products_hygiene_backup_20261008 is 'Før-billede af produkter ændret af EAN- og navnehygiejne 8. okt. 2026 (to do d6638639). Kun admin/service-role.';

-- Dublet (Sriracha): flyt billedet til Bilka-rækken, slet OFF-rækken (ingen referencer).
update public.products b
   set image_url = coalesce(o.image_url, b.image_url)
  from public.products o
 where b.ean = '87666052802' and o.ean = '0087666052802' and o.source = 'open_food_facts';
delete from public.products o
 where o.ean = '0087666052802' and o.source = 'open_food_facts'
   and exists (select 1 from public.products b where b.ean = '87666052802')
   and not exists (select 1 from public.scan_history s where s.product_id = o.id)
   and not exists (select 1 from public.shopping_list_items s where s.product_id = o.id)
   and not exists (select 1 from public.revision_log s where s.product_id = o.id)
   and not exists (select 1 from public.products c where c.canonical_ean = o.ean);

-- Stregkoder til 13 cifre.
update public.products p
   set ean = public.normalize_product_ean(p.ean)
 where p.ean ~ '^\d{11,12}$' and public.normalize_product_ean(p.ean) <> p.ean
   and not exists (select 1 from public.products q where q.ean = public.normalize_product_ean(p.ean))
   and not exists (select 1 from public.products c where c.canonical_ean = p.ean);

-- Navne.
update public.products
   set name = public.clean_product_name(name)
 where name is distinct from public.clean_product_name(name);

-- Fremover.
create or replace function public.products_hygiene_trg()
returns trigger language plpgsql set search_path = public as $$
begin
  new.ean := public.normalize_product_ean(new.ean);
  new.name := public.clean_product_name(new.name);
  return new;
end;
$$;
drop trigger if exists products_hygiene on public.products;
create trigger products_hygiene before insert or update of ean, name on public.products
  for each row execute function public.products_hygiene_trg();
