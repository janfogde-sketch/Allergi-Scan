-- Skrivevej til to do-listen uden migrationsfiler (Jan, 14. okt. 2026).
-- Workflowet "Skriv til to do" kalder kun denne funktion. Den kan oprette og rette opgaver og oprette kommentarer
-- i admin_todos og admin_todo_comments, og intet andet: ingen sletning, ingen andre tabeller, ingen fri SQL.
-- Alle handlinger i ét kald køres som én helhed (fejler én, rulles alle tilbage).
create or replace function public.todo_apply(p jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  o jsonb;
  res jsonb := '[]'::jsonb;
  v_id uuid;
  v_assignee uuid;
  v_n int;
begin
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
  return res;
end;
$$;

-- Kun databasens ejer (som workflowet bruger) og service_role må kalde den; ikke appens brugere.
revoke all on function public.todo_apply(jsonb) from public, anon, authenticated;
grant execute on function public.todo_apply(jsonb) to service_role;
