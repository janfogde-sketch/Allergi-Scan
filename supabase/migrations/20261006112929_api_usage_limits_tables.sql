-- Dagligt loft på betalte AI-kald (OCR og Claude-analyse), kun mod misbrug: scanning er ubegrænset og gratis.
-- Tæller pr. bruger pr. døgn (api_usage) og et globalt loft for interne/anonyme kald (api_usage_global).
-- Frist: rækker slettes efter 30 dage i cleanup_notifications() (dagligt 03:30 UTC); api_usage slettes også med kontoen (cascade).

create table if not exists public.api_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  day date not null,
  n integer not null default 0,
  primary key (user_id, kind, day)
);
create table if not exists public.api_usage_global (
  kind text not null,
  day date not null,
  n integer not null default 0,
  primary key (kind, day)
);
alter table public.api_usage enable row level security;
alter table public.api_usage_global enable row level security;
revoke all on public.api_usage, public.api_usage_global from public, anon, authenticated;

