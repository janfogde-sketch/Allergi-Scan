-- Statuskommentar på to do 76a3ce14 (udvid typetjekket), runde 2. Lukker ikke punktet. Idempotent.
insert into public.admin_todo_comments (todo_id, body)
select '76a3ce14-f38c-4fed-9b6d-c2f9c15d8d93',
       '14. okt. 2026, runde 2: 17 filer mere har fået typetjek (admin-hooks og -logik, Madpas-hook, juridisk minitekst), i alt ca. 100 af ca. 230. Appen er uændret; én lille rettelse i todoLogic. Tilbage: de store hooks (useShoppingList, useScanner, useAdmin), tekstfilerne, allergenmotoren i supabase/functions/_shared og skærmene (.jsx). Punktet står åbent.'
where not exists (select 1 from public.admin_todo_comments where todo_id = '76a3ce14-f38c-4fed-9b6d-c2f9c15d8d93' and body like '14. okt. 2026, runde 2:%');
