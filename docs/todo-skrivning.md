# Skriv til to do-listen (Jan, 14. okt. 2026)

To do-ændringer (oprette, kommentere, lukke) laves **ikke** som migrationsfiler og ikke med `execute_sql`. De køres med
workflowet **Skriv til to do** (`.github/workflows/todo-write.yml`), som kalder databasefunktionen `public.todo_apply`.
Funktionen kan kun oprette/rette opgaver og oprette kommentarer i `admin_todos`/`admin_todo_comments`: ingen sletning, ingen andre tabeller,
ingen fri SQL. Ingen PR, intet migrationsnummer, ingen CI og ingen Vercel-udrulning. Lykkes workflowet, er ændringen i databasen (ellers rulles alt tilbage).

## Sådan gør tråden

1. Find opgavens id med en læsning (`select id, title, status from admin_todos where ...`, `execute_sql` uden skrivning er fint).
2. Start workflowet: GitHub-værktøjet `actions_run_trigger` (method `run_workflow`, workflow `todo-write.yml`, ref `main`,
   inputs `{"payload": "<JSON som tekst>"}`). Ref skal være `main`, hvor workflowet ligger.
3. Hent kørslen med `actions_list` (list_workflow_runs) og `actions_get`/`get_job_logs`; vent til den står `success`. Log viser handlingerne og svaret.
4. **Verificér selv** med en læsning bagefter (status, kommentar), som Jan har bedt om.

## Format

```json
{"ops":[
  {"op":"create","title":"…","description":"…","track":"backend","priority":"high","assignee":"jafo","due_date":"2026-11-01","link":"https://…"},
  {"op":"update","id":"<uuid>","status":"done"},
  {"op":"comment","todo_id":"<uuid>","body":"Gjort i PR …"}
]}
```

- `create`: kun `title` er påkrævet. Standard: `status` todo, `priority` normal, `track` backend. `assignee` er brugerens mailpræfiks (`jafo`, `bho`).
- `update`: kun felter, der er med, ændres. Send `"due_date": null`/`"assignee": null`/`"link": null` for at tømme. Felter: title, description, status (todo/doing/blocked/done), priority (low/normal/high), track (backend/design/test/drift), assignee, due_date, link.
- `comment`: `todo_id` og `body`. Kommentaren får ingen forfatter (workflowet har ingen bruger).
- Højst 50 handlinger pr. kørsel; sæt alt for en omgang i ét kald. En ugyldig handling rulles hele kaldet tilbage.
- Lukker man en opgave fra en ticket, sendes beskeden til indsenderen som før (trigger).
- Vil du slette en opgave, så gør det i admin-panelet.
