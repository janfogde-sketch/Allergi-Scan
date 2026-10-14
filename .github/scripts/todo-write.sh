#!/usr/bin/env bash
# Skriver til to do-listen via databasefunktionen public.todo_apply (kun admin_todos og admin_todo_comments).
# Bruges af workflowet "Skriv til to do". Input i env TODO_PAYLOAD: {"ops":[{op:create|update|comment, ...}]}.
set -euo pipefail
: "${SUPABASE_ACCESS_TOKEN:?mangler}" "${PROJECT_REF:?mangler}" "${TODO_PAYLOAD:?mangler}"
API="https://api.supabase.com/v1/projects/$PROJECT_REF/database/query"

payload=$(printf '%s' "$TODO_PAYLOAD" | jq -c .) || { echo "::error::Payload er ikke gyldig JSON."; exit 1; }
echo "$payload" | jq -e '(.ops | type == "array") and (.ops | length >= 1 and length <= 50)' >/dev/null \
  || { echo "::error::Forventer {\"ops\":[...]} med 1-50 handlinger."; exit 1; }
echo "$payload" | jq -e 'all(.ops[]; .op == "create" or .op == "update" or .op == "comment")' >/dev/null \
  || { echo "::error::Kun create, update og comment er tilladt."; exit 1; }

tag="p$(head -c 12 /dev/urandom | od -An -tx1 | tr -d ' \n')"
case "$payload" in *"\$$tag"*) echo "::error::Uventet indhold."; exit 1;; esac
echo "Handlinger:"; echo "$payload" | jq .
query="select public.todo_apply(\$$tag\$$payload\$$tag\$::jsonb) as resultat"
jq -n --arg q "$query" '{query:$q}' | curl -sS --fail-with-body -X POST "$API" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" --data @- | tee /tmp/todo-result.json
echo
echo "Færdig."
