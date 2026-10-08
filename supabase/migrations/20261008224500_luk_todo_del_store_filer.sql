-- Lukker to do'en "Del store filer op" (App.jsx, Onboarding, Result, Scanner, SharedComponents, constants delt op i PR #653-#657). Idempotent. Sletter intet.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'fbcc66c9-0770-47d5-83fa-619140c1baee' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Lukket 8. okt. 2026. Seks store filer er delt op uden at ændre, hvad appen gør (ren omflytning, én PR ad gangen, alle tests grønne): SharedComponents 996 -> samlefil + 6 filer (#653), constants 513 -> 140 linjer med E-numre og demoprodukter i src/data (#654), App.jsx 1422 -> 1182 linjer (udbydere, bundnavigation, Android-tilbage og preview-tilstand i egne filer, #655), OnboardingScreen 1166 -> 317 linjer med Welcome/Login/Trin 1-5 i egne filer (#656), ResultScreen 1086 -> 579 og ScannerScreen 897 -> 273 linjer (#657). Gamle imports virker uændret, fordi SharedComponents.jsx og constants.jsx genudgiver alt. Ikke med (kræver Jans beslutning): sovende kode (Opskrifter, mobil-admin) og theme.jsx.'
  from public.admin_todos t
 where t.id = 'fbcc66c9-0770-47d5-83fa-619140c1baee'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Lukket 8. okt. 2026. Seks store filer%');
