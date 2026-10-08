-- Lukker to do'en om at slette den gamle serverfunktion tmp-move-base64-images (slettet via engangs-workflow, PR #660). Idempotent. Sletter ingen data.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '56cc28df-e2b5-4cb3-951a-baab4de4a229' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Lukket 8. okt. 2026. Den gamle serverfunktion tmp-move-base64-images er slettet fra Supabase med et engangs-workflow (PR #660, kørt 18:56 UTC = 20:56 dansk tid). Tjekket bagefter: funktionen er væk fra listen over serverfunktioner (de øvrige 28 er uændrede). Workflowet er fjernet igen i opfølgende PR.'
  from public.admin_todos t
 where t.id = '56cc28df-e2b5-4cb3-951a-baab4de4a229'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Lukket 8. okt. 2026. Den gamle serverfunktion%');
