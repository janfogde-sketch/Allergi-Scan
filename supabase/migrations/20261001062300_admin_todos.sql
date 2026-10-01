-- Fælles to do-liste i admin-panelet (1. okt. 2026). Kun admins kan læse og skrive (RLS).
-- admin_todos: opgaver med status, prioritet, spor (backend/design/test/drift), ansvarlig, frist og link.
-- admin_todo_comments: kommentarer pr. opgave, så Jan og Bjørn kan skrive sammen om den.
create table if not exists public.admin_todos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 4000),
  status text not null default 'todo' check (status in ('todo','doing','blocked','done')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  track text not null default 'backend' check (track in ('backend','design','test','drift')),
  assignee_id uuid references public.users(id) on delete set null,
  due_date date,
  link text check (link is null or char_length(link) <= 500),
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid references public.users(id) on delete set null
);
create index if not exists admin_todos_status_idx on public.admin_todos (status, priority, due_date);
create index if not exists admin_todos_assignee_idx on public.admin_todos (assignee_id);

create table if not exists public.admin_todo_comments (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid not null references public.admin_todos(id) on delete cascade,
  author_id uuid references public.users(id) on delete set null default auth.uid(),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists admin_todo_comments_todo_idx on public.admin_todo_comments (todo_id, created_at);

-- updated_at og afslutningstidspunkt/-person følger status automatisk
create or replace function public.admin_todos_touch()
returns trigger language plpgsql set search_path = public as $$
begin
  NEW.updated_at := now();
  if NEW.status = 'done' and (TG_OP = 'INSERT' or OLD.status is distinct from 'done') then
    NEW.completed_at := now();
    NEW.completed_by := auth.uid();
  elsif NEW.status <> 'done' then
    NEW.completed_at := null;
    NEW.completed_by := null;
  end if;
  return NEW;
end;
$$;
drop trigger if exists admin_todos_touch on public.admin_todos;
create trigger admin_todos_touch before insert or update on public.admin_todos
  for each row execute function public.admin_todos_touch();

alter table public.admin_todos enable row level security;
alter table public.admin_todo_comments enable row level security;
revoke all on public.admin_todos, public.admin_todo_comments from anon, authenticated;
grant select, insert, update, delete on public.admin_todos, public.admin_todo_comments to authenticated;
grant all on public.admin_todos, public.admin_todo_comments to service_role;

drop policy if exists admin_todos_select on public.admin_todos;
drop policy if exists admin_todos_insert on public.admin_todos;
drop policy if exists admin_todos_update on public.admin_todos;
drop policy if exists admin_todos_delete on public.admin_todos;
create policy admin_todos_select on public.admin_todos for select to authenticated using (public.is_admin((select auth.uid())));
create policy admin_todos_insert on public.admin_todos for insert to authenticated
  with check (public.is_admin((select auth.uid())) and (created_by is null or created_by = (select auth.uid())));
create policy admin_todos_update on public.admin_todos for update to authenticated
  using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy admin_todos_delete on public.admin_todos for delete to authenticated using (public.is_admin((select auth.uid())));

drop policy if exists admin_todo_comments_select on public.admin_todo_comments;
drop policy if exists admin_todo_comments_insert on public.admin_todo_comments;
drop policy if exists admin_todo_comments_delete on public.admin_todo_comments;
create policy admin_todo_comments_select on public.admin_todo_comments for select to authenticated using (public.is_admin((select auth.uid())));
create policy admin_todo_comments_insert on public.admin_todo_comments for insert to authenticated
  with check (public.is_admin((select auth.uid())) and (author_id is null or author_id = (select auth.uid())));
create policy admin_todo_comments_delete on public.admin_todo_comments for delete to authenticated
  using (public.is_admin((select auth.uid())) and (author_id is null or author_id = (select auth.uid())));

-- Startindhold: de åbne punkter fra CLAUDE.md (30. sept. 2026)
insert into public.admin_todos (title, description, status, priority, track, due_date)
select v.title, v.description, v.status, v.priority, v.track, v.due_date::date
from (values
  ('Ryd testdata fra livetesten af notifikationer', 'Testproduktet med EAN 9999900000017 og Jans scanning af det, testtilbagekaldelsen i recalls (titel starter med LIVETEST), de tilhørende notification_events og notifications, og Jans id på testlisten notifications_test_users.', 'todo', 'high', 'drift', null),
  ('Admin-visning til tilbagekaldelser uden gyldig EAN', 'recalls med status needs_review: vis titel, kilde-link, rå tal (unverified_eans) og teksten. Lad admin søge produkter frem og knytte EAN''er, hvorefter status sættes til ready og hændelsen recall_published lægges i outboxen. Kræver en admin-RPC til opdatering.', 'todo', 'high', 'backend', null),
  ('usePush.js: vis fejl, når push-abonnementet ikke kan gemmes', 'saveTokenToSupabase tjekker ikke svaret fra serveren, så en fejl forsvinder ubemærket (sådan skjulte NOT NULL-fejlen på user_id, at push aldrig virkede).', 'todo', 'normal', 'backend', null),
  ('Test push på iPhone og at et tryk åbner beskeden', 'Android-push er leveret (Google accepterede). Tryk på notifikationen og iPhone (kræver installeret PWA) er ikke bekræftet.', 'todo', 'high', 'test', null),
  ('Test de øvrige notifikationsvarianter med to konti', 'Se docs/notifikationer-testplan.md: invitation accepteret/udløber, delt indkøbsliste, feedback-svar, indsendelse godkendt/afvist.', 'todo', 'normal', 'test', null),
  ('Go-live for notifikationer', 'Sæt notifications_push_enabled og notifications_email_enabled til true og ryd testlisten. Først når testene er gennemført, og kun på Jans ord.', 'blocked', 'high', 'drift', null),
  ('Bjørn: gennemse de nye notifikationsskærme og Resend-forhåndsvisninger', 'Beskeder, enkelt besked og ticket i appen, samt et par af de 22 Resend-skabeloner (supabase/templates/resend/).', 'todo', 'normal', 'design', null),
  ('Design Supabases auth-mails på dansk i EatSafes stil', 'Confirm sign up og Reset password først, dernæst Change email, Magic link, Invite og Reauthentication. Redigeres i Supabase Dashboard → Authentication → Emails → Templates. Gem HTML i supabase/templates/.', 'todo', 'high', 'design', null),
  ('Testrunde på rigtige telefoner med tjeklisten', 'Sat på pause af Jan (30. sept.). Tjekliste: https://claude.ai/artifact/1YwwF252KhrCAWrgSssw1X. Bagefter opretter Claude tickets for fejl.', 'blocked', 'normal', 'test', null),
  ('Leaked Password Protection (kræver Supabase Pro)', 'Beslutning: opgradér Supabase-planen (ca. 25 USD/md, giver også daglige backups og testmiljø)? Jan: vent.', 'blocked', 'low', 'backend', null),
  ('Opryd backup-tabeller fra datarettelser', 'knowledge_base_backup_20260930 og kJ-backup-tabellen fra 30. sept. kan slettes, når alt er verificeret.', 'todo', 'low', 'drift', '2026-11-01'),
  ('N7: ugens opskrifter som notifikation', 'Venter på, at opskrifter kommer tilbage (RECIPES_ENABLED = false, opskrifterne er slettet).', 'blocked', 'low', 'backend', null),
  ('Restaurantguide har ingen indgang i navigationen', 'SCREENS.RESTAURANTGUIDE kan ikke nås fra menuen. Produkt-/navigationsbeslutning: genindfør i menuen, eller drop siden.', 'todo', 'low', 'design', null),
  ('MASTER PROMPT: mikrocopy, tilgængelighed og afsluttende konsistenstjek', 'Resterende punkter fra Bjørns brief: gennemgang af mikrocopy, tilgængelighedstjek og sammenligning af visuel konsistens på tværs af sider.', 'todo', 'low', 'design', null),
  ('Fortsæt med Apple-login', 'Kræver Apple Developer-konto og er en distributionsbeslutning (App Store/TestFlight). Afventer Jans afklaring.', 'blocked', 'low', 'backend', null),
  ('Supabase Pro: backups og testmiljø', 'Største åbne risici fra arkitektur-auditten: ingen backups på Free-planen og intet testmiljø. Senere (Jans beslutning).', 'blocked', 'normal', 'backend', null)
) as v(title, description, status, priority, track, due_date)
where not exists (select 1 from public.admin_todos);
