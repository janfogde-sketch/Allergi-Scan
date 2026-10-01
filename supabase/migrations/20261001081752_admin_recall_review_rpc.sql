-- Admin-visning til tilbagekaldelser uden gyldig EAN (1. okt. 2026).
-- Tabellen recalls kan kun læses af admin; denne migration giver admin to RPC'er:
--  - admin_recall_affected_count(eans): hvor mange brugere en besked ville ramme
--  - admin_resolve_recall(id, handling, eans): afgør en tilbagekaldelse i needs_review
--    (link = knyt EAN'er, sæt ready og læg recall_published i outboxen; archive; cancel).

-- Samme skrivemåder som eanVariants() i _shared/recallParser.js (med/uden foranstillede nuller).
create or replace function public.ean_variants(p_code text)
returns text[] language sql immutable set search_path = public as $$
  with d as (
    select regexp_replace(coalesce(p_code, ''), '\D', '', 'g') as digits
  ), s as (
    select digits, regexp_replace(digits, '^0+', '') as stripped from d
  )
  select coalesce(array(
    select distinct v from unnest(array[
      digits, stripped,
      repeat('0', greatest(8 - length(stripped), 0)) || stripped,
      repeat('0', greatest(12 - length(stripped), 0)) || stripped,
      repeat('0', greatest(13 - length(stripped), 0)) || stripped,
      repeat('0', greatest(14 - length(stripped), 0)) || stripped
    ]) v
    where v <> ''
  ), '{}'::text[]) from s
$$;

-- GTIN-8/12/13/14 med kontrolciffer (som isValidGtin() i recallParser.js).
create or replace function public.is_valid_gtin(p_code text)
returns boolean language plpgsql immutable set search_path = public as $$
declare
  n int; i int; sum int := 0; w int;
begin
  if p_code is null or p_code !~ '^(\d{8}|\d{12,14})$' then return false; end if;
  n := length(p_code);
  for i in 1..n - 1 loop
    w := case when ((n - 1 - i) % 2) = 0 then 3 else 1 end;
    sum := sum + substr(p_code, i, 1)::int * w;
  end loop;
  return ((10 - (sum % 10)) % 10) = substr(p_code, n, 1)::int;
end;
$$;

create or replace function public.admin_recall_affected_count(p_eans text[])
returns integer language plpgsql stable security definer set search_path = public as $$
declare
  v_variants text[];
  v_count integer;
begin
  if not public.is_admin((select auth.uid())) then raise exception 'Kun administratorer'; end if;
  select coalesce(array_agg(distinct v), '{}') into v_variants
    from unnest(coalesce(p_eans, '{}')) e, unnest(public.ean_variants(e)) v;
  select count(*) into v_count from (
    select user_id from public.favorites where ean = any (v_variants) and user_id is not null
    union
    select user_id from public.scan_history
      where ean_scanned = any (v_variants) and user_id is not null and scanned_at >= now() - interval '90 days'
    union
    select l.owner_id from public.shopping_list_items i join public.shopping_lists l on l.id = i.list_id
      where i.ean = any (v_variants) and l.owner_id is not null
    union
    select a.user_id from public.shopping_list_items i join public.shopping_list_access a on a.list_id = i.list_id
      where i.ean = any (v_variants) and a.user_id is not null
  ) u;
  return v_count;
end;
$$;

create or replace function public.admin_resolve_recall(p_recall_id uuid, p_action text, p_eans text[] default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_row public.recalls;
  v_eans text[];
  v_ean text;
begin
  if not public.is_admin((select auth.uid())) then raise exception 'Kun administratorer'; end if;
  if p_action not in ('link', 'archive', 'cancel') then raise exception 'Ukendt handling: %', p_action; end if;

  select * into v_row from public.recalls where id = p_recall_id for update;
  if not found then raise exception 'Tilbagekaldelsen findes ikke'; end if;
  if v_row.status <> 'needs_review' then
    raise exception 'Kun tilbagekaldelser, der afventer gennemgang, kan afgøres (status er %)', v_row.status;
  end if;

  if p_action = 'link' then
    select coalesce(array_agg(distinct regexp_replace(e, '\D', '', 'g')), '{}') into v_eans from unnest(coalesce(p_eans, '{}')) e;
    if cardinality(v_eans) = 0 then raise exception 'Vælg mindst ét produkt'; end if;
    foreach v_ean in array v_eans loop
      if not public.is_valid_gtin(v_ean) then raise exception 'Ugyldig stregkode: %', v_ean; end if;
      if not exists (select 1 from public.products where ean = any (public.ean_variants(v_ean))) then
        raise exception 'Stregkoden % findes ikke i produktkataloget', v_ean;
      end if;
    end loop;
    update public.recalls set eans = v_eans, status = 'ready', updated_at = now() where id = p_recall_id;
    insert into public.notification_events (event_key, kind, payload, available_at)
    values ('p6:' || p_recall_id, 'recall_published', jsonb_build_object('recall_id', p_recall_id), now())
    on conflict (event_key) do nothing;
    return jsonb_build_object('status', 'ready', 'eans', to_jsonb(v_eans));
  elsif p_action = 'archive' then
    update public.recalls set status = 'archived', updated_at = now() where id = p_recall_id;
    return jsonb_build_object('status', 'archived');
  else
    update public.recalls set status = 'cancelled', updated_at = now() where id = p_recall_id;
    return jsonb_build_object('status', 'cancelled');
  end if;
end;
$$;

revoke all on function public.ean_variants(text) from public, anon;
revoke all on function public.is_valid_gtin(text) from public, anon;
revoke all on function public.admin_recall_affected_count(text[]) from public, anon;
revoke all on function public.admin_resolve_recall(uuid, text, text[]) from public, anon;
grant execute on function public.ean_variants(text), public.is_valid_gtin(text) to authenticated, service_role;
grant execute on function public.admin_recall_affected_count(text[]), public.admin_resolve_recall(uuid, text, text[]) to authenticated;
