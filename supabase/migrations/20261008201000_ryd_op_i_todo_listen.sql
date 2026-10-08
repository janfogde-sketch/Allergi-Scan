-- Oprydning i to do-listen (Bjørn, 8. okt. 2026): luk løste/forældede punkter,
-- saml dubletter og omdøb punkter, der selv er vurderet efter beta.
-- Ændrer kun admin_todos/admin_todo_comments. Idempotent.

-- 1) Luk løste og forældede punkter
with lukkes(id, body) as (values
  ('3e9a8b92-7576-452d-995c-d68ac2688891'::uuid, 'Lukket 8. okt. 2026 (oprydning): manifest og meta theme-color er begge #FFFFFF, og apple-mobile-web-app-status-bar-style er default (index.html:14). Skærmbilleder i manifestet dækkes af F6-10.'),
  ('9b129a18-b003-40f6-8746-42ccabf99bda'::uuid, 'Lukket 8. okt. 2026 (oprydning): svarene til Apples privacy label og Googles Data safety er udarbejdet i PR #607 (udfyldningsark i projektmappen eatsafe/butikserklaeringer-udfyldningsark-2026-10-08.md). Selve indtastningen sker, når butikskontiene er oprettet (to do om CVR, D-U-N-S og butikskonti).'),
  ('2529e204-6f33-45cf-a3d6-db29a1c288dd'::uuid, 'Lukket 8. okt. 2026 (oprydning): auto-import-off kører nøgleordsmotoren på ingredienslisten og lader den mest forsigtige værdi vinde (PR #544), og varer uden ingrediensliste får unknown via databasereglen fra PR #647. Verifikation på et nyimporteret produkt er ikke sket (ingen nye OFF-varer siden rettelsen); reglen dækker også den vej.'),
  ('83d7859a-d8bb-4d63-a2c8-6c984b5a4447'::uuid, 'Lukket 8. okt. 2026 (oprydning): forældet. Opskrifterne er slettet permanent og RECIPES_ENABLED=false. Kommer opskrifter tilbage, oprettes en ny to do.'),
  ('c768cc66-082f-472d-a770-f82e2e29e145'::uuid, 'Lukket 8. okt. 2026 (oprydning): betaen går via butikkerne (TWA/App Store), ikke som delt PWA, så installationshjælpen til almindelige iPhone-besøg er ikke relevant nu.')
)
, upd as (
  update public.admin_todos t set status = 'done', completed_at = coalesce(t.completed_at, now()), updated_at = now()
    from lukkes l where t.id = l.id and t.status <> 'done' returning t.id
)
insert into public.admin_todo_comments (todo_id, body)
select l.id, l.body from lukkes l
 where exists (select 1 from public.admin_todos where id = l.id)
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = l.id and c.body like 'Lukket 8. okt. 2026 (oprydning)%');

-- 2) Saml dubletter: dubletten lukkes med henvisning, den beholdte får en note
with dubletter(id, keep_id, body, keep_body) as (values
  ('6899cf26-54eb-410e-9f5e-c618ee27d609'::uuid, 'a2c0a533-dc31-486b-b32f-5cd42ca623f4'::uuid,
   'Lukket 8. okt. 2026 (oprydning): dublet, samlet i to do "Butikker: CVR, D-U-N-S og butikskonti (Google Play og Apple)".',
   'Samlet 8. okt. 2026 (oprydning): denne to do dækker nu hele vejen CVR -> D-U-N-S -> Google Play- og Apple Developer-konto som organisation. Fra de lukkede dubletter: D-U-N-S er gratis hos Dun & Bradstreet (op til ca. 7 hverdage) og kræver juridisk navn, CVR og adresse; Google kræver organisationskonto for sundhedsapps, Apple kræver juridisk enhed (ApS er gyldig); gebyrer er ikke verificeret (formentlig 25 USD engang hos Google, 99 USD/år hos Apple); tjek i Play Console, om organisationskonti slipper for 12 testere i 14 dage. Plan: eatsafe/butiksvej-google-play-app-store-2026-10-05.md.'),
  ('5c8387d7-3229-492e-a458-feddde2ebb24'::uuid, 'a2c0a533-dc31-486b-b32f-5cd42ca623f4'::uuid,
   'Lukket 8. okt. 2026 (oprydning): dublet, samlet i to do "Butikker: CVR, D-U-N-S og butikskonti (Google Play og Apple)".', null),
  ('1560d31c-9c5d-44c1-bee3-52a95693a891'::uuid, '7b45d2cd-c9f6-4036-a8ca-3af277d15715'::uuid,
   'Lukket 8. okt. 2026 (oprydning): samme opgradering, samlet i to do "Supabase Pro: backups, testmiljø og Leaked Password Protection".',
   'Samlet 8. okt. 2026 (oprydning): dækker nu også Leaked Password Protection, som kræver samme Pro-plan (ca. 25 USD/md). Jan: vent.'),
  ('742cfc76-49e4-486f-8290-6a360ba30f9e'::uuid, '5344d467-8c15-4689-b642-7b6a5ce3750d'::uuid,
   'Lukket 8. okt. 2026 (oprydning): dublet af punkt 1 i ticketten "[Privatlivspolitik · IKKE FÆRDIG]" (dataansvarligs identitet og kontaktoplysninger).',
   'Note 8. okt. 2026 (oprydning): to do "Angiv dataansvarlig" er lukket som dublet af punkt 1 her. GDPR art. 13(1)(a) kræver identitet og kontaktoplysninger, og butikkerne kræver en gyldig politik-URL; afhænger af virksomhedsoplysningerne for ApS''et. Teksten rettes i src/legalText/privacy.js.'),
  ('c331d83d-4ec9-420d-a22e-a834bbe0e979'::uuid, 'c188223c-7df2-49a8-b913-39a17ef3e909'::uuid,
   'Lukket 8. okt. 2026 (oprydning): samme oprydning 1. nov., samlet i to do "Opryd backup-tabeller fra datarettelser".',
   'Samlet 8. okt. 2026 (oprydning): dækker nu også allergen_flags_fix_20261002 (backup fra den stille genberegning 2. okt., 715 produkter). Rollback før sletning: update products p set allergen_flags = f.old_flags from allergen_flags_fix_20261002 f where f.id = p.id (slå triggeren on_products_allergen_change fra under rollback).'),
  ('259bb835-bfd4-4f40-99e9-4f1707fc261c'::uuid, 'c9e99f2d-d86a-4c37-a612-6c33b7148e86'::uuid,
   'Lukket 8. okt. 2026 (oprydning): samme beslutning, samlet i to do "Butikker: iOS via Capacitor".',
   'Samlet 8. okt. 2026 (oprydning): dækker nu også Fortsæt med Apple-login (kræver Apple Developer-konto; Apple 4.8, hvis iOS-appen har Google/Facebook-login). Afventer Jans afklaring.')
)
, luk as (
  update public.admin_todos t set status = 'done', completed_at = coalesce(t.completed_at, now()), updated_at = now()
    from dubletter d where t.id = d.id and t.status <> 'done' returning t.id
)
insert into public.admin_todo_comments (todo_id, body)
select d.id, d.body from dubletter d
 where exists (select 1 from public.admin_todos where id = d.id)
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = d.id and c.body like 'Lukket 8. okt. 2026 (oprydning)%')
union all
select d.keep_id, d.keep_body from dubletter d
 where d.keep_body is not null
   and exists (select 1 from public.admin_todos where id = d.keep_id)
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = d.keep_id and c.body = d.keep_body);

update public.admin_todos set title = '[Før beta] Butikker: CVR, D-U-N-S og butikskonti (Google Play og Apple)', updated_at = now()
 where id = 'a2c0a533-dc31-486b-b32f-5cd42ca623f4' and status <> 'done';
update public.admin_todos set title = '[Før beta] Supabase Pro: backups, testmiljø og Leaked Password Protection', updated_at = now()
 where id = '7b45d2cd-c9f6-4036-a8ca-3af277d15715' and status <> 'done';
update public.admin_todos set title = '[Før beta] Butikker: iOS via Capacitor (native push, systembrowser-login, evt. Fortsæt med Apple)', updated_at = now()
 where id = 'c9e99f2d-d86a-4c37-a612-6c33b7148e86' and status <> 'done';

-- 3) Punkter, der selv er vurderet efter beta, får [Efter beta] i titlen
update public.admin_todos
   set title = '[Efter beta]' || substr(title, length('[Før beta]') + 1), updated_at = now()
 where status <> 'done' and title like '[Før beta]%'
   and id in (
     'c29fba5f-e2d4-4f8c-b294-bc14bab870b3','28372f58-08f6-4c3c-8033-07ef0b0c0cb5','0f361b1a-7ab9-4083-9708-1919bbd65d56',
     '84193115-9665-47c7-95e4-c66314c00cfd','f3f25802-3dca-4025-8629-e3b93ced494d','2d6cafcf-bc2d-4f12-a087-a0dc82cc3f1f',
     'b6b4e164-3b3b-437b-aee3-f624ab9fe0cc','df9b9c27-0f66-4330-8d27-9ed09d26764f','e1c13473-1c65-4355-a93a-a4b7257c2356',
     'b644b717-d3b0-4ef2-9046-a6a1fa3c2d09','af8d2aa1-f38f-4cd4-8db3-f15f8923e913','5e30176f-a1ed-4bbd-871a-72a1e07c8066',
     'a0c687f9-795a-45d7-8dc7-325819d62e34','e8db8683-aebb-48bd-9640-ec1b4bc42e46','e2279ca5-4c02-44c1-9fe0-84dbceaf5399',
     '9cb17ac5-02a4-451c-a72f-f4cc2f62d729','839ddcac-884a-4e6e-97b5-673ac57f7e33','5d559add-3736-494b-8b29-e1b1e6175f1c',
     '9c0a46eb-3aff-4f11-9d93-29487029c901','7774b9e8-c14e-4b77-96cb-ba0d97b5db63','1f0d1358-c077-48e4-bde1-0d96ac503f96'
   );
