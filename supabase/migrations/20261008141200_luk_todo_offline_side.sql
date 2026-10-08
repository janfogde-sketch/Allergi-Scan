-- Lukker to do 3cdfddc6 (offline-side i appen) med statuskommentar. Idempotent.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '3cdfddc6-d360-4338-9383-9efbc692c93c' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select '3cdfddc6-d360-4338-9383-9efbc692c93c',
       'Lukket 8. okt. 2026. Uden net viser appen nu en enkel EatSafe-side ("Du er offline" med knappen "Prøv igen") i stedet for browserens fejlside. Siden hentes på forhånd af service workeren (public/offline.html, public/js/offline.js) og bruger appens eksisterende udseende. Service workeren blander sig nu kun i sidenavigation; alle øvrige forespørgsler går direkte til nettet (Y7 fra fase 5). Tests for offline-fallback er tilføjet. Skal tjekkes på telefon efter deploy: flytilstand og åbn appen. Teksten kan gennemlæses af Bjørn.'
where exists (select 1 from public.admin_todos where id = '3cdfddc6-d360-4338-9383-9efbc692c93c')
  and not exists (select 1 from public.admin_todo_comments where todo_id = '3cdfddc6-d360-4338-9383-9efbc692c93c' and body like 'Lukket 8. okt. 2026.%');
