-- To do til Jan (13. okt. 2026): tjek af de daglige oprydningsjob og slettefristerne. Oprettet og lukket i samme omgang.
with t as (
  insert into public.admin_todos (title, description, status, priority, track, assignee_id)
  values (
    'Tjek de daglige oprydningsjob og slettefristerne',
    'Tjek (kun læsning) at de planlagte oprydningsjob kører, og at fristerne i privatlivspolitikken er det, databasen gør.',
    'done', 'normal', 'backend', public._admin_id('jafo')
  ) returning id
)
insert into public.admin_todo_comments (todo_id, body)
select id, 'Tjekket 13. okt. 2026. Alle 14 planlagte job er aktive, og oprydningsjobbene kørte uden fejl i nat (notify-cleanup, family-invite-email-cleanup, inactive-accounts-cleanup, orphan-images-cleanup, cron-history-cleanup). Fristerne i cleanup_notifications() passer med privatlivspolitikken: scanninger 24 mdr., beskeder 12 mdr., hændelser og fejllogs 90 dage, søgehistorik 12 mdr., sikkerhedsindberetninger 12 mdr., forbrugstællere 30 dage, anonym feedback 12 mdr. Inaktive konti (36 mdr. + 30 dages varsel) kørte kl. 04:10 UTC: 0 varslet, 0 slettet, 0 fejl. Appen er kun ca. 13 dage gammel, så ingen rækker er endnu gamle nok til at blive slettet; reglerne er læst i funktionerne, ikke set i brug. Anmærkning: notify-dispatch og nutrition-backfill fejlede 3 gange i dag med "job startup timeout" (flere job på samme minut); harmløst, næste minut tog over.'
from t;
