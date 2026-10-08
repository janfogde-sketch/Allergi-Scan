-- (Rækken findes ikke i en ny testdatabase; derfor select i stedet for values.)
-- Lukker to do'en om indholdsspærre (CSP) og sikkerhedshoveder, når PR'en er merget.
update public.admin_todos
set status = 'done'
where id = '1f131166-048e-4dfe-b0b3-d5a02cb980fa';

insert into public.admin_todo_comments (todo_id, body)
select id,
  'Færdig (8. okt.): indholdsspærre (CSP) og sikkerhedshoveder (nosniff, ingen indramning, referrer, kamera/lokation kun for appen) ligger i vercel.json. Indlejrede scripts er flyttet til filer, og service workeren sender kun egne adresser igennem. Testet i Chromium: ingen blokeringer på forside, app, invitation, liste, admin, politiksider, kamera, Supabase og Open Food Facts-billeder. Login-nøglen ligger stadig i telefonens lokale lager (flytning til sikker cookie ville logge alle ud og kræver stor ombygning); spærren er skjoldet mod fremmed kode. Opfølgning (forslag): flyt login-nøglen til cookie efter beta.'
from public.admin_todos
where id = '1f131166-048e-4dfe-b0b3-d5a02cb980fa';
