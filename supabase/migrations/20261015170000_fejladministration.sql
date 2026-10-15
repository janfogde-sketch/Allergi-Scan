-- Fejladministration (Bjørn, 15. okt. 2026; planen er godkendt i tråden). Bagudkompatibel: appen og admin kan køre uændret, mens migrationen ligger.
-- 1) Alvorlighed (sættes manuelt af en admin, aldrig automatisk), begrundelse ved ignorering, antal genåbninger og berørte appversioner.
-- 2) Statusskift logges i adminloggen (hvem, hvornår, fra og til, begrundelse). Ignorering kræver en begrundelse, også i databasen.
-- 3) log_client_error() får et stabilt fingeraftryk (kilde, normaliseret besked, skærm), så samme årsag ikke bliver til nye grupper ved hver build
--    eller i hvert browserformat, og nye regler: en ignoreret fejl forbliver ignoreret (men tælles), en løst fejl genåbnes ved en ny forekomst
--    (tælles og logges som automatisk genåbning), og en åben fejl samles uden tidsgrænse. Gamle grupper røres ikke, så ingen historik mistes.
-- 4) admin_error_stats(): tal til fanerne og statistikken (kun admin).

alter table public.client_errors add column if not exists severity text;
alter table public.client_errors drop constraint if exists client_errors_severity_check;
alter table public.client_errors add constraint client_errors_severity_check check (severity is null or severity in ('critical', 'high', 'medium', 'low'));
alter table public.client_errors add column if not exists status_reason text;
alter table public.client_errors add column if not exists reopen_count integer not null default 0;
alter table public.client_errors add column if not exists app_versions text[] not null default '{}';

-- Normaliseret besked: browserens forskellige formater for samme fejl samles, og adresser, id'er og lange tal fjernes.
create or replace function public.error_message_key(p_message text)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(btrim(
    case
      -- Safari: "undefined is not an object (evaluating 'e._result.default')" og Chrome: "Cannot read properties of undefined (reading 'default')"
      when p_message ~* $q$^(undefined|null) is not an object \(evaluating '[^']*?([A-Za-z0-9_$]+)'\)\Z$q$
        then lower(substring(p_message from $q$^(undefined|null)$q$)) || '-adgang:' || substring(p_message from $q$([A-Za-z0-9_$]+)'\)\Z$q$)
      when p_message ~* $q$^Cannot read propert(y|ies) .* (undefined|null)\M$q$
        then lower(substring(p_message from $q$ of (undefined|null)\M$q$)) || '-adgang:' || coalesce(substring(p_message from $q$\(reading '([^']+)'\)$q$), substring(p_message from $q$property '([^']+)' of$q$), '')
      else regexp_replace(regexp_replace(regexp_replace(p_message,
             'https?://\S+', '<adresse>', 'g'),
             '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', '<id>', 'g'),
             '[0-9]{4,}', '<tal>', 'g')
    end))
$$;
revoke all on function public.error_message_key(text) from public, anon, authenticated;

-- Statusskift: begrundelse ved ignorering, og begrundelsen hører kun til en ignoreret fejl.
create or replace function public.trg_client_errors_status_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'ignored' and btrim(coalesce(new.status_reason, '')) = '' then
      raise exception 'En begrundelse er påkrævet, når en fejl ignoreres' using errcode = '22023';
    end if;
    if new.status <> 'ignored' then new.status_reason := null; end if;
    if new.status = 'ignored' then new.status_reason := left(btrim(new.status_reason), 500); end if;
  end if;
  return new;
end;
$$;
drop trigger if exists client_errors_status_guard on public.client_errors;
create trigger client_errors_status_guard before update on public.client_errors
  for each row execute function public.trg_client_errors_status_guard();

-- Statusskift og ændret alvorlighed logges i adminloggen. En automatisk genåbning (log_client_error) logges uden admin.
create or replace function public.trg_client_errors_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_auto boolean := coalesce(current_setting('app.client_error_auto', true), '') = '1';
begin
  if new.status is distinct from old.status then
    if v_auto then
      insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
        values (null, 'fejl_genaabnet', 'client_errors', new.id::text, jsonb_build_object('fra', old.status, 'til', new.status, 'automatisk', true));
    elsif v_uid is not null and public.is_admin(v_uid) then
      insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
        values (v_uid, 'fejlstatus_aendret', 'client_errors', new.id::text,
                jsonb_strip_nulls(jsonb_build_object('fra', old.status, 'til', new.status, 'begrundelse', new.status_reason)));
    end if;
  end if;
  if new.severity is distinct from old.severity and not v_auto and v_uid is not null and public.is_admin(v_uid) then
    insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
      values (v_uid, 'fejlalvor_aendret', 'client_errors', new.id::text,
              jsonb_build_object('fra', coalesce(old.severity, 'ingen'), 'til', coalesce(new.severity, 'ingen')));
  end if;
  return new;
end;
$$;
revoke all on function public.trg_client_errors_audit() from public, anon, authenticated;
drop trigger if exists client_errors_audit on public.client_errors;
create trigger client_errors_audit after update on public.client_errors
  for each row execute function public.trg_client_errors_audit();

-- Registrering med stabilt fingeraftryk og nye regler (se øverst). Samme signatur som før.
create or replace function public.log_client_error(
  p_message text,
  p_stack text default null,
  p_source text default 'app',
  p_screen text default null,
  p_url text default null,
  p_user_agent text default null,
  p_app_version text default null,
  p_context jsonb default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_message text := left(btrim(coalesce(p_message, '')), 1000);
  v_stack text := left(p_stack, 4000);
  v_source text := left(coalesce(nullif(btrim(p_source), ''), 'app'), 40);
  v_screen text := left(p_screen, 80);
  v_version text := left(p_app_version, 80);
  v_uid uuid := (select auth.uid());
  v_fp text;
  v_row record;
begin
  if v_message = '' then
    return;
  end if;

  v_fp := md5(v_source || '|' || public.error_message_key(v_message) || '|' || coalesce(v_screen, ''));

  select id, status into v_row from client_errors where fingerprint = v_fp order by last_seen desc limit 1;

  if found then
    if v_row.status = 'resolved' then
      perform set_config('app.client_error_auto', '1', true);
    end if;
    update client_errors
       set occurrences = occurrences + 1,
           last_seen = now(),
           user_id = coalesce(user_id, v_uid),
           app_versions = case when v_version is null or v_version = any (app_versions) or coalesce(array_length(app_versions, 1), 0) >= 10
                               then app_versions else app_versions || v_version end,
           status = case when status = 'resolved' then 'open' else status end,
           reopen_count = reopen_count + case when status = 'resolved' then 1 else 0 end
     where id = v_row.id;
    perform set_config('app.client_error_auto', '', true);
    return;
  end if;

  if (select count(*) from client_errors where first_seen > now() - interval '10 minutes') >= 300 then
    return;
  end if;

  insert into client_errors (fingerprint, source, message, stack, screen, url, user_agent, app_version, app_versions, context, user_id)
  values (
    v_fp, v_source, v_message, v_stack,
    v_screen, left(p_url, 500), left(p_user_agent, 300), v_version, case when v_version is null then '{}' else array[v_version] end,
    case when p_context is null or pg_column_size(p_context) > 4000 then null else p_context end,
    v_uid
  );
end;
$function$;
revoke execute on function public.log_client_error(text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.log_client_error(text, text, text, text, text, text, text, jsonb) to anon, authenticated, service_role;

-- Tal til fanerne og statistikken. Kun admin. Antal fejlgrupper (rækker) og antal forekomster holdes adskilt.
create or replace function public.admin_error_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun administratorer' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object(
      'open', count(*) filter (where status = 'open'),
      'resolved', count(*) filter (where status = 'resolved'),
      'ignored', count(*) filter (where status = 'ignored'),
      'total', count(*),
      'occurrences', coalesce(sum(occurrences), 0),
      'new_groups_7d', count(*) filter (where first_seen > now() - interval '7 days'),
      'reopened', count(*) filter (where reopen_count > 0)
    ) from public.client_errors
  );
end;
$$;
revoke all on function public.admin_error_stats() from public, anon;
grant execute on function public.admin_error_stats() to authenticated;
