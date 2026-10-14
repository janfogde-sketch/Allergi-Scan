-- To do b6b4e164 (F5-16): tydeligere relativ tid. Lukkes sammen med kodeændringen.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'b6b4e164-3b3b-437b-aee3-f624ab9fe0cc' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select 'b6b4e164-3b3b-437b-aee3-f624ab9fe0cc',
 'Lukket 14. okt. 2026 (Claude): tidsangivelser i Historik, Beskeder og Tickets viser nu "5 min siden", "1 time siden", "3 timer siden", "1 dag siden" og "3 dage siden" (skrevet ud) og efter 7 dage selve datoen, fx "24. maj 2026" i stedet for "143 d siden". I Historik står der "Senest den 24. maj 2026" for gamle poster. Test i helpers.test.js. Ingen iPhone-test nødvendig.'
where exists (select 1 from public.admin_todos where id = 'b6b4e164-3b3b-437b-aee3-f624ab9fe0cc');
