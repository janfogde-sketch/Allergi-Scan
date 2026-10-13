-- De sidste 27 produkter uden underkategori (13. okt. 2026, opfølgning på #692).
-- 16 rettes (sikker kilde eller klart forbillede i databasen), 11 står uændret og ligger som forslag i en to do til Jan.

-- Sikkerhedskopi FØR ændring, låst i samme migration (rækkesikkerhed + ingen adgang for anon/authenticated).
create table if not exists public.products_category_backup_20261014 as
select id, category, subcategory, subcategory_classified_at, now() as backed_up_at
from public.products
where subcategory is null and subcategory_classified_at is not null;
alter table public.products_category_backup_20261014 enable row level security;
revoke all on public.products_category_backup_20261014 from public, anon, authenticated;

update public.products p
   set category = v.cat, subcategory = v.sub
  from (values
    -- Frosne pizzaer (Open Food Facts: frossen pizza / "frossen" i navnet)
    ('2b62e3ee-39fa-4312-8ac3-bb5801f7899f'::uuid,'Frost','Frosne færdigretter'),
    ('5e7ba153-9da4-47ad-a971-8131594cd542'::uuid,'Frost','Frosne færdigretter'),
    ('3c0616e9-6bdd-4a6d-b8c9-011e2f6b00c0'::uuid,'Frost','Frosne færdigretter'),
    -- Pizzaost (Open Food Facts: ost)
    ('5e8036ec-3fef-46e5-b0d8-ae7ddc30341c'::uuid,'Mejeri & æg','Ost'),
    -- Tørret frugt-snack (ICA/Apotea: rosiner, tranebær og frugtstykker)
    ('370e7c40-ac68-417e-8804-38b9ee65cb87'::uuid,'Kolonial','Nødder & tørret frugt'),
    -- Morgenmadsprodukt (Open Food Facts: cereal flakes)
    ('010be2dd-f450-4a41-a5ca-7143e4a42288'::uuid,'Kolonial','Morgenmad & müsli'),
    -- Forbillede: Karl Johan-svampe, tørrede
    ('f5d800f4-adc2-4f28-8a0e-606f3938b310'::uuid,'Kolonial','Nødder & tørret frugt'),
    -- Forbillede: Wokmix (frisk grønt)
    ('77d4ddcb-f132-46a7-87f7-e5b7d1279ee0'::uuid,'Frugt & grønt','Frisk grønt'),
    -- Forbillede: Hvidløg i chiliolie
    ('d4362e58-6f58-4298-bf1d-ced71cd66b3c'::uuid,'Kolonial','Olier & eddike'),
    -- Forbillede: Daddelbar / Nøddebar
    ('d12e9de1-674a-47d6-b63b-ffc00658b10b'::uuid,'Snacks & slik','Kiks & kager'),
    ('e810b899-751b-4ff1-b07c-c8ea935cc2a8'::uuid,'Snacks & slik','Nødder (snack)'),
    -- Forbillede: Chokolademousse / Cheesecakes
    ('4eafbb50-4360-4af8-a197-dce864871ba7'::uuid,'Mejeri & æg','Andet mejeri'),
    -- Forbillede: Frikadelleblanding
    ('725bb661-dea5-46de-9656-a98a784b2d05'::uuid,'Kød & fisk','Andet kød & fisk'),
    -- Forbillede: Smørepålæg m. kikærter (stod fejlagtigt under Drikkevarer)
    ('6dbbd5d2-ae02-4c80-8919-2351d192cbf2'::uuid,'Kolonial','Konserves'),
    -- Rå dej (Open Food Facts: croissanter; forbillede: Focaccia dej)
    ('1f20b863-ee90-4823-ad3c-df0ce95c2369'::uuid,'Brød & bagværk','Boller & bagværk'),
    -- Frisk krydderurt
    ('f604f105-8420-4148-b07d-4b5efa7b94f9'::uuid,'Frugt & grønt','Krydderurter')
  ) as v(id, cat, sub)
 where p.id = v.id and p.subcategory is null;

-- To do til Jan med forslag til de 11, der ikke kunne afgøres sikkert.
insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select
  'Vælg kategori til de sidste 11 produkter',
  E'27 produkter stod tilbage uden kategori efter #692. 16 er rettet ud fra Open Food Facts, butiksbeskrivelser eller klare forbilleder i databasen (sikkerhedskopi: products_category_backup_20261014, låst). De 11 sidste kan ikke afgøres sikkert, og forslagene står i kommentaren. Svar ja, så sættes de, eller ret dem enkeltvis.',
  'todo', 'low', 'backend', public._admin_id('jafo')
 where not exists (select 1 from public.admin_todos where title = 'Vælg kategori til de sidste 11 produkter');

insert into public.admin_todo_comments (todo_id, body)
select t.id, E'Forslag til de 11 (kategori / underkategori):\n'
 || E'1. Fajita Risrit, Danish Crown (ingen ingredienser): Kød & fisk / Andet kød & fisk\n'
 || E'2. Frugtsnacks m. æble-, jordbær- og banansmag øko, Salling: Snacks & slik / Slik & bolsjer\n'
 || E'3. Frugtsnacks m. jordbær, Lifesnacks: Snacks & slik / Slik & bolsjer\n'
 || E'4. Frugtstænger m. jordbær øko (95 % dadler), Salling: Snacks & slik / Kiks & kager (som Daddelbar)\n'
 || E'5. Lasagne kit, Knorr: Kolonial / Pasta & ris\n'
 || E'6. Lu''Li Limited Edition (kun "sulfitter" som ingrediens, ukendt vare): Drikkevarer / Andre drikkevarer\n'
 || E'7. Minipizzadej 6 stk., Pop! Bakery: Brød & bagværk / Brød (som Pizzadej)\n'
 || E'8. Pizza m. salami og peberfrugt, Gestus: Frost / Frosne færdigretter (usikkert: frost eller kølet)\n'
 || E'9. Salami Pizza, Andoni: Frost / Frosne færdigretter (usikkert: frost eller kølet)\n'
 || E'10. Tilskudsblanding fra 6 mdr., Semper (modermælkserstatning, pulver): Kolonial / Andet kolonial\n'
 || E'11. Dr. Oetker Blandede cocktailbær: Kolonial / Konserves'
  from public.admin_todos t
 where t.title = 'Vælg kategori til de sidste 11 produkter'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Forslag til de 11%');
