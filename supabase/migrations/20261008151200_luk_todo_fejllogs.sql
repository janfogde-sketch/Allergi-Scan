-- Lukker to do b54f5251 (fejllogs i serverfunktioner) og opretter en opfølgende to do. Idempotent.
insert into public.admin_todos (title, description, status, priority, track, assignee_id, due_date)
select '[Før beta] Slet den midlertidige serverfunktion tmp-move-base64-images i Supabase',
       'Funktionen blev brugt én gang 6. okt. 2026 til at flytte billeder, ligger ikke længere i koden, men er stadig udrullet (Edge Functions i Supabase-dashboardet). Den gav 1 fejl (500) 6. okt. kl. 19.20 dansk tid. Slet den i dashboardet (Edge Functions > tmp-move-base64-images > Delete). Forslag til frist.',
       'todo', 'low', 'backend', (select id from public.users where email = 'janfogde@gmail.com'), date '2026-10-15'
where not exists (select 1 from public.admin_todos where title like '%tmp-move-base64-images%');

update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'b54f5251-7f45-452f-84a7-0211f16793b6' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select 'b54f5251-7f45-452f-84a7-0211f16793b6',
       'Lukket 8. okt. 2026. Gennemgået alle serverfunktioners svar fra 1. okt. kl. 11 dansk tid til nu (logs kunne hentes via Supabase). Kun 5 fejl (500) i alt, ingen de sidste 2 døgn: (1) send-email, 4 stk. 1. okt.: velkomstmailen blev gensendt til samme adresse med ændret tekst inden for 24 t, så Resend afviste den (409). Rettet i denne PR: det giver nu "allerede sendt" i stedet for fejl. (2) allergen-reanalyze, 1 stk. 6. okt. kl. 12.54 dansk tid: manglende adgang til en midlertidig sammenligningstabel; rettet den dag (adgang er der nu, funktionen er siden opdateret 8 gange). (3) tmp-move-base64-images, 1 stk. 6. okt. kl. 19.20: engangsfunktion uden for koden; ny to do om at slette den. Øvrige funktioner: ingen 500-svar. Ikke tjekket: fejl der ikke giver 500 (fx 401/403/429) og tiden før 1. okt.'
where exists (select 1 from public.admin_todos where id = 'b54f5251-7f45-452f-84a7-0211f16793b6')
  and not exists (select 1 from public.admin_todo_comments where todo_id = 'b54f5251-7f45-452f-84a7-0211f16793b6' and body like 'Lukket 8. okt. 2026.%');
