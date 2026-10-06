alter table public.feedback_tickets add column if not exists image_path text;
comment on column public.feedback_tickets.image_path is 'Sti i den lukkede bucket feedback-screenshots. Erstatter image_base64 (som ikke længere skrives).';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feedback-screenshots', 'feedback-screenshots', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
