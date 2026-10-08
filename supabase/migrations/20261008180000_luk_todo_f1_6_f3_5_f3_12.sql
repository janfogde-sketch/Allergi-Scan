-- Lukker de tre sidste frontend-punkter før beta (F1-6, F3-5, F3-12/F4-10). Idempotent. Sletter intet.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where status <> 'done'
   and (title like '[Før beta] F1-6:%' or title like '[Før beta] F3-5:%' or title like '[Før beta] F3-12/F4-10:%');

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Lukket 8. okt. 2026 (Bjørn: "push og merge"). ' || case
    when t.title like '[Før beta] F1-6:%' then 'Note i Indstillinger og onboarding trin 5, når push ikke kan bruges; på iPhone i Safari med link til installationsguiden.'
    when t.title like '[Før beta] F3-5:%' then 'Invitationskortets handlingsknapper bruger .btn-primary/.btn-outline.'
    else 'Tryk-feedback på liste, knap-tags, tilbageknap, velkomstknap og invitationsvalg; hover-fade kun med mus.' end
  from public.admin_todos t
 where (t.title like '[Før beta] F1-6:%' or t.title like '[Før beta] F3-5:%' or t.title like '[Før beta] F3-12/F4-10:%')
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Lukket 8. okt. 2026 (Bjørn%');
