-- To do til Jan (13. okt. 2026): slet den stoppede serverfunktion weekly-digest. Kun skrivning til to do-listen.
insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select
  'Slet serverfunktionen weekly-digest',
  'Opskriftsmailen er fjernet fra appen (#698), og den ugentlige kørsel er stoppet, men funktionen weekly-digest ligger stadig i Supabase. Den slettes med et lille engangs-workflow (som tmp-move-base64-images i #660). Efter sletningen tjekkes det, at funktionen er væk, og workflowet fjernes igen. Fejler sletningen på adgangen, skal Jan selv slette funktionen i Supabase-dashboardet (Edge Functions).',
  'todo', 'low', 'backend', public._admin_id('jafo')
 where not exists (select 1 from public.admin_todos where title = 'Slet serverfunktionen weekly-digest');
