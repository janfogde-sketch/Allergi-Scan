-- Opfølgning på knowledge_base_quality_review (30. sept. 2026): to
-- ingredienstekster, der var for bastante.
update public.knowledge_base set summary = $q$Klaret smør fra Sydasien. Indeholder meget lidt laktose og mælkeprotein, men ikke nul.$q$, updated_at = now() where slug = 'ing-ghee';
update public.knowledge_base set summary = $q$Syrnet mælk med lavere laktoseindhold end frisk mælk. Indeholder mælkeprotein.$q$, updated_at = now() where slug = 'ing-yoghurt';
