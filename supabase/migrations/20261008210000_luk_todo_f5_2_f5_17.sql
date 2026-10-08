-- Lukker F5-2 (note "Skrevet på dansk" i Madpas) og F5-17 (ordvalg), lukker F3-9 (Bjørn valgte let skygge) og opretter
-- en to do til Jan om at opdatere de hostede Resend-skabeloner. Idempotent. Sletter intet.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where status <> 'done'
   and (title like '[Før beta] F5-2:%' or title like '[Efter beta] F5-17:%');

insert into public.admin_todo_comments (todo_id, body)
select t.id, case
    when t.title like '[Før beta] F5-2:%' then 'Lukket 8. okt. 2026 (Bjørn valgte A). Egne allergier oversættes ikke; på andre sprog end dansk står "Skrevet på dansk" på madpassets sprog under dem (16 sprog).'
    when t.title like '[Efter beta] F5-17:%' then 'Lukket 8. okt. 2026 (Bjørns valg). "Vidste du, at" med komma; "Allergileksikon" i hele appen; "Advar ved spor" i stedet for "Advar mig"; feedback-flowet siger kun "feedback" ("Din feedback", "Tak for din feedback") og "Svar fra EatSafe", aldrig "tilbagemelding". Mailskabelonerne N3 og N6a-d er rettet i repoet; de hostede kopier i Resend skal opdateres (egen to do).'
    else 'Eksempel sendt til Bjørn 8. okt. 2026: A flade med kant (i dag), B let skygge (--sh), C tydeligere skygge (--sh2) på historik-, liste- og familierækker. Afventer hans valg.' end
  from public.admin_todos t
 where (t.title like '[Før beta] F5-2:%' or t.title like '[Efter beta] F5-17:%' or t.title like '[Efter beta] F3-9:%')
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id
                   and (c.body like 'Lukket 8. okt. 2026 (Bjørn%' or c.body like 'Eksempel sendt til Bjørn 8. okt.%'));

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Mail: opdatér feedback-skabelonerne i Resend',
       'F5-17 ændrede ordvalget i N3 og N6a-d (supabase/templates/resend/) til "Din feedback" og "Svar fra EatSafe". Repo-filerne er rettet, men mailene sendes fra kopierne hostet i Resend, som kun ændres via Resend (RESEND_API_KEY findes kun som edge-secret). Opdatér de fem skabeloner i Resend med indholdet fra repoet, og send en testmail til egen konto.',
       'todo', 'medium', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title like '[Før beta] Mail: opdatér feedback-skabelonerne i Resend%');

-- F3-9: Bjørn valgte B (let skygge) 8. okt. 2026.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where status <> 'done' and title like '[Efter beta] F3-9:%';

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Lukket 8. okt. 2026 (Bjørn valgte B). .list-item, .family-member og .hist-row har nu let skygge (--sh) som appens øvrige kort.'
  from public.admin_todos t
 where t.title like '[Efter beta] F3-9:%'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Lukket 8. okt. 2026 (Bjørn valgte B)%');
