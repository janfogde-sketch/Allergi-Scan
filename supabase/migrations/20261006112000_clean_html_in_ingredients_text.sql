-- 6. okt. 2026 (kodegennemgang fase 8, D2): HTML-rester i products.ingredients_text ryddet (1.245 produkter).
-- KØRT SOM BATCHES (100/400/500/500 rækker) via SQL, fordi én samlet UPDATE overskred tidsgrænsen og blev rullet tilbage.
-- Filen dokumenterer logikken; den er idempotent. <BR> bliver til ét mellemrum (", <BR>" til ", "), øvrige tags til
-- mellemrum, &nbsp; til mellemrum, &amp;/&quot;/&lt;/&gt;/&apos; til tegnet, andre entiteter til mellemrum; gentagne mellemrum samles.
-- Kun ingredients_text ændres, ingen flag. Gamle tekster: products_allergen_backup_20261006.ingredients_text.
-- Verificeret: 1.245 rækker ændret mod backup, 0 tømte, 1 række matcher stadig mønstret (OCR-tekst, ikke HTML).
with t as (
  select id, ingredients_text x0 from public.products
  where ingredients_text ~* '<\s*/?\s*[a-z]|&[a-z]+;|&#[0-9]+;'
), c as (
  select id, btrim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    x0, ',\s*<\s*br\s*/?\s*>', ', ', 'gi'), '<\s*br\s*/?\s*>', ' ', 'gi'), '</?[a-z][^>]*>', ' ', 'gi'),
    '&nbsp;|&#160;', ' ', 'gi'), '&amp;', '&', 'gi'), '&quot;', '"', 'gi'), '&#0?39;|&apos;', '''', 'gi'),
    '&lt;', '<', 'gi'), '&gt;', '>', 'gi'), '&[a-z]+;|&#[0-9]+;', ' ', 'gi')) y from t
)
update public.products p set ingredients_text = regexp_replace(c.y, '[ \t]{2,}', ' ', 'g') from c where p.id = c.id;

-- Tilbagerulning:
-- update public.products p set ingredients_text = b.ingredients_text
-- from public.products_allergen_backup_20261006 b where b.id = p.id and b.ingredients_text is distinct from p.ingredients_text;
