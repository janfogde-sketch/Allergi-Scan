-- Næringsværdier for Nemlig-varer uden rigtigt EAN (13. okt. 2026, Jan sagde ja).
-- Et job (nutrition-backfill-nemlig) søger på navn + mærke hos Open Food Facts og udfylder KUN tomme felter,
-- når mærket passer, og varens egne tal (kcal, fedt, evt. kulhydrat) stemmer med kandidatens. Intet overskrives, intet gættes.
-- Det eksisterende EAN-job (nutrition-backfill) røres ikke.

alter table public.products add column if not exists nutrition_name_checked_at timestamptz;

-- Varer, som jobbet må slå op: Nemlig, ikke slået op endnu, kulhydrat eller mættet fedt mangler,
-- og varen har mærke samt kcal (mindst 20) og fedt som fingeraftryk. Uden fingeraftryk kan et match ikke verificeres.
create or replace function public.nutrition_nemlig_candidates(p_limit int default 40)
returns table (id uuid, name text, brand text, nutrition jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.brand, p.nutrition
    from public.products p
   where p.ean like 'NEMLIG-%'
     and p.nutrition_name_checked_at is null
     and coalesce(p.brand, '') <> ''
     and p.nutrition is not null
     and jsonb_typeof(p.nutrition) = 'object'
     and (p.nutrition ->> 'energy_kcal') ~ '^\d+(\.\d+)?$'
     and (p.nutrition ->> 'energy_kcal')::numeric >= 20
     and (p.nutrition ->> 'fat') ~ '^\d+(\.\d+)?$'
     and (coalesce(p.nutrition ->> 'carbohydrates', '') = '' or coalesce(p.nutrition ->> 'saturated_fat', '') = '')
   order by p.id
   limit greatest(1, least(p_limit, 100));
$$;
revoke all on function public.nutrition_nemlig_candidates(int) from public, anon, authenticated;
grant execute on function public.nutrition_nemlig_candidates(int) to service_role;

-- Sikkerhedskopi af næringsdata for alle Nemlig-varer (jobbet kan kun ændre en delmængde).
create table if not exists public.products_nutrition_backup_nemlig_20261013 as
select p.id, p.ean, p.nutrition, now() as backed_up_at
  from public.products p
 where p.ean like 'NEMLIG-%' and p.nutrition is not null;
alter table public.products_nutrition_backup_nemlig_20261013 enable row level security;
revoke all on public.products_nutrition_backup_nemlig_20261013 from public, anon, authenticated;

insert into public.admin_todos (title, description, priority, track)
select '[Før beta] Data: næringsværdier for Nemlig-varer uden rigtig stregkode',
 'Nemlig-varer har kun interne numre (NEMLIG-xxxxxxx), så EAN-jobbet mod Open Food Facts kan ikke fylde dem ud. Tal 13. okt.: 6.635 Nemlig-varer; 1.538 uden næringsdata; 154 mangler kulhydrat; 5.097 mangler mættet fedt. Et job (nutrition-backfill-nemlig) søger på navn + mærke hos Open Food Facts og accepterer KUN en kandidat, hvor mærket passer, og kcal, fedt og evt. kulhydrat stemmer med varens egne tal. Det udfylder kun tomme felter, overskriver aldrig og gætter aldrig. Varer uden mærke eller egne kcal/fedt-tal kan ikke verificeres og springes over. Stikprøve: ca. 30 % match. Sikkerhedskopi: products_nutrition_backup_nemlig_20261013. Jobbet lukker to do''en selv med tal.',
 'normal', 'backend'
 where not exists (select 1 from public.admin_todos where title like '[Før beta] Data: næringsværdier for Nemlig-varer%');

create or replace function public.run_nutrition_nemlig()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_left int;
  v_key text;
  v_todo uuid;
  v_checked int;
  v_carb int;
  v_sat int;
  v_total int;
begin
  select count(*) into v_left from public.nutrition_nemlig_candidates(1);
  if v_left = 0 then
    select id into v_todo from public.admin_todos
     where title like '[Før beta] Data: næringsværdier for Nemlig-varer%' and status <> 'done' limit 1;
    if v_todo is not null then
      select count(*) filter (where nutrition_name_checked_at is not null),
             count(*) filter (where coalesce(nutrition ->> 'carbohydrates', '') <> ''),
             count(*) filter (where coalesce(nutrition ->> 'saturated_fat', '') <> ''),
             count(*)
        into v_checked, v_carb, v_sat, v_total
        from public.products where ean like 'NEMLIG-%';
      update public.admin_todos set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now() where id = v_todo;
      insert into public.admin_todo_comments (todo_id, body) values (v_todo,
        format('Lukket automatisk af jobbet nutrition-backfill-nemlig. %s Nemlig-varer blev slået op på navn og mærke. Nu har %s af %s Nemlig-varer kulhydrat og %s har mættet fedt. Resten havde intet sikkert match (eller manglede mærke/egne tal at tjekke mod) og står som ukendt i stedet for et gæt. Sikkerhedskopi: products_nutrition_backup_nemlig_20261013.', v_checked, v_carb, v_total, v_sat));
    end if;
    perform cron.unschedule('nutrition-backfill-nemlig');
    return;
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
  perform net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/nutrition-backfill-nemlig',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;
revoke all on function public.run_nutrition_nemlig() from public, anon, authenticated;

select cron.schedule('nutrition-backfill-nemlig', '*/2 * * * *', 'select public.run_nutrition_nemlig();');

-- Rettelse af sql-tests (access_rules): sikkerhedskopien fra kategori-migrationen (#692) manglede revoke,
-- så anon kunne skrive i den. Samme lukning som for de øvrige sikkerhedskopier; ingen app bruger tabellen.
revoke all on public.products_category_backup_20261013 from public, anon, authenticated;
