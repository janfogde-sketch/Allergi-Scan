-- Sammenfletning af tickets og to do-listen (1. okt. 2026).
-- Hver ticket får en opgave på den fælles to do-liste (admin_todos.ticket_id) med spor, prioritet og
-- ansvarlig ud fra indholdet. Status følger med begge veje: en færdig opgave løser tickets, og en løst
-- ticket afslutter opgaven. (At løse en ticket sender som før en besked til indsenderen via notify.)

alter table public.admin_todos
  add column if not exists ticket_id uuid unique references public.feedback_tickets(id) on delete cascade;
comment on column public.admin_todos.ticket_id is 'Den ticket, opgaven kommer fra. Status holdes ens med feedback_tickets (se triggerne ticket_to_todo_*).';

-- Admin-konto ud fra e-mailens første del (bho = Bjørn, jafo = Jan).
create or replace function public._admin_id(p_prefix text)
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.users where role = 'admin' and email ilike p_prefix || '@%' order by created_at limit 1
$$;

-- Spor, prioritet og ansvarlig ud fra tickettens type og tekst (enkle nøgleord; kan rettes i To do bagefter).
create or replace function public.classify_ticket(p_type text, p_text text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  t text := lower(coalesce(p_text, ''));
  v_track text; v_prio text;
begin
  if t ~ '(^|[^a-zæøå])test([^a-zæøå]|$)' then v_track := 'test';
  elsif p_type = 'content' then v_track := 'drift';
  elsif p_type = 'ui' or t ~ '(farve|layout|knap|skrift|ikon|design|baggrund|placering|prik|menu|animation|afstand|logo|se ud|ser ud|vises forkert)' then v_track := 'design';
  else v_track := 'backend';
  end if;

  if p_type = 'crash' or t ~ '(crash|hvid skærm|hvide skærm|kan ikke|virker ikke|forsvundet|mistet|logge ind|login|sikkerhed|lækage|haster|alvorlig|fejlmeddelelse)' then v_prio := 'high';
  elsif p_type = 'suggestion' or t ~ '(kunne være|ønsker|forslag|ville være|måske)' then v_prio := 'low';
  else v_prio := 'normal';
  end if;

  return jsonb_build_object('track', v_track, 'priority', v_prio,
    'assignee_id', case when v_track = 'design' then public._admin_id('bho') else public._admin_id('jafo') end);
end;
$$;

create or replace function public.ticket_todo_status(p_ticket_status text) returns text language sql immutable as $$
  select case p_ticket_status when 'resolved' then 'done' when 'closed' then 'done' when 'in_progress' then 'doing' else 'todo' end
$$;
create or replace function public.todo_ticket_status(p_todo_status text) returns text language sql immutable as $$
  select case p_todo_status when 'done' then 'resolved' when 'doing' then 'in_progress' else 'open' end
$$;

create or replace function public.create_todo_for_ticket(p_ticket_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  tk public.feedback_tickets;
  c jsonb; v_first text; v_title text; v_ctx text;
begin
  select * into tk from public.feedback_tickets where id = p_ticket_id;
  if not found or exists (select 1 from public.admin_todos where ticket_id = p_ticket_id) then return; end if;
  c := public.classify_ticket(tk.type, tk.description);
  v_first := btrim(split_part(btrim(coalesce(tk.description, '')), E'\n', 1));
  v_title := left('Ticket: ' || coalesce(nullif(v_first, ''), '(' || tk.type || ')'), 200);
  v_ctx := coalesce(nullif(tk.context ->> 'screen', ''), nullif(tk.context ->> 'page', ''));
  insert into public.admin_todos (title, description, status, priority, track, assignee_id, ticket_id, created_by)
  values (v_title,
          left(tk.description || E'\n\nType: ' || tk.type || coalesce(E'\nSide: ' || v_ctx, ''), 4000),
          public.ticket_todo_status(tk.status), c ->> 'priority', c ->> 'track', nullif(c ->> 'assignee_id', '')::uuid,
          tk.id, null);
end;
$$;

-- Ny ticket → ny opgave. Må aldrig blokere, at en bruger kan sende feedback.
create or replace function public.trg_ticket_to_todo_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.create_todo_for_ticket(NEW.id);
  exception when others then
    begin
      perform public.log_client_error('Ticket kunne ikke lægges på to do-listen: ' || sqlerrm, 'db:ticket_to_todo', jsonb_build_object('ticket_id', NEW.id));
    exception when others then null;
    end;
  end;
  return NEW;
end;
$$;

-- Ticket-status ændres → opgaven følger med (oprettes, hvis den mangler, fx en genåbnet gammel ticket).
create or replace function public.trg_ticket_to_todo_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.admin_todos set status = public.ticket_todo_status(NEW.status)
   where ticket_id = NEW.id and public.todo_ticket_status(status) is distinct from NEW.status
     and not (NEW.status = 'closed' and status = 'done');
  if not exists (select 1 from public.admin_todos where ticket_id = NEW.id) then
    perform public.create_todo_for_ticket(NEW.id);
  end if;
  return NEW;
end;
$$;

-- Opgavens status ændres → tickets følger med.
create or replace function public.trg_todo_to_ticket_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.feedback_tickets set status = public.todo_ticket_status(NEW.status)
   where id = NEW.ticket_id and status is distinct from public.todo_ticket_status(NEW.status)
     and not (status = 'closed' and NEW.status = 'done');
  return NEW;
end;
$$;

drop trigger if exists ticket_to_todo_insert on public.feedback_tickets;
create trigger ticket_to_todo_insert after insert on public.feedback_tickets
  for each row execute function public.trg_ticket_to_todo_insert();
drop trigger if exists ticket_to_todo_status on public.feedback_tickets;
create trigger ticket_to_todo_status after update of status on public.feedback_tickets
  for each row when (old.status is distinct from new.status) execute function public.trg_ticket_to_todo_status();
drop trigger if exists todo_to_ticket_status on public.admin_todos;
create trigger todo_to_ticket_status after update of status on public.admin_todos
  for each row when (new.ticket_id is not null and old.status is distinct from new.status) execute function public.trg_todo_to_ticket_status();

revoke all on function public._admin_id(text), public.classify_ticket(text, text), public.ticket_todo_status(text),
  public.todo_ticket_status(text), public.create_todo_for_ticket(uuid), public.trg_ticket_to_todo_insert(),
  public.trg_ticket_to_todo_status(), public.trg_todo_to_ticket_status() from public, anon, authenticated;
grant execute on function public.ticket_todo_status(text), public.todo_ticket_status(text) to authenticated;

-- Eksisterende åbne tickets lægges på listen (løste og lukkede følger først med, hvis de genåbnes).
select public.create_todo_for_ticket(id) from public.feedback_tickets where status in ('open', 'in_progress');
