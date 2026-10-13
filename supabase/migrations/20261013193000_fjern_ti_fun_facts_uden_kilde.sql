-- To do 0bf32b9d (Jans ja 13. okt. 2026): ti fun facts, som ingen kilde bekræfter, fjernes, til de er faktatjekket.
-- Sikkerhedskopi (låst: rækkesikkerhed slået til, ingen adgang for anon/authenticated).
create table if not exists public.knowledge_base_funfacts_backup_20261013 as
select * from public.knowledge_base
 where category = 'fun_fact'
   and title in ('Avocado er teknisk en bær','Frisk pasta er ikke mere autentisk end tørret','Frossen spinat indeholder mere oxalat end frisk',
                 'Fuld-fede mejeriprodukter mætter bedre end fedtfattige','Gurkemeje farver alt permanent','Kefir har mindre laktose end mælk',
                 'Lilla gulerødder er de originale','Peanut butter er ikke det samme som jordnøddesmør','Peber er kongens krydderi — historisk set',
                 'Vandmelon kan give allergisk reaktion');
alter table public.knowledge_base_funfacts_backup_20261013 enable row level security;
revoke all on public.knowledge_base_funfacts_backup_20261013 from public, anon, authenticated;

delete from public.knowledge_base
 where category = 'fun_fact'
   and title in ('Avocado er teknisk en bær','Frisk pasta er ikke mere autentisk end tørret','Frossen spinat indeholder mere oxalat end frisk',
                 'Fuld-fede mejeriprodukter mætter bedre end fedtfattige','Gurkemeje farver alt permanent','Kefir har mindre laktose end mælk',
                 'Lilla gulerødder er de originale','Peanut butter er ikke det samme som jordnøddesmør','Peber er kongens krydderi — historisk set',
                 'Vandmelon kan give allergisk reaktion');

update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '0bf32b9d-62a2-4c07-afaa-f24c90bea64b' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select '0bf32b9d-62a2-4c07-afaa-f24c90bea64b',
 'Lukket 13. okt. 2026 (Claude, efter Jans ja): alle opslag i leksikonet har nu en konkret kilde. De ti fun facts uden dækkende kilde er fjernet (kopi i knowledge_base_funfacts_backup_20261013, låst). Ikke gjort: faglig gennemlæsning af en læge/diætist (Jan valgte at bruge tiden på kilder). Ingredienser og retter peger på en emneside plus Fødevarestyrelsens allergenside (baggrund, ikke lægefaglig dokumentation).'
where exists (select 1 from public.admin_todos where id = '0bf32b9d-62a2-4c07-afaa-f24c90bea64b')
  and not exists (select 1 from public.admin_todo_comments where todo_id = '0bf32b9d-62a2-4c07-afaa-f24c90bea64b' and body like 'Lukket 13. okt. 2026 (Claude, efter Jans ja): alle opslag%');
