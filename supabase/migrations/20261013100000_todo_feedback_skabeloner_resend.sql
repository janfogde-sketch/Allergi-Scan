-- Luk to do "Mail: opdatér feedback-skabelonerne i Resend" (13. okt. 2026). Idempotent.
insert into public.admin_todo_comments (todo_id, body)
select '78fe4f46-1405-4ed3-8ebb-7890632b2fc4'::uuid,
 'Status 13. okt. 2026 (Claude): Alle fem skabeloner (N3, N6a-d) er opdateret i Resend med indholdet fra repoet ("Din feedback" / "Svar fra EatSafe", fallback "Din feedback i EatSafe") og udgivet. Kontrolleret ved at læse de udgivne skabeloner tilbage. Der er ikke sendt testmail; næste rigtige feedback-mail viser den nye tekst.'
where exists (select 1 from public.admin_todos where id = '78fe4f46-1405-4ed3-8ebb-7890632b2fc4')
  and not exists (select 1 from public.admin_todo_comments where todo_id = '78fe4f46-1405-4ed3-8ebb-7890632b2fc4' and body like 'Status 13. okt. 2026 (Claude): Alle fem skabeloner%');

update public.admin_todos set status = 'done'
where id = '78fe4f46-1405-4ed3-8ebb-7890632b2fc4' and status <> 'done';
