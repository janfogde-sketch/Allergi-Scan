-- Samlet to do-oprydning 14. okt. 2026: tilbagekaldelsestest, admin-mail og død CSS lukkes; typetjek og iPhone-splash får statuskommentar; Bjørn får et tjek. Idempotent.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id in ('bd0ba5cf-f03c-4670-b8fa-956dab32b378', 'e8db8683-aebb-48bd-9640-ec1b4bc42e46', 'e2279ca5-4c02-44c1-9fe0-84dbceaf5399') and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select 'bd0ba5cf-f03c-4670-b8fa-956dab32b378',
 'Lukket 14. okt. 2026 (Claude): første rigtige tilbagekaldelse (Makrelkræs, 12. okt.) blev gemt og behandlet rigtigt. Beskeden blev afprøvet ende til ende kun til Jans egen konto (indbakke, 2 push, 1 mail, ingen fejl), og Jan har bekræftet, at han så den.'
where exists (select 1 from public.admin_todos where id = 'bd0ba5cf-f03c-4670-b8fa-956dab32b378');

insert into public.admin_todo_comments (todo_id, body)
select 'e8db8683-aebb-48bd-9640-ec1b4bc42e46',
 'Lukket 14. okt. 2026 (Claude): linket i admin-overblikket peger nu på admin-siden, og de hardkodede gråtoner er skiftet til appens farver (PR 752).'
where exists (select 1 from public.admin_todos where id = 'e8db8683-aebb-48bd-9640-ec1b4bc42e46');

insert into public.admin_todo_comments (todo_id, body)
select 'e2279ca5-4c02-44c1-9fe0-84dbceaf5399',
 'Lukket 14. okt. 2026 (Claude): ca. 70 ubrugte regler og 3 animationer er fjernet fra theme.jsx (PR 754). DemoSlider og de dobbelte selektorer er ikke rørt. Bjørn har fået en to do om at tjekke, at intet ser anderledes ud.'
where exists (select 1 from public.admin_todos where id = 'e2279ca5-4c02-44c1-9fe0-84dbceaf5399');

insert into public.admin_todo_comments (todo_id, body)
select '76a3ce14-f38c-4fed-9b6d-c2f9c15d8d93',
 'Status 14. okt. 2026 (Claude): runde 3 er merget (PR 753), 16 filer mere er med i typetjekket. Ca. 107 filer mangler, mest de store skærme og admin-hooks; kameraskærmens fil er udskudt. Punktet står åbent.'
where exists (select 1 from public.admin_todos where id = '76a3ce14-f38c-4fed-9b6d-c2f9c15d8d93');

insert into public.admin_todo_comments (todo_id, body)
select '2d6cafcf-bc2d-4f12-a087-a0dc82cc3f1f',
 'Status 14. okt. 2026 (Claude): iOS-splashbillederne er allerede lagt ind (13 apple-touch-startup-image i index.html). Det eneste, der mangler, er "screenshots" i manifestet, og de kan genbruges fra butiksbillederne. Punktet står åbent med den afgrænsning.'
where exists (select 1 from public.admin_todos where id = '2d6cafcf-bc2d-4f12-a087-a0dc82cc3f1f');

insert into public.admin_todos (title, description, priority, track, assignee_id)
select 'Design: tjek at intet ser anderledes ud efter oprydning af død CSS',
 'Forslag (Claude, 14. okt. 2026): ca. 70 ubrugte CSS-regler og 3 animationer er fjernet fra theme.jsx (PR 754). Åbn Scan-forsiden, Profil, Historik, Indkøbsliste og login/onboarding, og tjek at afstande, farver og runde hjørner ser ud som før. Meld afvigelser som ticket. Foreslået frist: 21. okt. 2026.',
 'low', 'design', (select id from public.users where role = 'admin' and name ilike 'Bj%rn%' order by created_at limit 1)
where not exists (select 1 from public.admin_todos where title = 'Design: tjek at intet ser anderledes ud efter oprydning af død CSS');
