-- Lukker to do ce1e028c (driftsoprydning).
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'ce1e028c-1013-4572-97df-98ec3aaf92b6' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select 'ce1e028c-1013-4572-97df-98ec3aaf92b6',
       'Lukket 8. okt. 2026. (1) Historikken over planlagte job havde 12.990 rækker og voksede med ca. 1.440 i døgnet: alt ældre end 7 dage slettes nu, og et nyt natligt job (cron-history-cleanup, kl. 03:20 UTC) holder den lille. (2) Dashboard-filen (public/eatsafe-dashboard.html) var allerede slettet fra koden tidligere (#491); adressen viser kun selve appen, så der var intet at fjerne. (3) De seks fremmednøgler uden indeks (bl.a. på admin-todos og kommentarer) har fået indeks, og de to DELETE-regler på invitationer er samlet til én med samme adgang (admin, eller afsenderen af en ventende invitation). Alt står i migrationen 20261008184237_driftsoprydning.sql og kører ved merge. Ikke testet i produktion før merge (testkørsel mod live-databasen blev afvist); databasetesten i CI kører mod en frisk database. Ingen backup-tabeller er rørt.'
where exists (select 1 from public.admin_todos where id = 'ce1e028c-1013-4572-97df-98ec3aaf92b6')
  and not exists (select 1 from public.admin_todo_comments where todo_id = 'ce1e028c-1013-4572-97df-98ec3aaf92b6' and body like 'Lukket 8. okt. 2026.%');
