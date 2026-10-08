-- Opretter og lukker to do'en om at flytte login-nøglen væk fra telefonens lette lagring (opfølgning på indholdsspærren). Idempotent. Sletter intet.
insert into public.admin_todos (title, description, status, priority, track, assignee_id, completed_at)
select '[Før beta] Kode: login-nøglen ud af let lagring',
       'Opfølgning på indholdsspærren (CSP). Den lange login-nøgle lå i telefonens lokale lager, hvor fremmed kode i princippet kunne læse den.',
       'done', 'medium', 'backend', public._admin_id('jafo'), now()
where not exists (select 1 from public.admin_todos where title like '[Før beta] Kode: login-nøglen ud af let lagring%');

insert into public.admin_todo_comments (todo_id, body)
select id, 'Færdig (8. okt.): den lange login-nøgle ligger nu i en HttpOnly-cookie (siden kan ikke læse den), sat af /api/session. Den korte nøgle (ca. 1 time) lever kun i hukommelsen og hentes ved start via cookien. Lokalt ligger kun et mærke "der findes en session". Eksisterende brugere flyttes automatisk ved næste åbning, ingen bliver logget ud. Gælder også admin-panelet. Offline ved start: sessionen beholdes og fornyes, når der er net igen. Privatlivspolitikken dækker allerede login-session og cookies generelt, så ingen tekstændring.'
  from public.admin_todos where title like '[Før beta] Kode: login-nøglen ud af let lagring%'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = admin_todos.id and c.body like 'Færdig (8. okt.): den lange login-nøgle%');
