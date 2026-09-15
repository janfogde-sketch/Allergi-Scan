---
description: Resync den aktive feature-branch til nyeste main (trin 10 i CLAUDE.md afsnit 4 / .claude/skills/ship)
---

Resync den aktive feature-branch til nyeste `main`, klar til næste opgave:

1. Kør `git status --short` — hvis der er ukommitterede ændringer, STOP og
   spørg brugeren hvad der skal ske med dem (stash/commit) før noget andet.
2. `git fetch origin main`
3. `git reset --hard origin/main`
4. `git push --force-with-lease origin <aktiv-branch>`

Brug kun `--force-with-lease`, aldrig `--force`. Dette er destruktivt for
branchens lokale historik — kør kun trin 3-4 når branchen udelukkende
indeholder allerede-merget historik (dvs. lige efter en squash-merge til
`main`), aldrig hvis branchen har ukommitteret eller ikke-merget arbejde.
