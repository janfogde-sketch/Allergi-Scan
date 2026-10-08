-- Lukker to do'en "politikløkke mellem families og family_memberships" (rettet i 20261008100000).
update public.admin_todos set status = 'done' where id = '522551ba-e91b-45b1-b3c0-9014d26caf6f';
insert into public.admin_todo_comments (todo_id, body)
values ('522551ba-e91b-45b1-b3c0-9014d26caf6f',
  'Rettet 8. okt. 2026 (PR #609): læsereglerne for families og family_memberships bruger nu to hjælpefunktioner i stedet for at slå op i hinanden, så løkken er væk. Hvem der må se hvad er uændret. Adgangstesten i CI har ikke længere en undtagelse for fundet og er grøn. Verificeret i databasen: migrationen er kørt, begge funktioner findes, anon har ikke adgang til dem. Appen læser ikke tabellerne direkte, så ingen skærm er berørt.');
