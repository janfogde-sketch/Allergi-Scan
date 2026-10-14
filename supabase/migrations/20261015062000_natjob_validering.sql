-- Rettelse af natjob-trådens skrivefunktion (migration 20261015060000): routine_apply validerede allergennøgler og -værdier først
-- efter tjekket "er varen i køen?", så et ugyldigt kald for en vare uden for køen blev stille sprunget over i stedet for afvist
-- (fanget af supabase/tests/natjob_routine.sql). Nu valideres hele inputtet først. Ellers uændret: kun opad, kun varer i køen.

create or replace function public.routine_apply(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c_allergens constant text[] := array['gluten','hvede','maelkeallergi','laktose','aeg','noedder','jordnoedder','soja',
    'fisk','skaldyr','selleri','sennep','sesam','svovl','lupin','bloeddyr'];
  v_run bigint; it jsonb; v_id uuid; v_old jsonb; v_new jsonb; k text; v text; o text;
  v_method text; v_n_all int := 0; v_raised int := 0; v_n_cat int := 0;
begin
  if p is null or jsonb_typeof(p) <> 'object' then raise exception 'Forventer et JSON-objekt'; end if;
  if jsonb_typeof(coalesce(p->'allergen', '[]')) <> 'array' or jsonb_typeof(coalesce(p->'category', '[]')) <> 'array' then
    raise exception 'allergen og category skal være lister';
  end if;
  if jsonb_array_length(coalesce(p->'allergen', '[]')) > 200 or jsonb_array_length(coalesce(p->'category', '[]')) > 300 then
    raise exception 'For mange varer i ét kald';
  end if;

  insert into public.routine_runs (note) values (left(p->>'note', 500)) returning id into v_run;

  for it in select * from jsonb_array_elements(coalesce(p->'allergen', '[]')) loop
    v_id := (it->>'id')::uuid;
    v_method := it->>'method';
    if v_method not in ('keyword', 'keyword+claude') then raise exception 'Ukendt metode: %', v_method; end if;
    if jsonb_typeof(it->'flags') <> 'object' then raise exception 'flags mangler for %', v_id; end if;
    -- Hele inputtet valideres, før køen tjekkes, så et ugyldigt kald altid afvises.
    for k, v in select * from jsonb_each_text(it->'flags') loop
      if not (k = any(c_allergens)) then raise exception 'Ukendt allergen: %', k; end if;
      if v not in ('no', 'traces', 'yes', 'unknown') then raise exception 'Ukendt værdi: % = %', k, v; end if;
    end loop;
    select allergen_flags into v_old from public.products
      where id = v_id and allergen_quality in ('pending', 'low') for update;
    if not found then continue; end if; -- ikke (længere) i køen: rør ikke varen
    v_old := coalesce(v_old, '{}'::jsonb);
    v_new := v_old;
    for k, v in select * from jsonb_each_text(it->'flags') loop
      o := v_old->>k;
      -- Kun opad: unknown/no = 0, spor = 1, ja = 2. Et nyt flag bruges kun, hvis det mangler i forvejen eller er strengere.
      if o is null or (case v when 'yes' then 2 when 'traces' then 1 else 0 end)
                    > (case o when 'yes' then 2 when 'traces' then 1 else 0 end) then
        v_new := jsonb_set(v_new, array[k], to_jsonb(v));
      end if;
    end loop;
    update public.products set
      allergen_flags = v_new,
      allergen_quality = case when v_method = 'keyword+claude' then 'high' else 'medium' end,
      allergen_source_method = v_method,
      reparsed_at = now()
    where id = v_id;
    v_n_all := v_n_all + 1;
    if v_new is distinct from v_old then
      v_raised := v_raised + 1;
      insert into public.routine_changes (run_id, product_id, kind, old_value, new_value) values (v_run, v_id, 'allergen', v_old, v_new);
    end if;
  end loop;

  for it in select * from jsonb_array_elements(coalesce(p->'category', '[]')) loop
    v_id := (it->>'id')::uuid;
    if coalesce((it->>'skip')::boolean, false) then
      update public.products set subcategory_classified_at = now() where id = v_id and subcategory is null;
      continue;
    end if;
    if coalesce(it->>'category', '') = '' or coalesce(it->>'subcategory', '') = '' then
      raise exception 'category og subcategory skal udfyldes for %', v_id;
    end if;
    select jsonb_build_object('category', category, 'subcategory', subcategory) into v_old
      from public.products where id = v_id and subcategory is null for update;
    if not found then continue; end if; -- har allerede en underkategori: overskriv ikke
    update public.products set category = it->>'category', subcategory = it->>'subcategory', subcategory_classified_at = now()
      where id = v_id;
    insert into public.routine_changes (run_id, product_id, kind, old_value, new_value)
      values (v_run, v_id, 'category', v_old, jsonb_build_object('category', it->>'category', 'subcategory', it->>'subcategory'));
    v_n_cat := v_n_cat + 1;
  end loop;

  update public.routine_runs set allergen_count = v_n_all, allergen_raised = v_raised, category_count = v_n_cat where id = v_run;
  -- Opbevaring: loggen behøves kun til en eventuel tilbagerulning.
  delete from public.routine_runs where ran_at < now() - interval '90 days';

  return jsonb_build_object('run_id', v_run, 'allergen', v_n_all, 'allergen_raised', v_raised, 'category', v_n_cat);
end;
$$;
revoke all on function public.routine_apply(jsonb) from public, anon, authenticated;
