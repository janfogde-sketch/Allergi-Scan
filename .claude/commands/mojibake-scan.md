---
description: Kør en kyrillisk mojibake-scan på alle ændrede/staged filer (trin 4 i CLAUDE.md afsnit 4 / .claude/skills/ship)
argument-hint: [filsti ...]
---

Scan for kyrillisk mojibake (tegn-encoding-fejl fra copy/paste af danske
tegn — æ/ø/å) i de angivne filer, eller i alle filer med lokale ændringer
hvis ingen er angivet ($ARGUMENTS).

Kør for hver relevant fil:

```python
import re
matches = re.findall(r'[Ѐ-ӿ]{2,}', open(path, encoding='utf-8').read())
print(path, '->', matches if matches else 'clean')
```

(kræver mindst 2 sammenhængende kyrilliske tegn — enkeltstående tegn er ofte
en falsk positiv fra tekst der selv omtaler denne regex, fx i dokumentation).

Hvis ingen filsti er angivet: brug `git diff --name-only` + `git diff --staged --name-only`
til at finde de ændrede filer. Rapportér resultatet for hver fil — ved fund,
vis den matchede tekst og filens linje, så det kan vurderes om det er en
reel encoding-fejl eller en falsk positiv.
