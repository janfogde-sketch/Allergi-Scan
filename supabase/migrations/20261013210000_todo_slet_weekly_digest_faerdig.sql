-- To do "Slet serverfunktionen weekly-digest": statuskommentar og lukning (13. okt. 2026). Kun skrivning til to do-listen.
insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Status 13. okt. 2026: Funktionen weekly-digest er slettet i Supabase (engangs-workflow kørt, lykkedes), og listen over serverfunktioner er tjekket: den er væk. Workflowet er fjernet igen.'
  from public.admin_todos t
 where t.title = 'Slet serverfunktionen weekly-digest'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Status 13. okt. 2026: Funktionen weekly-digest er slettet%');

update public.admin_todos set status = 'done'
 where title = 'Slet serverfunktionen weekly-digest' and status <> 'done';
