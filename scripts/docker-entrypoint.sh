#!/usr/bin/env bash
# Docker entrypoint: inject Stop hook for sentinel-based wait, then launch Claude.
set -euo pipefail

# Inject a Stop hook that touches a sentinel file when Claude finishes responding.
# This lets the tester use wait-for-response.sh instead of blind sleep-polling.
mkdir -p /home/node/.claude
cat > /home/node/.claude/settings.json << 'SETTINGS'
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "touch /tmp/claude-stop-sentinel"
          }
        ]
      }
    ]
  }
}
SETTINGS

sudo init-firewall.sh
exec claude --dangerously-skip-permissions --plugin-dir /plugin --dangerously-load-development-channels plugin:markus@inline
