-- To do: admin gjort mobilvenlig, gammel mobil-admin fjernet (13. okt. 2026). Idempotent.
update public.admin_todos set status = 'done', completed_at = now()
 where id = '74b9bdfb-dbbf-4d50-9b05-b173b42510f3' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select '74b9bdfb-dbbf-4d50-9b05-b173b42510f3'::uuid,
 'Jan valgte én admin. Web-admin er gjort mobilvenlig (menu som kuffert, tabeller kan rulles, vinduer åbner nedefra), "Admin panel" i profilmenuen åbner den, og den gamle mobil-admin (13 filer) er fjernet. Mobil-adminens Debug-fane blev ikke flyttet (den var kun en lokal fejllog på enheden).'
where exists (select 1 from public.admin_todos where id = '74b9bdfb-dbbf-4d50-9b05-b173b42510f3')
  and not exists (select 1 from public.admin_todo_comments where todo_id = '74b9bdfb-dbbf-4d50-9b05-b173b42510f3' and body like 'Jan valgte én admin.%');

insert into public.admin_todos (title, description, priority, track, assignee_id)
select t.title, t.description, 'normal', 'design', 'd8ff299b-449e-4c88-98fd-58f397199f1c'::uuid
from (values
 ('[Før beta] Design: gennemse web-admin på telefon',
  'Admin er gjort mobilvenlig under 820 px (src/admin/adminTheme.js, AdminLayout.jsx). Gennemse layout og afstande på alle sektioner (Indsendelser, Tickets, Brugere, Manglende, To do, Dashboard m.fl.) og ret det, der ser forkert ud.'),
 ('[Før beta] iPhone-test: admin på telefon',
  'Åbn eatsafe.dk/admin.html på iPhone (også via Profil → Admin panel). Tjek: menuknappen øverst til venstre, skift mellem sektioner, godkend en indsendelse, svar på en ticket, rulning af tabeller, at felter ikke zoomer ind. Meld fejl som ticket.')
) as t(title, description)
where exists (select 1 from public.users where id = 'd8ff299b-449e-4c88-98fd-58f397199f1c')
  and not exists (select 1 from public.admin_todos x where x.title = t.title);
