-- Lukker to do 035a8028 (ny README og datoer). Idempotent. Sletter intet.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '035a8028-47c5-4138-890d-a65dcf4fa181' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select id, 'Lukket 8. okt. 2026. README.md er skrevet forfra på dansk (kør, test, mappestruktur, databaseændringer via migrationsfil, udgivelse, politikker) og peger på CLAUDE.md som den gældende arbejdsaftale. Ingen hemmeligheder eller interne adresser. Teksten "Gyldig pr. 8. okt. 2026" står øverst i .claude/HISTORY.md og SECURITY_TODO.md og i README.'
  from public.admin_todos where id = '035a8028-47c5-4138-890d-a65dcf4fa181'
   and not exists (select 1 from public.admin_todo_comments where todo_id = '035a8028-47c5-4138-890d-a65dcf4fa181' and body like 'Lukket 8. okt. 2026.%');
