-- Test af natjob-trådens skrivevej (public.routine_apply m.fl., migration 20261015050000). Rulles tilbage til sidst.
begin;
do $$
declare
  p1 uuid; p2 uuid; p3 uuid; r jsonb; v_flags jsonb; v_ok boolean;
begin
  insert into public.products (ean, name, ingredients_text, allergen_quality, allergen_flags)
    values ('5700000088881', 'Natjob A', 'hvedemel, sukker', 'pending', '{"hvede":"yes","sesam":"traces","soja":"no"}')
    returning id into p1;
  insert into public.products (ean, name, ingredients_text, allergen_quality, allergen_flags)
    values ('5700000088882', 'Natjob B', 'sukker', 'high', '{"hvede":"no"}')
    returning id into p2;
  insert into public.products (ean, name) values ('5700000088883', 'Natjob C') returning id into p3;
  update public.products set subcategory = null, subcategory_classified_at = null where id = p3;

  -- Køen viser varen
  r := public.routine_queue(200, 300);
  if not exists (select 1 from jsonb_array_elements(r->'allergen') e where (e->>'id')::uuid = p1) then
    raise exception 'FEJL: vare A mangler i køen';
  end if;

  -- Uden en kørsel er tråden ikke aktiv, så de gamle job kører som før
  if public.routine_active() then raise exception 'FEJL: routine_active uden kørsel'; end if;

  -- Kun opad: forsøg på at sænke hvede og sesam ignoreres; soja hæves
  r := public.routine_apply(jsonb_build_object('note', 'test', 'allergen', jsonb_build_array(
    jsonb_build_object('id', p1, 'method', 'keyword+claude', 'flags', '{"hvede":"no","sesam":"no","soja":"traces"}'::jsonb),
    jsonb_build_object('id', p2, 'method', 'keyword', 'flags', '{"hvede":"yes"}'::jsonb))));
  select allergen_flags into v_flags from public.products where id = p1;
  if v_flags->>'hvede' <> 'yes' or v_flags->>'sesam' <> 'traces' or v_flags->>'soja' <> 'traces' then
    raise exception 'FEJL: kun opad brudt: %', v_flags;
  end if;
  if (select allergen_quality from public.products where id = p1) <> 'high' then raise exception 'FEJL: kvalitet'; end if;
  -- Vare B er ikke i køen (high): må ikke røres
  if (select allergen_flags->>'hvede' from public.products where id = p2) <> 'no' then raise exception 'FEJL: vare uden for køen ændret'; end if;
  if (r->>'allergen')::int <> 1 then raise exception 'FEJL: antal %', r; end if;
  if not exists (select 1 from public.routine_changes where product_id = p1 and kind = 'allergen') then
    raise exception 'FEJL: ændringen er ikke logget';
  end if;

  -- Nu er tråden aktiv; slås kontakten fra, er den ikke
  if not public.routine_active() then raise exception 'FEJL: routine_active efter kørsel'; end if;
  update public.app_flags set value = 'false'::jsonb where key = 'ai_jobs_via_routine';
  if public.routine_active() then raise exception 'FEJL: kontakten virker ikke'; end if;
  update public.app_flags set value = 'true'::jsonb where key = 'ai_jobs_via_routine';

  -- Kategori: sættes kun, hvis varen mangler underkategori
  perform public.routine_apply(jsonb_build_object('category', jsonb_build_array(
    jsonb_build_object('id', p3, 'category', 'Kolonial', 'subcategory', 'Pasta & ris'))));
  if (select subcategory from public.products where id = p3) <> 'Pasta & ris' then raise exception 'FEJL: kategori ikke sat'; end if;
  perform public.routine_apply(jsonb_build_object('category', jsonb_build_array(
    jsonb_build_object('id', p3, 'category', 'Frost', 'subcategory', 'Is'))));
  if (select subcategory from public.products where id = p3) <> 'Pasta & ris' then raise exception 'FEJL: kategori overskrevet'; end if;

  -- Ugyldige kald afvises
  foreach r in array array[
    jsonb_build_object('allergen', jsonb_build_array(jsonb_build_object('id', p1, 'method', 'keyword', 'flags', '{"banan":"yes"}'::jsonb))),
    jsonb_build_object('allergen', jsonb_build_array(jsonb_build_object('id', p1, 'method', 'keyword', 'flags', '{"sesam":"måske"}'::jsonb))),
    jsonb_build_object('allergen', jsonb_build_array(jsonb_build_object('id', p1, 'method', 'gæt', 'flags', '{}'::jsonb))),
    '"tekst"'::jsonb] loop
    v_ok := false;
    begin perform public.routine_apply(r); exception when others then v_ok := true; end;
    if not v_ok then raise exception 'FEJL: kald burde være afvist: %', r; end if;
  end loop;

  -- Appens brugere og anonyme må ikke kalde funktionerne
  if has_function_privilege('anon', 'public.routine_apply(jsonb)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.routine_apply(jsonb)', 'EXECUTE')
     or has_function_privilege('anon', 'public.routine_queue(integer, integer)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.routine_queue(integer, integer)', 'EXECUTE') then
    raise exception 'FEJL: routine-funktionerne må ikke kunne kaldes af anon/authenticated';
  end if;
end $$;
rollback;
