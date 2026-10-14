-- To do 0f361b1a (F3-13): gem-bjælken er solid hvid uden sløring (PR #741).
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '0f361b1a-7ab9-4083-9708-1919bbd65d56' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select '0f361b1a-7ab9-4083-9708-1919bbd65d56',
 'Lukket 14. okt. 2026 (Claude): .save-bar i theme.jsx bruger nu solid --surface (hvid) uden backdrop-filter (PR #741). Ingen andre designændringer.'
where exists (select 1 from public.admin_todos where id = '0f361b1a-7ab9-4083-9708-1919bbd65d56');
