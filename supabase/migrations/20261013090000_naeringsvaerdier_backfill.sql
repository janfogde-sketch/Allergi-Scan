-- Manglende næringsværdier (kulhydrat og mættet fedt): ryd pladsholdere, ret gamle feltnavne og udfyld fra Open Food Facts.
-- Kun dokumenterede værdier udfyldes, og kun felter der mangler; intet overskrives, intet beregnes.
-- Jobbet nutrition-backfill (edge-funktion) kører hvert 2. minut i partier på 60 og lukker to do'en selv, når intet mangler.

alter table public.products add column if not exists nutrition_off_checked_at timestamptz;

-- Sikkerhedskopi af de rækker, der ændres her (gamle feltnavne og kun-nuller).
create table if not exists public.products_nutrition_backup_20261013 as
select p.id, p.ean, p.nutrition, now() as backed_up_at
  from public.products p
 where p.nutrition is not null
   and jsonb_typeof(p.nutrition) = 'object'
   and (
     p.nutrition ? 'energy' or p.nutrition ? 'saturated' or p.nutrition ? 'carbs'
     or not exists (
       select 1 from jsonb_each(p.nutrition) e
        where jsonb_typeof(e.value) = 'number' and (e.value)::text::numeric <> 0
     )
   );
alter table public.products_nutrition_backup_20261013 enable row level security;

-- 7 brugerindsendte produkter med gamle feltnavne og tekstværdier: oversæt til de nuværende nøgler.
do $$
declare
  r record;
  n jsonb;
  num numeric;
  e text;
  kj text;
  kcal text;
  k text;
  pair text[];
begin
  for r in select id, nutrition from public.products
            where nutrition ? 'energy' or nutrition ? 'saturated' or nutrition ? 'carbs' loop
    n := '{}'::jsonb;
    foreach pair slice 1 in array array[
      array['fat','fat'], array['salt','salt'], array['sugars','sugars'], array['protein','protein'],
      array['carbs','carbohydrates'], array['saturated','saturated_fat'],
      array['carbohydrates','carbohydrates'], array['saturated_fat','saturated_fat'], array['fiber','fiber']
    ] loop
      k := replace(trim(coalesce(r.nutrition ->> pair[1], '')), ',', '.');
      if k ~ '^\d+(\.\d+)?$' then
        n := n || jsonb_build_object(pair[2], k::numeric);
      end if;
    end loop;
    e := coalesce(r.nutrition ->> 'energy', '');
    kj := substring(e from '(?i)(\d+)\s*kj');
    kcal := coalesce(substring(e from '(?i)(\d+)\s*kcal'), substring(e from '/\s*(\d+)\s*k'));
    if kj is not null then n := n || jsonb_build_object('energy_kj', kj::numeric); end if;
    if kcal is not null then n := n || jsonb_build_object('energy_kcal', kcal::numeric); end if;
    update public.products set nutrition = case when n = '{}'::jsonb then null else n end where id = r.id;
  end loop;
end $$;

-- Kun-nuller er databasens pladsholder for ukendt: ryd til null (appen skjuler dem allerede).
update public.products p
   set nutrition = null
 where p.nutrition is not null
   and jsonb_typeof(p.nutrition) = 'object'
   and not exists (
     select 1 from jsonb_each(p.nutrition) e
      where jsonb_typeof(e.value) = 'number' and (e.value)::text::numeric <> 0
   );

-- Produkter, som jobbet skal slå op: gyldig stregkode og kulhydrat eller mættet fedt mangler. Hver slås op én gang.
create or replace function public.nutrition_backfill_candidates(p_limit int default 60)
returns table (id uuid, ean text, nutrition jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.ean, p.nutrition
    from public.products p
   where p.nutrition_off_checked_at is null
     and p.ean ~ '^[0-9]{8,14}$'
     and (p.nutrition is null
          or coalesce(p.nutrition ->> 'carbohydrates', '') = ''
          or coalesce(p.nutrition ->> 'saturated_fat', '') = '')
   order by p.id
   limit greatest(1, least(p_limit, 100));
$$;
revoke all on function public.nutrition_backfill_candidates(int) from public, anon, authenticated;
grant execute on function public.nutrition_backfill_candidates(int) to service_role;

-- Cron-jobbet: kalder funktionen, mens der er noget tilbage; lukker selv to do'en og sig selv, når det er færdigt.
create or replace function public.run_nutrition_backfill()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_left int;
  v_key text;
  v_todo uuid;
  v_carb int;
  v_sat int;
  v_checked int;
  v_total int;
begin
  select count(*) into v_left from public.nutrition_backfill_candidates(100);
  if v_left = 0 then
    select id into v_todo from public.admin_todos
     where title like '[Før beta] Data: importér manglende næringsværdier%' and status <> 'done' limit 1;
    if v_todo is not null then
      select count(*) filter (where nutrition_off_checked_at is not null),
             count(*) filter (where coalesce(nutrition ->> 'carbohydrates', '') <> ''),
             count(*) filter (where coalesce(nutrition ->> 'saturated_fat', '') <> ''),
             count(*)
        into v_checked, v_carb, v_sat, v_total
        from public.products where source in ('bilka', 'nemlig');
      update public.admin_todos set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now() where id = v_todo;
      insert into public.admin_todo_comments (todo_id, body) values (v_todo,
        format('Lukket automatisk af jobbet nutrition-backfill. %s Bilka-/Nemlig-produkter blev slået op på Open Food Facts. Nu har %s af %s Bilka-/Nemlig-produkter kulhydrat og %s har mættet fedt. Resten findes ikke på Open Food Facts (eller har ingen rigtig stregkode, det gælder alle Nemlig-produkter) og står som ukendt i stedet for et gæt. Pladsholder-nuller er ryddet; sikkerhedskopi: products_nutrition_backup_20261013.', v_checked, v_carb, v_total, v_sat));
    end if;
    perform cron.unschedule('nutrition-backfill');
    return;
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
  perform net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/nutrition-backfill',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;
revoke all on function public.run_nutrition_backfill() from public, anon, authenticated;

select cron.schedule('nutrition-backfill', '*/2 * * * *', 'select public.run_nutrition_backfill();');

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Status 13. okt. 2026: Jan sagde ja. Pladsholder-nuller ryddes til ukendt og 7 gamle feltnavne rettes (sikkerhedskopi products_nutrition_backup_20261013). Et job (nutrition-backfill) slår Bilka-produkter med rigtig stregkode op på Open Food Facts i partier på 60 hvert 2. minut og udfylder kun manglende felter med dokumenterede værdier. Nemlig-produkter har ingen rigtig stregkode og kan ikke slås op. Jobbet lukker to do''en selv med tal, når det er færdigt (ca. 8 timer).'
  from public.admin_todos t
 where t.title like '[Før beta] Data: importér manglende næringsværdier%' and t.status <> 'done'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Status 13. okt. 2026: Jan sagde ja%');
