-- Lukker to do 15e767d5 (fjern døde konstanter og eksporter) med statuskommentar. Idempotent.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '15e767d5-20c5-4d09-bf36-e8fce1f0b6bf' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select '15e767d5-20c5-4d09-bf36-e8fce1f0b6bf',
       'Lukket 8. okt. 2026. Fjernet helt: HOME_TIPS, MADPAS_ALLERGY_HEADLINE_T, MADPAS_SPEAK_LABEL_T, MADPAS_STOP_LABEL_T, MADPAS_INTRO (og dens ubrugte import i App.jsx), PageID, getAllCachedProducts. 22 eksporter, der kun bruges i egen fil, er gjort interne (ingen adfærdsændring). legalBodyHtml beholdes eksporteret, fordi scripts/build-legal-pages.mjs bruger den. src/CONTEXT.md rettet (Madpas-konstanter; den løste tysk-fejl fjernet). Lint 0 fejl, 1293 tests og build grønne. Ikke rørt: ubrugt PAGE_IDS-import i utils.jsx (hører til "Slåede-fra advarsler").'
where exists (select 1 from public.admin_todos where id = '15e767d5-20c5-4d09-bf36-e8fce1f0b6bf')
  and not exists (select 1 from public.admin_todo_comments where todo_id = '15e767d5-20c5-4d09-bf36-e8fce1f0b6bf' and body like 'Lukket 8. okt. 2026.%');
