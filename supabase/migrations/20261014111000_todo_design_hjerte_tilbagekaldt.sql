-- To do til Bjørn: hjerteknappen på tilbagekaldte produkter ser inaktiv ud (14. okt. 2026). Kun skrivning til to do-listen.
insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select
  '[Forslag] Favorit-hjertet er svært at se på tilbagekaldte produkter',
  E'Fundet af Jan 14. okt. 2026 på en rigtig telefon: på produktsiden for et tilbagekaldt produkt ligger hjerteknappen på den røde bjælke. Et gemt hjerte er rødt (var(--red)) på en lys knap oven på rød baggrund, og Jan kunne ikke se, om hjertet var tændt eller kunne trykkes. Favoritten blev faktisk gemt (verificeret i databasen).\n\nForslag: giv gemt/ikke gemt en tydeligere forskel på den røde bjælke (fx udfyldt hjerte i stedet for omrids, eller hvid knap med rødt udfyldt hjerte). Koden: ResultSections.jsx, knappen med aria-label "Tilføj favorit"/"Fjern favorit". Design er Bjørns spor; ingen kodeændring er lavet.',
  'todo', 'low', 'design', (select id from public.users where name = 'Bjørn Holst' and role = 'admin' limit 1)
 where not exists (select 1 from public.admin_todos where title = '[Forslag] Favorit-hjertet er svært at se på tilbagekaldte produkter');
