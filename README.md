# EatSafe

Dansk app (PWA) til mennesker med fødevareallergier og -intolerancer. Brugeren scanner en stregkode eller søger, og appen
matcher ingredienserne mod brugerens (og familiens) profil og viser et klart signal med begrundelse, alternativer og indkøbsliste.

Live: https://www.eatsafe.dk · Admin: https://www.eatsafe.dk/admin.html (kræver admin-konto)

> **Arbejdsaftalen er `CLAUDE.md`.** Den beskriver arkitektur, regler, politikker, opbevaring og hvordan vi arbejder. Denne
> fil er kun en kort indgang; ved uenighed gælder `CLAUDE.md`. Gyldig pr. 8. okt. 2026.

## Teknik

React 18 + Vite 5 (almindelig JSX), Supabase (Postgres, Edge Functions i Deno, Auth), hosting på Vercel.
Allergen-fallback og læsning af ingredienslister bruger Claude Haiku; produktdata kommer fra Open Food Facts.

## Kør lokalt

Kræver Node 22.

```
npm ci
npm run dev       # udviklingsserver
npm run lint      # ESLint
npx vitest run    # tests (alle skal være grønne)
npm run build     # produktionsbygge (appen og admin-panelet)
```

Appen har ingen lokal `.env`: den bruger det rigtige Supabase-projekts offentlige adresse og nøgle, som står i koden. Hemmelige
nøgler (fx til Claude og Resend) findes kun som secrets i Supabase og aldrig i repoet.

## Mappestruktur

- `src/`: appen. Én skærm pr. fil (`XxxScreen.jsx`), logik i `useXxx.js`, al styling i `src/theme.jsx`. Admin-panelet ligger i `src/admin/`.
- `supabase/functions/`: Edge Functions. Fælles kode i `_shared/` (bl.a. allergenmotoren). `supabase/config.toml` styrer login-krav pr. funktion.
- `supabase/migrations/`: databaseændringer (se nedenfor). `supabase/tests/`: databasetests. `supabase/templates/`: mailskabeloner.
- `public/`: statiske sider, logo og service worker. `docs/`: testplaner.
- `src/CONTEXT.md`: tabeller, funktioner, notifikationer og to do-listen. `BRAND.md`: brandguide.

## Databaseændringer

Alle ændringer skrives som en fil i `supabase/migrations/` (versionen er et tidsstempel, unikt) og går i en pull request.
Workflowet "Apply migrations" kører nye filer, når PR'en er merget til `main`. Brug ikke SQL-værktøjer til at skrive direkte.
Det gælder også to do-listen (`admin_todos`). Læs `supabase/migrations/README.md`.

## Tests og kontrol

Ved hver pull request kører CI (lint, tests, bygge), databasetests (`db-tests.yml`) og et tjek efter merge. Både allergenmotoren
(`src/allergenRegression.test.js`) og politiktekster (`src/legalText.test.js`) har tests, der fejler ved afvigelse.
Browser-sikkerhedsregler (indholdsspærre) står i `vercel.json` og vogtes af `src/securityHeaders.test.js`.

## Udgivelse

- **Appen:** merge til `main` giver automatisk et deploy på Vercel.
- **Edge Functions:** deployes af workflowet "Deploy edge functions" ved merge til `main`.
- **Database:** "Apply migrations", som ovenfor.
- Rene design- og dokumentændringer følger med næste funktionsændring (Vercel Free har en daglig grænse for deploys).

## Politikker

Vilkår og privatlivspolitik skrives ét sted (`src/legalText/`); siderne `public/terms.html` og `public/privacy.html` genereres med
`node scripts/build-legal-pages.mjs` og må ikke rettes i hånden. Opbevaringsfrister står i privatlivspolitikken og i `CLAUDE.md`.
