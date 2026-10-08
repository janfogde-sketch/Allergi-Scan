-- Lukker to do 1ba902a0 (mindre polling i Familie) med en statuskommentar. Sletter intet.
update admin_todos set status = 'done'
 where id = '1ba902a0-0351-4e3b-8ddb-2806add7c0bd';

insert into admin_todo_comments (todo_id, body)
select id, 'Færdig (8. okt. 2026): Familie-siden henter nu husstand og invitationer hvert 60. sekund i stedet for hvert 12., og kun mens appen er synlig; kommer man tilbage til appen, hentes der straks. Anmodninger om delt link tjekkes hvert 60. sekund i stedet for hvert 30. (stoppede allerede, når appen er skjult). Ingen synligt designskift, ingen databaseændring.'
  from admin_todos where id = '1ba902a0-0351-4e3b-8ddb-2806add7c0bd';
