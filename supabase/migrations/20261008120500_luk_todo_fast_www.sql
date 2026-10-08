-- Lukker to do'erne om fast www-adresse (266d42ce) og ryd op i links/gammel fil (7d855621).
-- Fingeraftrykket til Android lægges som kommentar på Play-konto-opgaven (a2c0a533), som allerede venter på CVR.
update public.admin_todos set status = 'done'
where id in ('266d42ce-83c8-48bf-babe-c2e8017b30cd', '7d855621-8e45-4f52-a2d3-6f38ec271cca');

insert into public.admin_todo_comments (todo_id, body)
select id,
  'Færdig (8. okt.): den faste adresse er https://www.eatsafe.dk. Alle links i appen, invitations- og listesider, mails, edge-funktioner, politiktekster og dokumentation bruger nu www (eatsafe.dk giver stadig 307 hertil, så gamle links virker). Adgangsfilen til Android ligger live på www (#552, pakke dk.eatsafe.app, svarer som application/json). Fingeraftrykket mangler stadig og kan først hentes, når appen er oprettet i Play Console; det er lagt som kommentar på Play-konto-opgaven.'
from public.admin_todos where id = '266d42ce-83c8-48bf-babe-c2e8017b30cd';

insert into public.admin_todo_comments (todo_id, body)
select id,
  'Færdig (8. okt.): den gamle ubrugte fil src/sw.js er slettet (den rigtige er public/sw.js), og alle links med eatsafe.dk er rettet til www.eatsafe.dk i index.html, admin-installationslink, invitations-/liste-/installationssider, mails, edge-funktioner og CLAUDE.md. Tests, lint og build er grønne.'
from public.admin_todos where id = '7d855621-8e45-4f52-a2d3-6f38ec271cca';

insert into public.admin_todo_comments (todo_id, body)
select id,
  'Husk når Play-kontoen er oprettet (fra to do 266d42ce): læg SHA-256-fingeraftrykkene fra Play App Signing (og uploadnøglen) ind i public/.well-known/assetlinks.json (feltet sha256_cert_fingerprints er tomt i dag), tjek at https://www.eatsafe.dk/.well-known/assetlinks.json svarer som application/json, og byg TWA mod www.'
from public.admin_todos where id = 'a2c0a533-dc31-486b-b32f-5cd42ca623f4';
