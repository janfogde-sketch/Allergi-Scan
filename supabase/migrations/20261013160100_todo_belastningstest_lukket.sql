-- To do bef4b0c9: belastningstest kørt 13. okt. 2026, testkonti slettet (migrationen før denne).
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'bef4b0c9-1289-4019-9206-e8dbd3dcda5b' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select 'bef4b0c9-1289-4019-9206-e8dbd3dcda5b',
 'Lukket 13. okt. 2026 (Claude, efter Jans ja): 100 testkonti (loadtest-001..100@example.com, ikke admin, ingen mail/push) oprettet og kørt med 10, 50 og 100 samtidige brugere (ca. 1.760 kald, alle 100 Realtime-forbindelser åbnede uden fejl). Resultat: ved 10 brugere svarer appen i 0,3-0,8 s (typisk); ved 100 samtidige brugere stiger typisk svartid til 1-11 s og de langsomste kald til 40-56 s, og ca. 3 % af søgningerne fejler. Serveren leverede under hele testen kun ca. 10 kald i sekundet, uanset om 10 eller 100 brugere trykkede. Det er værd at følge op før ekstern beta (søgning og indkøbsliste er langsomst; Supabase Free er sandsynligvis flaskehalsen). Testkontiene er slettet igen og kontrolleret (0 rester). Script: scripts/loadtest.mjs.'
where exists (select 1 from public.admin_todos where id = 'bef4b0c9-1289-4019-9206-e8dbd3dcda5b');
