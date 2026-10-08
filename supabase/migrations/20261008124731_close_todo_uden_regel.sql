-- Lukker to do'en om samlet "uden"-regel og bredere Claude-reserve-tjek, når PR'en er merget.
update public.admin_todos
set status = 'done'
where id = '88a4871c-fb56-4f6d-a447-f85fc6325862';

insert into public.admin_todo_comments (todo_id, body)
select id,
  'Færdig (8. okt.): (1) Fremhævning, egne allergier og kostjek bruger nu SAMME negationsregel som serveren (negation gælder kun inden for samme kommasegment; "glutenfrit/glutenfrie" tæller nu også). Tørkørsel på 250 produkter med "uden/fri for/free": 10 får færre falske fund i fremhævningen, ingen får flere; serverens egne flag ændrede sig for 0 af de 250. (2) Claude-reserve-tjek: en liste på mindst 200 tegn, hvor nøgleordene ikke finder noget som helst, læses nu også af Claude (kan kun hæve et flag). Før: 300 produkter ramte "uden"-reglen; nu kommer ca. 1.420 eksisterende produkter i målgruppen, men de røres kun, hvis de genanalyseres. Nye produkter: 14 på 30 dage, 2 ville ramme reglen, så døgnloftet (100 pr. bruger, 300 globalt) er langt fra at blive ramt. Ingen gemte data er ændret. CLAUDE.md-teksten om to nøgleordskopier er allerede rettet. Opfølgning (forslag, ikke oprettet): kør Claude over de ca. 1.420 eksisterende lange lister uden fund som engangskørsel i små portioner (ca. 1.420 kald, ca. 4 kr.) efter Jans ja.'
from public.admin_todos
where id = '88a4871c-fb56-4f6d-a447-f85fc6325862';
