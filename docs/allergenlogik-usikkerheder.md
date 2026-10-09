# Allergenlogik: hvor datagrundlaget ikke giver en sikker klassifikation

Opdateret 10. okt. 2026 (kvalitetssikring med Lotte Pepero Kiksestænger som udgangspunkt). Regressionstests: `src/allergenQuality.test.jsx`,
`src/ingredientHighlight.test.js`, `src/allergenEngine.test.js`.

- **Sulfitter (E220-E228):** et sulfitstof alene er ikke en deklareret allergen (mærkningspligt over 10 mg/kg eller 10 mg/l samlet SO2).
  Står ordet (sulfit, sulphite, svovldioxid) i deklarationen, eller er mængden over grænsen, gælder `svovl = yes`. Står der kun et E-nummer uden
  ord og mængde, bliver flaget `unknown` i appen (`sulfiteAssessment()` i `helpers.js`), dvs. "Kan ikke vurderes" for brugere med sulfitvalg.
  Angivet mængde på højst 10 mg/kg giver `traces`. Et selvvalgt E-nummer (fx E223) er altid et selvstændigt fravalg. Motoren (`allergenEngine.js`)
  gemmer stadig `yes` for E22x alene; det er appen, der omtolker det. Allerede gemte flag i databasen er ikke genanalyseret.
- **E322 (lecithin):** uden dokumenteret kilde er det kun et sojaspor (orange), aldrig direkte soja. Solsikke-/rapslecithin giver intet sojaspor.
  "E322 (SOJA)" giver direkte soja. E471/E472 er stadig kun mulige mælkespor.
- **Ikke-danske ingredienslister** kan motoren ikke læse (alt bliver "nej"). Er produktet markeret `allergen_quality=high` (Claude-læst), stoler
  vurderingen på det, men produktet foreslås aldrig som alternativ (kan ikke give grøn anbefaling).
- **Blandinger og dellister** (kageblandinger, toppings, kagenavne uden æg/væske/fedt): "Kan ikke vurderes", fordi det færdige produkt kan indeholde
  tilsatte ingredienser (fx æg). Heuristik (`ingredientsLookIncomplete()`), kan give falske "kan ikke vurderes" på færdige kager uden æg.
- **Spor:** et ord i en "Kan indeholde spor af"-sætning markeres kun mod spor-regler. En bruger med direkte nødder (rød) ser derfor ikke "mandler" i en
  sporsætning markeret.
- **Næring:** kulhydrat og mættet fedt mangler i databasen for næsten alle Bilka-/Nemlig-produkter (importerne gemte dem aldrig). Appen viser kun
  registrerede værdier (se to do om import).
- **Produktkategorier:** underkategorien "Kiks & kager" rummer også slik (fx lollipops). Alternativer kræver derfor et fælles navneord eller en dyb
  kategori-sti, ikke blot samme underkategori. Selve produktdata er ikke ændret.
