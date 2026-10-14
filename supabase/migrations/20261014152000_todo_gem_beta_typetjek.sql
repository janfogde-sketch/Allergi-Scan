-- Samlet to do-oprydning 14. okt. 2026: gem-bjælke (F3-13) og BETA-mærke lukkes, typetjek får statuskommentar (står åben).
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id in ('0f361b1a-7ab9-4083-9708-1919bbd65d56', '1f0d1358-c077-48e4-bde1-0d96ac503f96') and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select '0f361b1a-7ab9-4083-9708-1919bbd65d56',
 'Lukket 14. okt. 2026 (Claude): gem-bjælken (.save-bar) har nu solid hvid baggrund uden sløring (PR 741), så indhold under den ikke længere skinner igennem.'
where exists (select 1 from public.admin_todos where id = '0f361b1a-7ab9-4083-9708-1919bbd65d56');

insert into public.admin_todo_comments (todo_id, body)
select '1f0d1358-c077-48e4-bde1-0d96ac503f96',
 'Lukket 14. okt. 2026 (Claude): BETA-mærket og "Beta" ved Version i Indstillinger er skjult i butiksudgaven (genkendes på startadressen /?src=store, Android-referreren dk.eatsafe.app eller Capacitor; PR 743). Browser og installeret hjemmeside viser BETA som før. Ikke testet i en rigtig butiksapp, den findes endnu ikke.'
where exists (select 1 from public.admin_todos where id = '1f0d1358-c077-48e4-bde1-0d96ac503f96');

insert into public.admin_todo_comments (todo_id, body)
select '76a3ce14-f38c-4fed-9b6d-c2f9c15d8d93',
 'Status 14. okt. 2026 (Claude): runde 2 er merget (PR 744), 17 filer mere er med i typetjekket. Ca. 130 filer mangler, mest de store hooks og skærmene. Punktet står åbent.'
where exists (select 1 from public.admin_todos where id = '76a3ce14-f38c-4fed-9b6d-c2f9c15d8d93');
