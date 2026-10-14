#!/usr/bin/env bash
# Natjob-tråden (docs/natjob-routine.md). Bruges af workflowene "Hent natjob-kø" og "Skriv natjob-resultat".
#   natjob.sh hent    → læser køen med public.routine_queue og viser motorens resultat i loggen
#   natjob.sh skriv   → bygger resultatet (env NATJOB_PAYLOAD) med motoren og skriver med public.routine_apply
# Kun de to databasefunktioner kaldes. Kun opad håndhæves i databasen.
set -euo pipefail
: "${SUPABASE_ACCESS_TOKEN:?mangler}" "${PROJECT_REF:?mangler}"
API="https://api.supabase.com/v1/projects/$PROJECT_REF/database/query"
TMP=$(mktemp -d)

sql() { # sql <forespørgsel> → JSON-rækker på stdout
  jq -n --arg q "$1" '{query:$q}' | curl -sS --fail-with-body -X POST "$API" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" --data @-
}
tag() { echo "p$(head -c 12 /dev/urandom | od -An -tx1 | tr -d ' \n')"; }

case "${1:-}" in
  hent)
    sql "select public.routine_queue(100, 150) as q" | jq '.[0].q' > "$TMP/queue.json"
    echo "Antal: $(jq '.allergen | length' "$TMP/queue.json") til allergencheck, $(jq '.category | length' "$TMP/queue.json") uden kategori."
    echo "=== NATJOB-KØ START ==="
    node scripts/natjob.mjs queue "$TMP/queue.json"
    echo
    echo "=== NATJOB-KØ SLUT ==="
    ;;
  skriv)
    : "${NATJOB_PAYLOAD:?mangler}"
    printf '%s' "$NATJOB_PAYLOAD" | jq -c . > "$TMP/input.json" || { echo "::error::Payload er ikke gyldig JSON."; exit 1; }
    ids=$(node scripts/natjob.mjs ids "$TMP/input.json" | paste -sd, -)
    if [ -n "$ids" ]; then
      idlist=$(echo "$ids" | sed "s/[^,]*/'&'/g")
      sql "select id, ingredients_text from public.products where id in ($idlist)" > "$TMP/texts.json"
    else
      echo '[]' > "$TMP/texts.json"
    fi
    node scripts/natjob.mjs build "$TMP/input.json" "$TMP/texts.json" > "$TMP/apply.json"
    t=$(tag)
    case "$(cat "$TMP/apply.json")" in *"\$$t"*) echo "::error::Uventet indhold."; exit 1;; esac
    echo "Skriver:"; jq '{note, allergen: (.allergen | length), category: (.category | length)}' "$TMP/apply.json"
    sql "select public.routine_apply(\$$t\$$(cat "$TMP/apply.json")\$$t\$::jsonb) as resultat" | tee "$TMP/result.json"
    echo
    echo "Færdig."
    ;;
  *) echo "Brug: natjob.sh hent|skriv"; exit 1 ;;
esac
