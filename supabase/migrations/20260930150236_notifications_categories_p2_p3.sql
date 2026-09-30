-- Notifikationer, trin 3b/3c: nye kategorier, P2 (invitation udløber) og P3 (delt indkøbsliste) (30. sept. 2026).
--
-- * notification_preferences: fire nye kategorier (product_changes, shared_lists, recalls,
--   onboarding_reminder). notification_enabled() har nu en STANDARD pr. kategori: shared_lists og
--   onboarding_reminder er FRA, indtil brugeren selv slår dem til (udviklerpakken: "manglende rækkers
--   standard til må ikke utilsigtet aktivere dem"); product_changes og recalls er sikkerhedsrelevante og TIL.
-- * notify (service_role) må kalde notification_enabled().
-- * notification_events.available_at: en hændelse kan udskydes (bruges til at samle P3-tilføjelser).
-- * P2: cron finder ventende invitationer med højst 4 timer tilbage (én påmindelse pr. invitation).
-- * P3: trigger på nye varer i en liste, der deles; højst én hændelse pr. liste pr. 30 minutter.

alter table public.notification_preferences drop constraint if exists notification_preferences_category_check;
alter table public.notification_preferences add constraint notification_preferences_category_check
  check (category = any (array['submission_status','missing_product_found','family','feedback','weekly_digest',
                               'product_changes','shared_lists','recalls','onboarding_reminder']::text[]));

create or replace function public.notification_enabled(p_user_id uuid, p_category text, p_channel text)
 returns boolean
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select coalesce(
    (select enabled from notification_preferences
      where user_id = p_user_id and category = p_category and channel = p_channel),
    p_category not in ('shared_lists', 'onboarding_reminder')
  )
$function$;
revoke execute on function public.notification_enabled(uuid, text, text) from public, anon, authenticated;
grant execute on function public.notification_enabled(uuid, text, text) to service_role;
comment on table public.notification_preferences is 'Kun rækker for eksplicit ændrede værdier gemmes (sparse). Mangler en række, gælder kategoriens standard i notification_enabled(): til, undtagen shared_lists og onboarding_reminder (fra).';

alter table public.notification_events add column if not exists available_at timestamp with time zone not null default now();
create index if not exists notification_events_open_available_idx on public.notification_events using btree (available_at) where status = 'pending';

drop function if exists public.enqueue_notification_event(text, text, jsonb);
create or replace function public.enqueue_notification_event(p_key text, p_kind text, p_payload jsonb, p_available_at timestamp with time zone default now())
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into public.notification_events (event_key, kind, payload, available_at)
  values (p_key, p_kind, p_payload, coalesce(p_available_at, now()))
  on conflict (event_key) do nothing;
exception when others then
  begin
    perform public.log_client_error(sqlerrm, null, 'db:enqueue_notification_event', null, null, null, null,
      jsonb_build_object('event_key', p_key, 'kind', p_kind));
  exception when others then null;
  end;
end;
$function$;
revoke execute on function public.enqueue_notification_event(text, text, jsonb, timestamp with time zone) from public, anon, authenticated;
grant execute on function public.enqueue_notification_event(text, text, jsonb, timestamp with time zone) to service_role;

create or replace function public.dispatch_notification_events()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_key text;
begin
  if not exists (select 1 from public.notification_events
                  where status = 'pending' and created_at < now() - interval '15 seconds' and available_at <= now()) then
    return;
  end if;
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
  perform net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/notify',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$function$;

-- ── P2: invitation udløber snart (højst én påmindelse pr. invitation: event_key er unik)
create or replace function public.enqueue_expiring_invites()
 returns void
 language sql
 security definer
 set search_path to 'public'
as $function$
  insert into public.notification_events (event_key, kind, payload)
  select 'invite:' || i.id || ':expiring', 'family_invite_expiring', jsonb_build_object('invite_id', i.id)
    from public.family_invites i
   where i.status = 'pending' and i.invited_by is not null
     and i.expires_at > now() and i.expires_at <= now() + interval '4 hours'
  on conflict (event_key) do nothing;
$function$;
revoke execute on function public.enqueue_expiring_invites() from public, anon, authenticated;
grant execute on function public.enqueue_expiring_invites() to service_role;
select cron.schedule('notify-expiring-invites', '*/10 * * * *', $cron$ select public.enqueue_expiring_invites(); $cron$);

-- ── P3: nye varer i en delt liste. Én hændelse pr. liste pr. 30-minutters vindue; sendes 5 min
-- efter den første tilføjelse, så flere varer samles i én besked. notify tæller varerne pr. modtager.
create or replace function public.trg_notify_list_item_added()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_bucket bigint;
begin
  if NEW.list_id is null or NEW.added_by is null then return NEW; end if;
  -- Kun lister, der deles med nogen andre end den, der tilføjede varen
  if not exists (select 1 from public.shopping_list_access a where a.list_id = NEW.list_id and a.user_id <> NEW.added_by)
     and not exists (select 1 from public.shopping_lists l where l.id = NEW.list_id and l.owner_id is distinct from NEW.added_by) then
    return NEW;
  end if;
  v_bucket := floor(extract(epoch from now()) / 1800);
  perform public.enqueue_notification_event(
    'list:' || NEW.list_id || ':' || v_bucket, 'list_items_added',
    jsonb_build_object('list_id', NEW.list_id, 'window_start', to_char(to_timestamp(v_bucket * 1800) at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
    now() + interval '5 minutes');
  return NEW;
end;
$function$;
drop trigger if exists notify_list_item_added on public.shopping_list_items;
create trigger notify_list_item_added after insert on public.shopping_list_items
  for each row execute function public.trg_notify_list_item_added();
