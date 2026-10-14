-- Indsendte emballagefotos ligger privat, til de er godkendt (plan 14. okt. 2026).
-- Nye fotos uploades af edge-funktionen submissions med service-nøglen; kun admins kan læse dem (signeret link i admin-panelet).
-- Ved godkendelse kopieres produktbilledet til den offentlige bøtte product-images. Ingen insert/update/delete-politik for brugere.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('submission-images', 'submission-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "submission_images_admin_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'submission-images' and public.is_admin((select auth.uid())));

-- Oprydning: filer i submission-images, som ingen indsendelse peger på (fx efter kontosletning), slettes dagligt af cleanup-orphan-images.
-- Samme frist som product-images: et upload får 24 timer, så en indsendelse der er ved at blive gemt, ikke rammes.
create or replace function public.orphan_submission_images()
returns table(name text)
language sql
security definer
set search_path = public, storage
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'submission-images'
    and o.created_at < now() - interval '24 hours'
    and not exists (
      select 1 from public.submissions s
      where s.raw_label_image = 'storage:submission-images/' || o.name
         or s.ai_parsed_data::text like '%storage:submission-images/' || o.name || '"%'
    );
$$;
revoke all on function public.orphan_submission_images() from public, anon, authenticated;
grant execute on function public.orphan_submission_images() to service_role;
