#!/usr/bin/env bash
# Tjekker nye migrationsfiler i en PR mod basegrenen (typisk origin/main).
# Fejler hvis en ny fil: (1) har samme version som en anden fil, (2) har en version, der allerede findes paa basen,
# eller (3) har en version, der er aeldre end den nyeste paa basen (Supabase springer dem over uden fejl).
# Brug: check-migration-versions.sh <basegren-ref>   (fx origin/main)
set -euo pipefail
BASE="${1:-origin/main}"
DIR="supabase/migrations"

version() { basename "$1" | sed -E 's/^([0-9]+)_.*/\1/'; }

mapfile -t NEW < <(git diff --name-only --diff-filter=A "$BASE"...HEAD -- "$DIR" | grep -E "^$DIR/[0-9]+_.*\.sql$" || true)
[ "${#NEW[@]}" -eq 0 ] && { echo "Ingen nye migrationsfiler."; exit 0; }

mapfile -t BASE_FILES < <(git ls-tree -r --name-only "$BASE" -- "$DIR" | grep -E "^$DIR/[0-9]+_.*\.sql$")
BASE_MAX=$(for f in "${BASE_FILES[@]}"; do version "$f"; done | sort | tail -1)
BASE_VERSIONS=$(for f in "${BASE_FILES[@]}"; do version "$f"; done)

fail=0
for f in "${NEW[@]}"; do
  v=$(version "$f")
  if grep -qx "$v" <<<"$BASE_VERSIONS"; then
    echo "::error file=$f::Versionen $v er allerede i brug paa main. Omdoeb filen med et nyt tidsstempel, der er nyere end $BASE_MAX."; fail=1
  elif [ "$v" -lt "$BASE_MAX" ]; then
    echo "::error file=$f::Versionen $v er aeldre end den nyeste paa main ($BASE_MAX); Supabase ville springe filen over. Omdoeb den med et nyere tidsstempel."; fail=1
  fi
done

DUPS=$(for f in "${NEW[@]}"; do version "$f"; done | sort | uniq -d)
for v in $DUPS; do
  echo "::error::Flere nye filer i denne PR har samme version $v. Giv hver sit eget tidsstempel."; fail=1
done

[ "$fail" -eq 0 ] && echo "Migrationsversioner OK (${#NEW[@]} ny(e) fil(er), nyeste paa main: $BASE_MAX)."
exit "$fail"
