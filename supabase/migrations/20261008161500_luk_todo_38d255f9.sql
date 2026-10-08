-- Lukker to do 38d255f9 (indeks til auto-reparse og adminsøgning; indekset kom med 20261008160000_indeks_auto_reparse.sql).
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '38d255f9-5c4e-428a-be32-a61f415b73f8' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select '38d255f9-5c4e-428a-be32-a61f415b73f8',
       'Lukket 8. okt. 2026. Natlig auto-reparse: nyt lille indeks (idx_products_reparse_queue) dækker præcis forespørgslen. Målt i produktion efter udrulning: 2.515 ms før (læste alle 20.183 produkter) mod 0,07 ms efter, og planen bruger indekset. Det gamle indeks kun for "pending" (idx_products_allergen_quality) er fjernet, da det nye dækker det samme, så der er ingen dublet. Adminsøgning på produkter: ingen nyt indeks nødvendigt. Navn og mærke har allerede trigram-indeks, ean har sit unikke indeks, og planen bruger dem (ca. 0,2 s for et bredt ord som "mælk" med 486 hits; tiden går på at hente rækkerne, ikke på at søge). Den gamle måling på 0,9 s stammer fra før de indeks. Ingen data er ændret.'
where exists (select 1 from public.admin_todos where id = '38d255f9-5c4e-428a-be32-a61f415b73f8')
  and not exists (select 1 from public.admin_todo_comments where todo_id = '38d255f9-5c4e-428a-be32-a61f415b73f8' and body like 'Lukket 8. okt. 2026.%');
