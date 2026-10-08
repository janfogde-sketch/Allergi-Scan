-- Lukker to do 08b2d37e (kategorihuller) med statuskommentar. Idempotent.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '08b2d37e-6beb-4375-b92e-6a661dcea2da' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select '08b2d37e-6beb-4375-b92e-6a661dcea2da',
       'Lukket 8. okt. 2026. Af 20.182 produkter har nu 20.054 en underkategori (før: ca. 2.800), og kun 1 produkt mangler kategori (før: 324; de 3 med rå Open Food Facts-tekst er rettet). Klassificeringen kørte via det planlagte job classify-categories-backlog (582 Claude-kald, under loftet på 1.000 i døgnet). 128 produkter kunne Claude ikke placere sikkert; de er stemplet og forsøges ikke igen (stikprøver af resten ser rigtige ud). Jobbet bliver stående og samler nye produkter op fra auto-import, men gør intet, når intet mangler.'
where exists (select 1 from public.admin_todos where id = '08b2d37e-6beb-4375-b92e-6a661dcea2da')
  and not exists (select 1 from public.admin_todo_comments where todo_id = '08b2d37e-6beb-4375-b92e-6a661dcea2da' and body like 'Lukket 8. okt. 2026.%');
