-- Lukker to do'en om de sidste små sikkerhedspunkter (fase 1), når PR'en er merget.
update public.admin_todos
set status = 'done'
where id = 'd156ebc3-2104-44a3-b406-c113b158d666';

insert into public.admin_todo_comments (todo_id, body)
select id,
  'Færdig (8. okt.): (1) Versioner er fastlåst: alle handlinger i GitHub-workflows peger på en bestemt udgave (SHA), og Supabase-værktøjet i deploy/db-test kører en fast version (2.120.0). Alle edge-funktioner henter nu supabase-js i en fast version (2.117.3) i stedet for "seneste 2.x", både via esm.sh og jsr. (2) family-invite: højst 3 invitationer pr. modtageradresse pr. døgn uanset afsender (ud over de 10 pr. afsender), med test. (3) send-push mellem familiemedlemmer med fri tekst var allerede lukket: funktionen accepterer kun service-role-nøglen, og appen kalder den ikke. (4) Deploy af alle funktioner køres manuelt efter merge, så produktion = main. Mangler: en dag at se, at ingen funktion fejler efter versionslåsen. Opfølgning: opdater de fastlåste versioner et par gange om året.'
from public.admin_todos
where id = 'd156ebc3-2104-44a3-b406-c113b158d666';
