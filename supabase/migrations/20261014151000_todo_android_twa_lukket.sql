-- To do d4090631: Android-forberedelsen (TWA) er klar; Jan bad om at lukke punktet (14. okt. 2026).
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'd4090631-aa67-46dd-9c32-c7720d8f13af' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select 'd4090631-aa67-46dd-9c32-c7720d8f13af',
 'Lukket 14. okt. 2026 (Claude, efter Jans ja): forberedelsen er færdig. Pakkenavn dk.eatsafe.app, adresse www.eatsafe.dk, Bubblewrap-opsætning i android/twa-manifest.json, assetlinks.json live (fingeraftryk tomt med vilje), trin-for-trin-liste i docs/android-google-play-tjekliste.md. Ingen nøgler i repoet. Selve bygningen af .aab og upload afventer Google Play-kontoen (CVR + D-U-N-S, se det andet to do-punkt om butikskonti): Jan sender SHA-256-fingeraftrykket, Claude indsætter det og bygger filen.'
where exists (select 1 from public.admin_todos where id = 'd4090631-aa67-46dd-9c32-c7720d8f13af');
