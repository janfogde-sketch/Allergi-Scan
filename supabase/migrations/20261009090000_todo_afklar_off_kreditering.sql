-- Opretter en to do om at afklare CC BY-SA-krediteringen af Open Food Facts-billeder, før "OFF"-mærket fjernes fra miniaturer. Idempotent. Sletter ingen data.
insert into public.admin_todos (title, description, status, priority, track)
select '[Før beta] Afklar CC BY-SA-kreditering af Open Food Facts-billeder, før OFF-mærket fjernes fra miniaturer',
$d$Bjørn (9. okt. 2026): miniaturer i historik, favoritter og indkøbsliste skal være rene (ingen OFF-mærke, ingen ekstra tekstlinje). Produktsiden viser "Billede: Open Food Facts, CC BY-SA" under det store billede (klikbare links til produktet og licensen), og Indstillinger har en samlet kreditering.
Skal afklares (Jan): opfylder denne kombination CC BY-SA (passende kildeangivelse, licenslink, oplysning om ændringer, her kun skalering) når billedet også vises andre steder? Tjek også Open Food Facts' egne retningslinjer for genbrug af billeder.
Først når det er afklaret: fjern "OFF"-mærket i ProductImage (src/ProductParts.jsx), ét sted. Indtil da står mærket på miniaturerne.$d$,
'todo','normal','drift'
where not exists (select 1 from public.admin_todos where title like '%Afklar CC BY-SA-kreditering%');
