-- Lukker to do 378c990e (fælles kode i serverfunktioner) med en statuskommentar. Sletter intet.
update admin_todos set status = 'done'
 where id = '378c990e-977e-4bcc-a81d-340b59b357a7';

insert into admin_todo_comments (todo_id, body)
select id, 'Færdig (8. okt. 2026): CORS-headere (fælles corsFor) og login-tjekket (fælles getCaller) ligger nu i _shared/http.ts og bruges af de funktioner, hvor koden var ens ord for ord. Alle funktioner henter nu databasebiblioteket fra samme sted (jsr, version 2.117.2), og de fem sidste starter med Deno.serve i stedet for det gamle serve. Opførslen er uændret. Bevidst ikke samlet: admin, products, search og notify-test (andre fejlbeskeder eller ekstra logik i login-tjekket), de enkelte json()-hjælpere (forskellig form) og admin-tjek (11 formuleringer, hver med egen rolle-logik); kan tages som en ny opgave, hvis ønsket. Tests og lint er grønne.'
  from admin_todos where id = '378c990e-977e-4bcc-a81d-340b59b357a7';
