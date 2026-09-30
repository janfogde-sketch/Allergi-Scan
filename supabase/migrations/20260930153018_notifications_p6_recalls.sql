-- P6: tilbagekaldte fødevarer fra Fødevarestyrelsens RSS-feed (30. sept. 2026).
-- Edge-funktionen `recalls-sync` henter feedet hver time, læser hver ny tilbagekaldelses side og
-- gemmer den her. Sider med gyldige EAN'er (GTIN-kontrolciffer) får status 'ready' og lægger en
-- hændelse i outboxen; sider uden gyldig EAN får 'needs_review' (vises kun til admin). Første kørsel
-- arkiverer alt, der allerede ligger i feedet, uden at sende noget.
create table if not exists public.recalls (
  id uuid primary key default gen_random_uuid(),
  source_url text not null unique,
  title text not null,
  published_at timestamptz,
  intro text not null default '',
  affected text not null default '',
  reason text not null default '',
  action text not null default '',
  eans text[] not null default '{}',
  unverified_eans text[] not null default '{}',
  status text not null default 'needs_review' check (status in ('archived','ready','needs_review','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recalls_status_idx on public.recalls (status, published_at desc);

alter table public.recalls enable row level security;
revoke all on public.recalls from anon, authenticated;
grant select on public.recalls to authenticated;
drop policy if exists recalls_admin_select on public.recalls;
create policy recalls_admin_select on public.recalls for select to authenticated using (public.is_admin((select auth.uid())));
comment on table public.recalls is 'Tilbagekaldelser fra foedevarestyrelsen.dk. Skrives kun af edge-funktionen recalls-sync (service-role); admin kan læse.';

create or replace function public.sync_recalls()
returns void language plpgsql security definer set search_path = public as $$
declare v_key text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
  perform net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/recalls-sync',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;
revoke all on function public.sync_recalls() from public, anon, authenticated;

select cron.schedule('notify-recalls-sync', '7 * * * *', $$select public.sync_recalls()$$);
