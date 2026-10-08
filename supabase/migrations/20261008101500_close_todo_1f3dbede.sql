-- Lukker to do 1f3dbede (fjern reserve til gamle allergen-tabeller, PR #612) med en statuskommentar.
-- Ændrer kun status og tilføjer én kommentar; sletter intet.
update admin_todos set status = 'done'
 where id = '1f3dbede-54fa-482c-bb33-62c575b80a53';

insert into admin_todo_comments (todo_id, body)
select id, 'Færdig i PR #612 (8. okt. 2026): produkt-funktionen bruger ikke længere de gamle tabeller allergen_flags og ingredients som reserve. Tabellerne er IKKE slettet; drop afventer Jans ja sammen med backup-oprydningen. 6 varer havde kun rodet OCR-tekst i den gamle ingredients-tabel og viser nu "ingrediensliste mangler".'
  from admin_todos where id = '1f3dbede-54fa-482c-bb33-62c575b80a53';
