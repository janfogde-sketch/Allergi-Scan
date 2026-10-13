-- Kostpræferencer (diæter) er fjernet fra appen og fra privatlivspolitikken (13. okt. 2026, Jan).
-- Gemte valg ryddes, så vi ikke opbevarer oplysninger, politikken ikke længere beskriver (dataminimering).
-- Kolonnerne users.diets og family_members.diets bevares (tomme), så funktionen kan genindføres uden skemaændring.
update public.users set diets = '[]'::jsonb where diets is not null and diets <> '[]'::jsonb;
update public.family_members set diets = '[]'::jsonb where diets is not null and diets <> '[]'::jsonb;

-- To do b0554005 (Fjern Opskrifter, diæter og madspild-hook): afsluttet.
update public.admin_todos set status = 'done' where id::text like 'b0554005%' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Afsluttet 13. okt. 2026: Opskrifter, den ugentlige opskriftsmail og madspild-hooken blev fjernet i PR 698. Kostpræferencer (diæter) er nu også fjernet: onboarding, familieformular, Madpas, Rediger præferencer, admin og statussystemet. Gemte diæt-valg er ryddet i databasen (kolonnerne bevares tomme), og privatlivspolitik og vilkår er rettet (sidst opdateret 13. okt.). Samtykke-versionen er ikke hævet, fordi ændringen kun indsnævrer, hvad vi behandler. Den deployede funktion weekly-digest ligger stadig i Supabase og kan slettes i konsollen.'
  from public.admin_todos t
 where t.id::text like 'b0554005%'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Afsluttet 13. okt. 2026: Opskrifter, den ugentlige%');
