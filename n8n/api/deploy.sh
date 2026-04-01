#!/usr/bin/env bash
# Diti AI — n8n Workflow Deploy Script
# Liest Workflow JSON-Dateien und erstellt/aktualisiert sie via n8n REST API.
#
# Usage:
#   ./deploy.sh                    # Deploy alle Workflows
#   ./deploy.sh --list             # Liste existierende Workflows
#   ./deploy.sh --file <path.json> # Deploy einzelnen Workflow
#   ./deploy.sh --activate <id>    # Aktiviere Workflow
#   ./deploy.sh --deactivate <id>  # Deaktiviere Workflow
#
# Voraussetzungen: .env mit N8N_URL und N8N_API_KEY

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKFLOWS_DIR="$SCRIPT_DIR/../workflows"
ENV_FILE="$PROJECT_DIR/.env"

# .env laden
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

# Pflicht-Variablen pruefen
: "${N8N_URL:?N8N_URL nicht gesetzt. Bitte in .env definieren.}"
: "${N8N_API_KEY:?N8N_API_KEY nicht gesetzt. Bitte in .env definieren.}"

# Trailing Slash entfernen
N8N_URL="${N8N_URL%/}"
API_BASE="$N8N_URL/api/v1"

# --- Hilfsfunktionen ---

api_get() {
  curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" "$API_BASE/$1"
}

api_post() {
  curl -s -X POST \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d "@$2" \
    "$API_BASE/$1"
}

api_patch() {
  curl -s -X PATCH \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$2" \
    "$API_BASE/$1"
}

list_workflows() {
  echo "=== Existierende Workflows ==="
  api_get "workflows" | python3 -c "
import sys, json
data = json.load(sys.stdin)
workflows = data.get('data', data) if isinstance(data, dict) else data
if isinstance(workflows, list):
    for w in workflows:
        status = 'ACTIVE' if w.get('active') else 'INACTIVE'
        print(f\"  [{status}] {w['id']} — {w['name']}\")
else:
    print('  Keine Workflows gefunden oder unerwartetes Format.')
"
}

deploy_workflow() {
  local json_file="$1"
  local filename=$(basename "$json_file")

  echo "Deploying: $filename"

  # Workflow erstellen
  local response
  response=$(api_post "workflows" "$json_file")

  local workflow_id
  workflow_id=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

  if [[ -n "$workflow_id" && "$workflow_id" != "None" ]]; then
    echo "  Erstellt: ID=$workflow_id"

    # Aktivieren
    local activate_response
    activate_response=$(api_post "workflows/$workflow_id/activate" "/dev/null" 2>/dev/null || \
      api_patch "workflows/$workflow_id" '{"active": true}')
    echo "  Aktiviert."
  else
    echo "  FEHLER beim Erstellen. Antwort:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
  fi
}

deploy_all() {
  echo "=== Deploying alle Workflows aus $WORKFLOWS_DIR ==="
  local count=0
  for json_file in "$WORKFLOWS_DIR"/*.json; do
    [[ -f "$json_file" ]] || continue
    deploy_workflow "$json_file"
    count=$((count + 1))
  done
  echo "=== $count Workflow(s) deployed ==="
}

activate_workflow() {
  echo "Aktiviere Workflow $1..."
  api_post "workflows/$1/activate" "/dev/null" 2>/dev/null || \
    api_patch "workflows/$1" '{"active": true}'
  echo "Done."
}

deactivate_workflow() {
  echo "Deaktiviere Workflow $1..."
  api_post "workflows/$1/deactivate" "/dev/null" 2>/dev/null || \
    api_patch "workflows/$1" '{"active": false}'
  echo "Done."
}

# --- Main ---

case "${1:-deploy}" in
  --list)
    list_workflows
    ;;
  --file)
    deploy_workflow "${2:?Bitte JSON-Datei angeben}"
    ;;
  --activate)
    activate_workflow "${2:?Bitte Workflow-ID angeben}"
    ;;
  --deactivate)
    deactivate_workflow "${2:?Bitte Workflow-ID angeben}"
    ;;
  deploy|*)
    deploy_all
    ;;
esac
