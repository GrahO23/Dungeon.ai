#!/usr/bin/env bash
# Kill any process holding the dev server ports, then start `npm run dev` fresh.
# Pass --clean to also wipe game-state/ first (starts a brand new game).
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

if [[ "${1:-}" == "--clean" ]]; then
  echo "Clearing game-state/ (--clean passed)..."
  rm -f "${REPO_ROOT}/game-state"/*.md "${REPO_ROOT}/game-state/characters"/*.md
fi

sleep 1

cd "$REPO_ROOT"
exec npm run dev
