-- De sidste 11 produkter uden underkategori (13. okt. 2026): Jan sagde ja til forslagene.
-- Deres tidligere tilstand (tom underkategori) ligger allerede i products_category_backup_20261014 (låst).
update public.products p
   set category = v.cat, subcategory = v.sub
  from (values
    ('21f5678c-1c7e-4494-9126-442092816326'::uuid,'Kød & fisk','Andet kød & fisk'),
    ('3d93c261-2b24-4018-a8d6-26cbab98ce43'::uuid,'Snacks & slik','Slik & bolsjer'),
    ('0b6cf1c0-4e98-45a4-bc92-25e3496dd702'::uuid,'Snacks & slik','Slik & bolsjer'),
    ('3d931326-1f70-4459-a410-30a5735132a4'::uuid,'Snacks & slik','Kiks & kager'),
    ('bd645ab2-fb4b-4e0c-b7eb-ecf9ebc4d0f7'::uuid,'Kolonial','Pasta & ris'),
    ('0ad05b7b-2482-4cc7-a465-256e56b4e0e7'::uuid,'Drikkevarer','Andre drikkevarer'),
    ('f08f5035-dc9b-4afa-8e88-89d673ec424d'::uuid,'Brød & bagværk','Brød'),
    ('3f82a78c-386d-4f80-aa27-0f1dbe5718a0'::uuid,'Frost','Frosne færdigretter'),
    ('91113000-741b-491c-bd05-2efb424b596f'::uuid,'Frost','Frosne færdigretter'),
    ('033abba9-7fd0-45b7-918f-8516bd3604c7'::uuid,'Kolonial','Andet kolonial'),
    ('51eab172-f0bf-43f6-b491-191ca03f6418'::uuid,'Kolonial','Konserves')
  ) as v(id, cat, sub)
 where p.id = v.id and p.subcategory is null;

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Status 13. okt. 2026: Jan sagde ja. De 11 sidste produkter er sat efter forslagene (de 16 andre blev rettet i #707). Sikkerhedskopi: products_category_backup_20261014 (låst). Alle 27 har nu en underkategori; gæt på frost/kølet (Gestus, Andoni) og frugtsnacks kan rettes enkeltvis.'
  from public.admin_todos t
 where t.title = 'Vælg kategori til de sidste 11 produkter'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Status 13. okt. 2026: Jan sagde ja%');

update public.admin_todos set status = 'done'
 where title = 'Vælg kategori til de sidste 11 produkter' and status <> 'done';
