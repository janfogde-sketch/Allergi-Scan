-- Lukker to do d6638639 (EAN- og navnehygiejne) med statuskommentar og opretter en opfølgning. Idempotent.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'd6638639-4147-4bee-8a48-5474d2ac2857' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select 'd6638639-4147-4bee-8a48-5474d2ac2857',
       'Lukket 8. okt. 2026. Stregkoder: 94 elleve-cifrede og 73 tolv-cifrede koder (UPC) er gjort til 13 cifre, så de matcher det, telefonen scanner; opslaget prøver også de andre skrivemåder. Dublet Sriracha (87666052802) er slået sammen (Bilka-rækken med ingredienser beholdt, OFF-billedet flyttet). Navne: 40 med ekstra mellemrum og 62 med versaler er rettet (korte enkeltord som IPA røres ikke). En trigger gør det samme for nye produkter. Før-billede: products_hygiene_backup_20261008. Ikke rettet med vilje: 78 koder med forkert kontrolciffer (fejl hos Open Food Facts; vi kan ikke gætte det rigtige tal), 214 butiks-varenumre på 4 og 6 cifre (ikke stregkoder), produktet "Ukendt produkt" (EAN 5712876049612, kilde bruger; navnet kan ikke gættes). Tilbagekaldelser: alle 22 uden stregkode er arkiveret og ældre end 14 dage; #596 logger nye til to do, så der er ingen data at rette. At vise dem som tekst i appen er en ny skærm; lagt som ny to do.'
where exists (select 1 from public.admin_todos where id = 'd6638639-4147-4bee-8a48-5474d2ac2857')
  and not exists (select 1 from public.admin_todo_comments where todo_id = 'd6638639-4147-4bee-8a48-5474d2ac2857' and body like 'Lukket 8. okt. 2026.%');

insert into public.admin_todos (title, description, priority, track)
select '[Forslag] Vis tilbagekaldelser uden stregkode som tekst i appen',
       'Opfølgning på EAN- og navnehygiejne. 22 af 50 tilbagekaldelser fra Fødevarestyrelsen har ingen stregkode og kan derfor ikke matches på resultatsiden. Forslag: en enkel liste "Aktuelle tilbagekaldelser" (titel, dato, link til Fødevarestyrelsen) under Viden eller Indstillinger, kun tekst, ingen matching på navn. Kræver en beslutning om placering og design (Bjørns spor) og en kort tekst i privatlivspolitikken er ikke nødvendig (ingen personoplysninger).',
       'low', 'design'
where not exists (select 1 from public.admin_todos where title = '[Forslag] Vis tilbagekaldelser uden stregkode som tekst i appen');
