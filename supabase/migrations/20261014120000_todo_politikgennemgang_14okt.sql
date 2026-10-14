-- To do "Gennemgå politikker mod appændringer": statuskommentar, lukning og ny runde (14. okt. 2026). Kun skrivning til to do-listen.
insert into public.admin_todo_comments (todo_id, body)
select t.id, E'Status 14. okt. 2026: Vilkår og privatlivspolitik er gennemgået mod ugens ændringer og passer med appen; ingen tekstændring nødvendig (begge er opdateret 13. okt.).\nTjekket: kostpræferencer og opskrifter er væk fra teksterne (#704, #698); ugentlig mail findes ikke i beskedtyperne; fornyelse af samtykke ved ændret tekst står i afsnit 3; adminloggen og dens 12 måneders frist står i afsnit 11 og matcher cleanup_notifications(); næringsværdier fra Open Food Facts dækkes af afsnittet om Open Food Facts (kun stregkode sendes); den fælles søgecache i serverfunktionen indeholder ingen personoplysninger (svar uden personlig boost).\nFund uden for teksterne: demo-slidet "Opskrifter I faktisk kan spise" på scanner-forsiden (src/demoSlides.jsx) reklamerer for en fjernet funktion; lagt som egen to do til Bjørn.'
  from public.admin_todos t
 where t.title = 'Gennemgå politikker mod appændringer' and t.status <> 'done'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Status 14. okt. 2026: Vilkår og privatlivspolitik er gennemgået%');

update public.admin_todos set status = 'done'
 where title = 'Gennemgå politikker mod appændringer' and status <> 'done';

insert into public.admin_todos (title, description, status, priority, track, due_date, assignee_id)
select 'Gennemgå politikker mod appændringer',
  'Tilbagevendende (månedligt): gennemgå git log siden sidste gennemgang (14. okt. 2026) mod src/legalText/terms.js og privacy.js. Nye felter/tabeller, leverandører, notifikationstyper, lagring, login, AI-brug, opbevaring? Opret fund som to do, luk denne og opret en ny med frist om en måned. Regel: CLAUDE.md afsnit 0b.',
  'todo', 'normal', 'drift', date '2026-11-14', (select assignee_id from public.admin_todos where title = 'Gennemgå politikker mod appændringer' and status = 'done' order by created_at desc limit 1)
 where not exists (select 1 from public.admin_todos where title = 'Gennemgå politikker mod appændringer' and status <> 'done');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select 'Fjern demo-slidet om opskrifter på scanner-forsiden',
  E'Demo-slidet "Opskrifter I faktisk kan spise" (src/demoSlides.jsx) viser en funktion, der er fjernet (opskrifter, 13. okt. 2026). Fjern slidet eller erstat det med en funktion, der findes. Fundet ved politikgennemgangen 14. okt.',
  'todo', 'normal', 'design', public._admin_id('bho')
 where not exists (select 1 from public.admin_todos where title = 'Fjern demo-slidet om opskrifter på scanner-forsiden');
