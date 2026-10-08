-- Lukker to do 3498081d (gradvis typetjek i CI) og opretter en opfølgende to do for resten af filerne. Idempotent. Sletter intet.
insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Efter beta] Kode: udvid typetjekket til flere filer',
       'Forslag fra 3498081d. Typetjekket (npm run typecheck, i CI) dækker nu kernefilerne, jf. tsconfig.check.json. Tilbage: de øvrige hooks (useShoppingList, useHistory, useLoadUserData m.fl.) og derefter skærmene. Pr. fil: skift // @ts-nocheck til // @ts-check, tilføj filen i include, ret fejlene med JSDoc uden at ændre adfærd. Tag få filer ad gangen.',
       'todo', 'low', 'code', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title like '[Efter beta] Kode: udvid typetjekket%');

update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '3498081d-5c12-48de-a551-24bbef940fab' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select id, 'Lukket 8. okt. 2026. Typetjek er slået til på kernefilerne: nøgleordslisten i appen, helpers.js, constants.jsx, samtykke- og liste-delings-logikken samt hooks useAuth, useProduct og useFamily. Kommandoen er npm run typecheck og kører nu i det almindelige CI på hver PR (tager få sekunder). Tjekket fandt ingen fejl i selve allergenlogikken. Det fandt et par uens typer (fx at en login-markering både var sand/falsk og teksten "email"), som er rettet med kommentarer, uden at appens opførsel er ændret. Resten af filerne (ca. 170) står stadig uden tjek; det ligger som ny to do "Udvid typetjekket til flere filer" (efter beta).'
  from public.admin_todos where id = '3498081d-5c12-48de-a551-24bbef940fab'
   and not exists (select 1 from public.admin_todo_comments where todo_id = '3498081d-5c12-48de-a551-24bbef940fab' and body like 'Lukket 8. okt. 2026.%');
