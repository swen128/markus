#!/usr/bin/env bash
# Wait for Claude to finish responding by watching a sentinel file.
# Usage: wait-for-response.sh <sentinel-path> [timeout-seconds]
SENTINEL="${1:?usage: wait-for-response.sh <sentinel-path> [timeout]}"
TIMEOUT="${2:-120}"
rm -f "$SENTINEL"
deadline=$((SECONDS + TIMEOUT))
while [ ! -f "$SENTINEL" ] && [ $SECONDS -lt $deadline ]; do
  sleep 0.5
done
[ -f "$SENTINEL" ] && rm -f "$SENTINEL"
