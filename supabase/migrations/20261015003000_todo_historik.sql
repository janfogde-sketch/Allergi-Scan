-- Historik på to do-listen (Jan, 14. okt. 2026; to do e910250f, ønsket af Bjørn): hvem ændrede status, prioritet,
-- ansvarlig eller frist på en opgave, og hvornår. Vises i opgavens vindue i admin, adskilt fra kommentarerne.
-- Kun administratorer kan læse historikken; ingen kan skrive, rette eller slette i den via API'et (rækker oprettes kun af
-- triggeren). Ændringer fra workflowet "Skriv til to do" (todo_apply) og fra ticket-synkroniseringen logges også og mærkes.
-- Opbevaring: 12 måneder (cleanup_notifications), og historikken slettes sammen med opgaven. changed_by sættes til tom,
-- når en administrators konto slettes. Indhold: kun feltnavn og gammel/ny værdi af de fire felter (ingen helbredsdata).

create table if not exists public.admin_todo_activity (
  id bigint generated always as identity primary key,
  todo_id uuid not null references public.admin_todos(id) on delete cascade,
  created_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null,
  via text not null check (via in ('admin', 'ticket', 'workflow', 'system')),
  field text not null check (field in ('status', 'priority', 'assignee_id', 'due_date')),
  old_value text,
  new_value text
);
create index if not exists admin_todo_activity_todo_idx on public.admin_todo_activity (todo_id, created_at);
create index if not exists admin_todo_activity_changed_by_idx on public.admin_todo_activity (changed_by);
create index if not exists admin_todo_activity_created_at_idx on public.admin_todo_activity (created_at);

alter table public.admin_todo_activity enable row level security;
revoke all on public.admin_todo_activity from public, anon, authenticated, service_role;
grant select on public.admin_todo_activity to authenticated, service_role;

drop policy if exists "Admin kan læse to do-historik" on public.admin_todo_activity;
create policy "Admin kan læse to do-historik" on public.admin_todo_activity for select to authenticated
  using (public.is_admin((select auth.uid())));

-- Historikken kan ikke rettes bagefter (heller ikke af databasens egne roller); sletning sker kun ved oprydning og sammen med opgaven.
create or replace function public.trg_admin_todo_activity_readonly()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'To do-historikken kan ikke ændres';
end;
$$;
revoke all on function public.trg_admin_todo_activity_readonly() from public, anon, authenticated;
drop trigger if exists admin_todo_activity_readonly on public.admin_todo_activity;
create trigger admin_todo_activity_readonly before update on public.admin_todo_activity
  for each row execute function public.trg_admin_todo_activity_readonly();

-- Trigger på admin_todos: én række pr. ændret felt. Hvem: den indloggede administrator. Hvordan (via):
-- ticket = ændret, fordi ticketten skiftede status; workflow = "Skriv til to do"; admin = i admin-panelet; system = alt andet.
create or replace function public.trg_admin_todo_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_by uuid := (select auth.uid());
  v_via text;
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
  f text;
begin
  v_via := case
    when pg_trigger_depth() > 1 then 'ticket'
    when current_setting('eatsafe.todo_via', true) = 'workflow' then 'workflow'
    when v_by is not null then 'admin'
    else 'system'
  end;
  foreach f in array array['status', 'priority', 'assignee_id', 'due_date'] loop
    if (v_old ->> f) is distinct from (v_new ->> f) then
      insert into public.admin_todo_activity (todo_id, changed_by, via, field, old_value, new_value)
        values (new.id, v_by, v_via, f, v_old ->> f, v_new ->> f);
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function public.trg_admin_todo_activity() from public, anon, authenticated;

drop trigger if exists admin_todo_activity_log on public.admin_todos;
create trigger admin_todo_activity_log after update of status, priority, assignee_id, due_date on public.admin_todos
  for each row execute function public.trg_admin_todo_activity();

-- Workflowet "Skriv til to do": uændret, bortset fra at det mærker sine ændringer, så historikken viser "workflow".
create or replace function public.todo_apply(p jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  o jsonb;
  res jsonb := '[]'::jsonb;
  v_id uuid;
  v_assignee uuid;
  v_n int;
begin
  -- Markerer ændringerne i denne transaktion som lavet af to do-workflowet (vises i opgavens historik)
  perform set_config('eatsafe.todo_via', 'workflow', true);
  if p is null or jsonb_typeof(p -> 'ops') is distinct from 'array' then
    raise exception 'Forventer {"ops":[...]}';
  end if;
  if jsonb_array_length(p -> 'ops') not between 1 and 50 then
    raise exception 'Mellem 1 og 50 handlinger pr. kald';
  end if;
  for o in select value from jsonb_array_elements(p -> 'ops') loop
    if o ->> 'op' = 'create' then
      v_assignee := case when nullif(o ->> 'assignee', '') is null then null else public._admin_id(o ->> 'assignee') end;
      if nullif(o ->> 'assignee', '') is not null and v_assignee is null then
        raise exception 'Ukendt ansvarlig: %', o ->> 'assignee';
      end if;
      insert into admin_todos (title, description, status, priority, track, assignee_id, due_date, link)
      values (o ->> 'title', coalesce(o ->> 'description', ''), coalesce(o ->> 'status', 'todo'),
              coalesce(o ->> 'priority', 'normal'), coalesce(o ->> 'track', 'backend'), v_assignee,
              (o ->> 'due_date')::date, o ->> 'link')
      returning id into v_id;
      res := res || jsonb_build_object('op', 'create', 'id', v_id);
    elsif o ->> 'op' = 'update' then
      if o ? 'assignee' and nullif(o ->> 'assignee', '') is not null then
        v_assignee := public._admin_id(o ->> 'assignee');
        if v_assignee is null then raise exception 'Ukendt ansvarlig: %', o ->> 'assignee'; end if;
      else
        v_assignee := null;
      end if;
      update admin_todos t set
        title = coalesce(o ->> 'title', t.title),
        description = coalesce(o ->> 'description', t.description),
        status = coalesce(o ->> 'status', t.status),
        priority = coalesce(o ->> 'priority', t.priority),
        track = coalesce(o ->> 'track', t.track),
        assignee_id = case when o ? 'assignee' then v_assignee else t.assignee_id end,
        due_date = case when o ? 'due_date' then (o ->> 'due_date')::date else t.due_date end,
        link = case when o ? 'link' then o ->> 'link' else t.link end
      where t.id = (o ->> 'id')::uuid;
      get diagnostics v_n = row_count;
      if v_n <> 1 then raise exception 'Opgaven % findes ikke', o ->> 'id'; end if;
      res := res || jsonb_build_object('op', 'update', 'id', o ->> 'id');
    elsif o ->> 'op' = 'comment' then
      insert into admin_todo_comments (todo_id, body) values ((o ->> 'todo_id')::uuid, o ->> 'body')
      returning id into v_id;
      res := res || jsonb_build_object('op', 'comment', 'id', v_id);
    else
      raise exception 'Ukendt handling: %', o ->> 'op';
    end if;
  end loop;
  perform set_config('eatsafe.todo_via', '', true);
  return res;
end;
$$;

revoke all on function public.todo_apply(jsonb) from public, anon, authenticated;
grant execute on function public.todo_apply(jsonb) to service_role;

-- Opbevaring: 12 måneder (samme funktion som øvrige frister; resten uændret).
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
  delete from public.admin_audit_log where created_at < now() - interval '12 months';
  delete from public.admin_todo_activity where created_at < now() - interval '12 months';
$function$;
