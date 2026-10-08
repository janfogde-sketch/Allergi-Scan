-- Forslag (Jan beslutter): engangskørsel af Claude over eksisterende lange ingredienslister uden fund.
insert into public.admin_todos (title, description, status, priority, track)
select '[Forslag] Claude-engangskørsel over lange ingredienslister uden fund (ca. 4 kr.)',
  'Forslag fra "uden"-reglen (8. okt.): ca. 1.420 eksisterende produkter har en ingrediensliste på mindst 200 tegn, hvor nøgleordsmotoren ikke finder noget. Nye produkter får nu automatisk Claude-tjek, men de eksisterende er ikke læst. Forslag: kør Claude over dem i små portioner (via allergen-reanalyze, kun opadgående, med backup-tabel først). Pris ca. 4 kr. Jan beslutter, om det skal køres. Ikke påbegyndt.',
  'todo', 'normal', 'backend'
where not exists (select 1 from public.admin_todos where title like '[Forslag] Claude-engangskørsel%');
