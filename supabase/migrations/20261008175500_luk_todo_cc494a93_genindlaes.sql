-- Lukker to do cc494a93 (ingen genindlæsning ved første besøg) med en statuskommentar. Sletter intet.
update admin_todos set status = 'done'
 where id = 'cc494a93-b9c0-4ec3-92ae-80f9aae8afde';

insert into admin_todo_comments (todo_id, body)
select id, 'Færdig (8. okt. 2026): appen genindlæser sig ikke længere selv ved allerførste besøg. Den genindlæser kun, når en ældre version allerede var aktiv og blev afløst af en ny (så opdateringer stadig overtager åbne faner). Offline-siden og indholdsspærren er uændrede. Ingen databaseændring.'
  from admin_todos where id = 'cc494a93-b9c0-4ec3-92ae-80f9aae8afde';
