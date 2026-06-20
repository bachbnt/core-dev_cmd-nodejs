#!/usr/bin/env bash
# Copyright (c) 2026 bachbnt

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
PACKAGE_URL="https://github.com/bachbnt/dev-cmd/archive/refs/heads/main.tar.gz"
REQUIRED_NODE_VERSION="24.13.0"
DRY_RUN=false
MODE="auto"

check_node_version() {
  node - "$REQUIRED_NODE_VERSION" <<'NODE'
const required = process.argv[2].split('.').map(Number);
const current = process.versions.node.split('.').map(Number);
for (let index = 0; index < 3; index += 1) {
  const currentPart = current[index] || 0;
  const requiredPart = required[index] || 0;
  if (currentPart > requiredPart) process.exit(0);
  if (currentPart < requiredPart) process.exit(1);
}
NODE
}

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
if ! check_node_version; then
  printf 'Error: DevCmd requires Node.js %s or newer. Current Node.js: %s\n' "$REQUIRED_NODE_VERSION" "$(node -p 'process.version')" >&2
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
  "$PROJECT_DIR/scripts/install-local.sh"
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
