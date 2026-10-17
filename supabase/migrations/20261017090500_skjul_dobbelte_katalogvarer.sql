-- Skjul dobbelte katalogvarer fra søgningen (Jan ja 16. okt. 2026, tråden "Data: dobbelte varer med ES-kode").
-- Katalogvarer med intern kode (ES-000001 …) står tit to gange: én gang som katalogvare og én gang med rigtig stregkode,
-- med samme navn og mærke. Regler pr. katalogvare (sammenlignet med alle stregkodevarer med samme navn og mærke):
--   1) Siger det samme om allergener, eller 2) stregkodevaren advarer mest: katalogvaren skjules fra søgningen.
--   3) Katalogvaren advarer mere, men en stregkodevare har samme ingrediensliste: stregkodevaren får katalogvarens
--      strengere flag (kun opad, aldrig ned), og katalogvaren skjules.
--   4) og 5) Katalogvaren advarer mere, og ingredienslisten er en anden eller mangler hos stregkodevaren: begge bliver stående.
-- Ingen advarsel ("ja"/"spor"/"ukendt") går tabt: en skjult katalogvare har altid en synlig tvilling, der advarer mindst lige så meget.
-- Intet slettes. Skjulte varer kan stadig åbnes direkte (historik, favoritter) og ses i admin; de kommer bare ikke i søgningen
-- eller som sikre alternativer. Tilbagerulning: products_es_dubletter_backup_20261016 (RLS, ingen brugeradgang).

alter table public.products add column if not exists search_hidden boolean not null default false;
comment on column public.products.search_hidden is
  'Skjult fra søgning og sikre alternativer (dublet af en vare med stregkode). Varen kan stadig åbnes direkte.';

create table if not exists public.products_es_dubletter_backup_20261016 (
  product_id uuid not null,
  ean text,
  col text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);
alter table public.products_es_dubletter_backup_20261016 enable row level security;
revoke all on public.products_es_dubletter_backup_20261016 from public, anon, authenticated;

insert into public.backup_retention (table_name, delete_after, note)
values ('products_es_dubletter_backup_20261016', '2026-12-16', 'Kopi fra skjulte dobbelte katalogvarer (60 dage)')
on conflict (table_name) do nothing;

-- Par: katalogvare (ES-kode) og stregkodevare med samme navn og mærke ---------------------------------------------------
create temp table es_par on commit drop as
select es.id as es_id, r.id as r_id, es.allergen_flags as ef, r.allergen_flags as rf,
       lower(regexp_replace(coalesce(es.ingredients_text, ''), '\s+', ' ', 'g')) <> ''
         and lower(regexp_replace(coalesce(es.ingredients_text, ''), '\s+', ' ', 'g'))
           = lower(regexp_replace(coalesce(r.ingredients_text, ''), '\s+', ' ', 'g')) as same_ingr
from public.products es
join public.products r
  on lower(trim(r.name)) = lower(trim(es.name))
 and lower(coalesce(trim(r.brand), '')) = lower(coalesce(trim(es.brand), ''))
where es.ean like 'ES-%'
  and r.ean ~ '^[0-9]{8,14}$'
  and not r.search_hidden;

-- Advarer katalogvaren mere end stregkodevaren for mindst ét allergen? (manglende flag tæller lavest)
alter table es_par add column es_strengere boolean;
update es_par set es_strengere = exists (
  select 1 from jsonb_object_keys(coalesce(ef, '{}'::jsonb) || coalesce(rf, '{}'::jsonb)) k
  where (case when ef ->> k is null then -1 else public.allergen_risk_rank(ef ->> k) end)
      > (case when rf ->> k is null then -1 else public.allergen_risk_rank(rf ->> k) end)
);

-- Regel 3: løft stregkodevaren med samme ingrediensliste (kun opad) ------------------------------------------------------
create temp table loeft on commit drop as
select p.r_id,
       r.allergen_flags as gammel,
       coalesce(r.allergen_flags, '{}'::jsonb) || (
         select coalesce(jsonb_object_agg(k, e.ef -> k), '{}'::jsonb)
         from es_par e, jsonb_object_keys(coalesce(e.ef, '{}'::jsonb)) k
         where e.r_id = p.r_id and e.same_ingr and e.es_strengere
           and public.allergen_risk_rank(e.ef ->> k)
             > (case when r.allergen_flags ->> k is null then -1 else public.allergen_risk_rank(r.allergen_flags ->> k) end)
           -- ved flere katalogvarer på samme stregkodevare vinder den strengeste værdi
           and public.allergen_risk_rank(e.ef ->> k) = (
             select max(public.allergen_risk_rank(e2.ef ->> k)) from es_par e2
             where e2.r_id = p.r_id and e2.same_ingr and e2.es_strengere)
       ) as ny
from (select distinct r_id from es_par where same_ingr and es_strengere) p
join public.products r on r.id = p.r_id;

insert into public.products_es_dubletter_backup_20261016 (product_id, ean, col, old_value, new_value)
select l.r_id, r.ean, 'allergen_flags', l.gammel, l.ny
from loeft l join public.products r on r.id = l.r_id
where l.ny is distinct from l.gammel;

update public.products r set allergen_flags = l.ny
from loeft l
where r.id = l.r_id and l.ny is distinct from l.gammel;

-- Regel 1-3: skjul katalogvaren -----------------------------------------------------------------------------------------
create temp table skjul on commit drop as
select es_id from es_par
group by es_id
having bool_and(not es_strengere) or bool_or(same_ingr);

insert into public.products_es_dubletter_backup_20261016 (product_id, ean, col, old_value, new_value)
select p.id, p.ean, 'search_hidden', to_jsonb(p.search_hidden), 'true'::jsonb
from public.products p join skjul s on s.es_id = p.id
where not p.search_hidden;

update public.products p set search_hidden = true
from skjul s
where p.id = s.es_id and not p.search_hidden;

-- Søgningen springer skjulte varer over (ellers uændret fra 14. okt.) -------------------------------------------------
create or replace function public.search_products(
  p_q_norm text,
  p_user_id uuid default null,
  p_offset integer default 0,
  p_limit integer default 25
) returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_words text[];
  v_pats text[];
  v_false text[] := array['ægte', 'ægtefælle', 'ægteskab', 'ægtemand', 'ægtepar'];
  v_result jsonb;
begin
  v_words := array(select w from unnest(string_to_array(coalesce(p_q_norm, ''), ' ')) w where w <> '');
  if cardinality(v_words) = 0 then
    return jsonb_build_object('products', '[]'::jsonb, 'total', 0, 'hasMore', false);
  end if;
  v_pats := array(select '%' || w || '%' from unnest(v_words) w);

  with cand as materialized (
    select p.id, p.ean, p.name, p.brand, p.category, p.subcategory, p.image_url, p.verified_status,
           p.allergen_flags, p.tags, i.nw, i.bw, i.cw,
           char_length(coalesce(p.ingredients_text, '')) > 10 as has_ingr
    from product_search i join products p on p.id = i.id
    where i.hay ilike any (v_pats)
      and not p.search_hidden
  ),
  words as materialized (
    select c.*, array_to_string(c.nw, ' ') as n_name, array_to_string(c.bw, ' ') as n_brand
    from cand c
  ),
  scored as (
    select w.*, ph.phrase, wsc.ws, wsc.anyhit, wsc.allhit
    from words w
    cross join lateral (
      select case when w.n_name = p_q_norm then 200
                  when w.n_brand = p_q_norm then 150
                  when starts_with(w.n_name, p_q_norm || ' ') then 120
                  when starts_with(w.n_brand, p_q_norm || ' ') then 90
                  when starts_with(w.n_name, p_q_norm) and split_part(w.n_name, ' ', 1) <> all (v_false) then 20
                  else 0 end as phrase
    ) ph
    cross join lateral (
      select coalesce(sum(h.ne::int * 35 + h.np::int * 8 + h.be::int * 20 + h.bp::int * 4 + h.ce::int * 5 + h.cp::int * 2 + h.ns::int * 3), 0) as ws,
             coalesce(bool_or(h.ne or h.np or h.be or h.bp or h.ce or h.cp), false) as anyhit,
             coalesce(bool_and(h.ne or h.np or h.be or h.bp or h.ce or h.cp), false) as allhit
      from unnest(v_words) q
      cross join lateral (
        select nn.ne, nn.np, bb.be, bb.bp, cc.ce, cc.cp, nn.ns
        from (select coalesce(bool_or(x = q), false) as ne,
                     coalesce(bool_or(x <> q and x <> all (v_false) and (starts_with(x, q) or right(x, length(q)) = q)), false) as np,
                     coalesce(bool_or(starts_with(x, q) and x <> all (v_false)), false) as ns
              from unnest(w.nw) x) nn,
             (select coalesce(bool_or(x = q), false) as be,
                     coalesce(bool_or(x <> q and (starts_with(x, q) or right(x, length(q)) = q)), false) as bp
              from unnest(w.bw) x) bb,
             (select coalesce(bool_or(x = q), false) as ce,
                     coalesce(bool_or(x <> q and (starts_with(x, q) or right(x, length(q)) = q)), false) as cp
              from unnest(w.cw) x) cc
      ) h
    ) wsc
    where ph.phrase > 0 or wsc.anyhit
  ),
  ranked as (
    select s.id, s.ean, s.name, s.brand, s.category, s.subcategory, s.image_url, s.verified_status, s.allergen_flags, s.tags,
      ((s.phrase + s.ws + case when s.allhit and cardinality(v_words) > 1 then 50 else 0 end) * 4
        + case when char_length(coalesce(s.name, '')) < 20 then 10 when char_length(coalesce(s.name, '')) < 35 then 5 else 0 end
        + case s.verified_status when 'verified' then 20 when 'partial' then 10 else 0 end
        + case when s.allergen_flags is not null and jsonb_typeof(s.allergen_flags) = 'object' and s.allergen_flags <> '{}'::jsonb then 15 else 0 end
        + case when s.has_ingr then 10 else 0 end
        + case when coalesce(s.image_url, '') <> '' then 5 else 0 end
        + least(coalesce(pop.cnt, 0), 25) * 6
        + least(coalesce(per.cnt, 0), 10) * 20
      ) as score
    from scored s
    left join (select ean, max(select_count) as cnt from search_query_popularity where query_norm = p_q_norm group by ean) pop on pop.ean = s.ean
    left join (select ean, count(*) as cnt from search_selections where p_user_id is not null and user_id = p_user_id and query_norm = p_q_norm group by ean) per on per.ean = s.ean
  ),
  page as (
    select r.*, count(*) over () as total
    from ranked r
    order by r.score desc, r.name collate "da-DK-x-icu", r.id
    offset greatest(p_offset, 0) limit p_limit
  )
  select jsonb_build_object(
           'products', coalesce(jsonb_agg(jsonb_build_object(
               'id', g.id, 'ean', g.ean, 'name', g.name, 'brand', g.brand, 'category', g.category,
               'subcategory', g.subcategory, 'image_url', g.image_url, 'verified_status', g.verified_status,
               'allergen_flags', g.allergen_flags, 'tags', g.tags, 'ingredients_text', pr.ingredients_text
             ) order by g.score desc, g.name collate "da-DK-x-icu", g.id), '[]'::jsonb),
           'total', coalesce(max(g.total), 0),
           'hasMore', coalesce(max(g.total), 0) > greatest(p_offset, 0) + p_limit)
  into v_result
  from page g join products pr on pr.id = g.id;

  return v_result;
end;
$$;

revoke execute on function public.search_products(text, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.search_products(text, uuid, integer, integer) to service_role;
