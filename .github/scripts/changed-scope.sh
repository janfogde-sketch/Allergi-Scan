#!/usr/bin/env bash
# Afgør, om en ændring KUN rører to do-listen, dokumenter eller Claude-filer (intet der påvirker app eller database).
# Brug: changed-scope.sh <fra-ref>   (PR: basegrenens SHA; push: forrige SHA). Skriver only_docs=true|false til $GITHUB_OUTPUT.
# Ved enhver tvivl eller fejl bliver svaret false, så alle tjek kører som før.
# En migration tæller kun som to do-fil, hvis navnet indeholder _todo_ og indholdet kun bruger insert/update/select
# på admin_todos, admin_todo_comments og _admin_id (ingen create/alter/drop/grant/delete).
set -uo pipefail
FROM="${1:-}"
out() { echo "only_docs=$1"; [ -n "${GITHUB_OUTPUT:-}" ] && echo "only_docs=$1" >> "$GITHUB_OUTPUT"; exit 0; }

[ -z "$FROM" ] && out false
[[ "$FROM" =~ ^0+$ ]] && out false
mapfile -t FILES < <(git diff --name-only "$FROM" HEAD 2>/dev/null) || out false
[ "${#FILES[@]}" -eq 0 ] && out false

for f in "${FILES[@]}"; do
  case "$f" in
    supabase/todo/*.sql|docs/*|.claude/*|*.md) ;;
    supabase/migrations/*_todo_*.sql)
      [ -f "$f" ] || out false
      if grep -qiE '^[[:space:]]*(create|alter|drop|grant|revoke|truncate|delete)\b' "$f"; then out false; fi
      ;;
    *) out false ;;
  esac
done
out true
