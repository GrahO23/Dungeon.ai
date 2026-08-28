#!/usr/bin/env bash
# Kill any process holding the dev server ports, then start `npm run dev` fresh.
set -euo pipefail

PORTS=(3001 5173)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for port in "${PORTS[@]}"; do
  pids=$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Killing process(es) on port ${port}: ${pids}"
    kill -9 $pids 2>/dev/null || true
  fi
done

sleep 1

cd "$REPO_ROOT"
exec npm run dev
