-- Dato for seneste verificering af ingredienser og allergener (to do 982ca5ad).
-- En importdato er ikke en verificeringsdato: kolonnen sættes KUN, når en administrator sætter produktets
-- status til "verified" (kontrolleret mod emballagen), og nulstilles, hvis statussen forlades igen.
-- Ingen personoplysninger (ingen kolonne mod brugere), så kontosletning og opbevaring er upåvirket.
alter table public.products add column if not exists ingredients_verified_at timestamptz;

create or replace function public.set_ingredients_verified_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(new.verified_status, '') = 'verified' then
    if tg_op = 'INSERT' or coalesce(old.verified_status, '') is distinct from 'verified' then
      new.ingredients_verified_at := now();
    end if;
  else
    new.ingredients_verified_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_ingredients_verified_at on public.products;
create trigger trg_set_ingredients_verified_at
  before insert or update of verified_status on public.products
  for each row execute function public.set_ingredients_verified_at();

-- Ingen eksisterende produkt er "verified" (kontrolleret 13. okt. 2026), så der er intet at udfylde bagud.

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Design: Gennemlæs tekst og placering af "Ingredienser kontrolleret"-linjen på produktsiden',
       'Jan har sagt ja til, at produktsiden viser, hvornår ingredienser og allergener sidst blev kontrolleret mod emballagen (to do 982ca5ad). Bygget med eksisterende stil lige under produktnavnet: "Ingredienser kontrolleret 12. oktober 2026" eller, hvis ingen har kontrolleret dem, "Ikke kontrolleret mod emballagen endnu", plus "Kontrollér altid emballagen". Datoen sættes kun, når en administrator sætter produktets status til Verificeret i admin. Bjørn: gennemlæs ordlyd og placering, og ret efter behov. Ingen iPhone-test nødvendig ud over et hurtigt blik på en produktside.',
       'todo', 'normal', 'frontend', 'd8ff299b-449e-4c88-98fd-58f397199f1c'
 where not exists (select 1 from public.admin_todos where title like '%Ingredienser kontrolleret"-linjen%');

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Status 13. okt. 2026: bygget. Ny kolonne products.ingredients_verified_at, sat af en trigger kun når status bliver "verified" (nulstilles, hvis statussen forlades). Produktsiden viser "Ingredienser kontrolleret [dato]" eller "Ikke kontrolleret mod emballagen endnu" og "Kontrollér altid emballagen". Ingen produkter er verificeret i dag, så alle viser den neutrale tekst, til en administrator verificerer dem. Beslutning (standardvalg): kun administratorer verificerer; brugerbekræftelse tæller ikke. Bjørn har fået en to do om at gennemlæse tekst og placering.'
  from public.admin_todos t
 where t.id = '982ca5ad-9732-4947-ac35-1beac4730471'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Status 13. okt. 2026: bygget.%');

update public.admin_todos set status = 'done', completed_at = now(), updated_at = now()
 where id = '982ca5ad-9732-4947-ac35-1beac4730471' and status <> 'done';
