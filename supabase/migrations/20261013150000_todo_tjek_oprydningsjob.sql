-- To do til Jan (13. okt. 2026): tjek at de daglige oprydningsjob kører, og at slettefristerne passer med privatlivspolitikken.
insert into public.admin_todos (title, description, status, priority, track, assignee_id)
values (
  'Tjek de daglige oprydningsjob og slettefristerne',
  'Tjekker (kun læsning) at de planlagte oprydningsjob kører, og at fristerne i privatlivspolitikken er det, databasen gør. Resultat og evt. rettelser står i kommentarerne.',
  'doing', 'normal', 'backend',
  public._admin_id('jafo')
);
