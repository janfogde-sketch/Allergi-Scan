-- 30. sept. 2026: fire produkter med mælk (smørfedt / hytteost) stod som
-- maelkeallergi "no"/"traces", fordi "smør"/"ost" kun matchede som hele ord.
-- Ordlisten er udvidet samtidig (supabase/functions/_shared/allergenKeywords.js).
update public.products
set allergen_flags = allergen_flags || '{"maelkeallergi":"yes"}'::jsonb
where ean in ('5707735939166','4000417028006','5701043001782')
  and coalesce(allergen_flags->>'maelkeallergi','') <> 'yes';

-- Hytteost (friskost) indeholder både mælkeprotein og laktose.
update public.products
set allergen_flags = allergen_flags || '{"maelkeallergi":"yes","laktose":"yes"}'::jsonb
where ean = '5700426260907';
