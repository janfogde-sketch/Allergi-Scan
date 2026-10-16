-- Tilbagekaldelser: administration, sporbarhed og sikrere opslag (16. okt. 2026). Additiv: ingen eksisterende kolonne, status eller besked-flow ændres.
--  * recalls: den fulde originale tekst (raw_text) og tidspunkt for seneste læsning af kilden (source_checked_at)
--  * recall_events: hændelseslog (import, opdatering, produktmatch, varsling lagt i kø, arkivering, annullering, synkroniseringsfejl), kan ikke rettes
--  * recall_matches: administratorens afgørelse pr. stregkode (bekræftet / muligt / ikke omfattet) med begrundelse og hvem der besluttede det
--  * import_runs accepterer jobbet recalls_sync, så den daglige synkronisering får samme kørselslog som import
--  * admin_resolve_recall logger hændelsen og afgørelsen; admin_set_recall_match registrerer matchafgørelser; admin_recall_notification_stats tæller varslinger uden personoplysninger
--  * active_recalls_for_ean sammenligner stregkoder med/uden foranstillede nuller (som varslingen allerede gør), så en scanning ikke går glip af en tilbagekaldelse pga. skrivemåden
alter table public.recalls add column if not exists raw_text text;
alter table public.recalls add column if not exists source_checked_at timestamptz;

alter table public.import_runs drop constraint if exists import_runs_job_check;
alter table public.import_runs add constraint import_runs_job_check check (job in ('off_import', 'reanalyze', 'recalls_sync'));

create table if not exists public.recall_events (
  id bigint generated always as identity primary key,
  recall_id uuid not null references public.recalls(id) on delete cascade,
  created_at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('imported', 'updated', 'linked', 'archived', 'cancelled', 'match_decided', 'sync_error', 'note')),
  details jsonb not null default '{}'::jsonb
);
create index if not exists recall_events_recall_idx on public.recall_events (recall_id, created_at);
create index if not exists recall_events_actor_idx on public.recall_events (actor_id);

create table if not exists public.recall_matches (
  id uuid primary key default gen_random_uuid(),
  recall_id uuid not null references public.recalls(id) on delete cascade,
  ean text not null,
  level text not null check (level in ('confirmed', 'possible', 'not_covered')),
  basis text not null check (char_length(btrim(basis)) between 5 and 1000),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz not null default now(),
  unique (recall_id, ean)
);
create index if not exists recall_matches_decided_by_idx on public.recall_matches (decided_by);

alter table public.recall_events enable row level security;
alter table public.recall_matches enable row level security;
revoke all on public.recall_events, public.recall_matches from public, anon, authenticated;
grant select on public.recall_events, public.recall_matches to authenticated;
create policy recall_events_admin_select on public.recall_events for select to authenticated using (public.is_admin((select auth.uid())));
create policy recall_matches_admin_select on public.recall_matches for select to authenticated using (public.is_admin((select auth.uid())));

create or replace function public.trg_recall_events_readonly()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'Tilbagekaldelsernes historik kan ikke ændres';
end;
$$;
revoke all on function public.trg_recall_events_readonly() from public, anon, authenticated;
create trigger recall_events_readonly before update on public.recall_events for each row execute function public.trg_recall_events_readonly();

-- Afgør en tilbagekaldelse (som før), men logger hændelsen med hvem og hvorfor, og gemmer valgte stregkoder som bekræftede matches med begrundelsen.
drop function if exists public.admin_resolve_recall(uuid, text, text[]);
create or replace function public.admin_resolve_recall(p_recall_id uuid, p_action text, p_eans text[] default '{}', p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_admin uuid := (select auth.uid());
  v_row public.recalls;
  v_eans text[];
  v_ean text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not public.is_admin(v_admin) then raise exception 'Kun administratorer'; end if;
  if p_action not in ('link', 'archive', 'cancel') then raise exception 'Ukendt handling: %', p_action; end if;
  select * into v_row from public.recalls where id = p_recall_id for update;
  if not found then raise exception 'Tilbagekaldelsen findes ikke'; end if;
  if v_row.status <> 'needs_review' then
    raise exception 'Kun tilbagekaldelser, der afventer gennemgang, kan afgøres (status er %)', v_row.status;
  end if;

  if p_action = 'link' then
    select coalesce(array_agg(distinct regexp_replace(e, '\D', '', 'g')), '{}') into v_eans from unnest(coalesce(p_eans, '{}')) e;
    if cardinality(v_eans) = 0 then raise exception 'Vælg mindst ét produkt'; end if;
    foreach v_ean in array v_eans loop
      if not public.is_valid_gtin(v_ean) then raise exception 'Ugyldig stregkode: %', v_ean; end if;
      if not exists (select 1 from public.products where ean = any (public.ean_variants(v_ean))) then
        raise exception 'Stregkoden % findes ikke i produktkataloget', v_ean;
      end if;
      insert into public.recall_matches (recall_id, ean, level, basis, decided_by)
        values (p_recall_id, v_ean, 'confirmed', coalesce(v_note, 'Produkt valgt af administrator ved gennemgang af tilbagekaldelsen'), v_admin)
        on conflict (recall_id, ean) do update set level = excluded.level, basis = excluded.basis, decided_by = excluded.decided_by, decided_at = now();
    end loop;
    update public.recalls set eans = v_eans, status = 'ready', updated_at = now() where id = p_recall_id;
    insert into public.notification_events (event_key, kind, payload, available_at)
    values ('p6:' || p_recall_id, 'recall_published', jsonb_build_object('recall_id', p_recall_id), now())
    on conflict (event_key) do nothing;
    insert into public.recall_events (recall_id, actor_id, kind, details)
      values (p_recall_id, v_admin, 'linked', jsonb_build_object('eans', to_jsonb(v_eans), 'note', v_note, 'varsling', 'lagt i kø'));
    return jsonb_build_object('status', 'ready', 'eans', to_jsonb(v_eans));
  elsif p_action = 'archive' then
    update public.recalls set status = 'archived', updated_at = now() where id = p_recall_id;
    insert into public.recall_events (recall_id, actor_id, kind, details) values (p_recall_id, v_admin, 'archived', jsonb_build_object('note', v_note, 'ingen_besked', true));
    return jsonb_build_object('status', 'archived');
  else
    update public.recalls set status = 'cancelled', updated_at = now() where id = p_recall_id;
    insert into public.recall_events (recall_id, actor_id, kind, details) values (p_recall_id, v_admin, 'cancelled', jsonb_build_object('note', v_note, 'ingen_besked', true));
    return jsonb_build_object('status', 'cancelled');
  end if;
end;
$$;
revoke all on function public.admin_resolve_recall(uuid, text, text[], text) from public, anon;
grant execute on function public.admin_resolve_recall(uuid, text, text[], text) to authenticated;

-- Matchafgørelse pr. stregkode. "Ikke omfattet" kræver en begrundelse; intet ændrer status eller sender noget.
create or replace function public.admin_set_recall_match(p_recall uuid, p_ean text, p_level text, p_basis text)
returns void language plpgsql security definer set search_path = public as $$
declare v_admin uuid := (select auth.uid()); v_ean text := regexp_replace(coalesce(p_ean, ''), '\D', '', 'g');
begin
  if not public.is_admin(v_admin) then raise exception 'Kun administratorer' using errcode = '42501'; end if;
  if p_level not in ('confirmed', 'possible', 'not_covered') then raise exception 'Ugyldigt matchniveau' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_basis, ''))) < 5 then raise exception 'Begrundelse mangler' using errcode = '22023'; end if;
  if v_ean = '' or not exists (select 1 from public.recalls where id = p_recall) then raise exception 'Tilbagekaldelse eller stregkode findes ikke' using errcode = 'P0002'; end if;
  insert into public.recall_matches (recall_id, ean, level, basis, decided_by) values (p_recall, v_ean, p_level, btrim(p_basis), v_admin)
    on conflict (recall_id, ean) do update set level = excluded.level, basis = excluded.basis, decided_by = excluded.decided_by, decided_at = now();
  insert into public.recall_events (recall_id, actor_id, kind, details) values (p_recall, v_admin, 'match_decided', jsonb_build_object('ean', v_ean, 'niveau', p_level, 'begrundelse', btrim(p_basis)));
end;
$$;
revoke all on function public.admin_set_recall_match(uuid, text, text, text) from public, anon;
grant execute on function public.admin_set_recall_match(uuid, text, text, text) to authenticated;

-- Varslinger for én tilbagekaldelse: kun tal. "Afsendt" betyder accepteret af push-/mailtjenesten; levering til telefonen bekræftes ikke af tjenesterne og kan ikke opgøres.
create or replace function public.admin_recall_notification_stats(p_recall uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'Kun administratorer' using errcode = '42501'; end if;
  return jsonb_build_object(
    'recipients', (select count(distinct user_id) from public.notifications where type = 'P6' and entity_type = 'recall' and entity_id = p_recall::text),
    'by_variant', coalesce((select jsonb_object_agg(variant, n) from (select variant, count(*) n from public.notifications where type = 'P6' and entity_type = 'recall' and entity_id = p_recall::text group by variant) v), '{}'::jsonb),
    'deliveries', coalesce((select jsonb_agg(jsonb_build_object('channel', channel, 'status', status, 'count', n)) from (
        select d.channel, d.status, count(*) n from public.notifications x join public.notification_deliveries d on d.notification_id = x.id
         where x.type = 'P6' and x.entity_type = 'recall' and x.entity_id = p_recall::text group by d.channel, d.status) q), '[]'::jsonb),
    'queued', (select jsonb_build_object('kind', e.kind, 'status', e.status, 'attempts', e.attempts) from public.notification_events e where e.event_key = 'p6:' || p_recall::text limit 1)
  );
end;
$$;
revoke all on function public.admin_recall_notification_stats(uuid) from public, anon;
grant execute on function public.admin_recall_notification_stats(uuid) to authenticated;

-- Scanneren: samme krav som før (ikke annulleret, seneste 60 dage), men stregkoder sammenlignes med/uden foranstillede nuller. Arkivering påvirker ikke opslaget.
create or replace function public.active_recalls_for_ean(p_ean text)
returns table (title text, published_at timestamptz, affected text, reason text, action text, source_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.title, r.published_at, r.affected, r.reason, r.action, r.source_url
    from public.recalls r
   where p_ean ~ '^[0-9]{8,14}$'
     and r.eans && public.ean_variants(p_ean)
     and r.status in ('ready', 'archived')
     and r.published_at >= now() - interval '60 days'
   order by r.published_at desc
   limit 3
$$;
revoke execute on function public.active_recalls_for_ean(text) from public;
grant execute on function public.active_recalls_for_ean(text) to anon, authenticated;
