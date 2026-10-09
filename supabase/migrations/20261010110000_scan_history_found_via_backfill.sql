-- Historik: ret ældre rækker, der blev åbnet via søgning, men er gemt som 'scan' (før found_via fandtes, 10. okt. 2026).
-- Kun sikre match: brugeren valgte samme produkt i søgningen (search_selections) højst 15 sekunder før/efter rækken.
-- Øvrige gamle rækker lader vi stå som 'scan', fordi der ikke findes data om, hvordan de blev fundet.
update public.scan_history h
   set found_via = 'search'
 where h.found_via = 'scan'
   and exists (
     select 1 from public.search_selections s
      where s.user_id = h.user_id and s.ean = h.ean_scanned
        and s.created_at between h.scanned_at - interval '15 seconds' and h.scanned_at + interval '15 seconds'
   );
