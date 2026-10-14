-- Natjob og kategorisering på Jans abonnement (Jan, 14. okt. 2026; plan: eatsafe/natjob-kategorisering-abonnement-plan-2026-10-14.md).
-- En fast Claude-tråd (routine) gør nu arbejdet for de to cron-job auto-reparse og classify-categories-backlog, uden API-nøglen:
--   1) workflowet "Hent natjob-kø" læser køen med routine_queue() og kører motorens nøgleord,
--   2) tråden læser kun de svære lister selv og vælger kategorier,
--   3) workflowet "Skriv natjob-resultat" skriver med routine_apply().
-- Kun opad: routine_apply() tager altid det strengeste af gammelt og nyt flag pr. allergen (nej < spor < ja). Ingen sænkning.
-- Nødstart: de to cron-job springer kun over, når kontakten er slået til OG tråden har haft en god kørsel inden for 36 timer.
-- Ellers kører de som før med API-nøglen. Helt tilbage til det gamle: sæt app_flags.ai_jobs_via_routine = false.
-- Ingen personoplysninger: kun varedata og kørselslog. Loggen ryddes efter 90 dage af routine_apply().

insert into public.app_flags (key, value) values ('ai_jobs_via_routine', 'true'::jsonb) on conflict (key) do nothing;

-- Kørselslog: én række pr. skrivning fra tråden (også når køen var tom), så nødstarten kan se, at tråden lever.
create table if not exists public.routine_runs (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  allergen_count int not null default 0,
  allergen_raised int not null default 0,
  category_count int not null default 0,
  note text
);
-- Gamle og nye værdier pr. ændret vare, så alt kan rulles tilbage.
create table if not exists public.routine_changes (
  id bigint generated always as identity primary key,
  run_id bigint not null references public.routine_runs(id) on delete cascade,
  product_id uuid not null,
  kind text not null check (kind in ('allergen', 'category')),
  old_value jsonb,
  new_value jsonb,
  changed_at timestamptz not null default now()
);
alter table public.routine_runs enable row level security;
alter table public.routine_changes enable row level security;
revoke all on public.routine_runs, public.routine_changes from public, anon, authenticated;

-- Er tråden aktiv? Kontakten slået til og en kørsel inden for 36 timer.
create or replace function public.routine_active()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select value = 'true'::jsonb from public.app_flags where key = 'ai_jobs_via_routine'), false)
     and exists (select 1 from public.routine_runs where ran_at > now() - interval '36 hours');
$$;

-- Køen: samme udvalg som auto-reparse (pending/low med ingrediensliste) og classify-categories (uden underkategori).
create or replace function public.routine_queue(p_allergen_limit int default 100, p_category_limit int default 150)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'allergen', coalesce((
      select jsonb_agg(jsonb_build_object('id', q.id, 'ean', q.ean, 'name', q.name, 'ingredients_text', q.ingredients_text))
      from (
        select id, ean, name, ingredients_text from public.products
        where allergen_quality in ('pending', 'low') and ingredients_text is not null and ingredients_text <> ''
        order by allergen_quality, reparsed_at nulls first
        limit least(greatest(coalesce(p_allergen_limit, 100), 0), 200)
      ) q), '[]'::jsonb),
    'category', coalesce((
      select jsonb_agg(jsonb_build_object('id', q.id, 'name', q.name, 'brand', q.brand, 'category_original', left(q.category_original, 80)))
      from (
        select id, name, brand, category_original from public.products
        where subcategory is null and subcategory_classified_at is null and name is not null
        limit least(greatest(coalesce(p_category_limit, 150), 0), 300)
      ) q), '[]'::jsonb)
  );
$$;

-- Skrivning. Input (bygget af workflowet ud fra motoren + trådens fund):
--   {"note":"…","allergen":[{"id":uuid,"flags":{allergen:"no|traces|yes|unknown",…},"method":"keyword|keyword+claude"}],
--    "category":[{"id":uuid,"category":"…","subcategory":"…"} eller {"id":uuid,"skip":true}]}
-- Allergen: kun varer i køen (pending/low); kun kendte allergener og værdier; hvert flag bliver det strengeste af gammelt og nyt.
-- Kategori: kun varer uden underkategori; "skip" stempler forsøget, så varen ikke prøves igen (som classify-categories).
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
    select allergen_flags into v_old from public.products
      where id = v_id and allergen_quality in ('pending', 'low') for update;
    if not found then continue; end if; -- ikke (længere) i køen: rør ikke varen
    v_old := coalesce(v_old, '{}'::jsonb);
    v_new := v_old;
    for k, v in select * from jsonb_each_text(it->'flags') loop
      if not (k = any(c_allergens)) then raise exception 'Ukendt allergen: %', k; end if;
      if v not in ('no', 'traces', 'yes', 'unknown') then raise exception 'Ukendt værdi: % = %', k, v; end if;
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

revoke all on function public.routine_active() from public, anon, authenticated;
revoke all on function public.routine_queue(int, int) from public, anon, authenticated;
revoke all on function public.routine_apply(jsonb) from public, anon, authenticated;

-- De gamle job springer over, mens tråden er aktiv; ellers kører de som før (nødstart).
create or replace function public.run_auto_reparse()
returns void language plpgsql security definer set search_path = public as $$
declare v_key text;
begin
  if public.routine_active() then return; end if;
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
  perform net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/auto-reparse',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := '{"manual":false,"limit":50}'::jsonb,
    timeout_milliseconds := 110000
  );
end;
$$;
revoke all on function public.run_auto_reparse() from public, anon, authenticated;

create or replace function public.run_classify_categories()
returns void language plpgsql security definer set search_path = public as $$
declare v_key text; v_calls int; v_pending boolean;
begin
  if public.routine_active() then return; end if;
  select exists (
    select 1 from public.products
    where subcategory is null and subcategory_classified_at is null and name is not null
  ) into v_pending;
  if not v_pending then return; end if;

  select coalesce(sum(calls), 0) into v_calls
  from public.ai_usage_daily
  where day = (now() at time zone 'utc')::date and function_name = 'classify-categories';
  if v_calls >= 1000 then return; end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
  perform net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/classify-categories',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := '{"limit":300,"batch_size":30}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;
revoke all on function public.run_classify_categories() from public, anon, authenticated;

-- Samme navn og tidspunkt som før (03:00 UTC); cron.schedule med et eksisterende navn erstatter jobbets kommando.
select cron.schedule('auto-reparse', '0 3 * * *', 'select public.run_auto_reparse();');
