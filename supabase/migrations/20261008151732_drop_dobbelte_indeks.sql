-- Fjerner tre dobbelte indekser (to do 7082a26b). Ingen data ændres; opslag og unikhed er uændrede.
--   products_ean_idx    : almindeligt indeks på ean, dækket af products_ean_key (unik)
--   products_ean_unique : delvist unikt indeks (ean is not null); ean er NOT NULL, så products_ean_key dækker det samme
--   idx_kb_slug         : almindeligt indeks på slug, dækket af knowledge_base_slug_key (unik)
-- products_ean_key beholdes: fremmednøglen products_canonical_ean_fkey hænger på det. Ingen ON CONFLICT (ean ...) mod products i kode eller funktioner.
drop index if exists public.products_ean_idx;
drop index if exists public.products_ean_unique;
drop index if exists public.idx_kb_slug;

update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where id = '7082a26b-a588-4379-9202-10750f3ab674' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select '7082a26b-a588-4379-9202-10750f3ab674',
       'Lukket 8. okt. 2026. Fjernet de tre dobbelte indekser: products_ean_idx, products_ean_unique og idx_kb_slug (ca. 3,1 MB, og hver skrivning rører dem ikke mere). Tjekket først: ean er aldrig tom, så den delvise unikhed var identisk med products_ean_key; ingen kode eller funktion bruger ON CONFLICT mod products.ean; products_ean_key beholdes, fordi fremmednøglen på canonical_ean bruger det. Unikhed og opslag er uændrede. De 20 ubrugte indekser fra rådgiveren er ikke rørt.'
where exists (select 1 from public.admin_todos where id = '7082a26b-a588-4379-9202-10750f3ab674')
  and not exists (select 1 from public.admin_todo_comments where todo_id = '7082a26b-a588-4379-9202-10750f3ab674' and body like 'Lukket 8. okt. 2026.%');
