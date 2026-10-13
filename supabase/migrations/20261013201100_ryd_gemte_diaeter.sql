-- Gemte kostpræferencer (diæter) ryddes (Jans valg 13. okt. 2026), fordi de ikke længere bruges eller beskrives i politikken.
-- Først en låst sikkerhedskopi (RLS slået til, ingen adgang for appens roller). Slettes igen senest 12. nov. 2026 (30 dage).
create table if not exists public.users_diets_backup_20261013 as
  select id, diets from public.users where diets is not null and diets <> '[]'::jsonb;
create table if not exists public.family_members_diets_backup_20261013 as
  select id, diets from public.family_members where diets is not null and diets <> '[]'::jsonb;
alter table public.users_diets_backup_20261013 enable row level security;
alter table public.family_members_diets_backup_20261013 enable row level security;
revoke all on public.users_diets_backup_20261013 from anon, authenticated, public;
revoke all on public.family_members_diets_backup_20261013 from anon, authenticated, public;

update public.users set diets = '[]'::jsonb where diets is not null and diets <> '[]'::jsonb;
update public.family_members set diets = '[]'::jsonb where diets is not null and diets <> '[]'::jsonb;

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Gemte diæt-valg er ryddet (Jans valg 13. okt. 2026). Låst sikkerhedskopi: users_diets_backup_20261013 og family_members_diets_backup_20261013. Skal slettes senest 12. nov. 2026.'
  from public.admin_todos t
 where t.id::text like 'b0554005%'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Gemte diæt-valg er ryddet%');
