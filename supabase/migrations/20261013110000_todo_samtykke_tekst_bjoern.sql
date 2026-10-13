-- To do til Bjørn (13. okt. 2026): gennemlæs teksten på den nye samtykke-fornyelsesskærm (ConsentRenewalModal).
insert into public.admin_todos (title, description, priority, track, assignee_id)
values (
  'Design: gennemlæs teksten og udseendet på den nye samtykkeskærm ("Vi har opdateret vores vilkår for dine oplysninger")',
  'Når samtykketeksten eller privatlivspolitikken ændres væsentligt, hæves versionen, og brugere med gemte allergier ser en skærm ved næste appåbning (src/ConsentRenewalModal.jsx). Den genbruger den eksisterende samtykkeboks og siger: overskrift, kort forklaring, afkrydsning, "Jeg accepterer" og "Jeg vil ikke give samtykke" (trækker samtykket tilbage efter bekræftelse). Tjek tekst og udseende. iPhone-test: hæv HEALTH_CONSENT_VERSION lokalt og se skærmen (ikke på produktion, da alle ellers bliver spurgt).',
  'normal', 'design',
  (select id from public.users where role = 'admin' and name ilike 'Bj%rn%' order by created_at limit 1)
);
