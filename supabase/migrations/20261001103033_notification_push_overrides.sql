-- Redigerbar push: admin kan rette titel og tekst på push-beskeden pr. notifikation (fx "N6:resolved").
-- Mailen (Resend) og beskeden i appen er uændrede; tom række = standardteksten fra koden.
create table public.notification_push_overrides (
  key text primary key,
  title text,
  body text,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint npo_title_len check (title is null or char_length(title) <= 60),
  constraint npo_body_len check (body is null or char_length(body) <= 180)
);

alter table public.notification_push_overrides enable row level security;
revoke all on public.notification_push_overrides from anon, authenticated;
grant select, insert, update, delete on public.notification_push_overrides to authenticated;
grant all on public.notification_push_overrides to service_role;

create policy npo_admin_all on public.notification_push_overrides
  for all to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));
