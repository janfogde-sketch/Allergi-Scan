-- To do "Håndtér pushsubscriptionchange" lukkes (skifter enheden push-adresse, fornyes abonnementet nu af sig selv). Plus en iPhone-test til Bjørn. Kun skrivning til to do-listen.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where title = '[Efter beta] F1-16: Håndtér pushsubscriptionchange' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select id,
 'Lukket 14. okt. 2026 (Claude, efter Jans ja og push): Service workeren (public/sw.js) lytter nu efter pushsubscriptionchange. Skifter telefonen push-adresse, opretter den straks et nyt abonnement med samme nøgle og melder det til appen, som gemmer det på kontoen (claim_push_token). Er appen lukket, gemmes det ved næste start som hidtil (syncPushToken). Ingen databaseændringer. Kan ikke udløses kunstigt på en rigtig telefon, så testen er en regressionstest: push virker stadig efter installation og efter flere dage (iPhone-test lagt hos Bjørn).'
from public.admin_todos where title = '[Efter beta] F1-16: Håndtér pushsubscriptionchange';
insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select
  'iPhone: tjek at push stadig virker efter et par dage (nyt pushabonnement)',
  E'Efter ændringen i F1-16 fornyer appen selv pushabonnementet, hvis iPhonen skifter push-adresse. Tjek på iPhone med appen installeret på hjemmeskærmen: (1) slå notifikationer til, og få en testbesked (kun til din egen konto); (2) vent 2-3 dage uden at åbne appen; (3) få en ny testbesked. Kommer den, er alt i orden. Kommer den ikke, så åbn appen én gang og prøv igen, og skriv det her.',
  'todo', 'normal', 'test', public._admin_id('bho')
 where not exists (select 1 from public.admin_todos where title = 'iPhone: tjek at push stadig virker efter et par dage (nyt pushabonnement)');
