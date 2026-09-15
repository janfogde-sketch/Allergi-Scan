---
description: Hurtigt lokalt sundhedstjek — byg, test, mojibake-scan (uden commit/push/PR). Trin 2-4 fra .claude/skills/ship isoleret til stand-alone brug.
---

Kør et hurtigt lokalt sundhedstjek af den aktuelle arbejdstilstand, uden at
committe eller pushe noget:

1. `npm run build` — skal være grøn.
2. `npx vitest run` — alle tests skal bestå.
3. Mojibake-scan på alle filer med lokale ændringer (`git diff --name-only` +
   `git diff --staged --name-only`) — samme metode som `/mojibake-scan`.
4. `git status --short` — vis hvad der reelt er ændret, så det er let at se
   om noget uventet ligger der.

Rapportér resultatet af alle fire trin samlet til sidst. Fix intet
automatisk — dette er kun et statustjek. Hvis noget fejler, forklar hvad og
lad brugeren/den igangværende opgave afgøre næste skridt.
