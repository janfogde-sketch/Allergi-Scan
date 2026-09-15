---
description: Mål den faste context-overhead Claude Code læser ved hver session-start i dette repo (CLAUDE.md, altid-loadede regler, hooks) og foreslå konkrete nedskæringer. Kør denne når CLAUDE.md føles for stort/langsomt at læse, eller periodisk (fx hver måned) som sundhedstjek — filen vokser med hver logget arbejdsbølge og har ingen indbygget oprydning.
effort: low
---

# Token-audit — EatSafe

Skrevet specifikt til dette repo (ikke en generisk tredjeparts-skabelon).
Formålet er snævert: mål hvad der reelt koster context ved hver sessions
start, og foreslå konkrete, minimale nedskæringer — ikke en omskrivning af
selve arbejdsgangen i `CLAUDE.md` afsnit 4.

## 1. Mål den faste overhead

- `wc -w CLAUDE.md` — CLAUDE.md læses AUTOMATISK ved hver session-start,
  uanset opgave. Det er den direkte, ubetingede kostnad.
- `wc -w .claude/rules/*.md` for hver fil — men tjek `paths:`-frontmatter'en
  i hver: en path-scoped regel (som `design-tokens.md`, kun UI-arbejde)
  koster intet på en session der aldrig rører `src/*.jsx`. Skeln mellem
  "altid-loadet" og "kun-scoped" i rapporten — kun de altid-loadede tæller
  som ren overhead.
- `.claude/hooks/*` — kør-tid ved hver `Write`/`Edit` (`PostToolUse`), ikke
  engangs-context, men stadig en gentagen kostnad. Notér hvor mange gange
  hooken typisk fyrer i en gennemsnitlig session (én pr. filændring).

## 2. Klassificér CLAUDE.md's indhold

`CLAUDE.md` har to reelt forskellige slags indhold blandet sammen:
1. **Nutids-tilstand** — hvad er sandt LIGE NU (arkitektur, tech stack,
   arbejdsgang, aktuelle token-værdier). Dette skal blive i filen — det er
   det en frisk session faktisk har brug for.
2. **Historisk logbog** — dags-daterede "X. sept. 2026 — vi gjorde Y"-afsnit.
   Værdifulde som revisionsspor og "lektioner lært", men de færreste er
   nødvendige for at en frisk session kan handle korrekt LIGE NU — kun
   konklusionen/slutresultatet er det.

Tæl (groft, med `grep -c` på datostempel-mønsteret `\d+\. sept\. 2026`) hvor
mange separate dags-daterede log-afsnit der findes, og estimér hvor stor en
andel af CLAUDE.md's samlede ordtal de udgør.

## 3. Foreslå en konkret nedskæring — ikke en generisk "gør det kortere"

Hvis logbog-andelen er stor (tjek empirisk, ikke en antagelse): foreslå at
flytte de ældre, afsluttede log-afsnit (dem hvor konklusionen allerede er
opsummeret et andet sted, fx i en tabel/status-linje) til en separat
`src/CHANGELOG.md` eller `.claude/HISTORY.md`, og erstatte dem i selve
`CLAUDE.md` med én kort linje der linker dertil. Behold ALTID i selve
`CLAUDE.md`:
- Nutids-arkitektur (afsnit 1-3)
- Arbejdsgangen (afsnit 4)
- Den AKTUELLE status for igangværende arbejde (ikke hele historikken bag den)
- Stående regler/lektioner der reelt ændrer fremtidig adfærd (fx
  ental/flertal-nøgleordsreglen, "spring aldrig git-status over før reset")

Foreslå IKKE at fjerne noget der er en aktiv, stående regel — kun ren
historik hvor konklusionen allerede lever et andet sted.

## Output

Kort talrapport (ordtal for CLAUDE.md, altid-loadede regler vs. scoped
regler, antal hook-triggers), efterfulgt af ét konkret forslag til hvad der
kan flyttes ud og hvorhen — med et estimeret ordtal/procent-besparelse.
Lav ikke selve flytningen uden at spørge først, da det er en strukturel
ændring af projektets hukommelse, ikke en kode-rettelse.
