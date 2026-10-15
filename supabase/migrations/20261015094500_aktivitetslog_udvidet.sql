-- Aktivitetsloggen får mere med (Jan ja 15. okt. 2026; plan eatsafe/plan-aktivitetslog-2026-10-15.md, del A).
-- 1) Før/efter pr. felt for indhold (produkter, leksikon, push-tekster). Brugerprofiler, allergier og familie logger stadig kun
--    feltnavne/antal, aldrig værdier (helbredsdata, art. 9). Lange værdier afkortes til 500 tegn.
-- 2) Oprettelser af produkter og leksikonposter logges; leksikonrettelser logges nu også (før kun sletning).
-- 3) Kolonnen outcome (ok / mislykket / afvist) og log_admin_event(), som kun service-nøglen må kalde (edge-funktionerne, del B).
--    Afviste forsøg logges højst én gang pr. bruger, handling og funktion i timen.
-- 4) Opbevaring: admins handlinger 12 måneder (uændret); afviste forsøg og mislykkede handlinger 90 dage.

-- 3) outcome ---------------------------------------------------------------------------------------------------------------
alter table public.admin_audit_log add column if not exists outcome text not null default 'ok';
alter table public.admin_audit_log drop constraint if exists admin_audit_log_outcome_check;
alter table public.admin_audit_log add constraint admin_audit_log_outcome_check check (outcome in ('ok', 'mislykket', 'afvist'));
create index if not exists admin_audit_log_outcome_idx on public.admin_audit_log (outcome, created_at desc) where outcome <> 'ok';

-- Afkorter en logværdi til højst 500 tegn (tekst beholdes som tekst; lister og objekter bliver til afkortet tekst).
create or replace function public.audit_short(v jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select case
    when v is null then null
    when jsonb_typeof(v) = 'string' and length(v #>> '{}') > 500 then to_jsonb(left(v #>> '{}', 500) || '…')
    when jsonb_typeof(v) <> 'string' and length(v::text) > 500 then to_jsonb(left(v::text, 500) || '…')
    else v
  end
$$;
revoke all on function public.audit_short(jsonb) from public, anon, authenticated;

-- 1) + 2) Felt-triggeren: værdier kun for indholdstabeller; titel på leksikonposter.
create or replace function public.trg_admin_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := (select auth.uid());
  v_old jsonb; v_new jsonb; v_row jsonb; v_fields text[]; v_details jsonb := '{}'::jsonb;
begin
  if v_admin is null or not public.is_admin(v_admin) then
    return coalesce(new, old);
  end if;
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old); end if;
  if tg_op in ('UPDATE', 'INSERT') then v_new := to_jsonb(new); end if;
  v_row := coalesce(v_new, v_old);
  if (nullif(tg_argv[1], '') is not null and v_row ->> tg_argv[1] = v_admin::text)
     or (nullif(tg_argv[2], '') is not null and v_row ->> tg_argv[2] = v_admin::text) then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' then
    select array_agg(k order by k) into v_fields
      from jsonb_object_keys(v_new) as k
      where k not in ('updated_at', 'role', 'reparsed_at', 'inactivity_warned_at', 'welcome_sent_at', 'onboarding_step')
        and (v_old -> k) is distinct from (v_new -> k);
    if v_fields is null then return new; end if;
    v_details := jsonb_build_object('felter', to_jsonb(v_fields));
    -- Kun indhold får værdier med; aldrig brugerprofiler eller familie
    if tg_table_name in ('products', 'knowledge_base', 'notification_push_overrides') then
      v_details := v_details || jsonb_build_object('aendringer', (
        select jsonb_agg(jsonb_build_object('felt', f, 'fra', public.audit_short(v_old -> f), 'til', public.audit_short(v_new -> f)) order by f)
          from unnest(v_fields) as f));
    end if;
  end if;
  if tg_table_name = 'products' then
    v_details := v_details || jsonb_build_object('navn', v_row ->> 'name', 'ean', v_row ->> 'ean');
  elsif tg_table_name = 'knowledge_base' then
    v_details := v_details || jsonb_build_object('navn', v_row ->> 'title');
  elsif tg_table_name = 'notification_push_overrides' and v_new is not null then
    v_details := v_details || jsonb_build_object('titel', v_new ->> 'title', 'tekst', v_new ->> 'body');
  end if;
  insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
    values (v_admin, tg_argv[0], tg_table_name, coalesce(v_row ->> 'id', v_row ->> 'key'), nullif(v_details, '{}'::jsonb));
  return coalesce(new, old);
end;
$$;
revoke all on function public.trg_admin_audit_fields() from public, anon, authenticated;

drop trigger if exists audit_products_insert on public.products;
create trigger audit_products_insert after insert on public.products
  for each row execute function public.trg_admin_audit_fields('produkt_oprettet');
drop trigger if exists audit_knowledge_insert on public.knowledge_base;
create trigger audit_knowledge_insert after insert on public.knowledge_base
  for each row execute function public.trg_admin_audit_fields('vidensindgang_oprettet');
drop trigger if exists audit_knowledge_update on public.knowledge_base;
create trigger audit_knowledge_update after update on public.knowledge_base
  for each row execute function public.trg_admin_audit_fields('vidensindgang_rettet');
-- Sletning af en leksikonpost får titlen med (samme handling som før)
drop trigger if exists audit_knowledge_delete on public.knowledge_base;
create trigger audit_knowledge_delete after delete on public.knowledge_base
  for each row execute function public.trg_admin_audit_fields('vidensindgang_slettet');

-- 3) Logning fra edge-funktionerne (service-nøglen). Returnerer true, når der er skrevet en række.
create or replace function public.log_admin_event(
  p_actor uuid,
  p_action text,
  p_target_table text,
  p_target_id text default null,
  p_details jsonb default null,
  p_outcome text default 'ok'
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_action is null or p_target_table is null then
    raise exception 'Handling og mål skal angives';
  end if;
  if p_outcome = 'afvist' and exists (
    select 1 from public.admin_audit_log
     where outcome = 'afvist' and admin_id is not distinct from p_actor and action = p_action
       and details ->> 'funktion' is not distinct from p_details ->> 'funktion'
       and created_at > now() - interval '1 hour'
  ) then
    return false;
  end if;
  insert into public.admin_audit_log (admin_id, action, target_table, target_id, details, outcome)
    values (p_actor, p_action, p_target_table, p_target_id, p_details, coalesce(p_outcome, 'ok'));
  return true;
end;
$$;
revoke all on function public.log_admin_event(uuid, text, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.log_admin_event(uuid, text, text, text, jsonb, text) to service_role;

-- 4) Opbevaring (resten uændret fra 20261015083000)
create or replace function public.cleanup_notifications()
returns void
language sql
security definer
set search_path to 'public'
as $function$
  delete from public.notifications where created_at < now() - interval '12 months';
  delete from public.notification_events where created_at < now() - interval '90 days' and status <> 'pending';
  delete from public.client_errors where last_seen < now() - interval '90 days';
  delete from public.security_reports where created_at < now() - interval '12 months';
  delete from public.api_usage where day < current_date - 30;
  delete from public.api_usage_global where day < current_date - 30;
  delete from public.scan_history where scanned_at < now() - interval '24 months';
  delete from public.search_selections where created_at < now() - interval '12 months';
  delete from public.feedback_tickets where submitted_by is null and created_at < now() - interval '12 months';
  delete from public.feedback_tickets where submitted_by is not null and status = 'resolved' and created_at < now() - interval '12 months';
  delete from public.submissions where status in ('approved', 'rejected') and reviewed_at < now() - interval '12 months';
  delete from auth.sessions where coalesce(refreshed_at at time zone 'UTC', updated_at, created_at) < now() - interval '6 months';
  delete from public.admin_audit_log where created_at < now() - interval '12 months';
  delete from public.admin_audit_log where outcome <> 'ok' and created_at < now() - interval '90 days';
  delete from public.admin_todo_activity where created_at < now() - interval '12 months';
$function$;
