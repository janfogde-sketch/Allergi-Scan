-- Kreditering af Open Food Facts-billeder er afklaret: den nuværende løsning er nok, intet skal ændres i appen.
update public.admin_todos set status = 'done', updated_at = now()
 where id = '7d8def70-344b-4275-acc8-f66aeb72f19b' and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Afklaret 13. okt. 2026. Open Food Facts kræver (terms-of-use, billeder under CC BY-SA): nævn Open Food Facts og licensen, og link til openfoodfacts.org (gælder også bearbejdede billeder). Vi gør det på produktsiden ("Billede: Open Food Facts, CC BY-SA" med links til produktet og licensen), i Indstillinger (samlet kreditering) og i vilkår/privatlivspolitik. Kravet er ikke, at teksten står ved hver miniature; OFF-mærket på miniaturerne er allerede fjernet. Billederne skaleres kun, så ShareAlike udløser intet ekstra. Konklusion: intet skal ændres. Forbehold: ikke juridisk rådgivning; tvivl kan sendes til reuse@openfoodfacts.org. Kilde: https://world.openfoodfacts.org/terms-of-use'
  from public.admin_todos t
 where t.id = '7d8def70-344b-4275-acc8-f66aeb72f19b'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Afklaret 13. okt. 2026.%');
