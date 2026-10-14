-- To do af8d2aa1: reservelink under knapper i mails (F1-14) lukket 14. okt. 2026.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'af8d2aa1-f38f-4cd4-8db3-f15f8923e913' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select 'af8d2aa1-f38f-4cd4-8db3-f15f8923e913',
 'Lukket 14. okt. 2026 (Claude): "Virker knappen ikke? Kopiér linket herunder, og sæt det ind i din browser" med selve linket er tilføjet under knappen i de seks mails, hvor knappen fører til et personligt engangslink: bekræft e-mail, nulstil adgangskode, log ind-link, e-mailskift, auth-invitation og familieinvitation (N9). De øvrige mails har kun en knap til forsiden og er ikke ændret. Teksten er i samme mørke-tilstand-stil som resten. Auth-mails og N9 sendes fra koden (edge-funktionerne auth-send-email og family-invite), så de virker efter næste deploy af edge-funktioner. Ikke testet i en rigtig mailklient; forslag: Jan sender sig selv en nulstillingsmail efter deploy og tjekker, at linket ligger under knappen.'
where exists (select 1 from public.admin_todos where id = 'af8d2aa1-f38f-4cd4-8db3-f15f8923e913');
