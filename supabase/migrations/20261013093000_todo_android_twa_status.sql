-- Statuskommentar på to do "Android-app som TWA" (13. okt. 2026). Idempotent.
insert into public.admin_todo_comments (todo_id, body)
select 'd4090631-aa67-46dd-9c32-c7720d8f13af'::uuid,
 'Status 13. okt. 2026 (Claude): Klar: pakkenavn dk.eatsafe.app, www-adresse, assetlinks.json live, Bubblewrap-opsætning i android/twa-manifest.json, tjekliste i docs/android-google-play-tjekliste.md. Venter på Google Play-konto (CVR + D-U-N-S): oprette appen med Play App Signing, indsætte SHA-256-fingeraftrykket i assetlinks.json, bygge .aab med uploadnøgle (gemmes uden for repoet), intern test med Jan og Bjørn. Intet indsendt. Punktet er bevidst ikke lukket.'
where exists (select 1 from public.admin_todos where id = 'd4090631-aa67-46dd-9c32-c7720d8f13af')
  and not exists (select 1 from public.admin_todo_comments where todo_id = 'd4090631-aa67-46dd-9c32-c7720d8f13af' and body like 'Status 13. okt. 2026 (Claude): Klar: pakkenavn%');
