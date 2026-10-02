-- Cøliaki er nu et eget valg (id 'coeliaki'). Knyt de leksikonartikler, der handler om cøliaki, til det nye id.
update public.knowledge_base
set allergen_ids = array_append(allergen_ids, 'coeliaki'), updated_at = now()
where slug in ('faq-coeliaki', 'gluten', 'faq-hvede-vs-gluten')
  and not ('coeliaki' = any(allergen_ids));
