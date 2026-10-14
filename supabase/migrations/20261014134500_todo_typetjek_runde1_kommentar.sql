-- Statuskommentar på to do "Udvid typetjekket til flere filer" (runde 1, 14. okt. 2026). Kun skrivning til to do-listen. Idempotent.
insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Runde 1 (14. okt. 2026): typetjekket dækker nu 36 filer mere, hovedsageligt de små og mellemstore hooks og hjælpefiler (feedback, notifikationer, push, historik, alternativer, onboarding, familie-invitationer, fejlrapportering m.fl.). Tjekket fandt kun 11 små fejl, alle rettet med typenoter uden at ændre appens opførsel. Lint og alle tests er grønne. Tilbage: de store hooks (useShoppingList, useScanner, useAdmin, madpasText) og skærmene (.jsx), ca. 130 filer. Opgaven står åben til næste runde.'
  from public.admin_todos t
 where t.title like '[Efter beta] Kode: udvid typetjekket%'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Runde 1 (14. okt. 2026)%');
