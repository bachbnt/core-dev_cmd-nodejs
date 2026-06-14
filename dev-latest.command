#!/usr/bin/env bash
# Copyright (c) 2026 bachbnt

set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

clear
printf 'DevCmd Latest\n'
printf '=============\n\n'
printf 'This loads the newest available DevCmd source.\n'
printf 'Unpublished local changes are linked; otherwise GitHub main is installed.\n\n'

/bin/zsh -lic 'cd -- "$1" && shift && exec ./scripts/install-latest.sh "$@"' \
  devcmd-latest "$SCRIPT_DIR" "$@"
exit_code=$?

printf '\n'
if [[ "$exit_code" -eq 0 ]]; then
  printf 'Finished successfully.\n'
else
  printf 'DevCmd installation failed with exit code %s.\n' "$exit_code" >&2
fi

read -r -p 'Press Enter to close this window... ' _
exit "$exit_code"
