#!/usr/bin/env bash
# Copyright (c) 2026 bachbnt

set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

clear
printf 'DevCmd Install Remote\n'
printf '=====================\n\n'
printf 'This installs DevCmd from the remote GitHub source.\n\n'

/bin/zsh -lic 'cd -- "$1" && shift && exec ./scripts/install-remote.sh "$@"' \
  devcmd-remote "$PROJECT_DIR" "$@"
exit_code=$?

printf '\n'
if [[ "$exit_code" -eq 0 ]]; then
  printf 'Finished successfully.\n'
else
  printf 'DevCmd installation failed with exit code %s.\n' "$exit_code" >&2
fi

read -r -p 'Press Enter to close this window... ' _
exit "$exit_code"
