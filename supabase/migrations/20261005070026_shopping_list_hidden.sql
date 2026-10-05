-- "Forlad" en liste, der er delt med hele familien (type='family'): modtageren har ingen adgangsrække at slette,
-- så listen skjules i stedet for dem. Kun en visningsindstilling; adgangen styres stadig af ejeren.
-- Kun edge-funktionen `shopping` (service-role) læser/skriver tabellen; RLS er slået til uden politikker.
create table public.shopping_list_hidden (
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  hidden_at timestamp with time zone not null default now(),
  primary key (list_id, user_id)
);
create index idx_shopping_list_hidden_user_id on public.shopping_list_hidden (user_id);
alter table public.shopping_list_hidden enable row level security;
revoke all on public.shopping_list_hidden from public, anon, authenticated;
