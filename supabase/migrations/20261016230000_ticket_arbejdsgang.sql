-- Tickets som arbejdsredskab (16. okt. 2026): prioritet, lanceringsblokering, verificering og tjekliste, uden at røre feedback_tickets (brugerne kan læse deres egne tickets, så interne felter
-- ligger i egne tabeller kun for administratorer). Ansvarlig, status, kommentarer og statushistorik bruger fortsat den tilknyttede to do (admin_todos, admin_todo_comments,
-- admin_todo_activity), så der ikke opstår et parallelt system. Ingen eksisterende data ændres; tickets uden række i ticket_meta har prioritet "normal" og ingen blokering.
create table if not exists public.ticket_meta (
  ticket_id uuid primary key references public.feedback_tickets(id) on delete cascade,
  priority text not null default 'normal' check (priority in ('critical', 'high', 'normal', 'low')),
  launch_blocking boolean not null default false,
  requires_review boolean not null default false,
  implemented_at timestamptz,
  tested_at timestamptz,
  reviewed_at timestamptz,
  test_note text check (test_note is null or char_length(test_note) <= 1000),
  updated_at timestamptz not null default now()
);
create table if not exists public.ticket_meta_log (
  id bigint generated always as identity primary key,
  ticket_id uuid not null references public.feedback_tickets(id) on delete cascade,
  created_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null,
  field text not null check (field in ('priority', 'launch_blocking', 'requires_review', 'implemented', 'tested', 'reviewed')),
  old_value text,
  new_value text
);
create index if not exists ticket_meta_log_ticket_idx on public.ticket_meta_log (ticket_id, created_at);
create index if not exists ticket_meta_log_changed_by_idx on public.ticket_meta_log (changed_by);
create table if not exists public.ticket_tasks (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.feedback_tickets(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  position integer not null default 0,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  done_at timestamptz
);
create index if not exists ticket_tasks_ticket_idx on public.ticket_tasks (ticket_id, position, created_at);
create index if not exists ticket_tasks_created_by_idx on public.ticket_tasks (created_by);

alter table public.ticket_meta enable row level security;
alter table public.ticket_meta_log enable row level security;
alter table public.ticket_tasks enable row level security;
revoke all on public.ticket_meta, public.ticket_meta_log, public.ticket_tasks from public, anon, authenticated;
grant select, insert, update on public.ticket_meta to authenticated;
grant select on public.ticket_meta_log to authenticated;
grant select, insert, update, delete on public.ticket_tasks to authenticated;

create policy ticket_meta_select on public.ticket_meta for select to authenticated using (public.is_admin((select auth.uid())));
create policy ticket_meta_insert on public.ticket_meta for insert to authenticated with check (public.is_admin((select auth.uid())));
create policy ticket_meta_update on public.ticket_meta for update to authenticated using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy ticket_meta_log_select on public.ticket_meta_log for select to authenticated using (public.is_admin((select auth.uid())));
create policy ticket_tasks_select on public.ticket_tasks for select to authenticated using (public.is_admin((select auth.uid())));
create policy ticket_tasks_insert on public.ticket_tasks for insert to authenticated
  with check (public.is_admin((select auth.uid())) and (created_by is null or created_by = (select auth.uid())));
create policy ticket_tasks_update on public.ticket_tasks for update to authenticated using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy ticket_tasks_delete on public.ticket_tasks for delete to authenticated using (public.is_admin((select auth.uid())));

-- Loggen kan ikke rettes (kun triggeren skriver)
create or replace function public.trg_ticket_meta_log_readonly()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'Ticket-historikken kan ikke ændres';
end;
$$;
revoke all on function public.trg_ticket_meta_log_readonly() from public, anon, authenticated;
create trigger ticket_meta_log_readonly before update on public.ticket_meta_log for each row execute function public.trg_ticket_meta_log_readonly();

-- Ændringer logges (hvem, hvad, før/efter), og prioriteten spejles ned i den tilknyttede to do (kritisk og høj = høj), så de to lister ikke modsiger hinanden
create or replace function public.trg_ticket_meta_changed()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.trg_ticket_meta_changed() from public, anon, authenticated;
create trigger ticket_meta_before before insert or update on public.ticket_meta for each row execute function public.trg_ticket_meta_changed();

create or replace function public.trg_ticket_meta_logged()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_by uuid := (select auth.uid());
  v_old jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else jsonb_build_object('priority', 'normal', 'launch_blocking', false, 'requires_review', false) end;
  v_new jsonb := to_jsonb(new);
  f text;
begin
  foreach f in array array['priority', 'launch_blocking', 'requires_review'] loop
    if (v_old ->> f) is distinct from (v_new ->> f) then
      insert into public.ticket_meta_log (ticket_id, changed_by, field, old_value, new_value) values (new.ticket_id, v_by, f, v_old ->> f, v_new ->> f);
    end if;
  end loop;
  foreach f in array array['implemented', 'tested', 'reviewed'] loop
    if ((v_old ->> (f || '_at')) is null) is distinct from ((v_new ->> (f || '_at')) is null) then
      insert into public.ticket_meta_log (ticket_id, changed_by, field, old_value, new_value)
        values (new.ticket_id, v_by, f, case when v_old ->> (f || '_at') is null then 'nej' else 'ja' end, case when v_new ->> (f || '_at') is null then 'nej' else 'ja' end);
    end if;
  end loop;
  if (v_old ->> 'priority') is distinct from (v_new ->> 'priority') then
    update public.admin_todos set priority = case new.priority when 'critical' then 'high' when 'high' then 'high' when 'low' then 'low' else 'normal' end
      where ticket_id = new.ticket_id and priority is distinct from case new.priority when 'critical' then 'high' when 'high' then 'high' when 'low' then 'low' else 'normal' end;
  end if;
  return new;
end;
$$;
revoke all on function public.trg_ticket_meta_logged() from public, anon, authenticated;
create trigger ticket_meta_after after insert or update on public.ticket_meta for each row execute function public.trg_ticket_meta_logged();

-- Tjekliste: tidspunkt for afslutning
create or replace function public.trg_ticket_task_done()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.done_at := case when new.status = 'done' then coalesce(old.done_at, now()) else null end;
  return new;
end;
$$;
revoke all on function public.trg_ticket_task_done() from public, anon, authenticated;
create trigger ticket_task_done before update on public.ticket_tasks for each row execute function public.trg_ticket_task_done();
