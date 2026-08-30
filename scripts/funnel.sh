#!/usr/bin/env bash
# Turns Tailscale Funnel on/off for the Dungeon.ai server, exposing it at a
# public https://<machine>.<tailnet>.ts.net URL that needs no Tailscale
# install on the visitor's end. See the README's Tailscale Funnel section
# for the full walkthrough (including the one-time HTTPS cert setup step
# this script doesn't do for you).
#
# Usage:
#   scripts/funnel.sh on [port]      # default 3001 (the `npm run start` port)
#   scripts/funnel.sh off
#   scripts/funnel.sh status
#
# Requires tailscale to be installed and `tailscale up` already run.
set -euo pipefail

ACTION="${1:-}"
PORT="${2:-3001}"

if ! command -v tailscale >/dev/null 2>&1; then
  echo "tailscale is not installed — see https://tailscale.com/download" >&2
  exit 1
fi

# Some setups need root for tailscaled operations, some don't (e.g. tailscale
# set --operator=$USER). Try without sudo first, only fall back if that fails.
run_tailscale() {
  if tailscale "$@" 2>/dev/null; then
    return 0
  fi
  echo "Retrying with sudo..." >&2
  sudo tailscale "$@"
}

case "$ACTION" in
  on)
    if ! (exec 3<>"/dev/tcp/localhost/${PORT}") 2>/dev/null; then
      echo "Warning: nothing seems to be listening on port ${PORT} yet." >&2
      echo "Start the server first (npm run build && npm run start), then re-run this." >&2
    fi
    echo "Enabling Tailscale Funnel on port ${PORT}..."
    run_tailscale funnel --bg "${PORT}"
    echo
    echo "Funnel is on. Share this URL with friends — no Tailscale install needed on their end:"
    tailscale funnel status
    ;;
  off)
    echo "Disabling Tailscale Funnel..."
    run_tailscale funnel reset
    echo "Funnel is off."
    ;;
  status)
    tailscale funnel status
    ;;
  *)
    echo "Usage: $0 {on|off|status} [port]" >&2
    echo "  on     - enable Funnel (default port 3001, i.e. 'npm run start')" >&2
    echo "  off    - disable Funnel" >&2
    echo "  status - show current Funnel status" >&2
    exit 1
    ;;
esac
