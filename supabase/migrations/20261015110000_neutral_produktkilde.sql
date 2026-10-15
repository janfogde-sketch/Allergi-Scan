-- Neutral produktkilde (Jan ja 15. okt. 2026; plan 15. okt. 2026 i projektmappen, del b og c).
-- Appen må ingen steder henvise til de butikker, varekatalogerne stammer fra, heller ikke i data, som kan hentes teknisk.
-- 1) Kilden på importerede katalogvarer bliver den neutrale værdi 'katalog'.
-- 2) Interne butiksnumre (koder, der ikke er stregkoder) får nye numre 'ES-000001' osv. i tilfældig rækkefølge, også i kopierne
--    (favoritter, historik, indkøbsliste, søgelog, notifikationslog). Koblingen gammel -> ny gemmes kun i sikkerhedskopien.
-- 3) Butikstekst i et produktnavn og fem ingredienstekster fjernes. Mærker beholdes (Jans valg).
-- 4) En engangsfunktion fra 13. okt. fjernes.
-- 5) Vagt: nye eller ændrede varer kan ikke få butikskilden, butikskoder eller billeder fra butikkernes servere.
-- Intet slettes; alt kan rulles tilbage fra kildeoprydning_backup_20261015 (RLS, ingen brugeradgang, slettes 14. nov. 2026).

create table if not exists public.kildeoprydning_backup_20261015 (
  product_id uuid,
  col text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);
alter table public.kildeoprydning_backup_20261015 enable row level security;
revoke all on public.kildeoprydning_backup_20261015 from public, anon, authenticated;

insert into public.backup_retention (table_name, delete_after, note)
values ('kildeoprydning_backup_20261015', '2026-11-14', 'Kopi fra neutral produktkilde (30 dage)')
on conflict (table_name) do nothing;

-- 2) Nye numre -----------------------------------------------------------------------------------------------------------
create temp table kode_map as
select p.id, p.ean as old_ean, 'ES-' || lpad((row_number() over (order by md5(p.id::text || clock_timestamp()::text)))::text, 6, '0') as new_ean
from public.products p
where p.source in ('bilka', 'nemlig')
  and p.ean !~ '^(\d{8}|\d{12,14})$';

insert into public.kildeoprydning_backup_20261015 (product_id, col, old_value, new_value)
select id, 'ean', old_ean, new_ean from kode_map;

update public.products p set ean = m.new_ean from kode_map m where p.id = m.id;
update public.favorites f set ean = m.new_ean,
  product_snapshot = jsonb_set(f.product_snapshot, '{code}', to_jsonb(m.new_ean))
from kode_map m where f.ean = m.old_ean;
update public.scan_history s set ean_scanned = m.new_ean from kode_map m where s.ean_scanned = m.old_ean;
update public.shopping_list_items s set ean = m.new_ean from kode_map m where s.ean = m.old_ean;
update public.search_selections s set ean = m.new_ean from kode_map m where s.ean = m.old_ean;
update public.search_query_popularity s set ean = m.new_ean from kode_map m where s.ean = m.old_ean;
update public.missing_ean_log s set ean = m.new_ean from kode_map m where s.ean = m.old_ean;
update public.submissions s set ean = m.new_ean from kode_map m where s.ean = m.old_ean;
update public.notification_events e set payload = jsonb_set(e.payload, '{ean}', to_jsonb(m.new_ean))
from kode_map m where e.payload ->> 'ean' = m.old_ean;

-- 1) Neutral kilde ---------------------------------------------------------------------------------------------------------
insert into public.kildeoprydning_backup_20261015 (product_id, col, old_value, new_value)
select id, 'source', source, 'katalog' from public.products where source in ('bilka', 'nemlig');
update public.products set source = 'katalog' where source in ('bilka', 'nemlig');
update public.favorites set product_snapshot = jsonb_set(product_snapshot, '{source}', '"katalog"')
where product_snapshot ->> 'source' in ('bilka', 'nemlig');

-- 3) Butikstekst i navn og ingredienser --------------------------------------------------------------------------------------
create temp table tekst_ret as
select id, 'name'::text as col, name as old_value, 'Chokolade'::text as new_value
from public.products where name = 'Chokolade fra nemlig.com'
union all
select id, 'ingredients_text', ingredients_text,
  btrim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(ingredients_text,
    '\s*-?\s*Salling ?Grou(p)?\M', '', 'gi'),
    'https?://(www\.)?nemlig\.com/\S*>', '', 'gi'),
    ' for nemlig\.com', '', 'gi'),
    '\s*Lagkagehuset leverer dagligt friskbagt brød til Nemligs kunder\. Se her hele udvalget af brød og kager fra Lagkagehuset\.', '', 'g'))
from public.products
where ingredients_text ~* 'salling ?grou|nemlig\.com|nemligs kunder';

insert into public.kildeoprydning_backup_20261015 (product_id, col, old_value, new_value)
select id, col, old_value, new_value from tekst_ret where old_value is distinct from new_value;
update public.products p set name = t.new_value from tekst_ret t where p.id = t.id and t.col = 'name';
update public.products p set ingredients_text = t.new_value from tekst_ret t
where p.id = t.id and t.col = 'ingredients_text' and t.old_value is distinct from t.new_value;

drop table kode_map;
drop table tekst_ret;

-- 4) Engangsfunktion -------------------------------------------------------------------------------------------------------
drop function if exists public.nutrition_nemlig_candidates(int);

-- 5) Vagt ------------------------------------------------------------------------------------------------------------------
create or replace function public.products_kilde_vagt()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.source in ('bilka', 'nemlig')
     or new.ean ~* '^nemlig-'
     or coalesce(new.image_url, '') ~* '(nemlig\.com|sallinggroup\.|bilka\.dk|bilkatogo\.dk|foetex\.dk|netto\.dk)'
     or coalesce(new.label_image_url, '') ~* '(nemlig\.com|sallinggroup\.|bilka\.dk|bilkatogo\.dk|foetex\.dk|netto\.dk)' then
    raise exception 'Produktdata fra denne kilde må ikke gemmes' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function public.products_kilde_vagt() from public, anon, authenticated;

drop trigger if exists products_kilde_vagt on public.products;
create trigger products_kilde_vagt
  before insert or update of source, ean, image_url, label_image_url on public.products
  for each row execute function public.products_kilde_vagt();
