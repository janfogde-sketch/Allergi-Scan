-- Statuskommentar på to do 9b129a18 (butikkernes privacy label og Data safety).
insert into public.admin_todo_comments (todo_id, body)
select id,
       'Status 8. okt. 2026: udfyldningsarket er klar i projektmappen (eatsafe/butikserklaeringer-udfyldningsark-2026-10-08.md) med Apple-alder, App Privacy, IARC, Data safety og øvrige erklæringer. Aldersratingen i App Store bliver 13+ (nødråd i leksikonet og alkoholvarer), ikke 4+; BUTIKSDEKLARATIONER.md er rettet. Afventer stadig konti, dataansvarlig (CVR) i politikken, testkonto til anmelderne og beslutning om Sign in with Apple på iOS.'
 from public.admin_todos where id = '9b129a18-b003-40f6-8746-42ccabf99bda'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = admin_todos.id and body like 'Status 8. okt. 2026: udfyldningsarket%');
