-- Kontosletning: billeder i product-images, som ingen indsendelse eller produkt peger på, slettes dagligt.
-- Selve sletningen sker i edge-funktionen cleanup-orphan-images (lager-API'et; rækker i storage.objects må ikke slettes direkte).
-- Frist: et upload får 24 timer, så en indsendelse der er ved at blive gemt, ikke rammes.

create or replace function public.orphan_product_images()
returns table(name text)
language sql
security definer
set search_path = public, storage
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'product-images'
    and o.created_at < now() - interval '24 hours'
    and not exists (
      select 1 from public.submissions s
      where s.raw_label_image like '%/product-images/' || o.name || '%'
         or s.ai_parsed_data::text like '%/product-images/' || o.name || '%'
    )
    and not exists (
      select 1 from public.products p where p.image_url like '%/product-images/' || o.name || '%'
    );
$$;
revoke all on function public.orphan_product_images() from public, anon, authenticated;
grant execute on function public.orphan_product_images() to service_role;

create or replace function public.cleanup_orphan_images()
returns void language plpgsql security definer set search_path = public as $$
declare v_key text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
  perform net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/cleanup-orphan-images',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;
revoke all on function public.cleanup_orphan_images() from public, anon, authenticated;

-- Dagligt 03:50 UTC (efter notify-cleanup 03:30 og family-invite-email-cleanup 03:40).
select cron.schedule('orphan-images-cleanup', '50 3 * * *', 'select public.cleanup_orphan_images();');
