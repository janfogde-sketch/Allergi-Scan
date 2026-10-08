-- Lukker to do a6200e7d (butikstekster og erklæringer) og opretter en to do til Bjørn (skærmbilleder). Idempotent. Sletter intet.
insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Design: butikkernes skærmbilleder og grafik klar til indsendelse',
       'Bjørns spor. De seks skærmbilleder (App Store 6,9" og 6,5", Google Play) og bannergrafikken 1024x500 er godkendt og ligger i projektmappen eatsafe/butiksbilleder-v3-2026-10-07. Tilbage: (1) tjek før indsendelsen, at billederne stadig matcher appen, tallene (over 20.000 varer, 700+ opslag, 17 sprog) og logoet; lav dem igen ved ændringer. (2) Beslut, om en iPad-version udgives (så kræves iPad-billeder). (3) Evt. app-ikon 1024x1024 til App Store og 512x512 til Google Play, hvis de ikke er lavet. Selve indsendelsen venter på Google Play- og Apple-kontiene. Liste: APP_STORE_METADATA.md, afsnittet Skærmbilleder.',
       'todo', 'normal', 'design', public._admin_id('bho')
where not exists (select 1 from public.admin_todos where title like '[Før beta] Design: butikkernes skærmbilleder%');

update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = 'a6200e7d-0296-4fb8-97da-302a60cd7eb1' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select id, 'Lukket 8. okt. 2026. Færdigt i filerne APP_STORE_METADATA.md og BUTIKSDEKLARATIONER.md: titel (kun "EatSafe", ikke "Spis trygt", for ikke at ligne en sikkerhedsgaranti), kort og lang beskrivelse, søgeord, kategori, "Nyt i denne version", målgruppe (18+, ikke Families/Kids), svar til aldersrating (Apple 4+, Google Play Alle/PEGI 3), erklæring om helbredsapp (informationsværktøj, ingen diagnose), reklame-ID og en tjekliste til indsendelsen. Skærmbilleder og banner var allerede lavet og godkendt; kontrol og evt. iPad/app-ikon ligger som ny to do til Bjørn. Mangler: selve udfyldningen i Play Console og App Store Connect, som venter på kontiene (CVR/D-U-N-S). Manifestets screenshots/display_override er bevidst ikke tilføjet (gavner ikke butikkerne). Intet er sendt til butikkerne.'
  from public.admin_todos where id = 'a6200e7d-0296-4fb8-97da-302a60cd7eb1'
   and not exists (select 1 from public.admin_todo_comments where todo_id = 'a6200e7d-0296-4fb8-97da-302a60cd7eb1' and body like 'Lukket 8. okt. 2026.%');
