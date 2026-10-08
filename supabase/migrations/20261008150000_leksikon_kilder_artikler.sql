-- Leksikonets kilder (to do 75bdc762): de 15 allergenposter og 14 krydsreaktioner peger nu på de
-- konkrete artikler hos Astma-Allergi Danmark og Sundhed.dk i stedet for forsider.
-- Alle adresser er tjekket 8. okt. 2026 (HTTP 200), og artiklens tekst er læst for de påstande, de understøtter.
-- Idempotent: sætter kun kilderne; ingen anden tekst ændres.
with a as (select 'https://www.astma-allergi.dk/viden-om/allergi/fodevareallergi/hvad-skal-du-undgaa/' as p),
src(category, slug, urls) as (values
  ('allergen','aeg',            array['aeg/']),
  ('allergen','gluten',         array['hvede-og-andet-korn/']),
  ('allergen','hvede',          array['hvede-og-andet-korn/']),
  ('allergen','jordnoedder',    array['jordnodder/']),
  ('allergen','noedder',        array['nodder/']),
  ('allergen','sesam',          array['nodder/']),
  ('allergen','soja',           array['soja/']),
  ('allergen','skaldyr',        array['skaldyr/']),
  ('allergen','bloeddyr',       array['skaldyr/']),
  ('allergen','fisk',           array['fisk/']),
  ('allergen','maelkeallergi',  array['maelk/']),
  ('allergen','lupin',          array['om-varedeklarationer/']),
  ('allergen','sennep',         array['om-varedeklarationer/']),
  ('allergen','selleri',        array['om-varedeklarationer/']),
  ('allergen','svovl',          array['om-varedeklarationer/']),
  ('cross_reaction','cross-jordnod-lupin',   array['jordnodder/']),
  ('cross_reaction','kryds-jordnod-baelg',   array['jordnodder/']),
  ('cross_reaction','cross-nodder-interne',  array['nodder/']),
  ('cross_reaction','cross-soja-baelg',      array['soja/']),
  ('cross_reaction','cross-ko-ged-maelk',    array['maelk/']),
  ('cross_reaction','cross-maelk-oksekod',   array['kod/','maelk/']),
  ('cross_reaction','cross-aeg-fjerkrae',    array['kod/','aeg/']),
  ('cross_reaction','cross-skaldyr-husstov', array['skaldyr/']),
  ('cross_reaction','cross-fisk-kryds',      array['fisk/']),
  ('cross_reaction','cross-peberrod-sennep', array['krydsreaktioner-med-fodevarer/'])
)
update public.knowledge_base k
   set sources = (select array_agg(a.p || u order by ord) from a, unnest(s.urls) with ordinality as t(u, ord))
                 || case when k.category = 'allergen'
                         then array['https://www.sundhed.dk/borger/patienthaandbogen/allergi/sygdomme/foedevareallergi-og-intolerance-kostraad/maerkning-af-foedevarer/']
                         else array[]::text[] end,
       updated_at = now()
  from src s
 where k.category = s.category and k.slug = s.slug;

-- Krydsreaktioner via pollen og latex: egne artikler.
update public.knowledge_base set updated_at = now(), sources = case slug
  when 'cross-latex-frugt' then array['https://www.astma-allergi.dk/viden-om/allergi/latex/','https://www.sundhed.dk/borger/patienthaandbogen/allergi/sygdomme/oevrige-sygdomme/latexallergi/']
  when 'cross-graes-tomat' then array['https://www.astma-allergi.dk/viden-om/allergi/pollenallergi/typer-af-pollen/graes/','https://www.astma-allergi.dk/viden-om/allergi/fodevareallergi/hvad-skal-du-undgaa/krydsreaktioner-med-fodevarer/']
  when 'cross-artemisia-selleri' then array['https://www.astma-allergi.dk/viden-om/allergi/pollenallergi/typer-af-pollen/bynke/','https://www.astma-allergi.dk/viden-om/allergi/fodevareallergi/hvad-skal-du-undgaa/krydsreaktioner-med-fodevarer/']
  when 'cross-birk-aebel' then array['https://www.astma-allergi.dk/viden-om/allergi/pollenallergi/typer-af-pollen/birk/','https://www.astma-allergi.dk/viden-om/allergi/fodevareallergi/hvad-skal-du-undgaa/krydsreaktioner-med-fodevarer/']
  end
 where category = 'cross_reaction' and slug in ('cross-latex-frugt','cross-graes-tomat','cross-artemisia-selleri','cross-birk-aebel');

-- To do: luk 75bdc762 og opret opfølgning.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '75bdc762-a61e-4ebe-beb5-461235e11623' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select '75bdc762-a61e-4ebe-beb5-461235e11623',
       'Lukket 8. okt. 2026. Alle 15 allergenposter og alle 14 krydsreaktioner peger nu på konkrete artikler (Astma-Allergi Danmark og Sundhed.dk) i stedet for forsider; adresserne er tjekket (svarer 200), og teksten er læst for de påstande, de støtter (fx lupin under jordnødder, mælk/okse og æg/kylling under kød, husstøvmider under skaldyr, tomat/græspollen, birk/æble). Intet visuelt ændret: kilderne vises som før i "Kilder og faglig gennemgang". Mangler: peberrod ↔ sennep har kun den generelle krydsreaktionsartikel (ingen kilde fundet, der nævner parret), og de øvrige ca. 740 poster (ingredienser, E-numre, retter, FAQ, fun facts, kostformer) har stadig forsider som kilde. Medicinsk rigtighed er ikke vurderet; faglig gennemlæsning ligger i ny to do.'
where exists (select 1 from public.admin_todos where id = '75bdc762-a61e-4ebe-beb5-461235e11623')
  and not exists (select 1 from public.admin_todo_comments where todo_id = '75bdc762-a61e-4ebe-beb5-461235e11623' and body like 'Lukket 8. okt. 2026.%');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Leksikonets kilder del 2: faglig gennemlæsning og kilder til resten',
       'Opfølgning på 75bdc762. De 15 allergenposter og 14 krydsreaktioner har nu artikel-kilder. Tilbage: (1) ca. 740 poster (343 ingredienser, 247 E-numre, 61 retter, 38 FAQ, 42 fun facts, 8 kostformer) peger stadig på forsider (eufic.org, foedevarestyrelsen.dk, Wikipedia/EFSA). Forslag: giv FAQ en artikel pr. spørgsmål først, og vis kun kilder, hvor de er konkrete. (2) Faglig gennemlæsning af indholdet: afklar hvem (Bjørn/Jan, evt. en allergolog). Medicinsk rigtighed er ikke vurderet. Foreslået frist: før beta.',
       'todo', 'normal', 'backend', assignee_id
from public.admin_todos where id = '75bdc762-a61e-4ebe-beb5-461235e11623'
  and not exists (select 1 from public.admin_todos where title like '[Før beta] Leksikonets kilder del 2%');
