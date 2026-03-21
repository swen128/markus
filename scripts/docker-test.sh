#!/usr/bin/env bash
# Usage: scripts/docker-test.sh [harness options] <prompt>
# Example: scripts/docker-test.sh --fixture workspace --max-turns 5 "What database did we pick?"
set -euo pipefail

IMAGE_NAME="markus-test"
PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"

export CLAUDE_CODE_OAUTH_TOKEN="${CLAUDE_CODE_OAUTH_TOKEN:-$(op read 'op://Private/Claude Code OAuth token/password' --account my.1password.com)}"

docker build -t "$IMAGE_NAME" "$PLUGIN_DIR" > /dev/null 2>&1

docker run --rm \
  -v "$PLUGIN_DIR:/plugin" \
  -e CLAUDE_CODE_OAUTH_TOKEN \
  "$IMAGE_NAME" \
  -c "cd /plugin && bun run tests/harness.ts $*"
