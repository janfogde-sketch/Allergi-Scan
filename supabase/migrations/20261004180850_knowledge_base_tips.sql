-- "Vidste du, at …"-kortet på scanner-forsiden (4. okt. 2026, Bjørn).
-- Korte, godkendte fakta pr. leksikon-opslag. Hvert tip gengiver kun noget, der står i opslagets egen tekst,
-- og kortet viser kun opslag med tips (ingen frit genererede fakta). Relevans styres af opslagets allergen_ids.
alter table public.knowledge_base add column if not exists tips text[];
comment on column public.knowledge_base.tips is 'Godkendte korte fakta (højst ca. 90 tegn) til "Vidste du, at …"-kortet. Skal kunne findes i opslagets egen tekst.';

update public.knowledge_base set tips = array[
  'Laktosefri mælk indeholder stadig mælkeprotein og er ikke egnet ved mælkeallergi.',
  'Mælk fra ged og får ligner komælk og giver ofte også reaktioner ved mælkeallergi.'] where slug = 'maelkeallergi';
update public.knowledge_base set tips = array['Mælkeallergi handler om mælkens protein, laktoseintolerans om mælkesukkeret.'] where slug = 'faq-maelk-vs-laktose';
update public.knowledge_base set tips = array['Lagret hård ost som parmesan og cheddar indeholder næsten ingen laktose.'] where slug = 'fun-parmesan';
update public.knowledge_base set tips = array['Ved ægallergi kan både æggehviden og æggeblommen give reaktioner.'] where slug = 'aeg';
update public.knowledge_base set tips = array['Mange børn vokser fra mælke- og ægallergi inden skolealderen.'] where slug = 'faq-vokse-fra-allergi';
update public.knowledge_base set tips = array[
  'Jordnødder er bælgfrugter og ikke nødder, men nogle reagerer på begge.',
  'Jordnøddeproteiner tåler varme, så ristning fjerner dem ikke.'] where slug = 'jordnoedder';
update public.knowledge_base set tips = array['Lupin bruges som mel i fx glutenfrit bagværk og pasta.'] where slug = 'lupin';
update public.knowledge_base set tips = array['Nogle med nøddeallergi reagerer på flere nøddetyper, andre kun på én.'] where slug = 'noedder';
update public.knowledge_base set tips = array['Sesam findes fx i bagværk, tahini, hummus, halva og mange asiatiske retter.'] where slug = 'sesam';
update public.knowledge_base set tips = array['Sennep gemmer sig ofte i saucer, dressinger, marinader og pølser.'] where slug = 'sennep';
update public.knowledge_base set tips = array['Både knoldselleri, bladselleri og sellerifrø kan give reaktioner.'] where slug = 'selleri';
update public.knowledge_base set tips = array['Soja findes i mange former, fx tofu, sojadrik, sojaprotein og sojalecitin.'] where slug = 'soja';
update public.knowledge_base set tips = array['Traditionel sojasauce brygges med hvede og indeholder gluten.'] where slug = 'fun-soja-gluten';
update public.knowledge_base set tips = array['Glutenfri produkter kan indeholde hvedestivelse og passer ikke altid ved hvedeallergi.'] where slug = 'hvede';
update public.knowledge_base set tips = array['Cøliaki er en autoimmun sygdom og ikke en allergi.'] where slug = 'faq-coeliaki';
update public.knowledge_base set tips = array['Havre er naturligt glutenfri, men forurenes ofte med hvede under dyrkning.'] where slug = 'faq-havre-gluten';
update public.knowledge_base set tips = array['Muslinger og blæksprutter er bløddyr, en anden allergengruppe end rejer og krabber.'] where slug = 'skaldyr';
update public.knowledge_base set tips = array['Fiskeallergi og skaldyrsallergi er forskellige, og man kan have den ene uden den anden.'] where slug = 'fisk';
update public.knowledge_base set tips = array['Sulfitter bruges fx i vin og tørret frugt og skal angives over 10 mg pr. kg.'] where slug = 'svovl';
update public.knowledge_base set tips = array['Økologiske varer indeholder de samme allergener som konventionelle.'] where slug = 'faq-oko-allergen';
update public.knowledge_base set tips = array['Allergener skal fremhæves i ingredienslisten, fx med fed eller kursiv.'] where slug = 'faq-ingrediensliste';
update public.knowledge_base set tips = array['"Kan indeholde spor af" er en frivillig advarsel fra producenten.'] where slug = 'faq-spormaengder';
update public.knowledge_base set tips = array['Ved allergi reagerer immunforsvaret, ved intolerance gør det ikke.'] where slug = 'faq-allergi-vs-intolerans';
