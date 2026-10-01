-- Kun to admin-konti: jafo (Jan) og bho (Bjørn). Jans øvrige konti bliver almindelige brugere,
-- og deres to do-opgaver flyttes til jafo.
update public.admin_todos
set assignee_id = '9e92dc72-f105-454c-b793-eec22ccf8ca3'
where assignee_id in ('6a759160-9bde-43bf-8619-e19e454323a5', '9ae4ac4c-8cb0-489e-b31b-13bec0f77fd3');

update public.admin_todos
set created_by = '9e92dc72-f105-454c-b793-eec22ccf8ca3'
where created_by in ('6a759160-9bde-43bf-8619-e19e454323a5', '9ae4ac4c-8cb0-489e-b31b-13bec0f77fd3');

update public.admin_todos
set completed_by = '9e92dc72-f105-454c-b793-eec22ccf8ca3'
where completed_by in ('6a759160-9bde-43bf-8619-e19e454323a5', '9ae4ac4c-8cb0-489e-b31b-13bec0f77fd3');

-- Spærren mod rolleændring kræver en indlogget admin; migrationer kører uden auth.uid().
alter table public.users disable trigger prevent_role_self_escalation_trigger;

update public.users
set role = 'user'
where role = 'admin'
  and id in ('6a759160-9bde-43bf-8619-e19e454323a5', '9ae4ac4c-8cb0-489e-b31b-13bec0f77fd3');

alter table public.users enable trigger prevent_role_self_escalation_trigger;
