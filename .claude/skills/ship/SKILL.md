---
description: Kør EatSafes fulde ændrings-workflow — byg, test, mojibake-scan, commit, push, PR, vent på grøn Vercel, squash-merge, resync branch. Se CLAUDE.md afsnit 4 for den fulde, altid-opdaterede beskrivelse — denne skill er en kortfattet, kaldbar genvej til samme proces, ikke en erstatning for den.
effort: medium
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, mcp__github__create_pull_request, mcp__github__merge_pull_request, mcp__github__pull_request_read, mcp__Supabase__deploy_edge_function, mcp__Supabase__apply_migration
---

# Ship — EatSafes standard ændrings-workflow

Følg denne rækkefølge for enhver kodeændring i dette repo. Spring aldrig et
trin over uden at sige hvorfor. Spørg kun brugeren om lov først hvis
ændringen er stor/arkitektonisk/destruktiv — ellers køres hele processen
autonomt.

**Batching:** lav alle lokale skridt (1-5 nedenfor) løbende for hver logisk
delændring (fx én fil, én bølge i en flerdelt opgave), men vent med
push/PR/merge (6-10) til HELE den samlede opgave brugeren bad om er færdig —
uanset om det er én fil eller ti. Undtagelse: en kritisk/blokerende
produktionsfejl shippes altid isoleret med det samme, uanset hvor i en
større opgave man er.

## Per logisk delændring

1. **Lav ændringen** i de relevante filer.
2. **Byg:** `npm run build` — skal være grøn.
3. **Test:** `npx vitest run` — alle tests skal bestå.
4. **Mojibake-scan** hver ændret fil (fanger cyrillisk tegn-encoding-fejl fra
   copy/paste af danske tegn):
   ```python
   import re
   print(re.findall(r'[Ѐ-ӿ]+', open(path, encoding='utf-8').read()))
   ```
5. **Commit specifikke filer** — ALDRIG `git add -A`. Dansk, kort, beskrivende
   commit-besked med attributions-trailere (`Co-Authored-By` + `Claude-Session`,
   se system-instruktionen for nøjagtig ordlyd). Push IKKE endnu.

## Én gang, når hele opgaven er færdig

6. **Push** alle commits til den aktive feature-branch i én omgang.
7. **Opret ÉN PR** via GitHub MCP der dækker det hele — dansk PR-body der
   opsummerer alle ændringer, tjek for PR-template først. Afslut med
   `🤖 Generated with [Claude Code]`-footer + session-link.
8. **Vent på grøn Vercel-status** (`pull_request_read`/`get_status`).
9. **Squash-merge** PR'en.
10. **Resync branch:** hent nyeste `main`, `git reset --hard origin/main`,
    force-push med `--force-with-lease` til feature-branchen.

## Vigtigt

- Edge Functions (`supabase/functions/*`) auto-deployes IKKE af Vercel/git —
  de skal deployes separat via `mcp__Supabase__deploy_edge_function` efter
  merge, med `verify_jwt` sat til den eksisterende værdi for funktionen.
- DB-migrationer (trigger-funktioner, RLS m.m.) anvendes direkte via
  `mcp__Supabase__apply_migration` — de ligger ikke som `.sql`-filer i repoet.
- "Hvornår er opgaven færdig?" — det brugeren bad om i den seneste
  sammenhængende instruktion. Ved tvivl: hellere for få PR'er end for mange.
