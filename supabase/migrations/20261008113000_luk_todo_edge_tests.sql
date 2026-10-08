-- Lukker to do 5fb2786c ("Automatiske tests af serverfunktionerne") med statuskommentar (Jan, 8. okt. 2026: to do'er lukkes via migration,
-- fordi godkendelsesdialoger fra Supabase-forbindelsen ikke er synlige for ham). Idempotent: kan køres flere gange.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '5fb2786c-e6ee-457e-93b1-e807c9bb2db8' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select '5fb2786c-e6ee-457e-93b1-e807c9bb2db8',
       'Lukket 8. okt. 2026. 15 serverfunktioner har nu automatiske tests i CI (family, shopping, delete-user, allergens, ocr, products, submissions, family-invite, notify, loginkrav på alle beskyttede funktioner, signerede kald og en vagt mod nye funktioner uden adgangstjek). Testværktøj: src/testing/edgeHarness.js, beskrevet i src/CONTEXT.md §4. Ikke dækket endnu: history, favorites, send-push og admin-handlingerne i detaljer, scan-til-resultat-skærmene og browser-røgtests (egne to do-punkter i fase 7-rapporten).'
where exists (select 1 from public.admin_todos where id = '5fb2786c-e6ee-457e-93b1-e807c9bb2db8')
  and not exists (select 1 from public.admin_todo_comments where todo_id = '5fb2786c-e6ee-457e-93b1-e807c9bb2db8' and body like 'Lukket 8. okt. 2026.%');
