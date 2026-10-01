-- Allergileksikon: fagligt præciseret tekst på diæt-opslaget "Glutenfri"
-- (intro, "Kort fortalt" og sundhedsnote). Kørt live 30. sept. 2026.
update knowledge_base set
  summary = $t$Undgå gluten fra hvede, rug, byg og beslægtede kornsorter. Vælg kun havre, der er mærket glutenfri.$t$,
  description = $t$Ved cøliaki er en konsekvent glutenfri kost nødvendig. Gluten findes især i hvede, rug og byg samt produkter fremstillet heraf. Havre er naturligt glutenfri, men almindelig havre kan være forurenet med gluten under dyrkning og produktion. Vælg derfor havre mærket glutenfri.$t$,
  health_notes = $t$En glutenfri kost kan indeholde mindre fiber, jern og visse B-vitaminer, hvis kosten bliver ensidig. Vælg gerne fiberrige glutenfri fødevarer som brune ris, quinoa, boghvede og glutenfri havre. I EU må et produkt mærkes ‘glutenfri’, når det indeholder højst 20 mg gluten pr. kg (20 ppm).$t$
where slug = 'diaet-glutenfri' and category = 'diet';
