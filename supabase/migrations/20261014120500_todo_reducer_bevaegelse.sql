-- To do F4-13 "Global Reducér bevægelse" lukkes, og iPhone-testen lægges hos Bjørn (14. okt. 2026). Kun skrivning til to do-listen.
update public.admin_todos
   set status = 'done', completed_at = now(), updated_at = now()
 where id = '839ddcac-884a-4e6e-97b5-673ac57f7e33' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select '839ddcac-884a-4e6e-97b5-673ac57f7e33',
       E'Lukket 14. okt. 2026. Appen og admin-panelet følger nu telefonens indstilling "Reducér bevægelse" overalt: én global regel slår alle animationer og overgange fra (tidligere kun to), og rulning, der styres fra koden (til toppen, til felt ved tastatur, til panel), springer i stedet for at glide (src/motion.js). Intet ændrer sig, når indstillingen er slået fra. iPhone-test ligger hos Bjørn.'
 where not exists (select 1 from public.admin_todo_comments where todo_id = '839ddcac-884a-4e6e-97b5-673ac57f7e33' and body like 'Lukket 14. okt. 2026.%');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select
  'iPhone-test: Reducér bevægelse',
  E'Test på iPhone, at appen respekterer indstillingen. Slå først til under Indstillinger > Tilgængelighed > Bevægelse > Reducér bevægelse.\n\nMed indstillingen TIL: (1) scannerforsiden, scan-knappen og kameraets linje bevæger sig ikke; (2) skift mellem skærme og åbning af ark/menuer sker uden glidende bevægelse; (3) "Til toppen"-knappen og knapper, der rykker til et felt (Familie, tastatur i onboarding og feedback), springer direkte i stedet for at glide; (4) intet ser ødelagt ud, og alt indhold er stadig synligt.\n\nMed indstillingen FRA: alt ser ud og bevæger sig som før.\n\nForslag til frist: 3 dage efter beta-build.',
  'todo', 'normal', 'test', public._admin_id('bho')
 where not exists (select 1 from public.admin_todos where title = 'iPhone-test: Reducér bevægelse');
