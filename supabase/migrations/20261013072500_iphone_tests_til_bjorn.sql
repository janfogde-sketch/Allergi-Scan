-- iPhone-tests hører hos Bjørn, som har iPhone (Jan, 13. okt. 2026).
-- 1) Åbne to do'er om iPhone-test flyttes til Bjørns konto. 2) Ny test fra "Hurtigere opstart" (#645). Idempotent.
with bjorn as (
  select id from public.users where lower(email) = 'bjangst@gmail.com' limit 1
), flyt as (
  update public.admin_todos t
     set assignee_id = (select id from bjorn), updated_at = now()
   where t.status <> 'done'
     and (select id from bjorn) is not null
     and (t.title ilike '%iphone%' or t.description ilike '%iphone%')
     and (t.track = 'test' or t.title ilike '%test%' or t.description ilike '%test%')
     and t.assignee_id is distinct from (select id from bjorn)
  returning t.id
)
insert into public.admin_todo_comments (todo_id, body)
select id, 'Flyttet til Bjørn 13. okt. 2026 (Jans beslutning): iPhone-tests tages af Bjørn, som har iPhone.' from flyt;

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] iPhone-test: Læs højt i Madpas og allergen-ikoner (hurtigere opstart)',
       'Test på iPhone efter PR #645: (1) Åbn Madpas, vælg et sprog og tryk "Læs højt"; stemmen skal starte med det samme. (2) Allergen-ikonerne i onboarding og profil skal se ud som før (de er skiftet fra PNG til WebP). (3) Appen skal starte uden fejl. Meld "virker" eller fejl tilbage her.',
       'todo', 'normal', 'test', b.id
  from public.users b
 where lower(b.email) = 'bjangst@gmail.com'
   and not exists (select 1 from public.admin_todos where title like '%iPhone-test: Læs højt i Madpas%');
