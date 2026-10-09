-- To do: produktdata-opfølgning efter finpudsning af produktsiden (10. okt. 2026).
insert into admin_todos (title, description, priority, track) values
('[Før beta] Kontrollér EAN, navn og ingrediensliste mod emballagen: Salling "Den du ved nok kage" (EAN 5712877889767)',
 'Listen indeholder kun flormelis, kokosmel, kakaopulver og skummetmælkspulver plus spor. Tjek på den fysiske emballage, om listen dækker hele produktet, en blanding eller en komponent, og at EAN, navn og kilde (Bilka) passer. Tjek også de kageblandinger, hvor ægget tilsættes derhjemme (fx Dannevirke "Krydderkage", Valsemøllen "Krydderkage m. Frosting", Salling/Valsemøllen "Drømmekage"). Appen viser nu "Kan ikke vurderes" for blandinger og dellister (ingredientsLookIncomplete i helpers.js).',
 'normal', 'drift'),
('[Før beta] Data: importér manglende næringsværdier (kulhydrat og mættet fedt) for Bilka- og Nemlig-produkter',
 'Kulhydrat mangler for 8.198 af 8.201 Bilka-produkter, og mættet fedt mangler for alle Bilka- og Nemlig-produkter (14.847 af 15.201 i alt). Det er manglende data, ikke en visningsfejl: butiksimporterne har aldrig gemt felterne. Forslag: hent værdierne via EAN fra Open Food Facts, hvor de findes, og kun dokumenterede værdier (aldrig beregnet eller 0 som pladsholder). Ca. 949 produkter har kun nuller som næringsdata (pladsholder for ukendt) og skjules i appen; ryd dem til null. 7 produkter har gamle feltnavne (energy, saturated, carbs). Kræver Jans ja, da det er en datamigration.',
 'normal', 'backend');
