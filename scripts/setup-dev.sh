#!/usr/bin/env bash
# Copyright (c) 2026 bachbnt

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

if ! command -v node >/dev/null 2>&1; then
  printf 'Error: Node.js is not available in PATH.\n' >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  printf 'Error: npm is not available in PATH.\n' >&2
  exit 1
fi

cd "$PROJECT_DIR"
chmod +x dev

if [[ ! -d node_modules ]]; then
  printf 'Installing dependencies...\n'
  npm install
fi

printf 'Linking DevCmd to the active Node.js installation...\n'
npm link

DEV_BIN="$(command -v dev || true)"
if [[ -z "$DEV_BIN" ]]; then
  printf 'Error: npm linked DevCmd, but dev is not available in PATH.\n' >&2
  printf 'Active npm prefix: %s\n' "$(npm prefix -g)" >&2
  exit 1
fi

printf '\nDevCmd is ready.\n'
printf 'Command: %s\n' "$DEV_BIN"
printf 'Source:  %s\n' "$PROJECT_DIR"
printf 'Version: '
dev help | sed -n '2p' | sed -E 's/^[[:space:]]+//'
printf '\nFuture source updates are loaded automatically; no source command is needed.\n'
