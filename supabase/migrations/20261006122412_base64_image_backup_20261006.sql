-- Sikkerhedskopi af de seks store base64-billeder, før de flyttes til Storage.
-- Beholdes, til Jan siger, den må slettes.
create table if not exists public.base64_image_backup_20261006 (
  source_table text not null,
  row_id uuid not null,
  column_name text not null,
  content text not null,
  backed_up_at timestamptz not null default now(),
  primary key (source_table, row_id, column_name)
);
alter table public.base64_image_backup_20261006 enable row level security;
revoke all on public.base64_image_backup_20261006 from anon, authenticated;

insert into public.base64_image_backup_20261006 (source_table, row_id, column_name, content)
select 'submissions', id, 'raw_label_image', raw_label_image from public.submissions
where raw_label_image is not null and raw_label_image not like 'http%' and length(raw_label_image) > 5000
on conflict do nothing;

insert into public.base64_image_backup_20261006 (source_table, row_id, column_name, content)
select 'feedback_tickets', id, 'image_base64', image_base64 from public.feedback_tickets
where image_base64 is not null
on conflict do nothing;
