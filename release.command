#!/usr/bin/env bash
# Copyright (c) 2026 bachbnt

set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

run_release() {
  /bin/zsh -lic 'cd -- "$1" && shift && exec ./scripts/release.sh "$@"' \
    devcmd-release "$SCRIPT_DIR" "$@"
}

clear
printf 'DevCmd GitHub Release\n'
printf '=====================\n\n'
printf '  1) Create release\n'
printf '  2) Preview release (dry run)\n'
printf '  3) Cancel\n\n'
read -r -p 'Select [1]: ' action

case "${action:-1}" in
  1) run_release ;;
  2) run_release --dry-run ;;
  3)
    printf '\nCancelled.\n'
    exit 0
    ;;
  *)
    printf '\nUnknown selection: %s\n' "$action" >&2
    exit_code=1
    ;;
esac

exit_code=${exit_code:-$?}
printf '\n'
if [[ "$exit_code" -eq 0 ]]; then
  printf 'Finished successfully.\n'
else
  printf 'Release command failed with exit code %s.\n' "$exit_code" >&2
fi

read -r -p 'Press Enter to close this window... ' _
exit "$exit_code"
