-- Arbejdsgang fra samlet gennemgang 14. okt. 2026: W1 a og b lukkes (PR 758); øvrige punkter får statuskommentar. Idempotent.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where title = '[Før beta] Drift: Færre udrulninger og tjek ved rene to do- og dokumentændringer' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Lukket 14. okt. 2026 (Claude, PR 758): Vercel springer udrulning over, når kun migrationer, databasetests, docs, .claude, .github eller .md er ændret (ignoreCommand i vercel.json). CI, databasetest og Tjek efter merge springer de tunge trin over ved rene to do-/dokumentændringer (changed-scope.sh); tjekkene består stadig. Bemærk: en migration tæller kun som to do-fil, hvis navnet indeholder _todo_ og den kun har insert/update.'
from public.admin_todos t
where t.title = '[Før beta] Drift: Færre udrulninger og tjek ved rene to do- og dokumentændringer'
  and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Lukket 14. okt. 2026 (Claude, PR 758)%');

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Status 14. okt. 2026 (Claude): afsnit 5 og admin-afsnittet er flyttet ordret til docs/produktbeslutninger.md (PR 758). Forslag til ny CLAUDE.md (23,5 KB mod 52 KB) ligger i eatsafe/claude-md-forslag-2026-10-14.md; Jan eller Bjørn skal lægge den ind (tråde kan ikke ændre CLAUDE.md). Siden 15 KB ikke nås uden at skære afsnit 3 og 4, står punktet åbent.'
from public.admin_todos t
where t.title = '[Før beta] Drift: Skær CLAUDE.md ned til højst 15 KB'
  and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Status 14. okt. 2026 (Claude): afsnit 5%');

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Status 14. okt. 2026 (Claude): ikke bygget. Sikkerhedstjekket stoppede en ny automatisk skrivevej til produktionsdatabasen (supabase/todo/ plus workflow), så det kræver Jans eksplicitte ja. Med W1 a og b koster en to do-fil nu ikke længere en udrulning eller en databasetest, kun et versionsnummer.'
from public.admin_todos t
where t.title = 'Drift: To do-ændringer uden migrationsnumre'
  and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Status 14. okt. 2026 (Claude): ikke bygget%');

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Trin til Jan 14. okt. 2026: GitHub, Settings, Rules, Rulesets, Beskyt main, Edit. Slå Require branches to be up to date before merging til. Gem.'
from public.admin_todos t
where t.title = 'Drift (Jan): Kræv opdateret gren før merge i GitHub'
  and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Trin til Jan 14. okt. 2026%');

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Status 14. okt. 2026 (Claude): forslag til ændrede projektinstruktioner (pakker, admin fryses, engangstest) og trin til Vercel-oprydning står i eatsafe/arbejdsgang-forslag-2026-10-14.md. Afventer Jans ja.'
from public.admin_todos t
where t.title = 'Ledelse (Jan): Beslut arbejdsregler, der sparer forbrug'
  and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Status 14. okt. 2026 (Claude): forslag til ændrede%');
