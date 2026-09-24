---
description: Reviewér en PR eller den aktuelle diff mod EatSafes egne konventioner (CLAUDE.md-arkitekturregler, edge-function-auth-mønster, fladhed-bug, emoji/indhold-skel)
argument-hint: [PR-nummer eller tomt for aktuel diff]
---

Reviewér $ARGUMENTS (et PR-nummer via GitHub MCP, eller — hvis intet er
angivet — den aktuelle lokale diff via `git diff`/`git diff --staged`) mod
EatSafes egne, dokumenterede konventioner. Dette er IKKE en generisk
code-review — fokusér specifikt på mønstre der reelt er fundet gentagne
gange i dette repos historie:

1. **Arkitektur-reglerne** (`CLAUDE.md` afsnit 3): én screen = én fil, props
   frem for state, ingen IIFE i JSX, ingen hooks i betinget kode/loops,
   logik i dedikerede `useXxx.js`-hooks, ikke inlinet i `App.jsx`.
2. **Edge-function-auth** (hvis `supabase/functions/*` er ændret): kræver
   ændringen `auth.getUser()`-verificering af kalderen? Sammenlign mod det
   etablerede mønster i `admin`/`delete-user`-funktionerne. Et nyt/ændret
   write-endpoint uden auth-tjek er et kritisk fund — se rescue-audit-
   historikken i `CLAUDE.md` afsnit 7 for hvorfor dette er sket før.
3. **Deploy-huskeregel:** ændrer diff'en noget i `supabase/functions/*`?
   Disse deployes IKKE automatisk af Vercel/git — flag at ændringen også
   skal deployes via `mcp__Supabase__deploy_edge_function` efter merge.
4. **Fladhed-bug-mønsteret:** nye kort/knapper der omgår `.card`/`.btn-*`
   med inline styles uden `box-shadow` — se `.claude/agents/design-reviewer.md`
   for den fulde tjekliste, brug den hvis diff'en rører `.jsx`-filer.
5. **Feltnavne-mismatch:** ligner ændringen et sted der læser/skriver et
   objektfelt der ikke matcher det resten af kodebasen bruger for samme
   data (samme kategori som `customAllerg`-vs-`.custom`- og
   `age`-vs-`birth_year`-buggene fundet tidligere)? Grep efter samme
   feltnavn andre steder i kodebasen for at bekræfte konsistens.
6. **Mojibake:** kør mojibake-scan (se `/mojibake-scan`) på alle ændrede
   filer i diff'en.

Rapportér fund med filsti + linjenummer, prioriteret efter alvor (kritisk
sikkerhedshul > funktionsbug > konvention/stil). Skriv "Ingen fund" for
punkter der er rene. Foreslå IKKE ændringer — dette er en review, ikke en
implementering; hvis brugeren vil have fund rettet, sker det som en separat,
eksplicit anmodning.
