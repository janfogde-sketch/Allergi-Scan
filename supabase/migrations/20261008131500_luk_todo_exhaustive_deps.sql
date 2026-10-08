-- Lukker to do df026d2d (undtagelser fra afhængighedsreglen i effekter) med statuskommentar. Idempotent.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'df026d2d-6ed3-4cd5-97df-c57f0224ad4f' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select 'df026d2d-6ed3-4cd5-97df-c57f0224ad4f',
       'Lukket 8. okt. 2026. Alle 16 steder, hvor reglen er slået fra, er gennemgået (listen sagde 17; EditPreferencesScreen har ingen længere). Ingen skjulte fejl med gamle værdier fundet: hvert sted henter enten kun ved mount/skift af id, sektion eller token, eller læser værdierne friskt i samme render. Hvert sted har nu en kort begrundelse i koden, så ingen undtagelse står uden forklaring. Ingen adfærdsændring; lint, 1293 tests og build er grønne.'
where exists (select 1 from public.admin_todos where id = 'df026d2d-6ed3-4cd5-97df-c57f0224ad4f')
  and not exists (select 1 from public.admin_todo_comments where todo_id = 'df026d2d-6ed3-4cd5-97df-c57f0224ad4f' and body like 'Lukket 8. okt. 2026.%');
