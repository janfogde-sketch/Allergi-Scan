-- Lukker to do a9b909ed (nye produkter uden ingrediensliste skal få unknown).
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'a9b909ed-2a93-46e2-8e10-1cdac31b4dbd' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select 'a9b909ed-2a93-46e2-8e10-1cdac31b4dbd',
       'Lukket 8. okt. 2026. Reglen ligger nu i databasen (trigger trg_products_unknown_without_ingredients, migration 20261008194000): hver vare, der oprettes eller ændres uden ingrediensliste, får unknown på alle 16 allergener, undtagen yes/traces (kendt indhold fra fx Open Food Facts) og producent-verificerede varer. Det dækker alle veje ind (products, auto-import-off, Bilka-import, indsendelser) uden ny edge-deploy. Eksisterende varer var allerede rettet (7. okt.); kontrol 8. okt.: ingen af de 2.282 varer uden ingrediensliste har nej på gluten (de står på unknown). DB-test: supabase/tests/unknown_without_ingredients.sql. To do 2529e204 (importen) er ikke lukket endnu: den venter stadig på et nyt importeret produkt til verifikation.'
where exists (select 1 from public.admin_todos where id = 'a9b909ed-2a93-46e2-8e10-1cdac31b4dbd')
  and not exists (select 1 from public.admin_todo_comments where todo_id = 'a9b909ed-2a93-46e2-8e10-1cdac31b4dbd' and body like 'Lukket 8. okt. 2026.%');
