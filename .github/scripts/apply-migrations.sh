#!/usr/bin/env bash
# Anvender nye migrationsfiler fra supabase/migrations på produktionsdatabasen.
# Kun filer med version > CUTOFF og som ikke står i supabase_migrations.schema_migrations.
# Hver fil køres i én transaktion sammen med indsættelsen i historikken.
# DRY_RUN=true viser kun, hvad der ville blive kørt.
set -euo pipefail
: "${SUPABASE_ACCESS_TOKEN:?mangler}" "${PROJECT_REF:?mangler}"
CUTOFF="20261006171813"   # nyeste version, der var anvendt, da workflowet blev indført
API="https://api.supabase.com/v1/projects/$PROJECT_REF/database/query"

q() { # $1 = SQL; skriver svaret til stdout, fejler ved HTTP-fejl
  jq -n --arg q "$1" '{query:$q}' | curl -sS --fail-with-body -X POST "$API" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" --data @-
}

applied=$(q "select version from supabase_migrations.schema_migrations" | jq -r '.[].version')
pending=()
for f in $(ls supabase/migrations/*.sql | sort); do
  v=$(basename "$f" | cut -d_ -f1)
  [[ "$v" =~ ^[0-9]{14}$ ]] || continue
  [[ "$v" > "$CUTOFF" ]] || continue
  echo "$applied" | grep -qx "$v" && continue
  pending+=("$f")
done

if [ ${#pending[@]} -eq 0 ]; then echo "Ingen nye migrationer."; exit 0; fi
for f in "${pending[@]}"; do
  v=$(basename "$f" | cut -d_ -f1); name=$(basename "$f" .sql | cut -d_ -f2-)
  echo "::group::Migration $v $name"
  if [ "${DRY_RUN:-false}" = "true" ]; then echo "(dry run, springes over)"; echo "::endgroup::"; continue; fi
  sql="begin;
$(cat "$f")
;
insert into supabase_migrations.schema_migrations(version,name,statements) values ('$v','${name//\'/}', array[]::text[]);
commit;"
  q "$sql" >/dev/null
  echo "Anvendt."
  echo "::endgroup::"
done
