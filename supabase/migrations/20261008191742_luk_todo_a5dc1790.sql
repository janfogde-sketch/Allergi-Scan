-- Lukker to do a5dc1790 (hurtigere opstart).
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'a5dc1790-79b7-4e2e-b746-163580ac7880' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select 'a5dc1790-79b7-4e2e-b746-163580ac7880',
       'Lukket 8. okt. 2026. Målt på simuleret langsom mobil (4x langsommere processor, ca. 1,6 Mbit/s): det telefonen skal hente for at starte appen er faldet fra 726 kB til 638 kB kode (220 kB til 189 kB over nettet, ca. 14 % mindre), og appen er klar efter 1,32 s mod 1,45 s før (ca. 9 % hurtigere). (1) De store Madpas-oversættelser (17 sprog, ca. 89 kB) hentes først, når man åbner Madpas eller trykker Læs højt. (2) React og den fælles kode har fået faste navne (react, shared), så telefonen kan genbruge React fra sidste besøg, selv om appen er opdateret; før hed den fælles pakke tilfældigt useAdmin. (3) Allergen-ikonerne er skiftet fra PNG til WebP uden tab af kvalitet (pixel for pixel ens; 482 kB til 354 kB, hentes først når de vises). Ingen synlig designændring; indholdsspærren og offline-siden er urørt. Ikke gjort: E-nummer-listen (18 kB) ligger stadig i startpakken, og baggrundsbilledet på scan-siden (114 kB) er allerede WebP. Mere gevinst kræver at App.jsx deles op (se opgaven Del store filer op).'
where exists (select 1 from public.admin_todos where id = 'a5dc1790-79b7-4e2e-b746-163580ac7880')
  and not exists (select 1 from public.admin_todo_comments where todo_id = 'a5dc1790-79b7-4e2e-b746-163580ac7880' and body like 'Lukket 8. okt. 2026.%');
