#!/usr/bin/env bash
# Copyright (c) 2026 bachbnt

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
PACKAGE_URL="https://github.com/bachbnt/dev-cmd/archive/refs/heads/main.tar.gz"
DRY_RUN=false
MODE="auto"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true ;;
    --local) MODE="local" ;;
    --github) MODE="github" ;;
    *)
      printf 'Usage: %s [--dry-run] [--local|--github]\n' "$0" >&2
      exit 1
      ;;
  esac
  shift
done

if ! command -v node >/dev/null 2>&1; then
  printf 'Error: Node.js is not available in PATH.\n' >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  printf 'Error: npm is not available in PATH.\n' >&2
  exit 1
fi

printf 'DevCmd latest installer\n'

if [[ "$MODE" == "auto" ]]; then
  MODE="github"
  if command -v git >/dev/null 2>&1 && git -C "$PROJECT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if [[ -n "$(git -C "$PROJECT_DIR" status --porcelain)" ]]; then
      MODE="local"
    else
      UPSTREAM="$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"
      if [[ -z "$UPSTREAM" ]] || [[ "$(git -C "$PROJECT_DIR" rev-list --count "$UPSTREAM..HEAD")" != "0" ]]; then
        MODE="local"
      fi
    fi
  fi
fi

if [[ "$MODE" == "local" ]]; then
  printf 'Source: local checkout %s\n\n' "$PROJECT_DIR"
else
  printf 'Source: %s\n\n' "$PACKAGE_URL"
fi

if [[ "$DRY_RUN" == true ]]; then
  if [[ "$MODE" == "local" ]]; then
    printf 'Would run: %s/scripts/setup-dev.sh\n' "$PROJECT_DIR"
  else
    printf 'Would run: npm install --global %s\n' "$PACKAGE_URL"
  fi
  printf 'No package was installed.\n'
  exit 0
fi

if [[ "$MODE" == "local" ]]; then
  printf 'Loading the current local DevCmd source...\n'
  "$PROJECT_DIR/scripts/setup-dev.sh"
else
  printf 'Installing the latest committed DevCmd source from GitHub...\n'
  npm install --global "$PACKAGE_URL"
fi
hash -r

DEV_BIN="$(command -v dev || true)"
if [[ -z "$DEV_BIN" ]]; then
  printf 'Error: installation completed, but dev is not available in PATH.\n' >&2
  printf 'Active npm prefix: %s\n' "$(npm prefix -g)" >&2
  exit 1
fi

printf '\nDevCmd latest is ready.\n'
printf 'Command: %s\n\n' "$DEV_BIN"
dev help
if ! dev doctor; then
  printf '\nDevCmd was installed, but dev doctor reported missing required tools.\n' >&2
fi
