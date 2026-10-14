-- To do 1f0d1358: BETA-mærket skjules i butiksudgaven (14. okt. 2026).
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '1f0d1358-c077-48e4-bde1-0d96ac503f96' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select '1f0d1358-c077-48e4-bde1-0d96ac503f96',
 'Lukket 14. okt. 2026 (Claude): BETA-mærket i toppen og "Beta" ved Version i Indstillinger skjules nu i butiksudgaven (Version viser 1.0). Butiksudgaven kendes på tre ting: Android-appen åbner med startadressen /?src=store (android/twa-manifest.json) og med Android-referrer dk.eatsafe.app, iOS-skallen (Capacitor) genkendes også; valget huskes på enheden (src/storeBuild.js). Browser og installeret hjemmeside viser BETA som før. Bemærk: Android-appen skal bygges forfra med den ændrede twa-manifest.json, før den nye startadresse gælder; referrer virker dog allerede. Test: src/storeBuild.test.js. Ikke afprøvet i en rigtig Android-app (kræver Play-konto).'
where exists (select 1 from public.admin_todos where id = '1f0d1358-c077-48e4-bde1-0d96ac503f96');
