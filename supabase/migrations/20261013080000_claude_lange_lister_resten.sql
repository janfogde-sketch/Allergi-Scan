-- Prøven på 20 lange ingredienslister er tjekket (0 nedgange, 1 højere flag), så jobbet allergen-claude-long må køre resten (ca. 895).
-- Højst 200 Claude-kald i døgnet; jobbet lukker selv to do'en, når intet mangler. Ændrer kun flaget.
update public.app_flags set value = '{"total": 100000}'::jsonb, updated_at = now() where key = 'allergen_claude_long_cap';

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Status 13. okt. 2026: prøven på 20 er kørt og kontrolleret i databasen. 0 nedgange, 1 produkt fik et højere flag (en slikblanding med carmin/karmin fik "bløddyr: ja" af Claude, en forsigtig fejl i den sikre retning), 19 bekræftet uden fund. Resten (ca. 895) kører nu med højst 200 Claude-kald i døgnet, altså ca. 5 dage. Jobbet lukker to do''en selv med tal.'
  from public.admin_todos t
 where t.title like '[Før beta] Data: Claude læser de lange ingredienslister uden fund%' and t.status <> 'done'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Status 13. okt. 2026: prøven på 20%');
