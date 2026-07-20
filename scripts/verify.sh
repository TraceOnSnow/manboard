#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON="$ROOT/core/.venv/bin/python"

if [[ ! -x "$PYTHON" ]]; then
  printf 'Missing Python environment: %s\n' "$PYTHON" >&2
  printf 'Create it with: cd core && python -m venv .venv && .venv/bin/pip install -r requirements.txt\n' >&2
  exit 1
fi

"$PYTHON" -m pytest "$ROOT/core/tests" -q
npm --prefix "$ROOT/dashboard" test
npm --prefix "$ROOT/dashboard" run build
node --check "$ROOT/scripts/start-dashboard.mjs"
node --check "$ROOT/scripts/start-manboard.mjs"
git -C "$ROOT" diff --check
