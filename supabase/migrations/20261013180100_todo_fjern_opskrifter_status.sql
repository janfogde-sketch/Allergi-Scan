-- To do b0554005 (Fjern Opskrifter, diæter og madspild-hook, G5): statuskommentar. Kun skrivning til to do-listen.
insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Status 13. okt. 2026: Opskrifter er fjernet fra koden (skærm, hook, begge admin-faner, menupunkt, ugentlig opskriftsmail weekly-digest, ubrugt madspild-hook). Ingen brugerdata berørt; tabellen recipes og funktionen food-waste er bevaret, og koden kan hentes fra git. Mangler: kostpræferencer (diæter). De er skjulte, men flettet ind i onboarding, familieformular, Madpas og statussystemet, så de fjernes i en separat, større ændring efter Jans ja. Den deployede funktion weekly-digest ligger stadig i Supabase (jobbet er stoppet siden 7. okt.) og kan slettes i Supabase-konsollen.'
  from public.admin_todos t
 where t.id::text like 'b0554005%'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Status 13. okt. 2026: Opskrifter er fjernet%');
