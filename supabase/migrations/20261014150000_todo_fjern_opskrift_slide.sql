-- To do 57c446f2: opskrift-slidet fjernet fra demoen (src/demoSlides.jsx), 14. okt. 2026.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '57c446f2-db5d-4857-b43a-16518900bf83' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select '57c446f2-db5d-4857-b43a-16518900bf83',
 'Lukket 14. okt. 2026 (Claude): slidet "Opskrifter I faktisk kan spise" er fjernet fra demoen (velkomst og app-guide deler samme slides). Ingen andre designændringer; de øvrige slides er uændrede.'
where exists (select 1 from public.admin_todos where id = '57c446f2-db5d-4857-b43a-16518900bf83');
