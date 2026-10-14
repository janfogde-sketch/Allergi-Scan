-- Test af public.todo_apply (skrivevejen til to do-listen uden migrationsfiler). Rulles tilbage til sidst.
begin;
do $$
declare
  r jsonb; v_todo uuid; v_status text; v_n int; v_ok boolean;
begin
  -- oprette, kommentere og lukke i ét kald-flow
  r := public.todo_apply('{"ops":[{"op":"create","title":"Test-opgave","description":"x","track":"drift","priority":"high"}]}'::jsonb);
  v_todo := (r -> 0 ->> 'id')::uuid;
  if v_todo is null then raise exception 'FEJL: create gav intet id'; end if;
  perform public.todo_apply(jsonb_build_object('ops', jsonb_build_array(
    jsonb_build_object('op','comment','todo_id',v_todo,'body','Hej'),
    jsonb_build_object('op','update','id',v_todo,'status','done'))));
  select status into v_status from admin_todos where id = v_todo;
  if v_status <> 'done' then raise exception 'FEJL: status %', v_status; end if;
  if (select completed_at from admin_todos where id = v_todo) is null then raise exception 'FEJL: completed_at mangler'; end if;
  select count(*) into v_n from admin_todo_comments where todo_id = v_todo;
  if v_n <> 1 then raise exception 'FEJL: kommentar mangler'; end if;
  -- felter, der ikke er med, bevares; null tømmer
  perform public.todo_apply(jsonb_build_object('ops', jsonb_build_array(jsonb_build_object('op','update','id',v_todo,'due_date','2026-12-01'))));
  perform public.todo_apply(jsonb_build_object('ops', jsonb_build_array(jsonb_build_object('op','update','id',v_todo,'due_date',null))));
  if (select due_date from admin_todos where id = v_todo) is not null or (select title from admin_todos where id = v_todo) <> 'Test-opgave' then
    raise exception 'FEJL: update af enkeltfelter';
  end if;

  -- ugyldige kald afvises
  foreach r in array array['{"ops":[{"op":"delete","id":"x"}]}'::jsonb, '{"ops":[]}'::jsonb, '{}'::jsonb,
    jsonb_build_object('ops', jsonb_build_array(jsonb_build_object('op','update','id',gen_random_uuid(),'status','done'))),
    jsonb_build_object('ops', jsonb_build_array(jsonb_build_object('op','update','id',v_todo,'status','ugyldig'))),
    jsonb_build_object('ops', jsonb_build_array(jsonb_build_object('op','create','title','a','assignee','findes-ikke')))] loop
    v_ok := false;
    begin perform public.todo_apply(r); exception when others then v_ok := true; end;
    if not v_ok then raise exception 'FEJL: kald burde være afvist: %', r; end if;
  end loop;

  -- appens brugere og anonyme må ikke kalde funktionen
  if has_function_privilege('anon', 'public.todo_apply(jsonb)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.todo_apply(jsonb)', 'EXECUTE') then
    raise exception 'FEJL: todo_apply må ikke kunne kaldes af anon/authenticated';
  end if;
end $$;
rollback;
