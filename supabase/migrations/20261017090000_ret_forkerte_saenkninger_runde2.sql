-- Gennemgang 16. okt. 2026, runde 2, fund B1 (kritisk): to varer fik flag sænket i kørslen 7. okt. (apply_down), selvom pakken
-- siger noget andet. Begge står med allergen_quality = 'high' og metode 'keyword+claude', så appen viser dem GRØNT i dag.
--   0077330346085 Danish luxury cookies (italiensk liste): "burro (7%)", "siero di latte in polvere (latte)", "Farina di frumento",
--     "Può contenere tracce ... d'uovo". Stod: maelkeallergi/laktose/gluten/hvede/aeg = no. Skal være yes/yes/yes/yes/traces.
--   8411037892360 Brownies m. chokoladestykker: "AEG" (ASCII for æg) som ingrediens. Stod: aeg = no. Skal være yes.
-- Kun opadgående, som CLAUDE.md kræver. Rører kun de nævnte felter på de to varer.
-- Idempotent: where-betingelsen sikrer, at et højere flag aldrig sænkes, hvis nogen allerede har rettet det.
update public.products
   set allergen_flags = allergen_flags || '{"maelkeallergi":"yes","laktose":"yes","gluten":"yes","hvede":"yes"}'::jsonb,
       updated_at = now()
 where ean = '0077330346085'
   and (coalesce(allergen_flags->>'maelkeallergi', 'no') in ('no', 'unknown', 'traces')
     or coalesce(allergen_flags->>'laktose', 'no') in ('no', 'unknown', 'traces')
     or coalesce(allergen_flags->>'gluten', 'no') in ('no', 'unknown', 'traces')
     or coalesce(allergen_flags->>'hvede', 'no') in ('no', 'unknown', 'traces'));

update public.products
   set allergen_flags = jsonb_set(allergen_flags, '{aeg}', '"traces"'),
       updated_at = now()
 where ean = '0077330346085'
   and coalesce(allergen_flags->>'aeg', 'no') in ('no', 'unknown');

update public.products
   set allergen_flags = jsonb_set(allergen_flags, '{aeg}', '"yes"'),
       updated_at = now()
 where ean = '8411037892360'
   and coalesce(allergen_flags->>'aeg', 'no') in ('no', 'unknown', 'traces');
