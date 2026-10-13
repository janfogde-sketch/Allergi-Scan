-- To do til Jan (13. okt. 2026): gør søgning og indkøbsliste hurtigere ved mange samtidige brugere. Kun skrivning til to do-listen.
insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select
  'Hurtigere søgning og indkøbsliste ved mange brugere',
  'Belastningstesten 13. okt. (100 samtidige brugere) gav svartider på 1-11 s, op til 56 s for de langsomste, ca. 3 % fejlede søgninger og et loft på ca. 10 kald i sekundet. Årsager fundet i koden og databasen: (1) Søgningen (search_products) regner på alle produkter, der rammer søgeordet (fx 2.528 for "æg"), og tager ca. 300 ms og skriver midlertidigt til disk, for hver eneste søgning. (2) Samme søgning kontrollerer brugerens login ved en separat forespørgsel, før selve søgningen starter. (3) Indkøbslisten henter siden med 7-8 forespørgsler efter hinanden i stedet for samtidig. (4) Hver åben indkøbsliste holder en live-forbindelse åben, som databasen skal tjekke rettigheder for ved hver ændring. Plan afventer Jans ja. Se tråden "Kode: Hurtigere søgning og indkøbsliste".',
  'todo', 'normal', 'backend', public._admin_id('jafo')
 where not exists (select 1 from public.admin_todos where title = 'Hurtigere søgning og indkøbsliste ved mange brugere');
