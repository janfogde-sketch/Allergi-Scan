-- To do "Hurtigere søgning og indkøbsliste ved mange brugere": de tre gratis rettelser er udgivet (PR 710). Kun skrivning til to do-listen.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where title = 'Hurtigere søgning og indkøbsliste ved mange brugere' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select id,
 'Lukket 13. okt. 2026 (Claude, efter Jans ja og push, PR 710): (1) Søgningen læser nu ordene fra en forberegnet opslagstabel (product_search, holdt ajour af en trigger) og scorer med færre delforespørgsler: samme svar som før (24 sammenligninger på en testkopi), på live ca. 300 ms -> ca. 195 ms for "æg". (2) Samme søgning deles mellem brugere i 3 min. pr. serverinstans, og loginnet tjekkes lokalt uden ekstra kald. (3) Indkøbslisten henter sine opslag samtidigt og billeder i ét kald. Ikke målt med ny belastningstest (kræver Jans ja). Det lave loft på ca. 10 kald i sekundet og live-forbindelserne ved mange brugere løses kun med Supabase Pro: tages op, når Pro vælges (før ekstern beta). Forslag til opfølgning: kør belastningstesten igen efter Pro-skiftet.'
from public.admin_todos where title = 'Hurtigere søgning og indkøbsliste ved mange brugere';
