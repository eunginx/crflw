#!/usr/bin/env bash
set -euo pipefail

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log() {
  printf '[%s] %s\n' "$(timestamp)" "$1"
}

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$PROJECT_ROOT/ai-service"
PROCESS_MATCH="ts-node-dev --respawn --transpile-only src/index.ts"
CHAT_PAYLOAD='{"message":"hi"}'

load_env_file() {
  local env_file="$SERVICE_DIR/.env"
  if [[ -f "$env_file" ]]; then
    log "Loading environment variables from $env_file"
    # shellcheck disable=SC2046
    set -a; source "$env_file"; set +a
  else
    log "Warning: $env_file not found; relying on existing environment."
  fi
}

send_hi_request() {
  if ! command -v curl >/dev/null 2>&1; then
    log "curl not found; skipping hi chat test."
    return
  fi

  log "Sending chat sanity check (\"hi\")…"
  local response
  if response=$(curl -s -X POST http://localhost:4001/api/ai/chat \
    -H 'Content-Type: application/json' \
    -d "$CHAT_PAYLOAD" 2>/dev/null); then
    log "Chat response: $response"
  else
    log "Chat request failed. Check service logs for details."
  fi
}

log "Restarting ai-service (cwd: $SERVICE_DIR)"

load_env_file

if pgrep -f "$PROCESS_MATCH" >/dev/null 2>&1; then
  log "Existing dev server detected. Sending stop signal…"
  if pkill -f "$PROCESS_MATCH" >/dev/null 2>&1; then
    log "Process stopped successfully."
  else
    log "Warning: Failed to stop process (it may have exited already)."
  fi
  sleep 1
else
  log "No running dev server detected."
fi

log "Starting ai-service dev server…"
cd "$SERVICE_DIR"

(
  sleep 5
  send_hi_request
) &

npm run dev
