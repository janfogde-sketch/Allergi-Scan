-- Kategorihuller (to do 08b2d37e): 324 produkter uden kategori, 3 med rå Open Food Facts-tekst og ca. 17.300 uden underkategori.
-- Edge-funktionen classify-categories (Claude Haiku) kan kun kaldes med service-role-nøglen, så et planlagt job
-- tager et stykke ad gangen, til intet mangler. Nye produkter fra auto-import samles op af samme job.
-- Loft: højst 1.000 Claude-kald i døgnet til kategorisering (ca. 10 kald pr. kørsel).

create or replace function public.run_classify_categories()
returns void language plpgsql security definer set search_path = public as $$
declare v_key text; v_calls int; v_pending boolean;
begin
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

-- Hvert 5. minut; gør intet, når alle produkter har underkategori.
select cron.schedule('classify-categories-backlog', '*/5 * * * *', 'select public.run_classify_categories();');

insert into admin_todo_comments (todo_id, body) values
  ('08b2d37e-6beb-4375-b92e-6a661dcea2da',
   'Status: planlagt job "classify-categories-backlog" kategoriserer de ca. 17.300 produkter uden underkategori (inkl. de 324 uden kategori og de 3 med rå tekst) i portioner à 300 hvert 5. minut, højst 1.000 Claude-kald i døgnet. Forventet færdigt i løbet af få timer efter merge. Lukkes, når kontroltal viser 0 mangler.');
