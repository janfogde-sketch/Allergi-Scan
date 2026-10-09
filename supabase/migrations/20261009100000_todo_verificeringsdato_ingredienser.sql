-- Opretter en to do om en ærlig verificeringsdato for ingredienser og allergener på produktsiden. Idempotent. Sletter ingen data.
insert into public.admin_todos (title, description, status, priority, track)
select '[Før beta] Vis dato for seneste verificering af ingredienser og allergener på produktsiden',
$d$Bjørn (9. okt. 2026): en dato for seneste verificering er vigtigere end navnet på datakilden i en allergiapp. En importdato er ikke en verificeringsdato og må ikke vises som en.
I dag findes kun `created_at`, `updated_at`, `reparsed_at`, `verified`, `verified_status` og `verified_count` på `products`; ingen dato for, hvornår ingredienser/allergener sidst blev kontrolleret mod emballagen.
Beslutning (Jan): hvem verificerer (admin, brugerbekræftelse eller begge), og hvad tæller som verificering? Forslag: ny kolonne `ingredients_verified_at`, som kun sættes ved en faktisk verificering, vist som "Ingredienser kontrolleret [dato]" (og ingen dato, hvis aldrig verificeret, med tydelig tekst).
Design (Bjørn): placering og ordlyd på produktsiden. Dato må ikke læses som garanti; "Kontrollér altid emballagen" står fast. Databaseændring: kræver migration, evt. RPC og tilføjelse til DB-testen account_deletion.sql hvis kolonnen refererer til brugere.
Kontekst: butiksmærket hedder nu "Produktdata" med forklaring om kilden (PR efter #663).$d$,
'todo','normal','backend'
where not exists (select 1 from public.admin_todos where title like '%dato for seneste verificering af ingredienser%');
