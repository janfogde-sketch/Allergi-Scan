-- To do + kategorisering af de 128 produkter, som kategorihuller-jobbet ikke kunne placere sikkert (13. okt. 2026).
-- Kun produkter, hvor navnet gør placeringen utvetydig, rettes (101 stk.). Resten står uændret.
create table if not exists public.products_category_backup_20261013 as
select id, category, subcategory, subcategory_classified_at, now() as backed_up_at
from public.products
where subcategory is null and subcategory_classified_at is not null;
alter table public.products_category_backup_20261013 enable row level security;

update public.products p
   set category = v.cat, subcategory = v.sub
  from (values
    ('99574522','Brød & bagværk','Kager & wienerbrød'),
    ('782878b6','Brød & bagværk','Kager & wienerbrød'),
    ('a26e6a9c','Brød & bagværk','Knækbrød & kiks'),
    ('79898141','Kolonial','Bagetilbehør'),
    ('9cf01017','Drikkevarer','Vin'),
    ('03986626','Drikkevarer','Vin'),
    ('b9bd4e7d','Drikkevarer','Vin'),
    ('03d0cb17','Drikkevarer','Vin'),
    ('67af5653','Drikkevarer','Vin'),
    ('680b3c3b','Drikkevarer','Vin'),
    ('0b120017','Drikkevarer','Vin'),
    ('b9fb9a7d','Drikkevarer','Vin'),
    ('9c9d31e1','Drikkevarer','Vin'),
    ('982a5658','Drikkevarer','Vin'),
    ('0b1b3e4e','Drikkevarer','Vin'),
    ('59b296dd','Drikkevarer','Vin'),
    ('0af7ad3a','Drikkevarer','Vin'),
    ('683ce11b','Drikkevarer','Vin'),
    ('6832ab50','Drikkevarer','Vin'),
    ('ead70b3a','Drikkevarer','Kaffe'),
    ('67ac7550','Drikkevarer','Kaffe'),
    ('8c03a9be','Drikkevarer','Kaffe'),
    ('36a0fe5a','Drikkevarer','Kaffe'),
    ('8c2a5493','Drikkevarer','Kaffe'),
    ('ea4d3a28','Drikkevarer','Kaffe'),
    ('affd5108','Drikkevarer','Kaffe'),
    ('7275ff4b','Drikkevarer','Kaffe'),
    ('97faead4','Drikkevarer','Øl'),
    ('79e64e65','Drikkevarer','Juice & saft'),
    ('76774249','Drikkevarer','Andre drikkevarer'),
    ('db540d46','Kolonial','Nødder & tørret frugt'),
    ('b09afeb1','Kolonial','Nødder & tørret frugt'),
    ('46a6bcc8','Kolonial','Nødder & tørret frugt'),
    ('e4742ec3','Kolonial','Nødder & tørret frugt'),
    ('e7b36f65','Kolonial','Nødder & tørret frugt'),
    ('89ff579f','Kolonial','Nødder & tørret frugt'),
    ('a0865c77','Kolonial','Nødder & tørret frugt'),
    ('f38ed550','Kolonial','Nødder & tørret frugt'),
    ('2509c90d','Kolonial','Nødder & tørret frugt'),
    ('3e801bae','Kolonial','Nødder & tørret frugt'),
    ('e818d133','Kolonial','Nødder & tørret frugt'),
    ('bca32edd','Kolonial','Nødder & tørret frugt'),
    ('77d04e55','Kolonial','Nødder & tørret frugt'),
    ('ce1374c1','Kolonial','Sovs & dressing'),
    ('41fe0040','Kolonial','Sovs & dressing'),
    ('d44320e8','Kolonial','Sovs & dressing'),
    ('9945ca0c','Kolonial','Sovs & dressing'),
    ('c620972a','Kolonial','Konserves'),
    ('fcbdc7fd','Kolonial','Konserves'),
    ('42057422','Kolonial','Konserves'),
    ('586bc4cc','Kolonial','Konserves'),
    ('42120354','Kolonial','Konserves'),
    ('e184dd20','Kolonial','Konserves'),
    ('7a80833e','Frost','Frostfrugt'),
    ('01a59c97','Frost','Frostfrugt'),
    ('98446538','Frost','Frostfrugt'),
    ('b8d12d1c','Frost','Frostfrugt'),
    ('b8f3384d','Frost','Frosne færdigretter'),
    ('4874eb94','Frost','Frosne færdigretter'),
    ('3fef5fe0','Frost','Frosne færdigretter'),
    ('52abfa29','Frost','Frosne færdigretter'),
    ('3d4f98ad','Frost','Frosne færdigretter'),
    ('f28823b2','Frost','Frosne færdigretter'),
    ('c4e533c3','Frost','Frosne færdigretter'),
    ('c2c5e12a','Frost','Frosne færdigretter'),
    ('f069fd03','Frost','Frosne færdigretter'),
    ('44aef74a','Frost','Frosne færdigretter'),
    ('485547c8','Frost','Frosne færdigretter'),
    ('7c4e354a','Frost','Frosne færdigretter'),
    ('3485568c','Frost','Frosne færdigretter'),
    ('ae66e1bb','Frost','Frosne færdigretter'),
    ('84bba66a','Frost','Andet frost'),
    ('7b93e411','Frost','Andet frost'),
    ('223456c6','Frost','Andet frost'),
    ('f340c012','Frost','Is'),
    ('39660871','Frost','Is'),
    ('f03c05b0','Frugt & grønt','Frisk frugt'),
    ('eca6fc9f','Frugt & grønt','Frisk frugt'),
    ('f1a1478f','Frugt & grønt','Frisk frugt'),
    ('dfcb0fdf','Frugt & grønt','Frisk frugt'),
    ('bb6b8873','Frugt & grønt','Frisk frugt'),
    ('2062da8a','Frugt & grønt','Frisk frugt'),
    ('5ab3051e','Frugt & grønt','Frisk frugt'),
    ('6341813c','Frugt & grønt','Frisk frugt'),
    ('c5ecd7ac','Frugt & grønt','Frisk frugt'),
    ('2365a555','Frugt & grønt','Frisk frugt'),
    ('7af069ea','Frugt & grønt','Frisk frugt'),
    ('e13be946','Frugt & grønt','Frisk frugt'),
    ('bbab3b07','Frugt & grønt','Frisk frugt'),
    ('2005b9d5','Frugt & grønt','Frisk frugt'),
    ('4e5e0b25','Frugt & grønt','Frisk frugt'),
    ('9a5493ca','Frugt & grønt','Frisk frugt'),
    ('9a39ea84','Frugt & grønt','Frisk frugt'),
    ('72744574','Frugt & grønt','Frisk frugt'),
    ('93deef30','Frugt & grønt','Frisk frugt'),
    ('98ff781b','Frugt & grønt','Frisk frugt'),
    ('010b6f03','Frugt & grønt','Frisk frugt'),
    ('6581a69c','Frugt & grønt','Frisk frugt'),
    ('3ba94604','Frugt & grønt','Frisk frugt'),
    ('f60b2428','Frugt & grønt','Frisk grønt'),
    ('416f8549','Kød & fisk','Fjerkræ')
  ) as v(prefix, cat, sub)
 where p.id::text like v.prefix || '%'
   and p.subcategory is null and p.subcategory_classified_at is not null;

insert into public.admin_todos (title, description, status, priority, track, assignee_id, completed_at)
select 'Data: gennemgå de 128 ukategoriserede produkter',
       'Jobbet "Kategorihuller" kunne ikke placere 128 produkter sikkert. Gennemgået 13. okt. 2026: 101 fik en rigtig kategori ud fra navnet, resten er uændret.',
       'done', 'normal', 'backend', public._admin_id('jafo'), now()
where not exists (select 1 from public.admin_todos where title = 'Data: gennemgå de 128 ukategoriserede produkter');

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Lukket 13. okt. 2026. De 128 var produkter, hvor kategorien var forkert (fx vin og tomatpesto under Drikkevarer, frosne varer under Frugt & grønt) eller dobbelttydig. 101 er rettet med både kategori og underkategori ud fra navnet (vin, kaffe, frisk frugt, tørret frugt, frostfisk m.fl.). Resten (27) er bevidst ikke gættet: pizzaer (frosne eller kølede?), bjælker og frugtsnacks, spreads og enkelte uklare navne som "Lu''Li". De står uændret og kan placeres, når produktet er set eller har en ingrediensliste. Backup af de oprindelige værdier: products_category_backup_20261013.'
from public.admin_todos t
where t.title = 'Data: gennemgå de 128 ukategoriserede produkter'
  and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Lukket 13. okt. 2026.%');
