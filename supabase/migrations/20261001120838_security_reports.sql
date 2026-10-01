-- "Det var ikke mig" i glemt-adgangskode-mailen (1. okt. 2026, to do 1a1e600b).
-- Edge-funktionen report-unrequested-reset (service role) gemmer en række, når en bruger melder, at en nulstilling
-- af adgangskoden ikke var bestilt af dem. Kun admins kan læse; ingen IP-adresser gemmes.
create table if not exists public.security_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('unrequested_password_reset')),
  todo_id uuid references public.admin_todos(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists security_reports_user_kind_idx on public.security_reports (user_id, kind, created_at desc);
create index if not exists security_reports_created_idx on public.security_reports (created_at desc);
create index if not exists security_reports_todo_idx on public.security_reports (todo_id);

alter table public.security_reports enable row level security;
revoke all on public.security_reports from anon, authenticated;
grant select on public.security_reports to authenticated;
grant all on public.security_reports to service_role;

drop policy if exists security_reports_select on public.security_reports;
create policy security_reports_select on public.security_reports for select to authenticated
  using (public.is_admin((select auth.uid())));
