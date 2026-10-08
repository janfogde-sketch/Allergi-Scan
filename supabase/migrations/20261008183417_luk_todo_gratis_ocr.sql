-- Lukker to do 65881f7d (gratis OCR på telefonen). Idempotent. Sletter intet.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '65881f7d-5619-4248-9192-3be84ef60999' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select id, 'Lukket 8. okt. 2026 UDEN kodeændring: gratis læsning på telefonen er ikke sikker nok. Målt med Tesseract (dansk sprogdata) på 35 rigtige ingredienslister fra Open Food Facts (billeder skaleret som i appen, 1600 px) mod den indtastede tekst, kørt gennem vores allergenmotor: 6 af 49 allergener (12 %) blev overset, bl.a. mælk, æg og hvede, og kun ca. 67 % af ordene blev læst rigtigt; 22 allergener blev desuden opfundet af læsefejl. Kun 8 af 35 billeder (23 %) havde høj sikkerhed (over 88), og ét af dem overså stadig hvede. Selv med en sikkerhedsgrænse sparer vi altså under en fjerdedel af ca. 3 øre pr. læsning, og læsningen bruges kun, når en bruger fotograferer en mangelfuld etiket (loft 60 pr. døgn), så besparelsen er få kroner om måneden. Prisen ville være ca. 10 MB sprogdata og læseprogram i appen, en svækket indholdsspærre og en risiko for overset allergen. Claude (Haiku) forbliver derfor eneste læser. Ingen ændring i politikker (ingen nye data eller leverandører). Kan genåbnes, hvis en markant bedre gratis læser dukker op.'
  from public.admin_todos where id = '65881f7d-5619-4248-9192-3be84ef60999'
   and not exists (select 1 from public.admin_todo_comments where todo_id = '65881f7d-5619-4248-9192-3be84ef60999' and body like 'Lukket 8. okt. 2026 UDEN%');
