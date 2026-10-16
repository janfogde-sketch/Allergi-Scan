-- Ændringshistorik (16. okt. 2026): samlet læsning af produkternes ændringer fra de to eksisterende kilder, uden at ændre nogen tabel eller flytte data:
--  * admin_audit_log (produkt_oprettet/-rettet/-slettet): administratorens ændringer med feltnavne, før- og efterværdier, navn og EAN som øjebliksbillede (overlever omdøbning/sletning)
--  * revision_log (ældre): godkendte brugerindsendelser, uden før/efter-værdier (new_value er kun en note)
-- Intet rekonstrueres eller gættes: manglende detaljer returneres som tomme. Kun administratorer. Automatiske ændringer (import, genanalyse) logges ikke i dag; se docs/aendringshistorik.md.
create or replace function public.admin_product_history(
  p_search text default null, p_action text default null, p_days integer default null, p_allergen boolean default false,
  p_sort text default 'newest', p_limit integer default 50, p_offset integer default 0)
returns table (id text, source text, at timestamptz, action text, product_id uuid, product_exists boolean, ean text, name text,
               actor_id uuid, actor_name text, changes jsonb, fields jsonb, note text, legacy_fields text, total_count bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_q text := nullif(trim(coalesce(p_search, '')), '');
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  return query
  with audit as (
    select a.id::text as id, 'audit'::text as source, a.created_at as at,
           case a.action when 'produkt_oprettet' then 'created' when 'produkt_rettet' then 'updated' else 'deleted' end as action,
           case when a.target_id ~ '^[0-9a-fA-F-]{36}$' then a.target_id::uuid end as product_id,
           a.details ->> 'ean' as ean, a.details ->> 'navn' as name, a.admin_id as actor_id,
           a.details -> 'aendringer' as changes, a.details -> 'felter' as fields, null::text as note, null::text as legacy_fields
      from public.admin_audit_log a
     where a.target_table = 'products' and a.action in ('produkt_oprettet', 'produkt_rettet', 'produkt_slettet') and a.outcome = 'ok'
  ), legacy as (
    select r.id::text, 'legacy'::text, r.created_at,
           case r.change_type when 'created' then 'created' else 'updated' end,
           r.product_id, null::text, null::text, r.changed_by,
           null::jsonb, null::jsonb, r.new_value, r.field_changed
      from public.revision_log r
  ), u as (
    select * from audit union all select * from legacy
  ), j as (
    select u.id, u.source, u.at, u.action, u.product_id, (p.id is not null) as product_exists,
           coalesce(u.ean, p.ean) as ean, coalesce(u.name, p.name) as name, u.actor_id, coalesce(us.name, us.email) as actor_name,
           u.changes, u.fields, u.note, u.legacy_fields
      from u
      left join public.products p on p.id = u.product_id
      left join public.users us on us.id = u.actor_id
  )
  select j.id, j.source, j.at, j.action, j.product_id, j.product_exists, j.ean, j.name, j.actor_id, j.actor_name, j.changes, j.fields, j.note, j.legacy_fields, count(*) over ()
    from j
   where (p_action is null or p_action = '' or j.action = p_action)
     and (p_days is null or j.at >= now() - make_interval(days => p_days))
     and (not coalesce(p_allergen, false)
          or (j.fields ? 'allergen_flags')
          or (j.source = 'legacy' and j.legacy_fields ilike '%allergen%'))
     and (v_q is null or j.name ilike '%' || v_q || '%' or j.ean like regexp_replace(v_q, '\D', '', 'g') || '%' and regexp_replace(v_q, '\D', '', 'g') <> ''
          or j.actor_name ilike '%' || v_q || '%')
   order by case when p_sort = 'oldest' then j.at end asc, j.at desc
   limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0);
end;
$$;
revoke all on function public.admin_product_history(text, text, integer, boolean, text, integer, integer) from public, anon;
grant execute on function public.admin_product_history(text, text, integer, boolean, text, integer, integer) to authenticated;
