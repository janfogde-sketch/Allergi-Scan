-- Notifikationer, trin 1: datamodel (30. sept. 2026).
--
-- Grundlag: udviklerpakken "EatSafe-samlet-udviklerpakke", afsnit "Push åbner
-- den fulde besked i appen". Push er kun den korte tekst; den fulde besked
-- gemmes pr. modtager i `notifications` og læses i appen.
--
--   notification_events      holdbar outbox: én række pr. hændelse (skrives af
--                            databasetriggere i samme transaktion som ændringen)
--   notifications            den modtagerspecifikke besked (snapshot af indhold)
--   notification_deliveries  afsendelsesregister pr. besked/kanal/endpoint
--   app_flags                driftsflag, fx om push må sendes (starter FRA)
--
-- Adgang: klienten må KUN læse egne beskeder og markere dem læst via
-- mark_notification_read(). Indhold, modtager og event-id kan ikke ændres af
-- klienten. Alt andet sker med service_role (edge-funktionen `notify`).
-- Kontosletning: beskederne følger med via ON DELETE CASCADE på users.

-- ── Driftsflag ────────────────────────────────────────────────────────────
create table public.app_flags (
  key text primary key,
  value jsonb not null default 'false'::jsonb,
  updated_at timestamp with time zone not null default now()
);
alter table public.app_flags enable row level security;
revoke all on public.app_flags from anon, authenticated;
grant all on public.app_flags to service_role;
comment on table public.app_flags is 'Driftsflag (kun service_role). notifications_push_enabled skal forblive false, til beskedsiden i appen er i produktion og testet.';
insert into public.app_flags (key, value) values ('notifications_push_enabled', 'false'::jsonb);

-- ── Outbox: hændelser ─────────────────────────────────────────────────────
create table public.notification_events (
  id uuid not null default gen_random_uuid() primary key,
  event_key text not null unique,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  created_at timestamp with time zone not null default now(),
  processed_at timestamp with time zone,
  constraint notification_events_status_check check (status = any (array['pending'::text, 'done'::text, 'failed'::text]))
);
create index notification_events_open_idx on public.notification_events using btree (created_at) where status = 'pending';
alter table public.notification_events enable row level security;
revoke all on public.notification_events from anon, authenticated;
grant all on public.notification_events to service_role;
comment on table public.notification_events is 'Holdbar outbox. event_key er stabil pr. hændelse (retries giver samme nøgle). payload indeholder kun id''er, aldrig personoplysninger.';

-- ── Beskeder ──────────────────────────────────────────────────────────────
create table public.notifications (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  event_id uuid references public.notification_events(id) on delete set null,
  event_key text not null,
  type text not null,
  variant text not null default 'default',
  category text not null,
  template_version integer not null,
  title text not null,
  push_body text not null,
  content_blocks jsonb not null,
  entity_type text,
  entity_id text,
  primary_action jsonb,
  event_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  read_at timestamp with time zone,
  expires_at timestamp with time zone,
  constraint notifications_dedup unique (event_key, user_id, type, variant)
);
create index notifications_user_created_idx on public.notifications using btree (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications using btree (user_id) where read_at is null;
create index notifications_event_id_idx on public.notifications using btree (event_id);

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant all on public.notifications to service_role;
create policy notifications_select_own on public.notifications as permissive for select to authenticated
  using (((select auth.uid() as uid) = user_id));
comment on table public.notifications is 'Modtagerspecifik besked (snapshot). Læses kun af modtageren; read_at sættes kun via mark_notification_read().';

-- ── Afsendelsesregister ───────────────────────────────────────────────────
create table public.notification_deliveries (
  id uuid not null default gen_random_uuid() primary key,
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel text not null,
  endpoint text,
  status text not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint notification_deliveries_channel_check check (channel = any (array['push'::text, 'email'::text])),
  constraint notification_deliveries_status_check check (status = any (array['pending'::text, 'sent'::text, 'failed'::text, 'skipped'::text]))
);
create unique index notification_deliveries_uniq on public.notification_deliveries using btree (notification_id, channel, coalesce(endpoint, ''::text));
alter table public.notification_deliveries enable row level security;
revoke all on public.notification_deliveries from anon, authenticated;
grant all on public.notification_deliveries to service_role;
comment on table public.notification_deliveries is 'Afsendelsesregister: én række pr. besked, kanal og endpoint. Forhindrer dobbeltafsendelse ved retries. endpoint er en hash af push-endpointet, aldrig selve adressen.';

-- ── Markér læst (kun egne beskeder, kun read_at) ──────────────────────────
create or replace function public.mark_notification_read(p_id uuid)
 returns timestamp with time zone
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_ts timestamp with time zone;
begin
  update public.notifications
     set read_at = coalesce(read_at, now())
   where id = p_id
     and user_id = (select auth.uid())
  returning read_at into v_ts;
  return v_ts;
end;
$function$;
revoke execute on function public.mark_notification_read(uuid) from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated, service_role;
