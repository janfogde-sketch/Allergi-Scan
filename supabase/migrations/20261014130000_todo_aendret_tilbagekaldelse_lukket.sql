-- To do "Besked ved ændret eller annulleret tilbagekaldelse" (F1-17) lukkes, plus en to do til Bjørn om ordlyd og evt. mailskabelon. Kun skrivning til to do-listen.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where title = '[Efter beta] F1-17: Besked ved ændret eller annulleret tilbagekaldelse' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select id,
 'Lukket 14. okt. 2026 (Claude, efter Jans ja og push, PR 727): recalls-sync kobler nu en "ANNULLERET: ..."-side til den oprindelige tilbagekaldelse (samme titel, ellers samme EAN), markerer den annulleret og genlæser de seneste 14 dages sider for ændret tekst (årsag, partier, anvisning, EAN). De, der fik den første besked, får en ny besked (P6 annulleret / P6 ændret) i samme stil som den første, som push og besked i appen. Ved ændring får også brugere, der nu matcher via EAN, besked. Der er ingen ny mail (kræver ny Resend-skabelon, se to do til Bjørn). Databasen er tjekket: de fire nye kolonner på recalls og migration 20261014103000 findes. Ikke testet med en rigtig Fødevarestyrelsen-annullering (kun én gammel fra januar findes); første rigtige tilfælde følges i admin → Tilbagekald.'
from public.admin_todos where title = '[Efter beta] F1-17: Besked ved ændret eller annulleret tilbagekaldelse';
insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select
  'Gennemlæs teksten til annulleret/ændret tilbagekaldelse (og vælg, om der skal være mail)',
  E'Når en tilbagekaldelse annulleres eller ændres, får de berørte brugere en ny besked ("Tilbagekaldelsen er annulleret" / "Tilbagekaldelsen er ændret"). Teksterne står i supabase/functions/_shared/notificationContent.js under P6:cancelled og P6:updated og følger samme opbygning som den første besked. De kommer kun som push og besked i appen. Opgaven: (1) læs ordlyden igennem og ret, hvis du vil have den anderledes; (2) vælg, om der også skal en mail med en ny Resend-skabelon (som P6-tilbagekaldelse), eller om push og besked er nok. Vises i admin → Notifikationer med eksempeldata.',
  'todo', 'low', 'design', public._admin_id('bho')
 where not exists (select 1 from public.admin_todos where title = 'Gennemlæs teksten til annulleret/ændret tilbagekaldelse (og vælg, om der skal være mail)');
