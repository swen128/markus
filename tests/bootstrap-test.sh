#!/usr/bin/env bash
# Usage: tests/bootstrap-test.sh
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SESSION="bootstrap-test-$$"
WORKSPACE="$(mktemp -d "${TMPDIR:-/tmp}/markus-bootstrap-XXXXXX")"
WORKSPACE="$(cd "$WORKSPACE" && pwd -P)"
CLAUDE_JSON="$HOME/.claude.json"

tmp="$(mktemp)"
jq --arg path "$WORKSPACE" '.projects[$path] = {"hasTrustDialogAccepted": true, "hasTrustDialogHooksAccepted": true}' "$CLAUDE_JSON" > "$tmp" && mv "$tmp" "$CLAUDE_JSON"

tmux new-session -d -s "$SESSION" -x 200 -y 50 \
  "cd '$WORKSPACE' && IS_DEMO=1 claude \
    --agent personal-assistant \
    --dangerously-skip-permissions \
    --plugin-dir '$PLUGIN_DIR' \
    --dangerously-load-development-channels plugin:markus@inline \
    --max-turns 15"

echo "session=$SESSION"
echo "workspace=$WORKSPACE"
