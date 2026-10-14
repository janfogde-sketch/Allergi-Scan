-- To do "Verificér første rigtige tilbagekaldelse gennem recalls-sync": lukket efter test på Jans egen konto (14. okt. 2026). Kun skrivning til to do-listen.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where title = '[Før beta] Verificér første rigtige tilbagekaldelse gennem recalls-sync' and status <> 'done';
insert into public.admin_todo_comments (todo_id, body)
select id,
 'Lukket 14. okt. 2026 (Claude, Jan har overtaget og testet). Fødevarestyrelsens tilbagekaldelse af Amanda Makrelkræs (12. okt.) kom igennem hele kæden: gemt som klar med to gyldige stregkoder, matchet til produktet, hændelsen behandlet uden fejl. Ingen brugere havde produktet, så Jan lagde det som favorit, og hændelsen blev sat i kø igen (engangsmigration). Resultat i databasen: 1 besked til 1 bruger (kun Jan), 2 push og 1 mail sendt uden fejl, og Jan bekræftede, at pushbeskeden kom frem på telefonen. Ingen dobbeltafsendelse. Samtidig rettet: favorit-hjertet fyldes nu rødt og viser en kort besked (tydeligere på den røde tilbagekaldt-bjælke), og et migrationsnummer, der kolliderede. Ikke afprøvet: beskeder til brugere via scanning i de sidste 90 dage og via indkøbsliste (koden findes og er testet i CI, men ingen rigtige data).'
from public.admin_todos where title = '[Før beta] Verificér første rigtige tilbagekaldelse gennem recalls-sync';
