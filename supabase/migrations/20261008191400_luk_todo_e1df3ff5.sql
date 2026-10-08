-- Lukker to do e1df3ff5 (databaseplads).
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'e1df3ff5-7e68-4743-a8f3-1c7adabffeb9' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select 'e1df3ff5-7e68-4743-a8f3-1c7adabffeb9',
       'Lukket 8. okt. 2026. Databasen var 220 MB. Migrationen 20261008191347_databaseplads_oprydning.sql (1) dropper de to gamle, ubrugte tabeller allergen_flags og ingredients (intet i appen, funktioner eller visninger brugte dem; produkternes data ligger i products), (2) tømmer forskelstabellen fra den store genanalyse (20 MB; tabellen beholdes tom, fordi allergen-reanalyze skriver til den), og (3) skriver products, submissions og feedback_tickets om uden døde rester (submissions fyldte 42 MB til 4 rækker, feedback_tickets 8 MB til 47). Forventet: ca. 100 MB frigjort. Ingen backup-tabeller på Jans beholdes-liste er rørt; heller ikke products_backup, knowledge_base_backup_20260930, products_kj_backup_20260930, allergen_flags_fix_20261002 og image_removed_ids_20261005 (hører til 1. nov.-opgaverne). Målt størrelse efter merge skrives som ny kommentar.'
where exists (select 1 from public.admin_todos where id = 'e1df3ff5-7e68-4743-a8f3-1c7adabffeb9')
  and not exists (select 1 from public.admin_todo_comments where todo_id = 'e1df3ff5-7e68-4743-a8f3-1c7adabffeb9' and body like 'Lukket 8. okt. 2026.%');
