-- Statuskommentar på to do "Udvid typetjekket til flere filer" (runde 2, 14. okt. 2026). Kun skrivning til to do-listen. Idempotent.
insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Runde 2 (14. okt. 2026): 17 filer mere har fået typetjek (admin-hooks og -logik, Madpas-hook, juridisk minitekst). Appen er uændret; én lille rettelse i todoLogic. Tilbage: de store hooks (useShoppingList, useScanner, useAdmin), tekstfilerne, allergenmotoren i supabase/functions/_shared og skærmene (.jsx). Opgaven står åben til næste runde.'
  from public.admin_todos t
 where t.title like '[Efter beta] Kode: udvid typetjekket%'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Runde 2 (14. okt. 2026)%');
