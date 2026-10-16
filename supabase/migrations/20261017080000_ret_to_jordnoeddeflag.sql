-- Gennemgang 16. okt. 2026, fund A2 (kritisk): to varer viser "ingen jordnødder", selvom pakken siger noget andet.
-- Kørslen 7. okt. sænkede flaget, fordi motoren ikke kendte de norske/svenske ord "peanøtter"/"jordnötter".
--   7340011442332 Coop Chocolate Peanuts: "peanøtter 24%" i ingredienslisten. Stod: jordnoedder = no. Skal være yes.
--   7350104401115 Mandelbar m. chokolade: "Kan innehålla spår av ... JORRDNÖTTER/PEANØTTER". Stod: no. Skal være traces.
-- Kun opadgående (no -> yes / no -> traces), som CLAUDE.md kræver. Rører kun det ene felt på de to varer.
-- Idempotent: where-betingelsen sikrer, at et højere flag aldrig sænkes, hvis nogen allerede har rettet det.
update public.products
   set allergen_flags = jsonb_set(allergen_flags, '{jordnoedder}', '"yes"'),
       updated_at = now()
 where ean = '7340011442332'
   and coalesce(allergen_flags->>'jordnoedder', 'no') in ('no', 'unknown');

update public.products
   set allergen_flags = jsonb_set(allergen_flags, '{jordnoedder}', '"traces"'),
       updated_at = now()
 where ean = '7350104401115'
   and coalesce(allergen_flags->>'jordnoedder', 'no') in ('no', 'unknown');
