-- Ny version af search_products: cand/words er MATERIALIZED, så de normaliserede ordlister beregnes én gang pr. produkt
-- (uden det blev regex-udtrykkene gentaget pr. brug: 1250 ms -> ca. 40-190 ms). Popularitet/personlig boost som joins.
-- Søgning i SQL: matchning, scoring og sideinddeling sker i databasen, så kun én side (25 rækker)
-- sendes til edge-funktionen `search` i stedet for op til 400 rækker med ingredienslister.
-- Scoringen er en tro kopi af den tidligere TypeScript-logik (ordmatch, kvalitet, popularitet, personlig boost).
-- Kun service_role må kalde den: edge-funktionen verificerer brugeren og sender p_user_id.
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
  v_result jsonb;
begin
  v_words := array(select w from unnest(string_to_array(coalesce(p_q_norm, ''), ' ')) w where w <> '');
  if cardinality(v_words) = 0 then
    return jsonb_build_object('products', '[]'::jsonb, 'total', 0, 'hasMore', false);
  end if;
  v_pats := array(select '%' || w || '%' from unnest(v_words) w);

  with cand as materialized (
    select p.id, p.ean, p.name, p.brand, p.category, p.subcategory, p.image_url, p.verified_status,
           p.allergen_flags, p.tags,
           string_to_array(trim(regexp_replace(regexp_replace(regexp_replace(lower(coalesce(p.name, '')), '[-_&]', ' ', 'g'), '[^a-zæøå0-9 ]', '', 'g'), '\s+', ' ', 'g')), ' ') as nw,
           string_to_array(trim(regexp_replace(regexp_replace(regexp_replace(lower(coalesce(p.brand, '')), '[-_&]', ' ', 'g'), '[^a-zæøå0-9 ]', '', 'g'), '\s+', ' ', 'g')), ' ') as bw,
           string_to_array(trim(regexp_replace(regexp_replace(regexp_replace(lower(coalesce(p.category, '') || ' ' || coalesce(p.subcategory, '')), '[-_&]', ' ', 'g'), '[^a-zæøå0-9 ]', '', 'g'), '\s+', ' ', 'g')), ' ') as cw,
           char_length(coalesce(p.ingredients_text, '')) > 10 as has_ingr
    from products p
    where p.name ilike any (v_pats) or p.brand ilike any (v_pats)
       or p.category ilike any (v_pats) or p.subcategory ilike any (v_pats)
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
                  when starts_with(w.n_name, p_q_norm) then 120
                  when starts_with(w.n_brand, p_q_norm) then 90
                  else 0 end as phrase
    ) ph
    cross join lateral (
      select coalesce(sum(h.nh::int * 15 + h.bh::int * 10 + h.ch::int * 8 + h.ns::int * 5), 0) as ws,
             coalesce(bool_or(h.nh or h.bh or h.ch), false) as anyhit,
             coalesce(bool_and(h.nh or h.bh or h.ch), false) as allhit
      from unnest(v_words) q
      cross join lateral (
        select exists (select 1 from unnest(w.nw) x where starts_with(x, q) or right(x, length(q)) = q) as nh,
               exists (select 1 from unnest(w.bw) x where starts_with(x, q) or right(x, length(q)) = q) as bh,
               exists (select 1 from unnest(w.cw) x where starts_with(x, q) or right(x, length(q)) = q) as ch,
               exists (select 1 from unnest(w.nw) x where starts_with(x, q)) as ns
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
